from flask import request, jsonify, Blueprint
from tasks.tasks import example_add

example_bp = Blueprint('example_bp',__name__)
@example_bp.route('/example',methods=['POST'])
def example():
    data = request.get_json()
    x = data.get('x',1)
    y = data.get('y',1)
    if type(x) is not int or type(y) is not int:
        return jsonify({"message":"x and y should be int"},400)
    task = example_add.apply_async((x,y),countdown=20)
    return jsonify({"task.id": task.id },202)

@example_bp.route('/example',methods=['GET'])
def get_result():
    data = request.get_json()
    task_id = data.get("task_id")
    from queues import exe_queue
    result = exe_queue.AsyncResult(task_id)
    return jsonify({
            "state":result.state,
            "result":result.result if result.ready() else "None"
        },200)
