from queues import exe_queue
import requests
from models.Project import Project
from models.Evaluation import Evaluation
from models.Map import Map
from enums.HeatmapState import HeatmapState 
from models import db
import time
from utils.AODT_utils import AODTApiClient, transform_direction
from controllers.minIO import get_usd_data
from utils.minIOName import MinIOName
import base64
from config import CALCULATION_CALLBACK_BASE_URL

aodt_client = AODTApiClient()

@exe_queue.task
def start_aodt_workflow(data, throughput_ue_pt: list):      # noqa: MC0001
    """啟動完整的 AODT 工作流程 - 逐步確認執行"""
    try:
        steps_completed = []

        # 轉換參數翻譯和座標
        project_id = data.get('project_id', 0)
        evaluation_id = data.get('evaluation_id', 0)
        project = Project.query.get(project_id)
        project_lat = project.lat
        project_lon = project.lon
        project_rotation_offset = project.rotation_offset
        evaluation = Evaluation.query.get(evaluation_id)

        minIO_name = MinIOName.aodt_map(project_id)
        live_name = f'map_aodt_{project_id}.live'

        map = Map.query.filter_by(project_id=project_id).first()

        if (not project or not evaluation or not map):
            return {
                'success': False,
                'message': '無效的 project_id 或 evaluation_id',
                'error_code': 400
            }

        file_path = f'omniverse://omniverse-server/Users/aerial/osm/{minIO_name}'
        live_path = f'omniverse://omniverse-server/Users/aerial/osm/live/{live_name}'
        #check AODT is idle
        try: 
            while True: 
                aodt_status = aodt_client.is_sim_running()
                if aodt_status.get('success')  and aodt_status.get('error_message') == "No simulation is running":
                    break
                time.sleep(10)
        except Exception as e:
            evaluation.rsrp_status = HeatmapState.FAILURE
            db.session.commit()
            return {
                'success':False,
                'message': str(e),
                'status_code':500
            }

        # restart aodt
        try:
            result = aodt_client.restart_aodt()
            if not result.get('status') == 'success':
                evaluation.rsrp_status = HeatmapState.FAILURE
                db.session.commit()
                return {
                    'success': False,
                    'message': result.get('error', '重啟 AODT 失敗'),
                    'status_code': 400
                }
            steps_completed.append('✓ AODT 重啟成功')
            time.sleep(10)  # 等待 AODT 重啟完成
        except Exception as e:
            evaluation.rsrp_status = HeatmapState.FAILURE
            db.session.commit()
            return {
                'success': False,
                'message': f'重啟 AODT 異常: {str(e)}',
                'status_code': 500
            }

        try:
            minIOResult = get_usd_data('mapaodt', minIO_name)

            if not minIOResult.get('success'):
                return {
                    'success': False,
                    'message': minIOResult.get('error', '無法獲取 USD 數據'),
                    'status_code': 400
                }
            
            usd_data = minIOResult.get('data')
            usd_data_b64 = base64.b64encode(usd_data).decode('ascii')

            result = aodt_client.create_files(file_path, usd_data_b64)

            if not result.get('success'):
                evaluation.rsrp_status = HeatmapState.FAILURE
                db.session.commit()
                result = aodt_client.delete_file(file_path)
                result = aodt_client.delete_file(live_path)
                return {
                    'success': False,
                    'message': result.get('error_message', '文件創建失敗'),
                    'status_code': 400
                }

        except Exception as e:
            evaluation.rsrp_status = HeatmapState.FAILURE
            db.session.commit()
            result = aodt_client.delete_file(file_path)
            result = aodt_client.delete_file(live_path)
            return {
                'success': False,
                'message': f'文件創建錯誤: {str(e)}',
                'status_code': 500
            }
        

        # 步驟 1: 連接資料庫
        try:
            connect_result = aodt_client.auto_connect(
                data.get('db_host', 'clickhouse'),
                data.get('db_port', 9000),
                f'project_{project_id}_{evaluation_id}',
                project_id
            )
            
            # 檢查連接結果
            if not connect_result.get('success'):
                evaluation.rsrp_status = HeatmapState.FAILURE
                db.session.commit()
                error_msg = connect_result.get('error_message', '未知錯誤')
                result = aodt_client.delete_file(file_path)
                result = aodt_client.delete_file(live_path)
                return {
                    'success': False,
                    'message': f'步驟 1 - 資料庫連接失敗: {error_msg}',
                    'failed_step': '資料庫連接',
                    'steps_completed': steps_completed,
                    'status_code': 400
                }
            
            steps_completed.append('✓ 資料庫連接成功')
            
        except Exception as e:
            evaluation.rsrp_status = HeatmapState.FAILURE
            db.session.commit()
            result = aodt_client.delete_file(file_path)
            result = aodt_client.delete_file(live_path)
            return {
                'success': False,
                'message': f'步驟 1 - 資料庫連接異常: {str(e)}',
                'failed_step': '資料庫連接',
                'steps_completed': steps_completed,
                'status_code': 500
            }

        time.sleep(1)  # 等待連接完成
        
        try:
            path = 'omniverse://omniverse-server/Users/aerial/osm/' + minIO_name # 這裡將來要改，因為檔案不一定會在 omniverse://

            stage_result = aodt_client.open_usd_stage(minIO_name)

            # 檢查 Stage 開啟結果
            if not stage_result.get('success'):
                error_msg = stage_result.get('error_message', '未知錯誤')
                evaluation.rsrp_status = HeatmapState.FAILURE
                db.session.commit()
                result = aodt_client.delete_file(file_path)
                result = aodt_client.delete_file(live_path)
                return {
                    'success': False,
                    'message': f'步驟 2 - USD Stage 開啟失敗: {error_msg}',
                    'failed_step': 'USD Stage 開啟',
                    'file_path': path,
                    'steps_completed': steps_completed,
                    'status_code':400
                }
            
            steps_completed.append(f'✓ USD Stage 開啟成功: {data["file_name"]}')
            
        except Exception as e:
            evaluation.rsrp_status = HeatmapState.FAILURE
            db.session.commit()
            result = aodt_client.delete_file(file_path)
            result = aodt_client.delete_file(live_path)
            return {
                'success': False,
                'message': f'步驟 2 - USD Stage 開啟異常: {str(e)}',
                'failed_step': 'USD Stage 開啟',
                'file_path': path if 'path' in locals() else data['file_name'],
                'steps_completed': steps_completed,
                'status_code': 500
            }

        time.sleep(1)  # 等待 Stage 開啟完成

        # 步驟 3: 設定模擬配置（如果提供了配置）

        try:
            config_result = aodt_client.set_simulation_config(
                simulation_mode = 'rsrp',
                is_full = False,
                mode = 0,
                duration=1,
                interval=1
            )
            
            # 檢查配置結果
            if not config_result.get('success'):
                error_msg = config_result.get('error', '未知錯誤')
                evaluation.rsrp_status = HeatmapState.FAILURE
                db.session.commit()
                result = aodt_client.delete_file(file_path)
                result = aodt_client.delete_file(live_path)
                return {
                    'success': False,
                    'message': f'步驟 3 - 模擬配置失敗: {error_msg}',
                    'failed_step': '模擬配置設定',
                    'config_attempted': {
                        'simulation_mode': 'rsrp',
                        'is_full': False,
                        'mode': 0,
                        'duration': 1,
                        'interval': 1
                    },
                    'steps_completed': steps_completed,
                    'status_code':400
                }
            steps_completed.append(f'✓ 模擬配置完成: mode={0}, is_full={[False]}')
        except Exception as e:
            evaluation.rsrp_status = HeatmapState.FAILURE
            db.session.commit()
            result = aodt_client.delete_file(file_path)
            result = aodt_client.delete_file(live_path)
            return {
                'success': False,
                'message': f'步驟 3 - 模擬配置異常: {str(e)}',
                'failed_step': '模擬配置設定',
                'config_attempted': {
                    'simulation_mode': 'rsrp',
                    'is_full': False,
                    'mode': 0,
                    'duration': 1,
                    'interval': 1
                } ,
                'steps_completed': steps_completed,
                'status_code':500
            }
        
        # 步驟 4: 設定Ray參數
        try:
            viz_result = aodt_client.update_path_visualization(max_num_paths=100, em_rays=50, em_interactions=5)
            if viz_result.get('success'):
                steps_completed.append('✓ 已更新 path visualization (max_num_paths=100, em_rays=50, em_interactions=5)')
            else:
                err = viz_result.get('error') or viz_result.get('error_message')
                steps_completed.append(f'⚠ 更新 path visualization 失敗: {err}')
                print(f"[Warning] update_path_visualization failed: {err}")
        except Exception as e:
            steps_completed.append(f'⚠ 更新 path visualization 異常: {str(e)}')
            print(f"[Error] update_path_visualization exception: {str(e)}")

        # 步驟 5: 設定UE屬性參數
        try:
            ue_props_result = aodt_client.update_ue_properties(ue_height=1.7, sphere_radius=0.5)
            if ue_props_result.get('success'):
                steps_completed.append('✓ 已設定 UE 屬性 (height=1.7m, sphere_radius=0.5)')
            else:
                err = ue_props_result.get('error') or ue_props_result.get('error_message')
                steps_completed.append(f'⚠ 設定 UE 屬性失敗: {err}')
                print(f"[Warning] update_ue_properties failed: {err}")
        except Exception as e:
            steps_completed.append(f'⚠ 設定 UE 屬性異常: {str(e)}')
            print(f"[Error] update_ue_properties exception: {str(e)}")
        
        # 步驟 6: 刪除所有 dus 和 rus
        try:
            delete_rus_result = aodt_client.delete_all_rus()
            delete_dus_result = aodt_client.delete_all_dus()
            rus_success = delete_rus_result.get('success') or \
                (delete_rus_result.get('error_message', '').startswith('Deletion failed: No RUs available'))
            dus_success = delete_dus_result.get('success') or \
                (delete_dus_result.get('error_message', '').startswith('Deletion failed: No DUs available'))
            if not rus_success or not dus_success:
                error_msg = delete_rus_result.get('error_message', '未知錯誤') if not rus_success else delete_dus_result.get('error_message', '未知錯誤')
                evaluation.rsrp_status = HeatmapState.FAILURE
                db.session.commit()
                result = aodt_client.delete_file(file_path)
                result = aodt_client.delete_file(live_path)
                return {
                    'success': False,
                    'message': f'步驟 4 - 刪除所有 DUs 和 RUs 失敗: {error_msg}',
                    'failed_step': '刪除 DUs 和 RUs',
                    'steps_completed': steps_completed,
                    'status_code':400
                }
            steps_completed.append('✓ 成功刪除所有 DUs 和 RUs（或原本就沒有）')
        except Exception as e:
            evaluation.rsrp_status = HeatmapState.FAILURE
            db.session.commit()
            result = aodt_client.delete_file(file_path)
            result = aodt_client.delete_file(live_path)
            return {
                'success': False,
                'message': f'步驟 4 - 刪除所有 DUs 和 RUs 錯誤: {str(e)}',
                'failed_step': '刪除 DUs 和 RUs',
                'steps_completed': steps_completed,
                'status_code':500
            }

        # 步驟 7: 建立 Panel(如果小於2個就要建立panel)
        panel_count = aodt_client.get_panel_count().get('panel_count', 0)
        if panel_count == 1:
            try:
                create_panel_result = aodt_client.create_panel(["rec_microstrip_patch"], 4700.0, 200.0, 200.0)
                if not create_panel_result.get('success'):
                    error_msg = create_panel_result.get('error', '未知錯誤')
                    evaluation.rsrp_status = HeatmapState.FAILURE
                    db.session.commit()
                    result = aodt_client.delete_file(file_path)
                    result = aodt_client.delete_file(live_path)
                    return {
                        'success': False,
                        'message': f'步驟 5 - Panel 創建失敗: {error_msg}',
                        'failed_step': 'Panel 創建',
                        'steps_completed': steps_completed,
                        'status_code':400
                    }
                steps_completed.append('✓ 成功創建 Panel')
            except Exception as e:
                evaluation.rsrp_status = HeatmapState.FAILURE
                db.session.commit()
                result = aodt_client.delete_file(file_path)
                result = aodt_client.delete_file(live_path)
                return {
                    'success': False,
                    'message': f'步驟 5 - Panel 創建異常: {str(e)}',
                    'failed_step': 'Panel 創建',
                    'steps_completed': steps_completed,
                    'status_code':500
                }
        elif panel_count == 0:
            try:
                create_panels_result = aodt_client.create_panels_batch(2)
                if not create_panels_result.get('success'):
                    error_msg = create_panels_result.get('message', '未知錯誤')
                    evaluation.rsrp_status = HeatmapState.FAILURE
                    db.session.commit()
                    result = aodt_client.delete_file(file_path)
                    result = aodt_client.delete_file(live_path)
                    return {
                        'success': False,
                        'message': f'步驟 5 - Panel 批量創建失敗: {error_msg}',
                        'failed_step': 'Panel 批量創建',
                        'steps_completed': steps_completed,
                        'status_code':400
                    }
                steps_completed.append('✓ 成功批量創建 2 個 Panel')
            except Exception as e:
                evaluation.rsrp_status = HeatmapState.FAILURE
                db.session.commit()
                result = aodt_client.delete_file(file_path)
                result = aodt_client.delete_file(live_path)
                return {
                    'success': False,
                    'message': f'步驟 5 - Panel 批量創建異常: {str(e)}',
                    'failed_step': 'Panel 批量創建',
                    'steps_completed': steps_completed,
                    'status_code':500
                }
            
        # 步驟 8: 建立 rus 和 dus
        if 'rus' in data and isinstance(data['rus'], list) and len(data['rus']) > 0:
            try:
                rus = data['rus']
                create_rus_result = aodt_client.create_rus_batch(rus, project_id, evaluation_id)
                if not create_rus_result.get('success'):
                    error_msg = create_rus_result.get('results', '未知錯誤')
                    evaluation.rsrp_status = HeatmapState.FAILURE
                    db.session.commit()
                    result = aodt_client.delete_file(file_path)
                    result = aodt_client.delete_file(live_path)
                    return {
                        'success': False,
                        'message': f'步驟 6 - 建立 RUs 失敗: {error_msg}',
                        'failed_step': '建立 RUs',
                        'steps_completed': steps_completed,
                        'status_code':400
                    }
                steps_completed.append(f'✓ 成功建立 RUs: {len(rus)} 個')
                
                # 步驟 8-2: 更新 RU 的 azimuth (rotation_offset)
                try:
                    project = Project.query.get(project_id)
                    rotation_offset = project.rotation_offset if project else 0
                    
                    update_success_count = 0
                    update_error_count = 0
                    
                    for i, ru_data in enumerate(rus):
                        ru_path = f"/RUs/ru_{str(i+1).zfill(4)}"  # 格式化為 /RUs/ru_0001, /RUs/ru_0002, 等等
                        
                        # 獲取 RU 的 ru_roll，然後使用 project 的 rotation_offset 進行轉換
                        ru_roll = ru_data.get('ru_roll')
                        ru_tilt = ru_data.get('ru_tilt')
                        
                        # 應用與 create_rus_batch 中相同的轉換邏輯
                        # rotation_offset 始終從 project 獲取
                        mech_azimuth = transform_direction(ru_roll, rotation_offset)

                        update_result = aodt_client.update_ru_properties(
                            ru_path=ru_path,
                            mech_azimuth=float(mech_azimuth),
                            mech_tilt=float(ru_tilt),
                            height=0.1
                        )
                        
                        if update_result.get('success'):
                            update_success_count += 1
                        else:
                            update_error_count += 1
                            print(f"[Warning] 更新 RU {ru_path} azimuth 失敗: {update_result.get('error', '未知錯誤')}")

                        power_update_result = aodt_client.update_ru_power(ru_path=ru_path, radiated_power=37.0)

                        if power_update_result.get('success'):
                            print(f"[Info] 成功更新 RU {ru_path} 輻射功率: {37.0} dBm")
                            steps_completed.append(f'✓ 成功更新 RU {ru_path} 輻射功率: {37.0} dBm')
                        else:
                            print(f"[Warning] 更新 RU {ru_path} 輻射功率 失敗: {power_update_result.get('error', '未知錯誤')}")
                            steps_completed.append(f'⚠ 更新 RU {ru_path} 輻射功率 失敗')
                    
                    if update_error_count > 0:
                        steps_completed.append(f'⚠ RU azimuth 更新部分失敗: {update_success_count} 成功, {update_error_count} 失敗')
                    else:
                        steps_completed.append(f'✓ 成功更新 {update_success_count} 個 RU 的 azimuth')
                        
                except Exception as e:
                    print(f"[Error] 更新 RU azimuth 異常: {str(e)}")
                    steps_completed.append(f'⚠ RU azimuth 更新異常: {str(e)}')

            except Exception as e:
                evaluation.rsrp_status = HeatmapState.FAILURE
                db.session.commit()
                result = aodt_client.delete_file(file_path)
                result = aodt_client.delete_file(live_path)
                return {
                    'success': False,
                    'message': f'步驟 6 - 建立 RUs 異常: {str(e)}',
                    'failed_step': '建立 RUs',
                    'steps_completed': steps_completed,
                    'status_code':500
                }
        else:
            steps_completed.append('- 跳過建立 RUs（未提供 RUs 列表）')

        # 步驟 9: 自動分配 DUs
        try:
            auto_assign_result = aodt_client.auto_assign_du()
            if not auto_assign_result.get('success'):
                error_msg = auto_assign_result.get('error_message', '未知錯誤')
                evaluation.rsrp_status = HeatmapState.FAILURE
                db.session.commit()
                result = aodt_client.delete_file(file_path)
                result = aodt_client.delete_file(live_path)
                return {
                    'success': False,
                    'message': f'步驟 7 - 自動分配 DUs 失敗: {error_msg}',
                    'failed_step': '自動分配 DUs',
                    'steps_completed': steps_completed,
                    'status_code':400
                }
            steps_completed.append('✓ 成功自動分配 DUs 給所有 RUs')
        except Exception as e:
            evaluation.rsrp_status = HeatmapState.FAILURE
            db.session.commit()
            result = aodt_client.delete_file(file_path)
            result = aodt_client.delete_file(live_path)
            return {
                'success': False,
                'message': f'步驟 7 - 自動分配 DUs 異常: {str(e)}',
                'failed_step': '自動分配 DUs',
                'steps_completed': steps_completed,
                'status_code':500
            }
        
        time.sleep(1)
        
        # 步驟 10: 刪除所有 UE
        try:
            delete_ues_result = aodt_client.delete_all_ues()
            ues_success = delete_ues_result.get('success')
            if not ues_success:
                error_msg = delete_ues_result.get('error_message', '未知錯誤') if not ues_success else delete_ues_result.get('error_message', '未知錯誤')
                evaluation.rsrp_status = HeatmapState.FAILURE
                db.session.commit()
                result = aodt_client.delete_file(file_path)
                result = aodt_client.delete_file(live_path)
                return {
                    'success': False,
                    'message': f'步驟 8 - 刪除所有 UEs 失敗: {error_msg}',
                    'failed_step': '刪除所有 UEs',
                    'steps_completed': steps_completed,
                    'status_code':400
                }
            steps_completed.append('✓ 成功刪除所有 UEs(或原本就沒有）')
        except Exception as e:
            evaluation.rsrp_status = HeatmapState.FAILURE
            db.session.commit()
            result = aodt_client.delete_file(file_path)
            result = aodt_client.delete_file(live_path)
            return {
                'success': False,
                'message': f'步驟 8 - 刪除所有 UEs 錯誤: {str(e)}',
                'failed_step': '刪除 UEs',
                'steps_completed': steps_completed,
                'status_code':500
            }
        
        time.sleep(1)

        # 步驟 11: 自動放 UE，目前預設值是隨機放
        if 'ues' in data:
            try:
                auto_deploy_ue = aodt_client.create_rec_ues_by_count(project_id, 500, throughput_ue_pt)
                    
                if not auto_deploy_ue.get('success'):
                    error_msg = auto_deploy_ue.get('error_message', '未知錯誤')
                    evaluation.rsrp_status = HeatmapState.FAILURE
                    db.session.commit()
                    result = aodt_client.delete_file(file_path)
                    result = aodt_client.delete_file(live_path)
                    return {
                        'success': False,
                        'message': f'步驟 9 - 自動部署 UEs 失敗: {error_msg}',
                        'failed_step': '自動分配 UEs',
                        'steps_completed': steps_completed,
                        'status_code':400
                    }
                steps_completed.append('✓ 成功自動部署 UEs')
            except Exception as e:
                evaluation.rsrp_status = HeatmapState.FAILURE
                db.session.commit()
                result = aodt_client.delete_file(file_path)
                result = aodt_client.delete_file(live_path)
                return {
                    'success': False,
                    'message': f'步驟 9 - 自動部署 UEs 異常: {str(e)}',
                    'failed_step': '自動部署 UEs',
                    'steps_completed': steps_completed,
                    'status_code':500
                }
        else:
            try:
                auto_deploy_ue = aodt_client.create_direct_ues(
                    0,
                    0,
                    1000,
                    100
                )
            except Exception as e:
                evaluation.rsrp_status = HeatmapState.FAILURE
                db.session.commit()
                result = aodt_client.delete_file(file_path)
                result = aodt_client.delete_file(live_path)
                return {
                    'success': False,
                    'message': f'步驟 9 - 自動部署 UEs 異常: {str(e)}',
                    'failed_step': '自動部署 UEs',
                    'steps_completed': steps_completed,
                    'status_code':500
                }

            
        time.sleep(1)

        # 步驟 12: Generate UE mobility
        try:
            generate_ue_mobility = aodt_client.on_Generate_UE_mobility()
            if not generate_ue_mobility.get('success'):
                evaluation.rsrp_status = HeatmapState.FAILURE
                db.session.commit()
                result = aodt_client.delete_file(file_path)
                result = aodt_client.delete_file(live_path)
                return {
                    'success': False,
                    'message': f'步驟 10 - Generate UE mobility 失敗: {generate_ue_mobility.get("error_message", "未知錯誤")}',
                    'failed_step': 'Generate UE mobility',
                    'steps_completed': steps_completed,
                    'status_code':400
                }
            steps_completed.append('✓ Generate UE mobility successfully')
        except Exception as e:
            evaluation.rsrp_status = HeatmapState.FAILURE
            db.session.commit()
            result = aodt_client.delete_file(file_path)
            result = aodt_client.delete_file(live_path)
            return {
                'success': False,
                'message': f'步驟 10 - Generate UE mobility 異常: {str(e)}',
                'failed_step': 'Generate UE mobility',
                'steps_completed': steps_completed,
                'status_code':500
            }
        
        time.sleep(3)

        # 步驟 13: Start simulation
        try:
            callbackURL_response = requests.get("http://ngrok:4040/api/tunnels")
            callbackURL_data = callbackURL_response.json()
            callbackURL_tunnel = callbackURL_data.get('tunnels', [])
            callbackURL = callbackURL_tunnel[0]['public_url'] if callbackURL_tunnel else None

        except Exception:
            callbackURL = CALCULATION_CALLBACK_BASE_URL

        try:
            start_simulation = aodt_client.start_simulation(
                project_id=project_id, 
                evaluation_id=evaluation_id,
                sim_mode='RSRP',
                callbackURL=callbackURL,
                ue_start_or_end_pt=0 if throughput_ue_pt[0] is not None else 1  # 0表示UE起點，1表示終點
            )
            if not start_simulation.get('success'):
                evaluation.rsrp_status = HeatmapState.FAILURE
                db.session.commit()
                result = aodt_client.delete_file(file_path)
                result = aodt_client.delete_file(live_path)
                return {
                    'success': False,
                    'message': f'步驟 11 -  Start simulation 失敗: {start_simulation.get("error_message", "未知錯誤")}',
                    'failed_step': ' Start simulation',
                    'steps_completed': steps_completed,
                    'status_code':400
                }
            steps_completed.append('✓ 成功開始模擬')
        except Exception as e:
            evaluation.rsrp_status = HeatmapState.FAILURE
            db.session.commit()
            result = aodt_client.delete_file(file_path)
            result = aodt_client.delete_file(live_path)
            return {
                'success': False,
                'message': f'步驟 11 - Start simulation 異常: {str(e)}',
                'failed_step': 'Start simulation',
                'steps_completed': steps_completed,
                'status_code':500
            }

        return {
            'success': True,
            'message': 'AODT 工作流程啟動成功',
            'total_steps': len(steps_completed),
            'steps_completed': steps_completed,
            'throughput_config': data.get('throughput_config', None),
            'status_code': 200
        }
        
    except Exception as e:
        evaluation.rsrp_status = HeatmapState.FAILURE
        result = aodt_client.delete_file(file_path)
        result = aodt_client.delete_file(live_path)
        db.session.commit()
        return {
            'success': False,
            'message': f'AODT 工作流程異常: {str(e)}',
            'failed_step': '工作流程執行',
            'steps_completed': steps_completed if 'steps_completed' in locals() else [],
            'status_code':500
        }
    
@exe_queue.task
def aodt_workflow_throughput(data, throughput_ue_pt: list):          # noqa: MC0001
    """啟動 AODT throughput 工作流程"""
    time.sleep(5)
    try:

        steps_completed = []

        # 轉換參數翻譯和座標
        project_id = data.get('project_id', 0)
        evaluation_id = data.get('evaluation_id', 0)
        project = Project.query.get(project_id)
        project_lat = project.lat
        project_lon = project.lon
        project_rotation_offset = project.rotation_offset
        evaluation = Evaluation.query.get(evaluation_id)

        map = Map.query.filter_by(project_id=project_id).first()

        if (not project or not evaluation or not map) and (project_id != 0 or evaluation_id != 0):
            return {
                'success': False,
                'message': '無效的 project_id 或 evaluation_id',
                'status_code':400
            }
        
        minIO_name = MinIOName.aodt_map(project_id)
        live_name = f'map_aodt_{project_id}.live'
        evaluation.throughput_status = HeatmapState.WAITING
        db.session.commit()

        file_path = f'omniverse://omniverse-server/Users/aerial/osm/{minIO_name}'
        live_path = f'omniverse://omniverse-server/Users/aerial/osm/live/{live_name}'

        #check AODT is idle
        try:
            while True: 
                aodt_status = aodt_client.is_sim_running()
                if aodt_status.get('success')  and aodt_status.get('error_message') == "No simulation is running":
                    break
                time.sleep(10)
        except Exception as e:
            evaluation.throughput_status = HeatmapState.FAILURE
            db.session.commit()
            return {
                'success':False,
                'message': str(e),
                'status_code':500
            }


        # restart aodt
        try:
            result = aodt_client.restart_aodt()
            if not result.get('status') == 'success':
                evaluation.rsrp_status = HeatmapState.FAILURE
                db.session.commit()
                return {
                    'success': False,
                    'message': result.get('error', '重啟 AODT 失敗'),
                    'status_code': 400
                }
            steps_completed.append('✓ AODT 重啟成功')
            time.sleep(10)  # 等待 AODT 重啟完成
        except Exception as e:
            evaluation.rsrp_status = HeatmapState.FAILURE
            db.session.commit()
            return {
                'success': False,
                'message': f'重啟 AODT 異常: {str(e)}',
                'status_code': 500
            }
        
        try:
            minIOResult = get_usd_data('mapaodt', minIO_name)

            if not minIOResult.get('success'):
                return {
                    'success': False,
                    'message': minIOResult.get('error', '無法獲取 USD 數據'),
                    'status_code':400
                }
            
            usd_data = minIOResult.get('data')
            usd_data_b64 = base64.b64encode(usd_data).decode('ascii')

            result = aodt_client.create_files(file_path, usd_data_b64)

            if not result.get('success'):
                evaluation.throughput_status = HeatmapState.FAILURE
                db.session.commit()
                result = aodt_client.delete_file(file_path)
                result = aodt_client.delete_file(live_path)
                return {
                    'success': False,
                    'message': result.get('error_message', '文件創建失敗'),
                    'status_code':400
                }

        except Exception as e:
            evaluation.throughput_status = HeatmapState.FAILURE
            db.session.commit()
            result = aodt_client.delete_file(file_path)
            result = aodt_client.delete_file(live_path)
            return {
                'success': False,
                'message': f'文件創建錯誤: {str(e)}',
                'status_code':500
            }
        
        # 步驟 1: 連接資料庫
        try:
            connect_result = aodt_client.auto_connect(
                data.get('db_host', 'clickhouse'),
                data.get('db_port', 9000),
                f'project_{project_id}_{evaluation_id}',
                project_id
            )
            
            # 檢查連接結果
            if not connect_result.get('success'):
                evaluation.throughput_status = HeatmapState.FAILURE
                db.session.commit()
                result = aodt_client.delete_file(file_path)
                result = aodt_client.delete_file(live_path)
                error_msg = connect_result.get('error_message', '未知錯誤')
                return {
                    'success': False,
                    'message': f'步驟 1 - 資料庫連接失敗: {error_msg}',
                    'failed_step': '資料庫連接',
                    'steps_completed': steps_completed,
                    'status_code':400
                }
            
            steps_completed.append('✓ 資料庫連接成功')
            
        except Exception as e:
            evaluation.throughput_status = HeatmapState.FAILURE
            db.session.commit()
            result = aodt_client.delete_file(file_path)
            result = aodt_client.delete_file(live_path)
            return {
                'success': False,
                'message': f'步驟 1 - 資料庫連接異常: {str(e)}',
                'failed_step': '資料庫連接',
                'steps_completed': steps_completed,
                'status_code':500
            }

        time.sleep(5)  # 等待連接完成
        
        
        try:

            path = 'omniverse://omniverse-server/Users/aerial/osm/' + minIO_name # 這裡將來要改，因為檔案不一定會在 omniverse://

            stage_result = aodt_client.open_usd_stage(minIO_name)
            
            # 檢查 Stage 開啟結果
            if not stage_result.get('success'):
                evaluation.throughput_status = HeatmapState.FAILURE
                db.session.commit()
                result = aodt_client.delete_file(file_path)
                result = aodt_client.delete_file(live_path)
                error_msg = stage_result.get('error_message', '未知錯誤')
                return {
                    'success': False,
                    'message': f'步驟 2 - USD Stage 開啟失敗: {error_msg}',
                    'failed_step': 'USD Stage 開啟',
                    'file_path': path,
                    'steps_completed': steps_completed,
                    'status_code':400
                }
            
            steps_completed.append(f'✓ USD Stage 開啟成功: {minIO_name}')
            
        except Exception as e:
            evaluation.throughput_status = HeatmapState.FAILURE
            db.session.commit()
            result = aodt_client.delete_file(file_path)
            result = aodt_client.delete_file(live_path)
            return {
                'success': False,
                'message': f'步驟 2 - USD Stage 開啟異常: {str(e)}',
                'failed_step': 'USD Stage 開啟',
                'file_path': path if 'path' in locals() else minIO_name,
                'steps_completed': steps_completed,
                'status_code':500
            }

        time.sleep(1)  # 等待 Stage 開啟完成

        # 步驟 3: 設定模擬配置（如果提供了配置）
        try:
            config_result = aodt_client.set_simulation_config(
                simulation_mode = 'throughput',
                is_full = True,
                mode = 1,
                slots_per_batch = 30,
                samples_per_slot = 14
            )
            
            # 檢查配置結果
            if not config_result.get('success'):
                error_msg = config_result.get('error', '未知錯誤')
                evaluation.throughput_status = HeatmapState.FAILURE
                db.session.commit()
                result = aodt_client.delete_file(file_path)
                result = aodt_client.delete_file(live_path)
                return {
                    'success': False,
                    'message': f'步驟 3 - 模擬配置失敗: {error_msg}',
                    'failed_step': '模擬配置設定',
                    'config_attempted': {
                        'simulation_mode': 'throughput',
                        'is_full': True,
                        'mode': 1,
                        'slots_per_batch': 30,
                        'samples_per_slot': 14
                    },
                    'steps_completed': steps_completed,
                    'status_code':400
                }
            steps_completed.append(f'✓ 模擬配置完成: mode={1}, is_full={True}')
        except Exception as e:
            evaluation.throughput_status = HeatmapState.FAILURE
            db.session.commit()
            result = aodt_client.delete_file(file_path)
            result = aodt_client.delete_file(live_path)
            return {
                'success': False,
                'message': f'步驟 3 - 模擬配置異常: {str(e)}',
                'failed_step': '模擬配置設定',
                'config_attempted': {
                    'simulation_mode': 'throughput',
                    'is_full': True,
                    'mode': 1,
                    'slots_per_batch': 50,
                    'samples_per_slot': 14
                },
                'steps_completed': steps_completed,
                'status_code':500
            }

        # 步驟 4: 設定Ray參數
        try:
            viz_result = aodt_client.update_path_visualization(max_num_paths=100, em_rays=50, em_interactions=5)
            if viz_result.get('success'):
                steps_completed.append('✓ 已更新 path visualization (max_num_paths=100, em_rays=50, em_interactions=5)')
            else:
                err = viz_result.get('error') or viz_result.get('error_message')
                steps_completed.append(f'⚠ 更新 path visualization 失敗: {err}')
                print(f"[Warning] update_path_visualization failed: {err}")
        except Exception as e:
            steps_completed.append(f'⚠ 更新 path visualization 異常: {str(e)}')
            print(f"[Error] update_path_visualization exception: {str(e)}")

        # 步驟 5: 設定UE屬性參數
        try:
            # 設定 UE 屬性：ue_height=1.7m, sphere_radius=0.5
            ue_props_result = aodt_client.update_ue_properties(ue_height=1.7, sphere_radius=0.5)
            if ue_props_result.get('success'):
                steps_completed.append('✓ 已設定 UE 屬性 (height=1.7m, sphere_radius=0.5)')
            else:
                err = ue_props_result.get('error') or ue_props_result.get('error_message')
                steps_completed.append(f'⚠ 設定 UE 屬性失敗: {err}')
                print(f"[Warning] update_ue_properties failed: {err}")
        except Exception as e:
            steps_completed.append(f'⚠ 設定 UE 屬性異常: {str(e)}')
            print(f"[Error] update_ue_properties exception: {str(e)}")
        
        # 步驟 6: 刪除所有 dus 和 rus
        try:
            delete_rus_result = aodt_client.delete_all_rus()
            delete_dus_result = aodt_client.delete_all_dus()
            rus_success = delete_rus_result.get('success') or \
                (delete_rus_result.get('error_message', '').startswith('Deletion failed: No RUs available'))
            dus_success = delete_dus_result.get('success') or \
                (delete_dus_result.get('error_message', '').startswith('Deletion failed: No DUs available'))
            if not rus_success or not dus_success:
                evaluation.throughput_status = HeatmapState.FAILURE
                db.session.commit()
                result = aodt_client.delete_file(file_path)
                result = aodt_client.delete_file(live_path)
                error_msg = delete_rus_result.get('error_message', '未知錯誤') if not rus_success else delete_dus_result.get('error_message', '未知錯誤')
                return {
                    'success': False,
                    'message': f'步驟 4 - 刪除所有 DUs 和 RUs 失敗: {error_msg}',
                    'failed_step': '刪除 DUs 和 RUs',
                    'steps_completed': steps_completed,
                    'status_code':400
                }
            steps_completed.append('✓ 成功刪除所有 DUs 和 RUs（或原本就沒有）')
        except Exception as e:
            evaluation.throughput_status = HeatmapState.FAILURE
            db.session.commit()
            result = aodt_client.delete_file(file_path)
            result = aodt_client.delete_file(live_path)
            return {
                'success': False,
                'message': f'步驟 4 - 刪除所有 DUs 和 RUs 錯誤: {str(e)}',
                'failed_step': '刪除 DUs 和 RUs',
                'steps_completed': steps_completed,
                'status_code':500
            }

        # 步驟 7: 建立 Panel(如果小於2個就要建立panel)
        panel_count = aodt_client.get_panel_count().get('panel_count', 0)
        if panel_count == 1:
            try:
                create_panel_result = aodt_client.create_panel(["rec_microstrip_patch"], 4700.0, 200.0, 200.0)
                if not create_panel_result.get('success'):
                    error_msg = create_panel_result.get('error', '未知錯誤')
                    evaluation.rsrp_status = HeatmapState.FAILURE
                    db.session.commit()
                    result = aodt_client.delete_file(file_path)
                    result = aodt_client.delete_file(live_path)
                    return {
                        'success': False,
                        'message': f'步驟 5 - Panel 創建失敗: {error_msg}',
                        'failed_step': 'Panel 創建',
                        'steps_completed': steps_completed,
                        'status_code':400
                    }
                steps_completed.append('✓ 成功創建 Panel')
            except Exception as e:
                evaluation.rsrp_status = HeatmapState.FAILURE
                db.session.commit()
                result = aodt_client.delete_file(file_path)
                result = aodt_client.delete_file(live_path)
                return {
                    'success': False,
                    'message': f'步驟 5 - Panel 創建異常: {str(e)}',
                    'failed_step': 'Panel 創建',
                    'steps_completed': steps_completed,
                    'status_code':500
                }
        elif panel_count == 0:
            try:
                create_panels_result = aodt_client.create_panels_batch(2)
                if not create_panels_result.get('success'):
                    error_msg = create_panels_result.get('message', '未知錯誤')
                    evaluation.rsrp_status = HeatmapState.FAILURE
                    db.session.commit()
                    result = aodt_client.delete_file(file_path)
                    result = aodt_client.delete_file(live_path)
                    return {
                        'success': False,
                        'message': f'步驟 5 - Panel 批量創建失敗: {error_msg}',
                        'failed_step': 'Panel 批量創建',
                        'steps_completed': steps_completed,
                        'status_code':400
                    }
                steps_completed.append('✓ 成功批量創建 2 個 Panel')
            except Exception as e:
                evaluation.rsrp_status = HeatmapState.FAILURE
                db.session.commit()
                result = aodt_client.delete_file(file_path)
                result = aodt_client.delete_file(live_path)
                return {
                    'success': False,
                    'message': f'步驟 5 - Panel 批量創建異常: {str(e)}',
                    'failed_step': 'Panel 批量創建',
                    'steps_completed': steps_completed,
                    'status_code':500
                }
            
        # 步驟 8: 建立 rus 和 dus
        if 'rus' in data and isinstance(data['rus'], list) and len(data['rus']) > 0:
            try:
                rus = data['rus']
                create_rus_result = aodt_client.create_rus_batch(rus, project_id, evaluation_id)
                if not create_rus_result.get('success'):
                    error_msg = create_rus_result.get('results', '未知錯誤')
                    evaluation.throughput_status = HeatmapState.FAILURE
                    db.session.commit()
                    result = aodt_client.delete_file(file_path)
                    result = aodt_client.delete_file(live_path)
                    return {
                        'success': False,
                        'message': f'步驟 6 - 建立 RUs 失敗: {error_msg}',
                        'failed_step': '建立 RUs',
                        'steps_completed': steps_completed,
                        'status_code':400
                    }
                steps_completed.append(f'✓ 成功建立 RUs: {len(rus)} 個')
                
                # 步驟 8-2: 更新 RU 的 azimuth (rotation_offset)
                try:
                    project = Project.query.get(project_id)
                    rotation_offset = project.rotation_offset if project else 0
                    
                    update_success_count = 0
                    update_error_count = 0
                    
                    for i, ru_data in enumerate(rus):
                        ru_path = f"/RUs/ru_{str(i+1).zfill(4)}"  # 格式化為 /RUs/ru_0001, /RUs/ru_0002, 等等
                        
                        # 獲取 RU 的 ru_roll，然後使用 project 的 rotation_offset 進行轉換
                        ru_roll = ru_data.get('ru_roll')
                        ru_tilt = ru_data.get('ru_tilt')
                        
                        # 應用與 create_rus_batch 中相同的轉換邏輯
                        # rotation_offset 始終從 project 獲取
                        mech_azimuth = transform_direction(ru_roll, rotation_offset)

                        update_result = aodt_client.update_ru_properties(
                            ru_path=ru_path,
                            mech_azimuth=float(mech_azimuth),
                            mech_tilt=float(ru_tilt),
                            height=0.1
                        )
                        
                        if update_result.get('success'):
                            update_success_count += 1
                        else:
                            update_error_count += 1
                            print(f"[Warning] 更新 RU {ru_path} azimuth 失敗: {update_result.get('error', '未知錯誤')}")

                        power_update_result = aodt_client.update_ru_power(ru_path=ru_path, radiated_power=37.0)
                    
                        if power_update_result.get('success'):
                            steps_completed.append(f'✓ 成功更新 RU {ru_path} 輻射功率: {37.0} dBm')
                        else:
                            steps_completed.append(f'⚠ 更新 RU {ru_path} 輻射功率 失敗')
                    
                    if update_error_count > 0:
                        steps_completed.append(f'⚠ RU azimuth 更新部分失敗: {update_success_count} 成功, {update_error_count} 失敗')
                    else:
                        steps_completed.append(f'✓ 成功更新 {update_success_count} 個 RU 的 azimuth')
                        
                except Exception as e:
                    print(f"[Error] 更新 RU azimuth 異常: {str(e)}")
                    steps_completed.append(f'⚠ RU azimuth 更新異常: {str(e)}')
                    # 不中斷流程，繼續執行
            
            except Exception as e:
                evaluation.throughput_status = HeatmapState.FAILURE
                db.session.commit()
                result = aodt_client.delete_file(file_path)
                result = aodt_client.delete_file(live_path)
                return {
                    'success': False,
                    'message': f'步驟 6 - 建立 RUs 異常: {str(e)}',
                    'failed_step': '建立 RUs',
                    'steps_completed': steps_completed,
                    'status_code':500
                }
        else:
            steps_completed.append('- 跳過建立 RUs（未提供 RUs 列表）')

        # 步驟 9: 自動分配 DUs
        try:
            auto_assign_result = aodt_client.auto_assign_du()
            if not auto_assign_result.get('success'):
                error_msg = auto_assign_result.get('error_message', '未知錯誤')
                evaluation.throughput_status = HeatmapState.FAILURE
                db.session.commit()
                result = aodt_client.delete_file(file_path)
                result = aodt_client.delete_file(live_path)
                return {
                    'success': False,
                    'message': f'步驟 7 - 自動分配 DUs 失敗: {error_msg}',
                    'failed_step': '自動分配 DUs',
                    'steps_completed': steps_completed,
                    'status_code':400
                }
            steps_completed.append('✓ 成功自動分配 DUs 給所有 RUs')
        except Exception as e:
            evaluation.throughput_status = HeatmapState.FAILURE
            db.session.commit()
            result = aodt_client.delete_file(file_path)
            result = aodt_client.delete_file(live_path)
            return {
                'success': False,
                'message': f'步驟 7 - 自動分配 DUs 異常: {str(e)}',
                'failed_step': '自動分配 DUs',
                'steps_completed': steps_completed,
                'status_code':500
            }
        
        time.sleep(1)
        
        # 步驟 10: 刪除所有 UE
        try:
            delete_ues_result = aodt_client.delete_all_ues()
            ues_success = delete_ues_result.get('success')
            if not ues_success:
                error_msg = delete_ues_result.get('error_message', '未知錯誤') if not ues_success else delete_ues_result.get('error_message', '未知錯誤')
                evaluation.throughput_status = HeatmapState.FAILURE
                db.session.commit()
                result = aodt_client.delete_file(file_path)
                result = aodt_client.delete_file(live_path)
                return {
                    'success': False,
                    'message': f'步驟 8 - 刪除所有 UEs 失敗: {error_msg}',
                    'failed_step': '刪除所有 UEs',
                    'steps_completed': steps_completed,
                    'status_code':400
                }
            steps_completed.append('✓ 成功刪除所有 UEs(或原本就沒有）')
        except Exception as e:
            evaluation.throughput_status = HeatmapState.FAILURE
            db.session.commit()
            result = aodt_client.delete_file(file_path)
            result = aodt_client.delete_file(live_path)
            return {
                'success': False,
                'message': f'步驟 8 - 刪除所有 UEs 錯誤: {str(e)}',
                'failed_step': '刪除 UEs',
                'steps_completed': steps_completed,
                'status_code':500
            }
        
        time.sleep(1)

        # 步驟 11: 自動放 UE，目前預設值是隨機放
        if 'rus' in data and isinstance(data['rus'], list) and len(data['rus']) > 0:
            try:
                rus = data['rus']
                get_rus_locations = aodt_client.get_ru_location(rus, project_id, evaluation_id)
                if get_rus_locations.get('success'):
                    for i, location in enumerate(get_rus_locations.get('locations', [])):
                        x = location['x']
                        y = location['y']
                        if i == 0:
                            aodt_client.create_direct_ues(
                                project_id,
                                x*100,
                                y*100,
                                5000,
                                10,
                                throughput_ue_pt
                            )
                        else:
                            aodt_client.create_direct_ues(
                                project_id,
                                x*100,
                                y*100,
                                5000,
                                10,
                                None
                            )
                        steps_completed.append(f'✓ 在 RU 位置 (x={x:.2f}m, y={y:.2f}m) 部署 10 個 UE，半徑 5000cm')
                else:
                    error_msg = get_rus_locations.get('message', '未知錯誤')
                    evaluation.throughput_status = HeatmapState.FAILURE
                    db.session.commit()
                    result = aodt_client.delete_file(file_path)
                    result = aodt_client.delete_file(live_path)
                    return {
                        'success': False,
                        'message': f'步驟 9 - 獲取 RU 位置失敗: {error_msg}',
                        'failed_step': '獲取 RU 位置',
                        'steps_completed': steps_completed,
                        'status_code':400
                    }
                
            except Exception as e:
                evaluation.rsrp_status = HeatmapState.FAILURE
                db.session.commit()
                result = aodt_client.delete_file(file_path)
                result = aodt_client.delete_file(live_path)
                return {
                    'success': False,
                    'message': f'步驟 9 - 自動部署 UEs 異常: {str(e)}',
                    'failed_step': '自動部署 UEs',
                    'steps_completed': steps_completed,
                    'status_code':500
                }
        time.sleep(5)

        # 步驟 12: Generate UE mobility
        try:
            generate_ue_mobility = aodt_client.on_Generate_UE_mobility()
            if not generate_ue_mobility.get('success'):
                evaluation.throughput_status = HeatmapState.FAILURE
                db.session.commit()
                result = aodt_client.delete_file(file_path)
                result = aodt_client.delete_file(live_path)
                return {
                    'success': False,
                    'message': f'步驟 10 - Generate UE mobility 失敗: {generate_ue_mobility.get("error_message", "未知錯誤")}',
                    'failed_step': 'Generate UE mobility',
                    'steps_completed': steps_completed,
                    'status_code':400
                }
            steps_completed.append('✓ Generate UE mobility successfully')
        except Exception as e:
            evaluation.throughput_status = HeatmapState.FAILURE
            db.session.commit()
            result = aodt_client.delete_file(file_path)
            result = aodt_client.delete_file(live_path)
            return {
                'success': False,
                'message': f'步驟 10 - Generate UE mobility 異常: {str(e)}',
                'failed_step': 'Generate UE mobility',
                'steps_completed': steps_completed,
                'status_code':500
            }
        
        time.sleep(3)

        # 步驟 13: Start simulation
        try:
            callbackURL_response = requests.get("http://ngrok:4040/api/tunnels")
            callbackURL_data = callbackURL_response.json()
            callbackURL_tunnel = callbackURL_data.get('tunnels', [])
            callbackURL = callbackURL_tunnel[0]['public_url'] if callbackURL_tunnel else None

        except Exception:
            callbackURL = CALCULATION_CALLBACK_BASE_URL

        try:
            start_simulation = aodt_client.start_simulation(
                project_id=project_id,
                evaluation_id=evaluation_id,
                sim_mode='throughput',
                callbackURL=callbackURL,
                ue_start_or_end_pt=0 if throughput_ue_pt[0] is not None else 1  # 0表示UE起點，1表示終點
            )
            if not start_simulation.get('success'):
                evaluation.throughput_status = HeatmapState.FAILURE
                db.session.commit()
                result = aodt_client.delete_file(file_path)
                result = aodt_client.delete_file(live_path)
                return {
                    'success': False,
                    'message': f'步驟 11 -  Start simulation 失敗: {start_simulation.get("error_message", "未知錯誤")}',
                    'failed_step': ' Start simulation',
                    'steps_completed': steps_completed,
                    'status_code':400
                }
            steps_completed.append('✓ 成功開始模擬')
        except Exception as e:
            evaluation.throughput_status = HeatmapState.FAILURE
            db.session.commit()
            result = aodt_client.delete_file(file_path)
            result = aodt_client.delete_file(live_path)
            return {
                'success': False,
                'message': f'步驟 11 - Start simulation 異常: {str(e)}',
                'failed_step': 'Start simulation',
                'steps_completed': steps_completed,
                'status_code':500
            }

        time.sleep(5)

        return {
            'success': True,
            'message': 'AODT 工作流程啟動成功',
            'total_steps': len(steps_completed),
            'steps_completed': steps_completed,
            'throughput_config': data.get('throughput_config', None),
            'status_code':200
        }
        
    except Exception as e:
        evaluation.throughput_status = HeatmapState.FAILURE
        db.session.commit()
        result = aodt_client.delete_file(file_path)
        result = aodt_client.delete_file(live_path)
        return {
            'success': False,
            'message': f'AODT 工作流程異常: {str(e)}',
            'failed_step': '工作流程執行',
            'steps_completed': steps_completed if 'steps_completed' in locals() else [],
            'status_code':500
        }


@exe_queue.task
def example_add(x,y):
    return x+y