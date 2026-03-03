import React, { useState } from 'react';
import { Zap } from 'lucide-react';
import { DebateRequest } from '../types';

interface DebateFormProps {
    onSubmit: (request: DebateRequest) => void;
    isLoading: boolean;
}

export const DebateForm: React.FC<DebateFormProps> = ({ onSubmit, isLoading }) => {
    const [ticker, setTicker] = useState('');
    const [exchange, setExchange] = useState('NSE');
    const [holdingPeriod, setHoldingPeriod] = useState('Medium Term (6-12 Months)');
    const [rounds, setRounds] = useState(1);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!ticker.trim()) return;
        onSubmit({
            ticker: ticker.toUpperCase(),
            exchange,
            holdingPeriod,
            rounds
        });
    };

    return (
        <div className="bg-arena-panel border border-arena-border rounded-xl p-6 shadow-xl relative overflow-hidden">
            {/* Decorative accent */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-arena-accent/5 rounded-full -mr-16 -mt-16 blur-3xl pointer-events-none" />

            <h2 className="font-display text-xl tracking-[0.2em] mb-6 flex items-center gap-2">
                <Zap className="w-5 h-5 text-arena-accent" /> NEW DEBATE
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-[10px] font-mono text-gray-500 mb-1 tracking-widest uppercase">Stock Ticker</label>
                    <input
                        type="text"
                        value={ticker}
                        onChange={(e) => setTicker(e.target.value)}
                        placeholder="e.g. TATASTEEL"
                        className="w-full bg-black/40 border border-arena-border rounded-lg px-4 py-3 text-white placeholder:text-gray-700 focus:outline-none focus:border-arena-accent transition-colors font-body"
                        required
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-[10px] font-mono text-gray-500 mb-1 tracking-widest uppercase">Exchange</label>
                        <select
                            value={exchange}
                            onChange={(e) => setExchange(e.target.value)}
                            className="w-full bg-black/40 border border-arena-border rounded-lg px-3 py-3 text-white focus:outline-none focus:border-arena-accent transition-colors font-body text-sm appearance-none"
                        >
                            <option value="NSE">NSE (India)</option>
                            <option value="BSE">BSE (India)</option>
                            <option value="NASDAQ">NASDAQ (US)</option>
                            <option value="NYSE">NYSE (US)</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-[10px] font-mono text-gray-500 mb-1 tracking-widest uppercase">Rounds</label>
                        <select
                            value={rounds}
                            onChange={(e) => setRounds(parseInt(e.target.value))}
                            className="w-full bg-black/40 border border-arena-border rounded-lg px-3 py-3 text-white focus:outline-none focus:border-arena-accent transition-colors font-body text-sm appearance-none"
                        >
                            <option value={1}>1 Round</option>
                            <option value={2}>2 Rounds</option>
                            <option value={3}>3 Rounds</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-[10px] font-mono text-gray-500 mb-1 tracking-widest uppercase">Holding Period</label>
                    <select
                        value={holdingPeriod}
                        onChange={(e) => setHoldingPeriod(e.target.value)}
                        className="w-full bg-black/40 border border-arena-border rounded-lg px-4 py-3 text-white focus:outline-none focus:border-arena-accent transition-colors font-body text-sm appearance-none"
                    >
                        <option>Short Term (0-3 Months)</option>
                        <option>Medium Term (6-12 Months)</option>
                        <option>Long Term (1-3 Years)</option>
                        <option>Multi-bagger (3+ Years)</option>
                    </select>
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className={`
            w-full py-4 rounded-lg font-display tracking-[0.3em] text-sm mt-4 transition-all duration-300
            ${isLoading
                            ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                            : 'bg-arena-accent text-black hover:bg-white hover:scale-[1.02] shadow-[0_0_20px_rgba(255,255,255,0.1)]'}
          `}
                >
                    {isLoading ? 'ANALYZING...' : 'START THE DEBATE'}
                </button>
            </form>
        </div>
    );
};
