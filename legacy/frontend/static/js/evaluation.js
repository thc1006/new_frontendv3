import { randomIntFromInterval } from "./utils.js";
import { pointToPercentages, percentagesToPoint } from "./utils.js";
import { getHeatmapConfig } from "./utils.js";

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
let myModel;
let showOptions = false;
let ruMarkers = [];
var plotData = [];

// Elements
const simulateList = document.getElementById("simulateList");
const configContainer = document.getElementById("configContainer");
const currentCase = document.getElementById("currentCase");
const cloneButton = document.getElementById("cloneButton");
const deleteButton = document.getElementById("deleteButton");
const btnSet = document.getElementById("btnSet");
const btnAddRU = document.getElementById("btnAddRU");
const btnEval = document.getElementById("btnEval");
const btnApplyConfig = document.getElementById("btnApplyConfig");
const inputRUNumber = document.getElementById("RU_number");
const colorBar = document.getElementById("colorBarContainer");

// Clear all RUs
function clearRU() {
  ruMarkers.forEach((ru) => ru.marker.remove());
  ruMarkers = [];
}

function handleSimulationSelect(elem) {
  let RU_manufacturer;
  let RU_number;
  // If 'New Case' is selected, set default value
  if (elem.classList.contains("btnCrt")) {
    RU_manufacturer = "WiSDON";
    RU_number = 0;
  } else {
    let key = Object.keys(simulations).find(
      (key) => simulations[key].simulationID == elem.id
    ); // Search simulations[] to get data
    RU_manufacturer = simulations[key].RU_manufacturer;
    RU_number = simulations[key].RU_positions.length;
  }
  const event = new CustomEvent("simulateSelect", {
    detail: {
      name: elem.textContent,
      RU_manufacturer: RU_manufacturer,
      RU_number: RU_number,
    },
  });
  currentCase.dispatchEvent(event); // Simulation selected event
}

let simulationID; // Save the simulationID of the current selected simulation

function handleCaseSelectEvent(e) {
  // Copy from gnb config
  if (!showOptions) {
    showOptions = true;
    configContainer.classList.remove("collapse");
  }

  // Show the data in the right hand side block
  currentCase.textContent = e.detail.name;
  document.getElementById("RU_manufacturer").value = e.detail.RU_manufacturer;
  inputRUNumber.value = e.detail.RU_number;

  // Show buttons depending on new or existing case
  if (currentCase.textContent == "New Case") {
    deleteButton.classList.add("collapse");
    cloneButton.classList.add("collapse");
    btnApplyConfig.classList.add("collapse");
  } else {
    deleteButton.classList.remove("collapse");
    cloneButton.classList.remove("collapse");
    btnApplyConfig.classList.remove("collapse");
  }

  // Clear all RUs
  clearRU();

  simulationID = Number(e.detail.name); // simulationID of the current selected simulation
  const key = Object.keys(simulations).find(
    (key) => Number(simulations[key].simulationID) === simulationID
  ); // Search simulations[]

  // If 'key' is not undefined which means an exsiting simulation is selected, not 'New Case'
  if (key) {
    if (map.getLayer("heatmapLayer")) {
      // Remove heatmap
      map.removeLayer("heatmapLayer");
      map.removeSource("heatmapSource");
      colorBar.classList.add("collapse");
    }

    // Set RUs to the map (RU position data from simulations[key])
    simulations[key].RU_positions.forEach((pos) => {
      const ruMarker = new mapboxgl.Marker({ draggable: true })
        .setLngLat([pos.location_x, pos.location_y])
        .addTo(map);

      const ru = {
        id: Date.now(),
        marker: ruMarker,
        coordinates: ruMarker.getLngLat(),
      };

      ruMarkers.push(ru);

      // handle RU draggable
      ruMarker.on("dragend", () => {
        const lngLat = ruMarker.getLngLat();
        ru.coordinates = lngLat;
      });
    });

    // Heatmap code copy from map js
    // Update heatmap
    const heatmapData = simulations[key].heatmap;

    // Convert heatmap data to GeoJSON format
    var heatmapGeoJSON = {
      type: "FeatureCollection",
      features: [],
    };
    let xArray = [];
    let yArray = [];
    for (let i in heatmapData) {
      let pointData = heatmapData[i];
      xArray.push(pointData["ms_x"]);
      yArray.push(pointData["ms_y"]);
      // Get max of 5 router rsrp strengths and subtract 35
      const calc =
        Math.max(
          pointData["RU5"],
          pointData["RU6"],
          pointData["RU9"],
          pointData["RU11"],
          pointData["RU12"]
        ) - 35;
      let point = {
        type: "Feature",
        properties: {
          ru5: pointData["RU5"],
          ru6: pointData["RU6"],
          ru9: pointData["RU9"],
          ru11: pointData["RU11"],
          ru12: pointData["RU12"],
          calc: calc,
        },
        geometry: {
          type: "Point",
          coordinates: [],
        },
      };
      heatmapGeoJSON.features.push(point);
    }

    // Mapping heatmap to image coordinates
    const minPoint = [
      Math.floor(Math.min(...xArray)),
      Math.floor(Math.min(...yArray)),
    ];
    const maxPoint = [
      Math.ceil(Math.max(...xArray)),
      Math.ceil(Math.max(...yArray)),
    ];
    for (let i in xArray) {
      // Mapping
      const percentages = pointToPercentages(minPoint, maxPoint, [
        xArray[i] - minPoint[0],
        yArray[i] - minPoint[1],
      ]);
      const point = percentagesToPoint(bboxMin, bboxMax, percentages);
      // Offset from center
      const offsetX = point[0] + bboxMin[0];
      const offsetY = point[1] + bboxMin[1];
      // Rotate
      const rotatedX =
        offsetX * rotation.elements[0] + offsetY * rotation.elements[4];
      const rotatedY =
        offsetX * rotation.elements[1] + offsetY * rotation.elements[5];
      // Get offsets in mercator unit
      const calcX = rotatedX * imgMerc.meterInMercatorCoordinateUnits();
      const calcY = rotatedY * imgMerc.meterInMercatorCoordinateUnits();
      const merc = new mapboxgl.MercatorCoordinate(
        imgMerc.x + calcX,
        imgMerc.y - calcY,
        imgMerc.z
      );
      const coords = merc.toLngLat();
      heatmapGeoJSON.features[i].geometry.coordinates = [
        coords.lng,
        coords.lat,
      ];
    }

    // Add new heatmap layer
    map.addSource("heatmapSource", {
      type: "geojson",
      data: heatmapGeoJSON,
    });

    map.addLayer(getHeatmapConfig("heatmapLayer", "heatmapSource", "visible"));
    colorBar.classList.remove("collapse");
  } else {
    // else 'key' is undefined, which means 'New Case' is selected
    // Remove heatmap
    if (map.getLayer("heatmapLayer")) {
      map.removeLayer("heatmapLayer");
      map.removeSource("heatmapSource");
      colorBar.classList.add("collapse");
    }
  }

  // Map resize, copy from map js
  map.resize();
  map.fitBounds(bboxFit, { duration: 1000, padding: 100 }); // Zooming animation duration 1000 ms = 1 sec
}

// When a brand new case is created, call this function to append new button in the left hand side block
function createCaseButton(simulateID) {
  var button = document.createElement("button");
  button.type = "button";
  button.id = simulateID;
  button.className = "list-group-item list-group-item-action";
  button.textContent = simulateID;
  button.addEventListener("click", () => handleSimulationSelect(button));
  simulateList.insertBefore(button, simulateList.querySelector(".btnCrt")); // Find 'New Case' and insert before
}

// When deleting a case, call this function to remove its button in the left hand side block
function removeCaseButton(simulateID) {
  const button = simulateList.querySelector(`[id='${simulateID}']`); // Find 'New Case' and insert before
  button.remove();
}

// Get RU position from RUs array, only called when preparing data in ajax
function getCoordinateList() {
  return ruMarkers.map((ru) => ({
    location_x: ru.coordinates.lng,
    location_y: ru.coordinates.lat,
  }));
}

for (let elem of document.getElementsByClassName(
  "list-group-item list-group-item-action"
)) {
  elem.addEventListener("click", () => handleSimulationSelect(elem));
}

currentCase.addEventListener("simulateSelect", handleCaseSelectEvent);

function evaluateResponseFunction(response, data) {
  console.log(response);
  simulationID = response.simulationID;
  // If response.simulationID not exist, which means a brand new simulation
  if (!simulations[response.simulationID]) {
    createCaseButton(response.simulationID);
  }
  // Update local data
  simulations[response.simulationID] = {
    simulationID: response.simulationID,
    RU_manufacturer: document.getElementById("RU_manufacturer").value,
    RU_positions: data.RU_positions,
    heatmap: response.heatmap,
  };
  // Update display information
  currentCase.textContent = response.simulationID;
  inputRUNumber.value = data.RU_positions.length;
  // To update heatmap, remove heatmap first
  if (map.getLayer("heatmapLayer")) {
    map.removeLayer("heatmapLayer");
    map.removeSource("heatmapSource");
    colorBar.classList.add("collapse");
  }
  // Update heatmap, copy from map js
  // Update heatmap
  const heatmapData = response.heatmap;

  // Convert heatmap data to GeoJSON format
  var heatmapGeoJSON = {
    type: "FeatureCollection",
    features: [],
  };
  let xArray = [];
  let yArray = [];
  for (let i in heatmapData) {
    let pointData = heatmapData[i];
    xArray.push(pointData["ms_x"]);
    yArray.push(pointData["ms_y"]);
    // Get max of 5 router rsrp strengths and subtract 35
    const calc =
      Math.max(
        pointData["RU5"],
        pointData["RU6"],
        pointData["RU9"],
        pointData["RU11"],
        pointData["RU12"]
      ) - 35;
    let point = {
      type: "Feature",
      properties: {
        ru5: pointData["RU5"],
        ru6: pointData["RU6"],
        ru9: pointData["RU9"],
        ru11: pointData["RU11"],
        ru12: pointData["RU12"],
        calc: calc,
      },
      geometry: {
        type: "Point",
        coordinates: [],
      },
    };
    heatmapGeoJSON.features.push(point);
  }

  // Mapping heatmap to image coordinates
  const minPoint = [
    Math.floor(Math.min(...xArray)),
    Math.floor(Math.min(...yArray)),
  ];
  const maxPoint = [
    Math.ceil(Math.max(...xArray)),
    Math.ceil(Math.max(...yArray)),
  ];
  for (let i in xArray) {
    // Mapping
    const percentages = pointToPercentages(minPoint, maxPoint, [
      xArray[i] - minPoint[0],
      yArray[i] - minPoint[1],
    ]);
    const point = percentagesToPoint(bboxMin, bboxMax, percentages);
    // Offset from center
    const offsetX = point[0] + bboxMin[0];
    const offsetY = point[1] + bboxMin[1];
    // Rotate
    const rotatedX =
      offsetX * rotation.elements[0] + offsetY * rotation.elements[4];
    const rotatedY =
      offsetX * rotation.elements[1] + offsetY * rotation.elements[5];
    // Get offsets in mercator unit
    const calcX = rotatedX * imgMerc.meterInMercatorCoordinateUnits();
    const calcY = rotatedY * imgMerc.meterInMercatorCoordinateUnits();
    const merc = new mapboxgl.MercatorCoordinate(
      imgMerc.x + calcX,
      imgMerc.y - calcY,
      imgMerc.z
    );
    const coords = merc.toLngLat();
    heatmapGeoJSON.features[i].geometry.coordinates = [coords.lng, coords.lat];
  }

  // Add new heatmap layer
  map.addSource("heatmapSource", {
    type: "geojson",
    data: heatmapGeoJSON,
  });

  map.addLayer(getHeatmapConfig("heatmapLayer", "heatmapSource", "visible"));
  colorBar.classList.remove("collapse");

  // Push to plotData
  plotData.push({
    case: response.simulationID,
    throughput: randomIntFromInterval(1, 10),
  });
  // Redo plot
  drawBarChart();
}

function evaluate() {
  let data = {
    type: "simulate",
    RU_manufacturer: document.getElementById("RU_manufacturer").value,
    RU_positions: getCoordinateList(),
  };

  // If 'New Case', set simulationID to '0'
  // If not 'New Case', get the selected simulationID
  if (currentCase.textContent == "New Case") {
    simulationID = 0;
  }
  data.simulationID = simulationID;

  console.log(data);

  currentCase.textContent = "Heatmap is generating..."; // When ajax not response yet

  $.ajax({
    URL: window.location.href,
    data: JSON.stringify(data),
    type: "POST",
    dataType: "json",
    contentType: "application/json",
    success: function (response) {
      evaluateResponseFunction(response, data);
      deleteButton.classList.remove("collapse");
      cloneButton.classList.remove("collapse");
      btnApplyConfig.classList.remove("collapse");
    },
  });
}

// Evaluate button
btnEval.addEventListener("click", evaluate);

// Replace current config with evaluation config
btnApplyConfig.addEventListener("click", function () {
  // Evaluate first
  evaluate();
  let data = {
    type: "save",
    simulationID: JSON.stringify(simulationID),
  };
  console.log(data);
  $.ajax({
    URL: window.location.href,
    data: JSON.stringify(data),
    type: "POST",
    dataType: "json",
    contentType: "application/json",
    success: function () {
      window.location.href = `../overview/${PID}`;
    },
  });
});

// Add one RU
function addRU() {
  const ruMarker = new mapboxgl.Marker({ draggable: true })
    .setLngLat(center) // Add to center
    .addTo(map);

  const ru = {
    id: Date.now(),
    marker: ruMarker,
    coordinates: ruMarker.getLngLat(),
  };

  ruMarkers.push(ru);

  ruMarker.on("dragend", () => {
    const lngLat = ruMarker.getLngLat();
    ru.coordinates = lngLat;
  });
}

// Set RU button
btnSet.addEventListener("click", function () {
  // Clear all RUs
  clearRU();

  // Add k number of RU
  const k = parseInt(inputRUNumber.value, 10);
  for (let i = 0; i < k; i++) {
    addRU();
  }
});

// Add RU button
btnAddRU.addEventListener("click", function () {
  inputRUNumber.value = parseInt(inputRUNumber.value) + 1;
  addRU();
});

// Delete button
deleteButton.addEventListener("click", function () {
  let data = {
    type: "delete",
  };

  // If 'New Case', illegal operation
  if (currentCase.textContent == "New Case") {
    return;
  }
  data.simulationID = String(simulationID);

  console.log(data);

  $.ajax({
    URL: window.location.href,
    data: JSON.stringify(data),
    type: "POST",
    dataType: "json",
    contentType: "application/json",
    success: function (response) {
      // Return to initial look
      currentCase.textContent = "EVALUATION";
      showOptions = false;
      configContainer.classList.add("collapse");
      deleteButton.classList.add("collapse");
      cloneButton.classList.add("collapse");
      btnApplyConfig.classList.add("collapse");
      // Clean up
      delete simulations[simulationID];
      plotData.splice(
        plotData.findIndex((x) => x.case == simulationID),
        1
      );
      drawBarChart();
      removeCaseButton(simulationID);
    },
  });
});

// Clone button
cloneButton.addEventListener("click", function () {
  let data = {
    type: "simulate",
    RU_manufacturer: document.getElementById("RU_manufacturer").value,
    RU_positions: getCoordinateList(),
  };

  // Clone to new case
  data.simulationID = 0;

  console.log(data);

  currentCase.textContent = "Heatmap is generating..."; // When ajax not response yet

  $.ajax({
    URL: window.location.href,
    data: JSON.stringify(data),
    type: "POST",
    dataType: "json",
    contentType: "application/json",
    success: function (response) {
      evaluateResponseFunction(response, data);
    },
  });
});

// Code below copy from map js
mapboxgl.accessToken =
  "pk.eyJ1IjoiZGFyaXVzbHVuZyIsImEiOiJjbHk3MWhvZW4wMTl6MmlxMnVhNzI3cW0yIn0.WGvtamOAfwfk3Ha4KsL3BQ";

// Map initialization
const map = new mapboxgl.Map({
  container: "mapContainer",
  style: "mapbox://styles/mapbox/streets-v12",
  center: center,
  zoom: 4,
});

// Threebox integration
const tb = (window.tb = new Threebox(map, map.getCanvas().getContext("webgl"), {
  defaultLights: true,
}));

map.on("style.load", () => {
  // Show 3d model
  map.addLayer({
    id: "custom-threebox-model",
    type: "custom",
    renderingMode: "3d",
    onAdd: function () {
      // Creative Commons License attribution:  Metlife Building model by https://sketchfab.com/NanoRay
      // https://sketchfab.com/3d-models/metlife-building-32d3a4a1810a4d64abb9547bb661f7f3
      const scale = 1;
      // Three.js only loads from URL, base64 URI faster than blob
      const url = btoa(modelData.image);
      const coordinates = [
        modelData.position.coordinates.lng,
        modelData.position.coordinates.lat,
      ];
      const options = {
        obj: "data:text/plain;base64," + url,
        type: "gltf",
        scale: { x: scale, y: scale, z: scale },
        units: "meters",
        rotation: { x: 90, y: 0, z: 0 },
        anchor: "center",
      };

      tb.loadObj(options, (model) => {
        myModel = model;
        myModel.setCoords(coordinates);
        const rotation = new THREE.Matrix4().fromArray(
          modelData.position.rotation
        );
        myModel.setRotationFromMatrix(rotation);
        tb.add(myModel);
      });
    },

    render: function () {
      tb.update();
    },
  });
});

// Plot with D3
for (let i in simulations) {
  plotData.push({
    case: simulations[i].simulationID,
    throughput: randomIntFromInterval(1, 10),
  });
}
const throughputPlot = document.getElementById("throughputPlot");
function drawBarChart() {
  const plot = Plot.plot({
    margin: 40,
    marginLeft: 40,
    x: { label: "Case", type: "band" },
    y: { label: "Throughput" },
    marks: [Plot.barY(plotData, { x: "case", y: "throughput" })],
  });
  throughputPlot.replaceChildren(plot);
  return;
}
drawBarChart();
