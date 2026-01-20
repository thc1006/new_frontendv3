import os
import sys

sys.path.append(
    os.path.abspath(
        os.path.join(os.path.dirname(__file__), '..')
    )
)

import pathlib
from flask_seeder import Seeder
from models.Project import Project
from controllers.minIO import upload_file
from models.Map import Map

name_dict = {
    1: "Nanzih",
    2: "Tianliao",
    3: "Kaohsiung_firestation",
}

class MapSeeder(Seeder):
    def __init__(self, db=None):
        super().__init__(db=db)       # initialize parent
        self.priority = 2

    def run(self):
        SEED_DIR = pathlib.Path(__file__).parent / "map_seed_files"
        projects = Project.query.limit(3).all()
        for proj in projects:
            base = name_dict.get(proj.project_id)
            gltf_path = SEED_DIR / f"{base}.gltf"
            usd_path  = SEED_DIR / f"{base}.usd"

            if not gltf_path.exists() or not usd_path.exists():
                print(f"⚠️ 檔案遺失: {base}.gltf 或 {base}.usd，跳過專案 {proj.project_id}")
                continue

            minIO_gltf_path = f"map_frontend_{proj.project_id}.gltf"
            minIO_aodt_path = f"map_aodt_{proj.project_id}.usd"
            map = Map.query.filter_by(project_id=proj.project_id).first()
            if upload_file('mapaodt', minIO_aodt_path, usd_path, 'usd') and upload_file('mapfrontend', minIO_gltf_path, gltf_path, 'gltf'):
                if map:
                    # 已存在則只更新 MinIO 物件，不新增 row
                    map.MinIO_map_for_aodt = minIO_aodt_path
                    map.MinIO_map_for_frontend = minIO_gltf_path
                    self.db.session.commit()
                else:
                    # 不存在才新增
                    map = Map(
                        project_id=proj.project_id,
                        MinIO_map_for_aodt= minIO_aodt_path,
                        MinIO_map_for_frontend= minIO_gltf_path
                    )
                    self.db.session.add(map)
                    self.db.session.commit()



            
