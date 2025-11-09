 "use client";
 import React from "react";
 import { useDataStream } from "@/hooks/useDataStream";
 import { useData } from "@/components/providers/DataProvider";
 import LineChart from "@/components/charts/LineChart";
 import DataTable from "@/components/ui/DataTable";
 import PerformanceMonitor from "@/components/ui/PerformanceMonitor";

 export default function Dashboard() {
   const { data: providerData } = useData();
   const { data: streamData, setRate } = useDataStream(providerData);

   return (
     <div style={{ display: "grid", gridTemplateColumns: "1fr 420px", gap: 16, padding: 16 }}>
       <div>
         <div style={{ height: 420, border: "1px solid #333", borderRadius: 6, padding: 8 }}>
           <LineChart data={streamData} />
         </div>
         <div style={{ marginTop: 8 }}>
           <PerformanceMonitor />
           <div style={{ marginTop: 8 }}>
             <label>Stream rate (ms): </label>
             <input type="range" min={20} max={1000} defaultValue={100} onChange={(e) => setRate(Number(e.target.value))} />
           </div>
         </div>
       </div>

       <div>
         <div style={{ marginBottom: 8, fontWeight: 600 }}>Data Table (virtualized)</div>
         <div style={{ height: 600, border: "1px solid #333", borderRadius: 6 }}>
           <DataTable data={streamData} />
         </div>
       </div>
     </div>
   );
 }
