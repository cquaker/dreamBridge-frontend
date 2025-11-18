#!/bin/bash

# 确保设置了 API_BASE_URL 环境变量
export API_BASE_URL=http://8.130.116.143:8809
export NEXT_PUBLIC_API_BASE_URL=http://8.130.116.143:8809

# 检查第一个参数，默认为 dev（开发环境）
MODE=${1:-dev}

# 显示环境信息
echo "=========================================="
if [ "$MODE" = "prod" ] || [ "$MODE" = "production" ]; then
  echo "🚀 生产环境 (PRODUCTION MODE)"
  echo "=========================================="
  # 检查是否已构建，如果没有则先构建
  if [ ! -d ".next" ] || [ ! -f ".next/BUILD_ID" ]; then
    echo "📦 检测到未构建，开始构建生产版本..."
    pnpm build
    if [ $? -ne 0 ]; then
      echo "❌ 构建失败，请检查错误信息"
      exit 1
    fi
    echo "✅ 构建完成"
  else
    echo "✅ 检测到已构建的版本，跳过构建步骤"
  fi
  # 启动生产服务器
  echo "=========================================="
  echo "🚀 启动生产服务器 (端口: 8808)..."
  echo "   模式: PRODUCTION"
  echo "   命令: pnpm start"
  echo "=========================================="
  PORT=8808 pnpm start
else
  # 开发环境（默认）
  echo "🔧 开发环境 (DEVELOPMENT MODE)"
  echo "=========================================="
  echo "🔧 启动开发服务器 (端口: 8808)..."
  echo "   模式: DEVELOPMENT"
  echo "   命令: pnpm dev"
  echo "=========================================="
  PORT=8808 pnpm dev
fi
