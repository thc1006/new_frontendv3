from flask import request, jsonify, Blueprint
from flask_restful import Resource
from flask_login import login_required, current_user
from models.User import db, User
from models.Project import Project
from werkzeug.security import generate_password_hash
from .utils import delete_grafana_user
from utils.cascade_delete_project import cascade_delete_project

user_bp = Blueprint('user', __name__)

# get users by project ID if exists
@user_bp.route('/projects/<int:project_id>/users', methods=['GET'])
def get_project_users(project_id):
    project = Project.query.get(project_id)
    if not project:
        return {'message': 'Project not found'}, 404
    users = project.users
    return jsonify([u.to_dict() for u in users])


class UserListAPI(Resource):
    def get(self):
        users = User.query.all()
        return jsonify([u.to_dict() for u in users])


class UserAPI(Resource):
    def get(self, user_id):
        user = User.query.get(user_id)
        if user:
            return jsonify(user.to_dict())
        else:
            return {'message': 'User not found'}, 404
        
    @login_required
    def put(self, user_id):
        user = User.query.get(user_id)
        if not user:
            return {'message': 'User not found'}, 404
        data = request.get_json()
        if 'account' in data and data['account'] is not None:
            # 確保帳號唯一性
            existing_user = User.query.filter_by(account=data['account']).first()
            if existing_user and existing_user.user_id != user_id:
                return {'message': 'Account already exists'}, 400
            # 更新使用者資料
            else:
                user.account = data.get('account', user.account)
        password = data.get('password')
        if password:
            user.password = generate_password_hash(
                password,
                method='pbkdf2:sha256',
                salt_length=8
            )
        # 只有有傳 email 才更新
        if 'email' in data and data['email'] is not None:
            existing_email = User.query.filter_by(email=data['email']).first()
            if existing_email and existing_email.user_id != user_id:
                return {'message': 'Email already exists'}, 400
            # 更新使用者 email
            else:
                user.email = data['email']
        # 只有有傳 role 才更新
        if 'role' in data and data['role'] is not None:
            user.role = data['role']
        db.session.commit()
        return jsonify(user.to_dict())

    def delete(self, user_id):
        user = User.query.get(user_id)
        if not user:
            return {'message': 'User not found'}, 404
        
        # delete user from grafana
        delete_grafana_user_result = delete_grafana_user(user.grafana_user_id)

        if not delete_grafana_user_result["success"]:
            return {
                "message": "Failed to delete Grafana user",
                "error": delete_grafana_user_result["error"]
            }, 500
        cascade_delete_project(user) #delete project which is orphan
        db.session.delete(user)
        db.session.commit()
        return {'message': 'User deleted'}


class UserMeAPI(Resource):
    @login_required
    def get(self):
        # current_user 已經是載入後的 User 物件
        # 請確定 to_dict() 只回傳安全欄位
        return jsonify(current_user.to_dict())
