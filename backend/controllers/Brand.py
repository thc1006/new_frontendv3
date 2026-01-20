from flask import Blueprint, request, jsonify
from models.Brand import db, Brand
from models.BrandMetrics import BrandMetrics

brand_bp = Blueprint('brand', __name__)




# GET /brands
@brand_bp.route('/brands', methods=['GET'])
def get_brands():
    items = Brand.query.all()
    return jsonify([i.to_dict() for i in items])

# POST /brands
@brand_bp.route('/brands', methods=['POST'])
def create_brand():
    data = request.get_json()
    brand_name = data.get('brand_name')
    if Brand.query.filter_by(brand_name=brand_name).first():
        return jsonify({'error': f'brand_name {brand_name} already exists'}), 400
    item = Brand(
        brand_name=brand_name,
        tx_power=data.get('tx_power'),
        bandwidth=data.get('bandwidth')
    )
    db.session.add(item)
    db.session.flush()  # 取得 brand_id
    metrics = data.get('brand_metrics', [])
    from models.AbstractMetrics import AbstractMetrics
    for metric in metrics:
        name = metric.get('name')
        if not name:
            return jsonify({'error': 'Each metric must have a name'}), 400
        abstract_metrics_id = metric.get('abstract_metrics_id')
        if not abstract_metrics_id:
            return jsonify({'error': 'Each brand_metric must provide abstract_metrics_id'}), 400
        abs_obj = AbstractMetrics.query.get(abstract_metrics_id)
        if not abs_obj:
            return jsonify({'error': f'abstract_metrics_id {abstract_metrics_id} not found'}), 400
        m = BrandMetrics(
            brand_id=item.brand_id,
            name=name,
            type=metric.get('type'),
            unit=metric.get('unit'),
            interval=metric.get('interval'),
            api_source=metric.get('api_source'),
            operator=metric.get('operator'),
            description=metric.get('description'),
            abstract_metrics_id=abs_obj.id
        )
        db.session.add(m)
    db.session.commit()
    data = item.to_dict()
    return jsonify(data)


# GET /brands/<brand_id>
@brand_bp.route('/brands/<int:brand_id>', methods=['GET'])
def get_brand(brand_id):
    item = Brand.query.get(brand_id)
    if item:
        return jsonify(item.to_dict())
    else:
        return {'message': 'Brand not found'}, 404

# DELETE /brands/<brand_id>
@brand_bp.route('/brands/<int:brand_id>', methods=['DELETE'])
def delete_brand(brand_id):
    item = Brand.query.get(brand_id)
    if not item:
        return {'message': 'Brand not found'}, 404
    db.session.delete(item)
    db.session.commit()
    return {'message': f'Brand {brand_id} deleted successfully'}

# PUT /brands/<brand_id>
@brand_bp.route('/brands/<int:brand_id>', methods=['PUT'])
def update_brand(brand_id):
    item = Brand.query.get(brand_id)
    if not item:
        return {'message': 'Brand not found'}, 404
    data = request.get_json()
    item.brand_name = data.get('brand_name', item.brand_name)
    item.tx_power = data.get('tx_power', item.tx_power)
    item.bandwidth = data.get('bandwidth', item.bandwidth)
    metrics = data.get('brand_metrics', [])
    from models.AbstractMetrics import AbstractMetrics
    for metric in metrics:
        name = metric.get('name')
        if not name:
            return jsonify({'error': 'Each metric must have a name'}), 400
        abstract_metrics_id = metric.get('abstract_metrics_id')
        if not abstract_metrics_id:
            return jsonify({'error': 'Each brand_metric must provide abstract_metrics_id'}), 400
        abs_obj = AbstractMetrics.query.get(abstract_metrics_id)
        if not abs_obj:
            return jsonify({'error': f'abstract_metrics_id {abstract_metrics_id} not found'}), 400
        m = BrandMetrics.query.filter_by(
            brand_id=item.brand_id,
            abstract_metrics_id=abs_obj.id
        ).first()
        if not m:
            m = BrandMetrics(
                brand_id=item.brand_id,
                name=name,
                type=metric.get('type'),
                unit=metric.get('unit'),
                interval=metric.get('interval'),
                api_source=metric.get('api_source'),
                operator=metric.get('operator'),
                description=metric.get('description'),
                abstract_metrics_id=abs_obj.id
            )
            db.session.add(m)
        else:
            m.name = name
            m.type = metric.get('type', m.type)
            m.unit = metric.get('unit', m.unit)
            m.interval = metric.get('interval', m.interval)
            m.api_source = metric.get('api_source', m.api_source)
            m.operator = metric.get('operator', m.operator)
            m.description = metric.get('description', m.description)
    db.session.commit()
    data = item.to_dict()
    return jsonify(data)
