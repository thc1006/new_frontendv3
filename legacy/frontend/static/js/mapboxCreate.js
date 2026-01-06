// ----Demo----
import { TxRectMode, TxCenter } from "./modeScaleRotate.js";
const polygon = turf.polygon;
export var coordinates;
var selectedIds;

export function Create(demoParams) {
    this._demoParams = demoParams;
    this._nextFeatureId = 1;
}

Create.prototype.start = function () {
    mapboxgl.accessToken = 'pk.eyJ1IjoiZHJ5a292YW5vdiIsImEiOiJjazM0OG9hYW4wenR4M2xtajVseW1qYjY3In0.YnbkeuaBiSaDOn7eYDAXsQ';
    this._map = new mapboxgl.Map({
        container: 'mapContainer', // container id
        center: this._demoParams.mapCenter,
        zoom: this._demoParams.mapZoom, // starting zoom
        style: "mapbox://styles/mapbox/streets-v12",
    });

    this._map.on('load', this._onMapLoad.bind(this));
};

Create.prototype._onMapLoad = function (event) {
    this._map.loadImage('/static/img/rotate_01.png', function (error, image) {
        if (error) throw error;
        this._map.addImage('rotate', image);
    }.bind(this));

    this._map.loadImage('/static/img/scale_01.png', function (error, image) {
        if (error) throw error;
        this._map.addImage('scale', image);
    }.bind(this));

    this._draw = new MapboxDraw({
        displayControlsDefault: false,
        controls: {
            polygon: false,
            trash: false
        },

        userProperties: true,   // pass user properties to mapbox-gl-draw internal features

        modes: Object.assign({
            tx_poly: TxRectMode,
        }, MapboxDraw.modes),

        styles: drawStyle,
    });

    // XXX how to make overlay render under mapbox-gl-draw widgets?
    this._createDemoOverlay();

    this._map.addControl(this._draw, 'top-right');
    this._map.addControl(new mapboxgl.ScaleControl());

    this._createDemoFeatures();

    this._map.on('data', this._onData.bind(this));

    this._map.on('draw.selectionchange', this._onSelectionChange.bind(this));

    this._map.on('click', this._onClick.bind(this));
    this._map.on('touchstart', this._onClick.bind(this));

    this._txEdit(1);
};

Create.prototype._onClick = function (e) {
    if (this._draw.getMode() == 'draw_polygon') {
        return;
    }

    var featureIds = this._draw.getFeatureIdsAt(e.point);
    // console.log(featureIds);
    // var features = this._map.queryRenderedFeatures(e.point);
    // if (features.length > 0) {
    //     var feature = features[0].toJSON();
    //     console.log(feature);
    //     if (feature.geometry.type == 'Polygon' && feature.properties.id == 1) {
    //         this._txEdit(feature.properties.id);
    //     }
    // }

    if (featureIds.length <= 0) {
        selectedIds = [];
        return;
    }
    // Select polygons on top of overlay
    if (featureIds.length > 1) {
        let id;
        for (let i = featureIds.length - 1; i >= 0; i--) {
            id = featureIds[i];
            if (id != 1) {
                break;
            }
        }
        // console.log(selectedIds);
        if (selectedIds.length == 1
            && selectedIds[0] != 1
            && featureIds.includes(selectedIds[0])) {
            this._draw.changeMode('direct_select', { featureId: selectedIds[0] });
            return;
        }

        this._draw.changeMode('simple_select', { featureIds: [id] });
    }
    else if (featureIds[0] == 1) {
        this._txEdit(1);
    }
};

Create.prototype._txEdit = function (featureId) {
    this._draw.changeMode('tx_poly', {
        featureId: featureId, // required

        canTrash: false,

        canScale: true,
        canRotate: true,    // only rotation enabled

        singleRotationPoint: true,
        rotationPointRadius: 1.2,   // extend rotation point outside polygon

        rotatePivot: TxCenter.Center,   // rotate around center
        scaleCenter: TxCenter.Opposite, // scale around opposite vertex

        canSelectFeatures: true,
    });
};


Create.prototype._computeRect = function (center, size) {

    const cUL = this._map.unproject([center[0] - size[0] / 2, center[1] - size[1] / 2]).toArray();
    const cUR = this._map.unproject([center[0] + size[0] / 2, center[1] - size[1] / 2]).toArray();
    const cLR = this._map.unproject([center[0] + size[0] / 2, center[1] + size[1] / 2]).toArray();
    const cLL = this._map.unproject([center[0] - size[0] / 2, center[1] + size[1] / 2]).toArray();

    return [cUL, cUR, cLR, cLL, cUL];
};

Create.prototype._createDemoFeatures = function () {
    if (this._overlayPoly)
        this._draw.add(this._overlayPoly);


    const canvas = this._map.getCanvas();
    // Get the device pixel ratio, falling back to 1.
    // var dpr = window.devicePixelRatio || 1;
    // Get the size of the canvas in CSS pixels.
    var rect = canvas.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;

    // const cPoly = this._computeRect([1 * w/5, h/3], [100, 180]);
    // const poly = polygon([cPoly]);
    // poly.id = this._nextFeatureId++;
    // this._draw.add(poly);

};

Create.prototype._createDemoOverlay = function () {
    var im_w = this._demoParams.imageWidth;
    var im_h = this._demoParams.imageHeight;


    const canvas = this._map.getCanvas();
    // Get the device pixel ratio, falling back to 1.
    // var dpr = window.devicePixelRatio || 1;
    // Get the size of the canvas in CSS pixels.
    var rect = canvas.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;
    // console.log('canvas: ' + w + 'x' + h);

    while (im_w >= (0.8 * w) || im_h >= (0.8 * h)) {
        im_w = Math.round(0.8 * im_w);
        im_h = Math.round(0.8 * im_h);
    }

    const cPoly = this._computeRect([w / 2, h / 2], [im_w, im_h]);
    const cBox = cPoly.slice(0, 4);

    this._map.addSource("test-overlay", {
        "type": "image",
        "url": this._demoParams.imageUrl,
        "coordinates": cBox
    });

    this._map.addLayer({
        "id": "test-overlay-layer",
        "type": "raster",
        "source": "test-overlay",
        "paint": {
            "raster-opacity": 0.90,
            "raster-fade-duration": 0
        },
    });

    const poly = polygon([cPoly]);
    poly.id = this._nextFeatureId++;
    poly.properties.overlaySourceId = 'test-overlay';
    poly.properties.type = 'overlay';
    this._overlayPoly = poly;
};

Create.prototype._onSelectionChange = function (e) {
    const { features, points } = e;
    if (features.length <= 0) {
        return;
    }

    // CURRENT PROBLEM
    // CANNOT SELECT LAYER ON TOP OF FLOOR PLAN // FIXED
    // NOW CANNOT DRAG SELECTED OVERLAPPING LAYER

    selectedIds = [];
    for (const feature of features) {
        selectedIds.push(feature.id);
    }
    // var feature = features[0];
    // if (feature.geometry.type == 'Polygon' && feature.id == 1) {
    //     this._txEdit(feature.id);
    // }
};

Create.prototype._onDrag = function (e) {

};

Create.prototype._onData = function (e) {
    if (e.sourceId && e.sourceId.startsWith('mapbox-gl-draw-')) {
        // console.log(e.sourceId);
        if (e.type && e.type == 'data'
            && e.source.data
            // && e.sourceDataType && e.sourceDataType == 'content'
            && e.sourceDataType == undefined
            // && e.isSourceLoaded
        ) {
            // var source = this.map.getSource(e.sourceId);
            //var geojson = source._data;
            var geojson = e.source.data;
            if (geojson && geojson.features && geojson.features.length > 0
                && geojson.features[0].properties
                && geojson.features[0].properties.user_overlaySourceId
            ) {
                this._drawUpdateOverlayByFeature(geojson.features[0]);
            }
        }
    }
};

Create.prototype._drawUpdateOverlayByFeature = function (feature) {
    // console.log("Updated overlay " + Date.now() % 1000);
    coordinates = feature.geometry.coordinates[0].slice(0, 4);
    var overlaySourceId = feature.properties.user_overlaySourceId;
    this._map.getSource(overlaySourceId).setCoordinates(coordinates);

    // Update lat and long value
    var lngInput = document.getElementById("longitude");
    var latInput = document.getElementById("latitude");
    let points = turf.points(coordinates);
    let center = turf.center(points).geometry.coordinates;
    lngInput.value = center[0];
    latInput.value = center[1];
};

Create.prototype.updateImage = function (newURL, im_w, im_h) {
    const canvas = this._map.getCanvas();
    // Get the device pixel ratio, falling back to 1.
    // var dpr = window.devicePixelRatio || 1;
    // Get the size of the canvas in CSS pixels.
    var rect = canvas.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;
    // console.log('canvas: ' + w + 'x' + h);

    while (im_w >= (0.8 * w) || im_h >= (0.8 * h)) {
        im_w = Math.round(0.8 * im_w);
        im_h = Math.round(0.8 * im_h);
    }

    const cPoly = this._computeRect([w / 2, h / 2], [im_w, im_h]);
    const cBox = cPoly.slice(0, 4);

    const source = this._map.getSource("test-overlay");
    // console.log(source);
    source.updateImage({
        url: newURL,
        coordinates: cBox
    });

    this._overlayPoly.geometry.coordinates = [cPoly];
    this._draw.add(this._overlayPoly);
};

var drawStyle = [
    {
        'id': 'gl-draw-polygon-fill-inactive',
        'type': 'fill',
        'filter': ['all',
            ['==', 'active', 'false'],
            ['==', '$type', 'Polygon'],
            ['!=', 'user_type', 'overlay'],
            ['!=', 'mode', 'static']
        ],
        'paint': {
            'fill-color': '#3bb2d0',
            'fill-outline-color': '#3bb2d0',
            'fill-opacity': 0.7
        }
    },
    {
        'id': 'gl-draw-polygon-fill-active',
        'type': 'fill',
        'filter': ['all',
            ['==', 'active', 'true'],
            ['==', '$type', 'Polygon'],
            ['!=', 'user_type', 'overlay'],
        ],
        'paint': {
            'fill-color': '#fbb03b',
            'fill-outline-color': '#fbb03b',
            'fill-opacity': 0.7
        }
    },


    {
        'id': 'gl-draw-overlay-polygon-fill-inactive',
        'type': 'fill',
        'filter': ['all',
            ['==', 'active', 'false'],
            ['==', '$type', 'Polygon'],
            ['==', 'user_type', 'overlay'],
            ['!=', 'mode', 'static']
        ],
        'paint': {
            'fill-color': '#3bb2d0',
            'fill-outline-color': '#3bb2d0',
            'fill-opacity': 0.01
        }
    },
    {
        'id': 'gl-draw-overlay-polygon-fill-active',
        'type': 'fill',
        'filter': ['all',
            ['==', 'active', 'true'],
            ['==', '$type', 'Polygon'],
            ['==', 'user_type', 'overlay'],
        ],
        'paint': {
            'fill-color': '#fbb03b',
            'fill-outline-color': '#fbb03b',
            'fill-opacity': 0.01
        }
    },

    {
        'id': 'gl-draw-polygon-stroke-inactive',
        'type': 'line',
        'filter': ['all',
            ['==', 'active', 'false'],
            ['==', '$type', 'Polygon'],
            ['!=', 'user_type', 'overlay'],
            ['!=', 'mode', 'static']
        ],
        'layout': {
            'line-cap': 'round',
            'line-join': 'round'
        },
        'paint': {
            'line-color': '#3bb2d0',
            'line-width': 2
        }
    },

    {
        'id': 'gl-draw-polygon-stroke-active',
        'type': 'line',
        'filter': ['all',
            ['==', 'active', 'true'],
            ['==', '$type', 'Polygon'],
        ],
        'layout': {
            'line-cap': 'round',
            'line-join': 'round'
        },
        'paint': {
            'line-color': '#fbb03b',
            'line-dasharray': [0.2, 2],
            'line-width': 2
        }
    },

    // {
    //     'id': 'gl-draw-polygon-midpoint',
    //     'type': 'circle',
    //     'filter': ['all',
    //         ['==', '$type', 'Point'],
    //         ['==', 'meta', 'midpoint']],
    //     'paint': {
    //         'circle-radius': 3,
    //         'circle-color': '#fbb03b'
    //     }
    // },

    {
        'id': 'gl-draw-line-inactive',
        'type': 'line',
        'filter': ['all',
            ['==', 'active', 'false'],
            ['==', '$type', 'LineString'],
            ['!=', 'mode', 'static']
        ],
        'layout': {
            'line-cap': 'round',
            'line-join': 'round'
        },
        'paint': {
            'line-color': '#3bb2d0',
            'line-width': 2
        }
    },
    {
        'id': 'gl-draw-line-active',
        'type': 'line',
        'filter': ['all',
            ['==', '$type', 'LineString'],
            ['==', 'active', 'true']
        ],
        'layout': {
            'line-cap': 'round',
            'line-join': 'round'
        },
        'paint': {
            'line-color': '#fbb03b',
            'line-dasharray': [0.2, 2],
            'line-width': 2
        }
    },
    {
        'id': 'gl-draw-polygon-and-line-vertex-stroke-inactive',
        'type': 'circle',
        'filter': ['all',
            ['==', 'meta', 'vertex'],
            ['==', '$type', 'Point'],
            ['!=', 'mode', 'static']
        ],
        'paint': {
            'circle-radius': 4,
            'circle-color': '#fff'
        }
    },
    {
        'id': 'gl-draw-polygon-and-line-vertex-inactive',
        'type': 'circle',
        'filter': ['all',
            ['==', 'meta', 'vertex'],
            ['==', '$type', 'Point'],
            ['!=', 'mode', 'static']
        ],
        'paint': {
            'circle-radius': 2,
            'circle-color': '#fbb03b'
        }
    },

    {
        'id': 'gl-draw-polygon-and-line-vertex-scale-icon',
        'type': 'symbol',
        'filter': ['all',
            ['==', 'meta', 'vertex'],
            ['==', '$type', 'Point'],
            ['!=', 'mode', 'static'],
            ['has', 'heading']
        ],
        'layout': {
            'icon-image': 'scale',
            'icon-allow-overlap': true,
            'icon-ignore-placement': true,
            'icon-rotation-alignment': 'map',
            'icon-rotate': ['get', 'heading']
        },
        'paint': {
            'icon-opacity': 1.0,
            'icon-opacity-transition': {
                'delay': 0,
                'duration': 0
            }
        }
    },


    {
        'id': 'gl-draw-point-point-stroke-inactive',
        'type': 'circle',
        'filter': ['all',
            ['==', 'active', 'false'],
            ['==', '$type', 'Point'],
            ['==', 'meta', 'feature'],
            ['!=', 'mode', 'static']
        ],
        'paint': {
            'circle-radius': 5,
            'circle-opacity': 1,
            'circle-color': '#fff'
        }
    },
    {
        'id': 'gl-draw-point-inactive',
        'type': 'circle',
        'filter': ['all',
            ['==', 'active', 'false'],
            ['==', '$type', 'Point'],
            ['==', 'meta', 'feature'],
            ['!=', 'mode', 'static']
        ],
        'paint': {
            'circle-radius': 3,
            'circle-color': '#3bb2d0'
        }
    },
    {
        'id': 'gl-draw-point-stroke-active',
        'type': 'circle',
        'filter': ['all',
            ['==', '$type', 'Point'],
            ['==', 'active', 'true'],
            ['!=', 'meta', 'midpoint']
        ],
        'paint': {
            'circle-radius': 4,
            'circle-color': '#fff'
        }
    },
    {
        'id': 'gl-draw-point-active',
        'type': 'circle',
        'filter': ['all',
            ['==', '$type', 'Point'],
            ['!=', 'meta', 'midpoint'],
            ['==', 'active', 'true']],
        'paint': {
            'circle-radius': 2,
            'circle-color': '#fbb03b'
        }
    },
    {
        'id': 'gl-draw-polygon-fill-static',
        'type': 'fill',
        'filter': ['all', ['==', 'mode', 'static'], ['==', '$type', 'Polygon']],
        'paint': {
            'fill-color': '#404040',
            'fill-outline-color': '#404040',
            'fill-opacity': 0.1
        }
    },
    {
        'id': 'gl-draw-polygon-stroke-static',
        'type': 'line',
        'filter': ['all', ['==', 'mode', 'static'], ['==', '$type', 'Polygon']],
        'layout': {
            'line-cap': 'round',
            'line-join': 'round'
        },
        'paint': {
            'line-color': '#404040',
            'line-width': 2
        }
    },
    {
        'id': 'gl-draw-line-static',
        'type': 'line',
        'filter': ['all', ['==', 'mode', 'static'], ['==', '$type', 'LineString']],
        'layout': {
            'line-cap': 'round',
            'line-join': 'round'
        },
        'paint': {
            'line-color': '#404040',
            'line-width': 2
        }
    },
    {
        'id': 'gl-draw-point-static',
        'type': 'circle',
        'filter': ['all', ['==', 'mode', 'static'], ['==', '$type', 'Point']],
        'paint': {
            'circle-radius': 5,
            'circle-color': '#404040'
        }
    },

    // {
    //     'id': 'gl-draw-polygon-rotate-point',
    //     'type': 'circle',
    //     'filter': ['all',
    //         ['==', '$type', 'Point'],
    //         ['==', 'meta', 'rotate_point']],
    //     'paint': {
    //         'circle-radius': 5,
    //         'circle-color': '#fbb03b'
    //     }
    // },

    {
        'id': 'gl-draw-line-rotate-point',
        'type': 'line',
        'filter': ['all',
            ['==', 'meta', 'midpoint'],
            ['==', '$type', 'LineString'],
            ['!=', 'mode', 'static']
            // ['==', 'active', 'true']
        ],
        'layout': {
            'line-cap': 'round',
            'line-join': 'round'
        },
        'paint': {
            'line-color': '#fbb03b',
            'line-dasharray': [0.2, 2],
            'line-width': 2
        }
    },
    {
        'id': 'gl-draw-polygon-rotate-point-stroke',
        'type': 'circle',
        'filter': ['all',
            ['==', 'meta', 'midpoint'],
            ['==', '$type', 'Point'],
            ['!=', 'mode', 'static']
        ],
        'paint': {
            'circle-radius': 4,
            'circle-color': '#fff'
        }
    },
    {
        'id': 'gl-draw-polygon-rotate-point',
        'type': 'circle',
        'filter': ['all',
            ['==', 'meta', 'midpoint'],
            ['==', '$type', 'Point'],
            ['!=', 'mode', 'static']
        ],
        'paint': {
            'circle-radius': 2,
            'circle-color': '#fbb03b'
        }
    },
    {
        'id': 'gl-draw-polygon-rotate-point-icon',
        'type': 'symbol',
        'filter': ['all',
            ['==', 'meta', 'midpoint'],
            ['==', '$type', 'Point'],
            ['!=', 'mode', 'static']
        ],
        'layout': {
            'icon-image': 'rotate',
            'icon-allow-overlap': true,
            'icon-ignore-placement': true,
            'icon-rotation-alignment': 'map',
            'icon-rotate': ['get', 'heading']
        },
        'paint': {
            'icon-opacity': 1.0,
            'icon-opacity-transition': {
                'delay': 0,
                'duration': 0
            }
        }
    },
];