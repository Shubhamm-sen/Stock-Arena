import React from 'react';
import { DebateSummary } from '../types';

interface HistoryPanelProps {
    history: DebateSummary[];
}

export const HistoryPanel: React.FC<HistoryPanelProps> = ({ history }) => {
    return (
        <div className="bg-arena-panel border border-arena-border rounded-xl p-6 shadow-xl relative overflow-hidden">
            <h2 className="font-display text-xl tracking-[0.2em] mb-6 flex items-center gap-2">
                <span className="text-gray-500">✦</span> HISTORY
            </h2>

            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {history.length === 0 ? (
                    <div className="text-center py-8 border border-dashed border-arena-border rounded-lg">
                        <p className="text-xs text-gray-700 font-mono">NO RECORDS FOUND</p>
                    </div>
                ) : (
                    history.map((item) => (
                        <div
                            key={item.id}
                            className="group bg-black/20 border border-arena-border/50 rounded-lg p-3 hover:border-gray-500 transition-colors cursor-pointer"
                        >
                            <div className="flex justify-between items-start mb-1">
                                <span className="font-display text-sm tracking-widest text-white group-hover:text-arena-accent transition-colors">
                                    {item.ticker}
                                </span>
                                <span className="text-[10px] font-mono text-gray-600">
                                    {new Date(item.createdAt).toLocaleDateString()}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${item.verdictOutcome === 'BUY' ? 'bg-arena-bull/10 text-arena-bull' :
                                        item.verdictOutcome === 'AVOID' ? 'bg-arena-bear/10 text-arena-bear' :
                                            'bg-arena-judge/10 text-arena-judge'
                                    }`}>
                                    {item.verdictOutcome}
                                </span>
                                <span className="text-[10px] font-mono text-gray-700 uppercase">{item.status}</span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
