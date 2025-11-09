// src/components/ui/DataTable.tsx
'use client';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { DataPoint } from '@/lib/types';

/**
 * DataTable: client-only render guard to avoid hydration mismatches caused by Date.toLocaleTimeString.
 * We only render the table after the component has mounted on the client.
 */

export default function DataTable({ data }: { data: DataPoint[] }) {
  const rowHeight = 28;
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const total = data.length;
  const height = 600;

  // Prevent server/client mismatch by rendering only after mount
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const visibleCount = Math.ceil(height / rowHeight);
  const startIndex = Math.max(0, Math.floor(scrollTop / rowHeight) - 5);
  const endIndex = Math.min(total, startIndex + visibleCount + 10);

  const visibleRows = useMemo(() => data.slice(startIndex, endIndex), [data, startIndex, endIndex]);

  if (!mounted) {
    // Render a placeholder box on server / before mount — avoids any Date formatting happening on server
    return <div style={{ height, border: '1px solid #333', borderRadius: 6, background: '#0b0b0b' }} />;
  }

  return (
    <div
      ref={viewportRef}
      onScroll={(e) => setScrollTop((e.target as HTMLDivElement).scrollTop)}
      style={{ height, overflow: 'auto', position: 'relative' }}
    >
      <div style={{ height: total * rowHeight, position: 'relative' }}>
        <div style={{ position: 'absolute', top: startIndex * rowHeight, left: 0, right: 0 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ position: 'sticky', top: 0, background: '#fafafa' }}>
              <tr>
                <th style={{ textAlign: 'left', padding: 6 }}>ID</th>
                <th style={{ textAlign: 'left', padding: 6 }}>Timestamp</th>
                <th style={{ textAlign: 'left', padding: 6 }}>Value</th>
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((r) => (
                <tr key={r.id ?? r.timestamp}>
                  <td style={{ padding: 6 }}>{r.id}</td>
                  <td style={{ padding: 6 }}>{new Date(r.timestamp).toLocaleTimeString()}</td>
                  <td style={{ padding: 6 }}>{r.value.toFixed(3)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
