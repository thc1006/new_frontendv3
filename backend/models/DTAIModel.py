from models import db


class DTAIModel(db.Model):
    __tablename__ = 'DT_AI_models'

    DT_AI_model_id = db.Column(
        db.Integer,
        primary_key=True,
        autoincrement=True)
    model_name = db.Column(db.String(100), nullable=False)
    # MinIO_name_for_DT_AI_model = db.Column(db.String(255), nullable=False)

    project_id = db.Column(
        db.Integer,
        db.ForeignKey('projects.project_id'),
        nullable=False)

    # 關聯到 Project
    project = db.relationship(
        'Project',
        back_populates='DT_AI_models')

    def __repr__(self):
        return f'<DTAIModel {self.model_name}>'

    def to_dict(self):
        return {
            'DT_AI_model_id': self.DT_AI_model_id,
            'model_name': self.model_name,
            'project_id': self.project_id
            # 'MinIO_name_for_DT_AI_model': self.MinIO_name_for_DT_AI_model
        }
