import requests
import json
import os

GML2USD_SERVICE_URL = os.getenv('GML2USD_SERVICE_URL')

def generate_usd(output, mapinfo):

    header = {
        "Content-Type": "application/json"
    }
    request_url = f"{GML2USD_SERVICE_URL}/process_gml"
    try:
        respond = requests.post(
            request_url,
            data=json.dumps(mapinfo),
            headers=header,
            timeout=120
        )
    except requests.exceptions.Timeout:
        return {"success":False, "message": "generator timeout", "status_code": 522}
    if respond.status_code == 200:
        with open(output,"wb") as usd_file:
            usd_file.write(respond.content)
        return_obj = {
            "success":True,
            "status_code": respond.status_code
        }
        return return_obj
    #fail, forward information
    data = respond.json()
    return_obj = {
        "success":False,
        "status_code": respond.status_code,
        "status": data.get("status","error"),
        "message": data.get("message",""),
        "details": data.get("details",""),
        "stack_trace": data.get("stack_trace","")
    }
    return return_obj

