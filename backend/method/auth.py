from flask import make_response, request, jsonify, session
from flask_restful import Resource
import mysql.connector
import hashlib
import string
import random
from werkzeug.security import check_password_hash, generate_password_hash

from config import get_db_connection, app


def generate_random_string(length):
    """Generate a random string for password salt."""
    letters = string.ascii_letters + string.digits + string.punctuation
    return ''.join(random.choice(letters) for _ in range(length))


class AuthLogin(Resource):
    def post(self):
        """User login endpoint."""
        conn = get_db_connection()
        data = request.get_json(force=True)
        account = data.get('account')
        password = data.get('password')

        if not account or not password:
            return make_response(jsonify({'message': 'Account and password are required'}), 400)

        try:
            cur = conn.cursor()
            cur.execute('SELECT user_id, account, password, email FROM users WHERE account = %s LIMIT 1;', (account,))
            result = cur.fetchone()
            cur.close()
        except mysql.connector.Error as err:
            return make_response(jsonify({'message': f'Database error: {err}'}), 500)

        if not result:
            return make_response(jsonify({'message': 'Account not found'}), 404)

        stored_uid, stored_account, stored_password, stored_email = result

        # Verify password using Werkzeug's check_password_hash (PBKDF2)
        if not check_password_hash(stored_password, password):
            return make_response(jsonify({'message': 'Incorrect password'}), 401)

        # Set session
        session['username'] = stored_account
        session['UID'] = stored_uid
        session.permanent = True

        response = make_response(jsonify({
            'message': 'Login successful',
            'UID': stored_uid,
            'account': stored_account,
            'email': stored_email
        }), 200)
        return response


class AuthRegister(Resource):
    def post(self):
        """User registration endpoint."""
        conn = get_db_connection()
        data = request.get_json(force=True)
        account = data.get('account')
        password = data.get('password')
        email = data.get('email')

        if not account or not password or not email:
            return make_response(jsonify({'message': 'Account, password, and email are required'}), 400)

        # Check if account already exists
        try:
            cur = conn.cursor()
            cur.execute('SELECT account FROM users WHERE account = %s LIMIT 1;', (account,))
            existing = cur.fetchone()
            cur.close()
        except mysql.connector.Error as err:
            return make_response(jsonify({'message': f'Database error: {err}'}), 500)

        if existing:
            return make_response(jsonify({'message': 'Account already exists'}), 409)

        # Check if email already exists
        try:
            cur = conn.cursor()
            cur.execute('SELECT email FROM users WHERE email = %s LIMIT 1;', (email,))
            existing_email = cur.fetchone()
            cur.close()
        except mysql.connector.Error as err:
            return make_response(jsonify({'message': f'Database error: {err}'}), 500)

        if existing_email:
            return make_response(jsonify({'message': 'Email already registered'}), 409)

        # Hash password using Werkzeug's PBKDF2
        hashed_pwd = generate_password_hash(password)

        # Insert new user (auto_increment for user_id)
        try:
            cur = conn.cursor()
            cur.execute('''INSERT INTO users (account, password, email, role, created_at)
                          VALUES (%s, %s, %s, 'USER', CURDATE())''',
                        (account, hashed_pwd, email))
            conn.commit()
            new_uid = cur.lastrowid
            cur.close()
        except mysql.connector.Error as err:
            return make_response(jsonify({'message': f'Failed to create user: {err}'}), 500)

        response = make_response(jsonify({
            'message': 'Registration successful',
            'UID': new_uid,
            'account': account,
            'email': email
        }), 201)
        return response


class AuthLogout(Resource):
    def post(self):
        """User logout endpoint."""
        session.clear()
        return make_response(jsonify({'message': 'Logout successful'}), 200)


class AuthCurrentUser(Resource):
    def get(self):
        """Get current logged-in user info."""
        if 'UID' not in session:
            return make_response(jsonify({'message': 'Not logged in'}), 401)

        conn = get_db_connection()
        try:
            cur = conn.cursor()
            cur.execute('SELECT user_id, account, email FROM users WHERE user_id = %s LIMIT 1;', (session['UID'],))
            result = cur.fetchone()
            cur.close()
        except mysql.connector.Error as err:
            return make_response(jsonify({'message': f'Database error: {err}'}), 500)

        if not result:
            session.clear()
            return make_response(jsonify({'message': 'User not found'}), 404)

        return make_response(jsonify({
            'UID': result[0],
            'account': result[1],
            'email': result[2]
        }), 200)
