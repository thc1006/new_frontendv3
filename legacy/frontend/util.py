import random
import string
import requests
from init import SharedVar

ctrl_ip = SharedVar.ctrl_ip
ctrl_port = SharedVar.ctrl_port


def generate_random_string(length):
    letters = string.ascii_letters + string.digits + string.punctuation
    return ''.join(random.choice(letters) for _ in range(length))

def calculate_square_center(position):
    # position =  {
    #     'left_up_lat': 23.780643236702858,  緯度
    #     'left_up_long': 120.55447121377756, 精度
    #     'right_up_lat': 23.780643236702858, 
    #     'left_down_lat': 23.76853186797514, 
    #     'right_up_long': 120.57121257491964, 
    #     'left_down_long': 120.55446144348709, 
    #     'right_down_lat': 23.76853186797514, 
    #     'right_down_long': 120.57127357397542}
    center_y = (position['left_up_lat'] + position['right_up_lat'] + position['left_down_lat'] + position['right_down_lat'])/4
    center_x = (position['left_up_long'] + position['right_up_long'] + position['left_down_long'] + position['right_down_long'])/4
    # center_x = (x1 + x2 + x3 + x4) / 4
    # center_y = (y1 + y2 + y3 + y4) / 4
    return center_x, center_y

def is_integer(s):
    try:
        int(s)
        return True
    except ValueError:
        return False

def is_float(s):
    try:
        float(s)
        return True
    except ValueError:
        return False
def safe_int(value):
    try:
        return int(value)
    except ValueError:
        return None


# these two function are doing format change (ex "state" <-> "simulate", "power_on") for a single RU
def FrondendOptions_to_DatabaseRU(input_data, PID):
    options = input_data['options']
    if int(options['power_on']) == 1 and int(options['simulate']) == 1:
        state = 3
    elif int(options['power_on']) == 1 and int(options['simulate']) == 0:
        state = 2
    elif int(options['power_on']) == 0 and int(options['simulate']) == 1:
        state = 1
    else:
        state = 0
    response = requests.get('http://' + ctrl_ip + ':' + ctrl_port + '/Brand/brand_name/' + str(options['brand_name']))
    response_data = response.json()
    brand_ID = response_data['brand_ID']
    
    if input_data['operation'] == 'Create':
        data = {
            "DUID": safe_int(options['DUID']),      # RU 創建時 DUID 可為空
            "PID": int(PID),
            "location_x": float(options['location_x']),
            "location_y": float(options['location_y']),
            "location_z": float(options['location_z']),
            "name" : str(options['name']),
            "brand_ID" : brand_ID,


            "IP": str(options['IP']),
            "state": state,
            "power": int(options['power']),
            "mac_4g": str(options['mac_4g']),
            "mac_5g": str(options['mac_5g']),
            "ch": int(options['ch']),
            "protocol": str(options['protocol']),
            "format": float(options['format']),
            "throughput": float(options['throughput']),
        }
    else:
        data = {
            "DUID": safe_int(options['DUID']),
            "RUID" : int(input_data['deviceID']),
            "PID": int(PID),
            "location_x": float(options['location_x']),
            "location_y": float(options['location_y']),
            "location_z": float(options['location_z']),
            "name" : str(options['name']),
            "brand_ID" : brand_ID,

            "IP": str(options['IP']),
            "state": state,
            "power": int(options['power']),
            "mac_4g": str(options['mac_4g']),
            "mac_5g": str(options['mac_5g']),
            "ch": int(options['ch']),
            "protocol": str(options['protocol']),
            "format": float(options['format']),
            "throughput": float(options['throughput']),
        }
    return data

def DatabaseRU_to_FrondendOptions(RU):
    state = RU['config']['state']
    if int(state) == 3:
        power_on = 1
        simulate = 1
    elif int(state) == 2:
        power_on = 1
        simulate = 0
    elif int(state) == 1:
        power_on = 0
        simulate = 1
    elif int(state) == 0:
        power_on = 0
        simulate = 0
    else:
        print("wrong RU case")
        power_on = 0
        simulate = 1


    RU['brand_ID'] = 1
    response = requests.get('http://' + ctrl_ip + ':' + ctrl_port + '/Brand/brand_ID/' + str(RU['brand_ID']))
    response_data = response.json()
    brand_name = response_data['brand_name']
    
    options = {
        "DUID": RU['DUID'],
        "PID": RU['PID'],
        "RUID": RU['RUID'],
        "brand_ID": RU['brand_ID'],
        "brand_name" :brand_name,

        "name": RU['name'],
        "location_x": RU['location_x'],
        "location_y": RU['location_y'],
        "location_z": RU['location_z'],


        "IP": str(RU['config']['IP']),
        "power_on": power_on,
        "simulate" : simulate,

        "ch": RU['config']['ch'],
        "format": RU['config']['format'],
        "mac_4g": RU['config']['mac_4g'],
        "mac_5g": RU['config']['mac_5g'],
        "power": RU['config']['power'],
        "protocol": RU['config']['protocol'],
        "state": RU['config']['state'],
        "throughput": RU['config']['throughput'],

    }

    return options

    
