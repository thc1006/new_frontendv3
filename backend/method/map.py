from flask import make_response, request, jsonify
from flask_restful import Resource
import mysql.connector

from config import get_db_connection
import os, base64, json

import logging

# Create logger
logger = logging.getLogger("map.py")
logger.setLevel(logging.INFO)
handler = logging.StreamHandler()
formatter = logging.Formatter('%(asctime)s [%(levelname)s] map.py - %(message)s')
handler.setFormatter(formatter)
logger.addHandler(handler)

class Map(Resource):
    def get(self, option = 'MID', id = ''):
        conn = get_db_connection()
        if option == 'MID':
            try:
                cur = conn.cursor()
                cur.execute('select * from map where MID = %s Limit 1;', (id,))
            except mysql.connector.Error as err:
                logger.error(err)
                return jsonify(f'Failed to get map: {err}'), 500
            else:
                result = cur.fetchone()
            finally:
                cur.close()
            

            if result:
                image_path = result[2]
                try:
                    with open(image_path, 'r') as image_file:
                        image = json.load(image_file)
                except Exception as err:
                    logger.error(f'wisdon-ue {err}')
                    print(f"Error reading image: {err}")

                response = make_response(jsonify({
                    'MID' : result[0], 
                    'UID' : result[1],
                    'image' : image, 
                    'position' : json.loads(result[3]),
                    'name' : result[4]
                }), 200)
            else:
                response = make_response(jsonify(''), 404)
                
        elif option == 'UID':
            try:
                cur = conn.cursor()
                cur.execute('select MID, name from map where UID = %s;', (id,))
            except mysql.connector.Error as err:
                return f'Failed to get MID with UID: {err}', 500
            else:
                result = cur.fetchall()
            finally:
                cur.close()

            if result:
                arr = []
                for row in result:
                    data = {
                        'MID' : row[0],
                        'name': row[1]
                    }
                    arr.append(data)
                response = make_response(jsonify(arr), 200)
            else:
                response = make_response(jsonify(''), 404)

        return response 
        
    def post(self):
        conn = get_db_connection()
        data = request.get_json(force = True) 
        image_data = data.get('image')
        position = data.get('position')
        UID = data.get('UID')
        name = data.get('name')

        try:
            cur = conn.cursor()
            cur.execute('select * from map order by MID DESC Limit 1;')
        except mysql.connector.Error as err:
            return jsonify(f'Error getting map: {err}'), 500
        else:
            result = cur.fetchone()
        finally:
            cur.close()

        status_code = 201
        error = ""
        if result:
            new_id = result[0] + 1
        else:
            new_id = 1 
        image_path = './img/' + str(new_id) + str('.json')

        try:
            with open(image_path, 'w') as image_file:
                json.dump(image_data, image_file, indent = 4)

            cur = conn.cursor()
            cur.execute('insert into map values (%s, %s, %s, %s, %s);', (new_id, UID, image_path, json.dumps(position), name))
        except Exception as err:
            status_code = 500
            error = err
            logger.error(f'wisdon-ue {err}')
            print(f"Error saving image: {err}")
        finally:
            cur.close()

        try:
            cur = conn.cursor()
            cur.execute('select * from map order by MID DESC Limit 1;')
        except mysql.connector.Error as err:
            return jsonify(f'Error getting map: {err}'), 500
        else:
            result = cur.fetchone()
        finally:
            cur.close()

        if status_code != 201:
            response = make_response(jsonify({
                'MID' : 0,
                'UID': 0,
                'image' : error, 
                'position' : {},
                'name' : ''
            }), status_code)
            
        else:
            response = make_response(jsonify({
                'MID' : result[0],
                'UID' : result[1],
                'image' : result[2], 
                'position' : json.loads(result[3]),
                'name' : result[4]
            }), status_code)

        conn.commit()
        return response
    
    def put(self, option = 'Image', id = ''):
        conn = get_db_connection()
        data = request.get_json(force = True) 

        try:
            cur = conn.cursor()
            cur.execute('select * from map where MID = %s Limit 1;', (id,))
        except mysql.connector.Error as err:
            return jsonify(f'Error getting map: {err}'), 500
        else:
            result = cur.fetchone()
        finally:
            cur.close()

        if result:
            if option == 'Image':
                image_data = data.get('image')
                image_path = './img/' + str(id) + str('.json')
                os.remove(image_path)
                try:
                    with open(image_path, 'w') as image_file:
                        json.dump(image_data, image_file, indent = 4)
                except Exception as err:
                    print(f"Error saving image: {err}")
                response = make_response(jsonify(''), 200)
            elif option == 'Position':
                cur = conn.cursor()
                cur.execute('update map set position = %s where MID = %s;', (json.dumps(data), id))
                cur.close()

                response = make_response(jsonify(''), 200)
                
        else:
            response = make_response(jsonify(''), 404)

        conn.commit()
        return response
    
    def delete(self, id):
        conn = get_db_connection()
        try:
            cur = conn.cursor()
            cur.execute('select * from map where MID = %s Limit 1;', (id,))
        except mysql.connector.Error as err:
            return jsonify(f'Error getting map: {err}'), 500
        else:
            result = cur.fetchone()
        finally:
            cur.close()

        if result:
            os.remove(result[2])
            try:
                cur = conn.cursor()
                cur.execute('delete from map where MID = %s;', (id,))
            finally:
                cur.close()
            
            response = make_response(jsonify(''), 200)
        else:
            response = make_response(jsonify(''), 404)

        conn.commit()
        return response