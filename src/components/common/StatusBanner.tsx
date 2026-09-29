import React, { useState } from 'react';
import {
  AlertTriangle,
  RefreshCw,
  Sliders,
  ChevronDown,
  ChevronUp,
  Terminal,
  HelpCircle,
  Copy,
  Check,
} from 'lucide-react';
import { useComfy } from '../../context/ComfyContext';

interface StatusBannerProps {
  onOpenSettings: () => void;
}

export const StatusBanner: React.FC<StatusBannerProps> = ({ onOpenSettings }) => {
  const { isOnline, connectionStatus, lastError, checkConnection, backendUrl } = useComfy();
  const [showTips, setShowTips] = useState(false);
  const [copied, setCopied] = useState(false);

  if (isOnline) return null;

  const launchCommand = 'python main.py --listen 0.0.0.0 --enable-cors-header *';

  const handleCopy = () => {
    navigator.clipboard.writeText(launchCommand);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mb-6 rounded-2xl border border-rose-500/30 bg-gradient-to-r from-rose-950/40 via-zinc-900 to-zinc-900/90 p-4 shadow-lg">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 shrink-0 mt-0.5 sm:mt-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-rose-300">
                Local ComfyUI Disconnected
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">
                {backendUrl}
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1 max-w-xl">
              {lastError ||
                'Ensure your local ComfyUI installation on Windows is running and accessible.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
          <button
            onClick={() => checkConnection()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-200 transition-colors"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${
                connectionStatus === 'connecting' ? 'animate-spin' : ''
              }`}
            />
            Retry
          </button>
          <button
            onClick={onOpenSettings}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-xs font-medium text-indigo-300 transition-colors"
          >
            <Sliders className="w-3.5 h-3.5" />
            Settings
          </button>
          <button
            onClick={() => setShowTips(!showTips)}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 transition-colors"
            title="Troubleshooting tips"
          >
            {showTips ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {showTips && (
        <div className="mt-4 pt-3 border-t border-zinc-800/80 text-xs text-zinc-400 space-y-2">
          <div className="font-medium text-zinc-300 flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
            How to allow remote / mobile browser access to ComfyUI on Windows:
          </div>
          <p>
            By default, ComfyUI only binds to <code className="text-zinc-200 bg-zinc-800 px-1 py-0.5 rounded">127.0.0.1</code> and blocks cross-origin requests. Launch ComfyUI with the following arguments:
          </p>

          <div className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-black/60 font-mono text-zinc-300 border border-zinc-800">
            <div className="flex items-center gap-2 overflow-x-auto">
              <Terminal className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="text-[11px] select-all whitespace-nowrap">
                {launchCommand}
              </span>
            </div>
            <button
              onClick={handleCopy}
              className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white shrink-0"
              title="Copy launch arguments"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>

          <p className="text-[11px] text-zinc-400">
            Tip: In your Windows ComfyUI folder, edit your <code className="text-zinc-300">run_nvidia_gpu.bat</code> and append <code className="text-zinc-300">--listen 0.0.0.0 --enable-cors-header *</code> to the python launch line.
          </p>
        </div>
      )}
    </div>
  );
};
