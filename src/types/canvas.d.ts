// Type declaration for roundRect method
declare global {
  interface CanvasRenderingContext2D {
    roundRect(
      x: number,
      y: number,
      width: number,
      height: number,
      radius: number | number[]
    ): CanvasRenderingContext2D
  }
}

export {}
