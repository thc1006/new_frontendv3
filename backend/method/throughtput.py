from flask import make_response, request, jsonify
from flask_restful import Resource
import os, json
from config import get_db_connection
import logging
import mysql.connector

# Configure logging
handler = logging.FileHandler('tp_heatmap_error.log')
handler.setFormatter(logging.Formatter('%(asctime)s %(levelname)s: %(message)s'))
logger = logging.getLogger('tp_heatmap_error')
logger.setLevel(logging.ERROR)
logger.addHandler(handler)

class Throughtput(Resource):
    def get(self, id):
        conn = get_db_connection()
        try:
            cur = conn.cursor()
            cur.execute('select * from throughtput where MID = %s Limit 1;', (id,))
        except mysql.connector.Error as err:
            logger.error(err)
            return jsonify(f'Failed to get throughput heatmap: {err}'), 500
        else:
            result = cur.fetchone()
        finally:
            cur.close()
        
        if result:
            data = {
                    'throughtput_ID' : result[0],
                    'MID' : result[1]
            }
            with open(result[2], 'r') as throughtput_file:
                throughtput = json.load(throughtput_file)
            data['data'] = throughtput
            response = make_response(jsonify(data), 200)
        else:
            response = make_response(jsonify(''), 404)

        return response

    def post(self, id):
        conn = get_db_connection()
        data = request.get_json(force = True)
        cur = conn.cursor()
        try:
            # cur.execute('select * from throughtput order by throughtput_ID DESC Limit 1;')
            cur.execute('select * from throughtput where throughtput_ID = %s Limit 1;', (id,))
        except mysql.connector.Error as err:
            logger.error(err)
            conn.rollback()  # Rollback any uncommitted transactions
            return f'Failed to get throughput heatmap: {err}', 500
        else:
            # Check exist
            try:
                result = cur.fetchone()
            except TypeError:
                pass
            else:
                # return make_response(jsonify('Conflict: heatmap already exists'), 409)
                cur.execute('delete from throughtput where throughtput_ID = %s;', (id,))
        finally:
            cur.close()


        path = './throughtput/' + str(id) + '.json'
        with open(path, 'w') as file:
            json.dump(data, file, indent = 4)

        try:
            cur = conn.cursor()
            cur.execute('insert into throughtput values (%s, %s, %s);', (id, id, path))
        finally:
            cur.close()

        result = {
            'throughtput_ID' : id,
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
            cur.execute('select * from throughtput where throughtput_ID = %s Limit 1;', (id,))
        except mysql.connector.Error as err:
            return f'Error deleting throughput heatmap: {err}', 500
        else:
            result = cur.fetchone()
        finally:
            cur.close()

        if result:
            os.remove(result[2])
            try:
                cur = conn.cursor()
                cur.execute('delete from throughtput where throughtput_ID = %s;', (id,))
            finally:
                cur.close()
            response = make_response(jsonify(''), 200)
            
        else:
            response = make_response(jsonify(''), 404)

        conn.commit()
        return response