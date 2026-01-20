from flask import request, jsonify
from flask_restful import Resource
from models.DTAIModel import db, DTAIModel


class DTAIModelListAPI(Resource):
    def get(self):
        items = DTAIModel.query.all()
        return jsonify([i.to_dict() for i in items])

    def post(self):
        data = request.get_json()
        item = DTAIModel(
            model_name=data.get('model_name'),
            MinIO_name_for_DT_AI_model=data.get('MinIO_name_for_DT_AI_model')
        )
        db.session.add(item)
        db.session.commit()
        return jsonify(item.to_dict())


class DTAIModelAPI(Resource):
    def get(self, model_ID_for_DT):
        item = DTAIModel.query.get(model_ID_for_DT)
        if item:
            return jsonify(item.to_dict())
        else:
            return {'message': 'DTAIModel not found'}, 404

    def put(self, model_ID_for_DT):
        item = DTAIModel.query.get(model_ID_for_DT)
        if not item:
            return {'message': 'DTAIModel not found'}, 404
        data = request.get_json()
        item.model_name = data.get('model_name', item.model_name)
        item.MinIO_name_for_DT_AI_model = data.get(
            'MinIO_name_for_DT_AI_model', item.MinIO_name_for_DT_AI_model)
        db.session.commit()
        return jsonify(item.to_dict())

    def delete(self, model_ID_for_DT):
        item = DTAIModel.query.get(model_ID_for_DT)
        if not item:
            return {'message': 'DTAIModel not found'}, 404
        db.session.delete(item)
        db.session.commit()
        return {'message': 'DTAIModel deleted'}
