from flask import make_response, request, jsonify
from flask_restful import Resource
import mysql.connector
import json
from config import get_db_connection

class Project_Map(Resource):
    def get(self, id): 
        conn = get_db_connection()
        try:
            cur = conn.cursor() 
            cur.execute('select map.* from map join project_map where map.MID = project_map.MID and project_map.PID = %s;', (id,))
        except mysql.connector.Error as err:
            return make_response(jsonify('Failed to get project map'), 500)
        else:
            result = cur.fetchall()
        finally:
            cur.close()
        
        arr = []
        if result:
            for row in result:
                image_path = row[2]
                with open(image_path, 'r') as image_file:
                    image = json.load(image_file)

                data = {
                    'MID' : row[0], 
                    'UID' : row[1],
                    'image' : image, 
                    'position' : json.loads(row[3]),
                    'name' : row[4]
                }
                arr.append(data)
            response = make_response(jsonify(arr), 200)
        else:
            response = make_response(jsonify(''), 404)

        return response 

    def post(self, identifier, id):
        conn = get_db_connection()
        try:
            cur = conn.cursor()
            cur.execute('insert into project_map values (%s, %s);', (identifier, id))
        except mysql.connector.Error as err:
            return jsonify(f'Error insert project_map: {err}'), 500
        finally:
            cur.close()

        response = make_response(jsonify({
            'PID' : identifier,
            'MID' : id
        }), 201)

        conn.commit()
        return response

    def delete(self):
        pass
        # do not need delete API