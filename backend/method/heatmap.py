from flask import make_response, request, jsonify
from flask_restful import Resource
import os, json
from config import get_db_connection
import logging
import mysql.connector

# Configure logging
handler = logging.FileHandler('signal_heatmap_error.log')
handler.setFormatter(logging.Formatter('%(asctime)s %(levelname)s: %(message)s'))
logger = logging.getLogger('signal_heatmap_error')
logger.setLevel(logging.ERROR)
logger.addHandler(handler)

class Heatmap(Resource):
    def get(self, id):
        conn = get_db_connection()
        try:
            cur = conn.cursor()
            cur.execute('select * from heatmap where heatmap_ID = %s Limit 1;', (id,))
        except mysql.connector.Error as err:
            logger.error(err)
            return jsonify(f'Failed to get RSRP heatmap: {err}'), 500
        else:
            result = cur.fetchone()
        finally:  # Executes even at except return
            cur.close()
        
        if result:
            data = {
                    'heatmap_Id' : result[0],
                    'MID' : result[1]
            }
            with open(result[2], 'r') as heatmap_file:
                heatmap = json.load(heatmap_file)
            data['data'] = heatmap
            response = make_response(jsonify(data), 200)
        else:
            response = make_response(jsonify(''), 404)
        
        return response

    # POST should not replace existing heatmap
    def post(self, id):
        conn = get_db_connection()
        data = request.get_json(force = True)
        try:
            cur = conn.cursor()
            # cur.execute('select * from heatmap order by heatmap_ID DESC Limit 1;')
            cur.execute('select * from heatmap where heatmap_ID = %s Limit 1;', (id,))
        except mysql.connector.Error as err:
            logger.error(err)
            conn.rollback()  # Rollback any uncommitted transactions
            return jsonify(f'Failed to get RSRP heatmap: {err}'), 500
        else:
            # Check exist
            try:
                result = cur.fetchone()
            except TypeError:
                pass
            else:
                return 'Conflict: heatmap already exists', 409
        finally:
            cur.close()

        path = './heatmap/' + str(id) + '.json'
        with open(path, 'w') as file:
            json.dump(data, file, indent = 4)

        try:
            cur = conn.cursor()
            cur.execute('insert into heatmap values (%s, %s, %s);', (id, id, path))
        finally:
            cur.close()

        result = {
            'heatmap_ID' : id,
            'MID' : id,
            'data' : path
        }
        response = make_response(jsonify(result), 201)

        conn.commit()
        return response

    # Idempotency: replaces existing heatmap
    def put(self, id):
        conn = get_db_connection()
        data = request.get_json(force = True)
        try:
            cur = conn.cursor()
            # cur.execute('select * from heatmap order by heatmap_ID DESC Limit 1;')
            cur.execute('select * from heatmap where heatmap_ID = %s Limit 1;', (id,))
        except mysql.connector.Error as err:
            logger.error(err)
            conn.rollback()  # Rollback any uncommitted transactions
            return jsonify(f'Failed to get RSRP heatmap: {err}'), 500
        else:
            # Check exist
            try:
                result = cur.fetchone()
            except TypeError:
                pass
            else:
                cur.execute('delete from heatmap where heatmap_ID = %s;', (id,))
        finally:
            cur.close()

        path = './heatmap/' + str(id) + '.json'
        with open(path, 'w') as file:
            json.dump(data, file, indent = 4)

        try:
            cur = conn.cursor()
            cur.execute('insert into heatmap values (%s, %s, %s);', (id, id, path))
        finally:
            cur.close()

        result = {
            'heatmap_ID' : id,
            'MID' : id,
            'data' : path
        }
        response = make_response(jsonify(result), 201)

        conn.commit()
        return response
    
    def delete(self, id):
        conn = get_db_connection()
        try:
            cur = conn.cursor()
            cur.execute('select * from heatmap where heatmap_ID = %s Limit 1;', (id,))
        except mysql.connector.Error as err:
            return jsonify(f'Failed to obtain heatmap data: {err}'), 500
        else:
            result = cur.fetchone()
        finally:
            cur.close()

        if result:
            os.remove(result[2])
            try:
                cur = conn.cursor()
                cur.execute('delete from heatmap where heatmap_ID = %s;', (id,))
            finally:
                cur.close()
            response = make_response(jsonify(''), 200)
        else:
            response = make_response(jsonify(''), 404)

        conn.commit()
        return response
