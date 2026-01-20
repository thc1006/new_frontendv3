
from models import db


class PrimitiveAIModel(db.Model):
    __tablename__ = 'primitive_AI_models'

    model_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    model_name = db.Column(db.String(100), nullable=False, unique=True)

    # 關聯到 AIMetrics
    ai_metrics = db.relationship(
        "AIMetrics",
        back_populates="primitive_ai_model",
        cascade="all, delete-orphan"
    )

    def __repr__(self):
        return f'<PrimitiveAIModel {self.model_name}>'

    def to_dict(self):
        return {
            'model_id': self.model_id,
            'model_name': self.model_name,
            # 'MinIO_name_for_AI_model': self.MinIO_name_for_AI_model
        }
