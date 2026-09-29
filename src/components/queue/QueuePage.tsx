import React, { useState } from 'react';
import {
  Layers,
  Square,
  Trash2,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertCircle,
  Play,
  Activity,
  ArrowUpRight,
} from 'lucide-react';
import { useComfy } from '../../context/ComfyContext';
import { StatusBanner } from '../common/StatusBanner';

interface QueuePageProps {
  setActiveTab: (tab: string) => void;
}

export const QueuePage: React.FC<QueuePageProps> = ({ setActiveTab }) => {
  const {
    isOnline,
    queue,
    refreshQueue,
    interruptExecution,
    cancelQueueJob,
    clearAllPending,
    executingNodeId,
    executionProgress,
    isGenerating,
  } = useComfy();

  const [isInterrupting, setIsInterrupting] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const runningJobs = queue.queue_running || [];
  const pendingJobs = queue.queue_pending || [];

  const handleInterrupt = async () => {
    setIsInterrupting(true);
    await interruptExecution();
    setIsInterrupting(false);
  };

  const handleCancelJob = async (promptId: string) => {
    setCancellingId(promptId);
    await cancelQueueJob(promptId);
    setCancellingId(null);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      <StatusBanner onOpenSettings={() => setActiveTab('settings')} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-900/70 p-4 rounded-2xl border border-zinc-800">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-400" />
            Execution Queue
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Monitor running jobs, manage pending queue, and interrupt execution.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => refreshQueue()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>

          {pendingJobs.length > 0 && (
            <button
              onClick={() => clearAllPending()}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-medium transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear Pending ({pendingJobs.length})
            </button>
          )}
        </div>
      </div>

      {/* Running Job Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            Currently Executing ({runningJobs.length})
          </h2>
          {runningJobs.length > 0 && (
            <button
              onClick={handleInterrupt}
              disabled={isInterrupting}
              className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-rose-500/30 flex items-center gap-1 transition-all"
            >
              <Square className="w-3 h-3 fill-current" />
              Interrupt Running Job
            </button>
          )}
        </div>

        {runningJobs.length > 0 ? (
          <div className="space-y-3">
            {runningJobs.map((job: any, index: number) => {
              const promptId = Array.isArray(job) ? job[1] : job.promptId || 'running';
              const promptDetails = Array.isArray(job) ? job[2] : job.prompt;

              return (
                <div
                  key={index}
                  className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/30 via-zinc-900 to-zinc-900 border border-amber-500/30 space-y-3 shadow-lg"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-xs font-mono font-bold">
                        Running Job
                      </span>
                      <span className="text-xs font-mono text-zinc-400 truncate max-w-xs">
                        ID: {promptId}
                      </span>
                    </div>

                    <button
                      onClick={handleInterrupt}
                      className="text-xs font-medium text-rose-400 hover:text-rose-300 flex items-center gap-1 bg-rose-500/10 px-2 py-1 rounded"
                    >
                      <Square className="w-3 h-3 fill-current" />
                      Interrupt
                    </button>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-zinc-300">
                      <span className="font-mono">
                        Active Node: {executingNodeId ? `#${executingNodeId}` : 'Initializing...'}
                      </span>
                      {executionProgress && (
                        <span className="font-mono font-bold text-amber-400">
                          Step {executionProgress.value} / {executionProgress.max}
                        </span>
                      )}
                    </div>
                    <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-amber-400 h-full rounded-full transition-all duration-150"
                        style={{
                          width: executionProgress
                            ? `${(executionProgress.value / executionProgress.max) * 100}%`
                            : '100%',
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-6 rounded-2xl border border-zinc-800/80 bg-zinc-900/40 text-center space-y-1">
            <p className="text-xs font-medium text-zinc-400">
              No workflow currently running on ComfyUI
            </p>
            <p className="text-[11px] text-zinc-400">
              {isOnline
                ? 'Your local ComfyUI GPU is idle and ready.'
                : 'Connect your local ComfyUI to monitor jobs.'}
            </p>
          </div>
        )}
      </div>

      {/* Pending Queue Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
            <Clock className="w-4 h-4 text-zinc-400" />
            Pending Queue ({pendingJobs.length})
          </h2>
        </div>

        {pendingJobs.length > 0 ? (
          <div className="space-y-2">
            {pendingJobs.map((job: any, index: number) => {
              const promptId = Array.isArray(job) ? job[1] : job.promptId || `pending_${index}`;

              return (
                <div
                  key={index}
                  className="p-3.5 rounded-xl bg-zinc-900/70 border border-zinc-800 flex items-center justify-between gap-3 hover:border-zinc-700 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-6 h-6 rounded-full bg-zinc-800 text-zinc-300 font-mono text-xs font-bold flex items-center justify-center shrink-0">
                      {index + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-mono text-zinc-200 truncate">
                        Prompt #{promptId}
                      </p>
                      <p className="text-[10px] text-zinc-400 mt-0.5">
                        Awaiting execution turn
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleCancelJob(promptId)}
                    disabled={cancellingId === promptId}
                    className="p-2 rounded-lg bg-zinc-800 hover:bg-rose-500/20 text-zinc-400 hover:text-rose-400 transition-colors text-xs font-medium flex items-center gap-1 shrink-0"
                    title="Remove from queue"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Cancel</span>
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-6 rounded-2xl border border-zinc-800/80 bg-zinc-900/40 text-center space-y-1">
            <p className="text-xs font-medium text-zinc-400">
              Queue is empty
            </p>
            <p className="text-[11px] text-zinc-400">
              Queued workflows from Generate Image or Generate Video will appear here.
            </p>
          </div>
        )}
      </div>

      {/* Quick Launch Shortcuts */}
      <div className="pt-4 border-t border-zinc-800/80 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          onClick={() => setActiveTab('generate-image')}
          className="p-4 rounded-xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-left space-y-1 transition-all"
        >
          <div className="text-xs font-semibold text-zinc-200 flex items-center justify-between">
            <span>Queue New Image</span>
            <ArrowUpRight className="w-4 h-4 text-zinc-400" />
          </div>
          <p className="text-[11px] text-zinc-400">
            Qwen Image Edit or Krea 2 photorealistic workflows
          </p>
        </button>

        <button
          onClick={() => setActiveTab('generate-video')}
          className="p-4 rounded-xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-left space-y-1 transition-all"
        >
          <div className="text-xs font-semibold text-indigo-300 flex items-center justify-between">
            <span>Queue MiniMax H3 Video</span>
            <ArrowUpRight className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-[11px] text-zinc-400">
            Multimodal video generation with Picture 1 reference
          </p>
        </button>
      </div>
    </div>
  );
};
