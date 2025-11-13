/**
 * DreamBridge API 客户端实例
 * 
 * 使用示例：
 * ```typescript
 * import { apiClient } from '@/lib/api/client';
 * 
 * const audio = await apiClient.uploadAudio(file);
 * ```
 */

import { DreamBridgeClient } from './dreambridge-api-client';

/**
 * 默认 API 客户端实例
 * 自动从环境变量读取 baseURL
 */
export const apiClient = new DreamBridgeClient({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000',
  timeout: 120000, // 2 分钟超时，适合长时间处理
});

