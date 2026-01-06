from dotenv import load_dotenv
import os
from minio import Minio
from minio.error import S3Error

load_dotenv()

def to_bool(val: str | None, default: bool = False) -> bool:
    if val is None:
        return default
    v = str(val).strip().lower()
    if v in {"1", "true", "yes", "on"}:
        return True
    if v in {"0", "false", "no", "off"}:
        return False
    return default
    

MINIO_ENDPOINT   = os.getenv("MINIO_ENDPOINT", "minio:9000")
MINIO_ACCESS_KEY = os.getenv("MINIO_ACCESS_KEY", "user")
MINIO_SECRET_KEY = os.getenv("MINIO_SECRET_KEY", "password")
MINIO_SECURE     = to_bool(os.getenv("MINIO_SECURE"), default=False)


def main():
    client = Minio(
        MINIO_ENDPOINT,
        access_key=MINIO_ACCESS_KEY,
        secret_key=MINIO_SECRET_KEY,
        secure=MINIO_SECURE
    )
    # 會被檢查的bucket
    buckets = ['rsrp', 'rsrp-dt', 'throughput',
               'throughput-dt', 'all-ai-model', 'dt-ai-model',
               'gltf', 'mapaodt', 'mapfrontend',]
    for bucket_name in buckets:
        found = client.bucket_exists(bucket_name)
        if not found:
            client.make_bucket(bucket_name)

    

if __name__ == "__main__":
    try:
        main()
    except S3Error as exc:
        print("error occurred.", exc)
