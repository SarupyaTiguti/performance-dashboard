'use client';

import DataProvider from '@/components/providers/DataProvider';
import Dashboard from '@/components/Dashboard';

export default function Page() {
  return (
    <DataProvider>
      <Dashboard />
    </DataProvider>
  );
}
