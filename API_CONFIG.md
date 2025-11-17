# API 配置说明

## 问题描述

当在服务器上运行 Next.js 应用时，如果前端代码在浏览器中尝试访问 `http://localhost:8000`，浏览器会尝试连接**用户的本地机器**，而不是服务器，导致连接失败。

## 解决方案

项目现在支持两种配置方式：

### 方案 1：使用 Next.js 代理（推荐，默认）

通过 Next.js 的 `rewrites` 功能，将前端的 `/api/*` 请求代理到后端 API 服务器。

**配置步骤：**

1. 设置服务器端环境变量 `API_BASE_URL`（指向后端 API 服务器）：
   ```bash
   export API_BASE_URL=http://localhost:8000
   # 或者如果 API 在其他服务器上
   export API_BASE_URL=http://10.224.155.176:8000
   ```

2. 启动 Next.js 开发服务器：
   ```bash
   PORT=8808 pnpm dev
   ```

3. 前端代码会自动使用相对路径（如 `/api/audios`），Next.js 会自动代理到后端。

**优点：**
- 无论用户从哪里访问，都能正常工作
- 不需要在浏览器中暴露后端 API 地址
- 自动处理跨域问题

### 方案 2：直接访问后端 API

如果后端 API 需要直接从浏览器访问（例如支持 CORS），可以设置 `NEXT_PUBLIC_API_BASE_URL`。

**配置步骤：**

1. 创建 `.env.local` 文件（如果不存在）：
   ```bash
   # 如果用户通过公网访问，使用公网 IP 或域名
   NEXT_PUBLIC_API_BASE_URL=http://your-public-ip:8000
   
   # 如果用户通过内网访问，可以使用内网 IP
   # NEXT_PUBLIC_API_BASE_URL=http://10.224.155.176:8000
   ```

2. 重启 Next.js 开发服务器

**注意：**
- 使用此方案时，后端 API 必须配置 CORS，允许来自前端的请求
- 需要确保用户能够访问指定的 IP 地址

## 当前配置检查

启动服务器时，查看控制台输出：
```
[API Client] Initializing with baseURL: (relative path, using Next.js proxy)
[API Client] NEXT_PUBLIC_API_BASE_URL env: undefined
```

如果看到 `(relative path, using Next.js proxy)`，说明正在使用方案 1（代理模式）。

如果看到具体的 URL（如 `http://10.224.155.176:8000`），说明正在使用方案 2（直接访问模式）。

## 故障排查

1. **检查后端 API 是否运行：**
   ```bash
   curl http://localhost:8000/api/audios
   ```

2. **检查环境变量：**
   ```bash
   echo $API_BASE_URL
   echo $NEXT_PUBLIC_API_BASE_URL
   ```

3. **查看 Next.js 日志：**
   启动时会显示使用的 baseURL 配置

4. **检查网络连接：**
   确保服务器能够访问后端 API 地址（对于方案 1）

