import { pointToPercentages, percentagesToPoint } from '../utils.js';

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
var myModel;
var heatmapInterpolateData = [];
var heatmapROI = [];

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

// Heatmap
// Convert to mercator units for calculation
var heatmapGeoJSON = {
    "type": "FeatureCollection",
    "features": []
};
let xArray = [];
let yArray = [];

for (let i in heatmapData) {
    let pointData = heatmapData[i];
    // Store in array for further calculation
    xArray.push(pointData['ms_x']);
    yArray.push(pointData['ms_y']);
    // Get max of 5 router rsrp strengths
    const calc = Math.max(pointData['RU5'], pointData['RU6'], pointData['RU9'], pointData['RU11'], pointData['RU12']);
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
    heatmapGeoJSON.features.push(point);
    ////////////////////////////
    heatmapInterpolateData.push(
        {
            'val': calc
        }
    )
}
// Array size should be the same
if (xArray.length != yArray.length) {
    console.error(new Error('ERROR LNG != LAT ARRAY LENGTH'));
}

// Mapping heatmap to image coordinates
const minPoint = [Math.floor(Math.min(...xArray)), Math.floor(Math.min(...yArray))];
const maxPoint = [Math.ceil(Math.max(...xArray)), Math.ceil(Math.max(...yArray))];
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
    heatmapGeoJSON.features[i].geometry.coordinates = [coords.lng, coords.lat];
    ////////////////////////////
    heatmapInterpolateData[i].lat = coords.lat;
    heatmapInterpolateData[i].lon = coords.lng;
    heatmapROI.push(
        {
            lat: coords.lat,
            lon: coords.lng
        }
    )
}

// Select from ru1, ru2, ru3, ru4, ru5, calc
const heatmapTarget = 'calc';

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

    // Heatmap layer
    // Add a geojson point source.
    // Heatmap layers also work with a vector tile source.
    map.addSource('heatmapSource', {
        'type': 'geojson',
        'data': heatmapGeoJSON
    });

    // map.addLayer(
    //     {
    //         'id': 'heatmapLayer',
    //         'type': 'heatmap',
    //         'source': 'heatmapSource',
    //         // 'maxzoom': 9,
    //         'layout': {
    //             // Make the layer invisible by default.
    //             'visibility': 'none'
    //         },
    //         'paint': {
    //             // Increase the heatmap weight based on frequency and property magnitude
    //             'heatmap-weight': [
    //                 'interpolate',
    //                 ['linear'],
    //                 ['get', heatmapTarget],
    //                 -80,
    //                 0,
    //                 -20,
    //                 1
    //             ],
    //             // Increase the heatmap color weight weight by zoom level
    //             // heatmap-intensity is a multiplier on top of heatmap-weight
    //             // 'heatmap-intensity': [
    //             //     'interpolate',
    //             //     ['linear'],
    //             //     ['zoom'],
    //             //     0,
    //             //     1,
    //             //     15,
    //             //     3
    //             // ],
    //             'heatmap-intensity': 1,
    //             // Color ramp for heatmap.  Domain is 0 (low) to 1 (high).
    //             // Begin color ramp at 0-stop with a 0-transparancy color
    //             // to create a blur-like effect.
    //             'heatmap-color': [
    //                 'interpolate',
    //                 ['linear'],
    //                 ['heatmap-density'],
    //                 0,
    //                 'rgba(75, 0, 130, 0)',
    //                 0.2,
    //                 'rgb(0, 0, 205)', // Blue
    //                 0.5,
    //                 'rgb(173, 255, 47)', // Green
    //                 0.7,
    //                 'rgb(255, 255, 0)', // Yellow
    //                 0.9,
    //                 'rgb(255, 165, 0)', // Orange
    //                 1,
    //                 'rgb(255, 69, 0)' // Red
    //             ],
    //             // Adjust the heatmap radius to look constant
    //             'heatmap-radius': {
    //                 'base': 2,
    //                 'stops': [
    //                     [
    //                         17,
    //                         2
    //                     ],
    //                     [
    //                         22,
    //                         64
    //                     ]
    //                 ]
    //             },
    //             'heatmap-opacity': 0.8
    //         }
    //     }
    // );

    const heatmapLayer = interpolateHeatmapLayer.create({
        layerId: 'heatmapLayer',
        points: heatmapInterpolateData,
        minValue: -80,
        maxValue: -20,
        framebufferFactor: 0.2,
        fasterPointRadius: 1,
        p: 3,
    });
    map.addLayer(heatmapLayer);
    map.setLayoutProperty('heatmapLayer', 'visibility', 'none');
});

const MARKER_SIZE = 32;

const popup = new mapboxgl.Popup({
    closeButton: false,
    className: 'ruPopup',
    offset: {'bottom': [0, -MARKER_SIZE/2]}
});

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



const ueNumber = document.getElementById('ueNumber');
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
const getUEData = function () {
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
            if (hideUE) return
            // Place new UE
            for (let i in response) {
                const pos = response[i];
                // Right and upward shift
                const percentages = pointToPercentages(minPoint, maxPoint, [pos['Wisdon.UE.Geo.x'] - minPoint[0], pos['Wisdon.UE.Geo.y'] - minPoint[1]]);
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

                const el = document.createElement('div');
                el.className = 'ueMarker';
                el.style.backgroundImage = 'url(/static/img/ue.svg)';
                el.style.width = `${MARKER_SIZE}px`;
                el.style.height = `${MARKER_SIZE}px`;
                el.style.backgroundSize = '100%';
                el.id = 'ueMarker' + i;
                
                const ueMarker = new mapboxgl.Marker(el, {
                    draggable: false
                })
                .setLngLat([coords.lng, coords.lat])
                .addTo(map)
                markerArray.push(ueMarker);
            }

            if(scenarioState == 'pause' || scenarioState == 'stop'){
                console.log("scenarioState == 'pause' || scenarioState == 'stop'");
                //do nothing
            }else if (scenarioState == 'running'){
                if (response.length == 0){
                    console.log("count_to_off_scenario = ", count_to_off_scenario)
                    if (count_to_off_scenario == 10){
                        scenarioType.innerHTML = `No Simulation`;
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

// Toggle show heatmap
const heatmapSwitch = document.getElementById('heatmapSwitch');
heatmapSwitch.oninput = () => {
    if (heatmapSwitch.checked) {
        map.setLayoutProperty('heatmapLayer', 'visibility', 'visible');
    }
    else {
        map.setLayoutProperty('heatmapLayer', 'visibility', 'none');
    }
    // console.log(map.getLayoutProperty('heatmapLayer', 'visibility'));
};

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

const addCornerMarkers = () => {
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
    let data = {
        type: 'choose_scenario',
        option: '1',
        scenario: document.getElementById('scenarioSelect').value,
    };

    $.ajax({
        URL: window.location.href,
        data: JSON.stringify(data),
        type: 'POST',
        dataType: 'json',
        contentType:'application/json',
        success: function(){
            console.log("stop/running/pause -> running");
            document.getElementById('scenarioPause').textContent = 'Pause';
            document.getElementById('scenarioPause').classList.remove('btn-primary');
            document.getElementById('scenarioPause').classList.add('btn-danger');
            scenarioState = 'running';
            scenarioPause.style.display = "block";
        }
    });
});