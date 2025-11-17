/**
 * DreamBridge API 客户端封装
 * 
 * 提供类型安全的 API 调用方法
 * 
 * 使用示例：
 * ```typescript
 * import { DreamBridgeClient } from '@/lib/dreambridge-api-client';
 * 
 * const client = new DreamBridgeClient({
 *   baseURL: 'http://localhost:8000'
 * });
 * 
 * // 上传音频
 * const audio = await client.uploadAudio(file);
 * 
 * // 转录
 * const transcription = await client.transcribeAudio(audio.name);
 * ```
 */

import type {
  ApiResponse,
  AudioItem,
  AudioList,
  TranscriptionResponse,
  ExtractionResponse,
  RecommendationResponse,
  ReportResponse,
  PPTResponse,
  PipelineResponse,
  StudentProfile,
  SaveThinkingProcessRequest,
  ThinkingProcessResponse,
  ApiClientConfig,
} from '../types/dreambridge-api-types';

/**
 * DreamBridge API 客户端
 */
export class DreamBridgeClient {
  private baseURL: string;
  private timeout: number;
  private headers: Record<string, string>;

  constructor(config: ApiClientConfig) {
    this.baseURL = config.baseURL;
    this.timeout = config.timeout || 60000;
    this.headers = config.headers || {};
  }

  // ========================================================================
  // 私有辅助方法
  // ========================================================================

  /**
   * 发送 HTTP 请求
   */
  private async request<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${path}`;
    
    // 调试：打印请求 URL
    console.log('[API Client] Request URL:', url);
    console.log('[API Client] BaseURL:', this.baseURL);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...this.headers,
          ...options.headers,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // 检查 HTTP 状态码
      if (!response.ok) {
        let errorMessage = response.statusText || '请求失败';
        try {
          const errorData = await response.json();
          errorMessage = errorData.detail || errorData.message || errorMessage;
        } catch {
          // 无法解析错误响应，使用默认消息
        }
        
        return {
          success: false,
          data: null,
          message: null,
          error: {
            code: `HTTP_${response.status}`,
            message: errorMessage,
          },
        };
      }

      // 解析 JSON 响应
      const rawData = await response.json();
      
      // 调试：打印响应数据
      console.log('[API Client] Response status:', response.status);
      console.log('[API Client] Response data:', rawData);

      // 检查响应是否已经是 ApiResponse 格式
      if (typeof rawData === 'object' && rawData !== null && 'success' in rawData) {
        // 已经是 ApiResponse 格式，直接返回
        return rawData as ApiResponse<T>;
      }

      // 否则，将原始数据包装成 ApiResponse 格式
      return {
        success: true,
        data: rawData as T,
        message: null,
        error: null,
      };
      
    } catch (error) {
      clearTimeout(timeoutId);
      
      // 调试：打印错误信息
      console.error('[API Client] Request failed:', error);
      console.error('[API Client] Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        url: url,
      });
      
      // 网络错误或超时
      return {
        success: false,
        data: null,
        message: null,
        error: {
          code: 'NETWORK_ERROR',
          message: error instanceof Error ? error.message : '网络请求失败',
        },
      };
    }
  }

  /**
   * GET 请求
   */
  private async get<T>(path: string): Promise<ApiResponse<T>> {
    return this.request<T>(path, { method: 'GET' });
  }

  /**
   * POST 请求（JSON）
   */
  private async post<T>(path: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(path, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  /**
   * POST 请求（FormData）
   */
  private async postFormData<T>(path: string, formData: FormData): Promise<ApiResponse<T>> {
    return this.request<T>(path, {
      method: 'POST',
      body: formData,
    });
  }

  /**
   * 创建 EventSource 连接
   */
  private createEventSource(path: string): EventSource {
    // 如果 baseURL 为空（使用相对路径），在浏览器环境中使用当前页面的 origin
    let url: string;
    if (this.baseURL) {
      url = `${this.baseURL}${path}`;
    } else {
      // 在浏览器环境中，使用当前页面的 origin
      if (typeof window !== 'undefined') {
        url = `${window.location.origin}${path}`;
      } else {
        // 服务器端（不应该发生，因为 EventSource 只在浏览器中可用）
        url = path;
      }
    }
    return new EventSource(url);
  }

  // ========================================================================
  // 音频管理 API
  // ========================================================================

  /**
   * 上传音频文件
   */
  async uploadAudio(file: File): Promise<ApiResponse<AudioItem>> {
    const formData = new FormData();
    formData.append('file', file);
    return this.postFormData<AudioItem>('/api/audios', formData);
  }

  /**
   * 获取音频列表
   */
  async listAudios(): Promise<ApiResponse<AudioList>> {
    return this.get<AudioList>('/api/audios');
  }

  // ========================================================================
  // 音频转录 API
  // ========================================================================

  /**
   * 同步转录音频
   */
  async transcribeAudio(audioName: string): Promise<ApiResponse<TranscriptionResponse>> {
    return this.post<TranscriptionResponse>(`/api/audios/${audioName}/transcribe`);
  }

  /**
   * 流式转录音频
   * 
   * @param audioName 音频文件名
   * @param onEvent 事件回调
   * @returns Promise，在转录完成或失败时 resolve
   */
  streamTranscription(
    audioName: string,
    onEvent: (event: any) => void
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const eventSource = this.createEventSource(
        `/api/audios/${audioName}/transcribe/stream`
      );

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          onEvent(data);

          if (data.event === 'complete') {
            eventSource.close();
            resolve();
          } else if (data.event === 'error') {
            eventSource.close();
            reject(new Error(data.message));
          }
        } catch (error) {
          eventSource.close();
          reject(error);
        }
      };

      eventSource.onerror = () => {
        eventSource.close();
        reject(new Error('EventSource 连接失败'));
      };
    });
  }

  // ========================================================================
  // 学生画像提取 API
  // ========================================================================

  /**
   * 同步提取学生画像
   */
  async extractProfile(
    subtitleName: string,
    prompt?: string
  ): Promise<ApiResponse<ExtractionResponse>> {
    return this.post<ExtractionResponse>(
      `/api/subtitles/${subtitleName}/extract`,
      { prompt }
    );
  }

  /**
   * 流式提取学生画像
   */
  streamExtraction(
    subtitleName: string,
    onEvent: (event: any) => void
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const eventSource = this.createEventSource(
        `/api/subtitles/${subtitleName}/extract/stream`
      );

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          onEvent(data);

          if (data.event === 'completed') {
            eventSource.close();
            resolve();
          } else if (data.event === 'error') {
            eventSource.close();
            reject(new Error(data.message));
          }
        } catch (error) {
          eventSource.close();
          reject(error);
        }
      };

      eventSource.onerror = () => {
        eventSource.close();
        reject(new Error('EventSource 连接失败'));
      };
    });
  }

  /**
   * 保存学生画像
   */
  async saveProfile(
    subtitleName: string,
    profile: StudentProfile
  ): Promise<ApiResponse<{ status: string }>> {
    return this.post(`/api/subtitles/${subtitleName}/profile`, { profile });
  }

  /**
   * 获取学生画像 JSON
   * 
   * @param profileName 画像文件名，例如 "test-student_profile.json"
   * @returns 学生画像数据
   */
  async getProfile(profileName: string): Promise<ApiResponse<StudentProfile>> {
    // URL 编码文件名，确保中文和特殊字符正确传输
    const encodedProfileName = encodeURIComponent(profileName);
    return this.get<StudentProfile>(`/api/profiles/${encodedProfileName}`);
  }

  /**
   * 重命名字幕说话人
   */
  async renameSubtitleSpeakers(
    subtitleName: string,
    speakerA: string,
    speakerB: string
  ): Promise<ApiResponse<{ status: string; updated_content: string }>> {
    return this.post(`/api/subtitles/${subtitleName}/rename`, {
      speaker_a: speakerA,
      speaker_b: speakerB,
    });
  }

  // ========================================================================
  // 推荐报告 API
  // ========================================================================

  /**
   * 生成推荐 JSON
   */
  async generateRecommendation(
    profileName: string
  ): Promise<ApiResponse<RecommendationResponse>> {
    // URL 编码文件名，确保中文和特殊字符正确传输
    const encodedProfileName = encodeURIComponent(profileName);
    return this.post<RecommendationResponse>(
      `/api/profiles/${encodedProfileName}/recommendation`
    );
  }

  /**
   * 流式生成推荐方案
   */
  streamRecommendation(
    profileName: string,
    onEvent: (event: any) => void
  ): Promise<void> {
    // URL 编码文件名，确保中文和特殊字符正确传输
    const encodedProfileName = encodeURIComponent(profileName);
    return new Promise((resolve, reject) => {
      const eventSource = this.createEventSource(
        `/api/profiles/${encodedProfileName}/recommendation/stream`
      );

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          onEvent(data);

          if (data.event === 'completed') {
            eventSource.close();
            resolve();
          } else if (data.event === 'error') {
            eventSource.close();
            reject(new Error(data.message));
          }
        } catch (error) {
          eventSource.close();
          reject(error);
        }
      };

      eventSource.onerror = (error) => {
        eventSource.close();
        const errorMessage = error instanceof Error ? error.message : 'EventSource 连接失败';
        console.error('[API Client] EventSource error:', errorMessage);
        reject(new Error(`EventSource 连接失败: ${errorMessage}`));
      };
    });
  }

  /**
   * 生成 Markdown 报告
   */
  async generateReport(
    profileName: string
  ): Promise<ApiResponse<ReportResponse>> {
    // URL 编码文件名，确保中文和特殊字符正确传输
    const encodedProfileName = encodeURIComponent(profileName);
    return this.post<ReportResponse>(`/api/profiles/${encodedProfileName}/report`);
  }

  /**
   * 流式生成报告
   */
  streamReport(
    profileName: string,
    onEvent: (event: any) => void
  ): Promise<void> {
    // URL 编码文件名，确保中文和特殊字符正确传输
    const encodedProfileName = encodeURIComponent(profileName);
    return new Promise((resolve, reject) => {
      const eventSource = this.createEventSource(
        `/api/profiles/${encodedProfileName}/report/stream`
      );

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          onEvent(data);

          if (data.event === 'completed') {
            eventSource.close();
            resolve();
          } else if (data.event === 'error') {
            eventSource.close();
            reject(new Error(data.message));
          }
        } catch (error) {
          eventSource.close();
          reject(error);
        }
      };

      eventSource.onerror = () => {
        eventSource.close();
        reject(new Error('EventSource 连接失败'));
      };
    });
  }

  /**
   * 生成 PPT
   */
  async generatePPT(profileName: string): Promise<ApiResponse<PPTResponse>> {
    // URL 编码文件名，确保中文和特殊字符正确传输
    const encodedProfileName = encodeURIComponent(profileName);
    return this.post<PPTResponse>(`/api/profiles/${encodedProfileName}/ppt`);
  }

  /**
   * 流式生成 PPT
   */
  streamPPT(
    profileName: string,
    onEvent: (event: any) => void
  ): Promise<void> {
    // URL 编码文件名，确保中文和特殊字符正确传输
    const encodedProfileName = encodeURIComponent(profileName);
    return new Promise((resolve, reject) => {
      const eventSource = this.createEventSource(
        `/api/profiles/${encodedProfileName}/ppt/stream`
      );

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          onEvent(data);

          if (data.event === 'completed') {
            eventSource.close();
            resolve();
          } else if (data.event === 'error') {
            eventSource.close();
            reject(new Error(data.message));
          }
        } catch (error) {
          eventSource.close();
          reject(error);
        }
      };

      eventSource.onerror = () => {
        eventSource.close();
        reject(new Error('EventSource 连接失败'));
      };
    });
  }

  /**
   * 下载 PPT 文件
   * 
   * @param profileName 画像文件名，例如 "test-student_profile.json"
   * @returns Promise，下载文件
   */
  async downloadPPT(profileName: string): Promise<void> {
    // URL 编码 profileName，确保特殊字符（如中文）正确编码
    const encodedProfileName = encodeURIComponent(profileName);
    const url = `${this.baseURL}/api/profiles/${encodedProfileName}/ppt/download`;
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          ...this.headers,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorMessage = response.statusText || '下载失败';
        try {
          const errorData = await response.json();
          errorMessage = errorData.detail || errorData.message || errorMessage;
        } catch {
          // 无法解析错误响应，使用默认消息
        }
        throw new Error(`下载失败: ${errorMessage} (${response.status})`);
      }

      // 获取文件名（从 Content-Disposition 头或使用默认名称）
      const contentDisposition = response.headers.get('Content-Disposition');
      console.log("Content-Disposition 头:", contentDisposition);
      
      // 默认文件名：将 -student_profile.json 替换为 -ppt.md
      // 例如：山西客户-邓顾问-student_profile.json -> 山西客户-邓顾问-ppt.md
      let filename = profileName.replace(/-student_profile\.json$/i, '-ppt.md');
      // 如果上面没有匹配到，尝试替换 student_profile.json
      if (filename === profileName) {
        filename = profileName.replace(/student_profile\.json$/i, 'ppt.md');
      }
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, '');
          console.log("从 Content-Disposition 获取的文件名:", filename);
          // 处理 URL 编码的文件名
          try {
            filename = decodeURIComponent(filename);
            console.log("解码后的文件名:", filename);
          } catch {
            // 如果解码失败，使用原始文件名
            console.log("文件名解码失败，使用原始文件名");
          }
        } else {
          console.log("Content-Disposition 中未找到文件名，使用默认文件名");
        }
      } else {
        console.log("服务器未返回 Content-Disposition 头，使用默认文件名:", filename);
      }
      
      console.log("最终使用的文件名:", filename);

      // 创建 blob 并触发下载
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('下载超时，请稍后重试');
        }
        if (error.message.includes('Failed to fetch')) {
          throw new Error('网络连接失败，请检查网络连接或服务器是否可访问');
        }
        throw error;
      }
      throw new Error(`下载 PPT 失败: 未知错误`);
    }
  }

  // ========================================================================
  // 流水线 API
  // ========================================================================

  /**
   * 同步执行完整流水线
   */
  async runPipeline(audioName: string): Promise<ApiResponse<PipelineResponse>> {
    return this.post<PipelineResponse>(`/api/audios/${audioName}/report`);
  }

  /**
   * 流式执行流水线
   */
  streamPipeline(
    audioName: string,
    onEvent: (event: any) => void
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const eventSource = this.createEventSource(
        `/api/audios/${audioName}/report/stream`
      );

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          onEvent(data);

          if (data.event === 'completed' || data.event === 'summary') {
            eventSource.close();
            resolve();
          } else if (data.event === 'error') {
            eventSource.close();
            reject(new Error(data.message));
          }
        } catch (error) {
          eventSource.close();
          reject(error);
        }
      };

      eventSource.onerror = () => {
        eventSource.close();
        reject(new Error('EventSource 连接失败'));
      };
    });
  }

  // ========================================================================
  // 工作流思考过程 API
  // ========================================================================

  /**
   * 保存思考过程
   */
  async saveThinkingProcess(
    data: SaveThinkingProcessRequest
  ): Promise<ApiResponse<{ status: string; message: string }>> {
    return this.post('/api/workflow/thinking-process', data);
  }

  /**
   * 获取思考过程
   */
  async getThinkingProcess(
    audioName: string,
    stageId: string
  ): Promise<ApiResponse<ThinkingProcessResponse>> {
    return this.get<ThinkingProcessResponse>(
      `/api/workflow/thinking-process/${audioName}/${stageId}`
    );
  }
}

/**
 * 创建默认客户端实例
 */
export function createClient(baseURL = 'http://8.130.116.143:8809'): DreamBridgeClient {
  return new DreamBridgeClient({ baseURL });
}

/**
 * 默认客户端实例（可直接使用）
 */
export const defaultClient = createClient();

