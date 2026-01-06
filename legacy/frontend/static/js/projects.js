mapboxgl.accessToken = 'pk.eyJ1IjoiZGFyaXVzbHVuZyIsImEiOiJjbHk3MWhvZW4wMTl6MmlxMnVhNzI3cW0yIn0.WGvtamOAfwfk3Ha4KsL3BQ';
const map = new mapboxgl.Map({
    container: 'mapContainer', // container ID
    center: [121.064, 23.863], // starting position [lng, lat]. Note that lat must be set between -90 and 90
    zoom: 0, // starting zoom
});

const MARKER_WIDTH = 42.75;
const MARKER_HEIGHT = 64.0;
const SCALE = 1.19;
let geojson = {
    'type': 'FeatureCollection',
    'features': []
};

// Get coordinates from each project
for (const project in tmp_data) {
    let long = tmp_data[project].long;
    let lat = tmp_data[project].lat;

    let feature = {
        'type': 'Feature',
        'properties': {
            'projectID': project,
        },
        'geometry': {
            'type': 'Point',
            'coordinates': [long, lat]
        }
    };
    geojson.features.push(feature);
}

// Fit view to bounding box
let bbox = turf.bbox(geojson);
map.fitBounds(bbox, {duration: 0, padding: 100, maxZoom: 15});

map.on('load', function () {
    for (const feature of geojson.features) {
        // Create a DOM element for each marker.
        const el = document.createElement('div');
        el.className = 'marker';
        el.style.backgroundImage = 'url(/static/img/map_marker.png)';
        el.style.width = `${MARKER_WIDTH}px`;
        el.style.height = `${MARKER_HEIGHT}px`;
        el.style.backgroundSize = '100%';
        el.id = 'project' + feature.properties.projectID + 'Marker';
        el.setAttribute('long', feature.geometry.coordinates[0]);
        el.setAttribute('lat', feature.geometry.coordinates[1]);

        // Hover effect
        el.addEventListener('mouseover', () => {
            const node = document.getElementById('project' + feature.properties.projectID);
            node.classList.add('active');
            el.style.width = `${MARKER_WIDTH * SCALE}px`;
            el.style.height = `${MARKER_HEIGHT * SCALE}px`;
        });

        el.addEventListener('mouseleave', () => {
            const node = document.getElementById('project' + feature.properties.projectID);
            node.classList.remove('active');
            el.style.width = `${MARKER_WIDTH}px`;
            el.style.height = `${MARKER_HEIGHT}px`;
        });

        // Redirect to project
        el.addEventListener('click', () => {
            window.location.href = `../overview/${feature.properties.projectID}`;
        });

        // Add markers to the map.
        new mapboxgl.Marker(el, { offset: [0, -MARKER_HEIGHT / 2] })
            .setLngLat(feature.geometry.coordinates)
            .addTo(map);
    }
});

const nav = new mapboxgl.NavigationControl({
    visualizePitch: true
});
map.addControl(nav, 'top-right');
map.addControl(new mapboxgl.ScaleControl());

const projects = document.getElementsByClassName('list-group-item list-group-item-action');
for (const project of projects) {
    project.addEventListener('mouseover', () => {
        const marker = document.getElementById(project.id + 'Marker');
        marker.style.width = `${MARKER_WIDTH * SCALE}px`;
        marker.style.height = `${MARKER_HEIGHT * SCALE}px`;
        // console.log(marker.getAttribute('coordinates'));
        map.easeTo({center: [marker.getAttribute('long'), marker.getAttribute('lat')]});
    });

    project.addEventListener('mouseleave', () => {
        const marker = document.getElementById(project.id + 'Marker');
        marker.style.width = `${MARKER_WIDTH}px`;
        marker.style.height = `${MARKER_HEIGHT}px`;
    });
}