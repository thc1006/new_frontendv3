from flask import request, jsonify, Blueprint
from flask_restful import Resource
from models.Evaluation import db, Evaluation
from models.Project import Project
from enums.HeatmapState import HeatmapState 
from controllers.minIO import get_json_data, upload_json_stream, bucket_exists
from utils.minIOName import MinIOName
import json

evaluation_bp = Blueprint('evaluation', __name__)

FAR_POINT = 100000     # 用來校正前端的 heatmap color bar 的虛擬點的位置

@evaluation_bp.route('/evaluations/reset-status', methods=['POST'])
def reset_evaluation_status():
    evaluation_id = request.json.get('evaluation_id')

    # Reset the evaluation status
    evaluation = Evaluation.query.get(evaluation_id)
    if not evaluation:
        return {'message': 'Evaluation not found'}, 404

    evaluation.rsrp_status = HeatmapState.WAITING
    evaluation.throughput_status = HeatmapState.WAITING
    evaluation.rsrp_dt_status = HeatmapState.WAITING
    evaluation.throughput_dt_status = HeatmapState.WAITING
    db.session.commit()

    return {'message': 'Evaluation status reset successfully'}

# get evaluations by project ID if exists
@evaluation_bp.route('/projects/<int:project_id>/evaluations', methods=['GET'])
def get_project_evaluations(project_id):
    project = Project.query.get(project_id)
    if not project:
        return {'message': 'Project not found'}, 404
    evaluations = project.evaluations
    return jsonify([e.to_dict() for e in evaluations])

# get evaluations rsrp and throughput by project ID if exists
@evaluation_bp.route('/evaluations/<int:evaluation_id>/rsrp', methods=['GET'])
def get_evaluations_rsrp(evaluation_id):
    evaluation = Evaluation.query.get(evaluation_id)
    if not evaluation and evaluation_id != 0:
        return {'message': 'Evaluation not found'}, 404
    rsrp_status = evaluation.rsrp_status
    if rsrp_status != HeatmapState.SUCCESS:
        return {'message': 'RSRP not ready'}, 400
    rsrp_data = get_json_data('rsrp', MinIOName.evaluation_rsrp_heatmap(evaluation_id))
    rsrp_data = json.loads(rsrp_data)
    return jsonify({
        "rsrp": rsrp_data
    })

@evaluation_bp.route('/evaluations/<int:evaluation_id>/throughput', methods=['GET'])
def get_evaluations_throughput(evaluation_id):
    evaluation = Evaluation.query.get(evaluation_id)
    if not evaluation and evaluation_id != 0:
        return {'message': 'Evaluation not found'}, 404
    throughput_status = evaluation.throughput_status
    if throughput_status != HeatmapState.SUCCESS:
        return {'message': 'Throughput not ready'}, 400
    throughput_data = get_json_data('throughput', MinIOName.evaluation_throughput_heatmap(evaluation_id))

    throughput_data = json.loads(throughput_data)
    throughput_data.append({
        "ue_x": FAR_POINT,
        "ue_y": FAR_POINT,
        "throughput_mbps": 0
    })

    return jsonify({
        "throughput": throughput_data
    })

@evaluation_bp.route('/evaluations/<int:evaluation_id>/rsrp_dt', methods=['GET'])
def get_evaluations_rsrp_dt(evaluation_id):
    evaluation = Evaluation.query.get(evaluation_id)
    if not evaluation and evaluation_id != 0:
        return {'message': 'Evaluation not found'}, 404
    rsrp_dt_status = evaluation.rsrp_dt_status
    if rsrp_dt_status != HeatmapState.SUCCESS:
        return {'message': 'rsrp-dt not ready'}, 400
    rsrp_dt_data = get_json_data('rsrp-dt', MinIOName.evaluation_rsrp_dt_heatmap(evaluation_id))
    return jsonify({
        "rsrp_dt": rsrp_dt_data
    })

@evaluation_bp.route('/evaluations/<int:evaluation_id>/throughput_dt', methods=['GET'])
def get_evaluations_throughput_dt(evaluation_id):
    evaluation = Evaluation.query.get(evaluation_id)
    if not evaluation and evaluation_id != 0:
        return {'message': 'Evaluation not found'}, 404
    throughput_dt_status = evaluation.throughput_dt_status
    if throughput_dt_status != HeatmapState.SUCCESS:
        return {'message': 'throughput-dt not ready'}, 400
    throughput_dt_data = get_json_data('throughput-dt', MinIOName.evaluation_throughput_dt_heatmap(evaluation_id))

    throughput_dt_data = json.loads(throughput_dt_data)
    min_thr = float('inf') if len(throughput_dt_data) > 0 else 50

    for t in throughput_dt_data:
        if t["DL_thu"] < min_thr:
            min_thr = t["DL_thu"]
        
    throughput_dt_data.append({
        "ms_x": FAR_POINT,
        "ms_y": FAR_POINT,
        "DL_thu": min_thr - 50
    })

    return jsonify({
        "throughput_dt": throughput_dt_data
    })

# evaluation heatmap update to minIO
@evaluation_bp.route('/evaluations/rsrp', methods=['POST'])
def update_evaluation_rsrp():
    data = request.get_json()
    heatmap = data.get('heatmap', None)
    evaluation_id = data.get('evaluation_id', 0)
    evaluation = Evaluation.query.get(evaluation_id)
    if not evaluation and evaluation_id != 0:
        return {'message': 'Evaluation not found'}, 404

    if not heatmap:
        return {'message': 'Invalid data'}, 400

    ue_start_or_end = data.get('ue_start_or_end', 0)
    rsrp_data = json.dumps(heatmap)
    minio_name = MinIOName.evaluation_rsrp_heatmap(evaluation_id, ue_start_or_end)

    # 先檢查 bucket 是否存在
    if not bucket_exists('rsrp'):
        return {'message': "Bucket 'rsrp' does not exist."}, 404

    if upload_json_stream('rsrp', minio_name, rsrp_data):
        if evaluation_id != 0:
            evaluation.rsrp_status = HeatmapState.SUCCESS
            db.session.commit()
        else:
            # If evaluation_id is 0, we assume it's a temporary evaluation
            return {'message': 'Temporary rsrp data uploaded successfully'}, 200

        return {'message': 'rsrp data uploaded successfully'}, 200
    else:
        return {'message': 'Failed to upload rsrp data'}, 500

@evaluation_bp.route('/evaluations/throughput', methods=['POST'])
def update_evaluation_throughput():
    data = request.get_json()
    evaluation_id = data.get('evaluation_id', 0)
    evaluation = Evaluation.query.get(evaluation_id)
    if not evaluation and evaluation_id != 0:
        return {'message': 'Evaluation not found'}, 404

    heatmap = data.get('heatmap', None)
    if not heatmap:
        return {'message': 'Invalid data'}, 400

    throughput_data = json.dumps(heatmap)
    ue_start_or_end = data.get('ue_start_or_end', 0)
    minio_name = MinIOName.evaluation_throughput_heatmap(evaluation_id, ue_start_or_end)

    # 先檢查 bucket 是否存在
    if not bucket_exists('throughput'):
        return {'message': "Bucket 'throughput' does not exist."}, 404

    if upload_json_stream('throughput', minio_name, throughput_data):
        if evaluation_id != 0:
            evaluation.throughput_status = HeatmapState.SUCCESS
            db.session.commit()
        else:
            # If evaluation_id is 0, we assume it's a temporary evaluation
            return {'message': 'Temporary throughput data uploaded successfully'}, 200
        return {'message': 'throughput data uploaded successfully'}, 200
    else:
        return {'message': 'Failed to upload throughput data'}, 500
    
@evaluation_bp.route('/evaluations/rsrp_dt', methods=['POST'])
def update_evaluation_rsrp_dt():
    data = request.get_json()
    # data = json.loads(data)
    evaluation_id = data.get('evaluation_id', 0)
    evaluation = Evaluation.query.get(evaluation_id)
    if not evaluation and evaluation_id != 0:
        return {'message': 'Evaluation not found'}, 404

    heatmap = data.get('heatmap', None)

    if not heatmap:
        return {'message': 'Invalid data'}, 400

    rsrp_dt_data = json.dumps(heatmap)
    minio_name = MinIOName.evaluation_rsrp_dt_heatmap(evaluation_id)

    # 先檢查 bucket 是否存在
    if not bucket_exists('rsrp-dt'):
        return {'message': "Bucket 'rsrp-dt' does not exist."}, 404

    if upload_json_stream('rsrp-dt', minio_name, rsrp_dt_data):
        if evaluation_id != 0:
            evaluation.rsrp_dt_status = HeatmapState.SUCCESS
            db.session.commit()
        else:
            # If evaluation_id is 0, we assume it's a temporary evaluation
            return {'message': 'Temporary rsrp_dt data uploaded successfully'}, 200
        return {'message': 'rsrp_dt data uploaded successfully'}, 200
    else:
        return {'message': 'Failed to upload rsrp_dt data'}, 500

@evaluation_bp.route('/evaluations/throughput_dt', methods=['POST'])
def update_evaluation_throughput_dt():
    data = request.get_json()
    
    evaluation_id = data.get('evaluation_id', 0)
    evaluation = Evaluation.query.get(evaluation_id)
    if not evaluation and evaluation_id != 0:
        return {'message': 'Evaluation not found'}, 404

    heatmap = data.get('heatmap', None)
    if not heatmap:
        return {'message': 'Invalid data'}, 400

    throughput_dt_data = json.dumps(heatmap)
    minio_name = MinIOName.evaluation_throughput_dt_heatmap(evaluation_id)

    # 先檢查 bucket 是否存在
    if not bucket_exists('throughput-dt'):
        return {'message': "Bucket 'throughput-dt' does not exist."}, 404

    if upload_json_stream('throughput-dt', minio_name, throughput_dt_data):
        if evaluation_id != 0:
            evaluation.throughput_dt_status = HeatmapState.SUCCESS
            db.session.commit()
        else:
            # If evaluation_id is 0, we assume it's a temporary evaluation
            return {'message': 'Temporary throughput_dt data uploaded successfully'}, 200
        return {'message': 'throughput_dt data uploaded successfully'}, 200
    else:
        return {'message': 'Failed to upload throughput_dt data'}, 500

# update status of heatmap and throughput
@evaluation_bp.route('/evaluations/<int:evaluation_id>/status/rsrp', methods=['PUT'])
def update_evaluation_rsrp_status(evaluation_id):
    evaluation = Evaluation.query.get(evaluation_id)
    if not evaluation:
        return jsonify({'message': 'Evaluation not found'}) , 404
    data = request.get_json()
    if 'status' not in data:
        return jsonify({'message': 'no status provided'}), 400
    status = data.get('status')

    if status not in [s.value for s in HeatmapState]:
        return jsonify({'message': 'Invalid status'}), 400
    
    evaluation.rsrp_status = HeatmapState(status)
    db.session.commit()

    return jsonify({'message': 'RSRP status updated successfully'}),200

@evaluation_bp.route('/evaluations/<int:evaluation_id>/status/throughput', methods=['PUT'])
def update_evaluation_throughput_status(evaluation_id):
    evaluation = Evaluation.query.get(evaluation_id)
    if not evaluation:
        return jsonify({'message': 'Evaluation not found'}),404
    data = request.get_json()
    if 'status' not in data:
        return jsonify({'message': 'no status provided'}),400
    status = data.get('status')
    if status not in [s.value for s in HeatmapState]:
        return jsonify({'message': 'Invalid status'}),400
    evaluation.throughput_status = HeatmapState(status)
    db.session.commit()
    return jsonify({'message': 'Throughput status updated successfully'}),200 

@evaluation_bp.route('/evaluations/<int:evaluation_id>/status/rsrp_dt', methods=['PUT'])
def update_evaluation_rsrp_dt_status(evaluation_id):
    evaluation = Evaluation.query.get(evaluation_id)
    if not evaluation:
        return jsonify({'message': 'Evaluation not found'}) , 404
    data = request.get_json()
    if 'status' not in data:
        return jsonify({'message': 'no status provided'}), 400
    status = data.get('status')

    if status not in [s.value for s in HeatmapState]:
        return jsonify({'message': 'Invalid status'}), 400
    
    evaluation.rsrp_dt_status = HeatmapState(status)
    db.session.commit()

    return jsonify({'message': 'rsrp_dt status updated successfully'}),200

@evaluation_bp.route('/evaluations/<int:evaluation_id>/status/throughputDT', methods=['PUT'])
def update_evaluation_throughputDT_status(evaluation_id):
    evaluation = Evaluation.query.get(evaluation_id)
    if not evaluation:
        return jsonify({'message': 'Evaluation not found'}),404
    data = request.get_json()
    if 'status' not in data:
        return jsonify({'message': 'no status provided'}),400
    status = data.get('status')
    if status not in [s.value for s in HeatmapState]:
        return jsonify({'message': 'Invalid status'}),400
    evaluation.throughputDT_status = HeatmapState(status)
    db.session.commit()
    return jsonify({'message': 'ThroughputDT status updated successfully'}),200

# for failed evaluations, reset status
@evaluation_bp.route('/evaluations/rsrp/failed', methods=['POST'])
def evaluation_rsrp_failed():
    data = request.get_json()
    evaluation_id = data.get('evaluation_id', 0)
    evaluation = Evaluation.query.get(evaluation_id)
    if not evaluation and evaluation_id != 0:
        return {'message': 'Evaluation not found'}, 404

    if evaluation_id == 0:
        return {'message': 'Cannot reset status for temporary evaluation'}, 400

    evaluation.rsrp_status = HeatmapState.FAILURE
    db.session.commit()
    return {'message': 'RSRP status reset to FAILURE'}, 200

@evaluation_bp.route('/evaluations/throughput/failed', methods=['POST'])
def evaluation_throughput_failed():
    data = request.get_json()
    evaluation_id = data.get('evaluation_id', 0)
    evaluation = Evaluation.query.get(evaluation_id)
    if not evaluation and evaluation_id != 0:
        return {'message': 'Evaluation not found'}, 404

    if evaluation_id == 0:
        return {'message': 'Cannot reset status for temporary evaluation'}, 400

    evaluation.throughput_status = HeatmapState.FAILURE
    db.session.commit()
    return {'message': 'Throughput status reset to FAILURE'}, 200

@evaluation_bp.route('/evaluations/rsrp_dt/failed', methods=['POST'])
def evaluation_rsrp_dt_failed():
    data = request.get_json()
    evaluation_id = data.get('evaluation_id', 0)
    evaluation = Evaluation.query.get(evaluation_id)
    if not evaluation and evaluation_id != 0:
        return {'message': 'Evaluation not found'}, 404

    if evaluation_id == 0:
        return {'message': 'Cannot reset status for temporary evaluation'}, 400

    evaluation.rsrp_dt_status = HeatmapState.FAILURE
    db.session.commit()
    return {'message': 'rsrp_dt status reset to FAILURE'}, 200

@evaluation_bp.route('/evaluations/throughput_dt/failed', methods=['POST'])
def evaluation_throughput_dt_failed():
    data = request.get_json()
    evaluation_id = data.get('evaluation_id', 0)
    evaluation = Evaluation.query.get(evaluation_id)
    if not evaluation and evaluation_id != 0:
        return {'message': 'Evaluation not found'}, 404

    if evaluation_id == 0:
        return {'message': 'Cannot reset status for temporary evaluation'}, 400

    evaluation.throughput_dt_status = HeatmapState.FAILURE
    db.session.commit()
    return {'message': 'ThroughputDT status reset to FAILURE'}, 200

@evaluation_bp.route('/evaluations/<int:evaluation_id>/discard', methods=['POST'])
def discard_evaluation(evaluation_id):
    evaluation = Evaluation.query.get(evaluation_id)
    if not evaluation:
        return {'message': 'Evaluation not found'}, 404

    # Set all statuses to DISCARDED
    evaluation.rsrp_status = HeatmapState.DISCARDED
    evaluation.throughput_status = HeatmapState.DISCARDED
    evaluation.rsrp_dt_status = HeatmapState.DISCARDED
    evaluation.throughput_dt_status = HeatmapState.DISCARDED

    db.session.commit()
    return {'message': 'Evaluation discarded successfully'}, 200

class EvaluationListAPI(Resource):
    def get(self):
        items = Evaluation.query.all()
        return jsonify([i.to_dict() for i in items])

    def post(self):
        data = request.get_json()
        item = Evaluation(
            project_id=data.get('project_id'),
            rsrp_status=data.get('rsrp_status', HeatmapState.IDLE),
            throughput_status=data.get('throughput_status', HeatmapState.IDLE),
            throughput_dt_status=data.get('throughput_dt_status', HeatmapState.IDLE),
            rsrp_dt_status=data.get('rsrp_dt_status', HeatmapState.IDLE)
        )
        db.session.add(item)
        db.session.commit()
        return jsonify(item.to_dict())


class EvaluationAPI(Resource):
    def get(self, evaluation_id):
        item = Evaluation.query.get(evaluation_id)
        if item:
            return jsonify(item.to_dict())
        else:
            return {'message': 'Evaluation not found'}, 404

    def put(self, evaluation_id):
        item = Evaluation.query.get(evaluation_id)
        if not item:
            return {'message': 'Evaluation not found'}, 404
        data = request.get_json()
        item.project_id = data.get('project_id', item.project_id)
        item.rsrp_status = data.get('rsrp_status', item.rsrp_status)
        item.throughput_status = data.get('throughput_status', item.throughput_status)
        item.throughput_dt_status = data.get('throughput_dt_status', item.throughput_dt_status)
        item.rsrp_dt_status = data.get('rsrp_dt_status', item.rsrp_dt_status)

        db.session.commit()
        return jsonify(item.to_dict())

    def delete(self, evaluation_id):
        item = Evaluation.query.get(evaluation_id)
        if not item:
            return {'message': 'Evaluation not found'}, 404
        db.session.delete(item)
        db.session.commit()
        return {'message': 'Evaluation deleted'}
