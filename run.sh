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
  
  # 检查是否需要重新构建
  NEED_BUILD=false
  
  # 检查是否已构建
  if [ ! -d ".next" ] || [ ! -f ".next/BUILD_ID" ]; then
    echo "📦 检测到未构建，需要构建生产版本"
    NEED_BUILD=true
  else
    # 检查代码是否有更新
    # 方法1: 检查 .next/BUILD_ID 中记录的构建时的 git commit
    BUILD_COMMIT_FILE=".next/BUILD_COMMIT"
    CURRENT_COMMIT=$(git rev-parse HEAD 2>/dev/null)
    
    if [ -f "$BUILD_COMMIT_FILE" ]; then
      BUILD_COMMIT=$(cat "$BUILD_COMMIT_FILE" 2>/dev/null)
      if [ "$CURRENT_COMMIT" != "$BUILD_COMMIT" ]; then
        echo "📦 检测到代码有更新（git commit 已变更），需要重新构建"
        NEED_BUILD=true
      else
        echo "✅ 检测到已构建的版本，代码无更新，跳过构建步骤"
      fi
    else
      # 如果没有 BUILD_COMMIT 文件，使用文件修改时间比较（向后兼容）
      BUILD_TIME=$(find .next -type f -name "BUILD_ID" -exec stat -c %Y {} \; 2>/dev/null | head -1)
      SOURCE_TIME=$(find . \
        -type f \
        \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" -o -name "*.json" -o -name "*.css" \) \
        ! -path "./node_modules/*" \
        ! -path "./.next/*" \
        ! -path "./.git/*" \
        -exec stat -c %Y {} \; 2>/dev/null | sort -n | tail -1)
      
      if [ -z "$BUILD_TIME" ] || [ -z "$SOURCE_TIME" ] || [ "$SOURCE_TIME" -gt "$BUILD_TIME" ]; then
        echo "📦 检测到代码有更新，需要重新构建"
        NEED_BUILD=true
      else
        echo "✅ 检测到已构建的版本，代码无更新，跳过构建步骤"
      fi
    fi
  fi
  
  # 如果需要构建，则执行构建
  if [ "$NEED_BUILD" = true ]; then
    echo "📦 开始构建生产版本..."
    pnpm build
    if [ $? -ne 0 ]; then
      echo "❌ 构建失败，请检查错误信息"
      exit 1
    fi
    # 保存构建时的 git commit，用于下次检测
    CURRENT_COMMIT=$(git rev-parse HEAD 2>/dev/null)
    if [ -n "$CURRENT_COMMIT" ]; then
      echo "$CURRENT_COMMIT" > .next/BUILD_COMMIT
    fi
    echo "✅ 构建完成"
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
