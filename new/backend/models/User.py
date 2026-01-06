from sqlalchemy.ext.associationproxy import association_proxy
from enums.role import Role
from flask_login import UserMixin
from models import db
import models.UserProject  # noqa: F401


class User(UserMixin, db.Model):
    __tablename__ = 'users'

    user_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    account = db.Column(db.String(100), nullable=False, unique=True)
    password = db.Column(db.String(255), nullable=False)
    email = db.Column(db.String(100), nullable=False, unique=True)
    role = db.Column(db.Enum(Role), nullable=False)  # 全域角色
    grafana_user_id = db.Column(db.Integer, nullable=True, unique=True)
    user_projects = db.relationship(
        'UserProject',
        back_populates='user',
        cascade='all, delete-orphan')
    projects = association_proxy('user_projects', 'project')

    created_at = db.Column(db.Date, nullable=False, default=db.func.current_date())

    def __repr__(self):
        return f'<User {self.account}>'

    def get_id(self):
        return str(self.user_id)

    def to_dict(self):
        return {
            'user_id': self.user_id,
            'account': self.account,
            'email': self.email,
            'role': self.role.name,
            'grafana_user_id': self.grafana_user_id,
            'created_at': self.created_at.isoformat()
        }
