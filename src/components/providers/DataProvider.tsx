'use client';
import React, { createContext, useContext, useMemo, useState, useEffect } from 'react';
import type { DataPoint } from '@/lib/types';
import { generateInitialDataset } from '@/lib/dataGenerator';

type ProviderValue = {
  data: DataPoint[];
  setData: (d: DataPoint[]) => void;
  timeWindowMs: number;
  setTimeWindowMs: (ms: number) => void;
};

const DataContext = createContext<ProviderValue | null>(null);

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used inside DataProvider');
  return ctx;
}

export default function DataProvider({
  initialData,
  children
}: {
  initialData?: DataPoint[];
  children: React.ReactNode;
}) {
  const [data, setData] = useState<DataPoint[]>(initialData ?? []);
  const [timeWindowMs, setTimeWindowMs] = useState<number>(60_000 * 5);

  useEffect(() => {
    if ((initialData == null || initialData.length === 0) && data.length === 0) {
      const generated = generateInitialDataset(10000);
      setData(generated);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = useMemo(() => ({ data, setData, timeWindowMs, setTimeWindowMs }), [data, timeWindowMs]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}
