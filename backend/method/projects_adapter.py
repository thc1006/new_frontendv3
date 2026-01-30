"""
API Adapter to bridge new frontend API paths to old backend structure.
New frontend expects RESTful paths like /projects/me, /projects/{id}/rus
Updated to support the new database schema with different column names.
"""
from flask import make_response, request, jsonify, session
from flask_restful import Resource
import mysql.connector

from config import get_db_connection


class ProjectsMe(Resource):
    """GET /projects/me - Get current user's projects"""
    def get(self):
        if 'UID' not in session:
            return make_response(jsonify({'message': 'Not logged in'}), 401)

        uid = session['UID']
        conn = get_db_connection()

        try:
            cur = conn.cursor(dictionary=True)
            # Use old ORAN_mysql schema: project, user_project, PID
            # Join with project_map and map to get coordinates
            cur.execute('''
                SELECT p.PID as project_id, p.title, p.date,
                       JSON_EXTRACT(m.position, '$.coordinates.lat') as lat,
                       JSON_EXTRACT(m.position, '$.coordinates.lng') as lon
                FROM user_project up
                JOIN project p ON up.PID = p.PID
                LEFT JOIN project_map pm ON p.PID = pm.PID
                LEFT JOIN map m ON pm.MID = m.MID
                WHERE up.UID = %s
                GROUP BY p.PID, p.title, p.date, m.position
            ''', (uid,))
            projects = cur.fetchall()
            cur.close()
        except mysql.connector.Error as err:
            return make_response(jsonify({'message': f'Database error: {err}'}), 500)

        return make_response(jsonify(projects), 200)


class ProjectDetail(Resource):
    """GET/PUT/DELETE /projects/{id}"""
    def get(self, project_id):
        import json
        import math

        if 'UID' not in session:
            return make_response(jsonify({'message': 'Not logged in'}), 401)

        conn = get_db_connection()
        try:
            cur = conn.cursor(dictionary=True)
            # Use old ORAN_mysql schema: project table with PID
            # Join with project_map and map to get coordinates
            cur.execute('''
                SELECT p.PID as id, p.title, p.date as created_at,
                       JSON_EXTRACT(m.position, '$.coordinates.lat') as lat,
                       JSON_EXTRACT(m.position, '$.coordinates.lng') as lon,
                       JSON_EXTRACT(m.position, '$.boundary') as boundary,
                       m.position as map_position
                FROM project p
                LEFT JOIN project_map pm ON p.PID = pm.PID
                LEFT JOIN map m ON pm.MID = m.MID
                WHERE p.PID = %s
                LIMIT 1
            ''', (project_id,))
            project = cur.fetchone()
            cur.close()
        except mysql.connector.Error as err:
            return make_response(jsonify({'message': f'Database error: {err}'}), 500)

        if not project:
            return make_response(jsonify({'message': 'Project not found'}), 404)

        # Extract rotation angle and margin from map_position for 3D model placement
        if project.get('map_position'):
            try:
                position = json.loads(project['map_position']) if isinstance(project['map_position'], str) else project['map_position']

                # Extract rotation angle from 4x4 rotation matrix (column-major order)
                # Matrix format: [r00, r10, r20, r30, r01, r11, r21, r31, r02, r12, r22, r32, r03, r13, r23, r33]
                # For 2D rotation: cos(θ) = r00, sin(θ) = r10
                rotation = position.get('rotation', [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1])
                if len(rotation) >= 2:
                    cos_theta = rotation[0]
                    sin_theta = rotation[1]
                    # Calculate rotation angle in degrees
                    rotation_angle = math.degrees(math.atan2(sin_theta, cos_theta))
                    project['rotation_offset'] = rotation_angle
                else:
                    project['rotation_offset'] = 0

                # Calculate margin (building size) from bbox
                bbox = position.get('bbox', {})
                if bbox:
                    bbox_max = bbox.get('max', {})
                    bbox_min = bbox.get('min', {})
                    width = abs(bbox_max.get('x', 0) - bbox_min.get('x', 0))
                    height = abs(bbox_max.get('y', 0) - bbox_min.get('y', 0))
                    project['margin'] = max(width, height)

                # Default offsets (can be adjusted per project)
                project['lat_offset'] = 0
                project['lon_offset'] = 0
                project['scale'] = 1.0

            except (json.JSONDecodeError, TypeError, KeyError) as e:
                # If parsing fails, use defaults
                project['rotation_offset'] = 0
                project['lat_offset'] = 0
                project['lon_offset'] = 0
                project['scale'] = 1.0
                project['margin'] = 77  # Default margin for ED8F building

        return make_response(jsonify(project), 200)


class ProjectRUs(Resource):
    """GET /projects/{id}/rus - Get RUs for a project"""
    def get(self, project_id):
        if 'UID' not in session:
            return make_response(jsonify({'message': 'Not logged in'}), 401)

        conn = get_db_connection()
        try:
            cur = conn.cursor(dictionary=True)
            # Updated to match new wisdon database schema
            cur.execute('''
                SELECT RU_id as id, name, DU_id as du_id, project_id,
                       brand_id, lat, lon, z, bandwidth, tx_power, roll, tilt, opening_angle
                FROM RUs WHERE project_id = %s
            ''', (project_id,))
            rus = cur.fetchall()
            cur.close()
        except mysql.connector.Error as err:
            return make_response(jsonify({'message': f'Database error: {err}'}), 500)

        return make_response(jsonify(rus), 200)


class ProjectCUs(Resource):
    """GET /projects/{id}/cus - Get CUs for a project"""
    def get(self, project_id):
        if 'UID' not in session:
            return make_response(jsonify({'message': 'Not logged in'}), 401)

        conn = get_db_connection()
        try:
            cur = conn.cursor(dictionary=True)
            # Use old ORAN_mysql schema: CU table with CUID, PID, etc.
            cur.execute('SELECT CU_id as id, name, project_id, brand_id FROM CUs WHERE project_id = %s', (project_id,))
            cus = cur.fetchall()
            cur.close()
        except mysql.connector.Error as err:
            return make_response(jsonify({'message': f'Database error: {err}'}), 500)

        return make_response(jsonify(cus), 200)


class ProjectDUs(Resource):
    """GET /projects/{id}/dus - Get DUs for a project"""
    def get(self, project_id):
        if 'UID' not in session:
            return make_response(jsonify({'message': 'Not logged in'}), 401)

        conn = get_db_connection()
        try:
            cur = conn.cursor(dictionary=True)
            # Use old ORAN_mysql schema: DU table with DUID, PID, etc.
            cur.execute('SELECT DU_id as id, CU_id as cu_id, project_id, name, brand_id FROM DUs WHERE project_id = %s', (project_id,))
            dus = cur.fetchall()
            cur.close()
        except mysql.connector.Error as err:
            return make_response(jsonify({'message': f'Database error: {err}'}), 500)

        return make_response(jsonify(dus), 200)


class ProjectMaps(Resource):
    """GET /projects/{id}/maps_frontend - Get 3D model GLTF data for a project"""
    def get(self, project_id):
        import os
        import json as json_module

        if 'UID' not in session:
            return make_response(jsonify({'message': 'Not logged in'}), 401)

        conn = get_db_connection()
        try:
            cur = conn.cursor(dictionary=True)
            # Use old ORAN_mysql schema: map table with MID, image field
            cur.execute('''
                SELECT m.MID as id, m.image, m.name, m.position
                FROM project_map pm
                JOIN map m ON pm.MID = m.MID
                WHERE pm.PID = %s
                LIMIT 1
            ''', (project_id,))
            map_data = cur.fetchone()
            cur.close()

            if not map_data:
                return make_response(jsonify({'message': 'No map found for project'}), 404)

            # The image field contains path like ./img/5.json which is the GLTF data
            image_path = map_data.get('image', '')
            if image_path:
                # Convert relative path to absolute
                base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
                full_path = os.path.join(base_dir, image_path.lstrip('./'))

                if os.path.exists(full_path):
                    with open(full_path, 'r', encoding='utf-8') as f:
                        gltf_data = json_module.load(f)
                    return make_response(jsonify(gltf_data), 200)

            # Fallback: return map metadata if GLTF file not found
            return make_response(jsonify(map_data), 200)
        except mysql.connector.Error as err:
            return make_response(jsonify({'message': f'Database error: {err}'}), 500)
        except Exception as e:
            return make_response(jsonify({'message': f'Error loading GLTF: {e}'}), 500)


class ProjectRsrp(Resource):
    """GET /projects/{id}/rsrp - Get RSRP heatmap for a project with GPS coordinates"""
    def get(self, project_id):
        import os
        import json as json_module
        import math

        if 'UID' not in session:
            return make_response(jsonify({'message': 'Not logged in'}), 401)

        conn = get_db_connection()
        try:
            cur = conn.cursor(dictionary=True)
            # Get map position (center coordinates) for the project
            cur.execute('''
                SELECT m.position
                FROM project_map pm
                JOIN map m ON pm.MID = m.MID
                WHERE pm.PID = %s
                LIMIT 1
            ''', (project_id,))
            map_data = cur.fetchone()
            cur.close()

            if not map_data or not map_data.get('position'):
                return make_response(jsonify([]), 200)

            # Parse position JSON
            position = json_module.loads(map_data['position']) if isinstance(map_data['position'], str) else map_data['position']
            center_lat = position.get('coordinates', {}).get('lat', 24.786964)
            center_lng = position.get('coordinates', {}).get('lng', 120.996776)

            # Load heatmap file
            base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            heatmap_path = os.path.join(base_dir, 'heatmap', f'{project_id}.json')

            if not os.path.exists(heatmap_path):
                return make_response(jsonify([]), 200)

            with open(heatmap_path, 'r', encoding='utf-8') as f:
                heatmap_data = json_module.load(f)

            # Calculate heatmap data center for centering
            x_vals = [p.get('ms_x', 0) for p in heatmap_data]
            y_vals = [p.get('ms_y', 0) for p in heatmap_data]
            data_center_x = (min(x_vals) + max(x_vals)) / 2
            data_center_y = (min(y_vals) + max(y_vals)) / 2

            # Convert local coordinates (ms_x, ms_y in meters) to GPS coordinates
            # 1 degree latitude ≈ 111111 meters
            # 1 degree longitude ≈ 111111 * cos(lat) meters
            lat_per_meter = 1.0 / 111111.0
            lng_per_meter = 1.0 / (111111.0 * math.cos(math.radians(center_lat)))

            # Get rotation from position data (4x4 matrix in column-major order)
            rotation = position.get('rotation', [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1])
            # Extract 2D rotation: [r00, r01, r10, r11] = [rotation[0], rotation[4], rotation[1], rotation[5]]
            # For a rotation matrix: [[cos, -sin], [sin, cos]]
            cos_theta = rotation[0] if len(rotation) >= 1 else 1
            sin_theta = rotation[1] if len(rotation) >= 2 else 0

            result = []
            for point in heatmap_data:
                # Center the local coordinates around the data center
                ms_x = point.get('ms_x', 0) - data_center_x
                ms_y = point.get('ms_y', 0) - data_center_y

                # Apply rotation to centered local coordinates
                x_rotated = ms_x * cos_theta - ms_y * sin_theta
                y_rotated = ms_x * sin_theta + ms_y * cos_theta

                # Convert to GPS: x_rotated -> longitude offset, y_rotated -> latitude offset
                lat = center_lat + (y_rotated * lat_per_meter)
                lon = center_lng + (x_rotated * lng_per_meter)

                # Find the strongest signal (max RSRP value, considering they're negative dBm)
                rsrp_values = []
                for key, value in point.items():
                    if key.startswith('RU') and isinstance(value, (int, float)):
                        rsrp_values.append(value)

                calc = max(rsrp_values) if rsrp_values else -140

                result.append({
                    'lat': lat,
                    'lon': lon,
                    'calc': calc
                })

            return make_response(jsonify(result), 200)

        except mysql.connector.Error as err:
            return make_response(jsonify({'message': f'Database error: {err}'}), 500)
        except Exception as e:
            return make_response(jsonify({'message': f'Error loading heatmap: {e}'}), 500)


class ProjectRsrpDt(Resource):
    """GET /projects/{id}/rsrp_dt - Get RSRP Digital Twin heatmap for a project"""
    def get(self, project_id):
        import os
        import json as json_module
        import math

        if 'UID' not in session:
            return make_response(jsonify({'message': 'Not logged in'}), 401)

        conn = get_db_connection()
        try:
            cur = conn.cursor(dictionary=True)
            cur.execute('''
                SELECT m.position
                FROM project_map pm
                JOIN map m ON pm.MID = m.MID
                WHERE pm.PID = %s
                LIMIT 1
            ''', (project_id,))
            map_data = cur.fetchone()
            cur.close()

            if not map_data or not map_data.get('position'):
                return make_response(jsonify([]), 200)

            position = json_module.loads(map_data['position']) if isinstance(map_data['position'], str) else map_data['position']
            center_lat = position.get('coordinates', {}).get('lat', 24.786964)
            center_lng = position.get('coordinates', {}).get('lng', 120.996776)

            base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            heatmap_path = os.path.join(base_dir, 'heatmapdt', f'{project_id}.json')

            if not os.path.exists(heatmap_path):
                return make_response(jsonify([]), 200)

            with open(heatmap_path, 'r', encoding='utf-8') as f:
                heatmap_data = json_module.load(f)

            # Calculate heatmap data center for centering
            x_vals = [p.get('ms_x', 0) for p in heatmap_data]
            y_vals = [p.get('ms_y', 0) for p in heatmap_data]
            data_center_x = (min(x_vals) + max(x_vals)) / 2
            data_center_y = (min(y_vals) + max(y_vals)) / 2

            lat_per_meter = 1.0 / 111111.0
            lng_per_meter = 1.0 / (111111.0 * math.cos(math.radians(center_lat)))

            # Get rotation from position data
            rotation = position.get('rotation', [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1])
            cos_theta = rotation[0] if len(rotation) >= 1 else 1
            sin_theta = rotation[1] if len(rotation) >= 2 else 0

            result = []
            for point in heatmap_data:
                # Center the local coordinates
                ms_x = point.get('ms_x', 0) - data_center_x
                ms_y = point.get('ms_y', 0) - data_center_y

                # Apply rotation
                x_rotated = ms_x * cos_theta - ms_y * sin_theta
                y_rotated = ms_x * sin_theta + ms_y * cos_theta

                lat = center_lat + (y_rotated * lat_per_meter)
                lon = center_lng + (x_rotated * lng_per_meter)

                rsrp_values = []
                for key, value in point.items():
                    if key.startswith('RU') and isinstance(value, (int, float)):
                        rsrp_values.append(value)

                calc = max(rsrp_values) if rsrp_values else -140
                result.append({'lat': lat, 'lon': lon, 'calc': calc})

            return make_response(jsonify(result), 200)

        except mysql.connector.Error as err:
            return make_response(jsonify({'message': f'Database error: {err}'}), 500)
        except Exception as e:
            return make_response(jsonify({'message': f'Error loading heatmap: {e}'}), 500)


class ProjectThroughput(Resource):
    """GET /projects/{id}/throughput - Get Throughput heatmap for a project"""
    def get(self, project_id):
        import os
        import json as json_module
        import math

        if 'UID' not in session:
            return make_response(jsonify({'message': 'Not logged in'}), 401)

        conn = get_db_connection()
        try:
            cur = conn.cursor(dictionary=True)
            cur.execute('''
                SELECT m.position
                FROM project_map pm
                JOIN map m ON pm.MID = m.MID
                WHERE pm.PID = %s
                LIMIT 1
            ''', (project_id,))
            map_data = cur.fetchone()
            cur.close()

            if not map_data or not map_data.get('position'):
                return make_response(jsonify([]), 200)

            position = json_module.loads(map_data['position']) if isinstance(map_data['position'], str) else map_data['position']
            center_lat = position.get('coordinates', {}).get('lat', 24.786964)
            center_lng = position.get('coordinates', {}).get('lng', 120.996776)

            base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            heatmap_path = os.path.join(base_dir, 'throughput', f'{project_id}.json')

            if not os.path.exists(heatmap_path):
                return make_response(jsonify([]), 200)

            with open(heatmap_path, 'r', encoding='utf-8') as f:
                heatmap_data = json_module.load(f)

            # Calculate heatmap data center for centering (same as RSRP)
            x_vals = [p.get('ms_x', 0) for p in heatmap_data]
            y_vals = [p.get('ms_y', 0) for p in heatmap_data]
            data_center_x = (min(x_vals) + max(x_vals)) / 2
            data_center_y = (min(y_vals) + max(y_vals)) / 2

            lat_per_meter = 1.0 / 111111.0
            lng_per_meter = 1.0 / (111111.0 * math.cos(math.radians(center_lat)))

            # Get rotation from position data (same as RSRP)
            rotation = position.get('rotation', [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1])
            cos_theta = rotation[0] if len(rotation) >= 1 else 1
            sin_theta = rotation[1] if len(rotation) >= 2 else 0

            result = []
            for point in heatmap_data:
                # Center the local coordinates around the data center
                ms_x = point.get('ms_x', 0) - data_center_x
                ms_y = point.get('ms_y', 0) - data_center_y

                # Apply rotation to centered local coordinates
                x_rotated = ms_x * cos_theta - ms_y * sin_theta
                y_rotated = ms_x * sin_theta + ms_y * cos_theta

                # Convert to GPS
                lat = center_lat + (y_rotated * lat_per_meter)
                lon = center_lng + (x_rotated * lng_per_meter)
                calc = point.get('throughput', point.get('calc', 0))
                result.append({'lat': lat, 'lon': lon, 'calc': calc})

            return make_response(jsonify(result), 200)

        except mysql.connector.Error as err:
            return make_response(jsonify({'message': f'Database error: {err}'}), 500)
        except Exception as e:
            return make_response(jsonify({'message': f'Error loading heatmap: {e}'}), 500)


class ProjectThroughputDt(Resource):
    """GET /projects/{id}/throughput_dt - Get Throughput Digital Twin heatmap for a project"""
    def get(self, project_id):
        import os
        import json as json_module
        import math

        if 'UID' not in session:
            return make_response(jsonify({'message': 'Not logged in'}), 401)

        conn = get_db_connection()
        try:
            cur = conn.cursor(dictionary=True)
            cur.execute('''
                SELECT m.position
                FROM project_map pm
                JOIN map m ON pm.MID = m.MID
                WHERE pm.PID = %s
                LIMIT 1
            ''', (project_id,))
            map_data = cur.fetchone()
            cur.close()

            if not map_data or not map_data.get('position'):
                return make_response(jsonify([]), 200)

            position = json_module.loads(map_data['position']) if isinstance(map_data['position'], str) else map_data['position']
            center_lat = position.get('coordinates', {}).get('lat', 24.786964)
            center_lng = position.get('coordinates', {}).get('lng', 120.996776)

            base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            heatmap_path = os.path.join(base_dir, 'throughputdt', f'{project_id}.json')

            if not os.path.exists(heatmap_path):
                return make_response(jsonify([]), 200)

            with open(heatmap_path, 'r', encoding='utf-8') as f:
                heatmap_data = json_module.load(f)

            # Calculate heatmap data center for centering (same as RSRP)
            x_vals = [p.get('ms_x', 0) for p in heatmap_data]
            y_vals = [p.get('ms_y', 0) for p in heatmap_data]
            data_center_x = (min(x_vals) + max(x_vals)) / 2
            data_center_y = (min(y_vals) + max(y_vals)) / 2

            lat_per_meter = 1.0 / 111111.0
            lng_per_meter = 1.0 / (111111.0 * math.cos(math.radians(center_lat)))

            # Get rotation from position data (same as RSRP)
            rotation = position.get('rotation', [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1])
            cos_theta = rotation[0] if len(rotation) >= 1 else 1
            sin_theta = rotation[1] if len(rotation) >= 2 else 0

            result = []
            for point in heatmap_data:
                # Center the local coordinates around the data center
                ms_x = point.get('ms_x', 0) - data_center_x
                ms_y = point.get('ms_y', 0) - data_center_y

                # Apply rotation to centered local coordinates
                x_rotated = ms_x * cos_theta - ms_y * sin_theta
                y_rotated = ms_x * sin_theta + ms_y * cos_theta

                # Convert to GPS
                lat = center_lat + (y_rotated * lat_per_meter)
                lon = center_lng + (x_rotated * lng_per_meter)
                calc = point.get('throughput', point.get('calc', 0))
                result.append({'lat': lat, 'lon': lon, 'calc': calc})

            return make_response(jsonify(result), 200)

        except mysql.connector.Error as err:
            return make_response(jsonify({'message': f'Database error: {err}'}), 500)
        except Exception as e:
            return make_response(jsonify({'message': f'Error loading heatmap: {e}'}), 500)


class BrandsList(Resource):
    """GET /brands - Get all brands"""
    def get(self):
        conn = get_db_connection()
        try:
            cur = conn.cursor(dictionary=True)
            cur.execute('SELECT brand_id as id, brand_name as name, bandwidth, tx_power FROM brands')
            brands = cur.fetchall()
            cur.close()
        except mysql.connector.Error as err:
            return make_response(jsonify({'message': f'Database error: {err}'}), 500)

        return make_response(jsonify(brands), 200)
