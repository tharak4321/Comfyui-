import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { useComfy } from '../../context/ComfyContext';
import { ImageUpload } from '../common/ImageUpload';
import { StatusBanner } from '../common/StatusBanner';
import {
  MiniMaxH3StructuredPrompt,
  TimedDialogueLine,
  VideoWorkflowParams,
  MiniMaxNodeMapping,
} from '../../types/comfy';
import {
  DEFAULT_MINIMAX_PROMPT,
  MINIMAX_TEMPLATES,
  formatMiniMaxPrompt,
  parseRawMiniMaxPrompt,
} from '../../utils/promptUtils';
import { DEFAULT_MINIMAX_NODE_MAPPING } from '../../utils/workflowTemplates';

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
    miniMaxMapping,
    updateMiniMaxMapping,
    galleryItems,
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

  // Reference image (Picture 1)
  const [referenceFile, setReferenceFile] = useState<File | null>(null);
  const [referenceBase64, setReferenceBase64] = useState<string | null>(null);

  // Video parameters
  const [durationSeconds, setDurationSeconds] = useState<number>(5);
  const [resolution, setResolution] = useState<string>('720x1280 (9:16 Vertical)');
  const [fps, setFps] = useState<number>(24);
  const [seed, setSeed] = useState<number>(4589210);
  const [randomizeSeed, setRandomizeSeed] = useState<boolean>(true);

  // Custom workflow JSON
  const [customWorkflowJson, setCustomWorkflowJson] = useState<string>('');
  const [showNodeMappingModal, setShowNodeMappingModal] = useState<boolean>(false);
  const [nodeMapping, setNodeMapping] = useState<MiniMaxNodeMapping>(miniMaxMapping);

  // UI state
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showPromptPreview, setShowPromptPreview] = useState<boolean>(false);

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
    const nextStart = structuredPrompt.dialogueLines.length > 0
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

  // Generate Video
  const handleGenerateVideo = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isOnline) {
      setErrorMsg('Cannot generate: ComfyUI is offline. Please connect your local instance in Settings.');
      return;
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
        resolution,
        fps,
        customWorkflowJson: workflowType === 'custom-video' ? customWorkflowJson : undefined,
        nodeMapping,
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

  // Filter recent videos in gallery to show outputs
  const recentVideoOutputs = galleryItems.filter((i) => i.type === 'video').slice(0, 2);

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
              High-fidelity multimodal video generation with Picture 1 reference, dialogue lip-sync, and node mapping.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={workflowType}
              onChange={(e) => setWorkflowType(e.target.value as any)}
              className="bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs sm:text-sm rounded-xl px-3 py-2 font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="minimax-h3">MiniMax H3 (Native Workflow)</option>
              <option value="custom-video">Custom Video Workflow JSON</option>
            </select>

            <button
              type="button"
              onClick={() => setShowNodeMappingModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 text-xs font-medium transition-colors"
              title="Configure Node Mapping for ComfyUI"
            >
              <Settings2 className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">Node Map</span>
            </button>
          </div>
        </div>

        {/* Custom Workflow JSON Editor (if custom selected) */}
        {workflowType === 'custom-video' && (
          <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <FileCode className="w-3.5 h-3.5 text-indigo-400" />
                Custom Video Workflow JSON
              </label>
              <button
                type="button"
                onClick={() => setShowNodeMappingModal(true)}
                className="text-xs text-indigo-400 hover:underline"
              >
                Configure Node IDs →
              </button>
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

        {/* Reference Image (Picture 1 Context) */}
        <div className="bg-zinc-900/60 p-4 rounded-2xl border border-zinc-800">
          <ImageUpload
            label="Picture 1: Reference Image Input"
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
                Multimodal Prompt Editor
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
                  {structuredPrompt.dialogueLines.map((line, index) => (
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

        {/* Video Output Controls: Duration, Resolution, FPS, Seed */}
        <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-4">
          <div className="flex items-center gap-2 border-b border-zinc-800/80 pb-2">
            <Film className="w-4 h-4 text-indigo-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
              Video Execution Settings
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Target Duration */}
            <div className="space-y-1.5">
              <label className="text-xs text-zinc-400 flex items-center justify-between">
                <span>Target Duration</span>
                <span className="font-mono text-indigo-400 font-bold">
                  {durationSeconds}s (~{durationSeconds * fps} frames)
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

            {/* Resolution */}
            <div className="space-y-1.5">
              <label className="text-xs text-zinc-400">Resolution & Aspect</label>
              <select
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs rounded-lg px-2.5 py-2 font-mono outline-none"
              >
                <option value="720x1280 (9:16 Vertical)">720x1280 (9:16 TikTok/Shorts)</option>
                <option value="1280x720 (16:9 Widescreen)">1280x720 (16:9 Cinematic)</option>
                <option value="1024x1024 (1:1 Square)">1024x1024 (1:1 Square)</option>
                <option value="1080x1920 (9:16 Full HD)">1080x1920 (9:16 FHD)</option>
              </select>
            </div>

            {/* Frame Rate */}
            <div className="space-y-1.5">
              <label className="text-xs text-zinc-400 flex items-center justify-between">
                <span>Frame Rate</span>
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

          {/* Seed Input + Randomize */}
          <div className="pt-2 border-t border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="space-y-1">
                <label className="text-[11px] text-zinc-400">Seed Value</label>
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

            <div className="text-right text-[11px] text-zinc-400">
              Target Nodes: Prompt #{nodeMapping.promptNodeId}, Image #{nodeMapping.imageNodeId}
            </div>
          </div>
        </div>

        {/* Feedback Messages */}
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
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
            disabled={isSubmitting || !isOnline}
            className={`w-full sm:w-auto flex-1 flex items-center justify-center gap-2.5 py-4 px-6 rounded-xl font-bold text-sm text-white transition-all shadow-xl ${
              !isOnline
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
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Generate MiniMax H3 Video
              </>
            )}
          </button>

          {!isOnline && (
            <p className="text-xs text-rose-400 sm:text-right">
              Local ComfyUI is offline. Connect in Settings to enable generation.
            </p>
          )}
        </div>
      </form>

      {/* MiniMax Node Mapping Modal */}
      {showNodeMappingModal && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowNodeMappingModal(false)}
        >
          <div
            className="bg-zinc-900 border border-zinc-700 rounded-2xl max-w-lg w-full p-5 space-y-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Settings2 className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-white text-base">
                  MiniMax H3 Node Mapping
                </h3>
              </div>
              <button
                onClick={() => setShowNodeMappingModal(false)}
                className="text-zinc-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-zinc-400">
              Map which nodes in your ComfyUI workflow graph receive the prompt text, reference image, seed, and output stream:
            </p>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-zinc-300 font-medium">Prompt Node ID</label>
                  <input
                    type="text"
                    value={nodeMapping.promptNodeId}
                    onChange={(e) =>
                      setNodeMapping({ ...nodeMapping, promptNodeId: e.target.value })
                    }
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2 font-mono text-zinc-200"
                    placeholder="2"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-zinc-300 font-medium">Prompt Input Key</label>
                  <input
                    type="text"
                    value={nodeMapping.promptInputKey}
                    onChange={(e) =>
                      setNodeMapping({ ...nodeMapping, promptInputKey: e.target.value })
                    }
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2 font-mono text-zinc-200"
                    placeholder="text"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-zinc-300 font-medium">Image Input Node ID</label>
                  <input
                    type="text"
                    value={nodeMapping.imageNodeId}
                    onChange={(e) =>
                      setNodeMapping({ ...nodeMapping, imageNodeId: e.target.value })
                    }
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2 font-mono text-zinc-200"
                    placeholder="1"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-zinc-300 font-medium">Image Input Key</label>
                  <input
                    type="text"
                    value={nodeMapping.imageInputKey}
                    onChange={(e) =>
                      setNodeMapping({ ...nodeMapping, imageInputKey: e.target.value })
                    }
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2 font-mono text-zinc-200"
                    placeholder="image"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-zinc-300 font-medium">Seed Node ID</label>
                  <input
                    type="text"
                    value={nodeMapping.seedNodeId || ''}
                    onChange={(e) =>
                      setNodeMapping({ ...nodeMapping, seedNodeId: e.target.value })
                    }
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2 font-mono text-zinc-200"
                    placeholder="3"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-zinc-300 font-medium">Resolution / Latent Node</label>
                  <input
                    type="text"
                    value={nodeMapping.durationNodeId || ''}
                    onChange={(e) =>
                      setNodeMapping({ ...nodeMapping, durationNodeId: e.target.value })
                    }
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2 font-mono text-zinc-200"
                    placeholder="6"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setNodeMapping(DEFAULT_MINIMAX_NODE_MAPPING)}
                className="text-xs text-zinc-400 hover:text-zinc-200"
              >
                Reset to Default
              </button>
              <button
                type="button"
                onClick={() => {
                  updateMiniMaxMapping(nodeMapping);
                  setShowNodeMappingModal(false);
                }}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition-colors"
              >
                Save Mapping
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
