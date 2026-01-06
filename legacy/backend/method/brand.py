from flask import make_response, request, jsonify
from flask_restful import Resource
import json
from config import get_db_connection

class Brand(Resource):
    def get(self, option = 'brand_ID', id = ''):
        conn = get_db_connection()
        cur = conn.cursor()
        if option == 'brand_ID':
            cur.execute('select * from brand where brand_ID = %s Limit 1;', (id,))
        elif option == 'brand_name':
            cur.execute('select * from brand where brand_name = %s Limit 1;', (id,))
        else:
            cur.close()
            return make_response(jsonify('Error: brand_ID or brand_name'), 400)
        result = cur.fetchone()
        cur.close()

        if result:
            response = make_response(jsonify({
                'brand_ID' : result[0],
                'brand_name' : result[1],
                'config' : json.loads(result[2])
            }), 200)
        else:
            response = make_response(jsonify(''), 404)

        return response

    def post(self):
        conn = get_db_connection()
        data = request.get_json(force = True)
        brand_name =  data.pop('brand_name', None)

        cur = conn.cursor()
        cur.execute('select * from brand order by brand_ID DESC Limit 1;')
        result = cur.fetchone()
        cur.close()

        if result:
            new_id = result[0] + 1
        else:
            new_id = 1

        cur = conn.cursor()
        cur.execute('insert into brand values (%s, %s, %s);', (new_id, brand_name, json.dumps(data)))
        cur.close()

        cur = conn.cursor()
        cur.execute('select * from brand order by brand_ID DESC Limit 1;')
        result = cur.fetchone()
        cur.close()

        response = make_response(jsonify({
            'brand_ID' : result[0],
            'brand_name' : result[1],
            'config' : json.loads(result[2])
        }), 201)

        conn.commit()
        return response

    def put(self, id):
        conn = get_db_connection()
        data = request.get_json(force = True)
        brand_name = data.pop('brand_name', None)

        cur = conn.cursor()
        cur.execute('select * from brand where brand_ID = %s Limit 1;', (id,))
        result = cur.fetchone()
        cur.close()

        if result:
            cur = conn.cursor()
            cur.execute('update brand set config = %s, brand_name = %s where brand_ID = %s;', (json.dumps(data), brand_name, id))
            cur.close()

            cur = conn.cursor()
            cur.execute('select * from brand where brand_ID = %s Limit 1;', (id,))
            result = cur.fetchone()
            cur.close()

            response = make_response(jsonify({
                'brand_ID' : result[0],
                'brand_name' : result[1],
                'config' : json.loads(result[2])
            }), 200)

            conn.commit()
        else:
            response = make_response(jsonify(''), 404)

        return response

    def delete(self, id):  
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute('select * from brand where brand_ID = %s Limit 1;', (id,))
        result = cur.fetchone()
        cur.close()

        if result:
            cur = conn.cursor()
            cur.execute('delete from brand where brand_ID = %s;', (id,))
            cur.close()

            response = make_response(jsonify(''), 200)
        else:
            response = make_response(jsonify(''), 404)

        conn.commit()
        return response