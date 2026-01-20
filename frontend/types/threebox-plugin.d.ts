declare module 'threebox-plugin' {
  // Basic Threebox class
  export class Threebox {
    constructor(map: any, glContext: any, options: any);
    
    // Common methods
    update(): void;
    add(obj: any): any;
    loadObj(options: any, callback: (model: any) => void): void;
    
    // Add additional method declarations as needed
  }
  
  // Export any other classes, functions, or variables from the module
}
