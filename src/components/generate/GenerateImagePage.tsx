import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Shuffle,
  Sliders,
  Settings2,
  FileCode,
  Image as ImageIcon,
  AlertCircle,
  CheckCircle2,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { useComfy } from '../../context/ComfyContext';
import { ImageUpload } from '../common/ImageUpload';
import { StatusBanner } from '../common/StatusBanner';
import { ImageWorkflowParams } from '../../types/comfy';

interface GenerateImagePageProps {
  setActiveTab: (tab: string) => void;
}

export const GenerateImagePage: React.FC<GenerateImagePageProps> = ({ setActiveTab }) => {
  const {
    isOnline,
    isGenerating,
    executionProgress,
    executingNodeId,
    submitImageGeneration,
  } = useComfy();

  // Harmless UI preferences in localStorage
  const [workflow, setWorkflow] = useState<'qwen' | 'krea2' | 'custom'>(() => {
    return (localStorage.getItem('comfy_img_workflow') as any) || 'qwen';
  });

  const [positivePrompt, setPositivePrompt] = useState<string>(() => {
    return (
      localStorage.getItem('comfy_img_prompt') ||
      'A masterpiece portrait of a cyberpunk hacker in illuminated rain, neon backlight, 8k resolution, cinematic atmosphere'
    );
  });

  const [negativePrompt, setNegativePrompt] = useState<string>(() => {
    return (
      localStorage.getItem('comfy_img_neg_prompt') ||
      'blurry, distorted, low quality, bad anatomy, deformed hands, extra fingers'
    );
  });

  const [referenceFile, setReferenceFile] = useState<File | null>(null);
  const [referenceBase64, setReferenceBase64] = useState<string | null>(null);

  const [seed, setSeed] = useState<number>(() => {
    const saved = localStorage.getItem('comfy_img_seed');
    return saved ? Number(saved) : 428912;
  });

  const [randomizeSeed, setRandomizeSeed] = useState<boolean>(true);
  const [width, setWidth] = useState<number>(1024);
  const [height, setHeight] = useState<number>(1024);
  const [batchSize, setBatchSize] = useState<number>(1);
  const [steps, setSteps] = useState<number>(28);
  const [cfg, setCfg] = useState<number>(7.0);

  const [customJson, setCustomJson] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Persist harmless preferences
  useEffect(() => {
    localStorage.setItem('comfy_img_workflow', workflow);
  }, [workflow]);

  useEffect(() => {
    localStorage.setItem('comfy_img_prompt', positivePrompt);
  }, [positivePrompt]);

  useEffect(() => {
    localStorage.setItem('comfy_img_neg_prompt', negativePrompt);
  }, [negativePrompt]);

  const handleRandomizeSeed = () => {
    setSeed(Math.floor(Math.random() * 1000000000));
  };

  const handleSetAspect = (w: number, h: number) => {
    setWidth(w);
    setHeight(h);
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOnline) {
      setErrorMsg('Cannot generate: ComfyUI is offline. Please connect your local instance in Settings.');
      return;
    }

    if (!positivePrompt.trim()) {
      setErrorMsg('Please enter a positive prompt.');
      return;
    }

    setErrorMsg(null);
    setSuccessMsg(null);
    setIsSubmitting(true);

    try {
      const params: ImageWorkflowParams = {
        workflow,
        positivePrompt,
        negativePrompt,
        referenceImageFile: referenceFile,
        referenceImageBase64: referenceBase64,
        seed: randomizeSeed ? Math.floor(Math.random() * 1000000000) : seed,
        randomizeSeed,
        width,
        height,
        batchSize,
        steps,
        cfg,
        customWorkflowJson: customJson,
      };

      const promptId = await submitImageGeneration(params);
      if (promptId) {
        setSuccessMsg(`Queued to ComfyUI (Prompt #${promptId.substring(0, 8)}...)`);
        setTimeout(() => setSuccessMsg(null), 6000);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Generation failed to queue');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      <StatusBanner onOpenSettings={() => setActiveTab('settings')} />

      <form onSubmit={handleGenerate} className="space-y-6">
        {/* Header with Workflow Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-900/70 p-4 rounded-2xl border border-zinc-800">
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-indigo-400" />
              Generate Image
            </h1>
            <p className="text-xs text-zinc-400 mt-0.5">
              Targeted workflows for Qwen Image Edit, Krea 2, and custom graphs
            </p>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider shrink-0">
              Workflow:
            </label>
            <select
              value={workflow}
              onChange={(e) => setWorkflow(e.target.value as any)}
              className="bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs sm:text-sm rounded-xl px-3 py-2 font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="qwen">Qwen Image Edit (Image-to-Image / Instruction)</option>
              <option value="krea2">Krea 2 (Photorealistic Latent Generation)</option>
              <option value="custom">Custom ComfyUI Workflow JSON</option>
            </select>
          </div>
        </div>

        {/* Workflow Info Banner */}
        <div className="p-3.5 rounded-xl bg-zinc-900/40 border border-zinc-800/80 text-xs text-zinc-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-400" />
            <span>
              {workflow === 'qwen'
                ? 'Qwen Image Edit: Condition generation on your reference picture with direct text instruction.'
                : workflow === 'krea2'
                ? 'Krea 2: Generates high aesthetic photographic images from scratch.'
                : 'Custom Workflow: Paste your raw ComfyUI prompt JSON graph below.'}
            </span>
          </div>
          <span className="text-[11px] font-mono text-zinc-400 hidden sm:inline">
            Local Backend
          </span>
        </div>

        {/* Custom Workflow JSON Editor (if custom selected) */}
        {workflow === 'custom' && (
          <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <FileCode className="w-3.5 h-3.5 text-indigo-400" />
                Custom Workflow JSON (ComfyUI API Format)
              </label>
            </div>
            <textarea
              rows={8}
              value={customJson}
              onChange={(e) => setCustomJson(e.target.value)}
              placeholder='Paste workflow JSON exported from ComfyUI (Save (API Format))...'
              className="w-full bg-black/60 border border-zinc-800 rounded-xl p-3 text-xs font-mono text-zinc-300 focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
        )}

        {/* Reference Image (Crucial for Qwen Image Edit) */}
        <div className="bg-zinc-900/60 p-4 rounded-2xl border border-zinc-800 space-y-3">
          <ImageUpload
            label={workflow === 'qwen' ? 'Required Reference Image (Source to Edit)' : 'Reference Image (Optional)'}
            description="Upload source photo for Qwen image editing or conditioning"
            imageFile={referenceFile}
            imageBase64={referenceBase64}
            onImageChange={(file, base64) => {
              setReferenceFile(file);
              setReferenceBase64(base64);
            }}
          />
        </div>

        {/* Prompts Section */}
        <div className="grid grid-cols-1 gap-4">
          {/* Positive Prompt */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Positive Prompt / Edit Instruction
            </label>
            <textarea
              rows={3}
              value={positivePrompt}
              onChange={(e) => setPositivePrompt(e.target.value)}
              placeholder="Describe what to generate or modify..."
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-sm text-zinc-200 placeholder-zinc-500 focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-y"
            />
          </div>

          {/* Negative Prompt */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Negative Prompt
            </label>
            <textarea
              rows={2}
              value={negativePrompt}
              onChange={(e) => setNegativePrompt(e.target.value)}
              placeholder="Elements to avoid (e.g. blurry, deformed, lowres)..."
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-sm text-zinc-300 placeholder-zinc-500 focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-y"
            />
          </div>
        </div>

        {/* Parameters Section */}
        <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-4">
          <div className="flex items-center gap-2 border-b border-zinc-800/80 pb-2">
            <Sliders className="w-4 h-4 text-indigo-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
              Generation Parameters
            </h3>
          </div>

          {/* Aspect Ratio Presets */}
          <div className="space-y-1.5">
            <span className="text-xs text-zinc-400">Resolution Presets:</span>
            <div className="flex flex-wrap gap-2">
              {[
                { label: 'Square 1024x1024 (1:1)', w: 1024, h: 1024 },
                { label: 'Portrait 896x1152 (3:4)', w: 896, h: 1152 },
                { label: 'Landscape 1152x896 (4:3)', w: 1152, h: 896 },
                { label: 'Mobile 720x1280 (9:16)', w: 720, h: 1280 },
                { label: 'HD 1280x720 (16:9)', w: 1280, h: 720 },
              ].map((res) => (
                <button
                  key={res.label}
                  type="button"
                  onClick={() => handleSetAspect(res.w, res.h)}
                  className={`text-xs px-2.5 py-1.5 rounded-lg border transition-all ${
                    width === res.w && height === res.h
                      ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-300 font-medium'
                      : 'bg-zinc-800 border-zinc-700/60 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {res.label}
                </button>
              ))}
            </div>
          </div>

          {/* Sliders and Inputs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            {/* Width */}
            <div className="space-y-1">
              <label className="text-[11px] text-zinc-400">Width (px)</label>
              <input
                type="number"
                step="64"
                min="256"
                max="2048"
                value={width}
                onChange={(e) => setWidth(Number(e.target.value))}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 font-mono"
              />
            </div>

            {/* Height */}
            <div className="space-y-1">
              <label className="text-[11px] text-zinc-400">Height (px)</label>
              <input
                type="number"
                step="64"
                min="256"
                max="2048"
                value={height}
                onChange={(e) => setHeight(Number(e.target.value))}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 font-mono"
              />
            </div>

            {/* Steps */}
            <div className="space-y-1">
              <label className="text-[11px] text-zinc-400">Steps ({steps})</label>
              <input
                type="number"
                min="10"
                max="100"
                value={steps}
                onChange={(e) => setSteps(Number(e.target.value))}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 font-mono"
              />
            </div>

            {/* CFG */}
            <div className="space-y-1">
              <label className="text-[11px] text-zinc-400">CFG Scale ({cfg})</label>
              <input
                type="number"
                step="0.5"
                min="1"
                max="20"
                value={cfg}
                onChange={(e) => setCfg(Number(e.target.value))}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 font-mono"
              />
            </div>
          </div>

          {/* Seed Input + Randomize Toggle */}
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
                    onClick={handleRandomizeSeed}
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
                <span>Randomize each run</span>
              </label>
            </div>

            {/* Batch Size */}
            <div className="space-y-1">
              <label className="text-[11px] text-zinc-400">Batch Size</label>
              <div className="flex items-center gap-1">
                {[1, 2, 4].map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setBatchSize(b)}
                    className={`px-3 py-1 text-xs rounded-lg border font-mono ${
                      batchSize === b
                        ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 font-bold'
                        : 'bg-zinc-800 border-zinc-700 text-zinc-400'
                    }`}
                  >
                    {b}
                  </button>
                ))}
              </div>
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

        {/* Generate Button */}
        <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
          <button
            type="submit"
            disabled={isSubmitting || !isOnline}
            className={`w-full sm:w-auto flex-1 flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-xl font-bold text-sm text-white transition-all shadow-lg ${
              !isOnline
                ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700/60'
                : isSubmitting
                ? 'bg-indigo-700 cursor-wait'
                : 'bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-indigo-600/30'
            }`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Queueing Prompt...
              </>
            ) : isGenerating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Generating (Node #{executingNodeId || '...'})
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Queue Generation
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
    </div>
  );
};
