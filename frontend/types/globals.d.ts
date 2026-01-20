/* eslint-disable @typescript-eslint/no-explicit-any */

// Global augmentations
declare global {
  interface Window {
    // Threebox instance stored on window for map integration
    tb: any;
  }
}

// Required for module augmentation to work
export {}
