/**
 * DreamBridge API TypeScript 类型定义
 * 
 * 用于前端项目中的类型检查和代码提示
 * 
 * 使用方式：
 * 1. 将此文件复制到前端项目的 types 目录
 * 2. 在需要的地方导入类型
 * 
 * @example
 * ```typescript
 * import type { ApiResponse, AudioItem } from '@/types/dreambridge-api-types';
 * 
 * const response: ApiResponse<AudioItem> = await uploadAudio(file);
 * ```
 */

// ============================================================================
// 基础响应类型
// ============================================================================

/**
 * 统一的 API 响应格式
 * 所有接口都返回这个结构
 */
export interface ApiResponse<T = any> {
  /** 请求是否成功 */
  success: boolean;
  /** 成功时返回的数据 */
  data: T | null;
  /** 操作提示信息 */
  message: string | null;
  /** 失败时的错误详情 */
  error: ErrorDetail | null;
}

/**
 * 错误详情
 */
export interface ErrorDetail {
  /** 错误码，用于前端识别错误类型 */
  code: string;
  /** 人类可读的错误信息 */
  message: string;
  /** 额外的错误详情 */
  details?: Record<string, any>;
}

/**
 * 分页响应格式
 */
export interface PaginatedResponse<T> {
  /** 当前页的数据列表 */
  items: T[];
  /** 总记录数 */
  total: number;
  /** 当前页码（从 1 开始） */
  page: number;
  /** 每页大小 */
  page_size: number;
  /** 总页数 */
  total_pages: number;
}

// ============================================================================
// 错误码常量
// ============================================================================

/**
 * 标准错误码
 */
export enum ErrorCode {
  // 通用错误
  INTERNAL_ERROR = "INTERNAL_ERROR",
  VALIDATION_ERROR = "VALIDATION_ERROR",
  NOT_FOUND = "NOT_FOUND",
  UNAUTHORIZED = "UNAUTHORIZED",
  FORBIDDEN = "FORBIDDEN",
  
  // 文件相关
  FILE_NOT_FOUND = "FILE_NOT_FOUND",
  FILE_TOO_LARGE = "FILE_TOO_LARGE",
  FILE_FORMAT_ERROR = "FILE_FORMAT_ERROR",
  
  // 业务逻辑
  AUDIO_NOT_FOUND = "AUDIO_NOT_FOUND",
  TRANSCRIPTION_FAILED = "TRANSCRIPTION_FAILED",
  EXTRACTION_FAILED = "EXTRACTION_FAILED",
  GENERATION_FAILED = "GENERATION_FAILED",
}

// ============================================================================
// 音频相关类型
// ============================================================================

/**
 * 音频项信息
 */
export interface AudioItem {
  /** 文件名 */
  name: string;
  /** 访问 URL */
  url: string;
  /** 上传时间 */
  uploaded_at: string;
  /** 是否有转录文本 */
  has_transcript: boolean;
  /** 转录文本 URL */
  transcript_url: string | null;
  /** 是否有学生画像 */
  has_profile: boolean;
  /** 学生画像 URL */
  profile_url: string | null;
  /** 是否有推荐报告 */
  has_report: boolean;
  /** 报告 URL */
  report_url: string | null;
  /** 报告预览 URL */
  report_view_url: string | null;
  /** 是否有 PPT */
  has_ppt: boolean;
  /** PPT URL */
  ppt_url: string | null;
}

/**
 * 音频列表响应
 */
export interface AudioList {
  items: AudioItem[];
}

// ============================================================================
// 转录相关类型
// ============================================================================

/**
 * 转录响应
 */
export interface TranscriptionResponse {
  /** 音频文件名 */
  audio_name: string;
  /** 完整转录文本 */
  transcript_text: string;
  /** 字幕文件 URL */
  subtitle_url: string;
  /** 字幕预览 URL */
  subtitle_view_url: string;
}

/**
 * 流式转录事件
 */
export type TranscriptionStreamEvent = 
  | TranscriptionStartEvent
  | TranscriptionSentenceEvent
  | TranscriptionCompleteEvent
  | TranscriptionErrorEvent;

export interface TranscriptionStartEvent {
  event: 'start';
  audio_name: string;
  total_duration_ms: number;
}

export interface TranscriptionSentenceEvent {
  event: 'sentence';
  text: string;
  begin_time: number;
  end_time: number;
  srt_entry: string;
}

export interface TranscriptionCompleteEvent {
  event: 'complete';
  subtitle_url: string;
  subtitle_view_url: string;
}

export interface TranscriptionErrorEvent {
  event: 'error';
  message: string;
}

// ============================================================================
// 学生画像类型
// ============================================================================

/**
 * 学生基本信息
 */
export interface StudentBasicInfo {
  /** 姓名 */
  name?: string;
  /** 年龄 */
  age?: number;
  /** 年级 */
  grade?: string;
  /** 学校 */
  school?: string;
  /** 性别 */
  gender?: string;
  /** 联系方式 */
  contact?: string;
}

/**
 * 学术信息
 */
export interface StudentAcademic {
  /** GPA */
  gpa?: number;
  /** 考试成绩 */
  test_scores?: {
    toefl?: number;
    ielts?: number;
    sat?: number;
    act?: number;
    ap?: Record<string, any>;
    [key: string]: any;
  };
  /** 主修科目 */
  subjects?: string[];
  /** 学术成就 */
  achievements?: string[];
  /** 课外活动 */
  activities?: string[];
}

/**
 * 留学目标
 */
export interface StudentGoals {
  /** 目标国家 */
  target_countries?: string[];
  /** 目标专业 */
  target_majors?: string[];
  /** 目标学校层级 */
  target_school_tier?: string;
  /** 申请时间 */
  application_timeline?: string;
}

/**
 * 家庭背景
 */
export interface StudentFamily {
  /** 父母职业 */
  parents_occupation?: string;
  /** 家庭收入 */
  family_income?: string;
  /** 预算 */
  budget?: string;
}

/**
 * 完整学生画像（匹配实际 JSON 结构）
 */
export interface StudentProfile {
  /** 元信息 */
  元信息?: {
    提取时间?: string;
    访谈日期?: string;
    顾问姓名?: string | null;
    学生姓名?: string | null;
    [key: string]: any;
  };
  /** 学生画像 */
  学生画像?: {
    基本信息?: string;
    学术成绩?: string;
    语言能力?: string;
    软背景?: string;
    个人特质?: string;
    [key: string]: any;
  };
  /** 家庭背景 */
  家庭背景?: {
    经济状况?: string;
    决策结构?: string;
    家庭氛围?: string;
    [key: string]: any;
  };
  /** 申请意向 */
  申请意向?: {
    目标国家?: string | null;
    目标排名?: string | null;
    专业方向?: string | null;
    时间规划?: string;
    其他考虑?: string;
    [key: string]: any;
  };
  /** 约束条件 */
  约束条件?: {
    明确排除?: string;
    预算上限?: string | null;
    时间限制?: string;
    其他约束?: string;
    [key: string]: any;
  };
  /** 顾问研判 */
  顾问研判?: {
    核心矛盾?: string;
    主要风险?: string;
    关键机会?: string;
    策略建议?: string;
    [key: string]: any;
  };
  /** 兼容旧格式 */
  basic_info?: StudentBasicInfo;
  academic?: StudentAcademic;
  interests?: string[];
  goals?: StudentGoals;
  family?: StudentFamily;
  /** 其他信息 */
  [key: string]: any;
}

/**
 * 画像提取响应
 */
export interface ExtractionResponse {
  /** 画像 JSON URL */
  profile_json_url: string;
  /** 画像编辑器 URL */
  profile_editor_url: string;
  /** 画像数据 */
  profile: StudentProfile;
  /** 提取日志 */
  logs?: string[];
}

/**
 * 流式画像提取事件
 */
export type ExtractionStreamEvent =
  | { event: 'started' }
  | { event: 'log'; level: string; message: string }
  | { event: 'chunk'; content: string }
  | { event: 'completed'; profile_json_url: string }
  | { event: 'error'; message: string };

// ============================================================================
// 推荐报告类型
// ============================================================================

/**
 * 推荐信息
 */
export interface RecommendationResponse {
  /** 推荐 JSON URL */
  recommendation_url: string;
  /** 推荐数据 */
  recommendation_json: Record<string, any>;
}

/**
 * 报告响应
 */
export interface ReportResponse {
  /** 报告 URL */
  report_url: string;
  /** 报告预览 URL */
  report_view_url: string;
}

/**
 * PPT 响应
 */
export interface PPTResponse {
  /** PPT URL */
  ppt_url: string;
  /** PPT 预览 URL */
  ppt_view_url?: string;
}

/**
 * 流式报告生成事件
 */
export type ReportStreamEvent =
  | { event: 'started'; message: string }
  | { event: 'log'; level: string; message: string }
  | { event: 'chunk'; content: string }
  | { event: 'completed'; report_url: string; report_view_url: string }
  | { event: 'error'; message: string };

// ============================================================================
// 流水线类型
// ============================================================================

/**
 * 流水线响应
 */
export interface PipelineResponse {
  /** 画像 URL */
  profile_url: string;
  /** 推荐 URL */
  recommendation_url: string;
  /** 报告 URL */
  report_url: string;
  /** 报告预览 URL */
  report_view_url: string;
}

/**
 * 流水线阶段
 */
export type PipelineStage = 'extractor' | 'recommender' | 'formatter';

/**
 * 流水线阶段状态
 */
export type PipelineStageStatus = 'started' | 'completed' | 'failed';

/**
 * 流式流水线事件
 */
export type PipelineStreamEvent =
  | PipelineStageEvent
  | PipelineCompleteEvent
  | PipelineSummaryEvent
  | PipelineErrorEvent;

export interface PipelineStageEvent {
  event: 'stage';
  stage: PipelineStage;
  status: PipelineStageStatus;
  elapsed?: number;
}

export interface PipelineCompleteEvent {
  event: 'completed';
  message: string;
  total_elapsed: number;
  profile: StudentProfile;
}

export interface PipelineSummaryEvent {
  event: 'summary';
  profile_url: string;
  recommendation_url: string;
  report_url: string;
  report_view_url: string;
}

export interface PipelineErrorEvent {
  event: 'error';
  message: string;
}

// ============================================================================
// 工作流思考过程类型
// ============================================================================

/**
 * 思考过程行
 */
export interface ThinkingLine {
  /** 类型：thinking / action / result */
  type: 'thinking' | 'action' | 'result';
  /** 文本内容 */
  text: string;
  /** 时间戳 */
  timestamp?: string;
}

/**
 * 思考过程保存请求
 */
export interface SaveThinkingProcessRequest {
  /** 音频文件名 */
  audio_name: string;
  /** 阶段 ID */
  stage_id: string;
  /** 思考过程行 */
  lines: ThinkingLine[];
}

/**
 * 思考过程响应
 */
export interface ThinkingProcessResponse {
  /** 思考过程行 */
  lines: ThinkingLine[];
}

// ============================================================================
// 辅助函数类型
// ============================================================================

/**
 * API 客户端配置
 */
export interface ApiClientConfig {
  /** 基础 URL */
  baseURL: string;
  /** 超时时间（毫秒） */
  timeout?: number;
  /** 请求头 */
  headers?: Record<string, string>;
}

/**
 * EventSource 选项
 */
export interface EventSourceOptions {
  /** 是否携带凭证 */
  withCredentials?: boolean;
}

