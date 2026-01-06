from models import db


class Map(db.Model):
    __tablename__ = 'maps'

    map_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    project_id = db.Column(
        db.Integer,
        db.ForeignKey("projects.project_id", ondelete="CASCADE"),
        unique=True,
        nullable=False
    )
    MinIO_map_for_aodt = db.Column(
        db.String(255), nullable=True)
    MinIO_map_for_frontend = db.Column(
        db.String(255), nullable=False)

    # 關聯到 Project
    project = db.relationship(
        "Project",
        back_populates="map",
        uselist=False,         # 與 Project.map 對稱
    )

    def __repr__(self):
        return f'<Map map_id={self.map_id} project_id={self.project_id}>'

    def to_dict(self):
        return {
            'map_id': self.map_id,
            'project_id': self.project_id,
            'MinIO_map_for_aodt': self.MinIO_map_for_aodt,
            'MinIO_map_for_frontend': self.MinIO_map_for_frontend
        }
