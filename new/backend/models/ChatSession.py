from models import db
from datetime import datetime


class ChatSession(db.Model):
    __tablename__ = 'chat_sessions'

    chat_session_id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey('projects.project_id'))
    title  = db.Column(db.String(250), nullable=False, default='New Chat')
    has_oss_data = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default = datetime.now)

    chat_messages = db.relationship(
        'ChatMessage',
        back_populates='chat_session',
        cascade='all, delete-orphan'
    )

    project = db.relationship('Project', back_populates='chat_sessions')

    def __repr__(self):
        return f'<chat_session_id: {self.chat_session_id}, project_id: {self.project_id}, title: {self.title}, created_at: {self.created_at}>'

    
    def to_dict(self):
        return {
            'chat_session_id': self.chat_session_id,
            'project_id': self.project_id,
            'title': self.title,
            'created_at': self.created_at
        }