from flask import Blueprint, request, jsonify
from models.ChatSession import db, ChatSession
from models.ChatMessage import  ChatMessage
from models.Project import Project
from datetime import datetime
from .assistant import assistant
from .chat_session_store import chat_session_store, reset_session_store, update_session_store

chat_bp = Blueprint('chat', __name__)

# create a new chat session
@chat_bp.route('/projects/<int:project_id>/chat_sessions', methods=['POST'])
def create_session(project_id):

    project = Project.query.get(project_id)
    
    if not project:
        return {'error': 'Project not found. Can not create a new chat session.'}, 404
    
    else:
        title = request.json.get('title')
        session = ChatSession(project_id=project_id, title=title)
        db.session.add(session)
        db.session.commit()
        return jsonify({
            'new chat session id': session.chat_session_id,
            'new chat session title': session.title,
            'new chat session created_at': session.created_at.isoformat()
        }), 200

# list a project's all chat sessions
@chat_bp.route('/projects/<int:project_id>/chat_sessions', methods=['GET'])
def list_sessions(project_id):

    project = Project.query.get(project_id)

    if not project:
        return {'error': 'Project not found. Can not list all chat sessions'}
    
    else:
        sessions = ChatSession.query.filter_by(project_id=project_id).order_by(ChatSession.created_at.desc()).all()
        return jsonify([
            {
                'chat session id': s.chat_session_id,
                'chat session title': s.title,
                'chat session created_at': s.created_at.isoformat()
            } for s in sessions
        ])

# edit session title
@chat_bp.route('/chat_sessions/<int:session_id>', methods=['PUT'])
def update_session(session_id):

    session = ChatSession.query.get(session_id)

    if not session:
        return {'error': 'Chat session not found. Can not edit session title'}, 404
    else:
        session.title = request.json.get('title')
        db.session.commit()
        return jsonify({
            'chat session id': session.chat_session_id,
            'chat session new title': session.title,
            'updated_at': datetime.now().isoformat()
        }), 200

# 刪除 session（連同 messages）
@chat_bp.route('/chat_sessions/<int:session_id>', methods=['DELETE'])
def delete_session(session_id):
    session = ChatSession.query.get_or_404(session_id)
    db.session.delete(session)
    db.session.commit()
    return jsonify({'message': 'Chat session deleted'}), 200



# 新增訊息
@chat_bp.route('/chat_sessions/<int:session_id>/messages', methods=['POST'])
def add_message(session_id):

    session = ChatSession.query.get(session_id)

    if not session:
        return {'error': 'Chat session not found. Can not add new chat message'}, 404
    
    else:
        data = request.json
        role = data.get('role')
        content = data.get('content')

        if not role or not content:
            return {'error': 'Missing role or content'}, 404
        
        assistant_response = assistant(session_id, chat_session_store, content)

        
        
        return jsonify({
            'chat message role': 'ASSISTANT',
            'chat message content': assistant_response['text'],
            'chat message created_at': assistant_response['current_time']
        }), 200

# 取得某 session 下的所有訊息 (通常會在使用者切換視窗的時候，這時我們把 chat_session_store先清空)
@chat_bp.route('/chat_sessions/<int:session_id>/messages', methods=['GET'])
def list_messages(session_id):

    reset_session_store()

    session = ChatSession.query.get(session_id)

    if not session:
        return {'error': 'Chat session not found. Can not list all chat messages'}, 404
    
    else:
        messages = ChatMessage.query.filter_by(chat_session_id=session_id).order_by(ChatMessage.created_at).all()
        
        history = []
        for m in messages:
            history.append({'role': m.role, 'content': m.content})
        
        update_session_store(session_id, session.has_oss_data, history)

        return jsonify([
            
            {   
                'chat_session_id': chat_session_store['session_id'],
                'chat_session_store_has_oss_data?':chat_session_store['has_oss_data'],
                'chat message id': m.chat_message_id,
                'chat message role': m.role,
                'chat message content': m.content,
                'chat message created_at': m.created_at.isoformat()
            } for m in messages
        ]), 200

