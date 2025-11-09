// src/app/dashboard/page.tsx
'use client';

import DataProvider from '@/components/providers/DataProvider';
import Dashboard from '@/components/Dashboard';

export default function Page() {
  return (
    <html>
      <body>
        <DataProvider>
          <Dashboard />
        </DataProvider>
      </body>
    </html>
  );
}
