from flask import render_template, request, redirect, url_for, jsonify, flash, session, g
import requests
import time
import hashlib
import datetime
import json
# 以下兩個(util, init)是寫好的檔案
from util import generate_random_string, calculate_square_center, is_integer, is_float, safe_int, FrondendOptions_to_DatabaseRU, DatabaseRU_to_FrondendOptions
from init import app, SharedVar
from urllib3.util import Retry
from requests import Session
from requests.adapters import HTTPAdapter
import requests.exceptions

from influxdb import InfluxDBClient


ctrl_ip = SharedVar.ctrl_ip
ctrl_port = SharedVar.ctrl_port
wireless_insite_file = SharedVar.wireless_insite_file # 後面被註解掉了

retries = Retry(
        total=3,
        backoff_factor=0.1,
        status_forcelist=[500, 502, 503, 504],
        allowed_methods={'GET', 'POST', 'PUT', 'DELETE'},
    )

# 在每次 request 過後執行，即使處理有錯誤
@app.teardown_request # flask裝飾器
def teardown_request(error):
    print("teardown_request, error = ", error)


@app.route("/", methods=['GET', 'POST'])
def index():
    if request.method == 'GET':
        if 'username' in session:
            return redirect('/projects')
        return render_template('index.html')
    else:
        # 取得前端表單傳來的帳號密碼
        input_username = request.form.get('username') # 如果是post的話，使用者在表單填入資訊，先設兩個變數(名稱)
        input_password = request.form.get('password') # (密碼)
        response = requests.get(f'http://{ctrl_ip}:{ctrl_port}/User/Account/{input_username}') # 藉由requests函數對某個API發送GET請求，去撈資料
        # 撈出來的東西會有response.status_code, response.json() (response.text, response.header)等等，這邊會撈出某個使用者的資訊

        # check server started, maybe mysql automatically stop the connection
        if response.status_code == 500:
            flash("Internal server error, please login later")
            return render_template('index.html')

        response_data = response.json() # 某個使用者的資料，可能有
        # {
        #   "UID": 42,
        #   "username": "vicky",
        #   "password": "已加鹽的 SHA256 雜湊值",
        #   "salt": "隨機字串"
        # }


        # check user exist
        if response.status_code == 404:
            flash("Wrong username or password.")
            return render_template('index.html')

        # check password correct
        hash_object = hashlib.sha256()
        hash_object.update((input_password + response_data['salt']).encode())
        hashed_pwd = hash_object.hexdigest()

        if hashed_pwd != response_data['password']:
            flash("Wrong username or password.")
            return render_template('index.html')

        # login success
        # flash("Login Succeed.")
        session['username'] = request.form.get('username')
        session['UID'] = response_data['UID']
        print("session after login:")
        print(session)
        next = request.form.get('next')
        if next == None or not next[0] == '/':
            next = url_for('index')
        return redirect(next)  # should be redirect('projects')

@app.route('/logout', methods=['GET', 'POST'])
def logout():
    if request.method == 'GET' or 'username' not in session:
        flash("Please login First.")
    else:
        session.pop('username', None) # session是針對個人的，所以這邊就是把單一用戶的資料刪掉
        session.pop('UID', None)
        print("session after logout")
        print(session)
        # flash("Logout Succeed.")
    return redirect(url_for('index'))

@app.route("/register", methods=['GET', 'POST'])
def register():
    if request.method == 'GET':
        return render_template('register.html')

    elif request.method == 'POST':
        # Persistent connection and auto retry
        rs = Session() # 維持同一個http連線
        rs.mount('http://', HTTPAdapter(max_retries=retries))

        account = request.form.get('username')
        email = request.form.get('email')
        password = request.form.get('password')
        confirm_password = request.form.get('confirm_password')

        # Handle AJAX check for account existence
        if request.is_json:
            input_data = request.get_json()
            if input_data.get('type') == "get_account":
                account_value = input_data.get('value')
                response = rs.get(f'http://{ctrl_ip}:{ctrl_port}/User/Small_Account/{account_value}')
                if response.status_code == 200:
                    return jsonify({'exist': True}), 200
                else:
                    return jsonify({'exist': False}), 404

        # Handle AJAX check for email existence
        if request.is_json:
            input_data = request.get_json()
            if input_data.get('type') == "get_email":
                email_value = input_data.get('value')
                response = rs.get(f'http://{ctrl_ip}:{ctrl_port}/User/Small_Email/{email_value}')
                if response.status_code == 200:
                    return jsonify({'exist': True}), 200
                else:
                    return jsonify({'exist': False}), 404

        # # user already exist
        # response = rs.get(f'http://{ctrl_ip}:{ctrl_port}/User/Account/{account}') 
        # # 上面這行應該也是透過API連到server121，這邊是用rs(requests.Session()).get，和前面45行不一樣
        # if response.status_code != 404:
        #     flash("Account already exist.")
        #     return render_template('register.html')

        # # email already exist
        # response = rs.get(f'http://{ctrl_ip}:{ctrl_port}/User/Email/{email}')
        # if response.status_code != 404:
        #     flash("Email already exist.")
        #     return render_template('register.html')

        # wrong format
        if not email or '@' not in email:
            flash("Wrong email format.")
            return render_template('register.html')
        if password != confirm_password:
            flash("Passwords do not match.")
            return render_template('register.html')

        # create a new user
        salt = generate_random_string(10)
        hash_object = hashlib.sha256()
        hash_object.update((password + salt).encode())
        hashed_pwd = hash_object.hexdigest()
        data = {
            "account": account,
            "password": hashed_pwd,
            "email": email,
            "salt": salt
        }
        response = rs.post(f'http://{ctrl_ip}:{ctrl_port}/User', json=data) # create 一個 user，data(名字、hashed pswd、email...)，送進user.py裡面的post函數

        if response.status_code == 201:
            flash("Register succeed, please login again.")
            return render_template('index.html')
        else:
            flash("Server Wrong!!!!")
            return render_template('register.html')

@app.route("/create", methods=['GET', 'POST'])
def create():
    if 'username' not in session:
        flash("Please login First.")
        return redirect(url_for('index'))
    
    # Persistent connection and auto retry
    rs = Session()
    rs.mount('http://', HTTPAdapter(max_retries=retries))
    
    # suppose I will get 4 points, project name, image (3D)
    if request.method == 'GET':
        UID = session['UID']
        response = rs.get(f'http://{ctrl_ip}:{ctrl_port}/Map/UID/{UID}')
        if response.status_code == 200:
            maps_can_access = {}
            got_maps = response.json()
            # got_maps = [
            # {
            #     "MID": 1,
            #     "name": "tmp_map_name"
            # },
            # {
            #     "MID": 2,
            #     "name": "tmp_map_name"
            # }
            # ]

            # for map in got_maps:
            #     MID = map['MID']
            #     response = rs.get(f'http://{ctrl_ip}:{ctrl_port}/Map/MID/{MID}')
            #     maps_can_access[MID] = response.json()

            for map in got_maps:
                MID = map['MID']
                maps_can_access[MID] = map 
                # maps_can_access = {
                #   "1" : {"MID": 1,"name": "tmp_map_name"},
                #   "2" : {"MID": 2,"name": "tmp_map_name"},
                # }

        # user havn't upload any map yet
        else:
            maps_can_access = {}
            
        return render_template('create.html', maps_can_access = maps_can_access)
    
    elif request.method == 'POST':
        input_data = request.get_json()  # input_data看起來是一個dictionary
        req_type = input_data.get('type') 

        # Get single map data
        if req_type == 'get_map':
            MID = input_data.get('MID')
            response = rs.get(f'http://{ctrl_ip}:{ctrl_port}/Map/MID/{MID}')
            return response.json(), 200
        
        # Create new project
        else:
            project_name = input_data.get('project_name')
            map_exist = input_data.get('map_exist')         # 0: not exist yet
            image = input_data.get('image')                 # json string
            MID = input_data.get('MID')                     # 如果是舊地圖會拿到 null，會在下面創建完之後更新成他拿到的 MID
            image_name = input_data.get('image_name')       # 新舊地圖都會有
            position = input_data.get('position')

            # 1. create a project
            date = datetime.date.today()
            data = {
                "title": project_name,
                "date": str(date),
            }
            response = rs.post(f'http://{ctrl_ip}:{ctrl_port}/Project', json=data) # 到 server 121 新增一份地圖資料
            pid = response.json()['PID'] # create project 會有 PID

            # 2. map
            # new map
            if map_exist == 0:
                # use UID to create map
                data = {
                    "UID": session['UID'],
                    "image": image,
                    "name": image_name, 
                    "position": position
                }
                response = rs.post(f'http://{ctrl_ip}:{ctrl_port}/Map', json=data)
                MID = response.json()['MID']
            # existing map
            else:
                pass

            # 3. use PID, MID to create project map relation
            response = rs.post(f'http://{ctrl_ip}:{ctrl_port}/Project_Map/{pid}/{MID}')

                
            # 4. use PID and UID, create user project relation
            data = {
                "auth": "admin"
            }
            UID = session['UID']
            response = rs.post(f'http://{ctrl_ip}:{ctrl_port}/User_Project/{pid}/{UID}', json=data)


            if response.status_code == 201:
                flash("Project create succeed.")
                return jsonify(url_for('projects')), 201
            else:
                flash("Server Wrong!!!!")
                return render_template('create.html')

@app.route("/projects", methods=['GET','POST'])
def projects():
    if 'username' not in session:
        flash("Please login First.")
        return redirect(url_for('index'))
    if 'scenario' in session:
        session.pop('scenario', None)
        session.pop('scenario_option', None)
        session.pop('heatmap', None)
        session.pop('3Dmodel', None)
    if request.method == 'POST':
        # delete a project
        # Moved into edit page
        pass

    # Persistent connection and auto retry
    rs = Session()
    rs.mount('http://', HTTPAdapter(max_retries=retries))

    # get all the project that this user can access
    UID = session['UID']
    response = rs.get(f'http://{ctrl_ip}:{ctrl_port}/User_Project/User/{UID}')
    projects = response.json()
    projects_all_data = {}

    # if no project yet
    if response.status_code == 404:
        return render_template('projects.html', projects = {}, tmp_data = {})
    
    for key, values in projects.items():
        PID = key
        date = values['date']
        title = values['title']

        # get map & position
        # 卡，可能會回傳多個，但是我們目前只會顯示一張的 case
        # print("cur pid = ", PID)
        response = rs.get(f'http://{ctrl_ip}:{ctrl_port}/Map_Position/{PID}')
        try:
            model = response.json()[0]
        except IndexError as e:
            print(f'Could not get PID {PID}:', e)
        else:
            position = model['position']['coordinates']
            projects_all_data[PID] = {
                'PID': PID,
                'date': date,
                'title': title,
                'lat': position['lat'],
                'long': position['lng'],
            }
        
    return render_template('projects.html', projects = projects, tmp_data = projects_all_data)

@app.route("/overview/<PID>", methods=['GET', 'POST'])
def overview(PID):
    if 'username' not in session:
        flash("Please login First.")
        return redirect(url_for('index'))
    
    # Persistent connection and auto retry
    rs = Session()
    rs.mount('http://', HTTPAdapter(max_retries=retries))
    
    

    # check project exists
    response = requests.get(f'http://{ctrl_ip}:{ctrl_port}' + '/Project/' + str(int(PID)))
    if response.status_code == 404:
        print("No projects yet, PID = ", int(PID))
        flash("No projects yet")
        return redirect(url_for('projects'))
    project_name = response.json()['title']


    if request.method == 'POST':
        input_data = request.get_json()
        print(input_data)
        mytype = input_data['type']
        
        # get UE position every 1s
        if mytype == 'get_UE_position':
            
            # state: The true situation
            if 'scenario' not in session:
                # print("no scenario")
                return jsonify([]), 200

            # state : when scenario is 0, no UE will be show
            elif 'scenario' in session and session['scenario'] == 0:
                # print("set scenario none")
                return jsonify([]), 200
            
            # state: it is simulating (paused)  
            elif 'scenario' in session and session['scenario_option'] == '0':
                # print("get paused data")
                return jsonify(session['UE_position']), 200
            
            # state: getting real measurement values
            elif session['scenario'] == '111':
                response = rs.get(f'http://{ctrl_ip}:{ctrl_port}/Influx/wisdon-ue/live_wisdon_ue_ED8F_pega_{PID}/-1')

                if response.status_code == 200:
                    UEs = response.json()
                    current_timestamp = time.time()
                    UE_position = []
                    for i in range(0, len(UEs)):
                        # 2. x, y =-100 means UE leave the erea
                        if UEs[i]['Wisdon.UE.Geo.x'] != -100 and UEs[i]['Wisdon.UE.Geo.y'] != -100:
                            # 3. use timestamp to show only the data within 10 second
                            timestamp = UEs[i]['timestamp']
                            timestamp_in_seconds = timestamp / 1000
                            time_difference = current_timestamp - timestamp_in_seconds
                            # Temporarily removed time_difference for new UE testing
                            # if time_difference < 10:
                            UE_position.append({
                                'Ue-Id': UEs[i]['Ue-Id'],
                                'Wisdon.UE.Geo.x':  UEs[i]['Wisdon.UE.Geo.x'],
                                'Wisdon.UE.Geo.y':  UEs[i]['Wisdon.UE.Geo.y'],
                                'Wisdon.UE.serving.Pci': UEs[i]['Wisdon.UE.serving.Pci']
                            })
                    session['UE_position'] = UE_position
                else:
                    print('scenario response.status_code = ', response.status_code)

                return jsonify(UE_position), 200

            # state: simulaing (running)
            else:
                # print("session['scenario'] = ", session['scenario'])
                # 1. get the newest position of each UE
                response = rs.get(f'http://{ctrl_ip}:{ctrl_port}/Influx/wisdon-ue/wisdon-ue/-1')

                if response.status_code == 200:
                    UEs = response.json()
                    current_timestamp = time.time()
                    UE_position = []
                    for i in range(0, len(UEs)):
                        # 2. x, y =-100 means UE leave the erea
                        if UEs[i]['Wisdon.UE.Geo.x'] != -100 and UEs[i]['Wisdon.UE.Geo.y'] != -100:
                            # 3. use timestamp to show only the data within 10 second
                            timestamp = UEs[i]['timestamp']
                            timestamp_in_seconds = timestamp / 1000
                            time_difference = current_timestamp - timestamp_in_seconds
                            if time_difference < 10:
                                UE_position.append({
                                    'Ue-Id': UEs[i]['Ue-Id'],
                                    'Wisdon.UE.Geo.x':  UEs[i]['Wisdon.UE.Geo.x'],
                                    'Wisdon.UE.Geo.y':  UEs[i]['Wisdon.UE.Geo.y'],
                                    'Wisdon.UE.serving.Pci': UEs[i]['Wisdon.UE.serving.Pci']
                                })
                    session['UE_position'] = UE_position
                else:
                    print('scenario response.status_code = ', response.status_code)

                return jsonify(UE_position), 200
            
        # pause/restart the scenario
        elif mytype == 'scenario' and 'scenario' in session:
            option = input_data['option']
            response = rs.get(f'http://{ctrl_ip}:{ctrl_port}' + '/Simulator/'+ option + '/' + session['scenario'])
            if response.status_code != 200:
                print("scenario {} internal server error, response.status_code = {}".format(session['scenario'], response.status_code))
            else:
                print("pause/restart success")
                session['scenario_option'] = option
            return jsonify(), 200

        # choose a new scenario
        elif mytype == 'choose_scenario':
            print("in choose_scenario input_data['scenario'] = ", input_data['scenario'])
            scenario = input_data['scenario']
            option = input_data['option']     # 0 for pause, 1 for start
            if scenario == 0 or scenario == '0':
                print("++++++++ if")
                session['scenario'] = 0
                session['scenario_option'] = None
                print("choose_scenario = 0")
                print("session['scenario'] = ", session['scenario'])
            else:
                print("+++++++else")
                # For measurement, no need to check simulator
                if scenario == '111':
                    session['scenario'] = scenario
                    session['scenario_option'] = option
                    return jsonify(), 200
                response = rs.get(f'http://{ctrl_ip}:{ctrl_port}' + '/Simulator/' + option + '/'+ scenario)
                print("set simulation response code = ", response.status_code)
                if response.status_code != 200:
                    print("scenario {} internal server error, response.status_code = {}".format(scenario, response.status_code))
                else:
                    session['scenario'] = scenario
                    session['scenario_option'] = option
            return jsonify(), 200

        elif mytype == 'refresh_heatmap':
            # Update rsrp heatmap
            response = rs.get(f'http://{ctrl_ip}:{ctrl_port}/HeatmapUpdater/{PID}') # Heatmap ID
            if response.status_code != 200:
                print('Heatmap updater error')
            # Get rsrp heatmap
            response = rs.get(f'http://{ctrl_ip}:{ctrl_port}/Heatmap/{PID}') # Heatmap ID
            if response.status_code == 200:
                rsrp_heatmap = response.json()['data']
            else:
                print("overview.html heatmap get: ", response.status_code)

            # Update throughput heatmap
            try:
                response = rs.get(f'http://{ctrl_ip}:{ctrl_port}/RunThroughtput/{PID}') # Heatmap ID
                if response.status_code != 200:
                    print('Run throughput error')
            except requests.exceptions.RequestException as e:
                print('RunThroughtput: ', e)

            # Get throughput heatmap
            response = rs.get(f'http://{ctrl_ip}:{ctrl_port}/Throughtput/{PID}') # Map ID
            if response.status_code == 200:
                tp_heatmap = response.json()['data']
            else:
                print("overview.html heatmap get: ", response.status_code)
            return jsonify({'rsrp': rsrp_heatmap, 'throughput': tp_heatmap}), 200
        
        else:
            print("overview.html wrong post type: ", mytype)
            print("session = ", session.keys())
            return jsonify(''), 400
            

    # get model data，卡，暫時只取締一個 map
    response = rs.get(f'http://{ctrl_ip}:{ctrl_port}/Project_Map/{PID}', timeout=120)
    model = response.json()[0]

    # get all the RUs that belongs to this project
    response = rs.get(f'http://{ctrl_ip}:{ctrl_port}/RU/PID/{PID}')
    RUs = {}
    if response.status_code == 404:
        print("this project have no RU now!")
    else:
        for RUID, RU in response.json().items():
            RUs.update({
                RUID:{
                    "DUID": RU['DUID'],
                    "PID": RU['PID'],
                    "RUID": RU['RUID'],
                    "brand_ID": RU['brand_ID'],

                    "name": RU['name'],
                    "location_x": RU['location_x'],
                    "location_y": RU['location_y'],
                    "location_z": RU['location_z'],


                    "IP": RU['config']['IP'],
                    "ch": RU['config']['ch'],
                    "format": RU['config']['format'],
                    "mac_4g": RU['config']['mac_4g'],
                    "mac_5g": RU['config']['mac_5g'],
                    "power": RU['config']['power'],
                    "protocol": RU['config']['protocol'],
                    "state": RU['config']['state'],
                    "throughput": RU['config']['throughput'],

                }
            })

    
    cur_scenario = session.get('scenario', 0)

    return render_template('overview.html', PID = PID, project_name = project_name, model_data = model,
                           RUs = RUs, RU_number = len(RUs), UE_number = 0, cur_scenario = cur_scenario)

@app.route("/gNB_config/<PID>", methods=['GET', 'POST'])
def gNB_config(PID):
    if 'username' not in session:
        flash("Please login First.")
        return redirect(url_for('index'))

    # Persistent connection and auto retry
    rs = Session()
    rs.mount('http://', HTTPAdapter(max_retries=retries))
    
    # check project exists
    response = rs.get(f'http://{ctrl_ip}:{ctrl_port}' + '/Project/' + str(int(PID)))
    if response.status_code == 404:
        print("No projects yet, PID = ", int(PID))
        flash("No projects yet.")
        return redirect(url_for('projects'))

    if request.method == 'GET':
        # get CUs of this project
        CUs = {}
        response = rs.get(f'http://{ctrl_ip}:{ctrl_port}' + '/CU/' + str(PID))
        if response.status_code != 404:
            CUs = response.json()
        CU_number = len(CUs)

        # get DUs of this project
        DUs = {}
        response = rs.get(f'http://{ctrl_ip}:{ctrl_port}' + '/DU/PID/' + str(PID))
        if response.status_code != 404:
            DUs = response.json()
        DU_number = len(DUs)

        # get RUs of this project
        RUs = {}
        response = rs.get(f'http://{ctrl_ip}:{ctrl_port}' + '/RU/PID/' + str(PID))
        if response.status_code != 404:
            RUs = response.json()
        RU_number = len(RUs)
        for RUID, RU in RUs.items():
            RUs[RUID] = DatabaseRU_to_FrondendOptions(RU)
        

        # get model data，卡，暫時只取第一個
        response = rs.get(f'http://{ctrl_ip}:{ctrl_port}' + '/Project_Map/' + str(PID), timeout=120)
        model = response.json()[0]
        
        return render_template('gNB_config.html', PID = PID, RUs = RUs, DUs = DUs, CUs = CUs,
                            DU_number = DU_number, RU_number = RU_number, CU_number = CU_number,
                            model_data = model)

    elif request.method == 'POST':
        input_data = request.get_json()
        print("input_data = ", input_data)
        
        # 卡，這邊要跟 RIC 對接，才可以真的下指令去調整 Device 的 power on 跟 power Adjustment
        # for create a new node manually
        if input_data['operation'] == 'Create':
            if input_data['type'] == 'cu':
                options = input_data['options']
                data = {
                    "PID" : PID,
                    "name" : options['name']
                }
                response = rs.post(f'http://{ctrl_ip}:{ctrl_port}' + '/CU', json=data)

            elif input_data['type'] == 'du':
                options = input_data['options']
                data = {
                    "CUID": safe_int(options['CUID']),
                    "PID" : int(PID),
                    "name": str(options['name'])
                }
                response = rs.post(f'http://{ctrl_ip}:{ctrl_port}' + '/DU', json=data)

            elif input_data['type'] == 'ru':
                data = FrondendOptions_to_DatabaseRU(input_data, PID)
                response = rs.post(f'http://{ctrl_ip}:{ctrl_port}' + '/RU', json=data)

            if response.status_code == 201:
                print("Successfully created.\n")
                response_data = response.json()
                if input_data['type'] == 'ru':
                    print("create response_data = ", DatabaseRU_to_FrondendOptions(response_data))
                    return jsonify(DatabaseRU_to_FrondendOptions(response_data)), 201
                else:
                    print("create response_data = ", response_data)
                    return jsonify(response_data), 201

            else:
                print("create internal server error")

        # for update a exist node manually
        elif input_data['operation'] == 'Edit':
            if input_data['type'] == 'cu':
                options = input_data['options']
                CUID = int(input_data['deviceID'])
                data = {
                    "PID" : PID,
                    "name" : options['name'],
                }
                response = rs.put(f'http://{ctrl_ip}:{ctrl_port}' + '/CU/' + str(CUID), json=data)
            
            elif input_data['type'] == 'du':
                options = input_data['options']
                DUID = int(input_data['deviceID'])
                data = {
                    "CUID": int(options['CUID']),
                    "PID" : int(PID) ,
                    "name" : str(options['name'])
                }
                response = rs.put(f'http://{ctrl_ip}:{ctrl_port}' + '/DU/' + str(DUID), json=data)

            elif input_data['type'] == 'ru':
                data = FrondendOptions_to_DatabaseRU(input_data, PID)
                RUID = int(input_data['deviceID'])
                response = rs.put(f'http://{ctrl_ip}:{ctrl_port}' + '/RU/' + str(RUID), json=data)

            if response.status_code == 200:
                print("Successfully updated.\n")
                response_data = response.json()
                
                if input_data['type'] == 'ru':
                    print("update response_data = ", DatabaseRU_to_FrondendOptions(response_data))
                    return jsonify(DatabaseRU_to_FrondendOptions(response_data)), 200
                else:
                    print("update response_data = ", response_data)
                    return jsonify(response_data), 200

            else:
                print("update internal server error")
            
        elif input_data['operation'] == 'Delete':
            if input_data['type'] == 'cu':
                CUID = input_data['deviceID']
                response = rs.delete(f'http://{ctrl_ip}:{ctrl_port}' + '/CU/' + str(int(CUID)))
                if response.status_code == 404:
                    print('cu delete fail')
                    return jsonify(), 404
                elif response.status_code == 400:
                    response = rs.get(f'http://{ctrl_ip}:{ctrl_port}' + '/DU/CUID/' + str(int(CUID)))
                    print("other du are still connectted to this cu:", response.json())
                    return jsonify(), 400
                else:
                    return jsonify(), 200
            elif input_data['type'] == 'du':
                DUID = input_data['deviceID']
                response = rs.delete(f'http://{ctrl_ip}:{ctrl_port}' + '/DU/' + str(int(DUID)))
                if response.status_code == 404:
                    print('du delete fail')
                    return jsonify(), 404
                elif response.status_code == 400:
                    response = rs.get(f'http://{ctrl_ip}:{ctrl_port}' + '/RU/DUID/' + str(int(DUID)))
                    print("other ru are still connectted to this du:", response.json())
                    return jsonify(), 400
                else:
                    return jsonify(), 200
                
            elif input_data['type'] == 'ru':
                RUID = input_data['deviceID']
                response = rs.delete(f'http://{ctrl_ip}:{ctrl_port}' + '/RU/' + str(int(RUID)))

                if response.status_code == 404:
                    print('ru delete fail')
                    return jsonify(), 404
                else:
                    return jsonify(), 200

@app.route("/AI_config/<PID>", methods=['GET', 'POST'])
def AI_config(PID):
    if 'username' not in session:
        flash("Please login First.")
        return redirect(url_for('index'))
    
    # Persistent connection and auto retry
    rs = Session()
    rs.mount('http://', HTTPAdapter(max_retries=retries))
    
    # check project exists
    response = rs.get(f'http://{ctrl_ip}:{ctrl_port}/Project/{PID}')
    if response.status_code == 404:
        print("No projects yet, PID = ", int(PID))
        flash("No projects yet.")
        return redirect(url_for('projects'))

    # For demo uses, remove and use API to get models if not needed anymore
    AI_models = SharedVar.AI_models
    session['AI_models'] = AI_models

    # if request.method == 'GET':    
    #     AI_models = []
    #     response = rs.get(f'http://{ctrl_ip}:{ctrl_port}/Model/{PID}')
    #     if response.status_code != 404:
    #         models_data = response.json()  
    #         AI_models = [model['name'] for model in models_data]  
    #         # Update on page load, can be used within browser session
    #         session['AI_models'] = AI_models
    #     else:
    #         flash("Please create AI model.")

    if request.method == 'GET':
        # Get AI model option on/off
        response = rs.get(f'http://{ctrl_ip}:{ctrl_port}/Influx/inference_result/AI_config_{PID}/-1')

        try:
            data = response.json()[0] #default value
        except IndexError:
            # Initialize all switches to off
            initialize_data = \
                [
                    {
                        "fields": {},
                        "measurement": f"AI_config_{PID}",
                        "tags": {
                            "PID": PID
                        }
                    }
                ]
            for model in AI_models:
                initialize_data[0]["fields"][model] = False
            rs.post(f'http://{ctrl_ip}:{ctrl_port}/Influx/inference_result', data=json.dumps(initialize_data))
            response = rs.get(f'http://{ctrl_ip}:{ctrl_port}/Influx/inference_result/AI_config_{PID}/-1')
            data = response.json()[0]

        for config in response.json():
            if(config["PID"] == PID ): 
                data = config
                break

        last_AI_config = {}
        for AI_model in AI_models:
            if AI_model in data:
                last_AI_config[AI_model] = data[AI_model]
            else:
                last_AI_config[AI_model] = False            # default : closed
        
        session['last_AI_config'] = last_AI_config
        print("last_AI_config = ", last_AI_config)

        # response = rs.get('http://140.113.213.49:2980/web_fl_round_epoch/show_current')
        # training_Config = response.json()
        # response = rs.get('http://140.113.213.49:2980/web_fl_performance/show_latest?task=lvsd')
        # query_Model_Training_Performance = response.json()
        training_config = {}
        query_Model_Training_Performance = {}

        DUs = {}
        response = rs.get(f'http://{ctrl_ip}:{ctrl_port}' + '/DU/PID/' + str(PID))
        if response.status_code != 404:
            DUs = response.json()
        DU_number = len(DUs)

        wisdon_ue_data = {}
        response = rs.get(f'http://{ctrl_ip}:{ctrl_port}/Influx/wisdon-ue/wisdon-ue/-1')
        if response.status_code != 404:
            wisdon_ue_data = response.json()
        wisdon_ue_data_set = set()
        for record in wisdon_ue_data:
            wisdon_ue_data_set.update(record.keys())

        return render_template('AI_config.html', PID = PID, tmp_ai_data = AI_models, last_AI_config = last_AI_config, training_config = training_config, query_Model_Training_Performance = query_Model_Training_Performance, wisdon_ue_data_set = wisdon_ue_data_set)
    
    elif request.method == 'POST':
        input_data = request.get_json()
        type = input_data['type']
        try:
            AI_models = session['AI_models']
        except Exception as err:
            print('Error retrieving AI_models from session:', err)
        
        # get newest AI data
        if type == 'get_AI_advise':
            # NES
            response = rs.get(f'http://{ctrl_ip}:{ctrl_port}/Influx/inference_result/live_NES_suggestions_ED8F_pega_{PID}_for_web/-1')
            AI_data = []
            if response.status_code != 200:
                print("AI config internal server error")
                return jsonify(), 500
            else:
                AI_advise = response.json()
                for advise in AI_advise:
                    if advise.get('PID') == PID:
                        AI_data.append({
                            "AI_ID": advise.get('AI_ID'),
                            "PID": advise.get('PID'),
                            "results": json.loads(advise.get('results')),
                            "time": advise.get('time')
                        })
                        break

            # MRO
            response = rs.get(f'http://{ctrl_ip}:{ctrl_port}/Influx/inference_result/live_MRO_decisions_ED8F_pega_{PID}_for_web/-1')
            if response.status_code != 200:
                print("AI config internal server error")
                return jsonify(), 500
            else:
                AI_advise = response.json()
                for advise in AI_advise:
                    if advise.get('PID') == PID:
                        AI_data.append({
                            "AI_ID": advise.get('AI_ID'),
                            "PID": advise.get('PID'),
                            "results": json.loads(advise.get('results')),
                            "time": advise.get('time')
                        })
                        break

            # RanDT
            response = rs.get(f'http://{ctrl_ip}:{ctrl_port}/Influx/inference_result/live_RanDT_predictions_ED8F_pega_{PID}_for_web/-1')
            if response.status_code != 200:
                print("AI config internal server error")
                return jsonify(), 500
            else:
                AI_advise = response.json()
                for advise in AI_advise:
                    if advise.get('PID') == PID:
                        AI_data.append({
                            "AI_ID": advise.get('AI_ID'),
                            "PID": advise.get('PID'),
                            "results": json.loads(advise.get('results')),
                            "time": advise.get('time')
                        })
                        break

            return jsonify(AI_data), 200
        
        elif type == 'AI_switch':
            switch = input_data['switch'] # 0: off, 1: on
            target_model = input_data['model_name']
            last_AI_config = session['last_AI_config']
            fields = {AI_models[i]: last_AI_config[AI_models[i]] for i in range(len(AI_models))}
            fields[target_model] = bool(int(switch))
            data = [{
                "fields": fields,
                "measurement": f"AI_config_{PID}",
                "tags": {
                    "PID": PID
                }
            }]
            response = rs.post(f'http://{ctrl_ip}:{ctrl_port}/Influx/inference_result', data=json.dumps(data))
            # print("AI_switch response = ", response.status_code)

            return jsonify(), 200
        
        elif type == 'config':
            round = input_data['round']
            epoch = input_data['epoch']
            response = rs.post(f'http://140.113.213.49:2980/web_fl_round_epoch/push?round={round}&epoch={epoch}')
            if response.status_code != 200:
                print('Training Config Failed')
                return jsonify(response.json()), response.status_code
            else:
                return jsonify(response.json()), 200
            
        elif type == 'deployment':
            task = input_data['model']
            id = input_data['clientID']
            response = rs.post(f'http://140.113.213.49:2980/web_fl_model_deployment/push?task={task}&id={id}')
            if response.status_code != 200:
                print('Request Model Deployment Failed')
                return jsonify(response.json()), response.status_code
            else:
                return jsonify(response.json()), 200
            
        elif type == 'retrain':
            task = input_data['model']
            response = rs.post(f'http://140.113.213.49:2980/web_fl_retrain_request/push?task={task}')
            if response.status_code != 200:
                print('Request Model Retrain Failed')
                return jsonify(response.json()), response.status_code
            else:
                return jsonify(response.json()), 200
            
        elif type == 'apply':
            response = rs.get(f'http://{ctrl_ip}:{ctrl_port}/HeatmapUpdater/{PID}') # Heatmap ID
            if response.status_code != 200:
                print('Apply Heatmap Update Failed')
                return jsonify(response.json()), response.status_code
            else:
                return jsonify(response.json()), 200
            
        elif type == 'selected_parameters':
            model_name = input_data['model_name']
            selected_parameters = input_data['parameters']  # 用戶選擇的參數列表
            interference_period = input_data['interference_period']

            # 這裡假設我們需要創建一個新資料庫來儲存這些資料
            new_db_name = f"{model_name}_wisdon-ue"

            # 查詢原資料庫 "wisdon-ue" 的資料
            if not selected_parameters:
                raise ValueError("selected_parameters cannot be empty")

            selected_parameters = [str(param) for param in selected_parameters]
            # Call backend API with selected fields as query parameter
            fields_param = ','.join(selected_parameters)
            resp = rs.get(f'http://{ctrl_ip}:{ctrl_port}/Influx/wisdon-ue/wisdon-ue/-1', params={'fields': fields_param})

            if resp.status_code != 200:
                print(f"Error executing query: {resp.status_code}")
                return jsonify(), 500

            result = resp.json()
            if not result:
                print("No data returned for the query.")
                return jsonify(), 500

            selected_data = []
            for point in result:
                tags = point.get('tags', {})
                fields = {param: point.get(param) for param in selected_parameters}
                fields['interference_period'] = interference_period
                timestamp = point.get('time')
                selected_data.append({
                    "measurement": new_db_name,
                    "tags": tags,
                    "time": timestamp,
                    "fields": fields
                })

            # 清除新資料庫中的舊資料
            resp = rs.post(f'http://{ctrl_ip}:{ctrl_port}/Influx/{new_db_name}/drop_measurement/{new_db_name}')
            if resp.status_code != 200:
                print("Failed to drop measurement")
                return jsonify({"error": "Failed to drop measurement in the database."}), 500

            # 2. 呼叫後端 API 寫入新資料庫
            resp = rs.post(f'http://{ctrl_ip}:{ctrl_port}/Influx/{new_db_name}', json=selected_data)
            if resp.status_code != 201:
                print(f"Error writing to new database: {resp.status_code}")
                return jsonify(), 500

            return jsonify({"message": "Data successfully processed and written to the new database."}), 200

        elif type == 'create_model':
            model_name = input_data['model_name']
            
            if model_name not in AI_models:
                AI_models.append(model_name)
                print(f"Model '{model_name}' created successfully for project {PID}.")

                new_model_data = {
                    "name": model_name
                }
                response = rs.post(f'http://{ctrl_ip}:{ctrl_port}/Model/{PID}', json = new_model_data)

                    
                return jsonify(response.json()), 200
            else:
                return jsonify(response.json()), response.status_code
        elif type == 'delete_model':
            model_name = input_data['model_name']
            print(model_name)
            response = rs.delete(f'http://{ctrl_ip}:{ctrl_port}/Model/{PID}', json={"name": model_name})
            AI_models.remove(model_name)
            if response.status_code == 200:
                return jsonify(), 200
            else:
                print('model delete fail')
                return jsonify(), 404

        else:
            print("AI config wrong post type")
    
@app.route("/performanceNES/<PID>")
def performanceNES(PID): # Network Element Simulator
    if 'username' not in session:
        flash("Please login First.")
        return redirect(url_for('index'))
    
    # check project exists
    response = requests.get(f'http://{ctrl_ip}:{ctrl_port}' + '/Project/' + str(int(PID)))
    if response.status_code == 404:
        print("No projects yet, PID = ", int(PID))
        flash("No projects yet.")
        return redirect(url_for('projects'))

    return render_template('performanceNES.html', PID = PID)

@app.route("/performanceMRO/<PID>") # 最小化路測的無線優化 Minimization of Drive Tests Radio Radio Optimization
def performanceMRO(PID):
    if 'username' not in session:
        flash("Please login First.")
        return redirect(url_for('index'))
    
    # check project exists
    response = requests.get(f'http://{ctrl_ip}:{ctrl_port}' + '/Project/' + str(int(PID)))
    if response.status_code == 404:
        print("No projects yet, PID = ", int(PID))
        flash("No projects yet.")
        return redirect(url_for('projects'))

    return render_template('performanceMRO.html', PID = PID)

@app.route("/edit/<PID>", methods=['GET','POST'])
def edit(PID):
    if 'username' not in session:
        flash("Please login First.")
        return redirect(url_for('index'))
    
    # check project exists
    response = requests.get(f'http://{ctrl_ip}:{ctrl_port}' + '/Project/' + str(int(PID)))
    if response.status_code == 404:
        print("No projects yet, PID = ", int(PID))
        flash("No projects yet")
        return redirect(url_for('projects'))
    project_name = response.json()['title']

    if request.method == "POST":
        # 統一 request.content_type == 'application/json'，而不是 'application/x-www-form-urlencoded'
        input_data = request.get_json()
        type = input_data['type']
        
        # choose scenario
        if type == 'scenario':
            pass
            # scenario = input_data['scenario']
            # option = input_data['option']     # 0 for pause, 1 for start
            # if scenario == '0':
            #     print("didn't choose a scenario")
            # else:
            #     response = requests.get(f'http://{ctrl_ip}:{ctrl_port}' + '/Simulator/' + option + '/'+ scenario)
            #     if response.status_code != 200:
            #         print("scenario {} internal server error, response.status_code = {}".format(scenario, response.status_code))
            #     else:
            #         session['scenario'] = scenario
            #         session['scenario_option'] = option
            #         return jsonify()
        
        # set RU number & RU manufacturer
        # 卡，這邊要呼叫另一個 API，讓他去呼叫 simulator，得到她建議的 RU 數量跟位置
        # elif type == 'RU':
        #     RU_manufacturer = input_data['RU_manufacturer']
        #     RU_number = input_data['RU_number']
        #     print("RU_manufacturer = ", RU_manufacturer, ", RU_number = ", RU_number)

        #     # get map & position
        #     response = requests.get(f'http://{ctrl_ip}:{ctrl_port}' + '/Map/PID/' + str(PID))
        #     maps = response.json()
            
        #     # get all maps related this project, but use only first one temporary，卡
        #     for mid, map in maps.items():
        #         image_base64 = map['image']
        #         map_position = map['position']
        #         break
        #     center_x, center_y = calculate_square_center(map_position)
        #     response = requests.get(f'http://{ctrl_ip}:{ctrl_port}' + '/Script/' + wireless_insite_file + '?args=' + RU_manufacturer + '%20' 
        #                             + str(RU_number) + '%20' + str(center_x) + '%20' + str(center_y) + '%20' + str(PID))

        #     print("wireless_insite response.status_code = ", response.status_code)
        #     print("wireless_insite response = ", response.json())

        # edit project name
        elif type == 'ProjectName':
            ProjectName = input_data['ProjectName']
            data = {
                "date": str(datetime.date.today()),
                "title": ProjectName
            }
            response = requests.put(f'http://{ctrl_ip}:{ctrl_port}' + '/Project/' + str(PID), json=data)
            if response.status_code == 404:
                print("project not found")

        # delete a project
        elif type == 'ProjectDelete':
            project_id = input_data['PID']
            response = requests.delete(f'http://{ctrl_ip}:{ctrl_port}' + '/Project/' + str(project_id))
            if response.status_code == 404:
                print("project not found")
            else:
                return jsonify(), 200


    return render_template('edit.html', PID = PID, project_name = project_name)

@app.route("/evaluation/<PID>", methods=['GET','POST'])
def evaluation(PID):
    if 'username' not in session:
        flash("Please login First.")
        return redirect(url_for('index'))
    
    # Persistent connection and auto retry
    rs = Session()
    rs.mount('http://', HTTPAdapter(max_retries=retries))
    
    # check project exists
    response = rs.get(f'http://{ctrl_ip}:{ctrl_port}/Project/{PID}')
    if response.status_code == 404:
        print("No projects yet, PID = ", int(PID))
        flash("No projects yet.")
        return redirect(url_for('projects'))
    
    # get all simulation of this project
    response = rs.get(f'http://{ctrl_ip}:{ctrl_port}/RU_cache/{PID}')
    if response.status_code == 404:
        simulations = {}
    else:
        print("simulation response = ", response.status_code)
        simulations = response.json()
    # simulations 範例 = {
    #     1: {        
    #         'simulationID' : 1,
    #         'RU_manufacturer' : 'AAAA',
    #         'RU_positions' : {
    #             'position_x':1.1,
    #             'position_y': 1.0,
    #         },
    #         'heatmapID' : 1,
    #     },
    #     2: {        
    #         'simulationID' : 2,
    #         'RU_manufacturer' : 'BBBB',
    #         'RU_positions' : {
    #             'position_x':1.1,
    #             'position_y': 1.0,
    #         },
    #         'heatmapID' : 2,
    #     },
    # }
    # response = rs.post(f'http://{ctrl_ip}:{ctrl_port}' + '/RU_cache/' + str(PID), json=tmp_simulations)
    # response = rs.delete(f'http://{ctrl_ip}:{ctrl_port}' + '/RU_cache/'+str(PID))
    # print("delete status = ", response.status_code)
    if request.method == "POST":
        input_data = request.get_json()
        print('input data = ',input_data)
        mytype = input_data['type']
        
        # simulate one RU configration to generate heatmap
        if mytype == 'simulate':                
            if input_data['simulationID'] == 0 or input_data['simulationID'] == '0':
                print("a new simulation")
                # call API to generate heatmap，卡，之後要改成呼叫一個 executor 來產生，現在是直接拿現成的數據
                # if len(simulations) % 2 == 0:
                #     response = rs.get(f'http://{ctrl_ip}:{ctrl_port}' + '/Heatmap/2')
                #     heatmapID = 2
                # else:
                #     response = rs.get(f'http://{ctrl_ip}:{ctrl_port}' + '/Heatmap/1')
                #     heatmapID = 1
                response = rs.get(f'http://{ctrl_ip}:{ctrl_port}/Heatmap/{PID}')
                heatmapID = PID

                print("heatmap generating.......")
                heatmap = response.json()['data']
                print("heatmap generated!!!")
                # Check new ID eligibility
                newID = 1
                while (True) :
                    if str(newID) in simulations:
                        newID += 1
                    else:
                        break
                # save this simulation to DB
                simulations[newID] = {
                    'simulationID' : newID,
                    'RU_manufacturer' : input_data['RU_manufacturer'],
                    'RU_positions' : input_data['RU_positions'],        # a list of RU position {'location_x': 000, 'location_y': 111 }
                    'heatmapID' : heatmapID,
                }
                response = rs.post(f'http://{ctrl_ip}:{ctrl_port}/RU_cache/{PID}', json=simulations)
                if response.status_code !=200 and response.status_code != 201:
                    print("store simulate data wrong")

                return jsonify({'heatmap': heatmap, 'simulationID': newID}), 200
            else:
                print("an existing evaluation")
                # call API to generate heatmap，卡，之後要改成呼叫一個 executor 來產生，現在是直接拿現成的數據
                # if simulations[input_data['simulationID']]['heatmapID'] == 1:
                #     response = rs.get(f'http://{ctrl_ip}:{ctrl_port}' + '/Heatmap/2')
                #     heatmapID = 2
                # else:
                #     response = rs.get(f'http://{ctrl_ip}:{ctrl_port}' + '/Heatmap/1')
                #     heatmapID = 1
                response = rs.get(f'http://{ctrl_ip}:{ctrl_port}/Heatmap/{PID}')
                heatmapID = PID

                print("heatmap generating.......")
                heatmap = response.json()['data']
                print("heatmap generated!!!")

                simulations[input_data['simulationID']] = {
                    'simulationID' : input_data['simulationID'],
                    'RU_manufacturer' : input_data['RU_manufacturer'],
                    'RU_positions' : input_data['RU_positions'],        # a list of RU position {'location_x': 000, 'location_y': 111 }
                    'heatmapID' : heatmapID,
                }
                response = rs.post(f'http://{ctrl_ip}:{ctrl_port}/RU_cache/{PID}', json=simulations)
                if response.status_code !=200 and response.status_code != 201:
                    print('store simulate data wrong')
                    return jsonify(), 500

                return jsonify({'heatmap': heatmap, 'simulationID':input_data['simulationID']}), 200
            
        # delete a case
        elif mytype == 'delete':
            simulationID = input_data['simulationID']
            del simulations[simulationID]
            response = rs.post(f'http://{ctrl_ip}:{ctrl_port}/RU_cache/{PID}', json=simulations)

            if response.status_code !=200 and response.status_code != 201:
                    print("store simulate data wrong")
                    return jsonify(), 500

            return jsonify(), 200
            
        # choose one case to replace config
        elif mytype == 'save':
            simulationID = input_data['simulationID']
            
            # delete old RUs
            response = rs.get(f'http://{ctrl_ip}:{ctrl_port}/RU/PID/{PID}')
            if response.status_code == 200:
                for RUID, RU in response.json().items():
                    response = rs.delete(f'http://{ctrl_ip}:{ctrl_port}/RU/{RUID}')

            # create RU for this project
            RU_manufacturer = simulations[simulationID]['RU_manufacturer']
            response = rs.get(f'http://{ctrl_ip}:{ctrl_port}/Brand/brand_name/{RU_manufacturer}')
            print('simulation create RU response.json = ',response.json())
            brand_config = response.json()['config']
            i = 0
            for position in simulations[simulationID]['RU_positions']:
                data = brand_config
                data['name'] = str(i)
                i += 1
                data['PID'] = int(PID)
                data['location_x'] = position['location_x']
                data['location_y'] = position['location_y']
                data['location_z'] = 0

                response = rs.post(f'http://{ctrl_ip}:{ctrl_port}/RU', json = data)
                if response.status_code != 201:
                    print("create default RU wrong")
            
                
        
            # delete from tmp simulate
            # response = rs.delete(f'http://{ctrl_ip}:{ctrl_port}' + '/RU_cache/'+str(PID))
            # print("choose the simulation ", simulationID, ", delete other simulations: ", response.status_code)
            return jsonify(), 200

        # set RU number & RU manufacturer
        elif mytype == 'RU':
            # 卡，這邊要呼叫另一個 API，讓他去呼叫 simulator，得到她建議的 RU 數量跟位置 
            pass 

    # get model data，卡，暫時只取第一個
    response = rs.get(f'http://{ctrl_ip}:{ctrl_port}/Project_Map/{PID}', timeout=120)
    model = response.json()[0]

    # get heatmap of every simulation 
    simulations_with_heatmap = {}
    if response.status_code == 200:
        for key, value in simulations.items():
            heatmapID = value['heatmapID']
            response = rs.get(f'http://{ctrl_ip}:{ctrl_port}/Heatmap/{heatmapID}')
            # print(response.json())
            heatmap = response.json()['data']
            simulations_with_heatmap[key] = {
                'simulationID' : value['simulationID'],
                'RU_manufacturer' : value['RU_manufacturer'],
                'RU_positions' : value['RU_positions'],
                'heatmap' : heatmap
            }

        
    return render_template('evaluation.html', PID = PID, simulations = simulations_with_heatmap, model_data = model)

@app.route("/tutorial")
def tutorial():
    return render_template('tutorial.html')




if __name__ == '__main__':
    app.run(host='0.0.0.0', port=2880, threaded=True, debug=True, use_reloader=True)
