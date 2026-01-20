/* eslint-disable @typescript-eslint/no-explicit-any */

// Ambient module declaration for threebox-plugin
// This file must NOT have any exports to work as an ambient declaration
declare module 'threebox-plugin' {
  // Threebox library doesn't have proper TypeScript definitions
  // Using any for flexibility with the dynamic model objects
  export class Threebox {
    constructor(map: any, glContext: WebGLRenderingContext, options?: any);
    update(): void;
    add(obj: any): void;
    remove(obj: any): void;
    loadObj(options: any, callback: (model: any) => void): void;
    camera: any;
    scene: any;
  }
}
