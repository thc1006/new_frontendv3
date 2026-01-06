# seeds/project_seeder.py
import os
import sys

sys.path.append(
    os.path.abspath(
        os.path.join(os.path.dirname(__file__), '..')
    )
)

from flask_seeder import Seeder
from models.Project import Project
from models.UserProject import UserProject
from models.User import User
from enums.project_role import ProjectRole
from controllers.utils import create_grafana_folder, create_grafana_dashboard
from datetime import date, datetime, timedelta

namedict = {
    1: "Nanzih",
    2: "Tianliao",
    3: "Kaohsiung_firestation",
}

class ProjectSeeder(Seeder):

    def __init__(self, db=None):
        super().__init__(db=db)       # initialize parent
        self.priority = 1

    def run(self):
        coor = ((22.735392934997535, 120.3299527377498),(22.825272535366096, 120.40562628812211),(22.593318429467317, 120.30714867018781))
        for i in range(3):
            data = {
                "title": namedict.get(i+1),
                "date": (date.today() - timedelta(days=i)).isoformat(),
                "user_id": (i + 2), # The seeded normal user id starts from 2
                "lat": coor[i][0],
                "lon": coor[i][1],
                "margin": 200
            }
            self.create_project(data)


    def create_project(self, data):
        title = data.get("title")
        if not title:
            print("Title is required")
            return

        date_str = data.get("date")
        project_date = datetime.fromisoformat(date_str).date()

        lat = data.get("lat")
        lon = data.get("lon")
        margin=data.get("margin")
        if not lat or not lon or not margin:
            print("position information not enough")

        project = Project(title=title, date=project_date, grafana_folder_id=None,lat=lat,lon=lon,margin=margin)
        self.db.session.add(project)
        self.db.session.flush()

        owner_id = data.get("user_id")
        up = UserProject(user_id=owner_id, project_id=project.project_id, role=ProjectRole.ADMIN)
        self.db.session.add(up)

        account = User.query.get(owner_id).account

        # 呼叫 Grafana API 建資料夾與 dashboard
        result = create_grafana_folder(project_name=title, account=account)
        project.grafana_folder_id = result["data"]["folder_uid"]

        self.db.session.commit()


        create_grafana_dashboard(
            folder_uid=project.grafana_folder_id,
            dashboard_title= title,
            account=account
        )
