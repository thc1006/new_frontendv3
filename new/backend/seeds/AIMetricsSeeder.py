from flask_seeder import Seeder
from app import app, db
from models.AbstractMetrics import AbstractMetrics

class AIMetricsSeeder(Seeder):
    def __init__(self, db=None):
        super().__init__(db=db)
        self.priority = 4
    def run(self):
        with app.app_context():
            # 直接對應 MetricsSeeder 的三個 AbstractMetrics
            metric_keys = ["ue_per_cell", "serving_rsrp", "cell_on_off"]
            metric_names = ["AI UE Count", "AI RSRP", "AI Cell ON/OFF"]
            metric_units = [None, "dBm", None]
            metric_intervals = [5, 5, 1]
            metric_descs = ["AI 預測 UE 數量", "AI 預測 RSRP", "AI 預測 Cell 狀態"]
            from models.PrimitiveAIModel import PrimitiveAIModel
            from models.AIMetrics import AIMetrics
            nes_model = PrimitiveAIModel.query.filter_by(model_name="NES").first()
            if not nes_model:
                nes_model = PrimitiveAIModel(model_name="NES")
                db.session.add(nes_model)
                db.session.flush()
            for idx, key in enumerate(metric_keys):
                abs_obj = AbstractMetrics.query.filter_by(key=key).first()
                if not abs_obj:
                    print(f"AbstractMetrics with key '{key}' not found, please run MetricsSeeder first.")
                    continue
                aim = AIMetrics.query.filter_by(model_id=nes_model.model_id, abstract_metrics_id=abs_obj.id).first()
                if not aim:
                    aim = AIMetrics(
                        model_id=nes_model.model_id,
                        abstract_metrics_id=abs_obj.id,
                        name=metric_names[idx],
                        type="Report",
                        unit=metric_units[idx],
                        interval=metric_intervals[idx],
                        operator="=",
                        description=metric_descs[idx]
                    )
                    db.session.add(aim)
            db.session.commit()
            print("Seeded NES AI metrics and mapped to existing AbstractMetrics.")