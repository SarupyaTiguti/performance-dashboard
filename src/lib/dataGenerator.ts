 // src/lib/dataGenerator.ts
 import { DataPoint } from "./types";

 export function generateInitialDataset(count = 10000): DataPoint[] {
   const data: DataPoint[] = new Array(count).fill(0).map((_, i) => {
     const t = Date.now() - (count - i) * 100; // 100ms steps
     return {
       timestamp: t,
       value: 50 + Math.sin(i / 100) * 25 + (Math.random() - 0.5) * 10,
       id: i
     };
   });
   return data;
 }
