from models import db
from datetime import datetime

class ChatMessage(db.Model):
    __tablename__ = 'chat_messages'

    chat_message_id = db.Column(db.Integer, primary_key = True)
    chat_session_id = db.Column(db.Integer, db.ForeignKey('chat_sessions.chat_session_id'), nullable=False)
    role = db.Column(db.String(50), nullable = False)
    content = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.now)

    chat_session = db.relationship('ChatSession', back_populates='chat_messages')