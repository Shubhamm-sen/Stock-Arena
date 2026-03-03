import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface TickerItem {
    symbol: string;
    price: number;
    change: number;
    changePercent: number;
}

const mockTickerData: TickerItem[] = [
    { symbol: 'NIFTY 50', price: 23456.70, change: 124.50, changePercent: 0.53 },
    { symbol: 'SENSEX', price: 77123.40, change: -234.10, changePercent: -0.30 },
    { symbol: 'RELIANCE', price: 2945.60, change: 45.20, changePercent: 1.56 },
    { symbol: 'HDFC BANK', price: 1640.30, change: -12.40, changePercent: -0.75 },
    { symbol: 'TCS', price: 3890.10, change: 67.80, changePercent: 1.77 },
    { symbol: 'INFY', price: 1540.20, change: 23.40, changePercent: 1.54 },
    { symbol: 'ICICI BANK', price: 1120.50, change: 5.60, changePercent: 0.50 },
    { symbol: 'SBIN', price: 830.40, change: -3.20, changePercent: -0.38 },
    { symbol: 'BHARTIARTL', price: 1420.70, change: 18.90, changePercent: 1.35 },
    { symbol: 'AAPL', price: 224.50, change: 3.40, changePercent: 1.54 },
    { symbol: 'MSFT', price: 415.60, change: -2.10, changePercent: -0.50 },
    { symbol: 'BTC/USD', price: 67890.00, change: 1245.00, changePercent: 1.87 },
];

export const StockTicker: React.FC = () => {
    // Duplicate the list to ensure seamless looping
    const displayData = [...mockTickerData, ...mockTickerData];

    return (
        <div className="w-full bg-black/80 border-b border-arena-border py-1.5 overflow-hidden whitespace-nowrap z-[20] backdrop-blur-md">
            <div className="flex animate-marquee">
                {displayData.map((item, idx) => {
                    const isPositive = item.change >= 0;
                    return (
                        <div key={`${item.symbol}-${idx}`} className="flex items-center gap-6 px-8 border-r border-white/5 last:border-r-0">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold font-mono text-gray-400 tracking-wider">
                                    {item.symbol}
                                </span>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-display font-bold text-white leading-none">
                                        ₹{item.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </span>
                                    <div className={`flex items-center gap-0.5 text-[10px] font-mono font-bold ${isPositive ? 'text-arena-bull' : 'text-arena-bear'}`}>
                                        {isPositive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                                        <span>{isPositive ? '+' : ''}{item.changePercent.toFixed(2)}%</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
