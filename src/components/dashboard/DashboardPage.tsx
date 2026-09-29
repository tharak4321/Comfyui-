import React from 'react';
import {
  Activity,
  Cpu,
  HardDrive,
  Layers,
  Image as ImageIcon,
  Video,
  Play,
  ArrowRight,
  RefreshCw,
  ExternalLink,
  Sparkles,
  Wifi,
  WifiOff,
  CheckCircle2,
  Clock,
  Square,
} from 'lucide-react';
import { useComfy } from '../../context/ComfyContext';
import { StatusBanner } from '../common/StatusBanner';

interface DashboardPageProps {
  setActiveTab: (tab: string) => void;
  onSelectMedia?: (mediaId: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  setActiveTab,
  onSelectMedia,
}) => {
  const {
    isOnline,
    connectionStatus,
    backendUrl,
    systemStats,
    latencyMs,
    queue,
    galleryItems,
    checkConnection,
    isGenerating,
    executionProgress,
    executingNodeId,
    interruptExecution,
  } = useComfy();

  const primaryGpu = systemStats?.devices?.[0];
  const runningCount = queue.queue_running.length;
  const pendingCount = queue.queue_pending.length;
  const recentOutputs = galleryItems.slice(0, 4);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Top Banner if disconnected */}
      <StatusBanner onOpenSettings={() => setActiveTab('settings')} />

      {/* Hero Welcome & Quick Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-zinc-900 via-zinc-900/90 to-indigo-950/40 p-5 rounded-2xl border border-zinc-800 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Comfy Remote Control
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              Windows UI
            </span>
          </div>
          <p className="text-xs sm:text-sm text-zinc-400">
            Control your local ComfyUI instance, queue MiniMax H3 video workflows, and manage outputs.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setActiveTab('generate-image')}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-medium text-xs sm:text-sm transition-all shadow-sm"
          >
            <ImageIcon className="w-4 h-4 text-emerald-400" />
            Image Studio
          </button>
          <button
            onClick={() => setActiveTab('generate-video')}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs sm:text-sm transition-all shadow-md shadow-indigo-600/30"
          >
            <Video className="w-4 h-4" />
            MiniMax H3 Video
          </button>
        </div>
      </div>

      {/* Live Monitoring Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Connection Status Card */}
        <div className="p-4 rounded-2xl bg-zinc-900/70 border border-zinc-800/80 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              ComfyUI Core
            </span>
            {isOnline ? (
              <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Live
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-xs text-rose-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-rose-400" />
                Offline
              </span>
            )}
          </div>

          <div className="my-3">
            <div className="text-lg font-bold text-white truncate">
              {isOnline ? 'Online & Listening' : 'Awaiting Connection'}
            </div>
            <p className="text-xs text-zinc-400 truncate mt-0.5 font-mono">
              {backendUrl}
            </p>
          </div>

          <div className="text-[11px] text-zinc-400 pt-2 border-t border-zinc-800/80 flex items-center justify-between">
            <span>Latency</span>
            <span className="font-mono text-zinc-300">
              {latencyMs !== null ? `${latencyMs} ms` : 'N/A'}
            </span>
          </div>
        </div>

        {/* GPU Status / Telemetry (Real or clearly placeholder) */}
        <div className="p-4 rounded-2xl bg-zinc-900/70 border border-zinc-800/80 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              GPU & VRAM
            </span>
            <Cpu className="w-4 h-4 text-indigo-400" />
          </div>

          <div className="my-3">
            {isOnline && primaryGpu ? (
              <>
                <div className="text-base font-bold text-white truncate">
                  {primaryGpu.name}
                </div>
                <div className="mt-1 flex items-center justify-between text-xs text-zinc-400">
                  <span>Free VRAM:</span>
                  <span className="font-mono text-emerald-400 font-bold">
                    {(primaryGpu.vram_free / (1024 * 1024 * 1024)).toFixed(1)} GB
                  </span>
                </div>
                {/* VRAM meter */}
                <div className="w-full bg-zinc-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.max(
                          5,
                          ((primaryGpu.vram_total - primaryGpu.vram_free) /
                            primaryGpu.vram_total) *
                            100
                        )
                      )}%`,
                    }}
                  />
                </div>
              </>
            ) : isOnline ? (
              <div className="text-sm font-medium text-zinc-300">
                GPU Available (CPU/Metal or Torch)
              </div>
            ) : (
              <div className="space-y-1">
                <div className="text-sm font-semibold text-zinc-400">
                  GPU Status Placeholder
                </div>
                <p className="text-[11px] text-zinc-400 leading-tight">
                  Telemetry will read directly from your Windows GPU when connected.
                </p>
              </div>
            )}
          </div>

          <div className="text-[11px] text-zinc-400 pt-2 border-t border-zinc-800/80 flex items-center justify-between">
            <span>Platform</span>
            <span className="font-mono text-zinc-300">
              {systemStats?.system?.os || (isOnline ? 'Active' : 'Disconnected')}
            </span>
          </div>
        </div>

        {/* Real-time Running Job Card */}
        <div className="p-4 rounded-2xl bg-zinc-900/70 border border-zinc-800/80 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Active Job
            </span>
            {isGenerating ? (
              <span className="flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 animate-pulse">
                Running
              </span>
            ) : (
              <span className="text-[11px] text-zinc-400">Idle</span>
            )}
          </div>

          <div className="my-3">
            {isGenerating ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-zinc-300">
                  <span className="font-mono">Node #{executingNodeId || '...'}</span>
                  {executionProgress && (
                    <span className="font-mono font-bold text-indigo-400">
                      Step {executionProgress.value}/{executionProgress.max}
                    </span>
                  )}
                </div>
                <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-indigo-500 h-full rounded-full transition-all duration-200"
                    style={{
                      width: executionProgress
                        ? `${(executionProgress.value / executionProgress.max) * 100}%`
                        : '100%',
                    }}
                  />
                </div>
              </div>
            ) : (
              <div>
                <div className="text-lg font-bold text-zinc-400">No Active Job</div>
                <p className="text-xs text-zinc-400 mt-0.5">Ready for next prompt</p>
              </div>
            )}
          </div>

          <div className="text-[11px] text-zinc-400 pt-2 border-t border-zinc-800/80 flex items-center justify-between">
            <span>Action</span>
            {isGenerating ? (
              <button
                onClick={() => interruptExecution()}
                className="text-xs text-rose-400 hover:text-rose-300 font-semibold flex items-center gap-1"
              >
                <Square className="w-3 h-3 fill-current" />
                Interrupt
              </button>
            ) : (
              <span className="text-zinc-400">Standby</span>
            )}
          </div>
        </div>

        {/* Queue Overview Card */}
        <div className="p-4 rounded-2xl bg-zinc-900/70 border border-zinc-800/80 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Queue Position
            </span>
            <Layers className="w-4 h-4 text-zinc-400" />
          </div>

          <div className="my-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white font-mono">
              {pendingCount}
            </span>
            <span className="text-xs text-zinc-400">in waiting line</span>
          </div>

          <div className="text-[11px] text-zinc-400 pt-2 border-t border-zinc-800/80 flex items-center justify-between">
            <span>Session Outputs</span>
            <span className="font-mono text-indigo-400 font-semibold">
              {galleryItems.length}
            </span>
          </div>
        </div>
      </div>

      {/* MiniMax H3 Video Feature Card */}
      <div className="p-5 rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-indigo-950/40 via-zinc-900 to-zinc-900/90 relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500 text-white tracking-wide uppercase">
                Dedicated Feature
              </span>
              <h2 className="text-lg font-bold text-white">
                MiniMax H3 Video Generation
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-zinc-300">
              Direct integration with local MiniMax H3 workflow. Includes structured multimodal prompt formatting with Picture 1 reference, dialogue lip-sync rules, and ComfyUI node mapping.
            </p>
          </div>

          <button
            onClick={() => setActiveTab('generate-video')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs sm:text-sm transition-all shadow-lg shadow-indigo-600/30 shrink-0"
          >
            Launch MiniMax Studio
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Recent Outputs Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-white">Recent Outputs</h2>
            <span className="text-xs text-zinc-400 font-mono">
              ({galleryItems.length} total)
            </span>
          </div>
          <button
            onClick={() => setActiveTab('gallery')}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 transition-colors"
          >
            View all
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentOutputs.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {recentOutputs.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  if (onSelectMedia) onSelectMedia(item.id);
                  setActiveTab('gallery');
                }}
                className="group relative aspect-square rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800 hover:border-indigo-500/50 cursor-pointer transition-all"
              >
                {item.type === 'video' ? (
                  <video
                    src={item.url}
                    className="w-full h-full object-cover"
                    muted
                    loop
                    playsInline
                    onMouseOver={(e) => (e.target as HTMLVideoElement).play().catch(() => {})}
                    onMouseOut={(e) => (e.target as HTMLVideoElement).pause()}
                  />
                ) : (
                  <img
                    src={item.url}
                    alt={item.filename}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-2.5 flex flex-col justify-end">
                  <span className="text-[10px] font-medium text-white truncate">
                    {item.filename}
                  </span>
                  <span className="text-[9px] text-zinc-400 uppercase tracking-wider font-mono">
                    {item.type}
                  </span>
                </div>

                <div className="absolute top-2 left-2">
                  <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-black/70 text-zinc-300 backdrop-blur-sm">
                    {item.type}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 rounded-2xl border border-zinc-800/80 bg-zinc-900/40 text-center space-y-2">
            <ImageIcon className="w-8 h-8 text-zinc-400 mx-auto" />
            <p className="text-sm font-medium text-zinc-300">
              No outputs generated yet
            </p>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto">
              {isOnline
                ? 'Queue a generation from the Image or Video page to see outputs here in real-time.'
                : 'Connect your local ComfyUI to browse previous generations from your ComfyUI output folder.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
