"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Trash2, ChevronRight, Calendar, FileAudio } from "lucide-react"
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
const STATUS_CONFIG: Record<ProjectStatus, { label: string; color: string; dotColor: string }> = {
  pending: { label: "待开始", color: "bg-slate-400", dotColor: "bg-slate-400" },
  processing: { label: "处理中", color: "bg-blue-600", dotColor: "bg-blue-500" },
  completed: { label: "已完成", color: "bg-emerald-600", dotColor: "bg-emerald-500" },
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
  const uploadDate = formatDate(audio.uploaded_at)

  // 显示处理进度
  const getProgressInfo = () => {
    if (audio.has_report) {
      return "报告已生成"
    }
    if (audio.has_profile) {
      return "画像已提取"
    }
    if (audio.has_transcript) {
      return "转录已完成"
    }
    return "等待处理"
  }

  return (
    <Card
      className="p-6 cursor-pointer border border-border rounded-xl bg-gradient-to-br from-card to-card/50 shadow-sm hover:shadow-lg hover:border-primary/30 transition-all duration-300"
      onClick={onClick}
    >
      <div className="mb-5 flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-base font-semibold text-foreground mb-3 line-clamp-2 tracking-tight">
            {audio.name}
          </h3>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 opacity-60" />
              <span className="font-normal">{uploadDate}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <FileAudio className="w-3.5 h-3.5 opacity-60" />
              <span className="font-normal">{getProgressInfo()}</span>
            </div>
          </div>
        </div>
        {/* 状态徽章：展示当前项目进度 */}
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-2">
            <div className={`${statusConfig.dotColor} w-2 h-2 rounded-full ${status === 'processing' ? 'animate-pulse' : ''}`}></div>
            <span
              className={`${statusConfig.color} text-white px-3 py-1 rounded-md text-xs font-semibold whitespace-nowrap shadow-sm`}
            >
              {statusConfig.label}
            </span>
          </div>
        </div>
      </div>

      {/* 文件信息与处理状态 */}
      <div className="mb-5 pt-4 border-t border-border/40">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-muted-foreground">转录：</span>
            <span className={audio.has_transcript ? "text-green-600 font-medium" : "text-muted-foreground"}>
              {audio.has_transcript ? "✓" : "—"}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">画像：</span>
            <span className={audio.has_profile ? "text-green-600 font-medium" : "text-muted-foreground"}>
              {audio.has_profile ? "✓" : "—"}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">报告：</span>
            <span className={audio.has_report ? "text-green-600 font-medium" : "text-muted-foreground"}>
              {audio.has_report ? "✓" : "—"}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">PPT：</span>
            <span className={audio.has_ppt ? "text-green-600 font-medium" : "text-muted-foreground"}>
              {audio.has_ppt ? "✓" : "—"}
            </span>
          </div>
        </div>
      </div>

      {/* 操作按钮：删除或查看详情 */}
      <div className="flex gap-2 justify-end pt-2">
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
          className="text-destructive hover:text-destructive hover:bg-destructive/10 border-border/50"
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
          className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium shadow-sm"
        >
          查看 <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </Card>
  )
}
