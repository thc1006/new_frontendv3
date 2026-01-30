from flask import Flask, g, request, Response
from flask_restful import Api
from flask_cors import CORS
from flasgger import Swagger
from influxdb import InfluxDBClient, exceptions
from dotenv import load_dotenv
import os
import time
from mysql.connector import pooling

import datetime

app = Flask(__name__)
load_dotenv()

# JSON configuration for proper UTF-8 encoding (Chinese characters support)
app.config['JSON_AS_ASCII'] = False  # Allow non-ASCII characters in JSON responses
app.config['JSONIFY_MIMETYPE'] = 'application/json; charset=utf-8'

# Session configuration
app.secret_key = os.getenv('SECRET_KEY', '\x03/\x00\xfd\x96\xd3\no\x9bQ\xeb\x9b\xd8\x9b\xdd\x8f')
app.permanent_session_lifetime = datetime.timedelta(hours=1)
app.config['SESSION_TYPE'] = 'filesystem'
app.config['SESSION_COOKIE_SAMESITE'] = 'None'  # Allow cross-site cookies
app.config['SESSION_COOKIE_SECURE'] = True  # Required for SameSite=None
app.config['SESSION_COOKIE_HTTPONLY'] = True

# CORS configuration - allow credentials for session-based auth
CORS(app, supports_credentials=True, origins=[
    'http://localhost:3000',
    'http://localhost:30081',
    'https://localhost:8443',
    'https://wisdon.thc1006.cc',
    'https://140.113.144.123:8443'
])

from prometheus_client import Counter, Gauge, Histogram, generate_latest, CONTENT_TYPE_LATEST
from prometheus_client import multiprocess, CollectorRegistry

REQUESTS_TOTAL = Counter(
    "flask_requests_total", 
    "Total number of requests received", 
    ["method", "endpoint"]
)

CONNECTIONS_ACTIVE = Gauge(
    "flask_connections_active", 
    "Number of active connections"
)

RESPONSE_TIME_HISTOGRAM = Histogram(
    "flask_response_time_seconds", 
    "Histogram of response times", 
    ["method", "endpoint"]
)

@app.before_request
def before_request():
    CONNECTIONS_ACTIVE.inc()
    REQUESTS_TOTAL.labels(method=request.method, endpoint=request.path).inc()
    request.start_time = time.time()

@app.after_request
def after_request(response):
    CONNECTIONS_ACTIVE.dec() 
    request_latency = time.time() - request.start_time
    RESPONSE_TIME_HISTOGRAM.labels(method=request.method, endpoint=request.path).observe(request_latency)
    return response

@app.route("/metrics")
def metrics():
    registry = CollectorRegistry()
    multiprocess.MultiProcessCollector(registry)
    return Response(generate_latest(registry), content_type=CONTENT_TYPE_LATEST)

# Direct file serving for heatmap JSON files
@app.route("/heatmap/<path:filename>")
def serve_heatmap(filename):
    import json
    from flask import send_from_directory, abort
    try:
        return send_from_directory('./heatmap', filename, mimetype='application/json')
    except FileNotFoundError:
        abort(404)

@app.route("/heatmapdt/<path:filename>")
def serve_heatmapdt(filename):
    from flask import send_from_directory, abort
    try:
        return send_from_directory('./heatmapdt', filename, mimetype='application/json')
    except FileNotFoundError:
        abort(404)

class Config:
    SQL_host=os.getenv('DB_HOST')
    SQL_user=os.getenv('DB_USER')
    SQL_passwd=os.getenv('DB_PASSWORD')
    SQL_db = os.getenv('DB_DATABASE')
    retry = 5
    delay = 10

    ctrl_ip = "140.113.144.121"
    ctrl_port = "2980"

    influx_host = os.getenv('INFLUXDB_HOST')
    influx_user = os.getenv('INFLUXDB_USER')
    influx_port = os.getenv('INFLUXDB_PORT')
    influx_passwd = os.getenv('INFLUXDB_PASSWORD')

# mysql-connector-python connection pool for multithreading
# charset=utf8mb4 is required for proper Chinese character support
pool = pooling.MySQLConnectionPool(
    pool_name = "flask_pool",
    pool_size = 8,
    host = Config.SQL_host,
    user = Config.SQL_user,
    password = Config.SQL_passwd,
    database = Config.SQL_db,
    charset = 'utf8mb4',
    collation = 'utf8mb4_unicode_ci'
)

def get_db_connection():
    if not hasattr(g, "db_connection"):
        g.db_connection = pool.get_connection()
    return g.db_connection

# Teardown connection
@app.teardown_appcontext
def close_db_connection(exception):
    if hasattr(g, "db_connection"):
        try:
            g.db_connection.close()
        except Exception as e:
            app.logger.error(f"Error closing DB connection: {e}")

# InfluxDB
def influx_connect(database):
    global client
    # Skip connection if InfluxDB host is not configured
    if not Config.influx_host:
        print(f"InfluxDB host not configured, skipping connection for database: {database}")
        return None

    retry_count = 0
    while retry_count < Config.retry:
        try:
            client = InfluxDBClient(
                host = Config.influx_host,
                username = Config.influx_user,
                port = Config.influx_port,
                password = Config.influx_passwd,
                database = database
            )
            return client
        except exceptions.InfluxDBClientError as err:
            print(f"Failed to connect to InfluxDB: {err}")
            retry_count += 1
            time.sleep(Config.delay)
    print(f"Warning: Could not connect to InfluxDB for database: {database}")
    return None

class InfluxClient:
    wisdon_ue_client = influx_connect('wisdon-ue')
    wisdon_cell_client = influx_connect('wisdon-cell')
    viavi_ue_client = influx_connect('viavi-ue')
    viavi_cell_client = influx_connect('viavi-cell')
    inference_result_client = influx_connect('inference_result')

api = Api(app)

app.config['SWAGGER'] = {
    "title": "ORAN WEB API",
    "description": "API For MySQL",
    "version": "1.0.0",
    "termsOfService": "",
    "openapi": "3.0.2",
    "hide_top_bar": True
}

# Swagger
swag = Swagger(app, template_file = 'openapi.yml')

# API endpoints
from method.user import User
from method.project import Project
from method.user_project import User_Project
from method.cu import CU
from method.du import DU
from method.ru import RU
from method.map import Map
from method.brand import Brand
from method.executor import RunScript, RunSimulator, RunHeatmapUpdater, RunHeatmapDTUpdater, RunThroughtput
from method.influxdb import InfluxDB, InfluxDropMeasurement
from method.heatmap import Heatmap
from method.heatmapdt import HeatmapDT
from method.RU_cache  import Cache
from method.AI_model import Model
from method.project_map import Project_Map
from method.map_position import Map_Position
from method.throughtput import Throughtput
# from script.test import Test

api.add_resource(User, '/User', '/User/<string:identifier>', '/User/<string:option>/<string:value>')
api.add_resource(Project, '/Project', '/Project/<string:pid>')
api.add_resource(User_Project, '/User_Project/<string:identifier>/<string:id>')
api.add_resource(CU, '/CU/<string:id>', '/CU') # for get, put, delete; for post
api.add_resource(DU, '/DU', '/DU/<string:option>/<string:id>', '/DU/<string:id>')
api.add_resource(RU, '/RU', '/RU/<string:option>/<string:id>', '/RU/<string:id>')
api.add_resource(Map, '/Map', '/Map/<string:id>', '/Map/<string:option>/<string:id>')
api.add_resource(Brand, '/Brand', '/Brand/<string:option>/<string:id>', '/Brand/<string:id>')
# api.add_resource(RunScript, '/Script/<string:script_name>')
api.add_resource(RunSimulator, '/Simulator/<string:option>/<string:scenario>')
api.add_resource(InfluxDB, '/Influx/<string:database>', '/Influx/<string:database>/<string:measurement>/<string:time>')
api.add_resource(InfluxDropMeasurement, '/Influx/<string:database>/drop_measurement/<string:measurement>')
api.add_resource(HeatmapDT, '/HeatmapDT/<string:id>')
api.add_resource(Heatmap, '/Heatmap/<string:id>')
api.add_resource(Cache, '/RU_cache/<string:id>')
api.add_resource(RunHeatmapUpdater, '/HeatmapUpdater/<string:id>')
api.add_resource(RunHeatmapDTUpdater, '/HeatmapDTUpdater/<string:id>')
api.add_resource(Model, '/Model/<string:id>')
api.add_resource(Project_Map, '/Project_Map/<string:id>', '/Project_Map/<string:identifier>/<string:id>')
api.add_resource(Map_Position, '/Map_Position/<string:id>')
api.add_resource(Throughtput, '/Throughtput/<string:id>')
api.add_resource(RunThroughtput, '/RunThroughtput/<string:id>')
# api.add_resource(Test, '/Test')

# Auth endpoints
from method.auth import AuthLogin, AuthRegister, AuthLogout, AuthCurrentUser
api.add_resource(AuthLogin, '/auth/login')
api.add_resource(AuthRegister, '/auth/register')
api.add_resource(AuthLogout, '/auth/logout')
api.add_resource(AuthCurrentUser, '/auth/me', '/users/me')

# New frontend adapter endpoints (bridge old API to new RESTful paths)
from method.projects_adapter import (
    ProjectsMe, ProjectDetail, ProjectRUs, ProjectCUs, ProjectDUs,
    ProjectMaps, ProjectRsrp, ProjectRsrpDt, ProjectThroughput, ProjectThroughputDt, BrandsList
)
api.add_resource(ProjectsMe, '/projects/me')
api.add_resource(ProjectDetail, '/projects/<int:project_id>')
api.add_resource(ProjectRUs, '/projects/<int:project_id>/rus')
api.add_resource(ProjectCUs, '/projects/<int:project_id>/cus')
api.add_resource(ProjectDUs, '/projects/<int:project_id>/dus')
api.add_resource(ProjectMaps, '/projects/<int:project_id>/maps_frontend')
api.add_resource(ProjectRsrp, '/projects/<int:project_id>/rsrp')
api.add_resource(ProjectRsrpDt, '/projects/<int:project_id>/rsrp_dt')
api.add_resource(ProjectThroughput, '/projects/<int:project_id>/throughput')
api.add_resource(ProjectThroughputDt, '/projects/<int:project_id>/throughput_dt')
api.add_resource(BrandsList, '/brands')
