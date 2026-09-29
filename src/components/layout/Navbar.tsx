import React from 'react';
import {
  Wifi,
  WifiOff,
  RefreshCw,
  Sliders,
  Play,
  Square,
  Sparkles,
  Layers,
} from 'lucide-react';
import { useComfy } from '../../context/ComfyContext';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  const {
    connectionStatus,
    isOnline,
    backendUrl,
    latencyMs,
    checkConnection,
    queue,
    isGenerating,
    interruptExecution,
    executionProgress,
  } = useComfy();

  const totalRunning = queue.queue_running.length;
  const totalPending = queue.queue_pending.length;

  return (
    <header className="sticky top-0 z-40 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800/80 px-4 py-2.5 sm:px-6">
      <div className="flex items-center justify-between gap-3 max-w-7xl mx-auto">
        {/* Brand & Title */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-fuchsia-600 text-white shadow-lg shadow-indigo-500/20">
            <Sparkles className="w-5 h-5" />
            {isGenerating && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base tracking-tight text-white">
                Comfy Remote
              </span>
              <span className="hidden sm:inline-block text-[10px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700/60">
                v1.2
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 hidden xs:block truncate max-w-[180px] sm:max-w-xs">
              {backendUrl.replace(/^https?:\/\//, '')}
            </p>
          </div>
        </div>

        {/* Center / Right controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Active Generation Progress Pill (if generating) */}
          {isGenerating && (
            <div className="flex items-center gap-2 bg-indigo-950/70 border border-indigo-500/40 text-indigo-300 px-2.5 py-1 rounded-lg text-xs animate-pulse">
              <div className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
              <span className="font-medium hidden sm:inline">Generating</span>
              {executionProgress && (
                <span className="font-mono text-[11px] font-bold text-indigo-200">
                  {Math.round((executionProgress.value / executionProgress.max) * 100)}%
                </span>
              )}
              <button
                onClick={() => interruptExecution()}
                className="p-1 rounded hover:bg-rose-500/20 text-rose-400 ml-1 transition-colors"
                title="Interrupt prompt"
              >
                <Square className="w-3 h-3 fill-current" />
              </button>
            </div>
          )}

          {/* Queue counts badge */}
          {(totalRunning > 0 || totalPending > 0) && (
            <button
              onClick={() => setActiveTab('queue')}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-xs text-zinc-300 transition-colors"
            >
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              <span className="font-mono font-medium">
                {totalRunning > 0 ? `${totalRunning} running` : ''}
                {totalRunning > 0 && totalPending > 0 ? ', ' : ''}
                {totalPending > 0 ? `${totalPending} queued` : ''}
              </span>
            </button>
          )}

          {/* Connection status pill */}
          <button
            onClick={() => checkConnection()}
            title="Click to re-test ComfyUI connection"
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium transition-all ${
              isOnline
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                : connectionStatus === 'connecting'
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20'
            }`}
          >
            {isOnline ? (
              <>
                <Wifi className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Connected</span>
                {latencyMs !== null && (
                  <span className="text-[10px] opacity-75 font-mono">
                    {latencyMs}ms
                  </span>
                )}
              </>
            ) : connectionStatus === 'connecting' ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Connecting...</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5" />
                <span>Offline</span>
              </>
            )}
          </button>

          {/* Settings button */}
          <button
            onClick={() => setActiveTab('settings')}
            className={`p-2 rounded-lg border transition-colors ${
              activeTab === 'settings'
                ? 'bg-indigo-600/20 border-indigo-500/40 text-indigo-400'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
            }`}
            title="Settings & Connection"
          >
            <Sliders className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
