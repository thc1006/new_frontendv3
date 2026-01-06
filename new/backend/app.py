from config import SQLALCHEMY_DATABASE_URI, SQLALCHEMY_TRACK_MODIFICATIONS, SECRET_KEY
from flasgger import Swagger
from flask import Flask
from flask_migrate import Migrate
from flask_restful import Api
from flask_seeder import FlaskSeeder
from controllers.geocode import geocode_bp
from controllers.UserProject import UserProjectAPI, UserProject_bp
from controllers.AIModel import AIModelListAPI, AIModelAPI, ai_model_bp
from controllers.DTAIModel import DTAIModelListAPI, DTAIModelAPI
from controllers.Brand import brand_bp
from controllers.PrimitiveAIModel import primitive_ai_model_bp
from controllers.PrimitiveDTAIModel import PrimitiveDTAIModelListAPI, PrimitiveDTAIModelAPI
from controllers.Project import ProjectListAPI, ProjectAPI, project_bp
from controllers.User import UserListAPI, UserAPI, UserMeAPI, user_bp
from controllers.Evaluation import EvaluationListAPI, EvaluationAPI, evaluation_bp
from controllers.RUCache import RUCacheListAPI, RUCacheAPI, ru_cache_bp
from controllers.CU import CUListAPI, CUAPI, cu_bp
from controllers.DU import DUListAPI, DUAPI, du_bp
from controllers.RU import RUListAPI, RUAPI, ru_bp
from controllers.Map import MapListAPI, MapAPI, map_bp
from controllers.AODT import aodt_bp
from controllers.map_position import Map_Position
from controllers.auth_api import RegisterAPI, LoginAPI, LogoutAPI, login_manager
from controllers.minIO import minio_api_bp
from controllers.DT import dt_bp
from controllers.BrandMetrics import brand_metrics_bp
from controllers.AbstractMetrics import abstract_metrics_bp
from controllers.gnbStatus import gnb_status_bp
from controllers.ChatSession import chat_bp
from models import db
from queue_example.examples import example_bp


app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = SQLALCHEMY_DATABASE_URI
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = SQLALCHEMY_TRACK_MODIFICATIONS
app.config['SECRET_KEY'] = SECRET_KEY
db.init_app(app)
Migrate(app, db)
seeder = FlaskSeeder()
seeder.init_app(app, db)
app.config['SWAGGER'] = {
    "title": "ORAN WEB API",
    "description": "API For MySQL",
    "version": "1.0.0",
    "termsOfService": "",
    "openapi": "3.0.2",
    "hide_top_bar": True
}




swag = Swagger(app, template_file = 'openapi.yml')
api = Api(app)
login_manager.init_app(app)

# 註冊 API
api.add_resource(RegisterAPI, '/auth/register')
api.add_resource(LoginAPI, '/auth/login')
api.add_resource(LogoutAPI, '/auth/logout')
api.add_resource(UserProjectAPI, '/user_projects/<int:user_id>/<int:project_id>')
api.add_resource(ProjectListAPI, '/projects')
api.add_resource(ProjectAPI, '/projects/<int:project_id>')
api.add_resource(UserListAPI, '/users')
api.add_resource(UserMeAPI, '/users/me')
api.add_resource(UserAPI, '/users/<int:user_id>')
api.add_resource(EvaluationListAPI, '/evaluations')
api.add_resource(EvaluationAPI, '/evaluations/<int:evaluation_id>')
api.add_resource(RUCacheListAPI, '/rucaches')
api.add_resource(RUCacheAPI, '/rucaches/<int:RU_id>')
api.add_resource(CUListAPI, '/cus')
api.add_resource(CUAPI, '/cus/<int:CU_id>')
api.add_resource(DUListAPI, '/dus')
api.add_resource(DUAPI, '/dus/<int:DU_id>')
api.add_resource(RUListAPI, '/rus')
api.add_resource(RUAPI, '/rus/<int:RU_id>')
api.add_resource(AIModelListAPI, '/ai_models')
api.add_resource(AIModelAPI, '/ai_models/<int:AI_model_id>')
api.add_resource(DTAIModelListAPI, '/dt_ai_models')
api.add_resource(DTAIModelAPI, '/dt_ai_models/<int:model_ID_for_DT>')
api.add_resource(PrimitiveDTAIModelListAPI, '/primitive_dt_ai_models')
api.add_resource(
    PrimitiveDTAIModelAPI,
    '/primitive_dt_ai_models/<int:model_id>')
api.add_resource(MapListAPI, '/maps')
api.add_resource(MapAPI, '/maps/<int:map_id>')
api.add_resource(Map_Position, '/Map_Position/<string:id>')

app.register_blueprint(ru_bp)
app.register_blueprint(du_bp)
app.register_blueprint(cu_bp)
app.register_blueprint(ai_model_bp)
app.register_blueprint(evaluation_bp)
app.register_blueprint(ru_cache_bp)
app.register_blueprint(minio_api_bp)
app.register_blueprint(project_bp)
app.register_blueprint(user_bp)
app.register_blueprint(map_bp)
app.register_blueprint(geocode_bp)

app.register_blueprint(UserProject_bp)
app.register_blueprint(aodt_bp)
app.register_blueprint(dt_bp)
app.register_blueprint(brand_bp)
app.register_blueprint(brand_metrics_bp)
app.register_blueprint(primitive_ai_model_bp)
app.register_blueprint(abstract_metrics_bp)
app.register_blueprint(example_bp)
app.register_blueprint(gnb_status_bp)
app.register_blueprint(chat_bp)


if __name__ == "__main__":
    app.run(host='0.0.0.0', port=8000, debug=True)
