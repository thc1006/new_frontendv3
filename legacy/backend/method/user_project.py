from flask import make_response, request, jsonify
from flask_restful import Resource
import mysql.connector

from config import get_db_connection

class User_Project(Resource):
    def get(self, identifier, id): 
        conn = get_db_connection()
        if identifier == 'User':
            try:
                cur = conn.cursor() 
                cur.execute('select project.* from project join user_project where project.PID = user_project.PID and user_project.UID = %s;', (id,))
            except mysql.connector.Error as err:
                return jsonify(f'Error getting user_project: {err}'), 500
            else:
                result = cur.fetchall()
            finally:
                cur.close()

            projects = {}
            for row in result:
                projects[row[0]] = {
                    'PID' : row[0], 
                    'title' : row[1], 
                    'date' : row[2]
                }
            if projects == {}:
                response = make_response(jsonify(projects), 404)
            else:
                response = make_response(jsonify(projects), 200)
        elif identifier == 'Project':
            try:
                cur = conn.cursor()
                cur.execute('select user.* from user join user_project where user.UID = user_project.UID and user_project.PID = %s;', (id,))
            except mysql.connector.Error as err:
                return jsonify(f'Error getting user_project: {err}'), 500
            else:
                result = cur.fetchall()
            finally:
                cur.close()
            users = {}
            for row in result:
                users[row[0]] = {
                    'UID' : row[0], 
                    'account' : row[1], 
                    'password' : row[2], 
                    'email' : row[3]
                }
            if users == {}:
                response = make_response(jsonify(users), 404)
            else:
                response = make_response(jsonify(users), 200)

        return response 

    def post(self, identifier, id):
        conn = get_db_connection()
        data = request.get_json(force = True) 
        auth = data.get('auth')

        try:
            cur = conn.cursor()
            cur.execute('insert into user_project values (%s, %s, %s);', (id, identifier, auth))
        finally:
            cur.close()

        response = make_response(jsonify({
            'UID' : id, 
            'PID' : identifier, 
            'auth' : auth
        }), 201)

        conn.commit()
        return response

    def delete(self):
        pass
        # do not need delete API
        # when we delete project, will delete user_project relation at the same time