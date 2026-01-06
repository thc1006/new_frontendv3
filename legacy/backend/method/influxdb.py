from config import InfluxClient, influx_connect
from flask import request, make_response, jsonify 
from flask_restful import Resource
from influxdb import exceptions

class InfluxDB(Resource):
    def get(self, database, measurement, time):
        if database == 'wisdon-ue':
            client = InfluxClient.wisdon_ue_client
        elif database == 'wisdon-cell':
            client = InfluxClient.wisdon_cell_client
        elif database == 'viavi-ue':
            client = InfluxClient.viavi_ue_client
        elif database == 'viavi-cell':
            client = InfluxClient.viavi_cell_client
        elif database == 'inference_result':
            client = InfluxClient.inference_result_client
        else:
            # 動態連線到任意 InfluxDB 資料庫
            try:
                client = influx_connect(database)
            except Exception as e:
                response = make_response(jsonify({'error': str(e)}), 404)
                return response

        # 取得前端傳來的 fields 參數
        fields = request.args.get('fields')
        field_str = format_fields(fields)

        if str(time) == '-1':
            # 新增: 若有 fields 參數則用 field_str，否則維持原本格式
            if fields:
                query = f'SELECT {field_str} FROM "{measurement}" LIMIT 10'
            else:
                if measurement == 'AI_config':
                    query = 'SELECT "PID", * FROM "' + str(measurement) + '" GROUP BY "PID" ORDER BY time DESC LIMIT 1'
                elif measurement == 'NES':
                    query = 'SELECT "PID", * FROM "' + str(measurement) + '" GROUP BY "PID" ORDER BY time DESC LIMIT 1'
                else:
                    query = 'SELECT "Ue-Id", * FROM "' + str(measurement) + '" GROUP BY "Ue-Id" ORDER BY time DESC LIMIT 1'
        else:
            query = f'SELECT {field_str} FROM "{measurement}" WHERE time >= now() - {time}s'
        try:
            result = client.query(query)
            points = list(result.get_points())
            response = make_response(jsonify(points), 200)
        except Exception as e:
            response = make_response(jsonify({'error': str(e)}), 500)
        return response

    def post(self, database):
        if database == 'wisdon-ue':
            client = InfluxClient.wisdon_ue_client
        elif database == 'wisdon-cell':
            client = InfluxClient.wisdon_cell_client
        elif database == 'viavi-ue':
            client = InfluxClient.viavi_ue_client
        elif database == 'viavi-cell':
            client = InfluxClient.viavi_cell_client
        elif database == 'inference_result':
            client = InfluxClient.inference_result_client
        else:
            # 動態連線與建立資料庫
            try:
                client = influx_connect(database)
                # 嘗試建立資料庫（若已存在會忽略）
                client.create_database(database)
            except Exception as e:
                response = make_response(jsonify({'error': str(e)}), 404)
                return response

        data = request.get_json(force=True)
        try:
            client.write_points(data)
            response = make_response(jsonify({'message': 'Write success'}), 201)
        except Exception as e:
            response = make_response(jsonify({'error': str(e)}), 500)
        return response

class InfluxDropMeasurement(Resource):
    def post(self, database, measurement):
        try:
            client = influx_connect(database)
            client.query(f'DROP MEASUREMENT "{measurement}"')
            return make_response(jsonify({'message': f'Measurement {measurement} dropped.'}), 200)
        except Exception as e:
            return make_response(jsonify({'error': str(e)}), 500)