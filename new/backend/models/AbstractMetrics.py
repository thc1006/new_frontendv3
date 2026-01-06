
from models import db

class AbstractMetrics(db.Model):
    __tablename__ = 'abstract_metrics'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    key = db.Column(db.String(50), nullable=False, unique=True)  # 統一代號，例如 cell_on_off
    display_name = db.Column(db.String(100), nullable=False)     # 顯示名稱，例如 Cell ON/OFF

    # 關聯到 BrandMetrics
    brand_metrics = db.relationship(
        "BrandMetrics",
        back_populates="abstract_metrics",
        cascade="all, delete-orphan"
    )
    # 關聯到 AIMetrics
    ai_metrics = db.relationship(
        "AIMetrics",
        back_populates="abstract_metrics",
        cascade="all, delete-orphan"
    )

    def __repr__(self):
        return f"<AbstractMetrics {self.key} ({self.display_name})>"

    def to_dict(self):
        return {
            "id": self.id,
            "key": self.key,
            "display_name": self.display_name
        }
