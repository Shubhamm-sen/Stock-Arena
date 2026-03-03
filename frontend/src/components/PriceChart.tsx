import React, { useState } from 'react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, BarChart, Bar, ReferenceLine
} from 'recharts';
import { PricePoint } from '../types';

interface PriceChartProps {
    data: PricePoint[];
    ticker: string;
}

export const PriceChart: React.FC<PriceChartProps> = ({ data, ticker }) => {
    const [timeRange, setTimeRange] = useState('MAX');

    const getFilteredData = () => {
        if (!data || data.length === 0) return [];
        const count = {
            '1W': 7,
            '1M': 30,
            '3M': 90,
            '6M': 180,
            '1Y': 365,
            'MAX': data.length
        }[timeRange] || data.length;
        return data.slice(-count);
    };

    const filteredData = getFilteredData();

    const metrics = {
        max: Math.max(...filteredData.map(d => d.price)),
        min: Math.min(...filteredData.map(d => d.price)),
        avg: filteredData.reduce((acc, curr) => acc + curr.price, 0) / (filteredData.length || 1),
        current: filteredData.length > 0 ? filteredData[filteredData.length - 1].price : 0
    };

    const isPositive = filteredData.length > 1 ? metrics.current >= filteredData[0].price : true;
    const chartColor = isPositive ? '#22c55e' : '#ef4444';

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            const dataPoint = payload[0].payload;
            return (
                <div className="bg-arena-panel/90 border border-white/10 p-4 rounded-xl shadow-[0_0_20px_rgba(0,0,0,0.5)] backdrop-blur-xl animate-in zoom-in-95 duration-200">
                    <p className="text-[10px] font-mono text-gray-500 mb-2 uppercase tracking-widest">{label}</p>
                    <div className="space-y-1">
                        <div className="flex items-center justify-between gap-4">
                            <span className="text-xs text-gray-400">Price</span>
                            <span className="text-sm font-display font-bold text-white">₹{payload[0].value.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                            <span className="text-xs text-gray-400">Volume</span>
                            <span className="text-[10px] font-mono text-arena-accent">{(dataPoint.volume / 1000000).toFixed(2)}M</span>
                        </div>
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="bg-arena-panel border border-arena-border rounded-xl p-6 relative overflow-hidden group">
            {/* Decorative background element */}
            <div className={`absolute -top-24 -right-24 w-64 h-64 blur-[100px] opacity-[0.05] pointer-events-none transition-colors duration-1000 ${isPositive ? 'bg-green-500' : 'bg-red-500'}`} />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${isPositive ? 'bg-green-500' : 'bg-red-500'}`} />
                        <h3 className="text-lg font-display tracking-widest text-white">MARKET PULSE</h3>
                    </div>
                    <p className="text-[10px] font-mono text-gray-600 uppercase tracking-tighter">Instrument: {ticker} • {timeRange} View</p>
                </div>

                <div className="flex bg-black/40 p-1 rounded-xl border border-white/5 backdrop-blur-sm">
                    {['1W', '1M', '3M', '6M', '1Y', 'MAX'].map((range) => (
                        <button
                            key={range}
                            onClick={() => setTimeRange(range)}
                            className={`px-4 py-1.5 text-[10px] font-mono transition-all duration-300 rounded-lg ${timeRange === range
                                ? 'bg-white text-black font-bold shadow-[0_0_15px_white/20]'
                                : 'text-gray-500 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            {range}
                        </button>
                    ))}
                </div>
            </div>

            {/* Numeric Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 py-6 border-b border-white/5 relative z-10">
                {[
                    { label: 'RANGE HIGH', value: metrics.max, color: 'text-arena-bull', icon: '↑' },
                    { label: 'RANGE LOW', value: metrics.min, color: 'text-arena-bear', icon: '↓' },
                    { label: 'AVG PRICE', value: metrics.avg, color: 'text-blue-400', icon: '〰' },
                    { label: 'LAST PRICE', value: metrics.current, color: isPositive ? 'text-arena-bull' : 'text-arena-bear', icon: '●' },
                ].map((stat, i) => (
                    <div key={i} className="flex flex-col group/stat hover:translate-y-[-2px] transition-transform duration-300">
                        <div className="flex items-center gap-1.5 mb-1">
                            <span className={`text-[9px] font-mono ${stat.color} opacity-70`}>{stat.icon}</span>
                            <span className="text-[9px] font-mono text-gray-600 tracking-wider uppercase">{stat.label}</span>
                        </div>
                        <span className={`text-base font-display font-medium ${stat.color}`}>₹{stat.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                ))}
            </div>

            <div className="h-[320px] w-full mt-6 relative z-10 transition-all duration-700">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={filteredData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={chartColor} stopOpacity={0.6} />
                                <stop offset="50%" stopColor={chartColor} stopOpacity={0.2} />
                                <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
                            </linearGradient>
                            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                                <feGaussianBlur stdDeviation="5" result="blur" />
                                <feComposite in="SourceGraphic" in2="blur" operator="over" />
                            </filter>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff03" vertical={false} />
                        <XAxis
                            dataKey="date"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#6b7280', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                            interval="preserveStartEnd"
                            minTickGap={40}
                            dy={10}
                        />
                        <YAxis
                            domain={['auto', 'auto']}
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#6b7280', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                            tickFormatter={(val) => `₹${val.toLocaleString()}`}
                            width={80}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#ffffff20', strokeWidth: 1 }} />
                        <Area
                            type="monotone"
                            dataKey="price"
                            stroke={chartColor}
                            strokeWidth={4}
                            fillOpacity={1}
                            fill="url(#colorPrice)"
                            filter="url(#glow)"
                            animationDuration={2000}
                        />
                        <ReferenceLine y={metrics.avg} stroke="#3b82f6" strokeDasharray="5 5" strokeOpacity={0.3} label={{ value: 'AVG', position: 'right', fill: '#3b82f6', fontSize: 9 }} />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            {/* Sub-label */}
            <div className="flex justify-between items-center mt-6 text-[10px] font-mono text-gray-600 tracking-widest uppercase relative z-10 border-t border-white/5 pt-4">
                <span>VOL: {(filteredData.reduce((a, b) => a + b.volume, 0) / 1000000).toFixed(2)}M UNITS</span>
                <span className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${isPositive ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
                    LIVE DATA STREAM
                </span>
            </div>
        </div>
    );
};
