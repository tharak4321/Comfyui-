import React from 'react';
import {
  LayoutDashboard,
  Image as ImageIcon,
  Video,
  Layers,
  Images,
  Settings,
  Activity,
  Cpu,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { useComfy } from '../../context/ComfyContext';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const {
    isOnline,
    systemStats,
    queue,
    galleryItems,
    backendUrl,
    checkConnection,
    connectionStatus,
  } = useComfy();

  const totalActiveJobs = queue.queue_running.length + queue.queue_pending.length;

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'generate-image',
      label: 'Generate Image',
      icon: ImageIcon,
      sublabel: 'Qwen & Krea 2',
      badge: null,
    },
    {
      id: 'generate-video',
      label: 'Generate Video',
      icon: Video,
      sublabel: 'MiniMax H3',
      badge: 'H3',
      badgeColor: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
    },
    {
      id: 'queue',
      label: 'Queue',
      icon: Layers,
      badge: totalActiveJobs > 0 ? String(totalActiveJobs) : null,
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    },
    {
      id: 'gallery',
      label: 'Gallery',
      icon: Images,
      badge: galleryItems.length > 0 ? String(galleryItems.length) : null,
      badgeColor: 'bg-zinc-800 text-zinc-400 border-zinc-700',
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      badge: null,
    },
  ];

  const primaryGpu = systemStats?.devices?.[0];

  return (
    <aside className="hidden md:flex flex-col w-64 bg-zinc-950 border-r border-zinc-800/80 p-4 shrink-0 justify-between select-none">
      <div className="space-y-6">
        {/* Navigation list */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 ${
                  isActive
                    ? 'bg-indigo-600/15 text-white border border-indigo-500/40 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-colors ${
                      isActive ? 'text-indigo-400' : 'text-zinc-400'
                    }`}
                  />
                  <div className="text-left truncate">
                    <div className="truncate font-semibold">{item.label}</div>
                    {item.sublabel && (
                      <div className="text-[10px] text-zinc-500 -mt-0.5 truncate">
                        {item.sublabel}
                      </div>
                    )}
                  </div>
                </div>

                {item.badge && (
                  <span
                    className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                      item.badgeColor || 'bg-zinc-800 text-zinc-300'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom hardware / connection status card */}
      <div className="pt-4 border-t border-zinc-800/80 space-y-3">
        <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-zinc-400 font-medium flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-zinc-400" />
              Hardware Status
            </span>
            <button
              onClick={() => checkConnection()}
              className="text-zinc-400 hover:text-zinc-200 transition-colors"
              title="Refresh connection"
            >
              <RefreshCw
                className={`w-3 h-3 ${
                  connectionStatus === 'connecting' ? 'animate-spin' : ''
                }`}
              />
            </button>
          </div>

          {isOnline && primaryGpu ? (
            <div className="space-y-1">
              <p className="text-xs font-semibold text-zinc-200 truncate">
                {primaryGpu.name}
              </p>
              <div className="text-[11px] text-zinc-400 flex items-center justify-between">
                <span>VRAM Free:</span>
                <span className="font-mono text-emerald-400">
                  {(primaryGpu.vram_free / (1024 * 1024 * 1024)).toFixed(1)} GB /{' '}
                  {(primaryGpu.vram_total / (1024 * 1024 * 1024)).toFixed(1)} GB
                </span>
              </div>
            </div>
          ) : isOnline ? (
            <div className="text-xs text-emerald-400 font-medium">
              ComfyUI Connected
              <p className="text-[10px] text-zinc-400 mt-0.5">
                OS: {systemStats?.system?.os || 'Windows'}
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              <p className="text-xs font-medium text-rose-400">
                Backend Offline
              </p>
              <p className="text-[10px] text-zinc-400 leading-tight">
                Connect your local ComfyUI instance to view GPU & queue.
              </p>
            </div>
          )}
        </div>

        <div className="text-[10px] text-zinc-400 flex items-center justify-between px-1">
          <span className="truncate">{backendUrl.replace(/^https?:\/\//, '')}</span>
          <span className="font-mono">Windows Remote</span>
        </div>
      </div>
    </aside>
  );
};
