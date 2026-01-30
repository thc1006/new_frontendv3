from flask import make_response, request, jsonify
from flask_restful import Resource
import mysql.connector

from config import get_db_connection

class User(Resource):
    def get(self, option = 'Account', value = ''):
        conn = get_db_connection()
        if option == 'Account':
            try:
                cur = conn.cursor()
                cur.execute('select user_id, account, password, email, role from users where account = %s Limit 1;', (value,))
            except mysql.connector.Error as err:
                return f'Failed to get user account: {err}', 500
            else:
                result = cur.fetchone()
            finally:
                cur.close()

            if result:
                response = make_response(jsonify({
                    'UID' : result[0],
                    'account' : result[1],
                    'password' : result[2],
                    'email' : result[3],
                    'role' : result[4]
                }), 200)
            else:
                response = make_response(jsonify(''), 404)

        elif option == 'Small_Account':
            try:
                cur = conn.cursor()
                cur.execute('select account from users where account = %s Limit 1;', (value,))
            except mysql.connector.Error as err:
                return f'Failed to get user account: {err}', 500
            else:
                result = cur.fetchone()
            finally:
                cur.close()

            if result:
                response = make_response(jsonify({'account': result[0]}), 200)
            else:
                response = make_response(jsonify(''), 404)

        elif option == 'Email':
            try:
                cur = conn.cursor()
                cur.execute('select user_id, account, password, email, role from users where email = %s Limit 1;', (value,))
            except mysql.connector.Error as err:
                return f'Failed to get user email: {err}', 500
            else:
                result = cur.fetchone()
                print(result)
            finally:
                cur.close()

            if result:
                response = make_response(jsonify({
                    'UID' : result[0],
                    'account' : result[1],
                    'password' : result[2],
                    'email' : result[3],
                    'role' : result[4],
                }), 200)
            else:
                response = make_response(jsonify(''), 404)

        elif option == 'Small_Email':
            try:
                cur = conn.cursor()
                cur.execute('select email from users where email = %s Limit 1;', (value,))
            except mysql.connector.Error as err:
                return f'Failed to get user email: {err}', 500
            else:
                result = cur.fetchone()
            finally:
                cur.close()

            if result:
                response = make_response(jsonify({'email': result[0]}), 200)
            else:
                response = make_response(jsonify(''), 404)

        return response

    def post(self):
        conn = get_db_connection()
        data = request.get_json(force = True)
        account = data.get('account')
        password = data.get('password')
        email = data.get('email')
        role = data.get('role', 'USER')

        # Insert new user (auto_increment for user_id)
        try:
            cur = conn.cursor()
            cur.execute('insert into users (account, password, email, role, created_at) values (%s, %s, %s, %s, CURDATE());',
                        (account, password, email, role))
            conn.commit()
            new_id = cur.lastrowid
            cur.close()
        except mysql.connector.Error as err:
            return f'Failed to create user: {err}', 500

        # Fetch the created user
        cur = conn.cursor()
        cur.execute('select user_id, account, password, email, role from users where user_id = %s Limit 1;', (new_id,))
        result = cur.fetchone()
        cur.close()

        response = make_response(jsonify({
            'UID' : result[0],
            'account' : result[1],
            'password' : result[2],
            'email' : result[3],
            'role' : result[4]
        }), 201)

        return response

    def put(self, identifier):
        conn = get_db_connection()
        data = request.get_json(force = True)
        account = data.get('account')
        password = data.get('password')
        email = data.get('email')

        cur = conn.cursor()
        cur.execute('select user_id from users where user_id = %s Limit 1;', (identifier,))
        result = cur.fetchone()
        cur.close()

        if result:
            cur = conn.cursor()
            cur.execute('update users set account = %s, password = %s, email= %s where user_id = %s;', (account, password, email, identifier))
            conn.commit()
            cur.close()

            response = make_response(jsonify({
                'UID' : identifier,
                'account' : account,
                'password' : password,
                'email' : email,
            }), 200)
        else:
            response = make_response(jsonify(''), 404)

        return response

    def delete(self, identifier):
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute('select user_id from users where user_id = %s Limit 1;', (identifier,))
        result = cur.fetchone()

        if result:
            cur.execute('delete from users where user_id = %s;', (identifier,))
            conn.commit()
            response = make_response(jsonify(''), 200)
        else:
            response = make_response(jsonify(''), 404)

        cur.close()
        return response
