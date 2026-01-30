from flask import make_response, request, jsonify
from flask_restful import Resource
import mysql.connector

from config import get_db_connection

class User_Project(Resource):
    def get(self, identifier, id):
        conn = get_db_connection()
        if identifier == 'User':
            # Get all projects for a user
            try:
                cur = conn.cursor()
                cur.execute('''SELECT p.project_id, p.title, p.date, p.lat, p.lon
                               FROM projects p
                               JOIN user_projects up ON p.project_id = up.project_id
                               WHERE up.user_id = %s;''', (id,))
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
                    'date' : str(row[2]) if row[2] else None,
                    'lat': row[3],
                    'lon': row[4]
                }
            if projects == {}:
                response = make_response(jsonify(projects), 404)
            else:
                response = make_response(jsonify(projects), 200)

        elif identifier == 'Project':
            # Get all users for a project
            try:
                cur = conn.cursor()
                cur.execute('''SELECT u.user_id, u.account, u.email, u.role
                               FROM users u
                               JOIN user_projects up ON u.user_id = up.user_id
                               WHERE up.project_id = %s;''', (id,))
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
                    'email' : row[2],
                    'role' : row[3]
                }
            if users == {}:
                response = make_response(jsonify(users), 404)
            else:
                response = make_response(jsonify(users), 200)

        return response

    def post(self, identifier, id):
        conn = get_db_connection()
        data = request.get_json(force = True)
        role = data.get('role', 'USER')

        # identifier is project_id, id is user_id
        try:
            cur = conn.cursor()
            cur.execute('INSERT INTO user_projects (user_id, project_id, role) VALUES (%s, %s, %s);',
                        (id, identifier, role))
            conn.commit()
        except mysql.connector.Error as err:
            return jsonify(f'Error creating user_project: {err}'), 500
        finally:
            cur.close()

        response = make_response(jsonify({
            'user_id' : id,
            'project_id' : identifier,
            'role' : role
        }), 201)

        return response

    def delete(self):
        pass
        # do not need delete API
        # when we delete project, will delete user_project relation at the same time
