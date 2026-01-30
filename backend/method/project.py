from flask import make_response, request, jsonify
from flask_restful import Resource
import json, os, shutil
import mysql.connector

from config import get_db_connection

class Project(Resource):
    def get(self, pid = None): 
        conn = get_db_connection()
        try:
            cur = conn.cursor() 
            cur.execute('SELECT * FROM project WHERE PID = %s Limit 1;', (pid,))
        except mysql.connector.Error as err:
            return f'Failed to obtain project data: {err}', 500
        else:
            result = cur.fetchone()
        finally:
            cur.close()
        

        if result:
            response = make_response(jsonify({
                'PID' : result[0], 
                'title' : result[1], 
                'date' : result[2]
            }), 200)
        else:
            response = make_response(jsonify(''), 404)

        return response

    def post(self):
        conn = get_db_connection()
        data = request.get_json(force = True) 
        title = data.get('title')
        date = data.get('date')

        try:
            cur = conn.cursor()
            cur.execute('select * from project order by PID DESC Limit 1;')
        except mysql.connector.Error as err:
            return f'Failed to obtain project data: {err}', 500
        else:
            result = cur.fetchone()
        finally:
            cur.close()

        if result:
            new_id = result[0] + 1
        else:
            new_id = 1
            
        try:
            cur = conn.cursor()
            cur.execute('insert into project values (%s, %s, %s);', (new_id, title, date))
        finally:
            cur.close()

        # New heatmaps
        rsrp_path = f'./heatmap/{new_id}.json'
        tp_path = f'./throughtput/{new_id}.json'
        shutil.copy('./heatmap/base.json', rsrp_path)
        shutil.copy('./throughtput/base.json', tp_path)
        try:
            cur = conn.cursor()
            cur.execute('insert into heatmap values (%s, %s, %s);', (new_id, new_id, rsrp_path))
            cur.execute('insert into throughtput values (%s, %s, %s);', (new_id, new_id, tp_path))
        finally:
            cur.close()
    
        response = make_response(jsonify({
            'PID' : new_id, 
            'title' : title, 
            'date' : date
        }), 201)

        conn.commit()
        return response
    
    def put(self, pid):
        conn = get_db_connection()
        data = request.get_json(force = True) 
        title = data.get('title')
        date = data.get('date')

        try:
            cur = conn.cursor()
            cur.execute('select * from project where PID = %s Limit 1;', (pid,))
        except mysql.connector.Error as err:
            return f'Failed to obtain projects data: {err}', 500
        else:
            result = cur.fetchone()
        finally:
            cur.close()

        # Exist -> Update
        if result:
            cur = conn.cursor()
            try:
                cur.execute('update project set title = %s, date = %s where PID = %s;', (title, date, pid))
            finally:
                cur.close()
            response = make_response(jsonify({
                'PID' : pid, 
                'title' : title, 
                'date' : date
            }), 200)
        # Not exist -> Create new
        else:
            try:
                cur = conn.cursor()
                cur.execute('select * from project order by PID DESC Limit 1;')
            except mysql.connector.Error as err:
                return jsonify(f'Error getting project: {err}'), 500
            else:
                result = cur.fetchone()
            finally:
                cur.close()

            if result:
                new_id = result[0] + 1
            else:
                new_id = 1
                
            try:
                cur = conn.cursor()
                cur.execute('insert into project values (%s, %s, %s);', (new_id, title, date))
            finally:
                cur.close()
            response = make_response(jsonify({
                'PID' : new_id, 
                'title' : title, 
                'date' : date
            }), 201)

        conn.commit()
        return response

    def delete(self, pid):
        conn = get_db_connection()
        try:
            cur = conn.cursor()
            cur.execute('select * from project where PID = %s Limit 1;', (pid,))
        except mysql.connector.Error as err:
            return jsonify(f'Error getting project: {err}'), 500
        else:
            project_result = cur.fetchone()
        finally:
            cur.close()

        if project_result :
            try:
                cur = conn.cursor()
                cur.execute('delete from project where PID = %s;', (pid,))

                # Clean up
                cur.execute('delete from user_project where PID = %s;', (pid,))
                cur.execute('delete from project_map where PID = %s;', (pid,))
                cur.execute('delete from CU where PID = %s;', (pid,))
                cur.execute('delete from DU where PID = %s;', (pid,))
                cur.execute('delete from RU where PID = %s;', (pid,))
                cur.execute('delete from heatmap where heatmap_ID = %s;', (pid,))
                cur.execute('delete from throughtput where throughtput_ID = %s;', (pid,))
            finally:
                cur.close()
                
            conn.commit()
        
            try:
                os.remove(f'./heatmap/{pid}.json')
            except OSError:
                pass
            try:
                os.remove(f'./throughtput/{pid}.json')
            except OSError:
                pass

            response = make_response(jsonify(''), 200)
        else:
            response = make_response(jsonify(''), 404)

        return response 