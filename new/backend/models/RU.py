from models import db


class RU(db.Model):
    __tablename__ = 'RUs'

    RU_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(100), nullable=False)
    DU_id = db.Column(db.Integer, db.ForeignKey('DUs.DU_id'), nullable=True)
    project_id = db.Column(db.Integer, db.ForeignKey(
        'projects.project_id'), nullable=False)
    brand_id = db.Column(
        db.Integer,
        db.ForeignKey('brands.brand_id'),
        nullable=False)

    lat = db.Column(db.Double, nullable=False)
    lon = db.Column(db.Double, nullable=False)
    z = db.Column(db.Double, nullable=False)

    bandwidth = db.Column(db.Float, nullable=False)
    tx_power = db.Column(db.Float, nullable=False)
    roll = db.Column(db.Integer, nullable=False)
    tilt = db.Column(db.Integer, nullable=False)
    opening_angle = db.Column(db.Integer, nullable=False)
    # config = db.Column(JSON)

    DU = db.relationship(
        'DU',
        back_populates='RUs')

    project = db.relationship(
        'Project',
        back_populates='RUs')

    __table_args__ = (
        db.UniqueConstraint('project_id', 'name', name='uq_ru_pid_name'),
    )

    def __repr__(self):
        return f'<RU {self.name}>'

    def to_dict(self):
        return {
            'RU_id': self.RU_id,
            'name': self.name,
            'DU_id': self.DU_id,
            'project_id': self.project_id,
            'brand_id': self.brand_id,
            'location': {
                'lat': self.lat,
                'lon': self.lon,
                'z': self.z
            },
            'bandwidth': self.bandwidth,
            'tx_power': self.tx_power,
            'roll': self.roll,
            'tilt': self.tilt,
            'opening_angle': self.opening_angle
        }
