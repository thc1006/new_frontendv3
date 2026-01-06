from flask import request, jsonify, Blueprint
from flask_restful import Resource
from models.RUCache import db, RUCache
from models.Evaluation import Evaluation

ru_cache_bp = Blueprint('ru_cache', __name__)

# get RUCache by evaluation ID
@ru_cache_bp.route('/evaluations/<int:evaluation_id>/ru_cache', methods=['GET'])
def get_evaluation_ru_cache(evaluation_id):
    evaluation = Evaluation.query.get(evaluation_id)
    if not evaluation:
        return {'message': 'Evaluation not found'}, 404
    ru_cache = evaluation.RUCache
    if ru_cache:
        return jsonify(ru_cache.to_dict())
    else:
        return {'message': 'No RUCache found for this evaluation'}, 404

# update location of RUCache by RUCache ID
@ru_cache_bp.route('/ru_cache/<int:RU_id>/location', methods=['PUT'])
def update_ru_cache_location(RU_id):
    data = request.get_json()
    ru_cache = RUCache.query.get(RU_id)
    if not ru_cache:
        return {'message': 'RUCache not found'}, 404
    ru_cache.lat = data.get('lat', ru_cache.lat)
    ru_cache.lon = data.get('lon', ru_cache.lon)
    ru_cache.z = data.get('z', ru_cache.z)
    db.session.commit()
    return jsonify(ru_cache.to_dict())

class RUCacheListAPI(Resource):
    def get(self):
        items = RUCache.query.all()
        return jsonify([i.to_dict() for i in items])

    def post(self):
        data = request.get_json()
        item = RUCache(
            name=data.get('name'),
            eval_id=data.get('evaluation_id'),
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


class RUCacheAPI(Resource):
    def get(self, RU_id):
        item = RUCache.query.get(RU_id)
        if item:
            return jsonify(item.to_dict())
        else:
            return {'message': 'RUCache not found'}, 404

    def put(self, RU_id):
        item = RUCache.query.get(RU_id)
        if not item:
            return {'message': 'RUCache not found'}, 404
        data = request.get_json()
        item.name = data.get('name', item.name)
        item.evaluation_id = data.get('evaluation_id', item.evaluation_id)
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
        item = RUCache.query.get(RU_id)
        if not item:
            return {'message': 'RUCache not found'}, 404
        db.session.delete(item)
        db.session.commit()
        return {'message': 'RUCache deleted'}
