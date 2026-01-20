declare module 'threebox-plugin' {
  import type { Map as MapboxMap } from 'mapbox-gl'
  import type { Object3D } from 'three'

  interface ThreeboxOptions {
    defaultLights?: boolean
    enableSelectingObjects?: boolean
    enableDraggingObjects?: boolean
    enableRotatingObjects?: boolean
    enableTooltips?: boolean
  }

  interface LoadObjOptions {
    obj: string
    type: string
    scale?: { x: number; y: number; z: number }
    units?: string
    rotation?: { x: number; y: number; z: number }
    anchor?: string
  }

  interface ThreeboxModel extends Object3D {
    setCoords?: (coords: [number, number] | [number, number, number]) => void
    coordinates?: [number, number]
    object3d?: Object3D
  }

  // Basic Threebox class
  export class Threebox {
    constructor(map: MapboxMap, glContext: WebGLRenderingContext, options?: ThreeboxOptions);

    // Common methods
    update(): void;
    add(obj: Object3D): void;
    remove(obj: Object3D): void;
    loadObj(options: LoadObjOptions, callback: (model: ThreeboxModel) => void): void;

    // Add additional method declarations as needed
  }

  // Export any other classes, functions, or variables from the module
}
