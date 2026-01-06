// Elements
const autoApplyModal = document.getElementById('autoApplyModal');
const autoApplyToggle = document.getElementById('autoApplyToggle');
const modalToggle = document.getElementById('modalToggle');
const modalSave = document.getElementById('btnAutoSave');

// Auto apply
let autoFlag = false;
autoApplyModal.addEventListener('show.bs.modal', () => {
    autoFlag ? autoApplyToggle.checked = true : autoApplyToggle.checked = false;
});
modalSave.onclick = function() {
    if (autoApplyToggle.checked) {
        modalToggle.classList.remove('btn-outline-primary');
        modalToggle.classList.add('btn-success');
        modalToggle.textContent = 'Auto Apply On';
    }
    else {
        modalToggle.classList.remove('btn-success');
        modalToggle.classList.add('btn-outline-primary');
        modalToggle.textContent = 'Auto Apply Off';
    }
    autoFlag = autoApplyToggle.checked;
}

// Limit proportion max to 100
let record = {};

let selectedModel;
let selectedModelinput;
let checkboxData = {};

function calcTotal(record) {
    let total = 0;
    for (let val in record) {
        total += Number(record[val]);
    }
    return total;
}

for (let model of tmp_ai_data) {
    let modelSlider = document.getElementById(`proportionSlider${model}`);
    let modelInput = document.getElementById(`proportionInput${model}`);
    modelSlider.addEventListener('input', () => {
        let value = Number(modelSlider.value);
        record[model] = value;
        let total = calcTotal(record);
        if (total > 100) {
            value -= total - 100;
        }
        modelSlider.value = value;
        modelInput.value = value;
        record[model] = value;
    });
    modelInput.addEventListener('input', () => {
        let value = Number(modelInput.value);
        record[model] = value;
        let total = calcTotal(record);
        if (total > 100) {
            value -= total - 100;
        }
        modelSlider.value = value;
        modelInput.value = value;
        record[model] = value;
    });
    document.getElementById(`retrain${model}`).addEventListener('click', function(){
        selectedModel = model;
        document.getElementById('retrainLabel').textContent = 'Retrain Settings ' + model;
    });
    
    document.getElementById(`inputdatabtn${model}`).addEventListener('click', function(){
        document.getElementById('inputdatabtnLabel').textContent = 'Parameters Settings ' + model;
    });

    checkboxData[model] = {};
}
 
function get_AI_advise(){
    const data = {
        type: 'get_AI_advise'
    };
    $.ajax({
        url: window.location.href,
        data: JSON.stringify(data),
        type: 'POST',
        dataType: 'json',
        contentType:'application/json',
        success: function(response) {
            console.log(response);
            console.log(tmp_ai_data);
            while (document.getElementById('inference').firstChild) {
                document.getElementById('inference').removeChild(document.getElementById('inference').firstChild);
            }
            for (let i = 0; i < tmp_ai_data.length; i++) {
                let model = tmp_ai_data[i];
                if (document.getElementById(`switch${model}`).checked) {
                    let matchingData = response.find(item => item.AI_ID === `${i + 1}`);
                    let p = document.createElement('p');
                    // AI model name
                    p.textContent = model;
                    if (matchingData) {
                        p.innerHTML += `&nbsp;Suggestion last update: ${matchingData.time}`;
                        document.getElementById('inference').appendChild(p);
                        p.className = 'col-11';
                        let button = document.createElement('button');
                        button.type = 'button';
                        button.className = 'btn btn-primary col-1';
                        button.textContent = 'Apply';
                        button.addEventListener('click', function(){
                            let data = {
                                type: 'apply',
                                apply: checkboxData[model]
                            };
                            console.log(data);
                            $.ajax({
                                url: window.location.href,
                                data: JSON.stringify(data),
                                type: 'POST',
                                dataType: 'json',
                                contentType:'application/json',
                                success: function(response){
                                    console.log(response);
                                }
                            });
                        });
                        document.getElementById('inference').appendChild(button);
                        for(let key in matchingData.results){
                            let p = document.createElement('p');
                            let checkbox = document.createElement('input');
                            checkbox.type = 'checkbox';
                            checkbox.style.marginRight = '10px';
                            if (checkboxData[model][key] != false) {
                                checkboxData[model][key] = true;
                            }
                            checkbox.checked = checkboxData[model][key];
                            checkbox.addEventListener('click', function(){
                                checkboxData[model][key] = checkbox.checked;
                            });
                            // Checkboxes and text
                            p.appendChild(checkbox);
                            p.appendChild(document.createTextNode(` ${key}: ${matchingData.results[key]}`));
                            document.getElementById('inference').appendChild(p);
                        }
                    }
                }
            }
        }
    });
}

get_AI_advise();

window.setInterval(get_AI_advise, 2000);

for (let model of tmp_ai_data) {
    let checkbox = document.getElementById(`switch${model}`);
    if (checkbox) {
        checkbox.addEventListener('click', function() {
            let data = {
                type: 'AI_switch',
                model_name: model
            };
            if(checkbox.checked){
                data.switch = '1';
            }else{
                data.switch = '0';
            }
            console.log(data);
            $.ajax({
                url: window.location.href,
                data: JSON.stringify(data),
                type: 'POST',
                dataType: 'json',
                contentType: 'application/json',
                success: function() {
                    get_AI_advise();
                }
            });
        });
        checkbox.checked = last_AI_config[model];
    }
}

document.getElementById('retrain').addEventListener('click', function(){
    let data = {
        type: 'retrain',
        model: selectedModel
    };
    console.log(data);
    $.ajax({
        url: window.location.href,
        data: JSON.stringify(data),
        type: 'POST',
        dataType: 'json',
        contentType:'application/json',
        success: function(response){
            console.log(response);
        }
    });
});
document.getElementById('deployment').addEventListener('click', function(){
    let data = {
        type: 'deployment',
        clientID: document.getElementById('clientID').value,
        model: selectedModel
    };
    console.log(data);
    $.ajax({
        url: window.location.href,
        data: JSON.stringify(data),
        type: 'POST',
        dataType: 'json',
        contentType:'application/json',
        success: function(response){
            console.log(response);
        }
    });
});
document.getElementById('config').addEventListener('click', function(){
    let data = {
        type: 'config',
        round: document.getElementById('round').value,
        epoch: document.getElementById('epoch').value
    };
    console.log(data);
    $.ajax({
        url: window.location.href,
        data: JSON.stringify(data),
        type: 'POST',
        dataType: 'json',
        contentType:'application/json',
        success: function(response){
            console.log(response);
        }
    });
});