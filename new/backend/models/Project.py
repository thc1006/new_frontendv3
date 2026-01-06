from sqlalchemy.ext.associationproxy import association_proxy
from datetime import date
from enums.HeatmapState import HeatmapState
import models.UserProject  # noqa: F401

from models import db


class Project(db.Model):
    __tablename__ = 'projects'

    project_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    title = db.Column(db.String(100), nullable=False)
    date = db.Column(db.Date, nullable=False, default=date.today)
    
    grafana_folder_id = db.Column(
        db.String(100), nullable=True, unique=True, default=None)
    
    lat = db.Column(db.Double, nullable=False)
    lon = db.Column(db.Double, nullable=False)
    margin = db.Column(db.Integer, nullable=False)

    rotation_offset = db.Column(db.Double, nullable=True, default=0.0)
    lat_offset = db.Column(db.Double, nullable=True, default=0.0)
    lon_offset = db.Column(db.Double, nullable=True, default=0.0)
    scale = db.Column(db.Double, nullable=True, default=1.0)

    user_projects = db.relationship(
        'UserProject',
        back_populates='project',
        cascade='all, delete-orphan')
    users = association_proxy('user_projects', 'user')


    # heatmap status
    rsrp_status = db.Column(db.Enum(HeatmapState), nullable=True, default=HeatmapState.IDLE)
    throughput_status = db.Column(db.Enum(HeatmapState), nullable=True, default=HeatmapState.IDLE)
    rsrp_dt_status = db.Column(db.Enum(HeatmapState), nullable=True, default=HeatmapState.IDLE)
    throughput_dt_status = db.Column(db.Enum(HeatmapState), nullable=True, default=HeatmapState.IDLE)

    # 關聯到 AI 模型
    AI_models = db.relationship(
        'AIModel',
        back_populates='project',
        cascade='all, delete-orphan')

    # 關聯到 DT AI 模型
    DT_AI_models = db.relationship(
        'DTAIModel',
        back_populates='project',
        cascade='all, delete-orphan')

    evaluations = db.relationship(
        'Evaluation',
        back_populates='project',
        cascade='all, delete-orphan')

    # 關聯到 CU, DU, RU

    CUs = db.relationship(
        'CU',
        back_populates='project',
        cascade='all, delete-orphan')

    DUs = db.relationship(
        'DU',
        back_populates='project',
        cascade='all, delete-orphan')

    RUs = db.relationship(
        'RU',
        back_populates='project',
        cascade='all, delete-orphan')

    map = db.relationship(
        "Map",
        back_populates="project",
        uselist=False,
        cascade="all, delete-orphan",
        single_parent=True,
    )

    chat_sessions = db.relationship(
        'ChatSession',
        back_populates='project',
        cascade='all, delete-orphan'
    )

    @property
    def owner(self):
        # 取得該 project 的 owner user 物件
        owner_up = next((up for up in self.user_projects if up.role.name.lower() == 'owner'), None)
        return owner_up.user if owner_up else None

    @property
    def is_deployed(self):
        #exist CUs == deployed
        return len(self.CUs) > 0
    
    def __repr__(self):
        return f'<Project {self.title}>'

    def to_dict(self):
        data = {
            'project_id': self.project_id,
            'title': self.title,
            'date': self.date.isoformat(),
            'lat': self.lat,
            'lon': self.lon,
            'margin': self.margin, 
            'owner': self.owner.to_dict() if hasattr(self.owner, 'to_dict') else self.owner,
            'grafana_folder_id': self.grafana_folder_id,
            'rsrp_status': self.rsrp_status.value if self.rsrp_status else None,
            'throughput_status': self.throughput_status.value if self.throughput_status else None,
            'rsrp_dt_status': self.rsrp_dt_status.value if self.rsrp_dt_status else None,
            'throughput_dt_status': self.throughput_dt_status.value if self.throughput_dt_status else None,
            'is_deployed' : self.is_deployed,
            'rotation_offset': self.rotation_offset,
            'lat_offset': self.lat_offset,
            'lon_offset': self.lon_offset,
            'scale': self.scale
        }
        return data
