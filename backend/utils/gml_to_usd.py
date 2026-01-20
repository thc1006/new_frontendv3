import requests
import os

GML2USD_SERVICE_URL = os.getenv('GML2USD_SERVICE_URL')
DEFULT_EPSG =  os.getenv("DEFAULT_EPSG")

def gml_to_usd(input, output=None, project_id=0):
    # Check if the input file exists
    if not os.path.exists(input):
        raise FileNotFoundError(f"Input file '{input}' does not exist.")
    epsg_in = DEFULT_EPSG
    request_url = f"{GML2USD_SERVICE_URL}/to_usd"
    with open(input, 'rb') as gml_file:
        try:
            response = requests.post(
                request_url, 
                files={'gml_file': gml_file},
                data={'epsg_in': epsg_in ,'project_id': project_id },
                timeout=120
            )
        except requests.exceptions.Timeout:
            return {"success":False, "message": "generator timeout", "status_code": 522}
    if response.status_code == 200:
        with open(output, "wb") as f:
            f.write(response.content)
        return {"success":True, "status_code": 200}
    data = response.json()
    return {
        "success":False,
        "status_code": response.status_code,
        "status": data.get("status","error"),
        "message": data.get("message",""),
        "details": data.get("details",""),
        "stack_trace": data.get("stack_trace","")
    }

