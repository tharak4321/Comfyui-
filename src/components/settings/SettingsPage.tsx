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
    miniMaxWorkflow,
    miniMaxWorkflowValidation,
    clearMiniMaxWorkflow,
    importMiniMaxWorkflow,
  } = useComfy();

  const [urlInput, setUrlInput] = useState(backendUrl);
  const [tokenInput, setTokenInput] = useState(authToken);
  const [testResult, setTestResult] = useState<{
    ok: boolean;
    message: string;
  } | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [copiedCmd, setCopiedCmd] = useState(false);

  // Workflow import modal in settings
  const [showSettingsImport, setShowSettingsImport] = useState(false);
  const [settingsImportText, setSettingsImportText] = useState('');
  const [settingsImportError, setSettingsImportError] = useState<string | null>(null);
  const [settingsSuccessMsg, setSettingsSuccessMsg] = useState<string | null>(null);

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

      {/* Real MiniMax H3 API Workflow Configuration */}
      <div className="bg-zinc-900/80 p-5 rounded-2xl border border-zinc-800 space-y-4 shadow-lg">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-400" />
            <h2 className="text-sm font-bold text-white">
              MiniMax H3 API Workflow JSON
            </h2>
          </div>
          <span
            className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-full ${
              miniMaxWorkflow && miniMaxWorkflowValidation?.isValid
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
            }`}
          >
            {miniMaxWorkflow && miniMaxWorkflowValidation?.isValid
              ? `${miniMaxWorkflowValidation?.summary?.totalNodes} Nodes Validated`
              : 'Not Loaded'}
          </span>
        </div>

        <p className="text-xs text-zinc-400">
          Comfy Remote requires your real exported ComfyUI MiniMax H3 workflow in API format.
          The generator deep-clones this workflow, preserves all existing node links and fields, and updates strictly:
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono text-zinc-300 bg-black/40 p-3 rounded-xl border border-zinc-800">
          <div>• Node 138: <span className="text-indigo-400">value</span> (prompt)</div>
          <div>• Node 137: <span className="text-indigo-400">image</span> (ref picture)</div>
          <div>• Node 142: <span className="text-indigo-400">seed</span> (seed)</div>
          <div>• Node 132: <span className="text-indigo-400">value</span> (duration)</div>
          <div>• Node 115: <span className="text-indigo-400">aspect / mega</span></div>
          <div>• Node 149 / 146: <span className="text-indigo-400">FPS</span></div>
          <div>• Node 145: <span className="text-indigo-400">pingpong (saved)</span></div>
          <div className="text-emerald-400 font-sans font-semibold">✓ Zero fabrication</div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          {miniMaxWorkflow ? (
            <button
              type="button"
              onClick={() => {
                clearMiniMaxWorkflow();
                setSettingsSuccessMsg('MiniMax H3 workflow cleared.');
                setTimeout(() => setSettingsSuccessMsg(null), 3000);
              }}
              className="text-xs text-rose-400 hover:text-rose-300 font-medium self-start sm:self-center"
            >
              Clear Stored Workflow
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setSettingsImportText('');
                setSettingsImportError(null);
                setShowSettingsImport(true);
              }}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors shadow-md shadow-indigo-600/30"
            >
              {miniMaxWorkflow ? 'Replace Workflow JSON' : 'Import Workflow JSON'}
            </button>
          </div>
        </div>

        {settingsSuccessMsg && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs">
            {settingsSuccessMsg}
          </div>
        )}

        {/* Modal for importing in settings */}
        {showSettingsImport && (
          <div
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowSettingsImport(false)}
          >
            <div
              className="bg-zinc-900 border border-zinc-700 rounded-2xl max-w-xl w-full p-5 space-y-4 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <h3 className="font-bold text-white text-sm">
                  Import MiniMax H3 API Workflow JSON
                </h3>
                <button
                  type="button"
                  onClick={() => setShowSettingsImport(false)}
                  className="text-zinc-400 hover:text-white p-1 text-sm"
                >
                  ✕
                </button>
              </div>

              <p className="text-xs text-zinc-400">
                Paste your exported ComfyUI API format workflow JSON below. Required nodes (138, 137, 142, 132, 115, 149/146, 145) will be validated.
              </p>

              <textarea
                rows={8}
                value={settingsImportText}
                onChange={(e) => {
                  setSettingsImportText(e.target.value);
                  setSettingsImportError(null);
                }}
                placeholder="Paste JSON here..."
                className="w-full bg-black/70 border border-zinc-800 rounded-xl p-3 text-xs font-mono text-zinc-200 placeholder-zinc-600 focus:ring-2 focus:ring-indigo-500 outline-none leading-relaxed"
              />

              {settingsImportError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs whitespace-pre-line max-h-32 overflow-y-auto">
                  {settingsImportError}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowSettingsImport(false)}
                  className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!settingsImportText.trim()) {
                      setSettingsImportError('Please enter workflow JSON.');
                      return;
                    }
                    const res = importMiniMaxWorkflow(settingsImportText.trim());
                    if (res.isValid) {
                      setShowSettingsImport(false);
                      setSettingsImportText('');
                      setSettingsImportError(null);
                      setSettingsSuccessMsg(`Workflow imported successfully (${res.summary?.totalNodes} nodes verified).`);
                      setTimeout(() => setSettingsSuccessMsg(null), 5000);
                    } else {
                      setSettingsImportError(res.errors.join('\n'));
                    }
                  }}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/30"
                >
                  Save & Validate
                </button>
              </div>
            </div>
          </div>
        )}
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
