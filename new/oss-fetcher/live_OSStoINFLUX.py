import requests
import time
import os
from datetime import datetime, timedelta, timezone
import dateutil.parser
from influxdb import InfluxDBClient
from dotenv import load_dotenv

load_dotenv()

# OSS 撈資料的 URL、共用 Header (可根據需要調整)
base_url = os.getenv("OSS_BASE_URL")
OSS_AUTHORIZATION = os.getenv("OSS_AUTHORIZATION")
headers = {
    "accept": "application/json",
    "Authorization": f"Bearer {OSS_AUTHORIZATION}",
}

# influxdb container
INFLUXDB_HOST = os.getenv("INFLUXDB_HOST")
INFLUXDB_PORT = os.getenv("INFLUXDB_PORT")
INFLUXDB_DB = os.getenv("INFLUXDB_DB")
INFLUXDB_ADMIN_USER = os.getenv("INFLUXDB_ADMIN_USER")
INFLUXDB_ADMIN_PASSWORD = os.getenv("INFLUXDB_ADMIN_PASSWORD")

client = InfluxDBClient(host=INFLUXDB_HOST, 
                        port=INFLUXDB_PORT, 
                        database=INFLUXDB_DB,
                        username=INFLUXDB_ADMIN_USER,
                        password=INFLUXDB_ADMIN_PASSWORD)

# 對於需帶入 gnbId 的 API，請設定 gnb id 清單（依實際環境調整）
gnb_ids = [1, 2]


# pm raw API 的 measurement 名稱清單
measurement_names = [
    "accessibility-drbAccessibility",
    "retainability-drbRetain",
    "availability-cellAvailability",
    # "mobility-granHoS",
    "prbutilization-dlPrbUtilization",
    "prbutilization-ulPrbUtilization",
    "energySaving-drbPdcpSduVolDl",
    "energySaving-drbPdcpSduVolUl"
]


# 每秒執行一次資料蒐集
next_time = datetime.now(timezone.utc) # 這是標準時間，(台灣時間-8hr)

# timestamp 相關常數
PYTHON_TS_TO_OSS_TS = 1000
OSS_TS_TO_INFLUX_TS = 1000000


loop_count = 0  # 新增一個統計變數
while True:
    loop_count += 1  # 計算迴圈次數
    current_time = datetime.now(timezone.utc)
    if current_time < next_time:
        time.sleep((next_time - current_time).total_seconds())

    # 設定統一的查詢時間區間：從 15 秒前到 14 秒前的 1 秒區間
    start_time_ms = int((current_time - timedelta(seconds=15)).timestamp() * PYTHON_TS_TO_OSS_TS) # timestamp() 有 10 digits，OSS api param 需 13 digits
    end_time_ms = int((current_time - timedelta(seconds=14)).timestamp() * PYTHON_TS_TO_OSS_TS) # timestamp() 有 10 digits，OSS api param 需 13 digits

    timestamp = end_time_ms 

    # 1. API: /v1/gnb/{gnbId}/ueList
    ueList_record = {"timestamp": timestamp, "data": {}}
    for gnb in gnb_ids:
        url_ueList = f"{base_url}/v1/gnb/{gnb}/ueList"
        params = {"_startTime": start_time_ms, "_endTime": end_time_ms}
        try:
            resp = requests.get(url_ueList, headers=headers, params=params)
            if resp.status_code == 200:
                ueList_record["data"][str(gnb)] = resp.json()
            else:
                ueList_record["data"][str(gnb)] = {
                    "error": f"HTTP {resp.status_code}",
                    "response": resp.text,
                }
        except requests.RequestException as e:
            ueList_record["data"][str(gnb)] = {"error": str(e)}

        for gNB_id, ue_list in ueList_record["data"].items():
            if isinstance(ue_list, list):
                for ue_data in ue_list:
                    uedata_json = [
                        {   
                            "measurement": "ueList_test",
                            "time": ueList_record['timestamp']*OSS_TS_TO_INFLUX_TS, # ueList_record['timestamp'] 有 13 digits，influx db 的 time 欄位有 19 digits
                            "fields": {
                                "mytime" : datetime.fromtimestamp(int(ueList_record['timestamp']) / PYTHON_TS_TO_OSS_TS).isoformat(),
                                "gNB_id" : str(gNB_id),
                                "supi" : str(ue_data["supi"]),
                                "ranRegisteredState" : str(ue_data["ranRegisteredState"]),
                                "fgcConnectedState" : str(ue_data["fgcConnectedState"]),
                                "CellRadioNetworkTemp_id" : str(ue_data["crnti"]),
                                "PhysicalCell_id": str(ue_data["pci"]),
                                "TrackingAreaCode": str(ue_data["tac"]),
                                "DataNetworkName": str(ue_data["dnn"]),
                                "dl_sinr": float(ue_data["dl_sinr"]),
                                "dl_rsrp": float(ue_data["dl_rsrp"]),
                                "nrCellId": str(ue_data["nrCellId"]),
                                "dlThroughputBps": float(ue_data["dlThroughputBps"]),
                                "ulThroughputBps": float(ue_data["ulThroughputBps"])
                            },
                            
                        }
                    ]

                    client.write_points(uedata_json)
        
    # 2. API: /v1/report/ric/pm/raw － 針對所有 measurement
    pm_raw_record = {"timestamp": timestamp, "data": {}}
    url_pm_raw = f"{base_url}/v1/report/ric/pm/raw"
    for measurement in measurement_names:
        params = {
            "measurementName": measurement,
            "_startTime": start_time_ms,
            "_endTime": end_time_ms,
            "_size": 500,
            "_sort": "time DESC",
        }
        try:
            resp = requests.get(url_pm_raw, headers=headers, params=params)
            if resp.status_code == 200:
                data = resp.json()
                
                # 如果回傳為物件且有 content 欄位，取 content；否則存整個回傳結果
                if isinstance(data, dict) and "content" in data:
                    pm_raw_record["data"][measurement] = data["content"]
                    if  data["content"]:
                        pmdata_json = [
                            {   
                                "measurement": "pm_test",
                                "time" : dateutil.parser.isoparse(data["content"][0]["time"]),
                                "fields": {
                                    "measurementName" : str(data["content"][0]["measurementName"]),
                                    "gNB_id" : str(data["content"][0].get("gnbId", "not_indicated")),
                                    "nci" : str(data["content"][0].get("nci", "not_indicated")),
                                    "mytime" : datetime.fromtimestamp(int(data["content"][0]['measurementTime']) / PYTHON_TS_TO_OSS_TS).isoformat(),
                                    "value" : float(data["content"][0]["value"])

                                },
                                
                            }
                        ]

                        client.write_points(pmdata_json)
                        
                        
                else:
                    pm_raw_record["data"][measurement] = data
            else:
                pm_raw_record["data"][measurement] = {
                    "error": f"HTTP {resp.status_code}",
                    "response": resp.text,
                }
        except Exception as e:
            pm_raw_record["data"][measurement] = {"error": str(e)}
        


    
    # 3. API: /v1/report/ric/fm
    fm_record = {"timestamp": timestamp}
    url_fm = f"{base_url}/v1/report/ric/fm"
    params = {
        "_startTime": start_time_ms,
        "_endTime": end_time_ms,
        "_size": 100,
        "_sort": "time DESC",
    }
    try:
        resp = requests.get(url_fm, headers=headers, params=params)
        if resp.status_code == 200:
            fm_record["data"] = resp.json()
        else:
            fm_record["data"] = {
                "error": f"HTTP {resp.status_code}",
                "response": resp.text,
            }
    except Exception as e:
        fm_record["data"] = {"error": str(e)}
    
    if "content" in fm_record['data']:

        if fm_record["data"]["content"]:

            for per_fm_record in fm_record["data"]["content"]:
            
                fmdata_json = [
                    {   
                        "measurement": "fm_test",
                        "time": dateutil.parser.isoparse(per_fm_record["time"]), 
                        "fields": {
                            "mytime": str(per_fm_record["time"]),
                            "alarmType": str(per_fm_record["alarmType"]),
                            "description": str(per_fm_record["description"]),
                            "sop": str(per_fm_record["sop"]),
                        }
                    
                    }
                ]
                client.write_points(fmdata_json)
                


    # 4. API: /v1/tools/timeSync/duDevices/state
    ptp_record = {"timestamp": timestamp}
    url_ptp = f"{base_url}/v1/tools/timeSync/duDevices/state"
    
    DU_IP_1 = os.getenv("DU_IP_1")
    DU_IP_2 = os.getenv("DU_IP_2")
    ru_id_list = [DU_IP_1, DU_IP_2]
    
    for ru_id in ru_id_list:
        params = {
            "_startTime": start_time_ms,
            "_endTime": end_time_ms,
            "host": ru_id
        }
        try:
            resp = requests.get(url_ptp, headers=headers, params=params)
            if resp.status_code == 200:
                ptp_record["data"] = resp.json()
            else:
                ptp_record["data"] = {
                    "error": f"HTTP {resp.status_code}",
                    "response": resp.text,
                }
        except Exception as e:
            ptp_record["data"] = {"error": str(e)}
        
        for per_ptp_record in ptp_record["data"]:
            ptpdata_json = [
                {
                    "measurement": "ptp_test",
                    "time": dateutil.parser.isoparse(per_ptp_record["time"]),
                    "fields": {
                        "mytime": str(per_ptp_record["time"]),
                        "ru_id":ru_id,
                        "lockStateCode": str(per_ptp_record["lockStateCode"]),
                        "lockState": str(per_ptp_record["lockState"])
                    }
                }
            ]
        
            client.write_points(ptpdata_json)
            

        

    # 設定下一次執行時間（每秒）
    next_time = datetime.now(timezone.utc) + timedelta(seconds=1)

    
