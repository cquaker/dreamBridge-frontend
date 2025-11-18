"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Trash2, ChevronRight, Calendar, CheckCircle2, Clock, PlayCircle } from "lucide-react"
import type { AudioItem } from "@/lib/types/dreambridge-api-types"

interface ProjectCardProps {
  audio: AudioItem
  onClick: () => void
  onDelete: () => void
}

// 根据音频处理状态计算项目状态
type ProjectStatus = "pending" | "processing" | "completed"

function getProjectStatus(audio: AudioItem): ProjectStatus {
  // 如果已有报告，说明处理完成
  if (audio.has_report) {
    return "completed"
  }
  // 如果有转录或画像，说明正在处理
  if (audio.has_transcript || audio.has_profile) {
    return "processing"
  }
  // 否则是待开始
  return "pending"
}

// 各状态对应的文案与颜色配置，便于统一样式
const STATUS_CONFIG: Record<ProjectStatus, { 
  label: string
  variant: "default" | "secondary" | "destructive" | "outline"
  icon: typeof CheckCircle2
  className: string
}> = {
  pending: { 
    label: "待开始", 
    variant: "secondary",
    icon: Clock,
    className: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
  },
  processing: { 
    label: "处理中", 
    variant: "default",
    icon: PlayCircle,
    className: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800"
  },
  completed: { 
    label: "已完成", 
    variant: "default",
    icon: CheckCircle2,
    className: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800"
  },
}

// 格式化日期时间
function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('zh-CN', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit' 
    })
  } catch {
    return dateString
  }
}

export function ProjectCard({ audio, onClick, onDelete }: ProjectCardProps) {
  const status = getProjectStatus(audio)
  const statusConfig = STATUS_CONFIG[status]
  const StatusIcon = statusConfig.icon
  const uploadDate = formatDate(audio.uploaded_at)

  return (
    <Card
      className="group relative overflow-hidden cursor-pointer border border-border rounded-xl bg-card shadow-sm hover:shadow-lg hover:border-primary/30 transition-all duration-300 h-full w-full flex flex-col"
      onClick={onClick}
    >
      <div className="p-6 flex flex-col flex-1">
        {/* 头部：标题和状态 */}
        <div className="mb-4 flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0 pr-2">
            <h3 className="text-base font-semibold text-foreground mb-3 leading-relaxed group-hover:text-primary transition-colors break-words min-h-[3rem] line-clamp-2">
              {audio.name}
            </h3>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{uploadDate}</span>
              </div>
            </div>
          </div>
          
          {/* 状态徽章 */}
          <Badge 
            variant="outline"
            className={`${statusConfig.className} border px-3 py-1.5 flex items-center gap-1.5 whitespace-nowrap text-xs font-medium flex-shrink-0`}
          >
            <StatusIcon className={`w-3.5 h-3.5 ${status === 'processing' ? 'animate-pulse' : ''}`} />
            {statusConfig.label}
          </Badge>
        </div>

        {/* 处理步骤状态 - 简化版 */}
        <div className="mb-4 flex flex-wrap gap-2 flex-shrink-0">
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs ${
            audio.has_transcript 
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300' 
              : 'bg-muted/50 text-muted-foreground'
          }`}>
            {audio.has_transcript ? (
              <CheckCircle2 className="w-3 h-3" />
            ) : (
              <div className="w-3 h-3 rounded-full border border-muted-foreground/30" />
            )}
            <span>转录</span>
          </div>
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs ${
            audio.has_profile 
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300' 
              : 'bg-muted/50 text-muted-foreground'
          }`}>
            {audio.has_profile ? (
              <CheckCircle2 className="w-3 h-3" />
            ) : (
              <div className="w-3 h-3 rounded-full border border-muted-foreground/30" />
            )}
            <span>画像</span>
          </div>
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs ${
            audio.has_report 
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300' 
              : 'bg-muted/50 text-muted-foreground'
          }`}>
            {audio.has_report ? (
              <CheckCircle2 className="w-3 h-3" />
            ) : (
              <div className="w-3 h-3 rounded-full border border-muted-foreground/30" />
            )}
            <span>报告</span>
          </div>
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs ${
            audio.has_ppt 
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300' 
              : 'bg-muted/50 text-muted-foreground'
          }`}>
            {audio.has_ppt ? (
              <CheckCircle2 className="w-3 h-3" />
            ) : (
              <div className="w-3 h-3 rounded-full border border-muted-foreground/30" />
            )}
            <span>PPT</span>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex gap-2 pt-4 mt-auto border-t border-border/50 flex-shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              onDelete()
            }}
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              onClick()
            }}
            className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium shadow-sm"
          >
            查看详情
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </Card>
  )
}
