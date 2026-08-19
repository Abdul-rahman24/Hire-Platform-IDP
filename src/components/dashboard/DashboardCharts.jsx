import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, Sector
} from 'recharts';
import { motion } from 'framer-motion';

const COLORS = ['#0B4A99', '#10B981', '#F59E0B', '#6366F1', '#EC4899'];

const renderActiveShape = (props) => {
  const RADIAN = Math.PI / 180;
  const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
  const sin = Math.sin(-RADIAN * midAngle);
  const cos = Math.cos(-RADIAN * midAngle);
  
  // 1. GPU-accelerated explosion distance
  const pushOut = 8; 

  // 2. Line coordinates (relative to center)
  const sx = cx + (outerRadius) * cos;
  const sy = cy + (outerRadius) * sin;
  const mx = cx + (outerRadius + 8) * cos;
  const my = cy + (outerRadius + 8) * sin;
  const ex = mx + (cos >= 0 ? 1 : -1) * 10;
  const ey = my;
  const textAnchor = cos >= 0 ? 'start' : 'end';

  return (
    <motion.g
      initial={{ x: 0, y: 0, scale: 1 }}
      animate={{ x: cos * pushOut, y: sin * pushOut, scale: 1.05 }}
      transition={{ type: "tween", ease: "easeOut", duration: 0.35 }}
      style={{ transformOrigin: `${cx}px ${cy}px`, pointerEvents: 'none' }}
      className="drop-shadow-lg"
    >
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 5}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <motion.path 
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} 
        stroke={fill} 
        fill="none" 
        strokeWidth={2.5} 
      />
      <motion.circle 
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, duration: 0.2 }}
        cx={ex} cy={ey} r={3.5} fill={fill} stroke="none" 
      />
      <motion.text 
        initial={{ opacity: 0, x: ex + (cos >= 0 ? -10 : 10) }}
        animate={{ opacity: 1, x: ex + (cos >= 0 ? 1 : -1) * 10 }}
        transition={{ delay: 0.15, duration: 0.3 }}
        y={ey - 3} textAnchor={textAnchor} fill="#1E293B" fontSize={11} fontWeight={800}
      >
        {payload.name}
      </motion.text>
      <motion.text 
        initial={{ opacity: 0, x: ex + (cos >= 0 ? -10 : 10) }}
        animate={{ opacity: 1, x: ex + (cos >= 0 ? 1 : -1) * 10 }}
        transition={{ delay: 0.25, duration: 0.3 }}
        y={ey + 12} textAnchor={textAnchor} fill="#64748b" fontSize={10} fontWeight={600}
      >
        {`${value} (${(percent * 100).toFixed(1)}%)`}
      </motion.text>
    </motion.g>
  );
};

export function DashboardPerformanceChart({ data, loading }) {
  if (loading) {
    return (
      <div className="w-full h-[300px] bg-slate-50 animate-pulse rounded-xl flex items-center justify-center">
        <div className="text-slate-300 font-semibold text-sm">Loading Chart...</div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="w-full h-[300px] bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100 dashed">
        <div className="text-slate-400 font-semibold text-sm">No performance data available.</div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="w-full h-[300px] cursor-pointer"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          barGap={2}
          barSize={10}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
          <XAxis 
            dataKey="testName"
            type="category"
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }}
            tickFormatter={(value) => value.length > 10 ? `${value.substring(0, 10)}...` : value}
          />
          <YAxis 
            type="number"
            domain={[0, 100]}
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }}
            tickFormatter={(value) => `${value}%`}
          />
          <RechartsTooltip 
            cursor={{ fill: '#f1f5f9' }}
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="bg-white/90 backdrop-blur-md text-slate-800 text-xs font-bold px-3.5 py-2.5 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-200/50">
                    <p className="mb-1.5 text-slate-500 font-extrabold uppercase tracking-tight text-[10px]">{label}</p>
                    <p className="text-emerald-600 mb-0.5">{`Pass Rate: ${payload[0]?.value?.toFixed(1) || 0}%`}</p>
                    <p className="text-red-500 mb-0.5">{`Fail Rate: ${payload[1]?.value?.toFixed(1) || 0}%`}</p>
                    <p className="text-[#0B4A99]">{`Avg Score: ${payload[2]?.value?.toFixed(1) || 0}%`}</p>
                  </div>
                );
              }
              return null;
            }} 
          />
          <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 600, color: '#475569' }} />
          <Bar dataKey="passRate" name="Pass Rate" fill="#10B981" radius={[4, 4, 0, 0]} />
          <Bar dataKey="failRate" name="Fail Rate" fill="#EF4444" radius={[4, 4, 0, 0]} />
          <Bar dataKey="avgScorePct" name="Avg Score" fill="#0B4A99" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </motion.div>
  );
}

export function DashboardDonutChart({ data, loading }) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (loading) {
    return (
      <div className="w-full h-[330px] bg-slate-50 animate-pulse rounded-xl flex items-center justify-center">
        <div className="text-slate-300 font-semibold text-sm">Loading Chart...</div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="w-full h-[330px] bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100 dashed">
        <div className="text-slate-400 font-semibold text-sm">No question set data available.</div>
      </div>
    );
  }

  const onPieEnter = (_, index) => {
    setActiveIndex(index);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="w-full h-[330px] cursor-pointer"
    >
      <ResponsiveContainer width="100%" height="100%">
        <PieChart style={{ overflow: 'visible' }}>
          <Pie
            activeIndex={activeIndex}
            activeShape={renderActiveShape}
            data={data}
            cx="50%"
            cy="40%"
            innerRadius="30%"
            outerRadius="44%"
            paddingAngle={5}
            dataKey="value"
            stroke="none"
            onMouseEnter={onPieEnter}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} className="transition-all duration-300 outline-none" />
            ))}
          </Pie>

          <Legend 
            verticalAlign="bottom" 
            height={40} 
            iconType="circle"
            wrapperStyle={{ fontSize: '11px', fontWeight: 600, color: '#475569', paddingTop: '15px' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </motion.div>
  );
}

export function DashboardFunnelChart({ data, loading }) {
  if (loading) {
    return (
      <div className="w-full h-[330px] bg-slate-50 animate-pulse rounded-xl flex items-center justify-center">
        <div className="text-slate-300 font-semibold text-sm">Loading Chart...</div>
      </div>
    );
  }

  if (!data || data.length === 0 || data.every(d => d.value === 0)) {
    return (
      <div className="w-full h-[330px] bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100 dashed">
        <div className="text-slate-400 font-semibold text-sm">No funnel data available.</div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="w-full h-[330px] relative cursor-pointer"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 20, right: 10, left: -20, bottom: 0 }}
          barGap={2}
          barSize={8}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
          <XAxis 
            dataKey="testName" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }} 
            tickFormatter={(value) => value && value.length > 10 ? `${value.substring(0, 10)}...` : value}
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }} 
          />
          <RechartsTooltip 
            cursor={{ fill: '#f1f5f9' }}
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="bg-white/90 backdrop-blur-md text-slate-800 text-xs font-bold px-3.5 py-2.5 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-200/50">
                    <p className="mb-1.5 text-slate-500 font-extrabold uppercase tracking-tight text-[10px]">{label}</p>
                    <p className="text-[#0B4A99] mb-0.5">{`Attended: ${payload[0]?.value || 0}`}</p>
                    <p className="text-emerald-600 mb-0.5">{`Completed: ${payload[1]?.value || 0}`}</p>
                    <p className="text-red-500">{`Terminated: ${payload[2]?.value || 0}`}</p>
                  </div>
                );
              }
              return null;
            }} 
          />
          <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 600, color: '#475569' }} />
          <Bar dataKey="attended" name="Attended" fill="#0B4A99" radius={[4, 4, 0, 0]} />
          <Bar dataKey="completed" name="Completed" fill="#10B981" radius={[4, 4, 0, 0]} />
          <Bar dataKey="totalTerminated" name="Terminated" fill="#EF4444" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
