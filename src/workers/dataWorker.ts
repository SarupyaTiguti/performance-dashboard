 // src/workers/dataWorker.ts
 import { DataPoint } from "../lib/types";

 type Msg =
   | { type: "start"; rate?: number; chunkSize?: number }
   | { type: "stop" }
   | { type: "setRate"; rate: number };

 let running = false;
 let rate = 100; // ms
 let chunkSize = 100; // points per tick
 let idCounter = 0;

 function makeChunk(): DataPoint[] {
   const now = Date.now();
   const chunk: DataPoint[] = new Array(chunkSize).fill(0).map((_, i) => {
     const ts = now + i;
     const v = 50 + Math.sin((idCounter + i) / 100) * 25 + (Math.random() - 0.5) * 10;
     return { timestamp: ts, value: v, id: idCounter + i };
   });
   idCounter += chunkSize;
   return chunk;
 }

 function loop() {
   if (!running) return;
   const chunk = makeChunk();
   (self as any).postMessage({ type: "chunk", payload: chunk });
   setTimeout(loop, rate);
 }

 (self as any).onmessage = (e: MessageEvent<Msg>) => {
   const msg = e.data;
   if (msg.type === "start") {
     rate = msg.rate ?? rate;
     chunkSize = msg.chunkSize ?? chunkSize;
     if (!running) {
       running = true;
       loop();
     }
   } else if (msg.type === "stop") {
     running = false;
   } else if (msg.type === "setRate") {
     rate = msg.rate;
   }
 };
