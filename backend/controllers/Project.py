from flask import request, jsonify, Blueprint
from flask_restful import Resource
from flask_login import login_required, current_user
from models.Project import db, Project
from models.User import User
from models.UserProject import UserProject
from enums.project_role import ProjectRole
from controllers.utils import create_grafana_folder, create_grafana_dashboard
from utils.minIOName import MinIOName
from controllers.minIO import get_json_data, upload_json_stream, bucket_exists
from enums.HeatmapState import HeatmapState
from datetime import date
from controllers.minIO import upload_file
from utils.gml_to_usd import gml_to_usd
from utils.usd_to_gltf import usd_to_gltf
from utils.generate_usd import generate_usd
import tempfile
from models.Map import  Map
import json
from models.Evaluation import Evaluation
from models.CU import CU
from models.DU import DU
from models.RU import RU

project_bp = Blueprint('project', __name__)

# get projects by user ID
@project_bp.route('/users/<int:user_id>/projects', methods=['GET'])
def get_user_projects(user_id):
    user = User.query.get(user_id)
    if not user:
        return {'message': 'User not found'}, 404
    projects = user.projects
    return jsonify([p.to_dict() for p in projects])

@project_bp.route('/projects/me', methods=['GET'])
@login_required
def get_my_projects():
    user = User.query.get(current_user.user_id)
    if not user:
        return {'message': 'User not found'}, 404
    projects = user.projects
    return jsonify([p.to_dict() for p in projects])

def create_map(project_id,request):
    tmpdir_obj = tempfile.TemporaryDirectory()
    tmpdir = tmpdir_obj.name
    gml_file_path = f'{tmpdir}/map_{project_id}.gml'
    gltf_file_path = f'{tmpdir}/map_{project_id}.gltf'
    usd_file_path = f'{tmpdir}/map_{project_id}.usd'

    map_info = {}
    if 'lat' in request.form:
        map_info['lat'] = request.form['lat']
    if 'lon' in request.form:
        map_info['lon'] = request.form["lon"]
    if 'margin' in request.form:
        map_info['margin'] = request.form['margin']
    map_info['project_id']  = project_id
    
    have_gml = 'gml_file' in request.files
    gml_file = ''
    if have_gml:
        gml_file = request.files['gml_file']
        if gml_file.filename == '':
            return {'success': False, "message":"no select file", 'status_code': 404}
        
    if have_gml:
        gml_file.save(gml_file_path) 
        log = gml_to_usd(gml_file_path,usd_file_path)
        if not log['success']:
            return log
        
        
    else:
        # 如果沒有提供 GML 檔案，則生成 USD 檔案
        log = generate_usd(usd_file_path, map_info)
        if not log['success']:
            return log
    #upload usd to MinIO
    minio_name_aodt = f'map_aodt_{project_id}.usd'
    if not bucket_exists('mapaodt'):
        return {'success': False, "message":"mapaodt bucket does not exist", 'status_code': 404}
    if not upload_file('mapaodt', minio_name_aodt, usd_file_path, 'usd'):
        return {'success':False,"message":"mapaodt upload fail","status_code":500}

    #convert usd to gltf
    usd_to_gltf(usd_file_path, gltf_file_path)

    #upload gltf file 
    if not bucket_exists('mapfrontend'):
        return {'success': False, "message":"mapfrontend bucket does not exist", 'status_code': 404}
    minio_name_frontend = f'map_frontend_{project_id}.gltf'
    if not upload_file('mapfrontend', minio_name_frontend, gltf_file_path, 'gltf'):
        #should rollback
        return {'success':False,"message":"mapfrontend upload fail","status_code":500}
        

    # 檢查是否已存在 map，若有則覆蓋
    map = Map.query.filter_by(project_id=project_id).first()
    tmpdir_obj.cleanup()
    if map:
        # 已存在則只更新 MinIO 物件，不新增 row
        map.MinIO_map_for_aodt = minio_name_aodt
        map.MinIO_map_for_frontend = minio_name_frontend
        db.session.commit()
    else:
        # 不存在才新增
        map = Map(
            project_id=project_id,
            MinIO_map_for_aodt= minio_name_aodt,
            MinIO_map_for_frontend= minio_name_frontend
        )
        db.session.add(map)
        db.session.commit()
    return {'success':True,"message":"map successfully create","status_code":200}

@project_bp.route('/projects/<int:project_id>/rsrp', methods=['GET'])
def get_project_rsrp(project_id):
    project = Project.query.get(project_id)
    if not project:
        return {'message': 'Project not found'}, 404
    
    if project.rsrp_status != HeatmapState.SUCCESS:
        return {'message': 'RSRP not ready'}, 400
    
    rsrp_name = MinIOName.project_rsrp_heatmap(project_id)
    
    rsrp_data = get_json_data('rsrp', rsrp_name)

    if not rsrp_data:
        return {'message': 'RSRP data not found'}, 404

    # 將 rsrp_data 轉換為 JSON 格式
    rsrp_data = json.loads(rsrp_data)

    return jsonify(rsrp_data)

@project_bp.route('/projects/<int:project_id>/rsrp', methods=['POST'])
def update_project_rsrp(project_id):
    project = Project.query.get(project_id)
    if not project:
        return {'message': 'Project not found'}, 404

    data = request.get_json()
    if not data:
        return {'message': 'Invalid data'}, 400

    rsrp_data = json.dumps(data)
    minio_name = MinIOName.project_rsrp_heatmap(project_id)

    # 先檢查 bucket 是否存在
    if not bucket_exists('rsrp'):
        return {'message': "Bucket 'rsrp' does not exist."}, 404

    if upload_json_stream('rsrp', minio_name, rsrp_data):
        project.rsrp_status = HeatmapState.SUCCESS
        db.session.commit()
        return {'message': 'RSRP data uploaded successfully'}, 200
    else:
        return {'message': 'Failed to upload RSRP data'}, 500

@project_bp.route('/projects/<int:project_id>/throughput', methods=['GET'])
def get_project_throughput(project_id):
    project = Project.query.get(project_id)
    if not project:
        return {'message': 'Project not found'}, 404
    
    if project.throughput_status != HeatmapState.SUCCESS:
        return {'message': 'Throughput not ready'}, 400
    
    throughput_name = MinIOName.project_throughput_heatmap(project_id)
    
    throughput_data = get_json_data('throughput', throughput_name)

    if not throughput_data:
        return {'message': 'Throughput data not found'}, 404

    # 將 throughput_data 轉換為 JSON 格式
    throughput_data = json.loads(throughput_data)

    return jsonify(throughput_data)

@project_bp.route('/projects/<int:project_id>/throughput', methods=['POST'])
def update_project_throughput(project_id):
    project = Project.query.get(project_id)
    if not project:
        return {'message': 'Project not found'}, 404

    data = request.get_json()
    if not data:
        return {'message': 'Invalid data'}, 400

    throughput_data = json.dumps(data)
    minio_name = MinIOName.project_throughput_heatmap(project_id)

    # 先檢查 bucket 是否存在
    if not bucket_exists('throughput'):
        return {'message': "Bucket 'throughput' does not exist."}, 404

    if upload_json_stream('throughput', minio_name, throughput_data):
        project.throughput_status = HeatmapState.SUCCESS
        db.session.commit()
        return {'message': 'Throughput data uploaded successfully'}, 200
    else:
        return {'message': 'Failed to upload throughput data'}, 500

@project_bp.route('/projects/<int:project_id>/rsrp_dt', methods=['GET'])
def get_project_rsrp_dt(project_id):
    project = Project.query.get(project_id)
    if not project:
        return {'message': 'Project not found'}, 404

    if project.rsrp_dt_status != HeatmapState.SUCCESS:
        return {'message': 'rsrp_dt not ready'}, 400

    rsrp_dt_name = MinIOName.project_rsrp_dt_heatmap(project_id)

    rsrp_dt_data = get_json_data('rsrp-dt', rsrp_dt_name)

    if not rsrp_dt_data:
        return {'message': 'rsrp_dt data not found'}, 404

    # 將 rsrp_dt_data 轉換為 JSON 格式
    rsrp_dt_data = json.loads(rsrp_dt_data)

    return jsonify(rsrp_dt_data)

@project_bp.route('/projects/<int:project_id>/rsrp_dt', methods=['POST'])
def update_project_rsrp_dt(project_id):
    project = Project.query.get(project_id)
    if not project:
        return {'message': 'Project not found'}, 404

    data = request.get_json()
    if not data:
        return {'message': 'Invalid data'}, 400

    rsrp_dt_data = json.dumps(data)
    minio_name = MinIOName.project_rsrp_dt_heatmap(project_id)

    # 先檢查 bucket 是否存在
    if not bucket_exists('rsrp-dt'):
        return {'message': "Bucket 'rsrp_dt' does not exist."}, 404

    if upload_json_stream('rsrp-dt', minio_name, rsrp_dt_data):
        project.rsrp_dt_status = HeatmapState.SUCCESS
        db.session.commit()
        return {'message': 'rsrp_dt data uploaded successfully'}, 200
    else:
        return {'message': 'Failed to upload rsrp_dt data'}, 500

@project_bp.route('/projects/<int:project_id>/throughput_dt', methods=['GET'])
def get_project_throughput_dt(project_id):
    project = Project.query.get(project_id)
    if not project:
        return {'message': 'Project not found'}, 404

    if project.throughput_dt_status != HeatmapState.SUCCESS:
        return {'message': 'ThroughputDT not ready'}, 400

    throughput_dt_name = MinIOName.project_throughput_dt_heatmap(project_id)

    throughput_dt_data = get_json_data('throughput_dt', throughput_dt_name)

    if not throughput_dt_data:
        return {'message': 'ThroughputDT data not found'}, 404

    # 將 throughput_dt_data 轉換為 JSON 格式
    throughput_dt_data = json.loads(throughput_dt_data)
    
    return jsonify(throughput_dt_data)

@project_bp.route('/projects/<int:project_id>/throughput_dt', methods=['POST'])
def update_project_throughput_dt(project_id):
    project = Project.query.get(project_id)
    if not project:
        return {'message': 'Project not found'}, 404

    data = request.get_json()
    if not data:
        return {'message': 'Invalid data'}, 400

    throughput_dt_data = json.dumps(data)
    minio_name = MinIOName.project_throughput_dt_heatmap(project_id)

    # 先檢查 bucket 是否存在
    if not bucket_exists('throughput_dt'):
        return {'message': "Bucket 'throughput_dt' does not exist."}, 404

    if upload_json_stream('throughput_dt', minio_name, throughput_dt_data):
        project.throughput_dt_status = HeatmapState.SUCCESS
        db.session.commit()
        return {'message': 'ThroughputDT data uploaded successfully'}, 200
    else:
        return {'message': 'Failed to upload throughputDT data'}, 500

# get status of rsrp and throughput
@project_bp.route('/projects/<int:project_id>/status', methods=['GET'])
def get_project_status(project_id):
    project = Project.query.get(project_id)
    if not project:
        return {'message': 'Project not found'}, 404
    
    status = {
        'rsrp_status': project.rsrp_status.value if project.rsrp_status else None,
        'throughput_status': project.throughput_status.value if project.throughput_status else None,
        'rsrp_dt_status': project.rsrp_dt_status.value if project.rsrp_dt_status else None,
        'throughput_dt_status': project.throughput_dt_status.value if project.throughput_dt_status else None
    }
    
    return jsonify(status)

# update status of rsrp and throughput
@project_bp.route('/projects/<int:project_id>/status/rsrp', methods=['PUT'])
def update_project_rsrp_status(project_id):
    project = Project.query.get(project_id)
    if not project:
        return {'message': 'Project not found'}, 404
    
    data = request.get_json()
    status = data.get('status')
    
    if status not in [s.value for s in HeatmapState]:
        return {'message': 'Invalid status'}, 400
    
    project.rsrp_status = HeatmapState(status)
    db.session.commit()
    
    return jsonify({'message': 'RSRP status updated successfully'})

@project_bp.route('/projects/<int:project_id>/status/throughput', methods=['PUT'])
def update_project_throughput_status(project_id):
    project = Project.query.get(project_id)
    if not project:
        return {'message': 'Project not found'}, 404
    
    data = request.get_json()
    status = data.get('status')
    
    if status not in [s.value for s in HeatmapState]:
        return {'message': 'Invalid status'}, 400
    
    project.throughput_status = HeatmapState(status)
    db.session.commit()
    
    return jsonify({'message': 'Throughput status updated successfully'})

@project_bp.route('/projects/<int:project_id>/status/rsrp_dt', methods=['PUT'])
def update_project_rsrp_dt_status(project_id):
    project = Project.query.get(project_id)
    if not project:
        return {'message': 'Project not found'}, 404
    
    data = request.get_json()
    status = data.get('status')
    
    if status not in [s.value for s in HeatmapState]:
        return {'message': 'Invalid status'}, 400
    
    project.rsrp_dt_status = HeatmapState(status)
    db.session.commit()
    
    return jsonify({'message': 'rsrp_dt status updated successfully'})

@project_bp.route('/projects/<int:project_id>/status/throughput_dt', methods=['PUT'])
def update_project_throughput_dt_status(project_id):
    project = Project.query.get(project_id)
    if not project:
        return {'message': 'Project not found'}, 404
    
    data = request.get_json()
    status = data.get('status')
    
    if status not in [s.value for s in HeatmapState]:
        return {'message': 'Invalid status'}, 400

    project.throughput_dt_status = HeatmapState(status)
    db.session.commit()
    
    return jsonify({'message': 'throughput_dt status updated successfully'})

# pick one evaluation and insert the data into CU DU RU
@project_bp.route('/projects/<int:project_id>/deploy/<int:evaluation_id>')
def deploy_evaluation(project_id,evaluation_id):
    #get project
    project = Project.query.get(project_id)
    if not project :
        return {"message": "Project not found"} , 404
    
    #get evaluation
    evaluation = Evaluation.query.get(evaluation_id)
    if not evaluation:
        return {"message": "Evaluation not found"}, 404
    #check RU exist
    if not evaluation.RU_caches:
        return {"message": "No RUs in this evaluation"},404
    
    #insert data into CU DU RU
    try:
        dataCUs = []
        dataDUs = []
        dataRUs = []
        default_brand = evaluation.RU_caches[0].brand_id
        new_CU = CU(
            project = project.project_id,
            name = "CU_1",
            brand_id = default_brand
        )
        dataCUs.append(new_CU.to_dict())
        for id,eval_ru in enumerate(evaluation.RU_caches):
            new_DU = DU(
                project_id = project.project_id,
                name = f"DU_{id}",
                brand_id = default_brand
            )   
            new_CU.DUs.append(new_DU)  
            dataDUs.append(new_DU.to_dict())       

            new_RU = RU(
                name = eval_ru.name,
                project_id = project.project_id,
                brand_id = default_brand,
                lat = eval_ru.lat,
                lon = eval_ru.lon,
                z = eval_ru.z,
                txpower = eval_ru.txpower,
                bandwidth = eval_ru.bandwidth,
                opening_angle = eval_ru.opening_angle,
                roll = eval_ru.roll
            )
            new_DU.RUs.append(new_RU)
            dataRUs.append(new_RU.to_dict())
        db.session.add(new_CU)

        #delete evaluations
        project.evaluations = []

        #create result
        result = {
            'CUs' : dataCUs,
            'DUs' : dataDUs,
            'RUs' : dataRUs
        }

        db.session.commit()


        return {
            "message": "Project created successfully",
            "details": result
        }, 201
    except Exception as e:
        db.session.rollback()
        return {"status": "error", "message": e},500


@project_bp.route('/projects/<int:project_id>/map_correction', methods=['PUT'])
def map_correction(project_id):
    project = Project.query.get(project_id)
    if not project:
        return {'message': 'Project not found'}, 404

    data = request.get_json()
    if not data:
        return {'message': 'Invalid data'}, 400

    # 更新地圖校正參數
    project.rotation_offset = data.get('rotation_offset', project.rotation_offset)
    project.lat_offset = data.get('lat_offset', project.lat_offset)
    project.lon_offset = data.get('lon_offset', project.lon_offset)
    project.scale = data.get('scale', project.scale)

    db.session.commit()

    return {'message': 'Map correction parameters updated successfully'}, 200


class ProjectListAPI(Resource):
    def get(self):
        projects = Project.query.all()
        return jsonify([p.to_dict() for p in projects])

    @login_required
    def post(self):
        title = ''
        lat = ''
        lon = ''
        margin = ''
        
        if 'title' in request.form:
            title = request.form["title"]
        if 'lat' in request.form:
            lat = request.form["lat"]
        if 'lon' in request.form:
            lon = request.form["lon"]
        if 'margin' in request.form:
            margin = request.form['margin']
        

        have_gml = 'gml_file' in request.files
        
        if not title:
            return {'message': 'Title is required'}, 400
        

        if (not have_gml) and ((not lat) or (not lon) or (not margin)):
            return {'message': 'Latitude, Longitude, and Margin are required if no GML file is provided'}, 400
    
    
        
        project_date = ''
        if 'date' in request.form:
            project_date = request.form['date']


        if project_date:
            try:
                from datetime import datetime
                project_date = datetime.fromisoformat(project_date).date()
            except ValueError:
                project_date = date.today()
        else:
            project_date = date.today()

        try:
            project = Project(
                title=title,
                date=project_date,
                grafana_folder_id = None,
                lat=lat,
                lon=lon,
                margin=margin
            )

            db.session.add(project)
            db.session.flush()
            project_id = project.project_id
            

            owner_id = current_user.user_id
            # owner_id = 1 # For testing, replace with current_user.user_id in production

            user_project = UserProject(
                user_id=owner_id,
                project_id=project.project_id,
                role=ProjectRole.OWNER
            )

            db.session.add(user_project)

            #create evaluation row
            evaluation = Evaluation(
                project_id=project.project_id,
                rsrp_status=HeatmapState.IDLE,
                throughput_status=HeatmapState.IDLE,
                rsrp_dt_status=HeatmapState.IDLE,
                throughput_dt_status=HeatmapState.IDLE
            )

            
            db.session.add(evaluation)

            result = {
                "project": project.to_dict(),
                "user_project": user_project.to_dict(),
                "evaluation": evaluation.to_dict()
            }


            create_response = create_map(project_id,request)
            if not create_response['success']:
                db.session.rollback()
                return {
                    "status": create_response.get("status","error"),
                    "message": create_response.get("message",""), 
                    "details": create_response.get("details",""),
                    "stack_trace": create_response.get("stack_trace","")
                },create_response.get("status_code",500)    

            # user = User.query.get(owner_id)
            # if user:
            #     account = user.account
            # else:
            #     account = "admin"  # 預設帳號

            grafana_folder_result = create_grafana_folder(
                project_name=title,
                account=current_user.account,
                # account=account
            )

            result["grafana_folder"] = grafana_folder_result
            
            project.grafana_folder_id = grafana_folder_result["data"]["folder_uid"]

            db.session.commit()
            
            # Create Grafana dashboard 
            create_grafana_dashboard( # this thing returns the dashboard id
                folder_uid=project.grafana_folder_id, dashboard_title='test_dashboard', account=current_user.account
            )

            
            return {
                "message": "Project created successfully",
                "details": result
            }, 201
        except Exception as e:
            db.session.rollback()
            return {
                "message": "Project creation failed",
                "error": str(e)
            }, 500

    




class ProjectAPI(Resource):
    def get(self, project_id):
        project = Project.query.get(project_id)
        if project:
            return jsonify(project.to_dict())
        return {'message': 'Project not found'}, 404

    def put(self, project_id):
        project = Project.query.get(project_id)
        if not project:
            return {'message': 'Project not found'}, 404

        data = request.get_json()
        project.title = data.get('title', project.title)
        project.date = data.get('date', project.date)
        project.lat = data.get('lat',project.lat)
        project.lon = data.get('lon',project.lon)
        project.margin = data.get('margin',project.margin)
        db.session.commit()
        return jsonify(project.to_dict())

    def delete(self, project_id):
        project = Project.query.get(project_id)
        if not project:
            return {'message': 'Project not found'}, 404

        db.session.delete(project)
        db.session.commit()
        return {'message': 'Project deleted'}
    




