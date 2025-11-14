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
} from './dreambridge-api-types';

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
    const url = `${this.baseURL}${path}`;
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
    return this.get<StudentProfile>(`/api/profiles/${profileName}`);
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
    return this.post<RecommendationResponse>(
      `/api/profiles/${profileName}/recommendation`
    );
  }

  /**
   * 流式生成推荐方案
   */
  streamRecommendation(
    profileName: string,
    onEvent: (event: any) => void
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const eventSource = this.createEventSource(
        `/api/profiles/${profileName}/recommendation/stream`
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
   * 生成 Markdown 报告
   */
  async generateReport(
    profileName: string
  ): Promise<ApiResponse<ReportResponse>> {
    return this.post<ReportResponse>(`/api/profiles/${profileName}/report`);
  }

  /**
   * 流式生成报告
   */
  streamReport(
    profileName: string,
    onEvent: (event: any) => void
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const eventSource = this.createEventSource(
        `/api/profiles/${profileName}/report/stream`
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
    return this.post<PPTResponse>(`/api/profiles/${profileName}/ppt`);
  }

  /**
   * 流式生成 PPT
   */
  streamPPT(
    profileName: string,
    onEvent: (event: any) => void
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const eventSource = this.createEventSource(
        `/api/profiles/${profileName}/ppt/stream`
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
export function createClient(baseURL = 'http://localhost:8000'): DreamBridgeClient {
  return new DreamBridgeClient({ baseURL });
}

/**
 * 默认客户端实例（可直接使用）
 */
export const defaultClient = createClient();

