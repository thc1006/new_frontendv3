from flask import Blueprint, request, jsonify
from models.PrimitiveAIModel import db, PrimitiveAIModel
from models.AIMetrics import AIMetrics
from models.AbstractMetrics import AbstractMetrics

primitive_ai_model_bp = Blueprint('primitive_ai_model', __name__)

# GET /primitive_ai_models
@primitive_ai_model_bp.route('/primitive_ai_models', methods=['GET'])
def get_primitive_ai_models():
    items = PrimitiveAIModel.query.all()
    result = []
    for item in items:
        data = item.to_dict()
        data['ai_metrics'] = [
            dict(
                m.to_dict(),
                abstract_metrics=m.abstract_metrics.to_dict() if m.abstract_metrics else None
            )
            for m in item.ai_metrics
        ]
        result.append(data)
    return jsonify(result)

# POST /primitive_ai_models
@primitive_ai_model_bp.route('/primitive_ai_models', methods=['POST'])
def create_primitive_ai_model():
    data = request.get_json()
    model_name = data.get('model_name')
    if PrimitiveAIModel.query.filter_by(model_name=model_name).first():
        return jsonify({'error': f'model_name {model_name} already exists'}), 400
    item = PrimitiveAIModel(model_name=model_name)
    db.session.add(item)
    db.session.flush()  # 取得 model_id
    metrics = data.get('ai_metrics', [])
    from models.AbstractMetrics import AbstractMetrics
    for metric in metrics:
        name = metric.get('name')
        if not name:
            return jsonify({'error': 'Each ai_metric must have a name'}), 400
        abstract_metrics_id = metric.get('abstract_metrics_id')
        if not abstract_metrics_id:
            return jsonify({'error': 'Each ai_metric must provide abstract_metrics_id'}), 400
        abs_obj = AbstractMetrics.query.get(abstract_metrics_id)
        if not abs_obj:
            return jsonify({'error': f'abstract_metrics_id {abstract_metrics_id} not found'}), 400
        m = AIMetrics(
            model_id=item.model_id,
            name=name,
            type=metric.get('type'),
            unit=metric.get('unit'),
            interval=metric.get('interval'),
            operator=metric.get('operator'),
            description=metric.get('description'),
            abstract_metrics_id=abs_obj.id
        )
        db.session.add(m)
    db.session.commit()
    data = item.to_dict()
    # 回傳 ai_metrics 時帶出 abstract_metrics 物件
    data['ai_metrics'] = [
        dict(m.to_dict(), abstract_metrics=m.abstract_metrics.to_dict() if m.abstract_metrics else None)
        for m in item.ai_metrics
    ]
    return jsonify(data)

# GET /primitive_ai_models/<model_id>
@primitive_ai_model_bp.route('/primitive_ai_models/<int:model_id>', methods=['GET'])
def get_primitive_ai_model(model_id):
    item = PrimitiveAIModel.query.get(model_id)
    if not item:
        return {'message': 'PrimitiveAIModel not found'}, 404
    data = item.to_dict()
    # 取得該 model 下所有 AIMetrics，並帶出 abstract_metrics 物件
    data['ai_metrics'] = [
        dict(m.to_dict(), abstract_metrics=m.abstract_metrics.to_dict() if m.abstract_metrics else None)
        for m in item.ai_metrics
    ]
    return jsonify(data)

# PUT /primitive_ai_models/<model_id>
@primitive_ai_model_bp.route('/primitive_ai_models/<int:model_id>', methods=['PUT'])
def update_primitive_ai_model(model_id):
    item = PrimitiveAIModel.query.get(model_id)
    if not item:
        return {'message': 'PrimitiveAIModel not found'}, 404
    data = request.get_json()
    item.model_name = data.get('model_name', item.model_name)
    metrics = data.get('ai_metrics', [])
    for metric in metrics:
        name = metric.get('name')
        if not name:
            return jsonify({'error': 'Each ai_metric must have a name'}), 400
        abstract_metrics_id = metric.get('abstract_metrics_id')
        if not abstract_metrics_id:
            return jsonify({'error': 'Each ai_metric must provide abstract_metrics_id'}), 400
        abs_obj = AbstractMetrics.query.get(abstract_metrics_id)
        if not abs_obj:
            return jsonify({'error': f'abstract_metrics_id {abstract_metrics_id} not found'}), 400
        m = AIMetrics.query.filter_by(
            model_id=item.model_id,
            abstract_metrics_id=abs_obj.id
        ).first()
        if not m:
            m = AIMetrics(
                model_id=item.model_id,
                name=name,
                type=metric.get('type'),
                unit=metric.get('unit'),
                interval=metric.get('interval'),
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
            m.operator = metric.get('operator', m.operator)
            m.description = metric.get('description', m.description)
    db.session.commit()
    data = item.to_dict()
    data['ai_metrics'] = [m.to_dict() for m in item.ai_metrics]
    return jsonify(data)

# DELETE /primitive_ai_models/<model_id>
@primitive_ai_model_bp.route('/primitive_ai_models/<int:model_id>', methods=['DELETE'])
def delete_primitive_ai_model(model_id):
    item = PrimitiveAIModel.query.get(model_id)
    if not item:
        return {'message': 'PrimitiveAIModel not found'}, 404
    db.session.delete(item)
    db.session.commit()
    return {'message': f'PrimitiveAIModel {model_id} deleted successfully'}
