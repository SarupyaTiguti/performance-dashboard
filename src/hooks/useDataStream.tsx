 "use client";
 import { useEffect, useRef, useState } from "react";
 import type { DataPoint } from "@/lib/types";

 type WorkerMessage = { type: "chunk"; payload: DataPoint[] };

 export function useDataStream(initial: DataPoint[]) {
   const [data, setData] = useState<DataPoint[]>(initial);
   const workerRef = useRef<Worker | null>(null);

   useEffect(() => {
     workerRef.current = new Worker(new URL("../workers/dataWorker.ts", import.meta.url), { type: "module" });

     workerRef.current.onmessage = (ev: MessageEvent<WorkerMessage>) => {
       const msg = ev.data;
       if (msg.type === "chunk") {
         setData(prev => {
           const merged = prev.concat(msg.payload);
           const maxWindow = 20000;
           if (merged.length > maxWindow) return merged.slice(merged.length - maxWindow);
           return merged;
         });
       }
     };

     workerRef.current.postMessage({ type: "start", rate: 100, chunkSize: 200 });

     return () => {
       if (workerRef.current) {
         workerRef.current.postMessage({ type: "stop" });
         workerRef.current.terminate();
         workerRef.current = null;
       }
     };
   }, []);

   const setRate = (r: number) => {
     workerRef.current?.postMessage({ type: "setRate", rate: r });
   };

   return { data, setRate };
 }
