
from prometheus_client import multiprocess, CollectorRegistry
from prometheus_client import Counter, Gauge, Histogram, generate_latest, CONTENT_TYPE_LATEST
from flask import Flask, g, request, Response

from dotenv import load_dotenv
import os
import time
from mysql.connector import pooling

app = Flask(__name__)
load_dotenv()

SQL_host = os.getenv('DB_HOST')
SQL_user = os.getenv('DB_USER')
SQL_passwd = os.getenv('DB_PASSWORD')
SQL_db = os.getenv('DB_DATABASE')
SQLALCHEMY_DATABASE_URI = f'mysql+mysqlconnector://{SQL_user}:{SQL_passwd}@{SQL_host}:3306/{SQL_db}'
SQLALCHEMY_TRACK_MODIFICATIONS = False
SECRET_KEY = os.getenv('SECRET_KEY')
NOMINATIM_API_URL = os.getenv('NOMINATIM_API_URL', 'https://nominatim.openstreetmap.org/search')
CALCULATION_CALLBACK_BASE_URL = os.getenv('CALCULATION_CALLBACK_BASE_URL')

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
    RESPONSE_TIME_HISTOGRAM.labels(
        method=request.method,
        endpoint=request.path).observe(request_latency)
    return response


@app.route("/metrics")
def metrics():
    registry = CollectorRegistry()
    multiprocess.MultiProcessCollector(registry)
    return Response(
        generate_latest(registry),
        content_type=CONTENT_TYPE_LATEST)


class Config:
    SQL_host = os.getenv('DB_HOST')
    SQL_user = os.getenv('DB_USER')
    SQL_passwd = os.getenv('DB_PASSWORD')
    SQL_db = os.getenv('DB_DATABASE')
    retry = 5
    delay = 10


# mysql-connector-python connection pool for multithreading
pool = pooling.MySQLConnectionPool(
  pool_name="flask_pool",
  pool_size=2,
  host=Config.SQL_host,
  user=Config.SQL_user,
  password=Config.SQL_passwd,
  database=Config.SQL_db
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




app.config['SWAGGER'] = {
    "title": "ORAN WEB API",
    "description": "API For MySQL",
    "version": "1.0.0",
    "termsOfService": "",
    "openapi": "3.0.2",
    "hide_top_bar": True
}
