from models import db


class AIModel(db.Model):
    __tablename__ = 'AI_models'

    AI_model_id = db.Column(
        db.Integer,
        primary_key=True,
        autoincrement=True)
    model_name = db.Column(db.String(100), nullable=False)

    project_id = db.Column(
        db.Integer,
        db.ForeignKey('projects.project_id'),
        nullable=False)

    is_active = db.Column(db.Boolean, default=False)
    is_training = db.Column(db.Boolean, default=False)
    can_be_updated = db.Column(db.Boolean, default=False)

    # 關聯到 Project
    project = db.relationship(
        'Project',
        back_populates='AI_models')

    def __repr__(self):
        return f'<AIModel {self.model_name}>'

    def to_dict(self):
        return {
            'AI_model_id': self.AI_model_id,
            'model_name': self.model_name,
            'project_id': self.project_id,
            'is_active': self.is_active,
            'is_training': self.is_training,
            'can_be_updated': self.can_be_updated
        }
