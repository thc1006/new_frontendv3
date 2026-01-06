from flask import request, jsonify, Blueprint
from flask_restful import Resource
from models.UserProject import db, UserProject
from flask_login import login_required, current_user
from models.User import User
from enums.project_role import ProjectRole


UserProject_bp = Blueprint('user_project', __name__)

@UserProject_bp.route('/user_projects/<int:project_id>/role', methods=['GET'])
@login_required
def get_my_role(project_id):
    user = User.query.get(current_user.user_id)
    if not user:
        return {'message': 'User not found'}, 404
    user_project = UserProject.query.filter_by(user_id=user.user_id, project_id=project_id).first()
    if not user_project:
        return {'message': 'User is not a member of this project'}, 404
    return jsonify({
        'project_id': user_project.project_id,
        'role': user_project.role.name if hasattr(user_project.role, 'name') else str(user_project.role)
    })

class UserProjectAPI(Resource):
    def post(self, user_id, project_id):
        data = request.get_json()
        role_str = data.get('role', 'USER')
        try:
            role_enum = ProjectRole(role_str.lower()) if isinstance(role_str, str) else role_str
        except ValueError:
            return {'message': 'Invalid role'}, 400
        existing = UserProject.query.get((user_id, project_id))
        if existing:
            return {'message': 'UserProject already exists'}, 409
        user_project = UserProject(
            user_id=user_id,
            project_id=project_id,
            role=role_enum
        )
        db.session.add(user_project)
        db.session.commit()
        return jsonify(user_project.to_dict())
    
    def put(self, user_id, project_id):
        user_project = UserProject.query.get((user_id, project_id))
        if not user_project:
            return {'message': 'UserProject not found'}, 404
        data = request.get_json()
        role_str = data.get('role', user_project.role.name if hasattr(user_project.role, 'name') else user_project.role)
        try:
            role_enum = ProjectRole(role_str.lower()) if isinstance(role_str, str) else role_str
        except ValueError:
            return {'message': 'Invalid role'}, 400
        user_project.role = role_enum
        db.session.commit()
        return jsonify(user_project.to_dict())