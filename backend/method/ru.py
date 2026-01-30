from flask import make_response, request, jsonify
from flask_restful import Resource
import mysql.connector
import json
from config import get_db_connection

class RU(Resource):
    def get(self, option='PID', id=''):
        conn = get_db_connection()
        cur = conn.cursor()
        try:
            if option == 'PID':
                cur.execute('select * from RU where PID = %s;', (id,))
            elif option == 'DUID':
                cur.execute('select * from RU where DUID = %s;', (id,))
            else:
                return '', 400

        except mysql.connector.Error as err:
            return jsonify(f'Failed to get RU: {err}'), 500
        else:
            result = cur.fetchall()
        finally:
            cur.close()

        if result:
            RUs = {}
            for row in result:
                RUs[row[0]] = {
                    'RUID' : row[0],
                    'name' : row[1],
                    'DUID' : row[2],
                    'PID' : row[3],
                    'brand_ID' : row[4],
                    'location_x' : row[5],
                    'location_y' : row[6],
                    'location_z' : row[7],
                    'config' : json.loads(row[8])
                }
            response = make_response(jsonify(RUs), 200)
        else:
            response = make_response(jsonify(''), 404)

        return response

    def post(self):
        conn = get_db_connection()
        data = request.get_json(force = True)
        DUID = data.pop('DUID', None)
        PID = data.pop('PID', None)
        location_x = data.pop('location_x', None)
        location_y = data.pop('location_y', None)
        location_z = data.pop('location_z', None)
        name = data.pop('name', None)
        brand_ID = data.pop('brand_ID', None)

        cur = conn.cursor()
        cur.execute('select * from RU order by RUID DESC Limit 1;')
        result = cur.fetchone()
        cur.close()

        if result:
            new_id = result[0] + 1
        else:
            new_id = 1

        cur = conn.cursor()
        cur.execute('insert into RU values (%s, %s, %s, %s, %s, %s, %s, %s, %s);', (new_id, name, DUID, PID, brand_ID, location_x, location_y, location_z, json.dumps(data)))
        cur.close()

        cur = conn.cursor()
        cur.execute('select * from RU order by RUID DESC Limit 1;')
        result = cur.fetchone()
        cur.close()

        response = make_response(jsonify({
            'RUID' : result[0],
            'name' : result[1],
            'DUID' : result[2],
            'PID' : result[3],
            'brand_ID' : result[4],
            'location_x' : result[5],
            'location_y' : result[6],
            'location_z' : result[7],
            'config' : json.loads(result[8])
        }), 201)

        conn.commit()
        return response

    def put(self, id):  # id : RUID
        conn = get_db_connection()
        data = request.get_json(force = True)
        DUID = data.pop('DUID', None)
        PID = data.pop('PID', None)
        location_x = data.pop('location_x', None)
        location_y = data.pop('location_y', None)
        location_z = data.pop('location_z', None)
        name = data.pop('name', None)
        brand_ID = data.pop('brand_ID', None)

        cur = conn.cursor()
        cur.execute('select * from RU where RUID = %s Limit 1;', (id,))
        result = cur.fetchone()
        cur.close()

        if result:
            cur = conn.cursor()
            cur.execute('update RU set DUID = %s, PID = %s, location_x = %s, location_y = %s, location_z = %s, \
                        name = %s, brand_ID = %s, config = %s where RUID = %s;'
                        , (DUID, PID, location_x, location_y, location_z, name, brand_ID, json.dumps(data), id))
            cur.close()
            
            cur = conn.cursor()
            cur.execute('select * from RU where RUID = %s Limit 1;', (id,))
            result = cur.fetchone()
            cur.close()

            response = make_response(jsonify({
                'RUID' : result[0],
                'name' : result[1],
                'DUID' : result[2],
                'PID' : result[3],
                'brand_ID' : result[4],
                'location_x' : result[5],
                'location_y' : result[6],
                'location_z' : result[7],
                'config' : json.loads(result[8])
            }), 200)
        else:
            response = make_response(jsonify(''), 404)

        conn.commit()
        return response

    def delete(self, id):   # this id should be ruid
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute('select * from RU where RUID = %s Limit 1;', (id,))
        result = cur.fetchone()
        cur.close()

        if result:
            cur = conn.cursor()
            cur.execute('delete from RU where RUID = %s;', (id,))
            cur.close()
            conn.commit()

            response = make_response(jsonify(''), 200)
        else:
            response = make_response(jsonify(''), 404)

        return response