
// Point to percentages conversions
export function pointToPercentages(min, max, point) {
    const percentageX = point[0] / (max[0] - min[0]);
    const percentageY = point[1] / (max[1] - min[1]);
    return [percentageX, percentageY];
}

// Percentages to point conversations for mapping
export function percentagesToPoint(min, max, percentages) {
    const x = percentages[0] * (max[0] - min[0]);
    const y = percentages[1] * (max[1] - min[1]);
    return [x, y];
}

export function randomIntFromInterval(min, max) { // min and max included 
    return Math.floor(Math.random() * (max - min + 1) + min);
  }

export function getHeatmapConfig(id, source, visibility, type = 'calc', min = -140, max = -55) {
    return {
        'id': id,
        'type': 'heatmap',
        'source': source,
        // 'maxzoom': 9,
        'layout': {
            // Make the layer invisible by default.
            'visibility': visibility
        },
        'paint': {
            // Increase the heatmap weight based on frequency and property magnitude
            'heatmap-weight': [
                'interpolate',
                ['linear'],
                ['get', type],
                min,
                0,
                max,
                1
            ],
            // Increase the heatmap color weight weight by zoom level
            // heatmap-intensity is a multiplier on top of heatmap-weight
            // 'heatmap-intensity': [
            //     'interpolate',
            //     ['linear'],
            //     ['zoom'],
            //     0,
            //     1,
            //     15,
            //     3
            // ],
            'heatmap-intensity': 0.85,
            // Color ramp for heatmap.  Domain is 0 (low) to 1 (high).
            // Begin color ramp at 0-stop with a 0-transparancy color
            // to create a blur-like effect.
            'heatmap-color': [
                'interpolate',
                ['linear'],
                ['heatmap-density'],
                0,
                'rgba(0, 0, 0, 0)',
                0.01,
                'rgb(0, 0, 255)', // Blue
                0.33,
                'rgb(0, 128, 0)', // Green
                0.67,
                'rgb(255, 255, 0)', // Yellow
                1,
                'rgb(255, 0, 0)' // Red
            ],
            // Adjust the heatmap radius to look constant
            'heatmap-radius': {
                'base': 2,
                'stops': [[17, 2], [22, 64]]
            },
            'heatmap-opacity': 0.8
        }
    }
};


// Update color bar boundary values
export function updateColorBarBoundaryValues(min, max, unit) {
    const colorBarMax = document.getElementById('colorBarMax');
    const colorBarMin = document.getElementById('colorBarMin');
    colorBarMin.textContent = `${min} ${unit}`;
    colorBarMax.textContent = `${max} ${unit}`;
}