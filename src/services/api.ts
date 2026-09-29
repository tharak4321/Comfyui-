import {
  ComfySystemStats,
  QueueStatusResponse,
  HistoryItem,
  OutputMedia,
} from '../types/comfy';

export interface ConnectionTestResult {
  ok: boolean;
  status: 'connected' | 'disconnected' | 'cors_blocked';
  message: string;
  stats?: ComfySystemStats;
  latencyMs?: number;
}

export class ComfyApiService {
  private static sanitizeUrl(url: string): string {
    let clean = url.trim();
    if (!clean) return 'http://127.0.0.1:8188';
    if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
      clean = `http://${clean}`;
    }
    return clean.replace(/\/+$/, '');
  }

  private static getHeaders(authToken?: string): HeadersInit {
    const headers: Record<string, string> = {};
    if (authToken && authToken.trim()) {
      headers['Authorization'] = authToken.startsWith('Bearer ')
        ? authToken
        : `Bearer ${authToken.trim()}`;
    }
    return headers;
  }

  /**
   * Test connection to local ComfyUI.
   * Checks /system_stats. If fetch throws a TypeError, it's typically offline or CORS blocked.
   */
  public static async testConnection(
    backendUrl: string,
    authToken?: string
  ): Promise<ConnectionTestResult> {
    const baseUrl = this.sanitizeUrl(backendUrl);
    const start = performance.now();

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4500);

      const res = await fetch(`${baseUrl}/system_stats`, {
        method: 'GET',
        headers: this.getHeaders(authToken),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const latencyMs = Math.round(performance.now() - start);

      if (res.ok) {
        const stats = (await res.json()) as ComfySystemStats;
        return {
          ok: true,
          status: 'connected',
          message: `Connected successfully (${latencyMs}ms)`,
          stats,
          latencyMs,
        };
      }

      // If /system_stats returned 404, try /history or /queue
      const altRes = await fetch(`${baseUrl}/queue`, {
        method: 'GET',
        headers: this.getHeaders(authToken),
      });

      if (altRes.ok) {
        return {
          ok: true,
          status: 'connected',
          message: `Connected to ComfyUI (${latencyMs}ms)`,
          latencyMs,
        };
      }

      return {
        ok: false,
        status: 'disconnected',
        message: `HTTP ${res.status}: ${res.statusText}`,
        latencyMs,
      };
    } catch (err: any) {
      const latencyMs = Math.round(performance.now() - start);
      const isCorsOrOffline =
        err.name === 'AbortError'
          ? 'Connection timed out. Ensure ComfyUI is running.'
          : err.message?.includes('Failed to fetch') || err.message?.includes('NetworkError')
          ? 'Unable to reach ComfyUI. If running on another machine/device, start ComfyUI with: --listen 0.0.0.0 --enable-cors-header *'
          : err.message || 'Connection failed';

      return {
        ok: false,
        status: 'disconnected',
        message: isCorsOrOffline,
        latencyMs,
      };
    }
  }

  /**
   * Fetch real system stats (OS, Python version, GPU device stats) from ComfyUI.
   * Returns null if disconnected. No simulated metrics.
   */
  public static async getSystemStats(
    backendUrl: string,
    authToken?: string
  ): Promise<ComfySystemStats | null> {
    const baseUrl = this.sanitizeUrl(backendUrl);
    try {
      const res = await fetch(`${baseUrl}/system_stats`, {
        headers: this.getHeaders(authToken),
      });
      if (!res.ok) return null;
      return (await res.json()) as ComfySystemStats;
    } catch {
      return null;
    }
  }

  /**
   * Fetch queue status: running jobs and pending jobs.
   */
  public static async getQueue(
    backendUrl: string,
    authToken?: string
  ): Promise<QueueStatusResponse | null> {
    const baseUrl = this.sanitizeUrl(backendUrl);
    try {
      const res = await fetch(`${baseUrl}/queue`, {
        headers: this.getHeaders(authToken),
      });
      if (!res.ok) return null;
      return (await res.json()) as QueueStatusResponse;
    } catch {
      return null;
    }
  }

  /**
   * Fetch execution history from ComfyUI /history.
   */
  public static async getHistory(
    backendUrl: string,
    authToken?: string,
    maxItems = 30
  ): Promise<Record<string, HistoryItem> | null> {
    const baseUrl = this.sanitizeUrl(backendUrl);
    try {
      const res = await fetch(`${baseUrl}/history?max_items=${maxItems}`, {
        headers: this.getHeaders(authToken),
      });
      if (!res.ok) return null;
      return (await res.json()) as Record<string, HistoryItem>;
    } catch {
      return null;
    }
  }

  /**
   * Upload an input reference image directly to ComfyUI /upload/image.
   */
  public static async uploadImage(
    backendUrl: string,
    file: File | Blob,
    filename?: string,
    authToken?: string
  ): Promise<{ name: string; subfolder: string; type: string } | null> {
    const baseUrl = this.sanitizeUrl(backendUrl);
    const formData = new FormData();
    const name = filename || (file instanceof File ? file.name : `upload_${Date.now()}.png`);
    formData.append('image', file, name);
    formData.append('overwrite', 'true');

    try {
      const headers = this.getHeaders(authToken);
      const res = await fetch(`${baseUrl}/upload/image`, {
        method: 'POST',
        headers,
        body: formData,
      });

      if (!res.ok) {
        throw new Error(`Upload failed with status: ${res.status}`);
      }

      return await res.json();
    } catch (err) {
      console.error('ComfyUI image upload error:', err);
      return null;
    }
  }

  /**
   * Queue a prompt workflow JSON payload to ComfyUI /prompt.
   */
  public static async queuePrompt(
    backendUrl: string,
    promptWorkflow: Record<string, any>,
    clientId: string,
    extraData?: Record<string, any>,
    authToken?: string
  ): Promise<{ prompt_id: string; number: number; node_errors?: any } | null> {
    const baseUrl = this.sanitizeUrl(backendUrl);
    const payload = {
      prompt: promptWorkflow,
      client_id: clientId,
      extra_data: extraData || {},
    };

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(this.getHeaders(authToken) as Record<string, string>),
      };

      const res = await fetch(`${baseUrl}/prompt`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Prompt queue rejected: ${res.status} ${errorText}`);
      }

      return await res.json();
    } catch (err) {
      console.error('ComfyUI queuePrompt error:', err);
      throw err;
    }
  }

  /**
   * Interrupt currently running execution via /interrupt.
   */
  public static async interrupt(
    backendUrl: string,
    authToken?: string
  ): Promise<boolean> {
    const baseUrl = this.sanitizeUrl(backendUrl);
    try {
      const res = await fetch(`${baseUrl}/interrupt`, {
        method: 'POST',
        headers: this.getHeaders(authToken),
      });
      return res.ok;
    } catch (err) {
      console.error('ComfyUI interrupt error:', err);
      return false;
    }
  }

  /**
   * Remove a specific prompt from queue or clear pending queue.
   */
  public static async deleteQueueItem(
    backendUrl: string,
    promptId: string,
    authToken?: string
  ): Promise<boolean> {
    const baseUrl = this.sanitizeUrl(backendUrl);
    try {
      const res = await fetch(`${baseUrl}/queue`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.getHeaders(authToken) as Record<string, string>),
        },
        body: JSON.stringify({ delete: [promptId] }),
      });
      return res.ok;
    } catch (err) {
      console.error('Delete queue item error:', err);
      return false;
    }
  }

  public static async clearQueue(
    backendUrl: string,
    authToken?: string
  ): Promise<boolean> {
    const baseUrl = this.sanitizeUrl(backendUrl);
    try {
      const res = await fetch(`${baseUrl}/queue`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.getHeaders(authToken) as Record<string, string>),
        },
        body: JSON.stringify({ clear: true }),
      });
      return res.ok;
    } catch (err) {
      console.error('Clear queue error:', err);
      return false;
    }
  }

  /**
   * Construct media URL for generated image/video output.
   */
  public static getMediaUrl(
    backendUrl: string,
    filename: string,
    subfolder = '',
    type = 'output'
  ): string {
    const baseUrl = this.sanitizeUrl(backendUrl);
    const params = new URLSearchParams({
      filename,
      subfolder: subfolder || '',
      type: type || 'output',
    });
    return `${baseUrl}/view?${params.toString()}`;
  }

  /**
   * Converts ComfyUI WebSocket URL from HTTP backend URL.
   */
  public static getWebSocketUrl(backendUrl: string, clientId: string): string {
    const baseUrl = this.sanitizeUrl(backendUrl);
    const wsProto = baseUrl.startsWith('https://') ? 'wss://' : 'ws://';
    const host = baseUrl.replace(/^https?:\/\//, '');
    return `${wsProto}${host}/ws?clientId=${encodeURIComponent(clientId)}`;
  }
}
