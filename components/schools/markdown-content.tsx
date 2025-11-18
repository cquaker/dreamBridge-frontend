"use client"

import { useMemo } from "react"

interface MarkdownContentProps {
  content: string
  className?: string
}

export function MarkdownContent({ content, className = "" }: MarkdownContentProps) {
  const htmlContent = useMemo(() => {
    let html = content
    
    // 转换标题
    html = html.replace(/^### (.+)$/gm, '<h3 class="text-lg font-semibold mt-6 mb-3">$1</h3>')
    html = html.replace(/^## (.+)$/gm, '<h2 class="text-xl font-bold mt-8 mb-4">$1</h2>')
    html = html.replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold mt-8 mb-4">$1</h1>')
    
    // 转换粗体
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold">$1</strong>')
    
    // 转换列表项
    html = html.replace(/^-\s+(.+)$/gm, '<li class="ml-4 mb-1">$1</li>')
    html = html.replace(/^\*\s+(.+)$/gm, '<li class="ml-4 mb-1">$1</li>')
    
    // 包装列表
    html = html.replace(/(<li class="ml-4 mb-1">.+<\/li>\n?)+/g, (match) => {
      return `<ul class="list-disc ml-6 mb-4">${match}</ul>`
    })
    
    // 转换段落
    html = html.split('\n\n').map(para => {
      if (para.trim() && !para.match(/^<[hul]/) && !para.match(/<\/[hul]>$/)) {
        return `<p class="mb-4 leading-relaxed">${para.trim()}</p>`
      }
      return para
    }).join('\n\n')
    
    // 转换行内代码
    html = html.replace(/`(.+?)`/g, '<code class="bg-muted px-1 py-0.5 rounded text-sm">$1</code>')
    
    // 转换代码块
    html = html.replace(/```[\s\S]*?```/g, (match) => {
      const code = match.replace(/```\w*\n?/g, '').replace(/```/g, '')
      return `<pre class="bg-muted p-4 rounded-lg overflow-x-auto mb-4"><code>${code}</code></pre>`
    })
    
    return html
  }, [content])
  
  return (
    <div 
      className={`prose prose-slate max-w-none ${className}`}
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  )
}

