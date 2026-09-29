import React, { useState } from 'react';
import {
  Settings,
  Server,
  Key,
  Wifi,
  WifiOff,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Terminal,
  Copy,
  Check,
  RefreshCw,
  ExternalLink,
  Sliders,
  ShieldCheck,
  Smartphone,
  Layers,
} from 'lucide-react';
import { useComfy } from '../../context/ComfyContext';
import { MiniMaxNodeMapping } from '../../types/comfy';
import { DEFAULT_MINIMAX_NODE_MAPPING } from '../../utils/workflowTemplates';

export const SettingsPage: React.FC = () => {
  const {
    backendUrl,
    setBackendUrl,
    authToken,
    setAuthToken,
    connectionStatus,
    isOnline,
    systemStats,
    latencyMs,
    checkConnection,
    miniMaxMapping,
    updateMiniMaxMapping,
    clientId,
  } = useComfy();

  const [urlInput, setUrlInput] = useState(backendUrl);
  const [tokenInput, setTokenInput] = useState(authToken);
  const [testResult, setTestResult] = useState<{
    ok: boolean;
    message: string;
  } | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [copiedCmd, setCopiedCmd] = useState(false);

  // Mapping state
  const [mapping, setMapping] = useState<MiniMaxNodeMapping>(miniMaxMapping);
  const [savedMappingMsg, setSavedMappingMsg] = useState(false);

  const launchCmd = 'python main.py --listen 0.0.0.0 --enable-cors-header *';

  const handleSaveConnection = async (e: React.FormEvent) => {
    e.preventDefault();
    setBackendUrl(urlInput.trim());
    setAuthToken(tokenInput.trim());
    setIsTesting(true);
    const res = await checkConnection();
    setIsTesting(false);
    setTestResult({
      ok: res.ok,
      message: res.message,
    });
  };

  const handleTestOnly = async () => {
    setIsTesting(true);
    const res = await checkConnection();
    setIsTesting(false);
    setTestResult({
      ok: res.ok,
      message: res.message,
    });
  };

  const handleCopyCmd = () => {
    navigator.clipboard.writeText(launchCmd);
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 2000);
  };

  const handleSaveMapping = () => {
    updateMiniMaxMapping(mapping);
    setSavedMappingMsg(true);
    setTimeout(() => setSavedMappingMsg(false), 3000);
  };

  const primaryGpu = systemStats?.devices?.[0];

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16">
      {/* Header */}
      <div className="bg-zinc-900/70 p-4 sm:p-5 rounded-2xl border border-zinc-800">
        <h1 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
          <Settings className="w-5 h-5 text-indigo-400" />
          Comfy Remote Settings
        </h1>
        <p className="text-xs text-zinc-400 mt-1">
          Configure connection to your Windows ComfyUI installation, API authentication, and MiniMax H3 workflow node mappings.
        </p>
      </div>

      {/* Backend Connection Form */}
      <form
        onSubmit={handleSaveConnection}
        className="bg-zinc-900/80 p-5 rounded-2xl border border-zinc-800 space-y-4 shadow-lg"
      >
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-indigo-400" />
            <h2 className="text-sm font-bold text-white">Local ComfyUI Backend URL</h2>
          </div>

          <span
            className={`text-xs px-2.5 py-0.5 rounded-full font-medium flex items-center gap-1.5 ${
              isOnline
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
            }`}
          >
            {isOnline ? (
              <>
                <Wifi className="w-3 h-3" />
                Connected ({latencyMs}ms)
              </>
            ) : (
              <>
                <WifiOff className="w-3 h-3" />
                Disconnected
              </>
            )}
          </span>
        </div>

        {/* URL Input */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-zinc-300">
            ComfyUI Server Address (HTTP / IP / Hostname)
          </label>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <input
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="http://127.0.0.1:8188 or http://192.168.1.100:8188"
              className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-zinc-100 font-mono focus:ring-2 focus:ring-indigo-500 outline-none"
            />
            <button
              type="button"
              onClick={handleTestOnly}
              disabled={isTesting}
              className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-zinc-700 flex items-center justify-center gap-1.5 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
              Test Connection
            </button>
          </div>
          <p className="text-[11px] text-zinc-500">
            Default is <code className="text-zinc-400">http://127.0.0.1:8188</code> when browsing on the same PC. For phone or tablet access, use your Windows PC LAN IP (e.g. <code className="text-zinc-400">http://192.168.1.X:8188</code>).
          </p>
        </div>

        {/* Auth Token Input */}
        <div className="space-y-1.5 pt-2 border-t border-zinc-800/80">
          <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
            <Key className="w-3.5 h-3.5 text-indigo-400" />
            Authentication Token / Password (Optional)
          </label>
          <input
            type="password"
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
            placeholder="Bearer token (leave blank if default local ComfyUI with no auth)"
            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-zinc-200 font-mono focus:ring-2 focus:ring-indigo-500 outline-none"
          />
          <p className="text-[11px] text-zinc-500">
            Only needed if you configured an authentication proxy or ComfyUI auth extension.
          </p>
        </div>

        {/* Client ID info */}
        <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-1 font-mono">
          <span>Client Session ID:</span>
          <span className="text-zinc-400">{clientId}</span>
        </div>

        {/* Test Result alert */}
        {testResult && (
          <div
            className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${
              testResult.ok
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
            }`}
          >
            {testResult.ok ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            )}
            <div>
              <p className="font-semibold">{testResult.ok ? 'Connected' : 'Connection Failed'}</p>
              <p className="mt-0.5">{testResult.message}</p>
            </div>
          </div>
        )}

        {/* Submit */}
        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={isTesting}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs sm:text-sm transition-colors shadow-md shadow-indigo-600/30"
          >
            Save & Connect
          </button>
        </div>
      </form>

      {/* Real Hardware Telemetry (Only when connected) */}
      {isOnline && (
        <div className="bg-zinc-900/80 p-5 rounded-2xl border border-zinc-800 space-y-3">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Verified ComfyUI Instance Telemetry
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
            <div className="p-3 rounded-xl bg-zinc-800/60 border border-zinc-700/60 space-y-1">
              <span className="text-zinc-400 text-[10px] uppercase">Operating System</span>
              <p className="text-zinc-200 font-semibold">{systemStats?.system?.os || 'Windows'}</p>
              <p className="text-[10px] text-zinc-400">
                Python: {systemStats?.system?.python_version || 'Detected'}
              </p>
            </div>

            {primaryGpu && (
              <div className="p-3 rounded-xl bg-zinc-800/60 border border-zinc-700/60 space-y-1">
                <span className="text-zinc-400 text-[10px] uppercase">Graphics Card</span>
                <p className="text-emerald-400 font-semibold truncate">{primaryGpu.name}</p>
                <p className="text-[10px] text-zinc-400">
                  VRAM: {(primaryGpu.vram_free / (1024 * 1024 * 1024)).toFixed(2)} GB free /{' '}
                  {(primaryGpu.vram_total / (1024 * 1024 * 1024)).toFixed(2)} GB total
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MiniMax H3 Workflow Node Mapping Config */}
      <div className="bg-zinc-900/80 p-5 rounded-2xl border border-zinc-800 space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-400" />
            <h2 className="text-sm font-bold text-white">
              MiniMax H3 Workflow Node Mapping
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setMapping(DEFAULT_MINIMAX_NODE_MAPPING)}
            className="text-xs text-zinc-400 hover:text-zinc-200"
          >
            Reset to Standard
          </button>
        </div>

        <p className="text-xs text-zinc-400">
          When submitting a MiniMax H3 generation, Comfy Remote injects prompt text, reference image, and seed into these ComfyUI node IDs:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="space-y-1">
            <label className="text-zinc-300 font-medium">Prompt Node ID</label>
            <input
              type="text"
              value={mapping.promptNodeId}
              onChange={(e) => setMapping({ ...mapping, promptNodeId: e.target.value })}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2 font-mono text-zinc-200"
              placeholder="2"
            />
            <span className="text-[10px] text-zinc-500">Node with text input (CLIPTextEncode)</span>
          </div>

          <div className="space-y-1">
            <label className="text-zinc-300 font-medium">Image Input Node ID</label>
            <input
              type="text"
              value={mapping.imageNodeId}
              onChange={(e) => setMapping({ ...mapping, imageNodeId: e.target.value })}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2 font-mono text-zinc-200"
              placeholder="1"
            />
            <span className="text-[10px] text-zinc-500">Node for Picture 1 (LoadImage)</span>
          </div>

          <div className="space-y-1">
            <label className="text-zinc-300 font-medium">Seed Node ID</label>
            <input
              type="text"
              value={mapping.seedNodeId || ''}
              onChange={(e) => setMapping({ ...mapping, seedNodeId: e.target.value })}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2 font-mono text-zinc-200"
              placeholder="3"
            />
            <span className="text-[10px] text-zinc-500">Sampler node seed input</span>
          </div>

          <div className="space-y-1">
            <label className="text-zinc-300 font-medium">Duration & Resolution Node ID</label>
            <input
              type="text"
              value={mapping.durationNodeId || ''}
              onChange={(e) => setMapping({ ...mapping, durationNodeId: e.target.value })}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2 font-mono text-zinc-200"
              placeholder="6"
            />
            <span className="text-[10px] text-zinc-500">EmptyLatentImage / length</span>
          </div>
        </div>

        {savedMappingMsg && (
          <div className="text-xs text-emerald-400 font-medium flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" />
            Node mapping saved successfully!
          </div>
        )}

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={handleSaveMapping}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors"
          >
            Save Node Mapping
          </button>
        </div>
      </div>

      {/* Windows Local ComfyUI Setup Guide */}
      <div className="bg-zinc-900/60 p-5 rounded-2xl border border-zinc-800 space-y-3">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <Smartphone className="w-4 h-4 text-indigo-400" />
          Windows Setup & Mobile Access Guide
        </h2>

        <div className="space-y-3 text-xs text-zinc-400 leading-relaxed">
          <p>
            To control ComfyUI from your smartphone, tablet, or another browser on your local network:
          </p>

          <ol className="list-decimal list-inside space-y-2 pl-1 text-zinc-300">
            <li>
              Open your ComfyUI installation folder on Windows.
            </li>
            <li>
              Edit your launch batch file (e.g. <code className="text-indigo-300 bg-zinc-800 px-1 py-0.5 rounded">run_nvidia_gpu.bat</code>).
            </li>
            <li>
              Add the network listening and CORS flags to the python execution line:
            </li>
          </ol>

          <div className="flex items-center justify-between gap-2 p-3 rounded-xl bg-black/70 border border-zinc-800 font-mono text-xs text-zinc-200">
            <div className="flex items-center gap-2 overflow-x-auto">
              <Terminal className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="whitespace-nowrap select-all">{launchCmd}</span>
            </div>
            <button
              onClick={handleCopyCmd}
              className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white shrink-0"
              title="Copy"
            >
              {copiedCmd ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          <div className="p-3 rounded-xl bg-zinc-800/40 border border-zinc-800 text-[11px] text-zinc-400 space-y-1">
            <p className="font-semibold text-zinc-300">Finding your Windows PC LAN IP:</p>
            <p>
              Open Windows Command Prompt (<kbd className="bg-zinc-800 px-1 rounded text-zinc-300">cmd</kbd>) and type <code className="text-zinc-200">ipconfig</code>. Look for your <code className="text-zinc-200">IPv4 Address</code> (e.g. 192.168.1.100). Use that address here in Comfy Remote!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
