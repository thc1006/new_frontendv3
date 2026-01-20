# seeds/user_seeder.py
import os
import sys

sys.path.append(
    os.path.abspath(
        os.path.join(os.path.dirname(__file__), '..')
    )
)

from flask_seeder import Seeder
from app import app, db
from models.User import User
from faker import Faker
from enums.role import Role

class UserSeeder(Seeder):
    def __init__(self, db=None):
        super().__init__(db=db)       # initialize parent
        self.priority = 0             

    def run(self):
        fake = Faker()
        client = app.test_client()

        # 建 admin 帳號
        resp = client.post('/auth/register', json={
            'account': 'admin1',
            'password': 'admin1',
            'email': fake.email(),
            'role': Role.ADMIN.value
        })
        assert resp.status_code == 200, resp.get_data(as_text=True)

        with app.app_context():
            user = User.query.get(1)
            user.role = Role.ADMIN.value   # 設定成 ADMIN
            db.session.commit()


        # 建一般使用者
        for i in range(3):
            resp = client.post('/auth/register', json={
                'account': f'user{i}',
                'password': f'user{i}',
                'email': fake.email(),
                'role': Role.USER.value
            })
            print(f"User user{i} created")
            assert resp.status_code == 200, resp.get_data(as_text=True)
