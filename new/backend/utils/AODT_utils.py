from typing import Dict, Any, Optional
import math
import requests
from models.Project import Project
from models.Evaluation import Evaluation
import os

def transform_direction(ru_roll, rotation_offset):
    offset = rotation_offset * (180 / math.pi)
    return (-ru_roll + 90 - offset) % 360

def rotate_latlon(lon, lat, origin_lon, origin_lat, rotation_offset_deg, scale):    # 經緯度轉平面座標（以原點為中心，單位：公尺）
    # 假設 rotation_offset 單位是度，逆時針為正
    R = 6371000
    dlon = math.radians(lon - origin_lon)
    dlat = math.radians(lat - origin_lat)
    avg_lat = math.radians((lat + origin_lat) / 2)
    x = dlon * R * math.cos(avg_lat)
    y = dlat * R

    # 旋轉
    theta = rotation_offset_deg
    x_rot = x * math.cos(theta) - y * math.sin(theta)
    y_rot = x * math.sin(theta) + y * math.cos(theta)

    # 轉回經緯度
    # dlat_rot = y_rot / R
    # dlon_rot = x_rot / (R * math.cos(avg_lat))
    # lat_new = origin_lat + math.degrees(dlat_rot)
    # lon_new = origin_lon + math.degrees(dlon_rot)
    return x_rot, y_rot

def latlon_to_xy_cm(target_lon, target_lat, height_m, origin_lon, origin_lat):
    """
    將一個經緯度點轉換成相對於原點的座標，單位為公分。
    
    :param target_lon: 目標點經度
    :param target_lat: 目標點緯度
    :param height_m:   目標點高度（公尺）
    :param origin_lon: 原點經度
    :param origin_lat: 原點緯度
    :return: (x_cm, y_cm, z_cm) 相對座標，單位為公分
    """

    # 地球半徑（公分）
    R = 637100000

    # 經緯度差值（弧度）
    dlon = math.radians(target_lon - origin_lon)
    dlat = math.radians(target_lat - origin_lat)

    # 平均緯度（弧度）用於修正經度距離
    avg_lat = math.radians((target_lat + origin_lat) / 2)

    # 計算相對座標（X 為經度方向，Y 為緯度方向）
    x_cm = dlon * R * math.cos(avg_lat)  # 東西方向：經度
    y_cm = dlat * R                      # 南北方向：緯度
    z_cm = height_m * 100               # 高度：轉為公分

    return x_cm/100, y_cm/100, z_cm/100 # 將結果轉為公尺

def xy_cm_to_latlon(x_cm, y_cm, z_cm, origin_lon, origin_lat):
    """
    將相對於原點的座標(cm) 轉換回經緯度和高度。
    
    :param x_cm: 經度方向位移（公分）
    :param y_cm: 緯度方向位移（公分）
    :param z_cm: 高度（公分）
    :param origin_lon: 原點經度（度）
    :param origin_lat: 原點緯度（度）
    :return: (lon, lat, height) 經度、緯度、高度（公尺）
    """

    R = 637100000  # 地球半徑（cm）

    # 弧度差
    dlat_rad = y_cm / R
    avg_lat_rad = math.radians(origin_lat)  # 可選擇更精確：用 estimated lat
    dlon_rad = x_cm / (R * math.cos(avg_lat_rad))

    # 轉換為角度（度）
    dlat = math.degrees(dlat_rad)
    dlon = math.degrees(dlon_rad)

    lat = origin_lat + dlat
    lon = origin_lon + dlon
    height = z_cm / 100  # 將公分轉為公尺 

    return lon, lat, height


# AODT API 基本配置
AODT_API_BASE_URL = os.getenv('AODT_API_BASE_URL')  # 根據您的 AODT 服務端口調整
AODT_AGENT_BASE_URL = os.getenv('AODT_AGENT_BASE_URL')      # AODT Agent URL

class AODTApiClient:
    """AODT API 客戶端類"""
    
    def __init__(self, base_url: str = AODT_API_BASE_URL):
        self.base_url = base_url
        
    def _make_request(self, method: str, endpoint: str, data: Optional[Dict] = None) -> Dict[str, Any]:
        """統一的 API 請求方法"""
        url = f"{self.base_url}{endpoint}"
        
        try:
            if method.upper() == 'POST':
                response = requests.post(url, json=data, timeout=60)
            elif method.upper() == 'GET':
                response = requests.get(url, timeout=60)
            else:
                raise ValueError(f"Unsupported HTTP method: {method}")
                
            response.raise_for_status()
            return response.json()
            
        except requests.exceptions.RequestException as e:
            raise Exception(f"AODT API 請求失敗: {str(e)}")

    def auto_connect(self, db_host: str = 'clickhouse', db_port: int = 9000, db_name: str = 'NYCU_API_TEST', project_id: int = 0) -> Dict[str, Any]:
        """自動連接數據庫"""
        data = {
            "db_host": db_host,
            "db_port": db_port,
            'db_name': db_name
        }
        return self._make_request('POST', '/auto_connect', data)
    
    def open_usd_stage(self, file_name: str) -> Dict[str, Any]:
        """開啟 USD Stage"""
        data = {"file_name": file_name}
        return self._make_request('POST', '/open_usd_stage', data)
    
    def set_simulation_config(self, 
                            simulation_mode: str,
                            is_full: bool,
                            mode: int,
                            duration: Optional[float] = None,
                            interval: Optional[float] = None,
                            slots_per_batch: Optional[int] = None,
                            samples_per_slot: Optional[int] = None) -> Dict[str, Any]:
        """設定模擬配置"""
        if simulation_mode == 'rsrp':
            data = {
                "is_full": is_full,
                "mode": mode,
                "duration": duration,
                "interval": interval,
                "slots_per_batch": slots_per_batch,
                "samples_per_slot": samples_per_slot
            }
        else:
            data = {
                "is_full": True,
                "mode": 1,
                "slots_per_batch": slots_per_batch,
                "samples_per_slot": samples_per_slot
            }
        return self._make_request('POST', '/set_simulation_config', data)

    def create_ru(self, x: float, y: float, z: float, ru_roll: float = 0.0) -> Dict[str, Any]:
        """創建 RU"""
        data = {
            "x": x,
            "y": y,
            "z": z,
            "ru_roll": ru_roll
        }
        return self._make_request('POST', '/create_ru', data)
    
    def create_du(self, x: float, y: float, z: float) -> Dict[str, Any]:
        """創建 DU"""
        data = {
            "x": x,
            "y": y,
            "z": z
        }
        return self._make_request('POST', '/create_du', data)
    
    def set_ru_direction(self, x: float, y: float, z: float, ru_roll: float) -> Dict[str, Any]:
        """設定 RU 方向"""
        data = {
            "x": x,
            "y": y,
            "z": z,
            "ru_roll": transform_direction(ru_roll, 0)
        }
        return self._make_request('POST', '/set_direciton', data)
    
    def create_rus_batch(self, rus: list, project_id: int, evaluation_id: int) -> Dict[str, Any]:
        """批量創建 RU - 內部方法，逐個調用創建"""
        results = []
        success_count = 0
        error_count = 0
        
        project = Project.query.get(project_id)
        evaluation = Evaluation.query.get(evaluation_id)

        if not project or not evaluation:
            return {"success": False, "message": "項目或評估不存在"}
    
        project_lat = project.lat
        project_lon = project.lon
        rotation_offset = project.rotation_offset
        lat_offset = project.lat_offset
        lon_offset = project.lon_offset
        scale = project.scale

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

                lon = ru_data['lon'] - lon_offset
                lat = ru_data['lat'] - lat_offset
                height = ru_data['z']

                x, y = rotate_latlon(lon, lat, project_lon, project_lat, -rotation_offset, scale)

                result = self.create_ru(
                    x=x,
                    y=y,
                    z=height,
                    ru_roll=transform_direction(ru_data['ru_roll'], rotation_offset)
                )
                
                if result.get('success'):
                    results.append({
                        'index': i,
                        'success': True,
                        'message': f'RU {i} 創建成功',
                        'position': (x, y, height / 100),
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
        
        return {
            'success': error_count == 0,
            'message': f'批量創建完成: {success_count} 成功, {error_count} 失敗',
            'summary': {
                'total': len(rus),
                'success_count': success_count,
                'error_count': error_count
            },
            'results': results
        }
    
    def create_dus_batch(self, dus: list, project_id: int, evaluation_id: int) -> Dict[str, Any]:
        """批量創建 DU - 內部方法，逐個調用創建"""
        results = []
        success_count = 0
        error_count = 0
        
        project = Project.query.get(project_id)
        evaluation = Evaluation.query.get(evaluation_id)

        if not project or not evaluation:
            return {"success": False, "message": "項目或評估不存在"}
    
        project_lat = project.lat
        project_lon = project.lon
        rotation_offset = project.rotation_offset
        lat_offset = project.lat_offset
        lon_offset = project.lon_offset
        scale = project.scale

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

                lon = du_data['lon'] - lon_offset
                lat = du_data['lat'] - lat_offset
                height = du_data.get('z', 0)

                x, y = rotate_latlon(lon, lat, project_lon, project_lat, -rotation_offset, scale)

                result = self.create_du(
                    x=x,
                    y=y,
                    z=0
                )
                
                if result.get('success'):
                    results.append({
                        'index': i,
                        'success': True,
                        'message': f'DU {i} 創建成功',
                        'position': (x, y, height)
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
        
        return {
            'success': error_count == 0,
            'message': f'批量創建完成: {success_count} 成功, {error_count} 失敗',
            'summary': {
                'total': len(dus),
                'success_count': success_count,
                'error_count': error_count
            },
            'results': results
        }
    
    def delete_all_rus(self) -> Dict[str, Any]:
        """刪除所有 RU"""
        return self._make_request('GET', '/delete_RU')
    
    def delete_all_dus(self) -> Dict[str, Any]:
        """刪除所有 DU"""
        return self._make_request('GET', '/delete_DU')
    
    def auto_assign_du(self) -> Dict[str, Any]:
        """自動分配 DU 給所有 RU"""
        return self._make_request('GET', '/auto_assign_DU')
    
    def create_direct_ues(self, project_id:int, x:float, y:float, radius_cm:float, count:int, throughput_ue_pt: Optional[list] = None) -> Dict[str, Any]:
        """範圍內隨機部署 UE"""
        project = Project.query.get(project_id)
        if project is None:
            return {"success": False, "message": f"Project with id {project_id} not found"}
        project_lat = project.lat
        project_lon = project.lon
        rotation_offset = project.rotation_offset
        lat_offset = project.lat_offset
        lon_offset = project.lon_offset
        scale = project.scale
        
        ue_pt = []

        if throughput_ue_pt is not None:
            if len(throughput_ue_pt) > 0 and throughput_ue_pt[0] is not None:
                lon = throughput_ue_pt[0][0] - lon_offset
                lat = throughput_ue_pt[0][1] - lat_offset
                ue_x, ue_y = rotate_latlon(lon, lat, project_lon, project_lat, -rotation_offset, scale)
                ue_pt.append([ue_x * 100, ue_y * 100])
            if len(throughput_ue_pt) > 1 and throughput_ue_pt[1] is not None:
                lon = throughput_ue_pt[1][0] - lon_offset
                lat = throughput_ue_pt[1][1] - lat_offset
                ue_x, ue_y = rotate_latlon(lon, lat, project_lon, project_lat, -rotation_offset, scale)
                ue_pt.append([ue_x * 100, ue_y * 100])

        data={
            'x': x,
            'y': y,
            'radius_cm': radius_cm,
            'count': count,
            'throughput_ue_pt': ue_pt,
        }
        return self._make_request('POST', '/create_direct_ues', data)
    
    def create_rec_ues(self, project_id: int, dis:float, throughput_ue_pt: Optional[list] = None) -> Dict[str, Any]:
        """在長方形區域內以指定距離部署 UE"""
        project = Project.query.get(project_id)
        project_lat = project.lat
        project_lon = project.lon
        rotation_offset = project.rotation_offset
        lat_offset = project.lat_offset
        lon_offset = project.lon_offset
        scale = project.scale

        if throughput_ue_pt is not None:
            if throughput_ue_pt[0] is not None:
                lon = throughput_ue_pt[0][0] - lon_offset
                lat = throughput_ue_pt[0][1] - lat_offset
                x, y = rotate_latlon(lon, lat, project_lon, project_lat, -rotation_offset, scale)
                throughput_ue_pt = [[x, y], None]
            elif throughput_ue_pt[1] is not None:
                lon = throughput_ue_pt[1][0] - lon_offset
                lat = throughput_ue_pt[1][1] - lat_offset
                x, y = rotate_latlon(lon, lat, project_lon, project_lat, -rotation_offset, scale)
                throughput_ue_pt = [None, [x,y]]

        data={
            'dis':dis,
            'throughput_ue_pt': throughput_ue_pt
        }
        return self._make_request('POST', '/create_rec_ues', data)
    
    def create_rec_ues_by_count(self, project_id: int, count:int, throughput_ue_pt: Optional[list] = None) -> Dict[str, Any]:
        """在地板區域內以指定數量部署 UE"""
        project = Project.query.get(project_id)
        if project is None:
            return {"success": False, "message": f"Project with id {project_id} not found"}
        project_lat = project.lat
        project_lon = project.lon
        rotation_offset = project.rotation_offset
        lat_offset = project.lat_offset
        lon_offset = project.lon_offset
        scale = project.scale

        ue_pt = []

        print(f"Before change: {throughput_ue_pt}")

        if throughput_ue_pt is not None:
            if len(throughput_ue_pt) > 0 and throughput_ue_pt[0] is not None:
                lon = throughput_ue_pt[0][0] - lon_offset
                lat = throughput_ue_pt[0][1] - lat_offset
                ue_x, ue_y = rotate_latlon(lon, lat, project_lon, project_lat, -rotation_offset, scale)
                ue_pt.append([ue_x * 100, ue_y * 100])
            if len(throughput_ue_pt) > 1 and throughput_ue_pt[1] is not None:
                lon = throughput_ue_pt[1][0] - lon_offset
                lat = throughput_ue_pt[1][1] - lat_offset
                ue_x, ue_y = rotate_latlon(lon, lat, project_lon, project_lat, -rotation_offset, scale)
                ue_pt.append([ue_x * 100, ue_y * 100])
        
        print(f"After change: {ue_pt}")

        data={
            'count': count,
            'throughput_ue_pt': ue_pt
        }
        return self._make_request('POST', '/create_rec_ues_by_count', data)
    
    def delete_all_ues(self) -> Dict[str, Any]:
        """刪除所有 UE"""
        return self._make_request('GET', '/delete_all_ues')
    
    def is_sim_running(self) -> Dict[str, Any]:
        """檢查是否正在進行模擬；若因 HTTP 連線失敗則嘗試重啟 AODT"""
        try:
            return self._make_request('GET', '/is_sim_running')
        except Exception as e:
            err_msg = str(e)
            # 判斷是否為連線相關錯誤（包含 urllib3/requests 常見字串）
            conn_indicators = [
                'Connection refused', 'Max retries', 'Failed to establish',
                'NewConnectionError', 'Connection aborted', 'Connection reset', 'timed out'
            ]
            if any(k in err_msg for k in conn_indicators):
                try:
                    restart_res = self.restart_aodt()
                except Exception as re:
                    restart_res = {"success": False, "error": str(re)}
                
                return  restart_res
            
            return {"success": False, "error_message": err_msg}
    
    def on_Generate_UE_mobility(self) -> Dict[str, Any]:
        """Generate UE mobility"""
        return self._make_request('GET', '/on_Generate_UE_mobility')
    
    def start_simulation(self, project_id: int, 
                         evaluation_id: int, 
                         sim_mode: str, 
                         callbackURL: str,
                         ue_start_or_end_pt: Optional[int] = None
                         ) -> Dict[str, Any]:
        """Start simulation"""
        return self._make_request('POST', '/start_simulation', data={'project_id': project_id, 
                                                                     'evaluation_id': evaluation_id, 
                                                                     'sim_mode': sim_mode, 
                                                                     'callbackURL': callbackURL,
                                                                     'ue_start_or_end_pt': ue_start_or_end_pt,
                                                                     })

    def get_heatmap(self, project_id: int) -> Dict[str, Any]:
        """暫時性的function，從AODT抓heatmap"""
        data={
            'project_id': project_id
        }
        return self._make_request('POST', '/CFR2RSRP', data)

    def get_simulation_progress(self) -> Dict[str, Any]:
        """獲取模擬進度"""
        return self._make_request('GET', '/get_simulation_progress')

    def create_panel(self, 
                     type: list, 
                     carrier_frequency: float = 4700.0, 
                     horizontal_spacing: float = 100.0, 
                     vertical_spacing: float = 100.0) -> Dict[str, Any]:
        """創建 Panel"""
        data = {
            "element_types": type,
            "carrier_frequency": carrier_frequency,
            "horizontal_spacing": horizontal_spacing,
            "vertical_spacing": vertical_spacing
        }
        return self._make_request('POST', '/create_panel', data)

    def create_panels_batch(self, count: int) -> Dict[str, Any]:
        """批量創建多個 Panel - 內部方法，逐個調用創建"""
        results = []
        success_count = 0
        error_count = 0
        
        for i in range(count):
            try:
                if i == 0:
                    result = self.create_panel(["isotropic"], 4700.0, 100.0, 100.0)
                else:
                    result = self.create_panel(["rec_microstrip_patch"], 4700.0, 200.0, 200.0)

                if result.get('success'):
                    results.append({
                        'index': i,
                        'success': True,
                        'message': f'Panel {i+1} 創建成功',
                        'panel_path': result.get('panel_path'),
                        'panel_name': result.get('panel_name')
                    })
                    success_count += 1
                else:
                    results.append({
                        'index': i,
                        'success': False,
                        'message': f'Panel {i+1} 創建失敗: {result.get("error", "未知錯誤")}'
                    })
                    error_count += 1
                    
            except Exception as e:
                results.append({
                    'index': i,
                    'success': False,
                    'message': f'Panel {i+1} 創建異常: {str(e)}'
                })
                error_count += 1
        
        return {
            'success': error_count == 0,
            'message': f'批量創建完成: {success_count} 成功, {error_count} 失敗',
            'summary': {
                'total': count,
                'success_count': success_count,
                'error_count': error_count
            },
            'results': results
        }
    
    def delete_file(self, directory_path: str) -> Dict[str, Any]:
        """刪除 AODT 文件"""
        data = {"directory_path": directory_path}
        return self._make_request('POST', '/delete-files', data)

    def create_files(self, file_path: str, usd_data: str) -> Dict[str, Any]:
        """創建 AODT 文件"""
        data = {"file_path": file_path, "content": usd_data}
        return self._make_request('POST', '/create-file', data)

    def check_panel_config(self) -> Dict[str, Any]:
        """檢查 Panel 配置"""
        return self._make_request('GET', '/check_panel_config')

    def get_panel_count(self) -> Dict[str, Any]:
        """取得當前場景中 Panel 的數量"""
        return self._make_request('GET', '/get_panel_count')
    
    def restart_aodt(self) -> Dict[str, Any]:
        """重新啟動 AODT 服務"""
        try:
            request_url = f"{AODT_AGENT_BASE_URL}/restart"
            response = requests.post(request_url)
            response.raise_for_status()
            return response.json()
        except requests.RequestException as e:
            return {"success": False, "error": str(e)}

    def update_ru_properties(self, ru_path: str, height: Optional[float] = None, 
                           mech_azimuth: Optional[float] = None, 
                           mech_tilt: Optional[float] = None) -> Dict[str, Any]:
        """更新 RU 屬性"""
        # 確保路徑格式正確
        if not ru_path.startswith('/'):
            ru_path = '/' + ru_path
            
        # 根據 AODT API 的 Pydantic 模型要求構建數據
        data = {"ru_path": ru_path}
        
        if height is not None:
            data["height"] = float(height)
        if mech_azimuth is not None:
            data["mech_azimuth"] = float(mech_azimuth)
        if mech_tilt is not None:
            data["mech_tilt"] = float(mech_tilt)
        
        try:
            return self._make_request('POST', '/update_ru_properties', data)
        except Exception as e:
            return {
                "success": False,
                "error_message": f"API request failed: {str(e)}",
                "request_data": data
            }

    def get_ru_properties(self, ru_path: str) -> Dict[str, Any]:
        """獲取 RU 屬性"""
        # 確保路徑以 / 開頭
        if not ru_path.startswith('/'):
            ru_path = '/' + ru_path
        
        # 對路徑進行 URL 編碼處理，但保持正確的API路徑格式
        from urllib.parse import quote
        # 移除開頭的 / 來避免雙斜線
        path_without_slash = ru_path[1:] if ru_path.startswith('/') else ru_path
        encoded_path = quote(path_without_slash, safe='/')
        
        try:
            return self._make_request('GET', f'/get_ru_properties/{encoded_path}')
        except Exception as e:
            return {
                "success": False,
                "error": f"API request failed: {str(e)}",
                "ru_path": ru_path
            }
        
    def update_path_visualization(self, max_num_paths: Optional[int] = None,
                                  em_rays: Optional[int] = None,
                                  em_interactions: Optional[int] = None) -> Dict[str, Any]:
        """更新路徑可視化參數（呼叫 AODT API）

        參數都是選填，至少需要提供一個。
        """
        data: Dict[str, Any] = {}
        if max_num_paths is not None:
            data["max_num_paths"] = int(max_num_paths)
        if em_rays is not None:
            data["em_rays"] = int(em_rays)
        if em_interactions is not None:
            data["em_interactions"] = int(em_interactions)

        if not data:
            return {"success": False, "error": "No parameters provided to update"}

        try:
            return self._make_request('POST', '/update_path_visualization', data)
        except Exception as e:
            return {"success": False, "error_message": f"AODT API request failed: {str(e)}", "request_data": data}

    def get_path_visualization(self) -> Dict[str, Any]:
        """取得目前的路徑可視化參數（從 AODT 取得）"""
        try:
            return self._make_request('GET', '/get_path_visualization')
        except Exception as e:
            return {"success": False, "error": f"AODT API request failed: {str(e)}"}
        
    def update_ue_properties(self,
                             ue_height: Optional[float] = None,
                             sphere_radius: Optional[float] = None,
                             max_speed: Optional[float] = None,
                             min_speed: Optional[float] = None) -> Dict[str, Any]:
        """更新 UE 屬性（呼叫 AODT API）

        至少需提供一個要更新的參數，否則會回傳 error。
        """
        data: Dict[str, Any] = {}
        if ue_height is not None:
            data["ue_height"] = float(ue_height)
        if sphere_radius is not None:
            data["sphere_radius"] = float(sphere_radius)
        if max_speed is not None:
            data["max_speed"] = float(max_speed)
        if min_speed is not None:
            data["min_speed"] = float(min_speed)

        if not data:
            return {"success": False, "error": "No parameters provided to update"}

        try:
            return self._make_request('POST', '/update_ue_properties', data)
        except Exception as e:
            return {"success": False, "error_message": f"AODT API request failed: {str(e)}", "request_data": data}

    def get_ue_properties(self) -> Dict[str, Any]:
        """取得目前的 UE 屬性（從 AODT 取得）"""
        try:
            return self._make_request('GET', '/get_ue_properties')
        except Exception as e:
            return {"success": False, "error": f"AODT API request failed: {str(e)}"}
        
    def update_ru_power(self, ru_path: str, radiated_power: float) -> Dict[str, Any]:
        """更新 RU 輻射功率（dBm）。

        參數:
            ru_path: RU 在 USD stage 中的路徑（例如 '/RUs/ru_0001'）
            radiated_power: 輻射功率，單位 dBm，允許範圍 -20.0 到 80.0

        回傳: AODT API 的 JSON 回應字典，若本地檢查失敗則回傳 success=False 與 error 說明。
        """
        # 檢查並轉型 radiated_power
        try:
            rp = float(radiated_power)
        except (TypeError, ValueError):
            return {"success": False, "error": "radiated_power must be a number"}

        # 範圍驗證
        if rp < -20.0 or rp > 80.0:
            return {"success": False, "error": "radiated_power out of valid range (-20.0 to 80.0 dBm)"}

        data = {
            "ru_path": ru_path,
            "radiated_power": rp
        }

        try:
            return self._make_request('POST', '/update_ru_power', data)
        except Exception as e:
            return {"success": False, "error_message": f"AODT API request failed: {str(e)}", "request_data": data}
        
    def get_ru_location(self, rus: list, project_id: int, evaluation_id: int) -> Dict[str, Any]:
        """拿到RU位置"""
        
        project = Project.query.get(project_id)
        evaluation = Evaluation.query.get(evaluation_id)

        if not project or not evaluation:
            return {"success": False, "message": "項目或評估不存在"}
    
        project_lat = project.lat
        project_lon = project.lon
        rotation_offset = project.rotation_offset
        lat_offset = project.lat_offset
        lon_offset = project.lon_offset
        scale = project.scale

        results = []
        for ru_data in rus:

            lon = ru_data['lon'] - lon_offset
            lat = ru_data['lat'] - lat_offset

            x, y = rotate_latlon(lon, lat, project_lon, project_lat, -rotation_offset, scale)
            results.append({'x': x, 'y': y})

            
        return {"success": True, "locations": results}
