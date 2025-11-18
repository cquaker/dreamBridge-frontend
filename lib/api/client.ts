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
 * 获取 API 基础 URL
 * 
 * 优先级：
 * 1. NEXT_PUBLIC_API_BASE_URL 环境变量（如果设置，直接使用，适用于跨域场景）
 * 2. 使用相对路径（通过 Next.js rewrites 代理到后端，适用于同域场景）
 */
function getApiBaseURL(): string {
  // 如果设置了 NEXT_PUBLIC_API_BASE_URL，直接使用（适用于跨域或直接访问后端）
  if (process.env.NEXT_PUBLIC_API_BASE_URL) {
    return process.env.NEXT_PUBLIC_API_BASE_URL;
  }
  
  // 否则使用相对路径，通过 Next.js rewrites 代理到后端
  // 这样无论用户从哪里访问，都能正常工作
  return '';
}

/**
 * API 基础 URL
 */
export const apiBaseURL = getApiBaseURL();

// 调试：打印 API baseURL
console.log('[API Client] Initializing with baseURL:', apiBaseURL || '(relative path, using Next.js proxy)');
console.log('[API Client] NEXT_PUBLIC_API_BASE_URL env:', process.env.NEXT_PUBLIC_API_BASE_URL);

/**
 * 默认 API 客户端实例
 * 自动从环境变量读取 baseURL
 */
export const apiClient = new DreamBridgeClient({
  baseURL: apiBaseURL,
  timeout: 120000, // 2 分钟超时，适合长时间处理
});

/**
 * 规范化 API URL
 * 
 * 当使用 Next.js 代理时，API 返回的 URL 可能是绝对路径（如 http://localhost:8000/audios/xxx.wav）
 * 需要转换为相对路径，以便通过 Next.js 代理访问
 * 
 * 如果设置了 NEXT_PUBLIC_API_BASE_URL，则支持将相对路径转换为绝对路径
 * 
 * @param url API 返回的 URL
 * @param baseURL 当前使用的 API base URL
 * @returns 转换后的 URL
 */
export function normalizeApiUrl(url: string | null | undefined, baseURL: string): string | null {
  if (!url) return null;
  
  // 如果已经是绝对 URL（包含 http:// 或 https://），根据 baseURL 决定是否转换
  if (url.startsWith('http://') || url.startsWith('https://')) {
    // 如果设置了 NEXT_PUBLIC_API_BASE_URL，直接返回原始 URL
    if (baseURL) {
      return url;
    }
    
    // 否则尝试从绝对 URL 中提取路径部分（使用代理模式）
    try {
      const urlObj = new URL(url);
      // 如果 URL 的 origin 匹配常见的后端地址，提取路径
      // 支持 localhost:8000 或服务器 IP:8000
      if (urlObj.port === '8000' || urlObj.hostname === 'localhost' || urlObj.hostname.match(/^\d+\.\d+\.\d+\.\d+$/)) {
        return urlObj.pathname + urlObj.search;
      }
    } catch {
      // URL 解析失败，返回原始 URL
    }
    return url;
  }
  
  // 如果是相对路径，根据 baseURL 决定是否添加前缀
  if (baseURL) {
    // 添加 baseURL 前缀
    const base = baseURL.endsWith('/') ? baseURL.slice(0, -1) : baseURL;
    const path = url.startsWith('/') ? url : `/${url}`;
    return `${base}${path}`;
  }
  
  // 使用代理模式，直接返回相对路径
  return url;
}

