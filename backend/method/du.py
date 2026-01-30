from flask import make_response, request, jsonify
from flask_restful import Resource

from config import get_db_connection

class DU(Resource):
    def get(self, option = 'CUID', id = ''):
        conn = get_db_connection()
        try:
            cur = conn.cursor()
            if option == 'CUID':
                cur.execute('select * from DU where CUID = %s;', (id,))
            elif option == 'PID':
                cur.execute('select * from DU where PID = %s;', (id,))
        except:
            return 'Failed to get DU', 500
        else:
            result = cur.fetchall()
        finally:
            cur.close()

        if result:
            DUs = {}
            for row in result:
                DUs[row[0]] = {
                    'DUID' : row[0],
                    'CUID' : row[1],
                    'PID' : row[2],
                    'name' : row[3],
                    'brand_ID' : row[4]
                }
            response = make_response(jsonify(DUs), 200)
        else:
            response = make_response(jsonify(''), 404)

        return response

    def post(self):
        conn = get_db_connection()
        data = request.get_json(force = True)
        CUID = data.get('CUID')
        PID = data.get('PID')
        name = data.get('name')
        brand_ID = data.get('brand_ID')

        cur = conn.cursor()
        cur.execute('select * from DU order by DUID DESC Limit 1;')
        result = cur.fetchone()
        cur.close()

        if result:
            new_id = result[0] + 1
        else:
            new_id = 1
        
        cur = conn.cursor()
        cur.execute('insert into DU values (%s, %s, %s, %s, %s);', (new_id, CUID, PID, name, brand_ID))
        cur.close()

        cur = conn.cursor()
        cur.execute('select * from DU order by DUID DESC Limit 1;')
        result = cur.fetchone()
        cur.close()

        response = make_response(jsonify({
            'DUID' : result[0],
            'CUID' : result[1],
            'PID' : result[2],
            'name' : result[3],
            'brand_ID' : result[4]
        }), 201)

        conn.commit()
        return response

    def put(self, id):
        conn = get_db_connection()
        data = request.get_json(force = True)
        CUID = data.get('CUID')
        PID = data.get('PID')
        name = data.get('name')
        brand_ID =  data.get('brand_ID')

        cur = conn.cursor()
        cur.execute('select * from DU where DUID = %s Limit 1;', (id,))
        result = cur.fetchone()
        cur.close()

        if result:
            cur = conn.cursor()
            cur.execute('update DU set CUID = %s, PID = %s, name = %s, brand_ID = %s where DUID = %s;', (CUID, PID, name, brand_ID, id))
            cur.close()

            response = make_response(jsonify({
                'DUID' : id,
                'CUID' : CUID,
                'PID' : PID,
                'name' : name,
                'brand_ID' : brand_ID
            }), 200)
        else:
            response = make_response(jsonify(''), 404)

        conn.commit()
        return response

    def delete(self, id):   # this id should be duid
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute('select * from DU where DUID = %s Limit 1;', (id,))
        DU_result = cur.fetchone()
        cur.close()

        if DU_result:
            # make sure that there are no RU connect to this DU
            cur = conn.cursor()
            cur.execute('select * from RU where DUID = %s Limit 1;', (DU_result[0], ))
            RU_result = cur.fetchone()
            cur.close()

            if RU_result:
                response = make_response(jsonify(''), 400)
            else:
                cur = conn.cursor()
                cur.execute('delete from DU where DUID = %s;', (id,))
                cur.close()
                response = make_response(jsonify(''), 200)
        else:
            response = make_response(jsonify(''), 404)

        conn.commit()
        return response