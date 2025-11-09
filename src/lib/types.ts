 // src/lib/types.ts
 export interface DataPoint {
   timestamp: number; // ms
   value: number;
   id?: number;
 }

 export interface ChartViewport {
   width: number;
   height: number;
   xMin: number;
   xMax: number;
   yMin: number;
   yMax: number;
 }
