from flask import request
from flask_restful import Resource
from flask_login import LoginManager, login_user, logout_user, login_required
from enums.role import Role
from models.User import db, User
from werkzeug.security import generate_password_hash, check_password_hash
from .utils import create_grafana_user
import logging

# Initialize LoginManager (in app.py, register with
# login_manager.init_app(app))
login_manager = LoginManager()

#logger for login information
login_logger = logging.getLogger('login_logger')
login_logger.setLevel(logging.INFO)

#handler
hd = logging.FileHandler('logs/login_logger.log')
hd.setLevel(logging.INFO)

#formatter
formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
hd.setFormatter(formatter)
login_logger.addHandler(hd)


@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))


class RegisterAPI(Resource):
    def post(self):
        data = request.get_json() or {}
        
        account = data.get('account')
        password = data.get('password')
        email = data.get('email')

        # Check if account already exists
        if User.query.filter_by(account=data.get('account')).first():
            return {'message': 'Account already exists'}, 400
        if User.query.filter_by(email=data.get('email')).first():
            return {'message': 'Email already exists'}, 400

        try:
            # Hash the password before storing
            pw_hash = generate_password_hash(
                password,
                method='pbkdf2:sha256',
                salt_length=8)
            user = User(
                account=account,
                email=email,
                password=pw_hash,
                grafana_user_id=None,
                role=Role.USER
            )
            db.session.add(user)
            db.session.flush()

            result = {
                "user": user.to_dict(),
                "grafana_user": {"success": True},
                "grafana_folder": {"success": True}
            }
            
            # 建立 Grafana 使用者
            grafana_user_result = create_grafana_user(account, password, email)
            result["grafana_user"] = grafana_user_result
            
            if grafana_user_result["success"] and "data" in grafana_user_result:
                grafana_data = grafana_user_result["data"]
                # 根據 Grafana API 回應取得 user_id
                if "id" in grafana_data:
                    user.grafana_user_id = grafana_data["id"]
                else:
                    db.session.rollback()
                    return {
                        "message": "Grafana user creation failed",
                        "error": "User ID not found in response"
                    }, 500
                
                db.session.commit()
            else:
                db.session.rollback()
                return {
                    "message": "Grafana user creation failed",
                    "error": grafana_user_result.get("error", "Unknown error")
                }, 500
            
            return {
                "message": "Registration successful",
                "details": result
            }, 200
            
        except Exception as e:
            db.session.rollback()
            return {
                "message": "Registration failed",
                "error": str(e)
            }, 500


class LoginAPI(Resource):
    def post(self):
        data = request.get_json() or {}
        user = User.query.filter_by(account=data.get('account')).first()
        # Verify password against stored hash
        if not user or not check_password_hash(
                user.password, data.get('password')):
            login_logger.info(f"login fail, user:{data.get('account')}")
            return {'message': 'Invalid credentials'}, 401
        login_logger.info(f"login successfully, user:{user.account} ,user_id:{user.user_id}")
        # Establish user session
        login_user(user)
        return {'message': 'Login successful'}


class LogoutAPI(Resource):
    @login_required
    def post(self):
        # Clear the user session
        logout_user()
        return {'message': 'Logout successful'}
