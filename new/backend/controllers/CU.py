from flask import request, jsonify, Blueprint
from flask_restful import Resource
from models.CU import db, CU
from models.Project import Project

cu_bp = Blueprint('cu', __name__)

# get CUs by project ID if exists
@cu_bp.route('/projects/<int:project_id>/cus', methods=['GET'])
def get_project_cus(project_id):
    project = Project.query.get(project_id)
    if not project:
        return {'message': 'Project not found'}, 404
    cus = project.CUs
    return jsonify([c.to_dict() for c in cus])

class CUListAPI(Resource):
    def get(self):
        items = CU.query.all()
        return jsonify([i.to_dict() for i in items])

    def post(self):
        data = request.get_json()
        item = CU(
            project_id=data.get('project_id'),
            name=data.get('name'),
            brand_id=data.get('brand_id')
        )
        db.session.add(item)
        db.session.commit()
        return jsonify(item.to_dict())


class CUAPI(Resource):
    def get(self, CU_id):
        item = CU.query.get(CU_id)
        if item:
            return jsonify(item.to_dict())
        else:
            return {'message': 'CU not found'}, 404

    def put(self, CU_id):
        item = CU.query.get(CU_id)
        if not item:
            return {'message': 'CU not found'}, 404
        data = request.get_json()
        item.project_id = data.get('project_id', item.project_id)
        item.name = data.get('name', item.name)
        item.brand_id = data.get('brand_id', item.brand_id)
        db.session.commit()
        return jsonify(item.to_dict())

    def delete(self, CU_id):
        item = CU.query.get(CU_id)
        if not item:
            return {'message': 'CU not found'}, 404
        db.session.delete(item)
        db.session.commit()
        return {'message': 'CU deleted'}
