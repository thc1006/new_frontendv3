chat_session_store = {
    'session_id': None,
    'has_oss_data': False,
    'history':[]
}

def reset_session_store():
    chat_session_store.clear()
    chat_session_store.update({
        'session_id': None,
        'has_oss_data': False,
        'history': []
    })

def update_session_store(session_id, has_oss_data, history=None):
    chat_session_store['session_id'] = session_id
    chat_session_store['has_oss_data'] = has_oss_data
    if history:
        chat_session_store['history'].append(history)