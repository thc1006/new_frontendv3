from flask import make_response, request, jsonify
from flask_restful import Resource
import mysql.connector

from config import get_db_connection

class CU(Resource):
    def get(self, id = ''):         # this id should be pid
        conn = get_db_connection()
        try:
            cur = conn.cursor()
            cur.execute('select * from CU where PID = %s;', (id,))
        except mysql.connector.Error as err:
            return jsonify(f'Failed to get CU: {err}'), 500
        else:
            result = cur.fetchall()
        finally:
            cur.close()
        
        if result:
            CUs = {}
            for row in result:
                CUs[row[0]] = {
                    'CUID' : row[0],
                    'PID' : row[1],
                    'name' : row[2],
                    'brand_ID' : row[3]
                }

            response = make_response(jsonify(CUs), 200)
        else:
            response = make_response(jsonify(''), 404)
        return response

    def post(self):        # this id should be pid
        conn = get_db_connection()
        data = request.get_json(force = True)
        PID = data.get('PID')
        name = data.get('name')
        brand_ID = data.get('brand_ID')

        try:
            cur = conn.cursor()
            cur.execute('select * from CU order by CUID DESC Limit 1;')
        except mysql.connector.Error as err:
            return jsonify(f'Error getting CU: {err}'), 500
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
            cur.execute('insert into CU values (%s, %s, %s, %s);', (new_id, PID, name, brand_ID))
        finally:
            cur.close()

        try:
            cur = conn.cursor()
            cur.execute('select * from CU order by CUID DESC Limit 1;')
        except mysql.connector.Error as err:
            return jsonify(f'Error getting CU: {err}'), 500
        else:
            result = cur.fetchone()
        finally:
            cur.close()

        response = make_response(jsonify({
            'CUID' : result[0],
            'PID' : result[1],
            'name' : result[2],
            'brand_ID' : result[3]
        }), 201)

        conn.commit()
        return response

    def put(self, id=''): # this should be cuid
        conn = get_db_connection()
        data = request.get_json(force = True)
        pid = data.get('PID')
        name = data.get('name')
        brand_ID = data.get('brand_ID')

        try:
            cur = conn.cursor()
            cur.execute('select * from CU where CUID = %s Limit 1;', (id,))
        except mysql.connector.Error as err:
            return jsonify(f'Error getting CU: {err}'), 500
        else:
            result = cur.fetchone()
        finally:
            cur.close()

        if result:
            try:
                cur = conn.cursor()
                cur.execute('update CU set PID = %s, name = %s, brand_ID = %s where CUID = %s;', (pid, name, brand_ID, id))
            finally:
                cur.close()

            response = make_response(jsonify({
                'CUID' : id,
                'PID' : pid,
                'name': name,
                'brand_ID' : brand_ID
            }), 200)
        else:
            response = make_response(jsonify(''), 404)

        conn.commit()
        return response

    def delete(self, id):   # this id should be cuid
        conn = get_db_connection()
        try:
            cur = conn.cursor()
            cur.execute('select * from CU where CUID = %s Limit 1;', (id,))
        except mysql.connector.Error as err:
            return jsonify(f'Error getting CU: {err}'), 500
        else:
            CU_result = cur.fetchone()
        finally:
            cur.close()

        if CU_result:
            # make sure that there are no DU connect to this CU
            try:
                cur = conn.cursor()
                cur.execute('select * from DU where CUID = %s Limit 1;', (CU_result[0], ))
            except mysql.connector.Error as err:
                return jsonify(f'Error getting DU: {err}'), 500
            else:
                DU_result = cur.fetchone()
            finally:
                cur.close()
            
            if DU_result:
                response = make_response(jsonify(''), 400)
            else:
                try:
                    cur = conn.cursor()
                    cur.execute('delete from CU where CUID = %s;', (id,))
                finally:
                    cur.close()

                response = make_response(jsonify(''), 200)
        else:
            response = make_response(jsonify(''), 404)

        conn.commit()
        return response
    