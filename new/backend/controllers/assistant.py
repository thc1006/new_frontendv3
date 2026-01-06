import os
import json
from datetime import datetime
from influxdb import InfluxDBClient
from google import genai
from dotenv import load_dotenv
from models.ChatSession import  ChatSession
from models.ChatMessage import db, ChatMessage
from .chat_session_store import update_session_store


load_dotenv()

def load_prompt(file_name):
    with open(file_name, "r", encoding="utf-8") as f:
        return f.read()


parse_mission_fs = load_prompt("agent_fewshot/parse_mission.txt")
NP_parse_fs = load_prompt("agent_fewshot/NP_parse.txt")
NK_parse_fs = load_prompt("agent_fewshot/NK_parse.txt")
NF_parse_fs = load_prompt("agent_fewshot/NF_parse.txt")
generate_fs = load_prompt("agent_fewshot/generate.txt")

def assistant(session_id, chat_session_store, user_question):
    now = datetime.now()
    
    
    
    if not chat_session_store["has_oss_data"]:

        # missions_table = ['Network Knowledge', 'Network Failure', 'Network Performance']
        mission_result = parse_mission(user_question)
        if mission_result == 'Network Knowledge':
            
            parsed_result = NK_parse_question(user_question)
        elif mission_result == 'Network Failure':
            
            parsed_result = NF_parse_question(user_question)
        elif mission_result == 'Network Performance':
            
            parsed_result = NP_parse_question(user_question)
        
        
        if not parsed_result.get('need_data', True):


            user_message = ChatMessage(chat_session_id=chat_session_store['session_id'], role='USER', content=user_question)
            db.session.add(user_message)
            db.session.commit()
            assistant_message = ChatMessage(chat_session_id=chat_session_store['session_id'], role='ASSISTANT', content=parsed_result.get('direct_answer'))
            db.session.add(assistant_message)
            db.session.commit()

            history = []
            history.append({"role": "user", "content": user_question})
            history.append({"role": "assistant", "content": parsed_result.get('direct_answer')})
            update_session_store(chat_session_store['session_id'], chat_session_store['has_oss_data'], history)

            return {
                'current_time':now,
                'text' : parsed_result.get('direct_answer'),
                'used_data':[],
                'response_type': 'direct'
            }
        
          
        tables = parsed_result.get('tables', [])
        time_range = parsed_result.get('time_range', {})
        
        oss_data = query_oss_data(tables, time_range)
        if oss_data:
            chat_session_store['has_oss_data']=True
            
            update_session_store(session_id, True, history=[])
            chat_session = ChatSession.query.get(chat_session_store['session_id'])
            chat_session.has_oss_data = True
            db.session.commit()
            

        ai_answer = generate_answer(user_question, oss_data, chat_session_store)

        

        return {
            'current_time':now,
            'text': ai_answer,
            'used_data':oss_data,
            'response_type': 'data_based',
            'query_info':{
                'tables':tables,
                'time_range': time_range
            }
        }
        

    else:
        ai_answer = keep_generate_answer(user_question, chat_session_store)
        return {
            'current_time':now,
            'text': ai_answer,
            # 'used_data':session["oss_data"],
            'response_type': 'keep_chating',
            'query_info':{
                'tables': 'keep_chating',
                'time_range': 'keep_chating'
            }
        }
        

def parse_mission(question):
    prompt = f"""
    {parse_mission_fs}
    User question is: {question}
    please only return a string, do not add any other data type.
    """

    api_key = os.getenv("GEMINI_API_KEY")
    model_name = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")  
    client = genai.Client(api_key=api_key)
    response = client.models.generate_content(
        model=model_name, contents=prompt
    )
    
   
    return response.text



def NP_parse_question(question):
   
    now = datetime.now()
    # formatted_date = now.strftime("%Y-%m-%d %H:%M:%S")

    prompt = f"""
        {NP_parse_fs}
        ### Now parse the following user question:
        "{question}"
        Current time: {now.strftime("%Y-%m-%d %H:%M:%S")}

        Remember: Your output **must be valid JSON only**.
    """

    api_key = os.getenv("GEMINI_API_KEY")
    model_name = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")  
    client = genai.Client(api_key=api_key)
    response = client.models.generate_content(
        model=model_name, contents=prompt
    )
    json_response = response.text.replace("```json", "")
    json_response = json_response.replace("```", "")
    
    
    try:
        return json.loads(json_response)
    except json.JSONDecodeError as e:
        print(f'Parse question failed {e}')
        return {
            "need_data": False,
            "tables": [],
            "time_range": None,
            "direct_answer": 'Parse question failed.'
        }

def NF_parse_question(question):
    
    now = datetime.now()

    prompt = f"""
        {NF_parse_fs}

        ### Now parse the following user question:
        "{question}"
        Current time: {now.strftime("%Y-%m-%d %H:%M:%S")}

        Remember: Your output **must be valid JSON only**.
    """

    api_key = os.getenv("GEMINI_API_KEY")
    model_name = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")  
    client = genai.Client(api_key=api_key)
    response = client.models.generate_content(
        model=model_name, contents=prompt
    )
    json_response = response.text.replace("```json", "").replace("```", "")
    
    try:
        return json.loads(json_response)
    except json.JSONDecodeError as e:
        print(f'an error occur: {e}')
        return {
            "need_data": False,
            "tables": [],
            "time_range": None,
            "direct_answer": 'Parse question failed.'
        }

    
def NK_parse_question(question):

    now = datetime.now()

    prompt = f"""
        {NK_parse_fs}

        ### Now parse the following user question:
        "{question}"
        Current time: {now.strftime("%Y-%m-%d %H:%M:%S")}

        Remember: Your output **must be valid JSON only**.
    """

    api_key = os.getenv("GEMINI_API_KEY")
    model_name = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")  
    client = genai.Client(api_key=api_key)
    response = client.models.generate_content(
        model=model_name, contents=prompt
    )
    json_response = response.text.replace("```json", "").replace("```", "")
    
    try:
        return json.loads(json_response)
    except json.JSONDecodeError as e:
        print(f'Parse question failed {e}')
        return {
            "need_data": False,
            "tables": [],
            "time_range": None,
            "direct_answer": 'Parse question failed.'
        }


def query_oss_data(tables, time_range=None):
   
    NANOSECONDS_PER_SECOND = 1000000000
    INFLUXDB_HOST = os.getenv("INFLUXDB_HOST")
    INFLUXDB_PORT = os.getenv("INFLUXDB_PORT")
    INFLUXDB_DB = os.getenv("INFLUXDB_DB")
    INFLUXDB_ADMIN_USER = os.getenv("INFLUXDB_ADMIN_USER")
    INFLUXDB_ADMIN_PASSWORD = os.getenv("INFLUXDB_ADMIN_PASSWORD")
    client = InfluxDBClient(host=INFLUXDB_HOST, 
                            port=INFLUXDB_PORT, 
                            database=INFLUXDB_DB,
                            username=INFLUXDB_ADMIN_USER,
                            password=INFLUXDB_ADMIN_PASSWORD)

    result = {}
    table_name_in_db = {
        "UE_record": "ueList_test",
        "fault management": "fm_test",
        "performance management": "pm_test",
        "PTP state of RU/DU/CU": "ptp_test"
    }

    if not time_range: 
        return {}
    
    format_string = "%Y-%m-%d %H:%M:%S"
    new_t_r= []
    for dt in time_range:
        time_scale = NANOSECONDS_PER_SECOND
        dt = int(datetime.strptime(dt, format_string).timestamp()*time_scale)
        new_t_r.append(dt)
    


    for table in tables:
        if table not in table_name_in_db:
            continue

        query = f'SELECT * FROM "{table_name_in_db[table]}" WHERE time >= {new_t_r[0]} AND time <= {new_t_r[1]} '
        output = client.query(query)
        result[table] = []
        for point in output.get_points():
            result[table].append(point)
    
    client.close()

    return result


def generate_answer(question, data, session):

    context = "[oss log data: ]\n"
    context += json.dumps(data)
    prompt = f"""
    You are a 5G expert who is a helper of telecom providers.
    Based on the OSS data provided and the network structure, please answer the question from the user.
    {context}
    {generate_fs}
    user question：{question}
    """


    try:
        api_key = os.getenv("GEMINI_API_KEY")
        client = genai.Client(api_key=api_key)
        response = client.models.generate_content(
            model='gemini-2.5-flash', contents=prompt
        )

        user_message = ChatMessage(chat_session_id=session['session_id'], role='USER', content=prompt)
        db.session.add(user_message)
        db.session.commit()
        assistant_message = ChatMessage(chat_session_id=session['session_id'], role='ASSISTANT', content=response.text.strip())
        db.session.add(assistant_message)
        db.session.commit()

        history = []
        history.append({"role": "user", "content": prompt})
        history.append({"role": "assistant", "content": response.text.strip()})
        update_session_store(session['session_id'], session['has_oss_data'], history)
        
        return response.text.strip() # 這也會是 assistant() 裡面的 ai_answer
    
    except Exception as llm_error:

        return str(llm_error) # 之敗的話，通常是token數超過，就讓user知道吧，這會是 assistant() 裡面的 ai_answer
    
    

def keep_generate_answer(question, session):

    
    prompt = f"""
        You are a 5G expert who works as a helper of telecom provider. Based on the chating history and the user question, answer the user's question.
        Chatting history: {session["history"]}.
        User question: {question}
    """
    
    
    try:
        api_key = os.getenv("GEMINI_API_KEY")
        client = genai.Client(api_key=api_key)
        response = client.models.generate_content(
            model='gemini-2.5-flash', contents=prompt
        )

        user_message = ChatMessage(chat_session_id=session['session_id'], role='USER', content=question)
        db.session.add(user_message)
        db.session.commit()
        assistant_message = ChatMessage(chat_session_id=session['session_id'], role='ASSISTANT', content=response.text.strip())
        db.session.add(assistant_message)
        db.session.commit()

        history = []
        history.append({"role": "user", "content": prompt})
        history.append({"role": "assistant", "content": response.text.strip()})
        update_session_store(session['session_id'], session['has_oss_data'], history)
        
        return response.text.strip() # 這也會是 assistant() 裡面的 ai_answer
    
    except Exception as llm_error:
        
        return str(llm_error) # 之敗的話，通常是token數超過，就讓user知道吧，這會是 assistant() 裡面的 ai_answer