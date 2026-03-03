import React, { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { MarketIndex } from '../types';
import { debateApi } from '../services/api';

export const MarketOverview: React.FC = () => {
    const [indices, setIndices] = useState<MarketIndex[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        debateApi.getMarketIndices()
            .then(setIndices)
            .finally(() => setLoading(false));

        const interval = setInterval(() => {
            debateApi.getMarketIndices().then(setIndices);
        }, 30000); // Refresh every 30s

        return () => clearInterval(interval);
    }, []);

    if (loading) {
        return (
            <div className="bg-arena-panel border border-arena-border rounded-xl p-6 animate-pulse">
                <div className="h-4 w-24 bg-gray-800 rounded mb-4" />
                <div className="space-y-4">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="flex justify-between">
                            <div className="h-3 w-16 bg-gray-800 rounded" />
                            <div className="h-3 w-12 bg-gray-800 rounded" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-arena-panel border border-arena-border rounded-xl p-5 space-y-5">
            <div className="flex items-center gap-2 border-b border-arena-border pb-3">
                <Activity className="w-4 h-4 text-arena-accent" />
                <h3 className="font-display text-xs tracking-[0.2em] text-white">MARKET RESEARCH</h3>
            </div>

            <div className="space-y-4">
                <div>
                    <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-3">Live Indices</p>
                    <div className="space-y-3">
                        {indices.map(index => (
                            <div key={index.name} className="flex items-center justify-between group">
                                <span className="text-xs font-mono text-gray-400 group-hover:text-white transition-colors uppercase">{index.name}</span>
                                <div className="flex items-center gap-3">
                                    <span className="text-xs font-mono font-bold">₹{index.value.toLocaleString()}</span>
                                    <div className={`flex items-center text-[10px] font-mono px-1.5 py-0.5 rounded ${index.changePercent >= 0 ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                                        }`}>
                                        {index.changePercent >= 0 ? <TrendingUp className="w-2.5 h-2.5 mr-1" /> : <TrendingDown className="w-2.5 h-2.5 mr-1" />}
                                        {Math.abs(index.changePercent).toFixed(2)}%
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="pt-4 border-t border-arena-border/30">
                    <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-2">Market Sentiment</p>
                    <div className="p-3 bg-black/30 rounded-lg">
                        <p className="text-[11px] text-gray-400 font-body leading-relaxed">
                            Indian markets are experiencing selective buying today. The Nifty 50 is holding steady above key support levels while midcaps show volatility.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
