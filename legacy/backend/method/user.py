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
                cur.execute('select * from user where account = %s Limit 1;', (value,))
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
                    'salt' : result[4]
                }), 200)
            else:
                response = make_response(jsonify(''), 404)

        elif option == 'Small_Account':
            try:
                cur = conn.cursor()
                cur.execute('select account from user where account = %s Limit 1;', (value,))
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
                cur.execute('select * from user where email = %s Limit 1;', (value,))
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
                    'salt' : result[4],
                }), 200)
            else:
                response = make_response(jsonify(''), 404)
                
        elif option == 'Small_Email':
            try:
                cur = conn.cursor()
                cur.execute('select email from user where email = %s Limit 1;', (value,))
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
        salt = data.get('salt')

        cur = conn.cursor()
        cur.execute('select * from user order by UID DESC Limit 1;')
        result = cur.fetchone()
        cur.close()

        if result:
            new_id = result[0] + 1
        else:
            new_id = 1
            
        cur = conn.cursor()
        cur.execute('insert into user values (%s, %s, %s, %s, %s);', (new_id, account, password, email, salt))
        cur.close()
        
        cur = conn.cursor()
        cur.execute('select * from user order by UID DESC Limit 1;')
        result = cur.fetchone()
        cur.close()

        response = make_response(jsonify({
            'UID' : result[0], 
            'account' : result[1], 
            'password' : result[2], 
            'email' : result[3],
            'salt' : result[4]
        }), 201)

        conn.commit()
        return response
    
    def put(self, identifier):
        conn = get_db_connection()
        data = request.get_json(force = True) 
        account = data.get('account')
        password = data.get('password')
        email = data.get('email')

        cur = conn.cursor()
        cur.execute('select * from user where UID = %s Limit 1;', (identifier,))
        result = cur.fetchone()
        cur.close()

        if result:
            cur = conn.cursor()
            cur.execute('update user set account = %s, password = %s, email= %s where UID = %s;', (account, password, email, identifier))
            cur.close()
            
            response = make_response(jsonify({
                'UID' : identifier, 
                'account' : account, 
                'password' : password, 
                'email' : email,
            }), 200)
        else:
            response = make_response(jsonify(''), 404)

        conn.commit()
        return response

    def delete(self, identifier):
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute('select * from user where UID = %s Limit 1;', (identifier,))
        result = cur.fetchone()
        # cur.close()

        if result:
            cur.execute('delete from user where UID = %s;', (identifier,))

            response = make_response(jsonify(''), 200)
        else:
            response = make_response(jsonify(''), 404)

        conn.commit()
        cur.close()
        return response 