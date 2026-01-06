from models import db


class Brand(db.Model):
    __tablename__ = 'brands'

    brand_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    brand_name = db.Column(db.String(100), nullable=False, unique=True)
    bandwidth = db.Column(db.Float, nullable=False)
    tx_power = db.Column(db.Float, nullable=False)

    # 關聯到 BrandMetrics
    brand_metrics = db.relationship(
        "BrandMetrics",
        back_populates="brand",
        cascade="all, delete-orphan"
    )

    def __repr__(self):
        return f'<Brand {self.brand_name}>'

    def to_dict(self):
        return {
            'brand_id': self.brand_id,
            'brand_name': self.brand_name,
            'bandwidth': self.bandwidth,
            'tx_power': self.tx_power,
            'brand_metrics': [m.to_dict() for m in self.brand_metrics if m is not None]
        }
