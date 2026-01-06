// Organize data
const boundary = modelData.position.boundary;
const minC = [boundary.min.lng, boundary.min.lat];
const maxC = [boundary.max.lng, boundary.max.lat];
const points = turf.points([minC, maxC]);
const bbox = turf.bbox(points);
const center = turf.center(points).geometry.coordinates;
var myModel;
const location_x = document.getElementById('location_x');
const location_y = document.getElementById('location_y');

// Mapbox
mapboxgl.accessToken = 'pk.eyJ1IjoiZGFyaXVzbHVuZyIsImEiOiJjbHk3MWhvZW4wMTl6MmlxMnVhNzI3cW0yIn0.WGvtamOAfwfk3Ha4KsL3BQ';
const coordinates = document.getElementById('coordinates');
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

// Add floor plan to map
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
                const rotation = new THREE.Matrix4().fromArray(modelData.position.rotation);
                myModel.setRotationFromMatrix(rotation);
                tb.add(myModel);
            });
        },

        render: function () {
            tb.update();
        }
    });
});

// Place draggable marker
// TODO place marker on RU current position
// Read from RUs
const ruMarker = new mapboxgl.Marker({
    draggable: true
})
    .setLngLat(center)
    .addTo(map);


ruMarker.on('dragend', () => {

    const lngLat = ruMarker.getLngLat();
    coordinates.style.display = 'block';
    coordinates.innerHTML = `Longitude: ${lngLat.lng}<br/>Latitude: ${lngLat.lat}`;
    location_x.value = lngLat.lng;
    location_y.value = lngLat.lat;
});


$('#ruPositionModal').on('shown.bs.modal', function() {
    map.resize();
    map.fitBounds(bbox, {duration: 0, padding: 100});
});
