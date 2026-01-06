import re
from flask import Blueprint, request, jsonify
from models import db
from models.AbstractMetrics import AbstractMetrics

abstract_metrics_bp = Blueprint('abstract_metrics', __name__)

def _make_key(name):
    key = re.sub(r'[^0-9a-zA-Z]+', '_', name).strip('_').lower()
    return key

# GET /abstract_metrics
@abstract_metrics_bp.route('/abstract_metrics', methods=['GET'])
def get_abstract_metrics():
    items = AbstractMetrics.query.all()
    result = []
    for i in items:
        data = i.to_dict()
        data['ai_metrics'] = [m.to_dict() for m in getattr(i, 'ai_metrics', [])]
        data['brand_metrics'] = [m.to_dict() for m in getattr(i, 'brand_metrics', [])]
        result.append(data)
    return jsonify(result)

# POST /abstract_metrics
@abstract_metrics_bp.route('/abstract_metrics', methods=['POST'])
def create_abstract_metrics():
    data = request.get_json()
    display_name = data.get('display_name')
    key = data.get('key')
    if not display_name:
        return jsonify({'error': 'display_name is required'}), 400
    if not key:
        key = _make_key(display_name)
    if AbstractMetrics.query.filter_by(key=key).first():
        return jsonify({'error': f'key {key} already exists'}), 400
    item = AbstractMetrics(key=key, display_name=display_name)
    db.session.add(item)
    db.session.commit()
    # 回傳時帶 ai_metrics/brand_metrics
    data = item.to_dict()
    data['ai_metrics'] = [m.to_dict() for m in getattr(item, 'ai_metrics', [])]
    data['brand_metrics'] = [m.to_dict() for m in getattr(item, 'brand_metrics', [])]
    return jsonify(data)

# GET /abstract_metrics/<int:metrics_id>
@abstract_metrics_bp.route('/abstract_metrics/<int:metrics_id>', methods=['GET'])
def get_abstract_metric(metrics_id):
    item = AbstractMetrics.query.get(metrics_id)
    if item:
        data = item.to_dict()
        # 取得所有 AIMetrics
        data['ai_metrics'] = [m.to_dict() for m in getattr(item, 'ai_metrics', [])]
        # 取得所有 BrandMetrics
        data['brand_metrics'] = [m.to_dict() for m in getattr(item, 'brand_metrics', [])]
        return jsonify(data)
    else:
        return {'message': 'AbstractMetrics not found'}, 404

# PUT /abstract_metrics/<int:metrics_id>
@abstract_metrics_bp.route('/abstract_metrics/<int:metrics_id>', methods=['PUT'])
def update_abstract_metric(metrics_id):
    item = AbstractMetrics.query.get(metrics_id)
    if not item:
        return {'message': 'AbstractMetrics not found'}, 404
    data = request.get_json()
    display_name = data.get('display_name', item.display_name)
    key = data.get('key')
    if not key:
        key = _make_key(display_name)
    # 只要 key 有變動，且新 key 已被其他 id 佔用就報錯
    if key != item.key:
        exists = AbstractMetrics.query.filter_by(key=key).first()
        if exists and exists.id != item.id:
            return jsonify({'error': f'key {key} already exists'}), 400
    item.key = key
    item.display_name = display_name
    db.session.commit()
    # 回傳時帶 ai_metrics/brand_metrics
    data = item.to_dict()
    data['ai_metrics'] = [m.to_dict() for m in getattr(item, 'ai_metrics', [])]
    data['brand_metrics'] = [m.to_dict() for m in getattr(item, 'brand_metrics', [])]
    return jsonify(data)

# DELETE /abstract_metrics/<int:metrics_id>
@abstract_metrics_bp.route('/abstract_metrics/<int:metrics_id>', methods=['DELETE'])
def delete_abstract_metric(metrics_id):
    item = AbstractMetrics.query.get(metrics_id)
    if not item:
        return {'message': 'AbstractMetrics not found'}, 404
    db.session.delete(item)
    db.session.commit()
    return {'message': f'AbstractMetrics {metrics_id} deleted successfully'}
