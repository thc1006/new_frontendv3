from flask import request, jsonify, Blueprint
import requests
import time
from enums.HeatmapState import HeatmapState 
from models.Project import Project
from models.Evaluation import Evaluation
from controllers.minIO import get_usd_data
from models import db
import base64
from utils.AODT_utils import transform_direction, latlon_to_xy_cm,AODTApiClient,AODT_API_BASE_URL
from tasks.tasks import start_aodt_workflow,  aodt_workflow_throughput

# minIO
from utils.minIOName import MinIOName


aodt_bp = Blueprint('aodt', __name__)

# 創建 AODT API 客戶端實例
aodt_client = AODTApiClient()

# Flask 路由端點
# ===============================================
@aodt_bp.route('/aodt/delete-file', methods=['POST'])
def delete_aodt_file():
    """刪除 AODT 文件"""
    try:
        data = request.get_json()
        if not data or 'file_name' not in data:
            return jsonify({
                'success': False,
                'message': '缺少 file_name'
            }), 400

        directory_path = 'omniverse://omniverse-server/Users/aerial/osm/' + data['file_name']
        result = aodt_client.delete_file(directory_path)

        if result.get('success'):
            return jsonify({
                'success': True,
                'message': f'成功刪除文件: {directory_path}',
                'data': result
            }), 200
        else:
            return jsonify({
                'success': False,
                'message': result.get('error_message', '文件刪除失敗')
            }), 400

    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'文件刪除錯誤: {str(e)}'
        }), 500

@aodt_bp.route('/aodt/create-files', methods=['POST'])
def create_aodt_files():
    try:
        data = request.get_json()
        project_id = data.get('project_id')

        if not project_id:
            return jsonify({
                'success': False,
                'message': '缺少 project_id'
            }), 400

        project = Project.query.get(project_id)
        if not project:
            return jsonify({
                'success': False,
                'message': '無效的 project_id'
            }), 400

        minIOName = MinIOName.aodt_map(project_id)

        file_path = f'omniverse://omniverse-server/Users/aerial/osm/{minIOName}'

        minIOResult = get_usd_data('mapaodt', minIOName)

        if not minIOResult.get('success'):
            return jsonify({
                'success': False,
                'message': minIOResult.get('error', '無法獲取 USD 數據')
            }), 400
        
        usd_data = minIOResult.get('data')
        usd_data_b64 = base64.b64encode(usd_data).decode('ascii')

        result = aodt_client.create_files(file_path, usd_data_b64)

        if result.get('success'):
            return jsonify({
                'success': True,
                'message': f'成功創建文件: {file_path}'
            }), 200
        else:
            return jsonify({
                'success': False,
                'message': result.get('error_message', '文件創建失敗')
            }), 400
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'文件創建錯誤: {str(e)}'
        }), 500

@aodt_bp.route('/aodt/connect', methods=['POST'])
def connect_to_aodt():
    """連接到 AODT 資料庫和 attach worker"""
    try:
        data = request.get_json() or {}
        project_id = data.get('project_id')
        evaluation_id = data.get('evaluation_id')
        project = Project.query.get(project_id)
        evaluation = Evaluation.query.get(evaluation_id)

        if not project or not evaluation:
            return jsonify({
                'success': False,
                'message': '無效的 project_id 或 evaluation_id'
            }), 400
        
        db_host = data.get('db_host', 'clickhouse')
        db_port = data.get('db_port', 9000)
        db_name = f'project_{project_id}_{evaluation_id}'
        
        result = aodt_client.auto_connect(db_host, db_port, db_name, project_id)
        
        if result.get('success'):
            return jsonify({
                'success': True,
                'message': 'AODT 資料庫連接成功',
                'data': result
            }), 200
        else:
            return jsonify({
                'success': False,
                'message': result.get('error_message', 'AODT 連接失敗')
            }), 400
            
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'AODT 連接錯誤: {str(e)}'
        }), 500

@aodt_bp.route('/aodt/open-stage', methods=['POST'])
def open_aodt_stage():
    """開啟 AODT USD Stage"""
    try:
        data = request.get_json()
        if not data or 'file_name' not in data:
            return jsonify({
                'success': False,
                'message': '缺少 file_name'
            }), 400

        result = aodt_client.open_usd_stage(data['file_name'])
        
        if result.get('success'):
            return jsonify({
                'success': True,
                'message': f'成功開啟 USD Stage: {data["file_name"]}',
                'data': result
            }), 200
        else:
            return jsonify({
                'success': False,
                'message': result.get('error_message', 'USD Stage 開啟失敗')
            }), 400
            
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'USD Stage 開啟錯誤: {str(e)}'
        }), 500

@aodt_bp.route('/aodt/simulation-config', methods=['POST'])
def set_aodt_simulation_config():
    """設定 AODT 模擬配置"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({
                'success': False,
                'message': '缺少請求參數'
            }), 400
        
        # 必要參數驗證
        if 'is_full' not in data or 'mode' not in data:
            return jsonify({
                'success': False,
                'message': '缺少必要參數: is_full, mode'
            }), 400
        
        result = aodt_client.set_simulation_config(
            simulation_mode='rsrp',
            is_full=data['is_full'],
            mode=data['mode'],
            duration=data.get('duration'),
            interval=data.get('interval'),
            slots_per_batch=data.get('slots_per_batch'),
            samples_per_slot=data.get('samples_per_slot')
        )
        
        if result.get('success'):
            return jsonify({
                'success': True,
                'message': '模擬配置設定成功',
                'data': result
            }), 200
        else:
            return jsonify({
                'success': False,
                'message': result.get('error', '模擬配置設定失敗')
            }), 400
            
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'模擬配置設定錯誤: {str(e)}'
        }), 500

@aodt_bp.route('/aodt/ru/create', methods=['POST'])
def create_ru():
    """創建 RU"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({
                'success': False,
                'message': '缺少請求參數'
            }), 400
        
        # 驗證必要參數
        project_id = data.get('project_id')
        project = Project.query.get(project_id)

        if not project:
            return jsonify({
                'success': False,
                'message': '無效的 project ID'
            }), 400

        required_params = ['lat', 'lon', 'z']
        for param in required_params:
            if param not in data:
                return jsonify({
                    'success': False,
                    'message': f'缺少必要參數: {param}'
                }), 400
        project_lat = project.lat
        project_lon = project.lon
        rotation_offset = project.rotation_offset
        lat = data.get('lat')
        lon = data.get('lon')
        height = data.get('z', 0)  # 默認高度為 0
        x, y, z = latlon_to_xy_cm(lon, lat, height, project_lon, project_lat)

        result = aodt_client.create_ru(
            x=x,
            y=y,
            z=z,
            ru_roll=transform_direction(data['ru_roll'], rotation_offset)
        )
        
        if result.get('success'):
            return jsonify({
                'success': True,
                'message': f'成功創建 RU 在位置 ({x}, {y}, {z})',
                'data': result
            }), 200
        else:
            return jsonify({
                'success': False,
                'message': result.get('error_message', 'RU 創建失敗')
            }), 400
            
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'創建 RU 錯誤: {str(e)}'
        }), 500

@aodt_bp.route('/aodt/du/create', methods=['POST'])
def create_du():
    """創建 DU"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({
                'success': False,
                'message': '缺少請求參數'
            }), 400
        
        project_id = data.get('project_id')
        project = Project.query.get(project_id)

        if not project:
            return jsonify({
                'success': False,
                'message': '無效的 project ID'
            }), 400
        # 驗證必要參數
        required_params = ['lat', 'lon', 'z']
        for param in required_params:
            if param not in data:
                return jsonify({
                    'success': False,
                    'message': f'缺少必要參數: {param}'
                }), 400
        
        project_lat = project.lat
        project_lon = project.lon
        lat = data.get('lat')
        lon = data.get('lon')
        height = data.get('z', 0)

        x, y, z = latlon_to_xy_cm(lon, lat, height, project_lon, project_lat)

        result = aodt_client.create_du(
            x=x,
            y=y,
            z=z
        )
        
        if result.get('success'):
            return jsonify({
                'success': True,
                'message': f'成功創建 DU 在位置 ({data["x"]}, {data["y"]}, {data["z"]})',
                'data': result
            }), 200
        else:
            return jsonify({
                'success': False,
                'message': result.get('error_message', 'DU 創建失敗')
            }), 400
            
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'創建 DU 錯誤: {str(e)}'
        }), 500

@aodt_bp.route('/aodt/ru/set-direction', methods=['POST'])
def set_ru_direction():
    """設定 RU 方向"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({
                'success': False,
                'message': '缺少請求參數'
            }), 400
        
        project_id = data.get('project_id')
        evaluation_id = data.get('evaluation_id')
        project = Project.query.get(project_id)
        evaluation = Evaluation.query.get(evaluation_id)

        if not project or not evaluation:
            return jsonify({
                'success': False,
                'message': '無效的 project_id 或 evaluation_id'
            }), 400

        # 驗證必要參數
        required_params = ['lat', 'lon', 'z', 'ru_roll']
        for param in required_params:
            if param not in data:
                return jsonify({
                    'success': False,
                    'message': f'缺少必要參數: {param}'
                }), 400
        
        project_lat = project.lat
        project_lon = project.lon
        rotation_offset = project.rotation_offset
        lat = data.get('lat')
        lon = data.get('lon')
        height = data.get('z')

        x, y, z = latlon_to_xy_cm(lon, lat, height, project_lon, project_lat)

        result = aodt_client.set_ru_direction(
            x=x,
            y=y,
            z=z,
            ru_roll=transform_direction(data['ru_roll'], rotation_offset)
        )
        
        if result.get('success'):
            return jsonify({
                'success': True,
                'message': f'成功設定 RU 方向，roll角度: {data["ru_roll"]}',
                'data': result
            }), 200
        else:
            return jsonify({
                'success': False,
                'message': result.get('error_message', 'RU 方向設定失敗')
            }), 400
            
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'設定 RU 方向錯誤: {str(e)}'
        }), 500

@aodt_bp.route('/aodt/ru/delete-all', methods=['DELETE'])
def delete_all_rus():
    """刪除所有 RU"""
    try:
        result = aodt_client.delete_all_rus()
        
        if result.get('success'):
            return jsonify({
                'success': True,
                'message': '成功刪除所有 RU',
                'data': result
            }), 200
        elif result.get('error_message', '').startswith('Deletion failed: No RUs available'):
            return jsonify({
                'success': True,
                'message': '沒有 RU 可以刪除',
                'data': result
            }), 200
        else:
            return jsonify({
                'success': False,
                'message': result.get('error_message', '刪除 RU 失敗')
            }), 400
            
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'刪除所有 RU 錯誤: {str(e)}'
        }), 500

@aodt_bp.route('/aodt/du/delete-all', methods=['DELETE'])
def delete_all_dus():
    """刪除所有 DU"""
    try:
        result = aodt_client.delete_all_dus()
        
        if result.get('success'):
            return jsonify({
                'success': True,
                'message': '成功刪除所有 DU',
                'data': result
            }), 200
        elif result.get('error_message', '').startswith('Deletion failed: No DUs available'):
            return jsonify({
                'success': True,
                'message': '沒有 DU 可以刪除',
                'data': result
            }), 200
        else:
            return jsonify({
                'success': False,
                'message': result.get('error_message', '刪除 DU 失敗')
            }), 400
            
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'刪除所有 DU 錯誤: {str(e)}'
        }), 500

@aodt_bp.route('/aodt/du/auto-assign', methods=['POST'])
def auto_assign_du():
    """自動分配 DU 給所有 RU"""
    try:
        result = aodt_client.auto_assign_du()
        
        if result.get('success'):
            return jsonify({
                'success': True,
                'message': '成功自動分配 DU 給所有 RU',
                'data': result
            }), 200
        else:
            return jsonify({
                'success': False,
                'message': result.get('error_message', '自動分配 DU 失敗')
            }), 400
            
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'自動分配 DU 錯誤: {str(e)}'
        }), 500
    

@aodt_bp.route('/aodt/status', methods=['GET'])
def get_aodt_status():
    """取得 AODT 服務狀態"""
    try:
        # 嘗試連接到 AODT API 檢查狀態
        response = requests.get(f"{AODT_API_BASE_URL}/docs", timeout=5)
        if response.status_code == 200:
            return jsonify({
                'success': True,
                'message': 'AODT 服務運行正常',
                'status': 'connected',
                'api_url': AODT_API_BASE_URL
            }), 200
        else:
            return jsonify({
                'success': False,
                'message': 'AODT 服務連接異常',
                'status': 'disconnected'
            }), 503
            
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'AODT 服務不可用: {str(e)}',
            'status': 'error'
        }), 503

@aodt_bp.route('/aodt/test-api-endpoints', methods=['GET'])
def test_api_endpoints():
    """測試 AODT API 端點可用性"""
    try:
        endpoints_to_test = [
            '/update_ru_properties',
            '/get_ru_properties',
            '/docs',
            '/openapi.json'
        ]
        
        results = {}
        for endpoint in endpoints_to_test:
            result = aodt_client.test_api_endpoint(endpoint)
            results[endpoint] = result
        
        return jsonify({
            'success': True,
            'message': 'API 端點測試完成',
            'results': results
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'API 端點測試錯誤: {str(e)}'
        }), 500

@aodt_bp.route('/aodt/ru/create-batch', methods=['POST'])
def create_rus_batch():
    """批量創建 RU"""
    try:
        data = request.get_json()
        if not data or 'rus' not in data:
            return jsonify({
                'success': False,
                'message': '缺少 rus 陣列參數'
            }), 400
        
        project_id = data.get('project_id')
        evaluation_id = data.get('evaluation_id')

        project = Project.query.get(project_id)
        evaluation = Evaluation.query.get(evaluation_id)

        if not project or not evaluation:
            return jsonify({
                'success': False,
                'message': '無效的 project_id 或 evaluation_id'
            }), 400

        project_lat = project.lat
        project_lon = project.lon
        rotation_offset = project.rotation_offset

        rus = data['rus']
        if not isinstance(rus, list):
            return jsonify({
                'success': False,
                'message': 'rus 必須是陣列'
            }), 400
        
        results = []
        success_count = 0
        error_count = 0
        
        for i, ru_data in enumerate(rus):
            try:
                # 驗證必要參數
                required_params = ['lat', 'lon', 'z']
                for param in required_params:
                    if param not in ru_data:
                        results.append({
                            'index': i,
                            'success': False,
                            'message': f'RU {i}: 缺少必要參數 {param}'
                        })
                        error_count += 1
                        continue

                lon = ru_data.get('lon', 0)
                lat = ru_data.get('lat', 0)
                height = ru_data.get('z', 0)

                x, y, z = latlon_to_xy_cm(lon, lat, height, project_lon, project_lat)

                result = aodt_client.create_ru(
                    x=x,
                    y=y,
                    z=z,
                    ru_roll=transform_direction(ru_data.get('ru_roll', 0.0), rotation_offset)
                )
                
                if result.get('success'):
                    results.append({
                        'index': i,
                        'success': True,
                        'message': f'RU {i} 創建成功',
                        'position': (x, y, z)
                    })
                    success_count += 1
                else:
                    results.append({
                        'index': i,
                        'success': False,
                        'message': f'RU {i} 創建失敗: {result.get("error_message", "未知錯誤")}'
                    })
                    error_count += 1
                    
            except Exception as e:
                results.append({
                    'index': i,
                    'success': False,
                    'message': f'RU {i} 創建異常: {str(e)}'
                })
                error_count += 1
        
        return jsonify({
            'success': error_count == 0,
            'message': f'批量創建完成: {success_count} 成功, {error_count} 失敗',
            'summary': {
                'total': len(rus),
                'success_count': success_count,
                'error_count': error_count
            },
            'results': results
        }), 200 if error_count == 0 else 207  # 207 Multi-Status
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'批量創建 RU 錯誤: {str(e)}'
        }), 500

@aodt_bp.route('/aodt/du/create-batch', methods=['POST'])
def create_dus_batch():
    """批量創建 DU"""
    try:
        data = request.get_json()
        if not data or 'dus' not in data:
            return jsonify({
                'success': False,
                'message': '缺少 dus 陣列參數'
            }), 400

        project_id = data.get('project_id')
        project = Project.query.get(project_id)
        evaluation_id = data.get('evaluation_id')
        evaluation = Evaluation.query.get(evaluation_id)

        if not project or not evaluation:
            return jsonify({
                'success': False,
                'message': '無效的 project_id 或 evaluation_id'
            }), 400

        project_lat = project.lat
        project_lon = project.lon

        dus = data['dus']
        if not isinstance(dus, list):
            return jsonify({
                'success': False,
                'message': 'dus 必須是陣列'
            }), 400
        results = []
        success_count = 0
        error_count = 0
        for i, du_data in enumerate(dus):
            try:
                # 驗證必要參數
                required_params = ['lat', 'lon', 'z']
                for param in required_params:
                    if param not in du_data:
                        results.append({
                            'index': i,
                            'success': False,
                            'message': f'DU {i}: 缺少必要參數 {param}'
                        })
                        error_count += 1
                        continue

                lat = du_data['lat']
                lon = du_data['lon']
                z = du_data['z']

                x, y, z = latlon_to_xy_cm(lon, lat, z, project_lon, project_lat)
                
                result = aodt_client.create_du(
                    x=x,
                    y=y,
                    z=z
                )
                if result.get('success'):
                    results.append({
                        'index': i,
                        'success': True,
                        'message': f'DU {i} 創建成功',
                        'position': (du_data['x'], du_data['y'], du_data['z'])
                    })
                    success_count += 1  
                else:
                    results.append({
                        'index': i,
                        'success': False,
                        'message': f'DU {i} 創建失敗: {result.get("error_message", "未知錯誤")}'
                    })
                    error_count += 1
            except Exception as e:
                results.append({
                    'index': i,
                    'success': False,
                    'message': f'DU {i} 創建異常: {str(e)}'
                })
                error_count += 1
        return jsonify({
            'success': error_count == 0,
            'message': f'批量創建完成: {success_count} 成功, {error_count} 失敗',
            'summary': {
                'total': len(dus),
                'success_count': success_count,
                'error_count': error_count
            },
            'results': results
        }), 200 if error_count == 0 else 207
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'批量創建 DU 錯誤: {str(e)}'
        }), 500

@aodt_bp.route('/aodt/ues/create-direct', methods=['POST'])
def create_direct_ues():
    """在指定位置範圍內隨機部署 UE"""
    try:
        data = request.get_json()
        if not data or 'ue_x' not in data or 'ue_y' not in data or 'ue_radius' not in data or 'ue_cnt' not in data:
            return jsonify({
                'success': False,
                'message': '缺少必要參數: ue_x, ue_y, ue_radius, ue_cnt'
            }), 400
        
        result = aodt_client.create_direct_ues(
            x=data['ue_x'],
            y=data['ue_y'],
            radius_cm=data['ue_radius'],
            count=data['ue_cnt']
        )
        
        if result.get('success'):
            return jsonify({
                'success': True,
                'message': f'成功在 ({data["ue_x"]}, {data["ue_y"]}) 範圍內創建 {data["ue_cnt"]} 個 UE',
                'data': result
            }), 200
        else:
            return jsonify({
                'success': False,
                'message': result.get('error_message', 'UE 創建失敗')
            }), 400
            
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'創建 UE 錯誤: {str(e)}'
        }), 500

@aodt_bp.route('/aodt/generate-ue-mobility', methods=['GET'])
def generate_ue_mobility():
    """生成 UE 移動性"""
    try:
        result = aodt_client.on_Generate_UE_mobility()
        
        if result.get('success'):
            return jsonify({
                'success': True,
                'message': '成功生成 UE 移動性',
                'data': result
            }), 200
        else:
            return jsonify({
                'success': False,
                'message': result.get('error_message', '生成 UE 移動性失敗')
            }), 400
            
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'生成 UE 移動性錯誤: {str(e)}'
        }), 500
    
@aodt_bp.route('/aodt/start-simulation', methods=['POST'])
def start_simulation():
    """啟動 AODT 模擬"""
    try:
        project_id = request.json.get('project_id')
        evaluation_id = request.json.get('evaluation_id')

        try:
            callbackURL_response = requests.get("http://host.docker.internal:4040/api/tunnels")
            callbackURL_data = callbackURL_response.json()
            callbackURL_tunnel = callbackURL_data.get('tunnels', [])
            callbackURL = callbackURL_tunnel[0]['public_url'] if callbackURL_tunnel else None

        except Exception:
            callbackURL = "http://203.77.62.110:8000"

        result = aodt_client.start_simulation(project_id=project_id, evaluation_id=evaluation_id, sim_mode='RSRP', callbackURL=callbackURL)

        if result.get('success'):
            return jsonify({
                'success': True,
                'message': '模擬啟動成功',
                'data': result
            }), 200
        else:
            return jsonify({
                'success': False,
                'message': result.get('error_message', '模擬啟動失敗')
            }), 400
            
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'模擬啟動錯誤: {str(e)}'
        }), 500

@aodt_bp.route('/aodt/simulation_progress', methods=['GET'])
def check_simulation_progress():
    """檢查模擬進度"""
    return aodt_client.get_simulation_progress()

@aodt_bp.route('/aodt/workflow/is_sim_running', methods=['GET'])
def check_if_sim_running():
    """檢查是否正在跑模擬"""
    return aodt_client.is_sim_running()


@aodt_bp.route('/aodt/panel/create', methods=['POST'])
def create_panel():
    """創建 Panel"""
    try:
        result = aodt_client.create_panel(["isotropic"])
        
        if result.get('success'):
            return jsonify({
                'success': True,
                'message': '成功創建 Panel',
                'data': {
                    'panel_path': result.get('panel_path'),
                    'panel_name': result.get('panel_name')
                }
            }), 200
        else:
            return jsonify({
                'success': False,
                'message': result.get('error', 'Panel 創建失敗')
            }), 400
            
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'創建 Panel 錯誤: {str(e)}'
        }), 500

@aodt_bp.route('/aodt/panel/create-batch', methods=['POST'])
def create_panels_batch():
    """批量創建 Panel"""
    try:
        data = request.get_json()
        if not data or 'count' not in data:
            return jsonify({
                'success': False,
                'message': '缺少 count 參數'
            }), 400
        
        count = data['count']
        if not isinstance(count, int) or count <= 0:
            return jsonify({
                'success': False,
                'message': 'count 必須是正整數'
            }), 400
        
        if count > 50:  # 限制最大數量
            return jsonify({
                'success': False,
                'message': '一次最多創建 50 個 Panel'
            }), 400
        
        result = aodt_client.create_panels_batch(count)
        
        return jsonify({
            'success': result.get('success'),
            'message': result.get('message'),
            'summary': result.get('summary'),
            'results': result.get('results')
        }), 200 if result.get('success') else 207  # 207 Multi-Status
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'批量創建 Panel 錯誤: {str(e)}'
        }), 500

@aodt_bp.route('/aodt/panel/check-config', methods=['GET'])
def check_panel_config():
    """檢查 Panel 配置"""
    try:
        result = aodt_client.check_panel_config()
        
        return jsonify({
            'success': True,
            'message': 'Panel 配置檢查完成',
            'data': {
                'panel_asset_path_configured': result.get('panel_asset_path_configured', False),
                'panel_asset_path': result.get('panel_asset_path', 'Not configured')
            }
        }), 200
            
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'檢查 Panel 配置錯誤: {str(e)}'
        }), 500

@aodt_bp.route('/aodt/panel/count', methods=['GET'])
def get_panel_count():
    """取得當前場景中 Panel 的數量"""
    try:
        result = aodt_client.get_panel_count()
        
        if result.get('success'):
            return jsonify({
                'success': True,
                'message': '成功取得 Panel 數量',
                'data': {
                    'panel_count': result.get('panel_count', 0)
                }
            }), 200
        else:
            return jsonify({
                'success': False,
                'message': result.get('error', '取得 Panel 數量失敗')
            }), 400
            
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'取得 Panel 數量錯誤: {str(e)}'
        }), 500

@aodt_bp.route('/aodt/workflow/start', methods=['POST'])
def enqueue_aodt_task():
    data = request.get_json() or {}
    if 'project_id' not in data:
        return jsonify({'success': False, 'message': '沒有提供project_id'}),400
    if 'evaluation_id' not in data:
        return jsonify({'success': False, 'message': '沒有提供evalueation id'}),400
    if 'rsrp_config' not in data or not data['rsrp_config']:
        return jsonify({'success': False, 'message': '沒有提供rsrp_config'}),400
    if 'rus' not in data or not isinstance(data['rus'], list) or not len(data['rus']) > 0:
        return jsonify({'success': False, 'message': '沒有提供rus或是格式不符'}),400
    if 'ue_start_end_pt' not in data or not data.get('ue_start_end_pt'):
        return jsonify({'success': False, 'message': '沒有提供ue軌跡起訖點'}),400
    #push tasks into queue
    try:
        ue_start = data['ue_start_end_pt'][0]
        ue_end = data['ue_start_end_pt'][1]
        aodt_task = start_aodt_workflow.apply_async((data, [ue_start, ue_end]))
        evaluation_id = data.get('evaluation_id', 0)
        evaluation = Evaluation.query.get(evaluation_id)
        evaluation.rsrp_status = HeatmapState.WAITING
        db.session.commit()

        return jsonify({
            'success': True,
            'message': f'已經將計算任務{aodt_task.id}放入對列中',
            'task_id': aodt_task.id
        }),202
    except Exception as e:
        evaluation.rsrp_status = HeatmapState.FAILURE
        db.session.commit()
        return jsonify({
            'success': False,
            'message': '無法將計算任務放入對列中',
            'deatail': str(e)
        }),500



@aodt_bp.route('/aodt/workflow/throughput', methods=['POST'])
def enqueue_aodt_throughput():
    data = request.get_json() or {}
    if 'project_id' not in data:
        return jsonify({'success': False, 'message': '沒有提供project_id'}),400
    if 'evaluation_id' not in data:
        return jsonify({'success': False, 'message': '沒有提供evalueation id'}),400
    if 'throughput_config' not in data or not data['throughput_config']:
        return jsonify({'success': False, 'message': '沒有提供throughput_config'}),400
    if 'rus' not in data or not isinstance(data['rus'], list) or not len(data['rus']) > 0:
        return jsonify({'success': False, 'message': '沒有提供rus或是格式不符'}),400
    if 'ue_start_end_pt' not in data or not data.get('ue_start_end_pt'):
        return jsonify({'success': False, 'message': '沒有提供ue軌跡起訖點'}),400
    try:     
        #put task into queue
        ue_start = data['ue_start_end_pt'][0]
        ue_end = data['ue_start_end_pt'][1]
        task = aodt_workflow_throughput.apply_async((data, [ue_start, ue_end]))
        #update evaluation state
        evaluation_id = data.get('evaluation_id', 0)
        evaluation = Evaluation.query.get(evaluation_id)
        evaluation.throughput_status = HeatmapState.WAITING
        db.session.commit()
        return jsonify({
            'success': True,
            'message': f'已經將計算任務{task.id}放入對列中',
            'task_id': task.id
        }),202
    except Exception as e:
        evaluation.throughput_status = HeatmapState.FAILURE
        db.session.commit()
        return jsonify({
            'success': False,
            'message': '無法將計算任務放入對列中',
            'deatail': str(e)
        }),500

#取得AODT運算結果
@aodt_bp.route('/aodt/workflow/result/<string:task_id>',methods=['GET'])
def aodt_workflow_response(task_id):
    from queues import exe_queue
    result = exe_queue.AsyncResult(task_id)
    if not result.ready():
        return {'status': result.status},404
    status_code = result.result['status_code']
    return_dict = result.result
    del return_dict['status_code']
    return jsonify(return_dict),status_code
    
def start_throughput_workflow(project_id, evaluation_id, callbackURL, data, rus):  # noqa: MC0001
    # throughput 模式的 heatmap 處理

    evaluation = Evaluation.query.get(evaluation_id)
    # if (not evaluation) and (project_id != 0 or evaluation_id != 0):
    #     return False

    # while (evaluation.throughput_status == HeatmapState.WAITING):
    #     time.sleep(1)
    
    if 'throughput_config' in data and data['throughput_config']:
        # return True
        try:
            # return True
            throughput_config = data['throughput_config']
            # 驗證必要參數
            # return True
            if 'is_full' not in throughput_config or 'mode' not in throughput_config:
                return False
            throughput_config['simulation_mode'] = 'throughput'
            evaluation.throughput_status = HeatmapState.WAITING
            db.session.commit()

            # 設定 throughput 模式的模擬配置
            throughput_config['simulation_mode'] = 'throughput'
            config_result = aodt_client.set_simulation_config(**throughput_config)
            if not config_result.get('success'):
                return False

            # 步驟 12: 刪除所有 rus 和 dus
            delete_rus_result = aodt_client.delete_all_rus()
            delete_dus_result = aodt_client.delete_all_dus()
            if not delete_rus_result.get('success') or not delete_dus_result.get('success'):
                return False
            #  步驟 13: 放置 rus 和 dus
            create_rus_result = aodt_client.create_rus_batch(rus)
            auto_assign_result = aodt_client.auto_assign_du()
            if not create_rus_result.get('success') or not auto_assign_result.get('success'):
                return False
            # 步驟 14: generate ue mobility
            generate_ue_mobility = aodt_client.on_Generate_UE_mobility()
            if not generate_ue_mobility.get('success'):
                return False

            time.sleep(3)

            # 步驟 15: 開始 throughput 模式模擬
            
            start_result = aodt_client.start_simulation(
                project_id=project_id,
                evaluation_id=evaluation_id,
                sim_mode='throughput',
                callbackURL=callbackURL
            )

            if not start_result.get('success'):
                return False

        except Exception:
            return False

        return True

    else:
        return False

@aodt_bp.route('/aodt/restart', methods=['POST'])
def restart_aodt():
    """重新啟動 AODT 服務"""
    result = aodt_client.restart_aodt()
    if result.get("status") == "success":
        return jsonify({"message": "AODT 服務已重新啟動"}), 200
    return jsonify({"message": "重新啟動 AODT 服務失敗", "error": result.get("error")}), 500

@aodt_bp.route('/aodt/ru/update-properties', methods=['POST'])
def update_ru_properties():
    """更新 RU 屬性 - 支援高度、機械方位角和機械傾斜角"""
    try:
        data = request.get_json()
        
        # 驗證必要參數
        if not data:
            return jsonify({
                'success': False,
                'message': '請提供請求資料'
            }), 400
        
        ru_path = data.get('ru_path')
        if not ru_path:
            return jsonify({
                'success': False,
                'message': '缺少必要參數: ru_path'
            }), 400
        
        # 獲取可選參數
        height = data.get('height')
        mech_azimuth = data.get('mech_azimuth')
        mech_tilt = data.get('mech_tilt')
        
        # 檢查是否至少提供了一個要更新的屬性
        if height is None and mech_azimuth is None and mech_tilt is None:
            return jsonify({
                'success': False,
                'message': '至少需要提供一個要更新的屬性 (height, mech_azimuth, mech_tilt)'
            }), 400
        
        # 參數驗證 - 根據 AODT PropertyMetadata 限制
        if height is not None and (not isinstance(height, (int, float)) or not (0.5 <= height <= 100.0)):
            return jsonify({
                'success': False,
                'message': 'height 必須在 0.5-100.0 米範圍內'
            }), 400
        
        if mech_azimuth is not None and (not isinstance(mech_azimuth, (int, float)) or not (0.0 <= mech_azimuth <= 360.0)):
            return jsonify({
                'success': False,
                'message': 'mech_azimuth 必須在 0.0-360.0 度範圍內'
            }), 400
        
        if mech_tilt is not None and (not isinstance(mech_tilt, (int, float)) or not (0.0 <= mech_tilt <= 360.0)):
            return jsonify({
                'success': False,
                'message': 'mech_tilt 必須在 0.0-360.0 度範圍內'
            }), 400
        
        # 調用 AODT API
        result = aodt_client.update_ru_properties(
            ru_path=ru_path,
            height=height,
            mech_azimuth=mech_azimuth,
            mech_tilt=mech_tilt
        )
        
        if result.get('success'):
            # 構建更新的屬性列表
            updated_attrs = []
            if height is not None:
                updated_attrs.append(f"height={height}m")
            if mech_azimuth is not None:
                updated_attrs.append(f"azimuth={mech_azimuth}°")
            if mech_tilt is not None:
                updated_attrs.append(f"tilt={mech_tilt}°")
            
            return jsonify({
                'success': True,
                'message': f'成功更新 RU 屬性: {ru_path}',
                'updated_properties': {
                    'ru_path': ru_path,
                    'height': height,
                    'mech_azimuth': mech_azimuth,
                    'mech_tilt': mech_tilt
                },
                'summary': f"已更新: {', '.join(updated_attrs)}"
            }), 200
        else:
            # 提供更詳細的錯誤信息
            error_msg = result.get('error_message', result.get('error', f'更新 RU 屬性失敗: {ru_path}'))
            return jsonify({
                'success': False,
                'message': error_msg,
                'request_data': result.get('request_data'),  # 包含請求數據以便調試
                'aodt_response': result  # 包含完整的 AODT 響應
            }), 400
    
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'內部錯誤: {str(e)}'
        }), 500


@aodt_bp.route('/aodt/ru/properties/<path:ru_path>', methods=['GET'])
def get_ru_properties(ru_path):
    """獲取 RU 屬性 - 包含高度、機械方位角、機械傾斜角等"""
    try:
        # 確保路徑格式正確
        if not ru_path.startswith('/'):
            ru_path = '/' + ru_path
        
        # 調用 AODT API
        result = aodt_client.get_ru_properties(ru_path)
        
        if result.get('success'):
            return jsonify({
                'success': True,
                'ru_path': ru_path,
                'properties': result.get('properties', {}),
                'message': f'成功獲取 RU 屬性: {ru_path}'
            }), 200
        else:
            return jsonify({
                'success': False,
                'message': result.get('error', f'獲取 RU 屬性失敗: {ru_path}')
            }), 404
    
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'內部錯誤: {str(e)}'
        }), 500