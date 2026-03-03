import React from 'react';
import { TrendingUp, TrendingDown, Scale } from 'lucide-react';
import { DebatePhase } from '../types';

interface AgentPanelProps {
  type: 'BULL' | 'BEAR' | 'JUDGE';
  text: string;
  phase: DebatePhase;
  isActive: boolean;
  isDone: boolean;
}

const agentConfig = {
  BULL: {
    icon: <TrendingUp className="w-5 h-5 text-arena-bull" />,
    label: 'BULL CASE',
    color: 'text-arena-bull',
    border: 'border-arena-bull/30',
    bg: 'bg-arena-bull/5',
    glow: 'shadow-[0_0_30px_rgba(34,197,94,0.1)]',
    activeDot: 'bg-arena-bull',
    activePhase: 'bull' as DebatePhase,
  },
  BEAR: {
    icon: <TrendingDown className="w-5 h-5 text-arena-bear" />,
    label: 'BEAR CASE',
    color: 'text-arena-bear',
    border: 'border-arena-bear/30',
    bg: 'bg-arena-bear/5',
    glow: 'shadow-[0_0_30px_rgba(239,68,68,0.1)]',
    activeDot: 'bg-arena-bear',
    activePhase: 'bear' as DebatePhase,
  },
  JUDGE: {
    icon: <Scale className="w-5 h-5 text-arena-judge" />,
    label: 'JUDGE\'S VERDICT',
    color: 'text-arena-judge',
    border: 'border-arena-judge/30',
    bg: 'bg-arena-judge/5',
    glow: 'shadow-[0_0_30px_rgba(167,139,250,0.1)]',
    activeDot: 'bg-arena-judge',
    activePhase: 'judge' as DebatePhase,
  },
};

export const AgentPanel: React.FC<AgentPanelProps> = ({ type, text, isActive, isDone }) => {
  const cfg = agentConfig[type];

  return (
    <div
      className={`
        border rounded-xl transition-all duration-300
        ${cfg.border} ${cfg.bg}
        ${isActive ? cfg.glow : ''}
        ${text ? 'opacity-100' : 'opacity-40'}
      `}
    >
      {/* Header */}
      <div className={`flex items-center gap-2 px-4 py-3 border-b ${cfg.border}`}>
        {cfg.icon}
        <span className={`font-display tracking-widest text-sm ${cfg.color}`}>{cfg.label}</span>
        {isActive && (
          <div className="ml-auto flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${cfg.activeDot} animate-pulse`} />
            <span className="text-xs text-gray-500 font-mono tracking-widest">ANALYZING...</span>
          </div>
        )}
        {isDone && !isActive && text && (
          <div className="ml-auto">
            <span className="text-xs text-gray-500 font-mono tracking-widest">DONE</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 min-h-[80px]">
        {text ? (
          <div
            className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap font-body"
            dangerouslySetInnerHTML={{ __html: formatText(text) }}
          />
        ) : (
          <div className="flex items-center gap-2 text-gray-600 text-sm">
            <span className="font-mono tracking-widest uppercase">WAITING{type === 'BEAR' ? ' FOR BULL' : '...'}</span>
          </div>
        )}
        {/* Blinking cursor while typing */}
        {isActive && (
          <span className="inline-block w-0.5 h-4 bg-current ml-0.5 animate-pulse" />
        )}
      </div>
    </div>
  );
};

/** Highlight [CONFIDENCE: X%] and **bold** and bullet points */
function formatText(text: string): string {
  return text
    .replace(/\[CONFIDENCE:\s*(\d+)%\]/g, '<span class="inline-block text-xs font-mono px-1.5 py-0.5 rounded bg-white/10 text-amber-400 ml-1">$1%</span>')
    .replace(/\[BUY\]/g, '<span class="inline-block font-display px-2 py-0.5 bg-green-500/20 text-green-400 rounded text-xs">BUY</span>')
    .replace(/\[AVOID\]/g, '<span class="inline-block font-display px-2 py-0.5 bg-red-500/20 text-red-400 rounded text-xs">AVOID</span>')
    .replace(/\[NEUTRAL\]/g, '<span class="inline-block font-display px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded text-xs">NEUTRAL</span>')
    .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>')
    .replace(/^(\d+\.\s)/gm, '<span class="text-amber-400 font-mono text-xs">$1</span>');
}
