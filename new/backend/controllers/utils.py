import requests
import json
import os 

GRAFANA_ADMIN_USER = os.getenv("GRAFANA_ADMIN_USER")
GRAFANA_ADMIN_PASSWORD = os.getenv("GRAFANA_ADMIN_PASSWORD")
GRAFANA_URL = os.getenv("GRAFANA_URL")

def create_grafana_user(account, password, email):
    """建立 Grafana 使用者"""
    create_user_url = f"{GRAFANA_URL}/api/admin/users"
    
    user_payload = {
        "name": account,
        "email": email,
        "login": account,
        "password": password,
    }
    
    headers = {"Content-Type": "application/json"}
    
    try:
        response = requests.post(
            create_user_url,
            auth=(GRAFANA_ADMIN_USER, GRAFANA_ADMIN_PASSWORD),
            data=json.dumps(user_payload),
            headers=headers,
            timeout=10
        )
        
        if response.status_code == 200:
            print(response.json())
            return {"success": True, "data": response.json()}
        else:
            return {
                "success": False, 
                "error": f"Status Code: {response.status_code}, Response: {response.text}"
            }
            
    except requests.exceptions.ConnectionError as e:
        return {
            "success": False,
            "error": f"無法連線至 Grafana: {str(e)}"
        }
    except Exception as e:
        return {
            "success": False,
            "error": f"建立 Grafana 使用者時發生錯誤: {str(e)}"
        }

def create_grafana_folder(project_name, account):
    """建立 Grafana 資料夾並設定權限"""
    headers = {"Content-Type": "application/json"}
    
    try:
        # 步驟 1: 查詢使用者 ID
        get_user_url = f"{GRAFANA_URL}/api/users/lookup?loginOrEmail={account}"
        user_response = requests.get(
            get_user_url,
            auth=(GRAFANA_ADMIN_USER, GRAFANA_ADMIN_PASSWORD),
            headers=headers,
            timeout=10
        )
        
        if user_response.status_code != 200:
            return {
                "success": False,
                "error": f"查詢使用者失敗: {user_response.text}"
            }
        
        user_data = user_response.json()
        user_id = user_data.get("id")
        
        if not user_id:
            return {
                "success": False,
                "error": f"無法找到使用者 {account} 的 ID"
            }
        
        # 步驟 2: 建立資料夾
        create_folder_url = f"{GRAFANA_URL}/api/folders"
        folder_payload = {"title": f"{project_name}-folder"}
        folder_response = requests.post(
            create_folder_url,
            auth=(GRAFANA_ADMIN_USER, GRAFANA_ADMIN_PASSWORD),
            data=json.dumps(folder_payload),
            headers=headers,
            timeout=10
        )
        
        if folder_response.status_code != 200:
            return {
                "success": False,
                "error": f"建立資料夾失敗: {folder_response.text}"
            }
        
        folder_uid = folder_response.json().get("uid")
        
        # 步驟 3: 設定權限
        permissions_url = f"{GRAFANA_URL}/api/folders/{folder_uid}/permissions"
        permissions_payload = {
            "items": [
                {"userId": user_id, "permission": 2},
                {"role": "Admin", "permission": 4},
            ]
        }
        perm_response = requests.post(
            permissions_url,
            auth=(GRAFANA_ADMIN_USER, GRAFANA_ADMIN_PASSWORD),
            data=json.dumps(permissions_payload),
            headers=headers,
            timeout=10
        )
        
        if perm_response.status_code != 200:
            return {
                "success": False,
                "error": f"設定權限失敗: {perm_response.text}"
            }
        
        return {
            "success": True,
            "data": {
                "folder_uid": folder_uid,
                "folder_title": f"{project_name}-folder"
            }
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": f"建立 Grafana 資料夾時發生錯誤: {str(e)}"
        }
    
def create_grafana_dashboard(folder_uid, dashboard_title, account, dashboard_config=None):
    """在指定的 Grafana 資料夾中建立 Dashboard"""
    headers = {"Content-Type": "application/json"}
    
    try:
        # 預設的 Dashboard 配置
        default_dashboard = {
            "dashboard": {
                "id": None,
                "title": dashboard_title,
                "tags": ["5G", "O-RAN"],
                "timezone": "browser",
                "panels": [
                    {
                        "id": 1,
                        "title": "範例面板",
                        "type": "stat",
                        "targets": [
                            {
                                "expr": "up",
                                "refId": "A"
                            }
                        ],
                        "gridPos": {
                            "h": 8,
                            "w": 12,
                            "x": 0,
                            "y": 0
                        }
                    }
                ],
                "time": {
                    "from": "now-6h",
                    "to": "now"
                },
                "timepicker": {},
                "templating": {
                    "list": []
                },
                "annotations": {
                    "list": []
                },
                "refresh": "5s",
                "schemaVersion": 27,
                "version": 0,
                "links": []
            },
            "folderUid": folder_uid,
            "message": f"Created by {account}",
            "overwrite": False
        }
        
        dashboard_payload = dashboard_config if dashboard_config else default_dashboard
        
        if dashboard_config:
            dashboard_payload["folderUid"] = folder_uid
        
        # 建立 Dashboard
        create_dashboard_url = f"{GRAFANA_URL}/api/dashboards/db"
        
        response = requests.post(
            create_dashboard_url,
            auth=(GRAFANA_ADMIN_USER, GRAFANA_ADMIN_PASSWORD),
            data=json.dumps(dashboard_payload),
            headers=headers,
            timeout=10
        )
        
        if response.status_code == 200:
            dashboard_data = response.json()
            return {
                "success": True,
                "data": {
                    "dashboard_uid": dashboard_data.get("uid"),
                    "dashboard_url": dashboard_data.get("url"),
                    "dashboard_id": dashboard_data.get("id"),
                    "title": dashboard_title,
                    "folder_uid": folder_uid
                }
            }
        else:
            return {
                "success": False,
                "error": f"建立 Dashboard 失敗 - Status Code: {response.status_code}, Response: {response.text}"
            }
            
    except Exception as e:
        return {
            "success": False,
            "error": f"建立 Grafana Dashboard 時發生錯誤: {str(e)}"
        }


def delete_grafana_dashboard(dashboard_uid):
    """刪除指定的 Grafana Dashboard"""
    headers = {"Content-Type": "application/json"}
    
    try:
        delete_dashboard_url = f"{GRAFANA_URL}/api/dashboards/uid/{dashboard_uid}"
        
        response = requests.delete(
            delete_dashboard_url,
            auth=(GRAFANA_ADMIN_USER, GRAFANA_ADMIN_PASSWORD),
            headers=headers,
            timeout=10
        )
        
        if response.status_code == 200:
            return {"success": True, "message": "Dashboard deleted successfully"}
        else:
            return {
                "success": False,
                "error": f"刪除 Dashboard 失敗 - Status Code: {response.status_code}, Response: {response.text}"
            }
            
    except Exception as e:
        return {
            "success": False,
            "error": f"刪除 Grafana Dashboard 時發生錯誤: {str(e)}"
        }
    
def delete_grafana_user(user_id):
    """刪除指定的 Grafana 使用者"""
    headers = {"Content-Type": "application/json"}
    
    try:
        delete_user_url = f"{GRAFANA_URL}/api/admin/users/{user_id}"
        
        response = requests.delete(
            delete_user_url,
            auth=(GRAFANA_ADMIN_USER, GRAFANA_ADMIN_PASSWORD),
            headers=headers,
            timeout=10
        )
        
        if response.status_code == 200:
            return {"success": True, "message": "User deleted successfully"}
        else:
            return {
                "success": False,
                "error": f"刪除使用者失敗 - Status Code: {response.status_code}, Response: {response.text}"
            }
            
    except Exception as e:
        return {
            "success": False,
            "error": f"刪除 Grafana 使用者時發生錯誤: {str(e)}"
        }
