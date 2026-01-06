import { pointToPercentages, percentagesToPoint } from './utils.js'
import { getHeatmapConfig, updateColorBarBoundaryValues } from './utils.js'

// Organize data
const rotation = new THREE.Matrix4().fromArray(modelData.position.rotation);
const bbox = modelData.position.bbox;
const bboxMin = [bbox.min.x, bbox.min.y];
const bboxMax = [bbox.max.x, bbox.max.y];
const boundary = modelData.position.boundary;
const minC = [boundary.min.lng, boundary.min.lat];
const maxC = [boundary.max.lng, boundary.max.lat];
const points = turf.points([minC, maxC]);
const bboxFit = turf.bbox(points);
const center = turf.center(points).geometry.coordinates;
const imgMerc = mapboxgl.MercatorCoordinate.fromLngLat(center, 0);
const heatmapLayerData = {
    '1': {
        'id': 'rsrpHeatmapLayer',
        'min': -140,
        'max': -55,
        'unit': 'dBm'
    },
    '3': {
        'id': 'tpHeatmapLayer',
        'min': 0,
        'max': 0, // Max should be dynamic
        'unit': 'Mbps'
    }
};
var myModel;

// Elements
const colorBarContainer = document.getElementById('colorBarContainer');
const ueNumber = document.getElementById('ueNumber');
const heatmapSwitch = document.getElementById('heatmapSwitch');
const heatmapTypeSelect = document.getElementById('heatmapTypeSelect');
const btnUpdateHeatmap = document.getElementById('btnUpdateHeatmap');
const heatmapUpdateTime = document.getElementById('heatmapUpdateTime');

// Mapbox
mapboxgl.accessToken = 'pk.eyJ1IjoiZGFyaXVzbHVuZyIsImEiOiJjbHk3MWhvZW4wMTl6MmlxMnVhNzI3cW0yIn0.WGvtamOAfwfk3Ha4KsL3BQ';
const map = new mapboxgl.Map({
    container: 'mapContainer',
    // Choose from Mapbox's core styles, or make your own style with Mapbox Studio
    style: 'mapbox://styles/mapbox/streets-v12',
    center: center,
    zoom: 15
});

// Threebox
const tb = (window.tb = new Threebox(
    map,
    map.getCanvas().getContext('webgl'),
    {
        defaultLights: true,
    }
));

// Add controls
const nav = new mapboxgl.NavigationControl({
    visualizePitch: true
});
map.addControl(nav, 'top-right');
map.addControl(new mapboxgl.ScaleControl());
map.fitBounds(bboxFit, {duration: 0, padding: 100});

// Get heatmaps
var minPoint;
var maxPoint;
// Check if min max points already calculated
if (modelData.position.minPoint && modelData.position.maxPoint) {
    minPoint = modelData.position.minPoint;
    maxPoint = modelData.position.maxPoint;
}
$.ajax({
    URL: window.location.href,
    data: JSON.stringify({type: 'refresh_heatmap'}),
    type: 'POST',
    dataType: 'json',
    contentType: 'application/json',
    success: function(response){
        const rsrpHeatmapData = response.rsrp;
        const tpHeatmapData = response.throughput;

        // RSRP heatmap
        // Convert to mercator units for calculation
        let rsrpHeatmapGeoJSON = {
            "type": "FeatureCollection",
            "features": []
        };
        let xArray = [];
        let yArray = [];

        for (let i in rsrpHeatmapData) {
            let pointData = rsrpHeatmapData[i];
            // Store in array for further calculation
            xArray.push(pointData['ms_x']);
            yArray.push(pointData['ms_y']);
            // Get max of 5 router rsrp strengths and subtract 35
            const calc = Math.max(pointData['RU5'], pointData['RU6'], pointData['RU9'], pointData['RU11'], pointData['RU12']) - 35;
            let point = {
                'type': 'Feature',
                'properties': {
                    'ru5': pointData['RU5'],
                    'ru6': pointData['RU6'],
                    'ru9': pointData['RU9'],
                    'ru11': pointData['RU11'],
                    'ru12': pointData['RU12'],
                    'calc': calc
                },
                'geometry': {
                    'type': 'Point',
                    'coordinates': []
                }
            };
            rsrpHeatmapGeoJSON.features.push(point);
        }
        // Array size should be the same
        if (xArray.length != yArray.length) {
            console.error(new Error('ERROR LNG != LAT ARRAY LENGTH'));
        }

        // Mapping heatmap to image coordinates
        if (minPoint == undefined || maxPoint == undefined) {
            minPoint = [Math.floor(Math.min(...xArray)), Math.floor(Math.min(...yArray))];
            maxPoint = [Math.ceil(Math.max(...xArray)), Math.ceil(Math.max(...yArray))];
            // Store in db for faster UE load times
            // IMPLEMENT
        }
        for (let i in xArray) {
            // Mapping
            const percentages = pointToPercentages(minPoint, maxPoint, [xArray[i] - minPoint[0], yArray[i] - minPoint[1]]);
            const point = percentagesToPoint(bboxMin, bboxMax, percentages);
            // Offset from center
            const offsetX = point[0] + bboxMin[0];
            const offsetY = point[1] + bboxMin[1];
            // Rotate
            const rotatedX = offsetX * rotation.elements[0] + offsetY * rotation.elements[4];
            const rotatedY = offsetX * rotation.elements[1] + offsetY * rotation.elements[5];
            // Get offsets in mercator unit
            const calcX = rotatedX * imgMerc.meterInMercatorCoordinateUnits();
            const calcY = rotatedY * imgMerc.meterInMercatorCoordinateUnits();
            const merc = new mapboxgl.MercatorCoordinate(imgMerc.x + calcX, imgMerc.y - calcY, imgMerc.z);
            const coords = merc.toLngLat();
            rsrpHeatmapGeoJSON.features[i].geometry.coordinates = [coords.lng, coords.lat];
        }

        // Throughput heatmap
        // Convert to mercator units for calculation
        let tpHeatmapGeoJSON = {
            "type": "FeatureCollection",
            "features": []
        };
        let tpXArray = [];
        let tpYArray = [];
        let tpValArray = [];

        for (let i in tpHeatmapData) {
            let pointData = tpHeatmapData[i];
            // Store in array for further calculation
            tpXArray.push(pointData['ms_x']);
            tpYArray.push(pointData['ms_y']);
            tpValArray.push(pointData['DL_thu']);
            let point = {
                'type': 'Feature',
                'properties': {
                    'throughput': pointData['DL_thu']
                },
                'geometry': {
                    'type': 'Point',
                    'coordinates': []
                }
            };
            tpHeatmapGeoJSON.features.push(point);
        }
        // Array size should be the same
        if (tpXArray.length != tpYArray.length) {
            console.error(new Error('ERROR THROUGHPUT LNG != LAT ARRAY LENGTH'));
        }

        for (let i in xArray) {
            // Mapping
            const percentages = pointToPercentages(minPoint, maxPoint, [tpXArray[i] - minPoint[0], tpYArray[i] - minPoint[1]]);
            const point = percentagesToPoint(bboxMin, bboxMax, percentages);
            // Offset from center
            const offsetX = point[0] + bboxMin[0];
            const offsetY = point[1] + bboxMin[1];
            // Rotate
            const rotatedX = offsetX * rotation.elements[0] + offsetY * rotation.elements[4];
            const rotatedY = offsetX * rotation.elements[1] + offsetY * rotation.elements[5];
            // Get offsets in mercator unit
            const calcX = rotatedX * imgMerc.meterInMercatorCoordinateUnits();
            const calcY = rotatedY * imgMerc.meterInMercatorCoordinateUnits();
            const merc = new mapboxgl.MercatorCoordinate(imgMerc.x + calcX, imgMerc.y - calcY, imgMerc.z);
            const coords = merc.toLngLat();
            tpHeatmapGeoJSON.features[i].geometry.coordinates = [coords.lng, coords.lat];
        }

        // Add heatmap layer to mapbox
        // Add a geojson point source.
        // Heatmap layers also work with a vector tile source.
        map.addSource('rsrpHeatmapSource', {
            'type': 'geojson',
            'data': rsrpHeatmapGeoJSON
        });
        map.addLayer(getHeatmapConfig('rsrpHeatmapLayer', 'rsrpHeatmapSource', 'none'));

        map.addSource('tpHeatmapSource', {
            'type': 'geojson',
            'data': tpHeatmapGeoJSON
        });
        const tpMax = Math.ceil(Math.max(...tpValArray) / 10) * 10;
        heatmapLayerData['3'].max = tpMax;
        map.addLayer(getHeatmapConfig('tpHeatmapLayer', 'tpHeatmapSource', 'none', 'throughput', 0, tpMax));

        // Heatmap update time
        heatmapUpdateTime.textContent = `Last updated: ${new Date().toLocaleTimeString([], { hour12: false })}`;

        // Enable heatmap switch
        heatmapSwitch.disabled = false;
    }
});

map.on('style.load', () => {
    // Show 3d model
    map.addLayer({
        id: 'custom-threebox-model',
        type: 'custom',
        renderingMode: '3d',
        onAdd: function () {
            // Creative Commons License attribution:  Metlife Building model by https://sketchfab.com/NanoRay
            // https://sketchfab.com/3d-models/metlife-building-32d3a4a1810a4d64abb9547bb661f7f3
            const scale = 1;
            // Three.js only loads from URL, base64 URI faster than blob
            const url = btoa(modelData.image);
            const coordinates = [modelData.position.coordinates.lng, modelData.position.coordinates.lat];
            const options = {
                obj: 'data:text/plain;base64,' + url,
                type: 'gltf',
                scale: { x: scale, y: scale, z: scale },
                units: 'meters',
                rotation: { x: 90, y: 0, z: 0 },
                anchor: 'center'
            };

            tb.loadObj(options, (model) => {
                myModel = model;
                myModel.setCoords(coordinates);
                myModel.setRotationFromMatrix(rotation);
                tb.add(myModel);
            });
        },

        render: function () {
            tb.update();
        }
    });
});

const MARKER_SIZE = 32;

const popup = new mapboxgl.Popup({
    closeButton: false,
    className: 'ruPopup',
    offset: {'bottom': [0, -MARKER_SIZE/2]}
});

// Linear to curve mapping for colour perceptive difference
function getTurnExponentialMapping(x) {
    const k = 0.5;
    return (Math.pow(Math.E, k * x) - 1 ) / (Math.pow(Math.E, k) - 1);
}

// Mapping UE and RU colours with RU names
let associateIDs = []
for (let i in RUs) {
    associateIDs.push(RUs[i].name);
}
// Use Set to get unique IDs
let uniqueAssociateIDs = [...new Set(associateIDs)].sort();
// Alternating IDs for colour perceptive difference
let permutatedIDs = []
const iterMax = Math.ceil(uniqueAssociateIDs.length / 2);
for (let i = 0; i < iterMax; i++) {
    permutatedIDs.push(uniqueAssociateIDs[i]);
    uniqueAssociateIDs.splice(i, 1);
}
// Concat with remaining IDs
permutatedIDs = permutatedIDs.concat(uniqueAssociateIDs);
let colourDist = 1 / permutatedIDs.length;
let currentDist = 0;
let idTurnValue = {};
for (let i of permutatedIDs) {
    idTurnValue[i] = currentDist;
    currentDist += colourDist;
}
// console.log(idTurnValue);

// Place marker for each RU
for (let i in RUs) {
    const RU = RUs[i];
    const coordinates = [RU.location_x, RU.location_y];
    const el = document.createElement('div');
    el.className = 'ruMarker';
    el.style.backgroundImage = 'url(/static/img/ru.svg)';
    el.style.width = `${MARKER_SIZE}px`;
    el.style.height = `${MARKER_SIZE}px`;
    el.style.backgroundSize = '100%';
    el.id = 'ruMarker' + i;

    // RU colour
    el.style.filter = `brightness(70%) sepia(1) hue-rotate(${idTurnValue[RUs[i].name]}turn) saturate(2)`;
    
    const ruMarker = new mapboxgl.Marker(el, {
        draggable: false
    })
    .setLngLat(coordinates)
    .addTo(map)

    // Hover popup
    el.addEventListener('mouseover', () => {
        popup.setLngLat(coordinates).setText(RU.name).addTo(map);
    });

    el.addEventListener('mouseleave', () => {
        popup.remove();
    });
}



var markerArray = [];
var hideUE = false;
const specificOffsetX = 9;
const specificOffsetY = 1;

let count_to_off_scenario = 0;
var scenarioState = 'running';//stop,running, pause
const scenarioPause = document.getElementById('scenarioPause');
const scenarioType = document.getElementById('scenarioType');
scenarioPause.addEventListener('click', function(){
    if(scenarioState == 'pause'){
        let data = {
            type: 'scenario',
            option: '1',
        };
        $.ajax({
            URL: window.location.href,
            data: JSON.stringify(data),
            type: 'POST',
            dataType: 'json',
            contentType: 'application/json',
            success: function(){
                // console.log("pause ->running");
                scenarioPause.textContent = 'Pause';
                scenarioPause.classList.remove('btn-primary');
                scenarioPause.classList.add('btn-danger');
                scenarioState = 'running';
            }
        });
    }else{
        let data = {
            type: 'scenario',
            option: '0',
        };
        $.ajax({
            URL: window.location.href,
            data: JSON.stringify(data),
            type: 'POST',
            dataType: 'json',
            contentType: 'application/json',
            success: function(){
                // console.log("running -> pause");
                scenarioPause.textContent = 'Restart';
                scenarioPause.classList.remove('btn-danger');
                scenarioPause.classList.add('btn-primary');
                scenarioState = 'pause';
            }
        });
    }
});

// Post request to get UE position
function getUEData() {
    const data = {
        type: 'get_UE_position'
    }
    $.ajax({
        URL: window.location.href,
        data: JSON.stringify(data),
        type: 'POST',
        dataType: 'json',
        contentType:'application/json; charset=UTF-8',
        success: function(response) {
            // Remove old UE
            for (let marker of markerArray) {
                marker.remove();
            }
            markerArray = [];
            // Change UE number display
            ueNumber.textContent = response.length;
            // Change number but don't show 
            if (hideUE) return;
            // Place new UE
            for (let i in response) {
                const ueData = response[i];
                // Right and upward shift
                try {
                    var percentages = pointToPercentages(minPoint, maxPoint, [ueData['Wisdon.UE.Geo.x'] - minPoint[0], ueData['Wisdon.UE.Geo.y'] - minPoint[1]]);
                    var point = percentagesToPoint(bboxMin, bboxMax, percentages);
                }
                catch (TypeError) {
                    console.log('UE Scenario: Waiting for heatmap to load.')
                    return
                }
                // Offset from center
                const offsetX = point[0] + bboxMin[0];
                const offsetY = point[1] + bboxMin[1];
                // Rotate
                const rotatedX = offsetX * rotation.elements[0] + offsetY * rotation.elements[4];
                const rotatedY = offsetX * rotation.elements[1] + offsetY * rotation.elements[5];
                // Get offsets in mercator unit
                const calcX = rotatedX * imgMerc.meterInMercatorCoordinateUnits();
                const calcY = rotatedY * imgMerc.meterInMercatorCoordinateUnits();
                const merc = new mapboxgl.MercatorCoordinate(imgMerc.x + calcX, imgMerc.y - calcY, imgMerc.z);
                const coords = merc.toLngLat();

                const el = document.createElement('div');
                el.className = 'ueMarker';
                el.style.backgroundImage = 'url(/static/img/ue.svg)';
                el.style.width = `${MARKER_SIZE}px`;
                el.style.height = `${MARKER_SIZE}px`;
                el.style.backgroundSize = '100%';
                el.id = 'ueMarker' + i;

                // Change colour with uniform spacing according to n unique associate IDs
                el.style.filter = `brightness(70%) sepia(1) hue-rotate(${idTurnValue[ueData['Wisdon.UE.serving.Pci']]}turn) saturate(2)`;
                
                const ueMarker = new mapboxgl.Marker(el, {
                    draggable: false
                })
                .setLngLat([coords.lng, coords.lat])
                .addTo(map)
                markerArray.push(ueMarker);
            }

            if(scenarioState == 'pause' || scenarioState == 'stop'){
                // console.log("scenarioState == 'pause' || scenarioState == 'stop'");
                //do nothing
            }else if (scenarioState == 'running'){
                if (response.length == 0){
                    // console.log("count_to_off_scenario = ", count_to_off_scenario)
                    if (count_to_off_scenario == 10){
                        scenarioType.innerHTML = `No scenario`;
                        scenarioPause.style.display = "none";
                        count_to_off_scenario = 0;
                        scenarioState ='stop';
                    }else{
                        count_to_off_scenario++;
                    }
                }else{
                    count_to_off_scenario = 0;
                    scenarioType.innerHTML = `Scenario type: ${cur_scenario}`;
                    scenarioPause.style.display = "block";
                }
            }else{
                console.log("+++++++++++++++ wrong scenario state!!!  ++++++++++++++++++");
            }
        }
    });
}
getUEData();
setInterval(getUEData, 1000);

document.getElementById('btnUE').addEventListener('click', function(){
    if (document.getElementById('btnUE').classList.contains('active')) { // Hide
        // Remove UE
        for (let marker of markerArray) {
            marker.remove();
        }
        hideUE = true;
    }
    else { // Show
        hideUE = false;
    }
});

document.getElementById('btnRU').addEventListener('click', function(){
    const markers = document.getElementsByClassName('ruMarker');
    if (document.getElementById('btnRU').classList.contains('active')) { // Hide
        for (let marker of markers) {
            marker.classList.add('collapse');
        }
    }
    else { // Show
        for (let marker of markers) {
            marker.classList.remove('collapse');
        }
    }
});

function addCornerMarkers() {
    // Get bounding box
    const points = myModel.box3();
    const minX = points.min.x * rotation.elements[0] + points.min.y * rotation.elements[4];
    const minY = points.min.x * rotation.elements[1] + points.min.y * rotation.elements[5];
    const maxX = points.max.x * rotation.elements[0] + points.max.y * rotation.elements[4];
    const maxY = points.max.x * rotation.elements[1] + points.max.y * rotation.elements[5];
    
    // Get offsets in mercator unit
    const minOffsetX = minX * imgMerc.meterInMercatorCoordinateUnits();
    const minOffsetY = minY * imgMerc.meterInMercatorCoordinateUnits();
    const minMerc = new mapboxgl.MercatorCoordinate(imgMerc.x + minOffsetX, imgMerc.y - minOffsetY, imgMerc.z);
    const minCoords = minMerc.toLngLat();
    
    const maxOffsetX = maxX * imgMerc.meterInMercatorCoordinateUnits();
    const maxOffsetY = maxY * imgMerc.meterInMercatorCoordinateUnits();
    const maxMerc = new mapboxgl.MercatorCoordinate(imgMerc.x + maxOffsetX, imgMerc.y - maxOffsetY, imgMerc.z);
    const maxCoords = maxMerc.toLngLat();

    // Add markers
    new mapboxgl.Marker()
    .setLngLat(minCoords)
    .addTo(map)
    new mapboxgl.Marker()
    .setLngLat(maxCoords)
    .addTo(map)
}

// choose scenario to run
document.getElementById('chooseScenario').addEventListener('click', function(){
    let sce = document.getElementById('scenarioSelect').value;
    let data = {
        type: 'choose_scenario',
        option: '1',
        scenario: sce,
    };

    $.ajax({
        URL: window.location.href,
        data: JSON.stringify(data),
        type: 'POST',
        dataType: 'json',
        contentType:'application/json',
        success: function(){
            if (sce != '0'){
                console.log("stop/running/pause -> running");
                document.getElementById('scenarioPause').textContent = 'Pause';
                document.getElementById('scenarioPause').classList.remove('btn-primary');
                document.getElementById('scenarioPause').classList.add('btn-danger');
                scenarioState = 'running';
                scenarioPause.style.display = "block";
                cur_scenario = sce;
            }else{
                scenarioType.innerHTML = `No Simulation`;
                scenarioPause.style.display = "none";
                scenarioState ='stop';
                cur_scenario = sce;
            }
        }
    });
});

// Hide heatmap layers
function hideHeatmapLayers() {
    for (let i in heatmapLayerData) {
        map.setLayoutProperty(heatmapLayerData[i].id, 'visibility', 'none');
    }
}

// Heatmap type select on select change
heatmapTypeSelect.onchange = function() {
    const selectedLayer = heatmapLayerData[heatmapTypeSelect.value];

    if (heatmapSwitch.checked) {
        hideHeatmapLayers();
    
        // Change visibility
        map.setLayoutProperty(selectedLayer.id, 'visibility', 'visible');
    }

    // Update boundary values
    updateColorBarBoundaryValues(selectedLayer.min, selectedLayer.max, selectedLayer.unit);
}

// Toggle show heatmap
heatmapSwitch.oninput = function() {
    if (heatmapSwitch.checked) {
        const selectedLayer = heatmapLayerData[heatmapTypeSelect.value];

        // Change visibility
        map.setLayoutProperty(selectedLayer.id, 'visibility', 'visible');
        colorBarContainer.classList.remove('collapse');

        // Update boundary values
        updateColorBarBoundaryValues(selectedLayer.min, selectedLayer.max, selectedLayer.unit);
    }
    else {
        hideHeatmapLayers();
        colorBarContainer.classList.add('collapse');
    }
    // console.log(map.getLayoutProperty('heatmapLayer', 'visibility'));
};

function refreshHeatmap() {
    let data = {
        type: 'refresh_heatmap',
    };
    $.ajax({
        URL: window.location.href,
        data: JSON.stringify(data),
        type: 'POST',
        dataType: 'json',
        contentType: 'application/json',
        success: function(response){
            let rsrpHeatmapData = response.rsrp;
            let tpHeatmapData = response.throughput;

            // RSRP heatmap
            // Convert to mercator units for calculation
            let rsrpHeatmapGeoJSON = {
                "type": "FeatureCollection",
                "features": []
            };
            let xArray = [];
            let yArray = [];

            for (let i in rsrpHeatmapData) {
                let pointData = rsrpHeatmapData[i];
                // Store in array for further calculation
                xArray.push(pointData['ms_x']);
                yArray.push(pointData['ms_y']);
                // Get max of 5 router rsrp strengths and subtract 35
                const calc = Math.max(pointData['RU5'], pointData['RU6'], pointData['RU9'], pointData['RU11'], pointData['RU12']) - 35;
                let point = {
                    'type': 'Feature',
                    'properties': {
                        'ru5': pointData['RU5'],
                        'ru6': pointData['RU6'],
                        'ru9': pointData['RU9'],
                        'ru11': pointData['RU11'],
                        'ru12': pointData['RU12'],
                        'calc': calc
                    },
                    'geometry': {
                        'type': 'Point',
                        'coordinates': []
                    }
                };
                rsrpHeatmapGeoJSON.features.push(point);
            }
            // Array size should be the same
            if (xArray.length != yArray.length) {
                console.error(new Error('ERROR LNG != LAT ARRAY LENGTH'));
            }

            // Mapping heatmap to image coordinates
            if (minPoint == undefined || maxPoint == undefined) {
                minPoint = [Math.floor(Math.min(...xArray)), Math.floor(Math.min(...yArray))];
                maxPoint = [Math.ceil(Math.max(...xArray)), Math.ceil(Math.max(...yArray))];
                // Store in db for faster UE load times
                // IMPLEMENT
            }
            for (let i in xArray) {
                // Mapping
                const percentages = pointToPercentages(minPoint, maxPoint, [xArray[i] - minPoint[0], yArray[i] - minPoint[1]]);
                const point = percentagesToPoint(bboxMin, bboxMax, percentages);
                // Offset from center
                const offsetX = point[0] + bboxMin[0];
                const offsetY = point[1] + bboxMin[1];
                // Rotate
                const rotatedX = offsetX * rotation.elements[0] + offsetY * rotation.elements[4];
                const rotatedY = offsetX * rotation.elements[1] + offsetY * rotation.elements[5];
                // Get offsets in mercator unit
                const calcX = rotatedX * imgMerc.meterInMercatorCoordinateUnits();
                const calcY = rotatedY * imgMerc.meterInMercatorCoordinateUnits();
                const merc = new mapboxgl.MercatorCoordinate(imgMerc.x + calcX, imgMerc.y - calcY, imgMerc.z);
                const coords = merc.toLngLat();
                rsrpHeatmapGeoJSON.features[i].geometry.coordinates = [coords.lng, coords.lat];
            }

            // Throughput heatmap
            // Convert to mercator units for calculation
            var tpHeatmapGeoJSON = {
                "type": "FeatureCollection",
                "features": []
            };
            let tpXArray = [];
            let tpYArray = [];
            let tpValArray = [];

            for (let i in tpHeatmapData) {
                let pointData = tpHeatmapData[i];
                // Store in array for further calculation
                tpXArray.push(pointData['ms_x']);
                tpYArray.push(pointData['ms_y']);
                tpValArray.push(pointData['DL_thu']);
                let point = {
                    'type': 'Feature',
                    'properties': {
                        'throughput': pointData['DL_thu']
                    },
                    'geometry': {
                        'type': 'Point',
                        'coordinates': []
                    }
                };
                tpHeatmapGeoJSON.features.push(point);
            }
            // Array size should be the same
            if (tpXArray.length != tpYArray.length) {
                console.error(new Error('ERROR THROUGHPUT LNG != LAT ARRAY LENGTH'));
            }

            for (let i in xArray) {
                // Mapping
                const percentages = pointToPercentages(minPoint, maxPoint, [tpXArray[i] - minPoint[0], tpYArray[i] - minPoint[1]]);
                const point = percentagesToPoint(bboxMin, bboxMax, percentages);
                // Offset from center
                const offsetX = point[0] + bboxMin[0];
                const offsetY = point[1] + bboxMin[1];
                // Rotate
                const rotatedX = offsetX * rotation.elements[0] + offsetY * rotation.elements[4];
                const rotatedY = offsetX * rotation.elements[1] + offsetY * rotation.elements[5];
                // Get offsets in mercator unit
                const calcX = rotatedX * imgMerc.meterInMercatorCoordinateUnits();
                const calcY = rotatedY * imgMerc.meterInMercatorCoordinateUnits();
                const merc = new mapboxgl.MercatorCoordinate(imgMerc.x + calcX, imgMerc.y - calcY, imgMerc.z);
                const coords = merc.toLngLat();
                tpHeatmapGeoJSON.features[i].geometry.coordinates = [coords.lng, coords.lat];
            }

            // Update heatmap sources
            map.getSource('rsrpHeatmapSource').setData(rsrpHeatmapGeoJSON);
            map.getSource('tpHeatmapSource').setData(tpHeatmapGeoJSON);

            // Update values
            const tpMax = Math.ceil(Math.max(...tpValArray) / 10) * 10;
            heatmapLayerData['2'].max = tpMax;
            map.setPaintProperty('tpHeatmapLayer', 'heatmap-weight', [
                'interpolate',
                ['linear'],
                ['get', 'throughput'],
                0,
                0,
                tpMax,
                1
            ]);
            const selectedLayer = heatmapLayerData[heatmapTypeSelect.value];
            updateColorBarBoundaryValues(selectedLayer.min, selectedLayer.max, selectedLayer.unit);

            // Update heatmap time
            heatmapUpdateTime.textContent = `Last updated: ${new Date().toLocaleTimeString([], { hour12: false })}`;
        }
    });
}

// Refresh heatmap every 10s
// setInterval(refreshHeatmap, 10000);

btnUpdateHeatmap.onclick = function() {
    refreshHeatmap();
}