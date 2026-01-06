from models import db

class AIMetrics(db.Model):
    __tablename__ = 'ai_metrics'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    model_id = db.Column(db.Integer, db.ForeignKey('primitive_AI_models.model_id', ondelete='CASCADE'), nullable=False)
    abstract_metrics_id = db.Column(db.Integer, db.ForeignKey('abstract_metrics.id', ondelete='CASCADE'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    type = db.Column(db.String(50), nullable=False)
    unit = db.Column(db.String(50), nullable=True)
    interval = db.Column(db.Integer, nullable=True)
    operator = db.Column(db.String(100), nullable=True)
    description = db.Column(db.String(255), nullable=True)

    # 關聯到 PrimitiveAIModel
    primitive_ai_model = db.relationship(
        "PrimitiveAIModel",
        back_populates="ai_metrics"
    )
    # 關聯到 AbstractMetrics
    abstract_metrics = db.relationship(
        "AbstractMetrics",
        back_populates="ai_metrics"
    )

    def __repr__(self):
        return f'<AIMetrics id={self.id} model_id={self.model_id} abstract_metrics_id={self.abstract_metrics_id} name={self.name}>'

    def to_dict(self):
        return {
            'id': self.id,
            'model_id': self.model_id,
            'abstract_metrics_id': self.abstract_metrics_id,
            'name': self.name,
            'type': self.type,
            'unit': self.unit,
            'interval': self.interval,
            'operator': self.operator,
            'description': self.description
        }
