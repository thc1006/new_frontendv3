from flask import make_response, request, jsonify
from flask_restful import Resource
import mysql.connector
import json
from config import get_db_connection

class Map_Position(Resource):
    def get(self, id): 
        conn = get_db_connection()
        try:
            cur = conn.cursor() 
            cur.execute('select map.MID, map.position, map.name from map join project_map where map.MID = project_map.MID and project_map.PID = %s;', (id,))
        except mysql.connector.Error as err:
            return make_response(jsonify('Failed to get project map'), 500)
        else:
            result = cur.fetchall()
        finally:
            cur.close()
        
        arr = []
        if result:
            for row in result:
                data = {
                    'MID' : row[0], 
                    'position' : json.loads(row[1]),
                    'name' : row[2]
                }
                arr.append(data)
            response = make_response(jsonify(arr), 200)
        else:
            response = make_response(jsonify(''), 404)

        return response