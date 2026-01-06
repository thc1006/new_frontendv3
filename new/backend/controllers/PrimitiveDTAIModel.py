from flask import request, jsonify
from flask_restful import Resource
from models.PrimitiveDTAIModel import db, PrimitiveDTAIModel


class PrimitiveDTAIModelListAPI(Resource):
    def get(self):
        items = PrimitiveDTAIModel.query.all()
        return jsonify([i.to_dict() for i in items])

    def post(self):
        data = request.get_json()
        item = PrimitiveDTAIModel(
            model_name=data.get('model_name'),
            MinIO_name_for_DT_AI_model=data.get('MinIO_name_for_DT_AI_model')
        )
        db.session.add(item)
        db.session.commit()
        return jsonify(item.to_dict())


class PrimitiveDTAIModelAPI(Resource):
    def get(self, model_id):
        item = PrimitiveDTAIModel.query.get(model_id)
        if item:
            return jsonify(item.to_dict())
        else:
            return {'message': 'PrimitiveDTAIModel not found'}, 404

    def put(self, model_id):
        item = PrimitiveDTAIModel.query.get(model_id)
        if not item:
            return {'message': 'PrimitiveDTAIModel not found'}, 404
        data = request.get_json()
        item.model_name = data.get('model_name', item.model_name)
        item.MinIO_name_for_DT_AI_model = data.get(
            'MinIO_name_for_DT_AI_model', item.MinIO_name_for_DT_AI_model)
        db.session.commit()
        return jsonify(item.to_dict())

    def delete(self, model_id):
        item = PrimitiveDTAIModel.query.get(model_id)
        if not item:
            return {'message': 'PrimitiveDTAIModel not found'}, 404
        db.session.delete(item)
        db.session.commit()
        return {'message': 'PrimitiveDTAIModel deleted'}
