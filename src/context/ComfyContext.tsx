import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import {
  ConnectionStatus,
  ComfySystemStats,
  QueueStatusResponse,
  OutputMedia,
  ImageWorkflowParams,
  VideoWorkflowParams,
  AppSettings,
  MiniMaxNodeMapping,
} from '../types/comfy';
import { ComfyApiService, ConnectionTestResult } from '../services/api';
import { BUILTIN_WORKFLOWS, DEFAULT_MINIMAX_NODE_MAPPING } from '../utils/workflowTemplates';
import { formatMiniMaxPrompt } from '../utils/promptUtils';

interface ComfyContextType {
  // Connection state
  connectionStatus: ConnectionStatus;
  isOnline: boolean;
  backendUrl: string;
  authToken: string;
  clientId: string;
  lastError: string | null;
  systemStats: ComfySystemStats | null;
  latencyMs: number | null;

  // Real-time Queue & Execution
  queue: QueueStatusResponse;
  activePromptId: string | null;
  executingNodeId: string | null;
  executionProgress: { value: number; max: number } | null;
  isGenerating: boolean;

  // Outputs / Gallery
  galleryItems: OutputMedia[];
  isLoadingGallery: boolean;

  // Settings & Actions
  setBackendUrl: (url: string) => void;
  setAuthToken: (token: string) => void;
  updateMiniMaxMapping: (mapping: Partial<MiniMaxNodeMapping>) => void;
  miniMaxMapping: MiniMaxNodeMapping;
  checkConnection: () => Promise<ConnectionTestResult>;
  refreshQueue: () => Promise<void>;
  refreshHistory: () => Promise<void>;
  interruptExecution: () => Promise<boolean>;
  cancelQueueJob: (promptId: string) => Promise<boolean>;
  clearAllPending: () => Promise<boolean>;

  // Generation submission
  submitImageGeneration: (params: ImageWorkflowParams) => Promise<string | null>;
  submitVideoGeneration: (params: VideoWorkflowParams) => Promise<string | null>;
}

const ComfyContext = createContext<ComfyContextType | null>(null);

const STORAGE_KEY_BACKEND = 'comfy_remote_backend_url';
const STORAGE_KEY_AUTH = 'comfy_remote_auth_token';
const STORAGE_KEY_CLIENT_ID = 'comfy_remote_client_id';
const STORAGE_KEY_MINIMAX_MAP = 'comfy_remote_minimax_mapping';

function generateClientId(): string {
  return 'comfy_remote_' + Math.random().toString(36).substring(2, 10);
}

export const ComfyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [backendUrl, setBackendUrlState] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEY_BACKEND) || 'http://127.0.0.1:8188';
  });

  const [authToken, setAuthTokenState] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEY_AUTH) || '';
  });

  const [clientId] = useState<string>(() => {
    let saved = localStorage.getItem(STORAGE_KEY_CLIENT_ID);
    if (!saved) {
      saved = generateClientId();
      localStorage.setItem(STORAGE_KEY_CLIENT_ID, saved);
    }
    return saved;
  });

  const [miniMaxMapping, setMiniMaxMapping] = useState<MiniMaxNodeMapping>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_MINIMAX_MAP);
      return saved ? JSON.parse(saved) : DEFAULT_MINIMAX_NODE_MAPPING;
    } catch {
      return DEFAULT_MINIMAX_NODE_MAPPING;
    }
  });

  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [lastError, setLastError] = useState<string | null>(null);
  const [systemStats, setSystemStats] = useState<ComfySystemStats | null>(null);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);

  const [queue, setQueue] = useState<QueueStatusResponse>({
    queue_running: [],
    queue_pending: [],
  });

  const [activePromptId, setActivePromptId] = useState<string | null>(null);
  const [executingNodeId, setExecutingNodeId] = useState<string | null>(null);
  const [executionProgress, setExecutionProgress] = useState<{ value: number; max: number } | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  const [galleryItems, setGalleryItems] = useState<OutputMedia[]>([]);
  const [isLoadingGallery, setIsLoadingGallery] = useState<boolean>(false);

  const wsRef = useRef<WebSocket | null>(null);
  const wsReconnectTimeoutRef = useRef<any>(null);

  const setBackendUrl = (url: string) => {
    setBackendUrlState(url);
    localStorage.setItem(STORAGE_KEY_BACKEND, url);
  };

  const setAuthToken = (token: string) => {
    setAuthTokenState(token);
    localStorage.setItem(STORAGE_KEY_AUTH, token);
  };

  const updateMiniMaxMapping = (mapping: Partial<MiniMaxNodeMapping>) => {
    setMiniMaxMapping((prev) => {
      const updated = { ...prev, ...mapping };
      localStorage.setItem(STORAGE_KEY_MINIMAX_MAP, JSON.stringify(updated));
      return updated;
    });
  };

  // Test connection function
  const checkConnection = useCallback(async (): Promise<ConnectionTestResult> => {
    setConnectionStatus('connecting');
    setLastError(null);

    const result = await ComfyApiService.testConnection(backendUrl, authToken);
    setLatencyMs(result.latencyMs ?? null);

    if (result.ok) {
      setConnectionStatus('connected');
      setLastError(null);
      if (result.stats) {
        setSystemStats(result.stats);
      } else {
        // Fetch detailed stats
        const fullStats = await ComfyApiService.getSystemStats(backendUrl, authToken);
        if (fullStats) setSystemStats(fullStats);
      }
    } else {
      setConnectionStatus('disconnected');
      setLastError(result.message);
      setSystemStats(null); // Clear stats when disconnected - never fake
    }

    return result;
  }, [backendUrl, authToken]);

  // Refresh queue
  const refreshQueue = useCallback(async () => {
    if (connectionStatus !== 'connected') return;
    const res = await ComfyApiService.getQueue(backendUrl, authToken);
    if (res) {
      setQueue(res);
      if (res.queue_running.length === 0 && !executingNodeId) {
        setIsGenerating(false);
      }
    }
  }, [backendUrl, authToken, connectionStatus, executingNodeId]);

  // Refresh output history and populate gallery
  const refreshHistory = useCallback(async () => {
    if (connectionStatus !== 'connected') {
      setIsLoadingGallery(false);
      return;
    }

    setIsLoadingGallery(true);
    try {
      const historyData = await ComfyApiService.getHistory(backendUrl, authToken, 40);
      if (!historyData) {
        setIsLoadingGallery(false);
        return;
      }

      const mediaList: OutputMedia[] = [];

      // Sort prompt IDs descending or parse
      const entries = Object.entries(historyData);
      for (const [pId, hist] of entries) {
        const outputs = hist.outputs || {};
        for (const [nodeId, nodeOut] of Object.entries(outputs)) {
          // Check for images
          if (Array.isArray(nodeOut.images)) {
            for (const img of nodeOut.images) {
              const url = ComfyApiService.getMediaUrl(backendUrl, img.filename, img.subfolder, img.type);
              mediaList.push({
                id: `${pId}_${nodeId}_${img.filename}`,
                promptId: pId,
                filename: img.filename,
                subfolder: img.subfolder,
                type: 'image',
                url,
                timestamp: hist.timestamp ? hist.timestamp * 1000 : Date.now(),
                workflowName: 'ComfyUI Output',
                nodeId,
              });
            }
          }

          // Check for videos or gifs
          const vids = nodeOut.videos || nodeOut.gifs;
          if (Array.isArray(vids)) {
            for (const vid of vids) {
              const isVideo = vid.filename.endsWith('.mp4') || vid.filename.endsWith('.webm');
              const url = ComfyApiService.getMediaUrl(backendUrl, vid.filename, vid.subfolder, vid.type);
              mediaList.push({
                id: `${pId}_${nodeId}_${vid.filename}`,
                promptId: pId,
                filename: vid.filename,
                subfolder: vid.subfolder,
                type: isVideo ? 'video' : 'image',
                url,
                timestamp: hist.timestamp ? hist.timestamp * 1000 : Date.now(),
                workflowName: isVideo ? 'MiniMax H3 / Video' : 'Animated Output',
                nodeId,
              });
            }
          }
        }
      }

      // Reverse so newest are first
      mediaList.sort((a, b) => b.timestamp - a.timestamp);
      setGalleryItems(mediaList);
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setIsLoadingGallery(false);
    }
  }, [backendUrl, authToken, connectionStatus]);

  // Connect ComfyUI WebSocket for live real-time status and progress
  useEffect(() => {
    if (connectionStatus !== 'connected') {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      return;
    }

    const wsUrl = ComfyApiService.getWebSocketUrl(backendUrl, clientId);
    let isSubscribed = true;

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!isSubscribed) return;
        refreshQueue();
        refreshHistory();
      };

      ws.onmessage = (event) => {
        if (!isSubscribed) return;
        try {
          if (typeof event.data !== 'string') return;
          const msg = JSON.parse(event.data);

          switch (msg.type) {
            case 'status':
              if (msg.data?.status?.exec_info) {
                const remaining = msg.data.status.exec_info.queue_remaining;
                if (remaining === 0 && !executingNodeId) {
                  setIsGenerating(false);
                }
              }
              refreshQueue();
              break;

            case 'execution_start':
              if (msg.data?.prompt_id) {
                setActivePromptId(msg.data.prompt_id);
                setIsGenerating(true);
              }
              break;

            case 'executing':
              // Node execution step: msg.data.node is node ID, or null when workflow completed!
              if (msg.data?.node === null) {
                setExecutingNodeId(null);
                setExecutionProgress(null);
                setIsGenerating(false);
                refreshQueue();
                refreshHistory();
              } else {
                setExecutingNodeId(String(msg.data.node));
                setIsGenerating(true);
              }
              break;

            case 'progress':
              if (msg.data?.value !== undefined && msg.data?.max !== undefined) {
                setExecutionProgress({
                  value: msg.data.value,
                  max: msg.data.max,
                });
              }
              break;

            case 'executed':
              // Node produced outputs
              refreshHistory();
              break;

            case 'execution_error':
              console.error('ComfyUI Execution Error:', msg.data);
              setIsGenerating(false);
              setExecutingNodeId(null);
              setExecutionProgress(null);
              setLastError(`Execution error in node ${msg.data?.node_id}: ${msg.data?.exception_message}`);
              refreshQueue();
              break;
          }
        } catch (e) {
          // Non-JSON or binary preview frame
        }
      };

      ws.onerror = () => {
        // WebSocket error
      };

      ws.onclose = () => {
        if (!isSubscribed) return;
        // Schedule reconnect if still connected
        wsReconnectTimeoutRef.current = setTimeout(() => {
          if (connectionStatus === 'connected') {
            // trigger re-eval
          }
        }, 4000);
      };
    } catch (e) {
      console.error('WebSocket connection error:', e);
    }

    return () => {
      isSubscribed = false;
      if (wsReconnectTimeoutRef.current) {
        clearTimeout(wsReconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [backendUrl, clientId, connectionStatus, refreshQueue, refreshHistory]);

  // Initial connection check on mount or backendUrl change
  useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  // Periodic queue poll when connected
  useEffect(() => {
    if (connectionStatus !== 'connected') return;

    const interval = setInterval(() => {
      refreshQueue();
    }, 4000);

    return () => clearInterval(interval);
  }, [connectionStatus, refreshQueue]);

  // Interrupt currently running prompt
  const interruptExecution = async (): Promise<boolean> => {
    const success = await ComfyApiService.interrupt(backendUrl, authToken);
    if (success) {
      setIsGenerating(false);
      setExecutingNodeId(null);
      setExecutionProgress(null);
      await refreshQueue();
    }
    return success;
  };

  // Cancel specific pending job
  const cancelQueueJob = async (promptId: string): Promise<boolean> => {
    const success = await ComfyApiService.deleteQueueItem(backendUrl, promptId, authToken);
    if (success) {
      await refreshQueue();
    }
    return success;
  };

  // Clear all pending queue
  const clearAllPending = async (): Promise<boolean> => {
    const success = await ComfyApiService.clearQueue(backendUrl, authToken);
    if (success) {
      await refreshQueue();
    }
    return success;
  };

  // Image generation submission
  const submitImageGeneration = async (params: ImageWorkflowParams): Promise<string | null> => {
    if (connectionStatus !== 'connected') {
      throw new Error('ComfyUI is disconnected. Please connect in Settings first.');
    }

    setIsGenerating(true);
    let uploadedImageName: string | null = null;

    // 1. Upload reference image if supplied
    if (params.referenceImageFile) {
      const uploadRes = await ComfyApiService.uploadImage(
        backendUrl,
        params.referenceImageFile,
        `ref_${Date.now()}_${params.referenceImageFile.name}`,
        authToken
      );
      if (uploadRes) {
        uploadedImageName = uploadRes.name;
      }
    }

    // 2. Prepare workflow payload
    let workflowJson: Record<string, any>;

    if (params.workflow === 'custom' && params.customWorkflowJson) {
      try {
        workflowJson = JSON.parse(params.customWorkflowJson);
      } catch (err: any) {
        setIsGenerating(false);
        throw new Error(`Invalid custom workflow JSON: ${err.message}`);
      }
    } else if (params.workflow === 'qwen') {
      workflowJson = JSON.parse(JSON.stringify(BUILTIN_WORKFLOWS.qwenImageEdit.json));
      // Map prompt & inputs
      if (workflowJson['2']?.inputs) workflowJson['2'].inputs.text = params.positivePrompt;
      if (workflowJson['3']?.inputs) workflowJson['3'].inputs.text = params.negativePrompt;
      if (workflowJson['6']?.inputs) {
        workflowJson['6'].inputs.seed = params.randomizeSeed ? Math.floor(Math.random() * 100000000) : params.seed;
        workflowJson['6'].inputs.steps = params.steps;
        workflowJson['6'].inputs.cfg = params.cfg;
      }
      if (uploadedImageName && workflowJson['1']?.inputs) {
        workflowJson['1'].inputs.image = uploadedImageName;
      }
    } else {
      // Krea 2
      workflowJson = JSON.parse(JSON.stringify(BUILTIN_WORKFLOWS.krea2.json));
      if (workflowJson['1']?.inputs) workflowJson['1'].inputs.text = params.positivePrompt;
      if (workflowJson['2']?.inputs) workflowJson['2'].inputs.text = params.negativePrompt;
      if (workflowJson['4']?.inputs) {
        workflowJson['4'].inputs.width = params.width;
        workflowJson['4'].inputs.height = params.height;
        workflowJson['4'].inputs.batch_size = params.batchSize;
      }
      if (workflowJson['5']?.inputs) {
        workflowJson['5'].inputs.seed = params.randomizeSeed ? Math.floor(Math.random() * 100000000) : params.seed;
        workflowJson['5'].inputs.steps = params.steps;
        workflowJson['5'].inputs.cfg = params.cfg;
      }
    }

    // 3. Submit to /prompt
    try {
      const response = await ComfyApiService.queuePrompt(
        backendUrl,
        workflowJson,
        clientId,
        { workflow_type: params.workflow },
        authToken
      );

      if (response?.prompt_id) {
        setActivePromptId(response.prompt_id);
        await refreshQueue();
        return response.prompt_id;
      }
      return null;
    } catch (err: any) {
      setIsGenerating(false);
      throw err;
    }
  };

  // Video generation submission (supports MiniMax H3)
  const submitVideoGeneration = async (params: VideoWorkflowParams): Promise<string | null> => {
    if (connectionStatus !== 'connected') {
      throw new Error('ComfyUI is disconnected. Please connect in Settings first.');
    }

    setIsGenerating(true);
    let uploadedImageName: string | null = null;

    // 1. Upload reference image if provided (Picture 1)
    if (params.referenceImageFile) {
      const uploadRes = await ComfyApiService.uploadImage(
        backendUrl,
        params.referenceImageFile,
        `minimax_ref_${Date.now()}_${params.referenceImageFile.name}`,
        authToken
      );
      if (uploadRes) {
        uploadedImageName = uploadRes.name;
      }
    }

    // 2. Prepare structured or raw multimodal prompt
    const finalPromptText =
      params.mode === 'structured'
        ? formatMiniMaxPrompt(params.structuredPrompt)
        : params.rawPrompt;

    // 3. Prepare workflow JSON
    let workflowJson: Record<string, any>;

    if (params.workflow === 'custom-video' && params.customWorkflowJson) {
      try {
        workflowJson = JSON.parse(params.customWorkflowJson);
      } catch (err: any) {
        setIsGenerating(false);
        throw new Error(`Invalid custom video workflow JSON: ${err.message}`);
      }
    } else {
      // Default MiniMax H3 workflow
      workflowJson = JSON.parse(JSON.stringify(BUILTIN_WORKFLOWS.minimaxH3.json));
    }

    // 4. Apply node mappings: prompt, reference image, seed, duration, resolution, fps
    const mapping = params.nodeMapping || miniMaxMapping;

    // Map prompt node
    if (mapping.promptNodeId && workflowJson[mapping.promptNodeId]) {
      const node = workflowJson[mapping.promptNodeId];
      if (!node.inputs) node.inputs = {};
      node.inputs[mapping.promptInputKey || 'text'] = finalPromptText;
    }

    // Map reference image node
    if (uploadedImageName && mapping.imageNodeId && workflowJson[mapping.imageNodeId]) {
      const node = workflowJson[mapping.imageNodeId];
      if (!node.inputs) node.inputs = {};
      node.inputs[mapping.imageInputKey || 'image'] = uploadedImageName;
    }

    // Map seed
    const effectiveSeed = params.randomizeSeed
      ? Math.floor(Math.random() * 100000000)
      : params.seed;

    if (mapping.seedNodeId && workflowJson[mapping.seedNodeId]) {
      const node = workflowJson[mapping.seedNodeId];
      if (!node.inputs) node.inputs = {};
      node.inputs[mapping.seedInputKey || 'seed'] = effectiveSeed;
    }

    // Map duration / frames in latent node if present
    if (mapping.durationNodeId && workflowJson[mapping.durationNodeId]) {
      const node = workflowJson[mapping.durationNodeId];
      if (node.inputs) {
        // Parse resolution (e.g. "720x1280")
        const [w, h] = params.resolution.split(' ')[0].split('x').map(Number);
        if (w && h) {
          node.inputs.width = w;
          node.inputs.height = h;
        }
        // Calculate frame count: duration * fps
        const totalFrames = Math.max(25, Math.round(params.durationSeconds * params.fps));
        if (node.inputs.batch_size !== undefined) {
          node.inputs.batch_size = totalFrames;
        }
        if (node.inputs.length !== undefined) {
          node.inputs.length = totalFrames;
        }
      }
    }

    // Map FPS in video output node
    if (mapping.fpsNodeId && workflowJson[mapping.fpsNodeId]) {
      const node = workflowJson[mapping.fpsNodeId];
      if (node.inputs && node.inputs.frame_rate !== undefined) {
        node.inputs.frame_rate = params.fps;
      }
    }

    // 5. Submit to /prompt
    try {
      const response = await ComfyApiService.queuePrompt(
        backendUrl,
        workflowJson,
        clientId,
        {
          workflow_type: 'minimax-h3-video',
          multimodal_prompt: finalPromptText,
          duration: params.durationSeconds,
          resolution: params.resolution,
        },
        authToken
      );

      if (response?.prompt_id) {
        setActivePromptId(response.prompt_id);
        await refreshQueue();
        return response.prompt_id;
      }
      return null;
    } catch (err: any) {
      setIsGenerating(false);
      throw err;
    }
  };

  const isOnline = connectionStatus === 'connected';

  return (
    <ComfyContext.Provider
      value={{
        connectionStatus,
        isOnline,
        backendUrl,
        authToken,
        clientId,
        lastError,
        systemStats,
        latencyMs,
        queue,
        activePromptId,
        executingNodeId,
        executionProgress,
        isGenerating,
        galleryItems,
        isLoadingGallery,
        setBackendUrl,
        setAuthToken,
        updateMiniMaxMapping,
        miniMaxMapping,
        checkConnection,
        refreshQueue,
        refreshHistory,
        interruptExecution,
        cancelQueueJob,
        clearAllPending,
        submitImageGeneration,
        submitVideoGeneration,
      }}
    >
      {children}
    </ComfyContext.Provider>
  );
};

export const useComfy = (): ComfyContextType => {
  const context = useContext(ComfyContext);
  if (!context) {
    throw new Error('useComfy must be used within a ComfyProvider');
  }
  return context;
};
