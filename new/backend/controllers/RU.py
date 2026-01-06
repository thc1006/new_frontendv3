from flask import request, jsonify, Blueprint
from flask_restful import Resource
from models.RU import db, RU
from models.Project import Project

ru_bp = Blueprint('ru', __name__)

# get all RUs by project ID
@ru_bp.route('/projects/<int:project_id>/rus', methods=['GET'])
def get_project_rus(project_id):
    project = Project.query.get(project_id)
    if not project:
        return {'message': 'Project not found'}, 404
    rus = project.RUs
    return jsonify([ru.to_dict() for ru in rus])

# update location of ru by ru ID
@ru_bp.route('/rus/<int:ruid>/location', methods=['PUT'])
def update_ru_location(ruid):
    data = request.get_json()
    ru = RU.query.get(ruid)
    if not ru:
        return {'message': 'RU not found'}, 404
    ru.lat = data.get('lat', ru.lat)
    ru.lon = data.get('lon', ru.lon)
    ru.z = data.get('z', ru.z)
    db.session.commit()
    return jsonify(ru.to_dict())

class RUListAPI(Resource):
    def get(self):
        items = RU.query.all()
        return jsonify([i.to_dict() for i in items])

    def post(self):
        data = request.get_json()
        item = RU(
            name=data.get('name'),
            DU_id=data.get('DU_id'),
            project_id=data.get('project_id'),
            brand_id=data.get('brand_id'),
            lat=data.get('lat'),
            lon=data.get('lon'),
            z=data.get('z'),
            tx_power=data.get('tx_power'),
            bandwidth=data.get('bandwidth'),
            roll=data.get('roll'),
            tilt=data.get('tilt'),
            opening_angle=data.get('opening_angle')
        )
        db.session.add(item)
        db.session.commit()
        return jsonify(item.to_dict())


class RUAPI(Resource):
    def get(self, ruid):
        item = RU.query.get(ruid)
        if item:
            return jsonify(item.to_dict())
        else:
            return {'message': 'RU not found'}, 404

    def put(self, ruid):
        item = RU.query.get(ruid)
        if not item:
            return {'message': 'RU not found'}, 404
        data = request.get_json()
        item.name = data.get('name', item.name)
        item.DU_id = data.get('DU_id', item.DU_id)
        item.project_id = data.get('project_id', item.project_id)
        item.brand_id = data.get('brand_id', item.brand_id)
        item.lat = data.get('lat', item.lat)
        item.lon = data.get('lon', item.lon)
        item.z = data.get('z', item.z)
        item.tx_power = data.get('tx_power', item.tx_power)
        item.bandwidth = data.get('bandwidth', item.bandwidth)
        item.roll = data.get('roll', item.roll)
        item.tilt = data.get('tilt', item.tilt)
        item.opening_angle = data.get('opening_angle', item.opening_angle)
        db.session.commit()
        return jsonify(item.to_dict())

    def delete(self, RU_id):
        item = RU.query.get(RU_id)
        if not item:
            return {'message': 'RU not found'}, 404
        db.session.delete(item)
        db.session.commit()
        return {'message': 'RU deleted'}
