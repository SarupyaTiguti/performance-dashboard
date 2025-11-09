// src/components/charts/LineChart.tsx
'use client';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useChartRenderer } from '@/hooks/useChartRenderer';
import type { DataPoint } from '@/lib/types';

/**
 * LineChart with pan & zoom.
 *
 * Controls:
 * - Drag (pointer) to pan left/right
 * - Wheel to zoom (centered on cursor)
 *
 * Implementation notes:
 * - Heavy state (pan/zoom center/span) stored in refs to avoid re-renders.
 * - getRenderData returns buckets only for current viewport.
 */

export default function LineChart({ data }: { data: DataPoint[] }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [devicePixelRatio, setDevicePixelRatio] = useState<number>(1);

  // Pan & zoom refs (time-domain)
  const zoomRef = useRef<number>(1); // 1 = full span. Larger = zoomed in.
  const centerTimeRef = useRef<number | null>(null); // center time of viewport
  const isPanningRef = useRef(false);
  const lastPanXRef = useRef<number | null>(null);

  useEffect(() => {
    setDevicePixelRatio(window.devicePixelRatio || 1);
  }, []);

  // Initialize centerTimeRef when data arrives
  useEffect(() => {
    if (data.length === 0) return;
    const len = data.length;
    const minT = data[0].timestamp;
    const maxT = data[len - 1].timestamp;
    if (centerTimeRef.current == null) {
      centerTimeRef.current = maxT; // default center on latest
    } else {
      // keep centerTime within data bounds
      const span = (maxT - minT) / Math.max(1, zoomRef.current);
      const minView = centerTimeRef.current - span / 2;
      const maxView = centerTimeRef.current + span / 2;
      if (minView < minT || maxView > maxT) {
        centerTimeRef.current = maxT;
      }
    }
  }, [data.length]);

  // Pointer handlers: pan (drag)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = () => canvas.getBoundingClientRect();

    const onPointerDown = (ev: PointerEvent) => {
      canvas.setPointerCapture(ev.pointerId);
      isPanningRef.current = true;
      lastPanXRef.current = ev.clientX;
    };

    const onPointerMove = (ev: PointerEvent) => {
      if (!isPanningRef.current) return;
      const lastX = lastPanXRef.current;
      if (lastX == null) return;
      const dx = ev.clientX - lastX;
      lastPanXRef.current = ev.clientX;

      // time-domain shift: dx pixels -> dt
      const r = rect();
      const w = r.width || 1;
      const len = data.length;
      if (len < 2) return;
      const minT = data[0].timestamp;
      const maxT = data[len - 1].timestamp;
      const totalSpan = Math.max(1, maxT - minT);
      const currentSpan = totalSpan / Math.max(1, zoomRef.current);
      const dt = -(dx / w) * currentSpan; // negative because dragging right should move timeline left
      centerTimeRef.current = (centerTimeRef.current ?? maxT) + dt;
      // clamp centerTime to data bounds
      centerTimeRef.current = Math.max(minT + currentSpan / 2, Math.min(maxT - currentSpan / 2, centerTimeRef.current));
    };

    const onPointerUp = (ev: PointerEvent) => {
      isPanningRef.current = false;
      lastPanXRef.current = null;
      try { canvas.releasePointerCapture(ev.pointerId); } catch {}
    };

    canvas.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    return () => {
      canvas.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };
  }, [data]);

  // Wheel handler: zoom centered on mouse
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const onWheel = (ev: WheelEvent) => {
      ev.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const x = ev.clientX - rect.left;
      const w = rect.width || 1;

      const len = data.length;
      if (len < 2) return;
      const minT = data[0].timestamp;
      const maxT = data[len - 1].timestamp;
      const totalSpan = Math.max(1, maxT - minT);

      // current viewport span in ms
      const curZoom = Math.max(0.05, Math.min(100, zoomRef.current));
      const currentSpan = totalSpan / curZoom;

      // mouse time in absolute timeline
      const mouseRatio = Math.max(0, Math.min(1, x / w));
      const mouseTime = (centerTimeRef.current ?? maxT) - currentSpan / 2 + mouseRatio * currentSpan;

      // zoom factor (wheel deltaY > 0 -> zoom out)
      const factor = Math.exp(-ev.deltaY * 0.0015); // tweak sensitivity
      let newZoom = curZoom * factor;
      newZoom = Math.max(0.05, Math.min(100, newZoom));
      const newSpan = totalSpan / newZoom;

      // adjust center so mouseTime stays under cursor
      const preOffset = (mouseTime - (centerTimeRef.current ?? maxT));
      const postOffset = preOffset * (newSpan / currentSpan); // scale offset
      centerTimeRef.current = mouseTime - postOffset;

      // clamp
      centerTimeRef.current = Math.max(minT + newSpan / 2, Math.min(maxT - newSpan / 2, centerTimeRef.current));

      zoomRef.current = newZoom;
    };

    canvas.addEventListener('wheel', onWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', onWheel);
  }, [data]);

  // getRenderData constructs visible buckets using centerTimeRef and zoomRef
  const getRenderData = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return [];
    const rect = canvas.getBoundingClientRect();
    const w = rect.width / (devicePixelRatio || 1);
    const h = rect.height / (devicePixelRatio || 1);
    if (w <= 0 || h <= 0) return [];

    const len = data.length;
    if (len === 0) return [];

    const minT = data[0].timestamp;
    const maxT = data[len - 1].timestamp;
    const totalSpan = Math.max(1, maxT - minT);

    const zoom = Math.max(0.05, Math.min(100, zoomRef.current));
    const viewSpan = totalSpan / zoom;

    // ensure centerTime is defined
    const centerTime = centerTimeRef.current ?? maxT;
    let viewMin = centerTime - viewSpan / 2;
    let viewMax = centerTime + viewSpan / 2;
    // clamp
    if (viewMin < minT) {
      viewMin = minT;
      viewMax = Math.min(minT + viewSpan, maxT);
    }
    if (viewMax > maxT) {
      viewMax = maxT;
      viewMin = Math.max(maxT - viewSpan, minT);
    }

    // collect data within viewport
    // binary search for start index (simple linear fallback here for simplicity)
    let startIndex = 0;
    while (startIndex < len && data[startIndex].timestamp < viewMin) startIndex++;
    let endIndex = startIndex;
    while (endIndex < len && data[endIndex].timestamp <= viewMax) endIndex++;
    if (startIndex >= endIndex) {
      // no data in range (very narrow) -> return one bucket
      return [{ t: centerTime, min: data[Math.max(0, len - 1)].value, max: data[Math.max(0, len - 1)].value }];
    }

    const visible = data.slice(Math.max(0, startIndex), Math.min(len, endIndex));
    const visibleLen = visible.length;

    // buckets = number of horizontal pixels (clamped)
    const targetBuckets = Math.max(200, Math.min(Math.floor(w), 1200));
    const bucketSize = Math.max(1, Math.floor(visibleLen / targetBuckets));

    const buckets: { t: number; min: number; max: number }[] = [];
    for (let i = 0; i < visibleLen; i += bucketSize) {
      const slice = visible.slice(i, i + bucketSize);
      let min = Infinity;
      let max = -Infinity;
      let tAvg = 0;
      for (const p of slice) {
        if (p.value < min) min = p.value;
        if (p.value > max) max = p.value;
        tAvg += p.timestamp;
      }
      tAvg /= slice.length;
      buckets.push({ t: tAvg, min, max });
    }

    return buckets;
  }, [data, devicePixelRatio]);

  useChartRenderer(canvasRef, getRenderData);

  // small UX hint overlay (optional) - indicate dragging cursor
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const onEnter = () => (canvas.style.cursor = 'grab');
    const onDown = () => (canvas.style.cursor = 'grabbing');
    const onUp = () => (canvas.style.cursor = 'grab');
    canvas.addEventListener('mouseenter', onEnter);
    window.addEventListener('pointerdown', onDown);
    window.addEventListener('pointerup', onUp);
    return () => {
      canvas.removeEventListener('mouseenter', onEnter);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
    };
  }, []);

  return <canvas ref={canvasRef} style={{ width: '100%', height: 380, display: 'block', touchAction: 'none' }} />;
}
