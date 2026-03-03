import React from 'react';
import { StockData } from '../types';
import { TrendingUp, TrendingDown, BarChart2, Building, Target, PieChart, Info } from 'lucide-react';

interface StockCardProps {
  stockData: StockData;
}

const fmt = (n: number, dec = 2) => n ? n.toFixed(dec) : '0.00';
const fmtCr = (n: number) => n ? `₹${(n / 10_000_000).toFixed(0)} Cr` : 'N/A';

export const StockCard: React.FC<StockCardProps> = ({ stockData }) => {
  const isPositive = stockData.changePercent >= 0;

  return (
    <div className="bg-arena-panel border border-arena-border rounded-xl p-6 shadow-2xl relative overflow-hidden">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="bg-arena-accent/20 p-1 rounded">
              <Building size={14} className="text-arena-accent" />
            </div>
            <span className="text-[10px] text-arena-accent font-mono uppercase tracking-widest">{stockData.ticker}</span>
            <span className="text-[10px] text-gray-600 font-mono">|</span>
            <span className="text-[10px] text-gray-500 font-mono uppercase">{stockData.exchange}</span>
          </div>
          <h2 className="text-2xl font-display text-white tracking-tight">
            {stockData.companyName}
          </h2>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] bg-white/5 border border-white/10 px-2 py-0.5 rounded text-gray-400 capitalize">{stockData.sector}</span>
            <span className="text-[10px] bg-white/5 border border-white/10 px-2 py-0.5 rounded text-gray-400 capitalize">{stockData.industry}</span>
          </div>
        </div>

        <div className="md:text-right bg-white/5 p-4 rounded-xl border border-white/10 backdrop-blur-sm">
          <div className="flex items-baseline gap-2 md:justify-end">
            <p className="text-3xl font-display text-white">₹{fmt(stockData.currentPrice)}</p>
            <div className={`flex items-center text-xs font-mono font-bold ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
              {isPositive ? <TrendingUp size={14} className="mr-1" /> : <TrendingDown size={14} className="mr-1" />}
              {isPositive ? '+' : ''}{fmt(stockData.changePercent)}%
            </div>
          </div>
          <p className="text-[10px] font-mono text-gray-500 mt-1 uppercase tracking-tighter">Live Market Price</p>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatBlock label="P/E Ratio" value={fmt(stockData.peRatio)} subValue="Sector: 24.5" />
        <StatBlock label="P/B Ratio" value={fmt(stockData.pbRatio)} subValue={`BV: ₹${fmt(stockData.bookValue, 0)}`} />
        <StatBlock label="ROE" value={`${fmt(stockData.returnOnEquity)}%`} subValue="TTM" trend={stockData.returnOnEquity > 15 ? 'up' : 'stable'} />
        <StatBlock label="Beta" value={fmt(stockData.beta)} subValue={stockData.beta > 1 ? 'High Vol' : 'Low Vol'} />
      </div>

      {/* Advanced Insights Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Shareholding Pattern */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-[10px] font-mono text-gray-500 tracking-widest uppercase mb-2">
            <PieChart size={12} className="text-arena-accent" />
            Shareholding Pattern
          </div>
          <div className="space-y-3 bg-black/20 p-4 rounded-xl border border-white/5">
            <div className="flex justify-between items-end mb-1">
              <span className="text-[11px] text-gray-400 font-mono">Promoters</span>
              <span className="text-xs text-white font-mono">{stockData.shareholdingPattern?.promoters || 45.0}%</span>
            </div>
            <div className="h-1 bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-arena-accent rounded-full" style={{ width: `${stockData.shareholdingPattern?.promoters || 45.0}%` }} />
            </div>

            <div className="grid grid-cols-3 gap-4 pt-1">
              <div>
                <span className="block text-[9px] text-gray-600 font-mono uppercase mb-1">FII</span>
                <span className="text-xs text-blue-400 font-mono">{stockData.shareholdingPattern?.fiis || 15.0}%</span>
              </div>
              <div>
                <span className="block text-[9px] text-gray-600 font-mono uppercase mb-1">DII</span>
                <span className="text-xs text-purple-400 font-mono">{stockData.shareholdingPattern?.diis || 20.0}%</span>
              </div>
              <div>
                <span className="block text-[9px] text-gray-600 font-mono uppercase mb-1">Public</span>
                <span className="text-xs text-gray-400 font-mono">{stockData.shareholdingPattern?.public || 20.0}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Target Price & Range */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-[10px] font-mono text-gray-500 tracking-widest uppercase mb-2">
            <Target size={12} className="text-arena-accent" />
            Analyst Targets
          </div>
          <div className="bg-black/40 rounded-xl p-4 border border-white/5 h-full flex flex-col justify-center">
            <div className="flex justify-between items-center mb-6">
              <span className="text-xs text-gray-400">Mean Target</span>
              <span className="text-lg font-display text-arena-bull">₹{fmt(stockData.targetPrice)}</span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-[10px] text-gray-600 font-mono">
                <span>52W LOW: ₹{fmt(stockData.fiftyTwoWeekLow, 0)}</span>
                <span>52W HIGH: ₹{fmt(stockData.fiftyTwoWeekHigh, 0)}</span>
              </div>
              <div className="h-1.5 bg-arena-border rounded-full overflow-hidden relative">
                <div className="absolute top-0 bottom-0 bg-arena-accent/30 left-[20%] right-[30%] border-x border-arena-accent/50" />
                <div
                  className="absolute top-[-2px] bottom-[-2px] w-1 bg-white shadow-[0_0_10px_white] z-10"
                  style={{ left: `${Math.max(0, Math.min(100, ((stockData.currentPrice - stockData.fiftyTwoWeekLow) / (stockData.fiftyTwoWeekHigh - stockData.fiftyTwoWeekLow)) * 100))}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="flex flex-wrap items-center gap-6 pt-6 border-t border-white/5">
        <div className="flex items-center gap-2">
          <BarChart2 size={14} className="text-gray-600" />
          <span className="text-[10px] text-gray-500 font-mono uppercase tracking-tighter">Market Cap: <span className="text-gray-300">{fmtCr(stockData.marketCap)}</span></span>
        </div>
        <div className="flex items-center gap-2">
          <Info size={14} className="text-gray-600" />
          <span className="text-[10px] text-gray-500 font-mono uppercase tracking-tighter">Div Yield: <span className="text-gray-300">{fmt(stockData.dividendYield)}%</span></span>
        </div>
        <div className="flex items-center gap-2">
          <TrendingUp size={14} className="text-gray-600" />
          <span className="text-[10px] text-gray-500 font-mono uppercase tracking-tighter">Growth: <span className="text-arena-bull">{fmt(stockData.revenueGrowth)}%</span></span>
        </div>
      </div>
    </div>
  );
};

const StatBlock: React.FC<{ label: string, value: string, subValue: string, trend?: 'up' | 'down' | 'stable' }> = ({ label, value, subValue, trend }) => (
  <div className="bg-black/30 rounded-xl p-4 border border-white/5 hover:border-arena-accent/30 transition-colors group">
    <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1 group-hover:text-arena-accent transition-colors">{label}</p>
    <p className="text-xl font-display text-white mb-1">{value}</p>
    <p className={`text-[10px] font-mono ${trend === 'up' ? 'text-green-500' : 'text-gray-600'}`}>{subValue}</p>
  </div>
);
