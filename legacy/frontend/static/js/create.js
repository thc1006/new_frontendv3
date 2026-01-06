// Elements
const createBtn = document.getElementById('createBtn');
const projectName = document.getElementById('projectName');
const reader = new FileReader();
const modelUploadContainer = document.getElementById('modelUploadContainer');
const fileInput = document.getElementById('uploadInput');
const modelNameInput = document.getElementById('modelNameInput')
const modelSelection = document.getElementById('modelSelection');
const uploadSwitch = document.getElementById('uploadSwitch');
const lngInput = document.getElementById('longitude');
const latInput = document.getElementById('latitude');
const mapInstructions = document.getElementById('mapInstructions');
const btnRecenter = document.getElementById('btnRecenter');

// Variables
var data;
var myModel;
var modelData;

// Existing model load status
// 0: not loaded
// 1: loading
// 2: ready
var model_load_status = {};
for (const MID in maps_can_access) {
    model_load_status[MID] = 0;
}
// On selecting existing models
modelSelection.oninput = function() {
    const MID = modelSelection.value;
    // Pull data on selection if image is empty
    if (model_load_status[MID] == 0) {
        model_load_status[MID] = 1;
        let data = {
            "type": "get_map",
            "MID": MID
        };
        $.ajax({
            url:            window.location.href,
            type:           "POST",
            data:           JSON.stringify(data),
            contentType:    "application/json; charset=utf-8",
            dataType:       "json",
            timeout:        300000, // 5 minutes
            success:        function(response) {
                maps_can_access[MID] = response;
                model_load_status[MID] = 2;
            },
            error:          function(response) {
                model_load_status[MID] = 0;
            }
        });
    }

    // Loop function for checking if model is loading/ready
    function loop_func() {
        if (model_load_status[MID] == 0) {
            return
        }
        else if (model_load_status[MID] == 1) {
            console.log(`Loading ${MID}`)
            setTimeout(loop_func, 500);
        }
        else if (model_load_status[MID] == 2) {
            // Check current selection after loading
            if (modelSelection.value == MID) {
                modelData = maps_can_access[modelSelection.value];
                const imageEncoded = btoa(modelData.image);
                const uri = "data:text/plain;base64," + imageEncoded;
                updateModel(uri);
            }
        }
    }
    loop_func();
}

// On selecting file
fileInput.onchange = function() {
    // No files selected
    if (fileInput.files.length == 0) {
        return;
    }
    // Load image from input
    const file = fileInput.files[0];
    const url = URL.createObjectURL(file);
    updateModel(url);
}

// Finish loading model from file
reader.onload = function() {
    // Get bounding box
    const points = myModel.box3();
    const imgMerc = mapboxgl.MercatorCoordinate.fromLngLat(myModel.coordinates, 0);
    
    // Rotation matrix
    myModel.updateMatrix();
    const rotation = new THREE.Matrix4();
    rotation.extractRotation(myModel.matrix);

    // Calculate boundary lnglat after rotation
    const minX = points.min.x * rotation.elements[0] + points.min.y * rotation.elements[4];
    const minY = points.min.x * rotation.elements[1] + points.min.y * rotation.elements[5];
    const maxX = points.max.x * rotation.elements[0] + points.max.y * rotation.elements[4];
    const maxY = points.max.x * rotation.elements[1] + points.max.y * rotation.elements[5];
    
    const minOffsetX = minX * imgMerc.meterInMercatorCoordinateUnits();
    const minOffsetY = minY * imgMerc.meterInMercatorCoordinateUnits();
    const minMerc = new mapboxgl.MercatorCoordinate(imgMerc.x + minOffsetX, imgMerc.y - minOffsetY, imgMerc.z);
    const minCoords = minMerc.toLngLat();
    
    const maxOffsetX = maxX * imgMerc.meterInMercatorCoordinateUnits();
    const maxOffsetY = maxY * imgMerc.meterInMercatorCoordinateUnits();
    const maxMerc = new mapboxgl.MercatorCoordinate(imgMerc.x + maxOffsetX, imgMerc.y - maxOffsetY, imgMerc.z);
    const maxCoords = maxMerc.toLngLat();

    data = {
        'project_name': projectName.value,
        'map_exist': 0,
        'image_name': modelNameInput.value,
        'image': reader.result,
        'position': {
            'bbox': points,
            'boundary': {
                'min': {
                    'lng': minCoords.lng,
                    'lat': minCoords.lat
                },
                'max': {
                    'lng': maxCoords.lng,
                    'lat': maxCoords.lat
                }
            },
            'coordinates': {
                'lng': myModel.coordinates[0],
                'lat': myModel.coordinates[1]
            },
            'rotation': rotation.toArray()
        }
    };

    console.log("Uploading");
    // ajax POST
    $.ajax({
        url:         window.location.href,
        type:        "POST",
        data:        JSON.stringify(data),
        contentType: "application/json; charset=utf-8",
        dataType:    "json",
        timeout:     300000, // 5 minutes
        success:     function(response) {
            window.location.href = response;
        },
        error:       function() {
            console.log("Upload failed");
            // Reenable button if failed
            createBtn.disabled = false;
        }
    });
}

// Create button click
createBtn.onclick = function() {
    if (projectName.value == "") {
        alert('Please enter a project name');
        return;
    }
    // Finish sanity check, disable button
    createBtn.disabled = true;
    // If upload file
    if (uploadSwitch.checked) {
        if (fileInput.files.length == 0) {
            alert('Please select a model file');
            return;
        }
        reader.readAsText(fileInput.files[0]);
    }
    // If select from existing model
    else {
        const MID = modelSelection.value;
        if (MID == '') {
            alert('Please select a model');
            return;
        }
        // Get bounding box
        const points = myModel.box3();
        const imgMerc = mapboxgl.MercatorCoordinate.fromLngLat(myModel.coordinates, 0);
        
        // Rotation matrix
        myModel.updateMatrix();
        const rotation = new THREE.Matrix4();
        rotation.extractRotation(myModel.matrix);

        // Calculate boundary lnglat after rotation
        const minX = points.min.x * rotation.elements[0] + points.min.y * rotation.elements[4];
        const minY = points.min.x * rotation.elements[1] + points.min.y * rotation.elements[5];
        const maxX = points.max.x * rotation.elements[0] + points.max.y * rotation.elements[4];
        const maxY = points.max.x * rotation.elements[1] + points.max.y * rotation.elements[5];
        
        const minOffsetX = minX * imgMerc.meterInMercatorCoordinateUnits();
        const minOffsetY = minY * imgMerc.meterInMercatorCoordinateUnits();
        const minMerc = new mapboxgl.MercatorCoordinate(imgMerc.x + minOffsetX, imgMerc.y - minOffsetY, imgMerc.z);
        const minCoords = minMerc.toLngLat();
        
        const maxOffsetX = maxX * imgMerc.meterInMercatorCoordinateUnits();
        const maxOffsetY = maxY * imgMerc.meterInMercatorCoordinateUnits();
        const maxMerc = new mapboxgl.MercatorCoordinate(imgMerc.x + maxOffsetX, imgMerc.y - maxOffsetY, imgMerc.z);
        const maxCoords = maxMerc.toLngLat();

        data = {
            'project_name': projectName.value,
            'map_exist': 1,
            'MID': MID,
            'image_name': maps_can_access[MID].name,
            'image': maps_can_access[MID].image,
            'position': {
                'bbox': points,
                'boundary': {
                    'min': {
                        'lng': minCoords.lng,
                        'lat': minCoords.lat
                    },
                    'max': {
                        'lng': maxCoords.lng,
                        'lat': maxCoords.lat
                    }
                },
                'coordinates': {
                    'lng': myModel.coordinates[0],
                    'lat': myModel.coordinates[1]
                },
                'rotation': rotation.toArray()
            }
        };

        // ajax POST
        $.ajax({
            url:         window.location.href,
            type:        "POST",
            data:        JSON.stringify(data),
            contentType: "application/json; charset=utf-8",
            dataType:    "json",
            timeout:     300000, // 5 minutes
            success:     function(response) {
                window.location.href = response;
            },
            error:    function(response) {
                // Reenable button if failed
                createBtn.disabled = false;
            }
        });
    }
};

const mapCoordinates = [120.9967369, 24.7871229];
//// MAPBOX ////
mapboxgl.accessToken = 'pk.eyJ1IjoiZHJ5a292YW5vdiIsImEiOiJjazM0OG9hYW4wenR4M2xtajVseW1qYjY3In0.YnbkeuaBiSaDOn7eYDAXsQ';
const map = new mapboxgl.Map({
    container: 'mapContainer', // container id
    center: mapCoordinates,
    zoom: 18, // starting zoom
    style: "mapbox://styles/mapbox/streets-v12",
    antialias: true
});

map.boxZoom.disable();

const tb = (window.tb = new Threebox(
    map,
    map.getCanvas().getContext('webgl'),
    {
        defaultLights: true,
        enableHelpTooltips: true,
        enableSelectingObjects: true,
        enableDraggingObjects: true,
        enableRotatingObjects: true,
    }
));

// Disable after initialization or selection bbox won't appear
tb.enableSelectingObjects = false;
tb.enableDraggingObjects = false;
tb.enableRotatingObjects = false;

map.on('style.load', () => {
    map.addControl(new mapboxgl.NavigationControl({
        visualizePitch: true
    }));
    map.addControl(new mapboxgl.ScaleControl());
    
    // let rotationTransform = {x: 0, y: 0, z: 0};
    window.addEventListener('keydown', function (event) {
        switch (event.code) {
            case 'KeyP':
                console.log(myModel);
                break;
            // Rotate clockwise
            case 'ArrowLeft':
                // Rotate according to current rotation
                myModel.rotateOnAxis(new THREE.Vector3(0, 0, 1), Math.PI * -0.5 / 360);
                tb.map.repaint = true;
                break;
            // Rotate counter clockwise
            case 'ArrowRight':
                myModel.rotateOnAxis(new THREE.Vector3(0, 0, 1), Math.PI * 0.5 / 360);
                tb.map.repaint = true;
                break;
        }
    });
    
});

function onObjectChanged(e) {
    let object = e.detail.object; // the object that has changed
    let action = e.detail.action; // the action that defines the change
    if (object == myModel) {
        if (action.position) {
            // Update lat and long value
            lngInput.value = action.position[0];
            latInput.value = action.position[1];
        }
    }
}

function updateModel(modelURL) {
    if (myModel) {
        tb.remove(myModel);
        map.removeLayer('custom-threebox-model');
    }
    map.addLayer({
        id: 'custom-threebox-model',
        type: 'custom',
        renderingMode: '3d',
        onAdd: function () {
            // Creative Commons License attribution:  Metlife Building model by https://sketchfab.com/NanoRay
            // https://sketchfab.com/3d-models/metlife-building-32d3a4a1810a4d64abb9547bb661f7f3
            const scale = 1;
            const options = {
                obj: modelURL,
                type: 'gltf',
                scale: { x: scale, y: scale, z: scale },
                units: 'meters',
                rotation: { x: 90, y: 0, z: 0 },
                anchor: 'center'
            };

            tb.loadObj(options, (model) => {
                myModel = model;
                const mapCenter = map.getCenter();
                myModel.setCoords([mapCenter.lng, mapCenter.lat]);
                // Update lat and long value
                lngInput.value = myModel.coordinates[0];
                latInput.value = myModel.coordinates[1];
                // Change event
                myModel.addEventListener('ObjectChanged', onObjectChanged, false);
                // Load coordinates and rotation from data
                if (!uploadSwitch.checked) {
                    const coordinates = [modelData.position.coordinates.lng, modelData.position.coordinates.lat];
                    const rotation = new THREE.Matrix4().fromArray(modelData.position.rotation);
                    myModel.setCoords(coordinates);
                    myModel.setRotationFromMatrix(rotation);
                    const boundary = modelData.position.boundary;
                    const minC = [boundary.min.lng, boundary.min.lat];
                    const maxC = [boundary.max.lng, boundary.max.lat];
                    const points = turf.points([minC, maxC]);
                    const bboxFit = turf.bbox(points);
                    map.fitBounds(bboxFit, {duration: 500, padding: 100});
                }
                tb.add(myModel);
            });
        },

        render: function () {
            tb.update();
        }
    });

}

btnRecenter.onclick = function() {
    const mapCenter = map.getCenter();
    myModel.setCoords([mapCenter.lng, mapCenter.lat]);
}

uploadSwitch.oninput = function() {
    if (myModel) {
        tb.remove(myModel);
        map.removeLayer('custom-threebox-model');
    }
    if (uploadSwitch.checked) {
        modelUploadContainer.classList.remove('collapse');
        modelSelection.classList.add('collapse');
        mapInstructions.classList.remove('collapse');
        // Clear model selection
        modelSelection.value = 0;
        tb.enableSelectingObjects = true;
        tb.enableDraggingObjects = true;
        tb.enableRotatingObjects = true;
        btnRecenter.disabled = false;
    }
    else {
        modelUploadContainer.classList.add('collapse');
        modelSelection.classList.remove('collapse');
        mapInstructions.classList.add('collapse');
        // Clear file selection
        fileInput.value = '';
        tb.enableSelectingObjects = false;
        tb.enableDraggingObjects = false;
        tb.enableRotatingObjects = false;
        btnRecenter.disabled = true;
    }
}