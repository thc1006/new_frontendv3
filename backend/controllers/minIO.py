import os
import io
from minio import Minio
from minio.error import S3Error
from flask import request, Blueprint
from dotenv import load_dotenv

#load .env
load_dotenv()

# MinIO 連線設定
MINIO_ENDPOINT = os.getenv('MINIO_ENDPOINT', 'minio:9000')
MINIO_ACCESS_KEY = os.getenv('MINIO_ACCESS_KEY', 'user')
MINIO_SECRET_KEY = os.getenv('MINIO_SECRET_KEY', 'password')
MINIO_SECURE = os.getenv('MINIO_SECURE', 'false').lower() == 'true'

minio_client = Minio(
    MINIO_ENDPOINT,
    access_key=MINIO_ACCESS_KEY,
    secret_key=MINIO_SECRET_KEY,
    secure=MINIO_SECURE
)

minio_api_bp = Blueprint('minio_api', __name__)

def bucket_exists(bucket):
    try:
        return minio_client.bucket_exists(bucket)
    except S3Error as err:
        print(f"MinIO bucket_exists error: {err}")
        return False

def object_exists(bucket, object_name):
    try:
        minio_client.stat_object(bucket, object_name)
        return True
    except S3Error as err:
        if err.code == "NoSuchKey":
            return False
        else:
            print(f"MinIO stat_object error: {err}")
            raise

@minio_api_bp.route('/minio/ensure_bucket', methods=['POST'])
def api_ensure_bucket():
    data = request.get_json()
    bucket = data.get('bucket')
    if not bucket:
        return {'message': 'Missing bucket'}, 400
    if bucket_exists(bucket):
        return {'success': True}
    else:
        return {'success': False, 'error': f"Bucket '{bucket}' does not exist."}, 404

@minio_api_bp.route('/minio/upload_json', methods=['POST'])
def api_upload_json():
    data = request.get_json()
    bucket = data.get('bucket')
    object_name = data.get('object_name')
    json_str = data.get('json_str')
    if not (bucket and object_name and json_str):
        return {'message': 'Missing parameter'}, 400
    if not bucket_exists(bucket):
        return {'success': False, 'error': f"Bucket '{bucket}' does not exist."}, 404
    try:
        result = upload_json_stream(bucket, object_name, json_str)
        if result:
            return {'success': True}
        else:
            return {'success': False, 'error': 'Upload failed'}, 500
    except Exception as e:
        return {'success': False, 'error': str(e)}, 500

@minio_api_bp.route('/minio/get_json', methods=['POST'])
def api_get_json():
    data = request.get_json()
    bucket = data.get('bucket')
    object_name = data.get('object_name')
    if not (bucket and object_name):
        return {'message': 'Missing parameter'}, 400
    if not bucket_exists(bucket):
        return {'success': False, 'error': f"Bucket '{bucket}' does not exist."}, 404
    if not object_exists(bucket, object_name):
        return {'success': False, 'error': f"Object '{object_name}' does not exist in bucket '{bucket}'."}, 404
    try:
        result = get_json_data(bucket, object_name)
        return {'json': result}
    except Exception as e:
        return {'success': False, 'error': str(e)}, 500

@minio_api_bp.route('/minio/delete_object', methods=['POST'])
def api_delete_object():
    data = request.get_json()
    bucket = data.get('bucket')
    object_name = data.get('object_name')
    if not (bucket and object_name):
        return {'message': 'Missing parameter'}, 400
    if not bucket_exists(bucket):
        return {'success': False, 'error': f"Bucket '{bucket}' does not exist."}, 404
    if not object_exists(bucket, object_name):
        return {'success': False, 'error': f"Object '{object_name}' does not exist in bucket '{bucket}'."}, 404
    try:
        minio_client.remove_object(bucket, object_name)
        return {'success': True}
    except Exception as e:
        return {'success': False, 'error': str(e)}, 500


def ensure_bucket(bucket_name):
    """確保 bucket 存在，不存在則報錯"""
    try:
        if not minio_client.bucket_exists(bucket_name):
            raise ValueError(f"Bucket '{bucket_name}' does not exist.")
        return True
    except S3Error as err:
        print(f"MinIO ensure bucket error: {err}")
        return False
    except ValueError as ve:
        print(ve)
        return False


def upload_json_stream(bucket_name, object_name, json_str):
    """直接將 JSON 字串上傳到 MinIO ，不經過本地檔案（不再檢查 bucket 是否存在）"""
    try:
        json_bytes = json_str.encode('utf-8')
        minio_client.put_object(
            bucket_name,
            object_name,
            data=io.BytesIO(json_bytes),
            length=len(json_bytes),
            content_type='application/json'
        )
        return True
    except S3Error as err:
        print(f"MinIO upload json stream error: {err}")
        return False
    except Exception as e:
        print(f"Other error: {e}")
        return False


def get_json_data(bucket_name, object_name):
    """根據 object name 取得 MinIO 內的 json 檔並以 JSON 字串回傳"""
    try:
        response = minio_client.get_object(bucket_name, object_name)
        json_str = response.read().decode('utf-8')
        response.close()
        response.release_conn()
        return json_str
    except S3Error as err:
        print(f"MinIO get json error: {err}")
        return None
    except Exception as e:
        print(f"Other error: {e}")
        return None

def upload_file_stream(bucket: str, object_name: str, fs) -> bool:
    """
    Upload a Flask FileStorage stream to MinIO with correct length.
    """
    try:
        # 1. 確保 bucket 存在
        if not minio_client.bucket_exists(bucket):
            minio_client.make_bucket(bucket)

        # 2. 計算串流長度
        stream = fs.stream
        stream.seek(0, os.SEEK_END)
        size = stream.tell()     # 取得總長度
        stream.seek(0)           # 重置游標到檔頭

        # 3. 上傳
        minio_client.put_object(
            bucket_name=bucket,
            object_name=object_name,
            data=stream,
            length=size,
            content_type=fs.mimetype or 'application/octet-stream'
        )
        return True
    except S3Error as err:
        print(f"MinIO 上傳失敗：{err}")
        return False

def upload_file(bucket_name, object_name, file_location, file_type):
    type = "application/" + file_type
    try:
        minio_client.fput_object(
            bucket_name,
            object_name,
            file_location,
            content_type=type
        )
        return True
    except S3Error as err:
        print(f"MinIO upload file error: {err}")
        return False
    except Exception as e:
        print(f"Other error: {e}")
        return False

def get_usd_data(bucket_name, object_name):
    try:
        data = minio_client.get_object(
            bucket_name,
            object_name
        )
        return { 'success': True, 'data': data.read() }
    except S3Error as err:
        print(f"MinIO download file error: {err}")
        return { 'success': False, 'error': str(err) }
    except Exception as e:
        print(f"Other error: {e}")
        return { 'success': False, 'error': str(e) }