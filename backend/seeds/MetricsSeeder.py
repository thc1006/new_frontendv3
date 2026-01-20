import os
import sys
import re

sys.path.append(
    os.path.abspath(
        os.path.join(os.path.dirname(__file__), '..')
    )
)

from flask_seeder import Seeder
from app import app, db
from models.AbstractMetrics import AbstractMetrics
from models.BrandMetrics import BrandMetrics
from models.Brand import Brand

class MetricsSeeder(Seeder):
    def __init__(self, db=None):
        super().__init__(db=db)
        self.priority = 3

    def _make_key(self, name):
        # 將參數名稱轉成 key，例如 "CU/DU switch" -> "cu_du_switch"
        key = re.sub(r'[^0-9a-zA-Z]+', '_', name).strip('_').lower()
        return key

    def run(self):
        with app.app_context():
            data = [
                {
                    "key": "ue_per_cell",
                    "display_name": "使用者個數 (by cell)",
                    "vendors": [
                        {"vendor": "Pegatron", "name": "# of UE per cell", "type": "Report", 
                            "unit": None, "interval": 5, "api_source": "OSS-uelist", "operator": "=", "description": "每個小區的使用者數量"},
                        {"vendor": "WNC", "name": "# of UE per cell", "type": "Report", 
                            "unit": None, "interval": 1, "api_source": "Netopeer-stream", "operator": "=", "description": "每個小區的使用者數量"}
                    ]
                },
                {
                    "key": "serving_rsrp",
                    "display_name": "Serving RSRP 分布",
                    "vendors": [
                        {"vendor": "Pegatron", "name": "Serving RSRP per UE", "type": "Report", 
                            "unit": "dBm", "interval": 5, "api_source": "OSS-uelist", "operator": "=", "description": "每個使用者的 Serving RSRP"},
                        {"vendor": "WNC", "name": "Serving RSRP per UE", "type": "Report", 
                            "unit": "dBm", "interval": 1, "api_source": "Netopeer-stream", "operator": "=", "description": "每個使用者的 Serving RSRP"}
                    ]
                },
                {
                    "key": "cell_on_off",
                    "display_name": "Cell ON/OFF",
                    "vendors": [
                        {"vendor": "Pegatron", "name": "CU/DU switch", "type": "Report", 
                            "unit": None, "interval": 1, "api_source": "BMC", "operator": "=", "description": "CU/DU 切換狀態"},
                        {"vendor": "WNC", "name": "DU administrativeState", "type": "Report", 
                            "unit": None, "interval": None, "api_source": "Netopeer", "operator": "=", "description": "DU 行政狀態"},
                        {"vendor": "WNC", "name": "RU RF switch", "type": "Report", 
                            "unit": None, "interval": None, "api_source": "Netopeer", "operator": "=", "description": "RU RF 切換狀態"}
                    ]
                }
            ]

            # 1. 先建立 data list 內的 abstract 與 metrics
            created_keys = set()
            for concept in data:
                abs_metrics = AbstractMetrics(
                    key=concept["key"],
                    display_name=concept["display_name"]
                )
                db.session.add(abs_metrics)
                db.session.flush()
                created_keys.add(concept["key"])
                for v in concept["vendors"]:
                    # 取得或建立 Brand
                    brand = Brand.query.filter_by(brand_name=v["vendor"]).first()
                    if not brand:
                        brand = Brand(brand_name=v["vendor"], bandwidth=0, tx_power=0)
                        db.session.add(brand)
                        db.session.flush()
                    metric = BrandMetrics(
                        brand_id=brand.brand_id,
                        name=v["name"],
                        type=v["type"],
                        unit=v["unit"],
                        interval=v["interval"],
                        api_source=v["api_source"],
                        operator=v.get("operator", None),
                        description=v.get("description", None),
                        abstract_metrics_id=abs_metrics.id
                    )
                    db.session.add(metric)

            # 2. Pegatron/WNC 其他表格參數（未在 data list 的）
            pegatron_metrics = [
                {"vendor": "Pegatron", "name": "DL throughput per cell", "type": "Report (KPI)", 
                    "unit": "Mbps", "interval": 5, "api_source": "OSS-uelist", "operator": "=", "description": "每個小區的下行吞吐量"},
                {"vendor": "Pegatron", "name": "UL throughput per cell", "type": "Report", 
                    "unit": "Mbps", "interval": 5, "api_source": "OSS-uelist", "operator": "=", "description": "每個小區的上行吞吐量"},
                {"vendor": "Pegatron", "name": "Serving SINR per UE", "type": "Report", 
                    "unit": "dB", "interval": 5, "api_source": "OSS-uelist", "operator": "=", "description": "每個使用者的 Serving SINR"},
                {"vendor": "Pegatron", "name": "Neighbor RSRP per UE", "type": "Report", 
                    "unit": "dBm", "interval": 5, "api_source": "OSS-uelist", "operator": "=", "description": "每個使用者的 Neighbor RSRP"},
                {"vendor": "Pegatron", "name": "Neighbor SINR per UE", "type": "Report", 
                    "unit": "dB", "interval": 5, "api_source": "OSS-uelist", "operator": "=", "description": "每個使用者的 Neighbor SINR"},
                {"vendor": "Pegatron", "name": "Downlink PRB usage per cell", "type": "Report", 
                    "unit": None, "interval": 300, "api_source": "OSS-pm", "operator": "=", "description": "每個小區的下行 PRB 使用率"},
                {"vendor": "Pegatron", "name": "Uplink PRB usage per cell", "type": "Report", 
                    "unit": None, "interval": 300, "api_source": "OSS-pm", "operator": "=", "description": "每個小區的上行 PRB 使用率"},
                {"vendor": "Pegatron", "name": "CU/DU power usage", "type": "Report", 
                    "unit": "Watt", "interval": 1, "api_source": "BMC", "operator": "=", "description": "CU/DU 功率使用率"}
            ]
            wnc_metrics = [
                {"vendor": "WNC", "name": "UL throughput per cell", "type": "Report", 
                    "unit": "Kbps", "interval": 10, "api_source": "Netopeer-stream", "operator": "=", "description": "每個小區的上行吞吐量"},
                {"vendor": "WNC", "name": "DL throughput per cell", "type": "Report", 
                    "unit": "Kbps", "interval": 10, "api_source": "Netopeer-stream", "operator": "=", "description": "每個小區的下行吞吐量"},
                {"vendor": "WNC", "name": "Serving SINR per UE", "type": "Report", 
                    "unit": "dB", "interval": 1, "api_source": "Netopeer-stream", "operator": "=", "description": "每個使用者的 Serving SINR"},
                {"vendor": "WNC", "name": "Neighbor RSRP per UE", "type": "Report", 
                    "unit": "dBm", "interval": 1, "api_source": "Netopeer-stream", "operator": "=", "description": "每個使用者的 Neighbor RSRP"},
                {"vendor": "WNC", "name": "Neighbor SINR per UE", "type": "Report", 
                    "unit": "dB", "interval": 1, "api_source": "Netopeer-stream", "operator": "=", "description": "每個使用者的 Neighbor SINR"},
                {"vendor": "WNC", "name": "CU/DU power usage", "type": "Report", 
                    "unit": "Watt", "interval": 1, "api_source": "BMC", "operator": "=", "description": "CU/DU 功率使用率"},
                {"vendor": "WNC", "name": "RU RF TX Power", "type": "Report", 
                    "unit": None, "interval": None, "api_source": "Netopeer", "operator": "=", "description": "RU RF TX 功率"}
            ]

            for m in pegatron_metrics + wnc_metrics:
                key = self._make_key(m["name"])
                if key in created_keys:
                    continue
                abs_metrics = AbstractMetrics(key=key, display_name=m["name"])
                db.session.add(abs_metrics)
                db.session.flush()
                # 取得或建立 Brand
                brand = Brand.query.filter_by(brand_name=m["vendor"]).first()
                if not brand:
                    brand = Brand(brand_name=m["vendor"], bandwidth=0, tx_power=0)
                    db.session.add(brand)
                    db.session.flush()
                metric = BrandMetrics(
                    brand_id=brand.brand_id,
                    name=m["name"],
                    type=m["type"],
                    unit=m["unit"],
                    interval=m["interval"],
                    api_source=m["api_source"],
                    operator=m.get("operator", None),
                    description=m.get("description", None),
                    abstract_metrics_id=abs_metrics.id
                )
                db.session.add(metric)
                created_keys.add(key)

            db.session.commit()
            print(f"Seeded {len(created_keys)} abstract metrics with vendor mappings")
