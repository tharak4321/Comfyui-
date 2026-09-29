import React from 'react';
import {
  LayoutDashboard,
  Image as ImageIcon,
  Video,
  Layers,
  Images,
  Settings,
} from 'lucide-react';
import { useComfy } from '../../context/ComfyContext';

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab }) => {
  const { queue } = useComfy();
  const totalActiveJobs = queue.queue_running.length + queue.queue_pending.length;

  const items = [
    {
      id: 'dashboard',
      label: 'Home',
      icon: LayoutDashboard,
    },
    {
      id: 'generate-image',
      label: 'Image',
      icon: ImageIcon,
    },
    {
      id: 'generate-video',
      label: 'Video',
      icon: Video,
      highlight: true,
    },
    {
      id: 'queue',
      label: 'Queue',
      icon: Layers,
      badge: totalActiveJobs > 0 ? totalActiveJobs : null,
    },
    {
      id: 'gallery',
      label: 'Gallery',
      icon: Images,
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
    },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-zinc-950/95 backdrop-blur-lg border-t border-zinc-800/80 px-2 py-1.5 safe-bottom">
      <div className="flex items-center justify-around">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`relative flex flex-col items-center justify-center py-1 px-2 min-w-[50px] rounded-xl transition-all duration-150 ${
                isActive
                  ? 'text-indigo-400 font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform duration-150 ${
                    isActive ? 'scale-110 text-indigo-400' : 'text-zinc-400'
                  }`}
                />
                {item.badge && (
                  <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-amber-500 text-black text-[10px] font-bold flex items-center justify-center font-mono">
                    {item.badge}
                  </span>
                )}
                {item.highlight && !isActive && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-indigo-500" />
                )}
              </div>
              <span className="text-[10px] mt-1 tracking-tight truncate">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
