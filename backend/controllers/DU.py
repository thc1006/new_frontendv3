from flask import request, jsonify, Blueprint
from flask_restful import Resource
from models.DU import db, DU
from models.Project import Project

du_bp = Blueprint('du', __name__)

# get DUs by project ID if exists
@du_bp.route('/projects/<int:project_id>/dus', methods=['GET'])
def get_project_dus(project_id):
    project = Project.query.get(project_id)
    if not project:
        return {'message': 'Project not found'}, 404
    dus = project.DUs
    return jsonify([d.to_dict() for d in dus])

class DUListAPI(Resource):
    def get(self):
        items = DU.query.all()
        return jsonify([i.to_dict() for i in items])

    def post(self):
        data = request.get_json()
        item = DU(
            CU_id=data.get('CU_id'),
            project_id=data.get('project_id'),
            name=data.get('name'),
            brand_id=data.get('brand_id')
        )
        db.session.add(item)
        db.session.commit()
        return jsonify(item.to_dict())


class DUAPI(Resource):
    def get(self, DU_id):
        item = DU.query.get(DU_id)
        if item:
            return jsonify(item.to_dict())
        else:
            return {'message': 'DU not found'}, 404

    def put(self, DU_id):
        item = DU.query.get(DU_id)
        if not item:
            return {'message': 'DU not found'}, 404
        data = request.get_json()
        item.CU_id = data.get('CU_id', item.CU_id)
        item.project_id = data.get('project_id', item.project_id)
        item.name = data.get('name', item.name)
        item.brand_id = data.get('brand_id', item.brand_id)
        db.session.commit()
        return jsonify(item.to_dict())

    def delete(self, DU_id):
        item = DU.query.get(DU_id)
        if not item:
            return {'message': 'DU not found'}, 404
        db.session.delete(item)
        db.session.commit()
        return {'message': 'DU deleted'}
