from models import db


class PrimitiveDTAIModel(db.Model):
    __tablename__ = 'primitive_DT_AI_models'

    model_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    model_name = db.Column(db.String(100), nullable=False)
    # MinIO_name_for_DT_AI_model = db.Column(db.String(255), nullable=False)

    def __repr__(self):
        return f'<PrimitiveDTAIModel {self.model_name}>'

    def to_dict(self):
        return {
            'model_id': self.model_id,
            'model_name': self.model_name,
            # 'MinIO_name_for_DT_AI_model': self.MinIO_name_for_DT_AI_model
        }
