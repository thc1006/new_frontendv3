from flask import make_response, request, jsonify
from flask_restful import Resource
import json
import mysql.connector

from config import get_db_connection

class Cache(Resource):
    def get(self, id):
        conn = get_db_connection()
        try:
            cur = conn.cursor() 
            cur.execute('select * from RU_cache where PID = %s Limit 1;', (id,))
        except mysql.connector.Error as err:
            return f'Failed to get RU_cache: {err}', 500
        else:
            result = cur.fetchone()
        finally:
            cur.close()

        if result:
            response = make_response(jsonify(json.loads(result[1])), 200)
        else:
            response = make_response(jsonify(''), 404)
        
        return response
    
    def post(self, id):
        conn = get_db_connection()
        data = request.get_json(force = True)
        try:
            cur = conn.cursor() 
            cur.execute('select * from RU_cache where PID = %s Limit 1;', (id,))
        except mysql.connector.Error as err:
            return jsonify(f'Error getting RU_cache: {err}'), 500
        else:
            result = cur.fetchone()
        finally:
            cur.close()

        cur = conn.cursor()
        if result:
            cur.execute('update RU_cache set pos = %s where PID = %s;', (json.dumps(data), id))
            response = make_response(jsonify(''), 200)
        else:
            cur.execute('insert into RU_cache values (%s, %s);', (id, json.dumps(data)))
            response = make_response(jsonify(''), 201)
        cur.close()
        conn.commit()
        return response
    
    def delete(self, id):
        conn = get_db_connection()
        try:
            cur = conn.cursor() 
            cur.execute('select * from RU_cache where PID = %s Limit 1;', (id,))
        except mysql.connector.Error as err:
            return jsonify(f'Error getting RU_cache: {err}'), 500
        else:
            result = cur.fetchone()
        finally:
            cur.close()

        if result:
            cur = conn.cursor()
            cur.execute('delete from RU_cache where PID = %s;', (id,))
            cur.close()
            conn.commit()
            response = make_response(jsonify(''), 200)
        else:
            response = make_response(jsonify(''), 404)
            
        return response