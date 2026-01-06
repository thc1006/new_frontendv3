from models import db


class CU(db.Model):
    __tablename__ = 'CUs'

    CU_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    project_id = db.Column(db.Integer, db.ForeignKey(
        'projects.project_id'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    brand_id = db.Column(
        db.Integer,
        db.ForeignKey('brands.brand_id'),
        nullable=False)

    # CU 可以控制其下屬 DU 的關聯
    DUs = db.relationship(
        'DU',
        back_populates='CU',
        cascade='save-update, merge')

    # 關聯到 Project
    project = db.relationship(
        'Project',
        back_populates='CUs')
    

    __table_args__ = (
        db.UniqueConstraint('project_id', 'name', name='uq_cu_pid_name'),
    )

    def __repr__(self):
        return f'<CU {self.name}>'

    def to_dict(self):
        return {
            'CU_id': self.CU_id,
            'project_id': self.project_id,
            'name': self.name,
            'brand_id': self.brand_id
        }
