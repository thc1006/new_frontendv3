// Point to percentages conversions
export function pointToPercentages(
  min: number[],
  max: number[],
  point: number[]
): number[] {
  if (max[0] == min[0]) max[0] += 1
  if (max[1] == min[1]) max[1] += 1
  const percentageX = point[0] / (max[0] - min[0]);
  const percentageY = point[1] / (max[1] - min[1]);
  return [percentageX, percentageY];
}

// Percentages to point conversations for mapping
export function percentagesToPoint(
  min: number[],
  max: number[],
  percentages: number[]
): number[] {
  const x = percentages[0] * (max[0] - min[0]);
  const y = percentages[1] * (max[1] - min[1]);
  return [x, y];
}

export function randomIntFromInterval(min: number, max: number): number { // min and max included 
  return Math.floor(Math.random() * (max - min + 1) + min);
}

interface HeatmapPaint {
  'heatmap-weight': [
    'interpolate',
    ['linear'],
    ['get', string],
    number, number,
    number, number
  ];
  'heatmap-intensity': number;
  'heatmap-color': [
    'interpolate',
    ['linear'],
    ['heatmap-density'],
    0, string,
    0.01, string,
    0.33, string,
    0.67, string,
    1, string
  ];
  'heatmap-radius': {
    base: number;
    stops: [number, number][];
  };
  'heatmap-opacity': number;
}

interface HeatmapConfig {
  id: string;
  type: string;
  source: string;
  layout: {
    visibility: string;
  };
  paint: HeatmapPaint;
}

export function getHeatmapConfig(
  id: string,
  source: string,
  visibility: string,
  type: string = 'calc',
  min: number = -140,
  max: number = -55
): HeatmapConfig {
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
export function updateColorBarBoundaryValues(
  min: number,
  max: number,
  unit: string
): void {
  const colorBarMax = document.getElementById('colorBarMax');
  const colorBarMin = document.getElementById('colorBarMin');
  if (colorBarMin) colorBarMin.textContent = `${min} ${unit}`;
  if (colorBarMax) colorBarMax.textContent = `${max} ${unit}`;
}