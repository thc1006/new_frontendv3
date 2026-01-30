from flask import make_response, request, jsonify
from flask_restful import Resource
import mysql.connector

from config import get_db_connection

class Model(Resource):
    def get(self, id):
        conn = get_db_connection()
        try:
            cur = conn.cursor()
            cur.execute('select * from model where PID = %s;', (id,))
        except mysql.connector.Error as err:
            return make_response(jsonify('Failed to get AI model'), 500)
        else:
            result = cur.fetchall()
        finally:
            cur.close()

        if result:
            arr = []
            for row in result:
                data = {
                    'model_ID' : row[0],
                    'PID' : row[1],
                    'name' : row[2]
                }
                arr.append(data)
            response = make_response(jsonify(arr), 200)
        else:
            response = make_response(jsonify(''), 404)
        return response

    def post(self, id):
        conn = get_db_connection()
        data = request.get_json(force = True)
        try:
            cur = conn.cursor()
            cur.execute('select * from model order by model_ID DESC Limit 1;')
        except mysql.connector.Error as err:
            return f'Error getting AI model: {err}', 500
        else:
            result = cur.fetchone()
        finally:
            cur.close()

        if result:
            new_id = result[0] + 1
        else:
            new_id = 1

        try:
            cur = conn.cursor()
            cur.execute('insert into model values (%s, %s, %s);', (new_id, id, data['name']))
        except mysql.connector.Error as err:
            return jsonify(f'Error inserting into AI model: {err}'), 500
        finally:
            cur.close()

        value = {
            'model_ID' : new_id,
            'PID' : id,
            'name' : data['name']
        }
        response = make_response(jsonify(value), 201)

        conn.commit()
        return response

    def delete(self, id):
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute('select * from model where PID = %s Limit 1;', (id,))
        result = cur.fetchone()
        cur.close()

        if result:
            cur = conn.cursor()
            cur.execute('delete from model where PID = %s;', (id,))
            cur.close()

            response = make_response(jsonify(''), 200)
        else:
            response = make_response(jsonify(''), 404)

        conn.commit()
        return response