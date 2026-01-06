const TYPES = { CU: 'cu', DU: 'du', RU: 'ru' };
const CREATE_BTN_ID = ['btnCrtCU', 'btnCrtDU', 'btnCrtRU'];
// FIFO for every type change, collapse all but show corresponding options
var selectedType = '';
var btnSave = document.getElementById('btnSave');
var showOptions = false;
var curID; // Current device ID
var selectedName = document.getElementById('currentDevice');

// 檢查 CU, DU, RU 的名稱是否重複
function isNameExists(name, type, excludeId = null) {
    let devices;
    switch(type) {
        case TYPES.CU:
            devices = CUs;
            break;
        case TYPES.DU:
            devices = DUs;
            break;
        case TYPES.RU:
            devices = RUs;
            break;
        default:
            return false;
    }
    
    for (let key in devices) {
        if (excludeId && key === excludeId) {
            continue;
        }
        if (devices[key].name === name) {
            return true;
        }
    }
    return false;
}

selectedName.addEventListener('deviceSelect', (e) => {
    if(!showOptions){
        btnSave.classList.remove('collapse');
        showOptions = true;
        document.getElementById('btnDlt').classList.remove('collapse');
    }
    selectedName.textContent = e.detail.name; // Change selection text
    // Reset values
    if(CREATE_BTN_ID.includes(e.detail.id)){
        document.getElementById('power_on').checked = false;
        document.getElementById('power').value = 24;
        document.getElementById('CUID').value = 1;
        document.getElementById('DUID').value = 1;
        document.getElementById('IP').value = "0";
        const center = modelData.position.coordinates;
        document.getElementById('location_x').value = center.lng;
        document.getElementById('location_y').value = center.lat;
        document.getElementById('location_z').value = "0";
        document.getElementById('mac_4g').value = "0";
        document.getElementById('simulate').value = "1";
        document.getElementById('mac_5g').value = "0";
        document.getElementById('ch').value = "0";
        document.getElementById('protocol').value = "0";
        document.getElementById('format').value = "0";
        document.getElementById('throughput').value = "0";
        document.getElementById('name').value = "0";
        document.getElementById('brand_name').value = "WiSDON";
    }
    let allOptions = document.getElementsByClassName('deviceOption');
    for(const node of allOptions){
        node.classList.add('collapse'); // Hide all options
    }
    // Show options and set values
    let options;
    let optionData;
    if(e.detail.type == TYPES.CU){
        options = document.getElementsByClassName('cuOpt');
        optionData = CUs[e.detail.id];
    }else if(e.detail.type == TYPES.DU){
        options = document.getElementsByClassName('duOpt');
        optionData = DUs[e.detail.id];
    }else if(e.detail.type == TYPES.RU){
        options = document.getElementsByClassName('ruOpt');
        optionData = RUs[e.detail.id];
    }
    for(const node of options){
        node.classList.remove('collapse');
        if(CREATE_BTN_ID.includes(e.detail.id)){
            continue; // If creating new node
        }
        // Get value from data
        let input = node.querySelector('input, select');
        if(input){
            if(input.type == 'checkbox'){
                input.checked = optionData[input.id];
            }else{
                input.value = optionData[input.id];
            }
        }
    }
    if(selectedType == TYPES.RU){
        slider.dispatchEvent(new Event('input')); // Update slider
    }
    ruMarker.setLngLat([location_x.value, location_y.value]); // Change current RU marker position
    selectedType = e.detail.type; // Set selectedType
});

var collection = document.getElementsByClassName('list-group-item list-group-item-action');
for(let elem of collection){
    elem.addEventListener('click', () => {
        let parent = elem.parentNode;
        let type = '';
        if(parent.id == 'cuList'){
            type = TYPES.CU;
        }else if(parent.id == 'duList'){
            type = TYPES.DU;
        }else if(parent.id == 'ruList'){
            type = TYPES.RU;
        }
        let name = elem.textContent;
        let id = elem.id;
        curID = elem.id;
        const event = new CustomEvent('deviceSelect', {
            detail: { 'name': name, 'id': id, 'type': type }
        });
        selectedName.dispatchEvent(event);
    });
}

Array.from(document.getElementsByClassName('btnCrt')).forEach(element => {
    element.addEventListener('click', function(){
        btnSave.textContent = 'Create';
        btnSave.classList.add('crtSv');
        document.getElementById('btnDlt').classList.add('collapse');
    });
});

Array.from(document.getElementsByClassName('btnDvc')).forEach(element => {
    element.addEventListener('click', function(){
        btnSave.textContent = 'Save';
        btnSave.classList.remove('crtSv');
        document.getElementById('btnDlt').classList.remove('collapse');
    });
});

// For save and create a device
btnSave.addEventListener('click', function(){
    let data = {};
    if(btnSave.textContent == 'Save'){
        data.operation = 'Edit';
        data.deviceID = curID;
    }else{
        data.operation = 'Create';
    }
    let options;
    if(selectedType == TYPES.CU){
        data.type = TYPES.CU;
        options = document.getElementsByClassName('cuOpt');
    }else if(selectedType == TYPES.DU){
        data.type = TYPES.DU;
        options = document.getElementsByClassName('duOpt');
    }else if(selectedType == TYPES.RU){
        data.type = TYPES.RU;
        options = document.getElementsByClassName('ruOpt');
    }
    data.options = {};
    for(let option of options){
        let input = option.querySelector('input, select');
        if(input){
            if(input.type == 'checkbox'){
                data.options[input.id] = input.checked;
            }else{
                data.options[input.id] = input.value;
            }
        }
    }

    const deviceName = data.options.name;
    if (!deviceName || deviceName.trim() === "" || deviceName === "0") {
        alert('請輸入有效的設備名稱！');
        return;
    }
    
    // 根據操作類型檢查名稱重複
    let excludeId = null;
    if (data.operation === 'Edit') {
        excludeId = data.deviceID;
    }
    
    if (isNameExists(deviceName, selectedType, excludeId)) {
        let typeText = '';
        switch(selectedType) {
            case TYPES.CU:
                typeText = 'CU';
                break;
            case TYPES.DU:
                typeText = 'DU';
                break;
            case TYPES.RU:
                typeText = 'RU';
                break;
        }
        alert(`${typeText} 名稱「${deviceName}」已存在，請使用不同的名稱！`);
        return;
    }
    $.ajax({
        URL: window.location.href,
        data: JSON.stringify(data),
        type: 'POST',
        dataType: 'json',
        contentType:'application/json; charset=UTF-8',
        success: function(response){
            if(btnSave.textContent == 'Create'){
                if(response.RUID){
                    RUs[response.RUID] = {
                        'DUID': response.DUID,
                        'IP': response.IP,
                        'PID': response.PID,
                        'RUID': response.RUID,
                        'ch': response.ch,
                        'format': response.format,
                        'location_x': response.location_x,
                        'location_y': response.location_y,
                        'location_z': response.location_z,
                        'mac_4g': response.mac_4g,
                        'mac_5g': response.mac_5g,
                        'name': response.name,
                        'power': response.power,
                        'protocol': response.protocol,
                        'simulate': response.simulate,
                        'throughput': response.throughput,
                        'brand_name': response.brand_name,
                        'power_on': response.power_on
                    };
                    var ruButton = createButton(response.RUID, response.name);
                    appendButtonToContainer(ruButton, 'ruList', 'btnCrtRU');
                }else if(response.DUID){
                    DUs[response.DUID] = {
                        'CUID': response.CUID,
                        'DUID': response.DUID,
                        'PID': response.PID,
                        'name': response.name
                    };
                    var duButton = createButton(response.DUID, response.name);
                    appendButtonToContainer(duButton, 'duList', 'btnCrtDU');
                    var option = document.createElement('option');
                    option.value = response.DUID;
                    option.textContent = response.name;
                    document.getElementById('DUID').appendChild(option);
                }else if(response.CUID){
                    CUs[response.CUID] = {
                        'CUID': response.CUID,
                        'PID': response.PID,
                        'name': response.name
                    };
                    var cuButton = createButton(response.CUID, response.name);
                    appendButtonToContainer(cuButton, 'cuList', 'btnCrtCU');
                    var option = document.createElement('option');
                    option.value = response.CUID;
                    option.textContent = response.name;
                    document.getElementById('CUID').appendChild(option);
                }
            }else if(btnSave.textContent == 'Save'){
                if(response.RUID){
                    RUs[response.RUID] = {
                        'DUID': response.DUID,
                        'IP': response.IP,
                        'PID': response.PID,
                        'RUID': response.RUID,
                        'ch': response.ch,
                        'format': response.format,
                        'location_x': response.location_x,
                        'location_y': response.location_y,
                        'location_z': response.location_z,
                        'mac_4g': response.mac_4g,
                        'mac_5g': response.mac_5g,
                        'name': response.name,
                        'power': response.power,
                        'protocol': response.protocol,
                        'simulate': response.simulate,
                        'throughput': response.throughput,
                        'brand_name': response.brand_name,
                        'power_on': response.power_on
                    };
                    document.querySelector('#ruList').querySelector(`[id='${response.RUID}']`).textContent = response.name;
                }else if(response.DUID){
                    DUs[response.DUID] = {
                        'CUID': response.CUID,
                        'DUID': response.DUID,
                        'PID': response.PID,
                        'name': response.name
                    };
                    document.querySelector('#duList').querySelector(`[id='${response.DUID}']`).textContent = response.name;
                    document.getElementById('DUID').querySelector(`option[value='${response.DUID}']`).textContent = response.name;
                }else if(response.CUID){
                    CUs[response.CUID] = {
                        'CUID': response.CUID,
                        'PID': response.PID,
                        'name': response.name
                    };
                    document.querySelector('#cuList').querySelector(`[id='${response.CUID}']`).textContent = response.name;
                    document.getElementById('CUID').querySelector(`option[value='${response.CUID}']`).textContent = response.name;
                }
                selectedName.textContent = response.name;
            }
            drawTree();
        }
    });
});

function createButton(id, name){
    var button = document.createElement('button');
    button.type = 'button';
    button.id = id;
    button.className = 'list-group-item list-group-item-action btnDvc';
    button.textContent = name;
    button.addEventListener('click', () => {
        let parent = button.parentNode;
        let type = '';
        if(parent.id == 'cuList'){
            type = TYPES.CU;
        }else if(parent.id == 'duList'){
            type = TYPES.DU;
        }else if(parent.id == 'ruList'){
            type = TYPES.RU;
        }
        let name = button.textContent;
        let id = button.id;
        curID = button.id;
        const event = new CustomEvent('deviceSelect', {
            detail: { 'name': name, 'id': id, 'type': type }
        });
        selectedName.dispatchEvent(event);
    });
    button.addEventListener('click', function(){
        btnSave.textContent = 'Save';
        btnSave.classList.remove('crtSv');
        document.getElementById('btnDlt').classList.remove('collapse');
    });
    return button;
}

function appendButtonToContainer(button, containerId, createButtonId){
    var container = document.getElementById(containerId);
    var createButton = document.getElementById(createButtonId);
    container.insertBefore(button, createButton);
}

// For delete a device
document.getElementById('btnDlt').addEventListener('click', function(){
    let data = {};
    data.operation = 'Delete';
    if(selectedType == TYPES.CU){
        data.type = TYPES.CU;
    }else if(selectedType == TYPES.DU){
        data.type = TYPES.DU;
    }else if(selectedType == TYPES.RU){
        data.type = TYPES.RU;
    }
    data.deviceID = curID;
    $.ajax({
        URL: window.location.href,
        data: JSON.stringify(data),
        type: 'POST',
        dataType: 'json',
        contentType:'application/json; charset=UTF-8',
        success: function(){
            if(data.type == TYPES.CU){
                document.querySelector('#cuList').querySelector(`[id='${data.deviceID}']`).remove();
                document.getElementById('CUID').querySelector(`option[value='${data.deviceID}']`).remove();
                for(const key in CUs){
                    if(CUs[key].CUID == data.deviceID){
                        delete CUs[key];
                        break;
                    }
                }
            }else if(data.type == TYPES.DU){
                document.querySelector('#duList').querySelector(`[id='${data.deviceID}']`).remove();
                document.getElementById('DUID').querySelector(`option[value='${data.deviceID}']`).remove();
                for(const key in DUs){
                    if(DUs[key].DUID == data.deviceID){
                        delete DUs[key];
                        break;
                    }
                }
            }else if(data.type == TYPES.RU){
                document.querySelector('#ruList').querySelector(`[id='${data.deviceID}']`).remove();
                for(const key in RUs){
                    if(RUs[key].RUID == data.deviceID){
                        delete RUs[key];
                        break;
                    }
                }
            }
            let allOptions = document.getElementsByClassName('deviceOption');
            for(const node of allOptions){
                node.classList.add('collapse');
            }
            selectedName.textContent = 'SELECT A DEVICE';
            document.getElementById('btnDlt').classList.add('collapse');
            btnSave.classList.add('collapse');
            showOptions = false;
            drawTree();
        },
        error: function(response){
            if(response.status == 400){
                if(data.type == TYPES.CU){
                    alert('Other DU are still connectted to this CU');
                }else if(data.type == TYPES.DU){
                    alert('Other RU are still connectted to this DU');
                }
            }
        }
    });
});

// Plot with Observable
const newTreeDiagram = document.getElementById('treeDiagram');
const orphanRU = document.getElementById('orphanRU');
const orphanDU = document.getElementById('orphanDU');
function drawTree() {
    // Format data
    var plotData = [];
    var orphanRUList = [];
    var orphanDUList = [];
    for (let i in RUs) {
        let RU = RUs[i];
        let DU = DUs[RU.DUID];
        if (DU == undefined) {
            orphanRUList.push(RU.name);
            continue;
        };
        let CU = CUs[DU.CUID];
        if (CU == undefined) {
            continue;
        }
        let path = `Project/${CU.name}/${DU.name}/${RU.name}`;
        plotData.push(path);
    }
    for (let i in DUs) {
        let DU = DUs[i];
        let CU = CUs[DU.CUID];
        if (CU == undefined) {
            orphanDUList.push(DU.name);
            continue;
        }
        let path = `Project/${CU.name}/${DU.name}`;
        plotData.push(path);
    }
    for (let i in CUs) {
        let CU = CUs[i];
        let path = `Project/${CU.name}`;
        plotData.push(path);
    }
    plotData.push('Project');

    // Concise API
    const tree = Plot.plot({
        axis: null,
        margin: 10,
        marginLeft: 40,
        marginRight: 160,
        marks: [
            Plot.tree(plotData, {textStroke: "black"})
        ]
    })
    newTreeDiagram.replaceChildren(tree);

    // List out orphans
    orphanRU.textContent = '';
    for (i of orphanRUList) {
        orphanRU.innerHTML += `${i}<br>`;
    }
    orphanDU.textContent = '';
    for (i of orphanDUList) {
        orphanDU.innerHTML += `${i}<br>`;
    }
}
drawTree();