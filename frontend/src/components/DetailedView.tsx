import React from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    Cell, PieChart, Pie
} from 'recharts';
import {
    TrendingUp, TrendingDown, Scale, CheckCircle, AlertCircle,
    HelpCircle, ChevronRight, BarChart3, PieChart as PieChartIcon
} from 'lucide-react';
import { StockData } from '../types';
import { PriceChart } from './PriceChart';
import { StockCard } from './StockCard';

interface DetailedViewProps {
    stockData: StockData;
    bullText: string;
    bearText: string;
    judgeText: string;
    outcome: string;
    onReset: () => void;
}

export const DetailedView: React.FC<DetailedViewProps> = ({
    stockData, bullText, bearText, judgeText, outcome, onReset
}) => {

    // Data for the metrics bar chart
    const metricsData = [
        { name: 'ROE', value: stockData.returnOnEquity, color: '#22c55e' },
        { name: 'Rev Growth', value: stockData.revenueGrowth, color: '#3b82f6' },
        { name: 'Margin', value: stockData.profitMargin, color: '#a78bfa' },
        { name: 'Div Yield', value: stockData.dividendYield, color: '#f59e0b' },
    ];

    // Data for the Bull vs Bear confidence pie (simulated for visual)
    const sentimentData = [
        { name: 'Bullish', value: outcome === 'BUY' ? 70 : outcome === 'AVOID' ? 30 : 50, color: '#22c55e' },
        { name: 'Bearish', value: outcome === 'BUY' ? 30 : outcome === 'AVOID' ? 70 : 50, color: '#ef4444' },
    ];

    const outcomeStyle = {
        BUY: 'bg-green-500/10 text-green-400 border-green-500/30',
        AVOID: 'bg-red-500/10 text-red-400 border-red-500/30',
        NEUTRAL: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    }[outcome] || 'bg-arena-panel text-gray-400 border-arena-border';

    const outcomeIcon = {
        BUY: <CheckCircle className="w-8 h-8" />,
        AVOID: <AlertCircle className="w-8 h-8" />,
        NEUTRAL: <HelpCircle className="w-8 h-8" />,
    }[outcome] || <Scale className="w-8 h-8" />;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">

            {/* Numeric Dashboard - Persistent info */}
            <StockCard stockData={stockData} />


            {/* Price Chart Section */}
            {stockData.priceHistory && (
                <PriceChart data={stockData.priceHistory} ticker={stockData.ticker} />
            )}

            {/* Graphical Insights */}
            <div className="grid grid-cols-1 gap-6">

                {/* Key Performance Metrics Chart */}
                <div className="bg-arena-panel border border-arena-border rounded-2xl p-6">
                    <div className="flex items-center gap-2 mb-6">
                        <BarChart3 className="w-5 h-5 text-arena-accent" />
                        <h3 className="font-display tracking-widest text-sm text-gray-400 uppercase">Key Performance (%)</h3>
                    </div>
                    <div className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={metricsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                                <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} tick={{ fill: '#666' }} />
                                <YAxis fontSize={10} axisLine={false} tickLine={false} tick={{ fill: '#666' }} />
                                <Tooltip
                                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                    contentStyle={{ backgroundColor: '#141414', border: '1px solid #222', borderRadius: '8px' }}
                                />
                                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                    {metricsData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

            </div>

            {/* Argument Summaries */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                    { icon: <TrendingUp className="text-green-500" />, title: 'BULL CASE', text: bullText, border: 'border-green-500/20' },
                    { icon: <TrendingDown className="text-red-500" />, title: 'BEAR CASE', text: bearText, border: 'border-red-500/20' },
                ].map((item, idx) => (
                    <div key={idx} className={`bg-arena-panel border rounded-2xl p-6 ${item.border}`}>
                        <div className="flex items-center gap-2 mb-4">
                            {item.icon}
                            <h4 className="font-display tracking-widest text-xs uppercase">{item.title}</h4>
                        </div>
                        <div className="text-xs text-gray-400 leading-relaxed max-h-[200px] overflow-y-auto custom-scrollbar whitespace-pre-wrap">
                            {item.text}
                        </div>
                    </div>
                ))}
            </div>

        </div>
    );
};
