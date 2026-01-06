import os
import requests
from flask import jsonify, Blueprint

gnb_status_bp = Blueprint('gnb_status', __name__)

# --- GNB Status API ---
@gnb_status_bp.route('/gnb_status', methods=['GET'])
def get_gnb_status():
    url = os.getenv('GNB_STATUS_API_URL')
    if not url:
        return {'message': 'GNB_STATUS_API_URL not set'}, 500
    try:
        resp = requests.get(url, timeout=10)
        resp.raise_for_status()
        data = resp.json()
        result = []
        for item in data:
            # Expect new structure: {"gNB_ID": <int>, "GPS_Info": "緯度: <lat>\n 經度: <lon>"}
            info = item.get('GPS_Info')
            if info is None or info == 'N/A':
                result.append({'id': item.get('gNB_ID'), 'lat': None, 'lon': None})
            elif isinstance(info, str) and '緯度' in info and '經度' in info:
                lat = None
                lon = None
                for line in info.split('\n'):
                    line = line.strip()
                    if line.startswith('緯度:'):
                        try:
                            lat = float(line.replace('緯度:', '').strip())
                        except Exception:
                            lat = None
                    elif line.startswith('經度:'):
                        try:
                            lon = float(line.replace('經度:', '').strip())
                        except Exception:
                            lon = None
                result.append({'id': item.get('gNB_ID'), 'lat': lat, 'lon': lon})
            else:
                result.append({'id': item.get('gNB_ID'), 'lat': None, 'lon': None})
        return jsonify(result)
    except Exception as e:
        return {'message': f'Failed to fetch GNB status: {str(e)}'}, 502
