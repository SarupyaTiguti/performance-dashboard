 "use client";
 import React, { useEffect, useRef, useState } from "react";

 export default function PerformanceMonitor() {
   const rafRef = useRef<number | null>(null);
   const [fps, setFps] = useState(0);
   const [memory, setMemory] = useState<number | null>(null);

  useEffect(() => {
  let frames = 0;
  let lastTime = performance.now();

  const loop = (now: number) => {
    frames++;
    if (now - lastTime >= 1000) {
      setFps(frames);
      frames = 0;
      lastTime = now;
    }
    if ((performance as any).memory) {
      const mem = (performance as any).memory;
      setMemory(Math.round(mem.usedJSHeapSize / 1024 / 1024));
    } else {
      setMemory(null);
    }
    rafRef.current = requestAnimationFrame(loop);
  };

  rafRef.current = requestAnimationFrame(loop);
  return () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  };
}, []);


   return (
     <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
       <div style={{ fontWeight: 600 }}>FPS: {fps}</div>
       <div>Memory: {memory !== null ? `${memory} MB` : "n/a"}</div>
     </div>
   );
 }
