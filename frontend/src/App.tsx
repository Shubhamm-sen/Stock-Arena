import { useState, useCallback, useEffect } from 'react';
import {
  Database, TrendingUp, TrendingDown, Scale, CheckCircle,
  Terminal, BarChart3, AlertCircle, Info, ChevronRight, Share2
} from 'lucide-react';
import { DebateForm } from './components/DebateForm';
import { AgentPanel } from './components/AgentPanel';
import { StockCard } from './components/StockCard';
import { HistoryPanel } from './components/HistoryPanel';
import { DetailedView } from './components/DetailedView';
import { StockTicker } from './components/StockTicker';
import { MarketOverview } from './components/MarketOverview';
import { useWebSocket } from './hooks/useWebSocket';
import { debateApi } from './services/api';
import { StockData, StreamMessage, DebatePhase, DebateSummary, DebateRequest } from './types';

export default function App() {
  const [phase, setPhase] = useState<DebatePhase>('idle');
  const [stockData, setStockData] = useState<StockData | null>(null);
  const [bullText, setBullText] = useState('');
  const [bearText, setBearText] = useState('');
  const [judgeText, setJudgeText] = useState('');
  const [bullDone, setBullDone] = useState(false);
  const [bearDone, setBearDone] = useState(false);
  const [judgeDone, setJudgeDone] = useState(false);
  const [outcome, setOutcome] = useState<string>('');
  const [statusMsg, setStatusMsg] = useState('');
  const [history, setHistory] = useState<DebateSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<DebatePhase>('idle');

  const { connect, disconnect } = useWebSocket();

  // Load debate history on mount
  useEffect(() => {
    debateApi.getHistory().then(setHistory).catch(() => { });
  }, []);

  // Reset debate state
  const resetDebate = () => {
    setStockData(null);
    setBullText('');
    setBearText('');
    setJudgeText('');
    setBullDone(false);
    setBearDone(false);
    setJudgeDone(false);
    setOutcome('');
    setStatusMsg('');
    setPhase('idle');
    setActiveTab('idle');
  };

  // Handle incoming WebSocket messages
  const handleMessage = useCallback((msg: StreamMessage) => {
    switch (msg.type) {
      case 'FETCHING_DATA':
        setStatusMsg('Fetching live market data...');
        setPhase('fetching');
        setActiveTab('fetching');
        break;

      case 'STOCK_DATA':
        setStockData(msg.data as StockData);
        setStatusMsg('');
        break;

      case 'BULL_START':
        setPhase('bull');
        setActiveTab('bull');
        setStatusMsg('Bull Agent analysis in progress...');
        break;

      case 'BULL_CHUNK':
        setBullText(prev => prev + msg.content);
        break;

      case 'BULL_DONE':
        setBullDone(true);
        if (msg.content) setBullText(msg.content);
        setStatusMsg('');
        break;

      case 'BEAR_START':
        setPhase('bear');
        setActiveTab('bear');
        setStatusMsg('Bear Agent analysis in progress...');
        break;

      case 'BEAR_CHUNK':
        setBearText(prev => prev + msg.content);
        break;

      case 'BEAR_DONE':
        setBearDone(true);
        if (msg.content) setBearText(msg.content);
        setStatusMsg('');
        break;

      case 'JUDGE_START':
        setPhase('judge');
        setActiveTab('judge');
        setStatusMsg('Judge deliberating final consensus...');
        break;

      case 'JUDGE_CHUNK':
        setJudgeText(prev => prev + msg.content);
        break;

      case 'JUDGE_DONE':
        setJudgeDone(true);
        if (msg.content) setJudgeText(msg.content);
        setStatusMsg('');
        break;

      case 'DEBATE_COMPLETE':
        setPhase('complete');
        setActiveTab('complete');
        const result = msg.data as any;
        if (result?.finalOutcome) setOutcome(result.finalOutcome);
        if (result?.stockData) setStockData(result.stockData); // Ensure all history data is here
        // Refresh history
        debateApi.getHistory().then(setHistory).catch(() => { });
        disconnect();
        setIsLoading(false);
        break;

      case 'ERROR':
        setPhase('error');
        setStatusMsg('Error: ' + msg.content);
        setIsLoading(false);
        disconnect();
        break;

      case 'ROUND_START':
        setStatusMsg(msg.content);
        break;
    }
  }, [disconnect]);

  // Start a new debate
  const handleStartDebate = async (request: DebateRequest) => {
    resetDebate();
    setIsLoading(true);
    setPhase('fetching');
    setActiveTab('fetching');

    try {
      const { sessionId } = await debateApi.startDebate(request);
      // Connect to WebSocket BEFORE the backend starts streaming
      connect(sessionId, handleMessage);
    } catch (err: any) {
      setPhase('error');
      setStatusMsg('Connection failed. Backend might be offline.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-arena-bg font-body text-white">
      {/* Subtle grid background */}
      <div className="fixed inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px] pointer-events-none" />

      {/* Moving Stock Ticker */}
      <StockTicker />

      {/* Header */}
      <header className="border-b border-arena-border bg-arena-panel/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-arena-accent/10 rounded-lg">
              <BarChart3 className="w-6 h-6 text-arena-accent" />
            </div>
            <div>
              <h1 className="font-display text-2xl text-white tracking-widest leading-none">STOCK ARENA</h1>
              <p className="text-[10px] font-mono tracking-widest text-gray-500 uppercase font-bold">AI QUANTITATIVE ANALYTICS ENGINE</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden md:flex flex-col items-end mr-4">
              <span className="text-[10px] font-mono text-gray-600 tracking-tighter uppercase">Market Intelligence Platform</span>
              <span className="text-[10px] font-mono text-arena-accent tracking-tighter uppercase font-bold">ALPHA VERSION 1.5 // AGENTIC GPT-4o</span>
            </div>
            <div className="w-10 h-10 rounded-full border border-arena-border bg-white/5 flex items-center justify-center">
              <Terminal className="w-4 h-4 text-arena-accent" />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 relative">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Left Sidebar */}
          <div className="lg:col-span-3 space-y-6 lg:sticky lg:top-24 h-fit">
            <DebateForm onSubmit={handleStartDebate} isLoading={isLoading} />
            <MarketOverview />
            <HistoryPanel history={history} />
          </div>

          {/* Main Arena */}
          <div className="lg:col-span-9 space-y-6">

            {/* Status & Navigation */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              {/* Phase progress line */}
              <div className="flex items-center gap-1">
                {[
                  { key: 'fetching', label: 'RESEARCH', icon: <Database className="w-3.5 h-3.5" /> },
                  { key: 'bull', label: 'BULL', icon: <TrendingUp className="w-3.5 h-3.5" /> },
                  { key: 'bear', label: 'BEAR', icon: <TrendingDown className="w-3.5 h-3.5" /> },
                  { key: 'judge', label: 'CONSENSUS', icon: <Scale className="w-3.5 h-3.5" /> },
                  { key: 'complete', label: 'INSIGHTS', icon: <CheckCircle className="w-3.5 h-3.5" /> },
                ].map((step, idx, arr) => {
                  const phases = ['fetching', 'bull', 'bear', 'judge', 'complete'];
                  const isActive = step.key === activeTab;
                  const isPast = phases.indexOf(step.key) <= phases.indexOf(phase) && step.key !== 'idle';
                  const isAvailable = (isPast || step.key === phase || (phase === 'complete' && step.key === 'complete')) && phase !== 'idle';

                  return (
                    <div key={step.key} className="flex items-center gap-1">
                      <button
                        onClick={() => isAvailable && setActiveTab(step.key as DebatePhase)}
                        disabled={!isAvailable}
                        className={`flex items-center gap-2 text-[10px] font-mono px-3 py-1.5 rounded-full transition-all border ${isActive ? 'bg-arena-accent text-black border-arena-accent shadow-[0_0_15px_rgba(255,255,255,0.2)]' :
                          isAvailable ? 'text-arena-accent border-arena-accent/30 bg-arena-accent/5 hover:bg-arena-accent/10' : 'text-gray-700 border-arena-border cursor-not-allowed opacity-50'
                          }`}>
                        {step.icon}
                        <span className="tracking-tighter uppercase font-bold">{step.label}</span>
                      </button>
                      {idx < arr.length - 1 && (
                        <div className={`w-4 h-[1px] ${isPast ? 'bg-arena-accent/30' : 'bg-arena-border'}`} />
                      )}
                    </div>
                  );
                })}
              </div>

              {statusMsg && (
                <div className="flex items-center gap-2 px-4 py-1.5 bg-arena-panel border border-arena-border rounded-full animate-in fade-in slide-in-from-right-2">
                  <div className="w-1 h-1 rounded-full bg-arena-accent animate-ping" />
                  <p className="text-[10px] font-mono text-arena-accent uppercase tracking-widest font-bold tracking-tighter">{statusMsg}</p>
                </div>
              )}
            </div>

            {/* Stock Glance info (Persistent Research Data) */}
            {stockData && ['fetching', 'bull', 'bear', 'judge'].includes(activeTab) && (
              <div className="animate-in fade-in duration-1000">
                <StockCard stockData={stockData} />
              </div>
            )}

            {/* View Switching Logic */}
            <div className="transition-all duration-700">

              {/* IDLE state */}
              {phase === 'idle' && (
                <div className="border border-dashed border-arena-border/50 rounded-2xl p-20 flex flex-col items-center justify-center text-center bg-white/[0.01]">
                  <div className="w-16 h-16 rounded-3xl bg-white/5 flex items-center justify-center mb-6">
                    <Scale className="w-8 h-8 text-gray-700" />
                  </div>
                  <h3 className="font-display text-2xl tracking-[0.3em] text-gray-400 mb-2 uppercase">Arena System Offline</h3>
                  <p className="text-gray-600 font-body text-sm max-w-xs">
                    Initiate a quantitative stock analysis session by entering a ticker in the research terminal.
                  </p>
                </div>
              )}

              {/* STREAMING phase (Fetching, Bull, Bear, Judge) */}
              {phase !== 'idle' && activeTab !== 'complete' && activeTab !== 'fetching' && phase !== 'error' && (
                <div className="grid grid-cols-1 gap-4 animate-in fade-in">
                  {(activeTab as string === 'bull' || (phase === 'bull' && activeTab === 'bull')) && (
                    <AgentPanel
                      type="BULL"
                      text={bullText}
                      phase={phase}
                      isActive={phase === 'bull'}
                      isDone={bullDone}
                    />
                  )}
                  {(activeTab as string === 'bear' || (phase === 'bear' && activeTab === 'bear')) && (
                    <AgentPanel
                      type="BEAR"
                      text={bearText}
                      phase={phase}
                      isActive={phase === 'bear'}
                      isDone={bearDone}
                    />
                  )}
                  {(activeTab as string === 'judge' || (phase === 'judge' && activeTab === 'judge')) && (
                    <AgentPanel
                      type="JUDGE"
                      text={judgeText}
                      phase={phase}
                      isActive={phase === 'judge'}
                      isDone={judgeDone}
                    />
                  )}
                </div>
              )}

              {/* COMPLETED/INSIGHTS phase - Show Detailed Graphical View */}
              {activeTab === 'complete' && stockData && (
                <DetailedView
                  stockData={stockData}
                  bullText={bullText}
                  bearText={bearText}
                  judgeText={judgeText}
                  outcome={outcome}
                  onReset={resetDebate}
                />
              )}

              {/* ERROR state */}
              {phase === 'error' && (
                <div className="border border-red-500/20 bg-red-500/5 rounded-2xl p-12 flex flex-col items-center justify-center text-center">
                  <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
                  <h3 className="font-display text-xl tracking-widest text-red-400 mb-2 uppercase">Protocol Failure</h3>
                  <p className="text-gray-500 text-sm mb-6">{statusMsg}</p>
                  <button
                    onClick={resetDebate}
                    className="px-6 py-2 border border-red-500/30 text-red-400 rounded-lg text-xs font-mono hover:bg-red-500/10 transition-all font-bold"
                  >
                    REBOOT TERMINAL
                  </button>
                </div>
              )}

            </div>
          </div>
        </div>
      </main>

      {/* Footer Info */}
      <footer className="mt-12 border-t border-arena-border py-8 opacity-40">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] font-mono uppercase tracking-[0.2em]">
          <div className="flex flex-col gap-1">
            <span className="font-bold">© 2026 Stock Arena // Intelligence Layer</span>
            <span className="text-gray-600">Secure AES-256 Analysis Environment</span>
          </div>
          <div className="flex gap-6">
            <span className="flex items-center gap-1 text-arena-accent font-bold"><Info className="w-3 h-3" /> Real-time Simulation Data</span>
            <span className="text-gray-500">Node ID: {stockData?.ticker || 'IDLE'}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
