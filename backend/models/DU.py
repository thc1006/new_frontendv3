from models import db


class DU(db.Model):
    __tablename__ = 'DUs'

    DU_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    CU_id = db.Column(db.Integer, db.ForeignKey('CUs.CU_id'), nullable=True)
    project_id = db.Column(db.Integer, db.ForeignKey(
        'projects.project_id'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    brand_id = db.Column(
        db.Integer,
        db.ForeignKey('brands.brand_id'),
        nullable=False)

    # DU 可以控制其下屬 RU 的關聯
    RUs = db.relationship(
        'RU',
        back_populates='DU',
        cascade='save-update, merge')

    # 關聯到 CU
    CU = db.relationship(
        'CU',
        back_populates='DUs',)

    # 關聯到 Project
    project = db.relationship(
        'Project',
        back_populates='DUs',)

    __table_args__ = (
        db.UniqueConstraint('project_id', 'name', name='uq_du_pid_name'),
    )

    def __repr__(self):
        return f'<DU {self.name}>'

    def to_dict(self):
        return {
            'DU_id': self.DU_id,
            'CU_id': self.CU_id,
            'project_id': self.project_id,
            'name': self.name,
            'brand_id': self.brand_id
        }
