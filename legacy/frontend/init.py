from flask import Flask
import datetime
import os;
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__, template_folder='templates')
my_secret = "\x03/\x00\xfd\x96\xd3\no\x9bQ\xeb\x9b\xd8\x9b\xdd\x8f"
app.permanent_session_lifetime = datetime.timedelta(hours=1)
app.config['SESSION_TYPE'] = 'filesystem'
app.config['SECRET_KEY'] = my_secret


class SharedVar:
    ctrl_ip = os.getenv("BACKEND_HOST")
    ctrl_port = os.getenv("BACKEND_PORT")
    wireless_insite_file = 'tmp_simulator'      # 卡，暫時塞我們的 script
    AI_models = ['NES', 'MRO', 'RanDT']
