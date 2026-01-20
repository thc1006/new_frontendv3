
from models import db

class BrandMetrics(db.Model):
    __tablename__ = 'brand_metrics'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    brand_id = db.Column(db.Integer, db.ForeignKey('brands.brand_id', ondelete='CASCADE'), nullable=False)  # 外鍵對應 Brand 的 brand_id
    name = db.Column(db.String(100), nullable=False)
    type = db.Column(db.String(50), nullable=False)
    unit = db.Column(db.String(50), nullable=True)
    interval = db.Column(db.Integer, nullable=True)
    api_source = db.Column(db.String(100), nullable=True)
    operator = db.Column(db.String(100), nullable=True)
    description = db.Column(db.String(255), nullable=True)

    # 關聯到 AbstractMetric
    abstract_metrics_id = db.Column(
        db.Integer,
        db.ForeignKey("abstract_metrics.id", ondelete="CASCADE"),
        nullable=False
    )
    abstract_metrics = db.relationship(
        "AbstractMetrics",
        back_populates="brand_metrics"
    )

    # 關聯到 Brand
    brand = db.relationship(
        "Brand",
        back_populates="brand_metrics"
    )

    def __repr__(self):
        return f'<BrandMetrics id={self.id} brand_id={self.brand_id} name={self.name}>'

    def to_dict(self):
        return {
            'id': self.id,
            'brand_id': self.brand_id,
            'name': self.name,
            'type': self.type,
            'unit': self.unit,
            'interval': self.interval,
            'api_source': self.api_source,
            'operator': self.operator,
            'description': self.description,
            "abstract_metrics_id": self.abstract_metrics_id
        }
