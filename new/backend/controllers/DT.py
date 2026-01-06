from flask import Blueprint, request
from models.Evaluation import Evaluation
from models.Project import Project
from controllers.minIO import get_json_data, bucket_exists
from utils.minIOName import MinIOName
from enums.HeatmapState import HeatmapState
import os
import json
import math
from config import CALCULATION_CALLBACK_BASE_URL
from models import db

import requests

dt_bp = Blueprint('dt', __name__)

NETDT_URL = os.getenv('NETDT_URL')
RANDT_URL = os.getenv('RANDT_URL')

def rotate_latlon(lon, lat, origin_lon, origin_lat, rotation_offset_deg):    # 經緯度轉平面座標（以原點為中心，單位：公尺）
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

    return x_rot, y_rot

@dt_bp.route('/netDT/<int:evaluation_id>', methods=['POST'])
def start_netDT(evaluation_id):
    print(f"Starting netDT for evaluation_id: {evaluation_id}")
    evaluation = Evaluation.query.get(evaluation_id)
    if not evaluation and evaluation_id != 0:
        return {'message': 'Evaluation not found'}, 404

    project_id = evaluation.project_id
    evaluation.rsrp_dt_status = HeatmapState.WAITING
    db.session.commit()

    minio_name = MinIOName.evaluation_rsrp_heatmap(evaluation_id)

    if not bucket_exists('rsrp'):
        evaluation.rsrp_dt_status = HeatmapState.FAILURE
        db.session.commit()
        return {'message': 'Bucket rsrp does not exist'}, 404

    try:
        heatmap = get_json_data('rsrp', minio_name)
        heatmap = json.loads(heatmap)
        if not heatmap:
            evaluation.rsrp_dt_status = HeatmapState.FAILURE
            db.session.commit()
            return {'message': 'No data found in MinIO'}, 404
    except Exception as e:
        evaluation.rsrp_dt_status = HeatmapState.FAILURE
        db.session.commit()
        return {'message': 'Error retrieving data from MinIO', 'error': str(e)}, 500

    try:
        callbackURL_response = requests.get("http://ngrok:4040/api/tunnels")
        callbackURL_data = callbackURL_response.json()
        callbackURL_tunnel = callbackURL_data.get('tunnels', [])
        callbackURL = callbackURL_tunnel[0]['public_url'] if callbackURL_tunnel else None

    except Exception:
        callbackURL = CALCULATION_CALLBACK_BASE_URL

    request_data = {
        "project_id": project_id,
        "evaluation_id": evaluation_id,
        "heatmap": heatmap,
        "api_url": callbackURL
    }
    
    try:
        response = requests.post(NETDT_URL, json=request_data)
        response.raise_for_status()
        if response.status_code != 200:
            evaluation.rsrp_dt_status = HeatmapState.FAILURE
            db.session.commit()
            return {'message': 'Failed to start netDT', 'error': response.text, 'request_data': request_data}, 500
    except requests.RequestException as e:
        evaluation.rsrp_dt_status = HeatmapState.FAILURE
        db.session.commit()
        return {'message': 'Error calling netDT API', 'error': str(e), 'request_data': request_data}, 500

    return {'message': 'netDT started successfully'}, 200

@dt_bp.route('/ranDT/<int:evaluation_id>', methods=['POST'])
def start_ranDT(evaluation_id):                # noqa: MC0001
    evaluation = Evaluation.query.get(evaluation_id)

    data = request.get_json()

    if (not evaluation and evaluation_id != 0) or not data:
        return {'message': 'Evaluation not found'}, 404

    project_id = evaluation.project_id

    project = Project.query.get(project_id)
    project_lat = project.lat
    project_lon = project.lon
    rotation_offset = project.rotation_offset
    lat_offset = project.lat_offset
    lon_offset = project.lon_offset

    ue_start_end = data.get("ue_start_end_pt", None)

    ue_pt = []

    ru_current = 0
    rus_id = []
    

    if ue_start_end:
        if ue_start_end[0] is not None:
            lon = ue_start_end[0][0] - lon_offset
            lat = ue_start_end[0][1] - lat_offset
            x, y = rotate_latlon(lon, lat, project_lon, project_lat, -rotation_offset)
            ue_pt.append({"ue_x": x * 100, "ue_y": y * 100})
        if ue_start_end[1] is not None:
            lon = ue_start_end[1][0] - lon_offset
            lat = ue_start_end[1][1] - lat_offset
            x, y = rotate_latlon(lon, lat, project_lon, project_lat, -rotation_offset)
            ue_pt.append({"ue_x": x * 100, "ue_y": y * 100})

    rsrp_dt_data = get_json_data('rsrp-dt', MinIOName.evaluation_rsrp_dt_heatmap(evaluation_id))

    rsrp_dt_data = json.loads(rsrp_dt_data)

    ru_len = len(rsrp_dt_data[0]["rus"])
    tolerance = 1e-3

    # find the ru id for start and end
    if len(ue_pt) > 0:
        for r in rsrp_dt_data:
            if abs(r["ms_x"] - ue_pt[0]["ue_x"]) < tolerance and abs(r["ms_y"] - ue_pt[0]["ue_y"]) < tolerance:
                rus_id.append(r["rus"].index(max(r["rus"])))
                ru_current += 1
                break
    
    throughput_threshold = -60
    # find other two ue position
    while True:
        for r in rsrp_dt_data:
            if ru_len == ru_current:
                break
            if max(r["rus"]) <= throughput_threshold:
                continue
            if len(ue_pt) > 0 and ue_pt[0]:
                if abs(r["ms_x"] - ue_pt[0]["ue_x"]) < tolerance and abs(r["ms_y"] - ue_pt[0]["ue_y"]) < tolerance:
                    continue
            if len(ue_pt) > 1 and ue_pt[1]:
                if abs(r["ms_x"] - ue_pt[1]["ue_x"]) < tolerance and abs(r["ms_y"] - ue_pt[1]["ue_y"]) < tolerance:
                    continue
            max_ru_id = r["rus"].index(max(r["rus"]))
            if max_ru_id in rus_id:
                continue
            rus_id.append(max_ru_id)
            ue_pt.append({"ue_x": r["ms_x"], "ue_y": r["ms_y"]})
            ru_current += 1
        
        if len(ue_pt) >= ru_len + 1 or ru_current >= ru_len:
            break
        else:
            throughput_threshold -= 5

    evaluation.throughput_dt_status = HeatmapState.WAITING
    db.session.commit()
    minio_name = MinIOName.evaluation_rsrp_dt_heatmap(evaluation_id)

    if not bucket_exists('rsrp-dt'):
        evaluation.throughput_dt_status = HeatmapState.FAILURE
        db.session.commit()
        return {'message': 'Bucket rsrp-dt does not exist'}, 404

    try:
        heatmap = get_json_data('rsrp-dt', minio_name)
        heatmap = json.loads(heatmap)
        if not heatmap:
            evaluation.throughput_dt_status = HeatmapState.FAILURE
            db.session.commit()
            return {'message': 'No data found in MinIO'}, 404
    except Exception as e:
        evaluation.throughput_dt_status = HeatmapState.FAILURE
        db.session.commit()
        return {'message': 'Error retrieving data from MinIO', 'error': str(e)}, 500

    try:
        callbackURL_response = requests.get("http://ngrok:4040/api/tunnels")
        callbackURL_data = callbackURL_response.json()
        callbackURL_tunnel = callbackURL_data.get('tunnels', [])
        callbackURL = callbackURL_tunnel[0]['public_url'] if callbackURL_tunnel else None

    except Exception:
        callbackURL = CALCULATION_CALLBACK_BASE_URL

    request_data = {
        "project_id": project_id,
        "evaluation_id": evaluation_id,
        "heatmap": heatmap,
        "api_url": callbackURL,
        "ue_xy": ue_pt
    }

    try:
        response = requests.post(RANDT_URL, json=request_data)
        response.raise_for_status()
        if response.status_code != 200:
            evaluation.throughput_dt_status = HeatmapState.FAILURE
            db.session.commit()
            return {'message': 'Failed to start ranDT', 'error': response.text, 'request_data': request_data}, 500
    except requests.RequestException as e:
        evaluation.throughput_dt_status = HeatmapState.FAILURE
        db.session.commit()
        return {'message': 'Error calling ranDT API', 'error': str(e), 'request_data': request_data}, 500

    return {'message': 'ranDT started successfully'}, 200