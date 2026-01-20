from models import db
from enums.HeatmapState import HeatmapState
from utils.minIOName import MinIOName


class Evaluation(db.Model):
    __tablename__ = 'evaluations'

    eval_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    project_id = db.Column(db.Integer, db.ForeignKey(
        'projects.project_id'), nullable=False)

    # 每張圖的狀態 (e.g. 'IDLE', 'WAITING', 'FAILURE', 'SUCCESS')
    rsrp_status = db.Column(db.Enum(HeatmapState), nullable=True, default=HeatmapState.IDLE)
    throughput_status = db.Column(db.Enum(HeatmapState), nullable=True, default=HeatmapState.IDLE)
    rsrp_dt_status = db.Column(db.Enum(HeatmapState), nullable=True, default=HeatmapState.IDLE)
    throughput_dt_status = db.Column(db.Enum(HeatmapState), nullable=True, default=HeatmapState.IDLE)

    # 關聯到 Project
    project = db.relationship(
        'Project',
        back_populates='evaluations')

    # 關聯到 RUCache
    RU_caches = db.relationship(
        'RUCache',
        back_populates='evaluation',
        cascade='save-update, merge, delete , delete-orphan')

    def __repr__(self):
        return f'<Evaluation {self.eval_id}>'

    def to_dict(self):
        return {
            'eval_id': self.eval_id,
            'project_id': self.project_id,
            'minio_name_for_rsrp': MinIOName.evaluation_rsrp_heatmap(self.eval_id),
            'minio_name_for_throughput': MinIOName.evaluation_throughput_heatmap(self.eval_id),
            'minio_name_for_rsrp_dt': MinIOName.evaluation_rsrp_dt_heatmap(self.eval_id),
            'minio_name_for_throughput_dt': MinIOName.evaluation_throughput_dt_heatmap(self.eval_id),
            'rsrp_status': self.rsrp_status.value,
            'throughput_status': self.throughput_status.value,
            'rsrp_dt_status': self.rsrp_dt_status.value,
            'throughput_dt_status': self.throughput_dt_status.value
        }
