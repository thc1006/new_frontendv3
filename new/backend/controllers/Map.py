from flask import request, jsonify, Blueprint
from flask_restful import Resource
from models.Map import db, Map
from models.Project import Project
from controllers.minIO import get_json_data, bucket_exists, object_exists ,upload_file
import tempfile
from utils.usd_to_gltf import usd_to_gltf
from utils.gml_to_usd import gml_to_usd


map_bp = Blueprint('map', __name__)

@map_bp.route('/projects/<int:project_id>/maps_aodt', methods=['GET'])
def get_project_maps_aodt(project_id):
    project = Project.query.get(project_id)
    if not project:
        return {'message': 'Project not found'}, 404

    map = Map.query.filter_by(project_id=project_id).first()
    if not map:
        return {'message': 'Map not found for this project'}, 404

    # 先檢查 bucket 和 object 是否存在
    if not bucket_exists('mapaodt'):
        return {'message': "Bucket 'mapaodt' does not exist."}, 404
    if not object_exists('mapaodt', map.MinIO_map_for_aodt):
        return {'message': f"Object '{map.MinIO_map_for_aodt}' does not exist in bucket 'mapaodt'."}, 404

    map_data = get_json_data('mapaodt', map.MinIO_map_for_aodt)

    return jsonify(map_data)

@map_bp.route('/projects/<int:project_id>/maps_frontend', methods=['GET'])
def get_project_maps_frontend(project_id):
    project = Project.query.get(project_id)
    if not project:
        return {'message': 'Project not found'}, 404
    map = Map.query.filter_by(project_id=project_id).first()
    if not map:
        return {'message': 'Map not found for this project'}, 404
    # 先檢查 bucket 和 object 是否存在
    if not bucket_exists('mapfrontend'):
        return {'message': "Bucket 'mapfrontend' does not exist."}, 404
    if not object_exists('mapfrontend', map.MinIO_map_for_frontend):
        return {'message': f"Object '{map.MinIO_map_for_frontend}' does not exist in bucket 'mapfrontend'."}, 404
    
    map_data = get_json_data('mapfrontend', map.MinIO_map_for_frontend)

    return jsonify(map_data)

@map_bp.route('/projects/<int:project_id>/maps', methods=['POST'])
def create_project_map(project_id):
    project = Project.query.get(project_id)
    if not project:
        return {'message': 'Project not found'}, 404

    if 'gml_file' not in request.files:
        return {'message': 'No GML file provide'} , 400

    gml_file = request.files['gml_file']
    if gml_file.filename == '':
        return {'message': 'No selected file'}, 400

    tmpdir_obj = tempfile.TemporaryDirectory()
    tmpdir = tmpdir_obj.name
    gml_file_path = f'{tmpdir}/map_{project_id}.gml'
    gltf_file_path = f'{tmpdir}/map_{project_id}.gltf'
    usd_file_path = f'{tmpdir}/map_{project_id}.usd'
    gml_file.save(gml_file_path) 

    gml_to_usd(gml_file_path,usd_file_path)
    usd_to_gltf(usd_file_path,gltf_file_path)

    if not bucket_exists('mapaodt') or not bucket_exists('mapfrontend'):
        return {'message': 'Bucket does not exist.'}, 404

    minio_name_aodt = f'map_aodt_{project_id}.usd'
    minio_name_frontend = f'map_frontend_{project_id}.gltf'
    # 檢查是否已存在 map，若有則覆蓋
    map = Map.query.filter_by(project_id=project_id).first()
    if upload_file('mapaodt', minio_name_aodt, usd_file_path, 'usd') and upload_file('mapfrontend', minio_name_frontend, gltf_file_path, 'gltf'):

        tmpdir_obj.cleanup()
        if map:
            # 已存在則只更新 MinIO 物件，不新增 row
            map.MinIO_map_for_aodt = minio_name_aodt
            map.MinIO_map_for_frontend = minio_name_frontend
            db.session.commit()
            return jsonify(map.to_dict()), 200
        else:
            # 不存在才新增
            map = Map(
                project_id=project_id,
                MinIO_map_for_aodt= minio_name_aodt,
                MinIO_map_for_frontend= minio_name_frontend
            )
            db.session.add(map)
            db.session.commit()
            return jsonify(map.to_dict()), 201




class MapListAPI(Resource):
    def get(self):
        maps = Map.query.all()
        return jsonify([m.to_dict() for m in maps])

    # def post(self):
    #     data = request.get_json()
    #     map_obj = Map(
    #         project_id=data.get('project_id'),
    #         MinIO_for_map_name_image=data.get('MinIO_for_map_name_image'),
    #         MinIO_for_map_name_position=data.get('MinIO_for_map_name_position')
    #     )
    #     db.session.add(map_obj)
    #     db.session.commit()
    #     return jsonify(map_obj.to_dict())


class MapAPI(Resource):
    def get(self, map_id):
        map_obj = Map.query.get(map_id)
        if map_obj:
            return jsonify(map_obj.to_dict())
        else:
            return {'message': 'Map not found'}, 404

    def put(self, map_id):
        map_obj = Map.query.get(map_id)
        if not map_obj:
            return {'message': 'Map not found'}, 404
        data = request.get_json()
        map_obj.project_id = data.get('project_id', map_obj.project_id)
        map_obj.MinIO_map_for_aodt = data.get(
            'MinIO_map_for_aodt', map_obj.MinIO_map_for_aodt)
        map_obj.MinIO_map_for_frontend = data.get(
            'MinIO_map_for_frontend', map_obj.MinIO_map_for_frontend)
        db.session.commit()
        return jsonify(map_obj.to_dict())

    def delete(self, map_id):
        map_obj = Map.query.get(map_id)
        if not map_obj:
            return {'message': 'Map not found'}, 404
        db.session.delete(map_obj)
        db.session.commit()
        return {'message': 'Map deleted'}
