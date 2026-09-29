import React, { useState, useEffect, useRef } from 'react';
import {
  Video,
  Sparkles,
  Shuffle,
  FileCode,
  Sliders,
  Settings2,
  Clock,
  Film,
  Plus,
  Trash2,
  BookTemplate,
  Check,
  AlertCircle,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Eye,
  Maximize2,
  Edit3,
  Layers,
  Upload,
  FileText,
  AlertTriangle,
  Info,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { useComfy } from '../../context/ComfyContext';
import { ImageUpload } from '../common/ImageUpload';
import { StatusBanner } from '../common/StatusBanner';
import {
  MiniMaxH3StructuredPrompt,
  TimedDialogueLine,
  VideoWorkflowParams,
} from '../../types/comfy';
import {
  DEFAULT_MINIMAX_PROMPT,
  MINIMAX_TEMPLATES,
  formatMiniMaxPrompt,
  parseRawMiniMaxPrompt,
} from '../../utils/promptUtils';
import { validateMiniMaxH3Workflow } from '../../utils/minimaxWorkflow';

interface GenerateVideoPageProps {
  setActiveTab: (tab: string) => void;
}

export const GenerateVideoPage: React.FC<GenerateVideoPageProps> = ({ setActiveTab }) => {
  const {
    isOnline,
    isGenerating,
    executionProgress,
    executingNodeId,
    submitVideoGeneration,
    galleryItems,
    miniMaxWorkflow,
    miniMaxWorkflowRaw,
    miniMaxWorkflowValidation,
    importMiniMaxWorkflow,
    clearMiniMaxWorkflow,
  } = useComfy();

  const [workflowType, setWorkflowType] = useState<'minimax-h3' | 'custom-video'>('minimax-h3');
  const [editorMode, setEditorMode] = useState<'structured' | 'raw'>('structured');

  // MiniMax structured prompt fields
  const [structuredPrompt, setStructuredPrompt] = useState<MiniMaxH3StructuredPrompt>(() => {
    try {
      const saved = localStorage.getItem('comfy_minimax_structured');
      return saved ? JSON.parse(saved) : DEFAULT_MINIMAX_PROMPT;
    } catch {
      return DEFAULT_MINIMAX_PROMPT;
    }
  });

  // Raw prompt text
  const [rawPrompt, setRawPrompt] = useState<string>(() => {
    return localStorage.getItem('comfy_minimax_raw') || formatMiniMaxPrompt(DEFAULT_MINIMAX_PROMPT);
  });

  // Reference image (Picture 1 -> Node 137 input 'image')
  const [referenceFile, setReferenceFile] = useState<File | null>(null);
  const [referenceBase64, setReferenceBase64] = useState<string | null>(null);

  // Video parameters
  const [durationSeconds, setDurationSeconds] = useState<number>(5);
  const [aspectRatio, setAspectRatio] = useState<string>('9:16');
  const [megapixels, setMegapixels] = useState<number>(1.0);
  const [fps, setFps] = useState<number>(24);
  const [seed, setSeed] = useState<number>(4589210);
  const [randomizeSeed, setRandomizeSeed] = useState<boolean>(true);

  // Custom workflow JSON for custom-video mode
  const [customWorkflowJson, setCustomWorkflowJson] = useState<string>('');

  // Workflow Import & Inspector Modals
  const [showImportModal, setShowImportModal] = useState<boolean>(false);
  const [showInspectModal, setShowInspectModal] = useState<boolean>(false);
  const [importInputText, setImportInputText] = useState<string>('');
  const [importFileError, setImportFileError] = useState<string | null>(null);

  // UI state
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showPromptPreview, setShowPromptPreview] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync default megapixels and aspect ratio from node 115 if workflow is loaded
  useEffect(() => {
    if (miniMaxWorkflow && miniMaxWorkflow['115']?.inputs) {
      const inputs = miniMaxWorkflow['115'].inputs;
      if (inputs.aspect_ratio && typeof inputs.aspect_ratio === 'string') {
        const match = inputs.aspect_ratio.match(/(\d+:\d+)/);
        if (match) setAspectRatio(match[1]);
      }
      if (inputs.megapixels !== undefined && !isNaN(Number(inputs.megapixels))) {
        setMegapixels(Number(inputs.megapixels));
      }
    }
  }, [miniMaxWorkflow]);

  // Persist harmless preferences
  useEffect(() => {
    localStorage.setItem('comfy_minimax_structured', JSON.stringify(structuredPrompt));
  }, [structuredPrompt]);

  useEffect(() => {
    localStorage.setItem('comfy_minimax_raw', rawPrompt);
  }, [rawPrompt]);

  // Synchronize when switching editor modes
  const handleToggleMode = (mode: 'structured' | 'raw') => {
    if (mode === 'raw') {
      setRawPrompt(formatMiniMaxPrompt(structuredPrompt));
    } else {
      const parsed = parseRawMiniMaxPrompt(rawPrompt);
      setStructuredPrompt(parsed);
    }
    setEditorMode(mode);
  };

  // Template loader
  const handleApplyTemplate = (templateId: string) => {
    const found = MINIMAX_TEMPLATES.find((t) => t.id === templateId);
    if (found) {
      setStructuredPrompt(found.data);
      setRawPrompt(formatMiniMaxPrompt(found.data));
      setSelectedTemplateId(templateId);
    }
  };

  // Dialogue line handlers
  const handleAddDialogueLine = () => {
    const nextStart =
      structuredPrompt.dialogueLines.length > 0
        ? structuredPrompt.dialogueLines[structuredPrompt.dialogueLines.length - 1].endTime
        : '00:00';
    const nextEnd = '00:0' + (parseInt(nextStart.split(':')[1] || '0') + 3);

    const newLine: TimedDialogueLine = {
      id: Math.random().toString(36).substring(2, 9),
      startTime: nextStart,
      endTime: nextEnd,
      speaker: 'Speaker',
      text: '',
    };

    setStructuredPrompt((prev) => ({
      ...prev,
      dialogueLines: [...prev.dialogueLines, newLine],
    }));
  };

  const handleUpdateDialogueLine = (id: string, updates: Partial<TimedDialogueLine>) => {
    setStructuredPrompt((prev) => ({
      ...prev,
      dialogueLines: prev.dialogueLines.map((line) =>
        line.id === id ? { ...line, ...updates } : line
      ),
    }));
  };

  const handleDeleteDialogueLine = (id: string) => {
    setStructuredPrompt((prev) => ({
      ...prev,
      dialogueLines: prev.dialogueLines.filter((line) => line.id !== id),
    }));
  };

  // Workflow import handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportFileError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setImportInputText(content);
    };
    reader.onerror = () => {
      setImportFileError('Failed to read file.');
    };
    reader.readAsText(file);
  };

  const handleSaveImportedWorkflow = () => {
    if (!importInputText.trim()) {
      setImportFileError('Please paste or upload JSON content.');
      return;
    }

    const validation = importMiniMaxWorkflow(importInputText.trim());
    if (validation.isValid) {
      setShowImportModal(false);
      setImportInputText('');
      setImportFileError(null);
      setSuccessMsg(`MiniMax H3 API workflow imported successfully (${validation.summary?.totalNodes} nodes verified).`);
      setTimeout(() => setSuccessMsg(null), 5000);
    } else {
      setImportFileError(validation.errors.join('\n'));
    }
  };

  // Generate Video
  const handleGenerateVideo = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isOnline) {
      setErrorMsg('Cannot generate: ComfyUI is offline. Please connect your local instance in Settings.');
      return;
    }

    if (workflowType === 'minimax-h3') {
      if (!miniMaxWorkflow) {
        setErrorMsg('MiniMax H3 API workflow JSON is missing. Please import your exported ComfyUI workflow JSON before generating.');
        setShowImportModal(true);
        return;
      }

      if (!miniMaxWorkflowValidation?.isValid) {
        setErrorMsg(`Workflow validation failed:\n${miniMaxWorkflowValidation?.errors.join('\n')}`);
        return;
      }
    }

    const promptText = editorMode === 'structured' ? formatMiniMaxPrompt(structuredPrompt) : rawPrompt;
    if (!promptText.trim()) {
      setErrorMsg('Please specify a prompt or fill in multimodal instructions.');
      return;
    }

    setErrorMsg(null);
    setSuccessMsg(null);
    setIsSubmitting(true);

    try {
      const params: VideoWorkflowParams = {
        workflow: workflowType,
        mode: editorMode,
        structuredPrompt,
        rawPrompt,
        referenceImageFile: referenceFile,
        referenceImageBase64: referenceBase64,
        seed: randomizeSeed ? Math.floor(Math.random() * 1000000000) : seed,
        randomizeSeed,
        durationSeconds,
        resolution: aspectRatio,
        megapixels,
        fps,
        customWorkflowJson: workflowType === 'custom-video' ? customWorkflowJson : undefined,
      };

      const promptId = await submitVideoGeneration(params);
      if (promptId) {
        setSuccessMsg(`MiniMax H3 Video Queued (Prompt #${promptId.substring(0, 8)}...). Tracking WebSocket progress...`);
        setTimeout(() => setSuccessMsg(null), 8000);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Video generation failed to queue');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isWorkflowReady = workflowType === 'minimax-h3' ? Boolean(miniMaxWorkflow && miniMaxWorkflowValidation?.isValid) : true;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      <StatusBanner onOpenSettings={() => setActiveTab('settings')} />

      <form onSubmit={handleGenerateVideo} className="space-y-6">
        {/* Header with Title and Workflow Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-zinc-900 via-zinc-900 to-indigo-950/40 p-4 rounded-2xl border border-zinc-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-indigo-600 text-white">
                <Video className="w-5 h-5" />
              </span>
              <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                MiniMax H3 Video Studio
              </h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                Multimodal H3
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Real exported ComfyUI MiniMax H3 workflow with Picture 1 reference, dialogue lip-sync, and preserved node graph.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={workflowType}
              onChange={(e) => setWorkflowType(e.target.value as any)}
              className="bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs sm:text-sm rounded-xl px-3 py-2 font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="minimax-h3">MiniMax H3 (Exported API Workflow)</option>
              <option value="custom-video">Custom Video Workflow JSON</option>
            </select>
          </div>
        </div>

        {/* Real MiniMax H3 Workflow Status Card */}
        {workflowType === 'minimax-h3' && (
          <div className={`p-4 rounded-2xl border transition-all ${
            isWorkflowReady
              ? 'bg-zinc-900/80 border-emerald-500/30 shadow-sm'
              : 'bg-gradient-to-r from-rose-950/30 via-zinc-900 to-zinc-900 border-rose-500/40'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  {isWorkflowReady ? (
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  )}
                  <h3 className="text-xs sm:text-sm font-bold text-white">
                    {isWorkflowReady
                      ? `MiniMax H3 API Workflow Loaded (${miniMaxWorkflowValidation?.summary?.totalNodes} Nodes)`
                      : 'MiniMax H3 API Workflow Required'}
                  </h3>
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                    isWorkflowReady
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  }`}>
                    {isWorkflowReady ? 'Validated & Ready' : 'Missing Workflow'}
                  </span>
                </div>
                <p className="text-xs text-zinc-400">
                  {isWorkflowReady
                    ? 'Actual node mapping active: Prompt (138.value), Image (137.image), Seed (142.seed), Duration (132.value), Resolution (115.aspect_ratio/megapixels), FPS (149/146), Output (145.pingpong).'
                    : 'Please import your real exported MiniMax H3 API workflow JSON from ComfyUI to enable video generation. No fake placeholder workflow is used.'}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
                {isWorkflowReady && (
                  <button
                    type="button"
                    onClick={() => setShowInspectModal(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium border border-zinc-700 transition-colors"
                  >
                    <Layers className="w-3.5 h-3.5 text-indigo-400" />
                    Inspect Nodes
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setImportInputText(miniMaxWorkflowRaw || '');
                    setImportFileError(null);
                    setShowImportModal(true);
                  }}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    isWorkflowReady
                      ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700'
                      : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" />
                  {isWorkflowReady ? 'Replace Workflow' : 'Import Workflow JSON'}
                </button>
              </div>
            </div>

            {/* Checklist of actual mapped nodes */}
            {isWorkflowReady && (
              <div className="mt-3 pt-3 border-t border-zinc-800/80 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono text-zinc-400">
                <div className="flex items-center gap-1.5 text-zinc-300">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Prompt: Node 138 (value)</span>
                </div>
                <div className="flex items-center gap-1.5 text-zinc-300">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Ref Image: Node 137 (image)</span>
                </div>
                <div className="flex items-center gap-1.5 text-zinc-300">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Seed: Node 142 (seed)</span>
                </div>
                <div className="flex items-center gap-1.5 text-zinc-300">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Duration: Node 132 (value)</span>
                </div>
                <div className="flex items-center gap-1.5 text-zinc-300">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Res: Node 115 (aspect/mega)</span>
                </div>
                <div className="flex items-center gap-1.5 text-zinc-300">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>FPS: Node 149 / 146</span>
                </div>
                <div className="flex items-center gap-1.5 text-zinc-300">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Output: Node 145 (pingpong)</span>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                  <Check className="w-3.5 h-3.5" />
                  <span>Base Graph Preserved</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Custom Workflow JSON Editor (if custom-video selected) */}
        {workflowType === 'custom-video' && (
          <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <FileCode className="w-3.5 h-3.5 text-indigo-400" />
                Custom Video Workflow JSON
              </label>
            </div>
            <textarea
              rows={6}
              value={customWorkflowJson}
              onChange={(e) => setCustomWorkflowJson(e.target.value)}
              placeholder="Paste your exported ComfyUI video workflow JSON (API format)..."
              className="w-full bg-black/60 border border-zinc-800 rounded-xl p-3 text-xs font-mono text-zinc-300 focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
        )}

        {/* Reference Image (Picture 1 -> Node 137 input 'image') */}
        <div className="bg-zinc-900/60 p-4 rounded-2xl border border-zinc-800">
          <ImageUpload
            label="Picture 1: Reference Image Input (Node 137 input 'image')"
            description="Upload the initial character or visual conditioning image for MiniMax H3"
            imageFile={referenceFile}
            imageBase64={referenceBase64}
            onImageChange={(file, base64) => {
              setReferenceFile(file);
              setReferenceBase64(base64);
              if (file && !structuredPrompt.picture1Context) {
                setStructuredPrompt((prev) => ({
                  ...prev,
                  picture1Context: `Picture 1: Reference portrait based on ${file.name}`,
                }));
              }
            }}
          />
        </div>

        {/* Prompt Editor Header & Template Bar */}
        <div className="bg-zinc-900/80 p-4 rounded-2xl border border-zinc-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/80 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                Multimodal Prompt Editor (Node 138 input 'value')
              </span>
              <div className="flex items-center rounded-lg bg-zinc-800 p-0.5 border border-zinc-700/60">
                <button
                  type="button"
                  onClick={() => handleToggleMode('structured')}
                  className={`text-xs px-2.5 py-1 rounded-md transition-all ${
                    editorMode === 'structured'
                      ? 'bg-indigo-600 text-white font-medium shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Structured Builder
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleMode('raw')}
                  className={`text-xs px-2.5 py-1 rounded-md transition-all ${
                    editorMode === 'raw'
                      ? 'bg-indigo-600 text-white font-medium shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Raw Prompt Editor
                </button>
              </div>
            </div>

            {/* Reusable Templates Dropdown */}
            <div className="flex items-center gap-2">
              <BookTemplate className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <select
                value={selectedTemplateId}
                onChange={(e) => handleApplyTemplate(e.target.value)}
                className="bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-indigo-500 outline-none"
              >
                <option value="">Load Prompt Template Preset...</option>
                {MINIMAX_TEMPLATES.map((tpl) => (
                  <option key={tpl.id} value={tpl.id}>
                    {tpl.name} ({tpl.category})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* MODE 1: Structured Multimodal Builder */}
          {editorMode === 'structured' ? (
            <div className="space-y-4">
              {/* Picture 1 Context */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                  Picture 1: Reference Description
                </label>
                <input
                  type="text"
                  value={structuredPrompt.picture1Context}
                  onChange={(e) =>
                    setStructuredPrompt((prev) => ({
                      ...prev,
                      picture1Context: e.target.value,
                    }))
                  }
                  placeholder="Picture 1: A close-up portrait of character with..."
                  className="w-full bg-zinc-800/80 border border-zinc-700/80 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
                />
              </div>

              {/* Integrated Multimodal Description */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                  integrated_multimodal_description
                </label>
                <textarea
                  rows={2}
                  value={structuredPrompt.multimodalDescription}
                  onChange={(e) =>
                    setStructuredPrompt((prev) => ({
                      ...prev,
                      multimodalDescription: e.target.value,
                    }))
                  }
                  placeholder="integrated_multimodal_description: Cinematic handheld camera slowly tracking closer in a dimly lit rainy cyberpunk alley..."
                  className="w-full bg-zinc-800/80 border border-zinc-700/80 rounded-xl p-3 text-xs text-zinc-200 focus:ring-2 focus:ring-indigo-500 outline-none font-mono resize-y"
                />
              </div>

              {/* WHO SPEAKS & ACTIONS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    WHO SPEAKS
                  </label>
                  <input
                    type="text"
                    value={structuredPrompt.whoSpeaks}
                    onChange={(e) =>
                      setStructuredPrompt((prev) => ({
                        ...prev,
                        whoSpeaks: e.target.value,
                      }))
                    }
                    placeholder="WHO SPEAKS: Woman in obsidian glasses"
                    className="w-full bg-zinc-800/80 border border-zinc-700/80 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    ACTIONS
                  </label>
                  <input
                    type="text"
                    value={structuredPrompt.actions}
                    onChange={(e) =>
                      setStructuredPrompt((prev) => ({
                        ...prev,
                        actions: e.target.value,
                      }))
                    }
                    placeholder="ACTIONS: Slowly raises her hand, adjusts collar, breathes calmly..."
                    className="w-full bg-zinc-800/80 border border-zinc-700/80 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
                  />
                </div>
              </div>

              {/* STRICT LIP RULE */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                  STRICT LIP RULE
                </label>
                <input
                  type="text"
                  value={structuredPrompt.strictLipRule}
                  onChange={(e) =>
                    setStructuredPrompt((prev) => ({
                      ...prev,
                      strictLipRule: e.target.value,
                    }))
                  }
                  placeholder="STRICT LIP RULE: Synchronize mouth movement precisely with spoken words..."
                  className="w-full bg-zinc-800/80 border border-zinc-700/80 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
                />
              </div>

              {/* Timed Dialogue Lines */}
              <div className="space-y-2 pt-2 border-t border-zinc-800/80">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-zinc-300 flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-indigo-400" />
                    Timed Dialogue Lines ({structuredPrompt.dialogueLines.length})
                  </label>
                  <button
                    type="button"
                    onClick={handleAddDialogueLine}
                    className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-medium px-2 py-1 rounded bg-indigo-500/10 hover:bg-indigo-500/20 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Dialogue Line
                  </button>
                </div>

                <div className="space-y-2">
                  {structuredPrompt.dialogueLines.map((line) => (
                    <div
                      key={line.id}
                      className="p-2.5 rounded-xl bg-black/40 border border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center gap-2"
                    >
                      <div className="flex items-center gap-1 shrink-0 font-mono text-xs">
                        <input
                          type="text"
                          value={line.startTime}
                          onChange={(e) =>
                            handleUpdateDialogueLine(line.id, { startTime: e.target.value })
                          }
                          className="w-14 bg-zinc-800 border border-zinc-700 rounded px-1.5 py-1 text-center text-zinc-200 text-xs"
                          placeholder="00:00"
                        />
                        <span className="text-zinc-500">-</span>
                        <input
                          type="text"
                          value={line.endTime}
                          onChange={(e) =>
                            handleUpdateDialogueLine(line.id, { endTime: e.target.value })
                          }
                          className="w-14 bg-zinc-800 border border-zinc-700 rounded px-1.5 py-1 text-center text-zinc-200 text-xs"
                          placeholder="00:03"
                        />
                      </div>

                      <input
                        type="text"
                        value={line.speaker}
                        onChange={(e) =>
                          handleUpdateDialogueLine(line.id, { speaker: e.target.value })
                        }
                        placeholder="Speaker"
                        className="w-24 sm:w-28 bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-200 font-medium shrink-0"
                      />

                      <input
                        type="text"
                        value={line.text}
                        onChange={(e) =>
                          handleUpdateDialogueLine(line.id, { text: e.target.value })
                        }
                        placeholder="Spoken dialogue text line..."
                        className="flex-1 w-full bg-zinc-800 border border-zinc-700 rounded px-2.5 py-1 text-xs text-zinc-200"
                      />

                      <button
                        type="button"
                        onClick={() => handleDeleteDialogueLine(line.id)}
                        className="p-1 rounded text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors shrink-0 self-end sm:self-center"
                        title="Delete line"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* MODE 2: Large Raw Prompt Editor (Preserves exact line breaks) */
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span>Large Raw Editor (Line breaks strictly preserved)</span>
                <span className="font-mono">{rawPrompt.split('\n').length} lines</span>
              </div>
              <textarea
                rows={12}
                value={rawPrompt}
                onChange={(e) => setRawPrompt(e.target.value)}
                placeholder={`Picture 1: Reference description\nintegrated_multimodal_description: ...\nWHO SPEAKS: Character\nACTIONS: ...\nSTRICT LIP RULE: Synchronize lips...\n[00:00 - 00:03] Speaker: "Line"`}
                className="w-full bg-black/70 border border-zinc-800 rounded-xl p-3 text-xs sm:text-sm font-mono text-zinc-200 placeholder-zinc-600 focus:ring-2 focus:ring-indigo-500 outline-none leading-relaxed resize-y whitespace-pre"
              />
            </div>
          )}

          {/* Quick Preview Toggle */}
          <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setShowPromptPreview(!showPromptPreview)}
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5"
            >
              <Eye className="w-3.5 h-3.5" />
              {showPromptPreview ? 'Hide Output Prompt Preview' : 'Show Formatted Multimodal Payload'}
            </button>
          </div>

          {showPromptPreview && (
            <div className="p-3 rounded-xl bg-black/80 border border-zinc-800 text-[11px] font-mono text-zinc-300 whitespace-pre-wrap leading-relaxed select-all">
              {editorMode === 'structured' ? formatMiniMaxPrompt(structuredPrompt) : rawPrompt}
            </div>
          )}
        </div>

        {/* Video Output Controls: Duration (Node 132), Resolution & Megapixels (Node 115), FPS (Nodes 149/146), Seed (Node 142) */}
        <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-4">
          <div className="flex items-center gap-2 border-b border-zinc-800/80 pb-2">
            <Film className="w-4 h-4 text-indigo-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
              Workflow Parameters (Nodes 132, 115, 149/146, 142)
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Target Duration (Node 132 input 'value') */}
            <div className="space-y-1.5">
              <label className="text-xs text-zinc-400 flex items-center justify-between">
                <span>Duration (Node 132)</span>
                <span className="font-mono text-indigo-400 font-bold">
                  {durationSeconds}s
                </span>
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {[3, 5, 6, 10].map((dur) => (
                  <button
                    key={dur}
                    type="button"
                    onClick={() => setDurationSeconds(dur)}
                    className={`py-1.5 text-xs font-mono rounded-lg border transition-all ${
                      durationSeconds === dur
                        ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 font-bold'
                        : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {dur}s
                  </button>
                ))}
              </div>
            </div>

            {/* Resolution: Aspect Ratio (Node 115 input 'aspect_ratio') */}
            <div className="space-y-1.5">
              <label className="text-xs text-zinc-400 flex items-center justify-between">
                <span>Aspect Ratio (Node 115)</span>
                <span className="font-mono text-indigo-400 text-[11px] font-bold">{aspectRatio}</span>
              </label>
              <select
                value={aspectRatio}
                onChange={(e) => setAspectRatio(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs rounded-lg px-2.5 py-2 font-mono outline-none"
              >
                <option value="9:16">9:16 (Vertical / Mobile Shorts)</option>
                <option value="16:9">16:9 (Widescreen / Cinematic)</option>
                <option value="1:1">1:1 (Square)</option>
                <option value="4:3">4:3 (Classic Landscape)</option>
                <option value="3:4">3:4 (Portrait Standard)</option>
              </select>
            </div>

            {/* Resolution: Megapixels (Node 115 input 'megapixels') */}
            <div className="space-y-1.5">
              <label className="text-xs text-zinc-400 flex items-center justify-between">
                <span>Megapixels (Node 115)</span>
                <span className="font-mono text-indigo-400 text-[11px] font-bold">{megapixels} MP</span>
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {[0.5, 0.72, 1.0, 1.5].map((mp) => (
                  <button
                    key={mp}
                    type="button"
                    onClick={() => setMegapixels(mp)}
                    className={`py-1.5 text-xs font-mono rounded-lg border transition-all ${
                      megapixels === mp
                        ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 font-bold'
                        : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {mp}MP
                  </button>
                ))}
              </div>
            </div>

            {/* Frame Rate (Nodes 149 / 146) */}
            <div className="space-y-1.5">
              <label className="text-xs text-zinc-400 flex items-center justify-between">
                <span>FPS (Nodes 149/146)</span>
                <span className="font-mono text-zinc-300">{fps} FPS</span>
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {[24, 25, 30].map((rate) => (
                  <button
                    key={rate}
                    type="button"
                    onClick={() => setFps(rate)}
                    className={`py-1.5 text-xs font-mono rounded-lg border transition-all ${
                      fps === rate
                        ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 font-bold'
                        : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {rate} fps
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Seed Input (Node 142 input 'seed') + Randomize */}
          <div className="pt-2 border-t border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="space-y-1">
                <label className="text-[11px] text-zinc-400">Seed Value (Node 142 input 'seed')</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={seed}
                    disabled={randomizeSeed}
                    onChange={(e) => setSeed(Number(e.target.value))}
                    className="bg-zinc-800 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 font-mono w-36 disabled:opacity-50"
                  />
                  <button
                    type="button"
                    disabled={randomizeSeed}
                    onClick={() => setSeed(Math.floor(Math.random() * 1000000000))}
                    className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white disabled:opacity-40"
                    title="Generate new random seed"
                  >
                    <Shuffle className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer mt-4">
                <input
                  type="checkbox"
                  checked={randomizeSeed}
                  onChange={(e) => setRandomizeSeed(e.target.checked)}
                  className="rounded border-zinc-700 bg-zinc-800 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                <span>Randomize seed each video</span>
              </label>
            </div>

            <div className="text-right text-[11px] text-zinc-400 font-mono">
              Output: Node 145 (pingpong: preserved)
            </div>
          </div>
        </div>

        {/* Feedback Messages */}
        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2 whitespace-pre-line">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>{errorMsg}</div>
          </div>
        )}

        {successMsg && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Live Generation Progress Indicator */}
        {isGenerating && (
          <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/40 space-y-2">
            <div className="flex items-center justify-between text-xs text-indigo-300">
              <span className="font-semibold flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
                Executing ComfyUI Video Pipeline (Node #{executingNodeId || '...'})
              </span>
              {executionProgress && (
                <span className="font-mono font-bold">
                  {Math.round((executionProgress.value / executionProgress.max) * 100)}%
                </span>
              )}
            </div>

            <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-indigo-500 to-violet-500 h-full rounded-full transition-all duration-200"
                style={{
                  width: executionProgress
                    ? `${(executionProgress.value / executionProgress.max) * 100}%`
                    : '100%',
                }}
              />
            </div>
            <p className="text-[11px] text-zinc-400">
              Real-time progress monitored over WebSocket. Outputs will automatically update in your Gallery when finished.
            </p>
          </div>
        )}

        {/* Generate Button */}
        <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
          <button
            type="submit"
            disabled={isSubmitting || !isOnline || !isWorkflowReady}
            className={`w-full sm:w-auto flex-1 flex items-center justify-center gap-2.5 py-4 px-6 rounded-xl font-bold text-sm text-white transition-all shadow-xl ${
              !isOnline || !isWorkflowReady
                ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700/60'
                : isSubmitting
                ? 'bg-indigo-700 cursor-wait'
                : 'bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 hover:from-indigo-500 hover:to-violet-500 shadow-indigo-600/30'
            }`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Submitting MiniMax H3 Workflow...
              </>
            ) : isGenerating ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                Generating Video (Node #{executingNodeId || '...'})
              </>
            ) : !isWorkflowReady ? (
              <>
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                Import MiniMax H3 Workflow JSON to Generate
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Generate MiniMax H3 Video
              </>
            )}
          </button>

          {!isOnline ? (
            <p className="text-xs text-rose-400 sm:text-right">
              Local ComfyUI is offline. Connect in Settings to enable generation.
            </p>
          ) : !isWorkflowReady ? (
            <p className="text-xs text-amber-400 sm:text-right">
              API workflow JSON missing. Click 'Import Workflow' above.
            </p>
          ) : null}
        </div>
      </form>

      {/* IMPORT WORKFLOW MODAL */}
      {showImportModal && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowImportModal(false)}
        >
          <div
            className="bg-zinc-900 border border-zinc-700 rounded-2xl max-w-2xl w-full p-5 space-y-4 shadow-2xl max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <FileCode className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-white text-base">
                  Import MiniMax H3 API Workflow JSON
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="text-zinc-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <div className="text-xs text-zinc-300 space-y-2">
              <p>
                Import your real exported MiniMax H3 workflow JSON. The app will strictly use your real workflow and map inputs (138, 137, 142, 132, 115, 149/146, 145) without mutating the base graph.
              </p>
              <div className="p-2.5 rounded-lg bg-indigo-950/40 border border-indigo-500/30 text-indigo-300 text-[11px] space-y-1">
                <span className="font-semibold">How to export from ComfyUI:</span>
                <p>
                  1. In ComfyUI, click the gear icon (Settings) and turn on <code className="bg-black/40 px-1 py-0.5 rounded text-indigo-200">Enable Dev mode Options</code>.
                </p>
                <p>
                  2. Load your MiniMax H3 workflow and click <code className="bg-black/40 px-1 py-0.5 rounded text-indigo-200">Save (API Format)</code>.
                </p>
                <p>
                  3. Upload or paste that exported JSON below.
                </p>
              </div>
            </div>

            {/* File Upload Button */}
            <div className="flex items-center gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-zinc-700 transition-colors"
              >
                <Upload className="w-3.5 h-3.5 text-indigo-400" />
                Choose .json file from disk
              </button>
              <span className="text-xs text-zinc-500">or paste the JSON text directly below</span>
            </div>

            {/* Textarea for JSON */}
            <div className="flex-1 min-h-[160px] flex flex-col">
              <textarea
                value={importInputText}
                onChange={(e) => {
                  setImportInputText(e.target.value);
                  setImportFileError(null);
                }}
                placeholder="Paste ComfyUI API format workflow JSON here... e.g. { &quot;138&quot;: { &quot;class_type&quot;: ... } }"
                className="flex-1 w-full bg-black/70 border border-zinc-800 rounded-xl p-3 text-xs font-mono text-zinc-200 placeholder-zinc-600 focus:ring-2 focus:ring-indigo-500 outline-none leading-relaxed resize-y"
              />
            </div>

            {importFileError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs whitespace-pre-line max-h-32 overflow-y-auto">
                <div className="font-semibold mb-1">Validation Errors:</div>
                {importFileError}
              </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => {
                  setImportInputText('');
                  setImportFileError(null);
                }}
                className="text-xs text-zinc-400 hover:text-zinc-200"
              >
                Clear Input
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowImportModal(false)}
                  className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveImportedWorkflow}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition-all"
                >
                  Save & Validate Workflow
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* INSPECT WORKFLOW MODAL */}
      {showInspectModal && miniMaxWorkflow && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowInspectModal(false)}
        >
          <div
            className="bg-zinc-900 border border-zinc-700 rounded-2xl max-w-3xl w-full p-5 space-y-4 shadow-2xl max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-white text-base">
                  Imported MiniMax H3 Workflow Inspector
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowInspectModal(false)}
                className="text-zinc-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-zinc-400">
              Inspecting real nodes from your persisted ComfyUI API workflow graph ({Object.keys(miniMaxWorkflow).length} nodes total).
            </p>

            {/* Mapped Nodes Detailed List */}
            <div className="space-y-3 overflow-y-auto max-h-[55vh] pr-1">
              {[
                { id: '138', role: 'Prompt Node', targetKey: 'value' },
                { id: '137', role: 'Reference Image Node', targetKey: 'image' },
                { id: '142', role: 'Seed Node', targetKey: 'seed' },
                { id: '132', role: 'Duration Node', targetKey: 'value' },
                { id: '115', role: 'Resolution Node', targetKey: 'aspect_ratio, megapixels' },
                { id: '149', role: 'FPS Node (149)', targetKey: 'fps / value' },
                { id: '146', role: 'FPS Node (146)', targetKey: 'fps / value' },
                { id: '145', role: 'Video Output Node', targetKey: 'pingpong (preserved)' },
              ].map((mapItem) => {
                const node = miniMaxWorkflow[mapItem.id];
                return (
                  <div
                    key={mapItem.id}
                    className={`p-3 rounded-xl border text-xs font-mono space-y-1.5 ${
                      node
                        ? 'bg-zinc-950/80 border-zinc-800 text-zinc-300'
                        : 'bg-rose-950/30 border-rose-500/30 text-rose-400'
                    }`}
                  >
                    <div className="flex items-center justify-between font-sans">
                      <div className="flex items-center gap-2 font-bold">
                        <span className="text-indigo-400">Node #{mapItem.id}</span>
                        <span className="text-zinc-200">{mapItem.role}</span>
                      </div>
                      <span className="text-[11px] text-zinc-500">Target input: {mapItem.targetKey}</span>
                    </div>

                    {node ? (
                      <div>
                        <div className="text-zinc-400 text-[11px]">
                          Class: <span className="text-amber-300">{node.class_type}</span>
                          {node._meta?.title && <span className="text-zinc-500 ml-2">({node._meta.title})</span>}
                        </div>
                        <div className="bg-black/60 p-2 rounded-lg mt-1 text-[10px] text-zinc-300 overflow-x-auto">
                          {JSON.stringify(node.inputs, null, 2)}
                        </div>
                      </div>
                    ) : (
                      <div className="text-rose-400 text-[11px]">Node not found in current workflow!</div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => {
                  if (confirm('Clear the saved MiniMax H3 workflow?')) {
                    clearMiniMaxWorkflow();
                    setShowInspectModal(false);
                  }
                }}
                className="text-xs text-rose-400 hover:text-rose-300 font-medium"
              >
                Clear / Remove Workflow
              </button>
              <button
                type="button"
                onClick={() => setShowInspectModal(false)}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
