 "use client";
 import { useEffect, useRef } from "react";

 type RenderBucket = { t: number; min: number; max: number };

 export function useChartRenderer(canvasRef: React.RefObject<HTMLCanvasElement>, getRenderData: () => RenderBucket[]) {
   const rafRef = useRef<number | null>(null);

   useEffect(() => {
     const canvas = canvasRef.current;
     if (!canvas) return;
     const dpr = window.devicePixelRatio || 1;

     const setSize = () => {
       const rect = canvas.getBoundingClientRect();
       canvas.width = Math.round(rect.width * dpr);
       canvas.height = Math.round(rect.height * dpr);
     };
     setSize();

     const ctx = canvas.getContext("2d");
     if (!ctx) return;

     ctx.scale(dpr, dpr);

     let last = performance.now();

     const draw = (ts: number) => {
       last = ts;
       const rect = canvas.getBoundingClientRect();
       const w = rect.width;
       const h = rect.height;

       ctx.clearRect(0, 0, w, h);

       const buckets = getRenderData();
       if (!buckets || buckets.length === 0) {
         rafRef.current = requestAnimationFrame(draw);
         return;
       }

       let vMin = Infinity, vMax = -Infinity;
       for (const b of buckets) {
         if (b.min < vMin) vMin = b.min;
         if (b.max > vMax) vMax = b.max;
       }
       if (!isFinite(vMin) || !isFinite(vMax)) return;

       ctx.beginPath();
       for (let i = 0; i < buckets.length; i++) {
         const x = (i / (buckets.length - 1)) * w;
         const y = h - ((buckets[i].max - vMin) / (vMax - vMin)) * h;
         if (i === 0) ctx.moveTo(x, y);
         else ctx.lineTo(x, y);
       }
       ctx.lineTo(w, h);
       ctx.lineTo(0, h);
       ctx.closePath();
       ctx.fillStyle = "rgba(30,144,255,0.15)";
       ctx.fill();

       ctx.beginPath();
       ctx.lineWidth = 1.2;
       ctx.strokeStyle = "#1e90ff";
       for (let i = 0; i < buckets.length; i++) {
         const x = (i / (buckets.length - 1)) * w;
         const mid = (buckets[i].min + buckets[i].max) / 2;
         const y = h - ((mid - vMin) / (vMax - vMin)) * h;
         if (i === 0) ctx.moveTo(x, y);
         else ctx.lineTo(x, y);
       }
       ctx.stroke();

       rafRef.current = requestAnimationFrame(draw);
     };

     rafRef.current = requestAnimationFrame(draw);

     const onResize = () => setSize();
     window.addEventListener("resize", onResize);

     return () => {
       if (rafRef.current) cancelAnimationFrame(rafRef.current);
       window.removeEventListener("resize", onResize);
     };
   }, [canvasRef, getRenderData]);
 }
