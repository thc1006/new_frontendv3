from flask import request, jsonify, Blueprint
from flask_restful import Resource
from models.AIModel import db, AIModel
from models.Project import Project

ai_model_bp = Blueprint('ai_model', __name__)

# get ai models by project ID
@ai_model_bp.route('/projects/<int:project_id>/ai_models', methods=['GET'])
def get_project_ai_models(project_id):
    project = Project.query.get(project_id)
    if not project:
        return {'message': 'Project not found'}, 404
    ai_models = project.AI_models
    return jsonify([model.to_dict() for model in ai_models])


class AIModelListAPI(Resource):
    def get(self):
        items = AIModel.query.all()
        return jsonify([i.to_dict() for i in items])

    def post(self):
        data = request.get_json()
        item = AIModel(
            model_name=data.get('model_name'),
            project_id=data.get('project_id'),
            is_active=data.get('is_active', False),
            is_training=data.get('is_training', False),
            can_be_updated=data.get('can_be_updated', False)
        )
        db.session.add(item)
        db.session.commit()
        return jsonify(item.to_dict())


class AIModelAPI(Resource):
    def get(self, AI_model_id):
        item = AIModel.query.get(AI_model_id)
        if item:
            return jsonify(item.to_dict())
        else:
            return {'message': 'AIModel not found'}, 404

    def put(self, AI_model_id):
        item = AIModel.query.get(AI_model_id)
        if not item:
            return {'message': 'AIModel not found'}, 404
        data = request.get_json()
        item.model_name = data.get('model_name', item.model_name)
        item.project_id = data.get('project_id', item.project_id)
        item.is_active = data.get('is_active', item.is_active)
        item.is_training = data.get('is_training', item.is_training)
        item.can_be_updated = data.get('can_be_updated', item.can_be_updated)
        db.session.commit()
        return jsonify(item.to_dict())

    def delete(self, AI_model_id):
        item = AIModel.query.get(AI_model_id)
        if not item:
            return {'message': 'AIModel not found'}, 404
        db.session.delete(item)
        db.session.commit()
        return {'message': 'AIModel deleted'}

# --- 新增 is_active, is_training, can_be_updated 開/關 API ---
@ai_model_bp.route('/ai_models/<int:AI_model_id>/activate', methods=['POST'])
def activate_ai_model(AI_model_id):
    item = AIModel.query.get(AI_model_id)
    if not item:
        return {'message': 'AIModel not found'}, 404
    item.is_active = True
    db.session.commit()
    return jsonify(item.to_dict())

@ai_model_bp.route('/ai_models/<int:AI_model_id>/deactivate', methods=['POST'])
def deactivate_ai_model(AI_model_id):
    item = AIModel.query.get(AI_model_id)
    if not item:
        return {'message': 'AIModel not found'}, 404
    item.is_active = False
    db.session.commit()
    return jsonify(item.to_dict())

@ai_model_bp.route('/ai_models/<int:AI_model_id>/start-training', methods=['POST'])
def start_training_ai_model(AI_model_id):
    item = AIModel.query.get(AI_model_id)
    if not item:
        return {'message': 'AIModel not found'}, 404
    item.is_training = True
    db.session.commit()
    return jsonify(item.to_dict())

@ai_model_bp.route('/ai_models/<int:AI_model_id>/stop-training', methods=['POST'])
def stop_training_ai_model(AI_model_id):
    item = AIModel.query.get(AI_model_id)
    if not item:
        return {'message': 'AIModel not found'}, 404
    item.is_training = False
    db.session.commit()
    return jsonify(item.to_dict())

@ai_model_bp.route('/ai_models/<int:AI_model_id>/enable-update', methods=['POST'])
def enable_update_ai_model(AI_model_id):
    item = AIModel.query.get(AI_model_id)
    if not item:
        return {'message': 'AIModel not found'}, 404
    item.can_be_updated = True
    db.session.commit()
    return jsonify(item.to_dict())

@ai_model_bp.route('/ai_models/<int:AI_model_id>/disable-update', methods=['POST'])
def disable_update_ai_model(AI_model_id):
    item = AIModel.query.get(AI_model_id)
    if not item:
        return {'message': 'AIModel not found'}, 404
    item.can_be_updated = False
    db.session.commit()
    return jsonify(item.to_dict())
