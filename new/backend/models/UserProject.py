from models import db
from enums.project_role import ProjectRole


class UserProject(db.Model):
    __tablename__ = 'user_projects'

    user_id = db.Column(db.Integer, db.ForeignKey(
        'users.user_id'), primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey(
        'projects.project_id'), primary_key=True)
    role = db.Column(db.Enum(ProjectRole), nullable=False)

    # 關聯到 User 與 Project
    user = db.relationship(
        'User',
        back_populates='user_projects',)
    project = db.relationship(
        'Project',
        back_populates='user_projects',
        cascade='save-update, merge')

    def __repr__(self):
        return f'<UserProject user_id={self.user_id} project_id={self.project_id} role={self.role}>'

    def to_dict(self):
        return {
            'user_id': self.user_id,
            'project_id': self.project_id,
            'role': self.role.name
        }
