# from flask import make_response, request, jsonify
# from flask_restful import Resource
import json, os

# from config import conn

# class Test(Resource):
#     def post(self):
#         data = request.get_json(force = True) 
#         image_data = data.get('image')
#         image_path = './img/10.json'
#         with open(image_path, 'w') as image_file:
#             json.dump(image_data, image_file, indent = 4)
#         response = make_response(jsonify(''), 201)
#         return response

#     def get(self):
#         image_path = './img/1.json'
#         with open(image_path, 'r') as image_file:
#             image = json.load(image_file)
#         response = make_response(jsonify(image), 200)
#         return response        

with open('./heatmap/1.json', 'r') as heatmap_file:
    heatmap = json.load(heatmap_file)

data = {
    'MID' : 1,
    'data' : heatmap
}

result = requests.post(url = 'http://192.168.1.110:5900/api/data', json = data)
print(result.status_code)