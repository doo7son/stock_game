import React from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-card" style={{ padding: '1rem', border: '1px solid rgba(255,255,255,0.2)' }}>
        <p className="text-muted" style={{ marginBottom: '0.5rem' }}>{payload[0].payload.fullTime}</p>
        <p style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>
          ${payload[0].value.toFixed(2)}
        </p>
      </div>
    );
  }
  return null;
};

export default function StockChart({ data, color = "#3b82f6" }) {
  if (!data || data.length === 0) {
    return <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading chart data...</div>;
  }

  // Determine min and max for Y-axis scaling
  const min = Math.min(...data.map(d => d.close));
  const max = Math.max(...data.map(d => d.close));
  const domainPadding = (max - min) * 0.1;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="colorClose" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
            <stop offset="95%" stopColor={color} stopOpacity={0}/>
          </linearGradient>
        </defs>
        <XAxis 
          dataKey="time" 
          axisLine={false}
          tickLine={false}
          tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
          minTickGap={30}
        />
        <YAxis 
          domain={[min - domainPadding, max + domainPadding]} 
          axisLine={false}
          tickLine={false}
          tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
          tickFormatter={(val) => `$${val.toFixed(0)}`}
          orientation="right"
        />
        <Tooltip content={<CustomTooltip />} />
        <Area 
          type="monotone" 
          dataKey="close" 
          stroke={color} 
          strokeWidth={3}
          fillOpacity={1} 
          fill="url(#colorClose)" 
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
