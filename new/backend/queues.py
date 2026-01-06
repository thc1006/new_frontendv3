from celery import Celery
from dotenv import load_dotenv
import os


#get environment variables
load_dotenv()
CELERY_BROKER = os.getenv("CELERY_BROKER","redis://redis:6738/0")
CELERY_BACKEND = os.getenv("CELERY_BACKEND","redis://redis:6739/0")

exe_queue = Celery(
                'tasks',
                broker=CELERY_BROKER,
                backend=CELERY_BACKEND
            )

exe_queue.autodiscover_tasks(['tasks'])

class ContextTask(exe_queue.Task):
    def __call__(self,*args,**kwargs):
        from app import app
        from models import db
        with app.app_context():
            try:
                return super().__call__(*args, **kwargs)
            finally:
                # Ensure SQLAlchemy sessions do not leak between Celery tasks
                db.session.remove()
        
        
exe_queue.Task = ContextTask
