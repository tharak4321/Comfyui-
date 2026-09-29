export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface GpuDeviceStats {
  name: string;
  type: string;
  vram_total: number; // in bytes or MB
  vram_free: number;
  torch_vram_total?: number;
  torch_vram_free?: number;
}

export interface ComfySystemStats {
  system: {
    os: string;
    python_version: string;
    embedded_python?: boolean;
    comfyui_version?: string;
  };
  devices: GpuDeviceStats[];
}

export interface QueueJob {
  promptId: string;
  number: number;
  prompt: Record<string, any>;
  extraData?: {
    extra_pnginfo?: Record<string, any>;
    client_id?: string;
  };
  outputs?: Record<string, any>;
}

export interface QueueStatusResponse {
  queue_running: any[];
  queue_pending: any[];
}

export interface HistoryItem {
  promptId: string;
  timestamp?: number;
  status?: {
    status_str: string;
    completed: boolean;
    messages?: any[];
  };
  outputs: Record<string, {
    images?: Array<{ filename: string; subfolder: string; type: string }>;
    videos?: Array<{ filename: string; subfolder: string; type: string }>;
    gifs?: Array<{ filename: string; subfolder: string; type: string }>;
  }>;
  prompt?: any[];
}

export interface OutputMedia {
  id: string;
  promptId: string;
  filename: string;
  subfolder: string;
  type: 'image' | 'video';
  url: string;
  timestamp: number;
  workflowName: string;
  positivePrompt?: string;
  negativePrompt?: string;
  seed?: number | string;
  steps?: number;
  cfg?: number;
  samplerName?: string;
  scheduler?: string;
  dimensions?: { width: number; height: number };
  duration?: number;
  fps?: number;
  nodeId?: string;
}

export interface TimedDialogueLine {
  id: string;
  startTime: string; // e.g. "00:00"
  endTime: string;   // e.g. "00:03"
  speaker: string;   // e.g. "Detective"
  text: string;      // e.g. "The signal isn't coming from outside the city."
}

export interface MiniMaxH3StructuredPrompt {
  picture1Context: string;
  multimodalDescription: string;
  whoSpeaks: string;
  actions: string;
  strictLipRule: string;
  dialogueLines: TimedDialogueLine[];
}

export interface MiniMaxNodeMapping {
  promptNodeId: string;
  promptInputKey: string;
  imageNodeId: string;
  imageInputKey: string;
  seedNodeId?: string;
  seedInputKey?: string;
  durationNodeId?: string;
  fpsNodeId?: string;
  outputNodeId?: string;
}

export interface ImageWorkflowParams {
  workflow: 'qwen' | 'krea2' | 'custom';
  positivePrompt: string;
  negativePrompt: string;
  referenceImageFile: File | null;
  referenceImageBase64: string | null;
  seed: number;
  randomizeSeed: boolean;
  width: number;
  height: number;
  batchSize: number;
  steps: number;
  cfg: number;
  customWorkflowJson?: string;
}

export interface VideoWorkflowParams {
  workflow: 'minimax-h3' | 'custom-video';
  mode: 'structured' | 'raw';
  structuredPrompt: MiniMaxH3StructuredPrompt;
  rawPrompt: string;
  referenceImageFile: File | null;
  referenceImageBase64: string | null;
  referenceVideoFile?: File | null;
  seed: number;
  randomizeSeed: boolean;
  durationSeconds: number;
  resolution: string; // e.g. "9:16", "16:9", "1:1", or "720x1280 (9:16)"
  megapixels?: number | string;
  fps: number;
  customWorkflowJson?: string;
  nodeMapping?: MiniMaxNodeMapping;
}

export interface AppSettings {
  backendUrl: string;
  authToken: string;
  clientId: string;
  autoConnect: boolean;
  customWorkflows: Array<{ id: string; name: string; type: 'image' | 'video'; json: string }>;
  miniMaxNodeMapping: MiniMaxNodeMapping;
}
