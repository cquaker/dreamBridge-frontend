"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Trash2, ChevronRight, Calendar, Clock } from "lucide-react"

interface Project {
  id: string
  name: string
  audioFile: string
  audioSize: string
  audioDuration: string
  status: "pending" | "running" | "completed"
  createdAt: string
}

interface ProjectCardProps {
  project: Project
  onClick: () => void
  onDelete: () => void
}

// 各状态对应的文案与颜色配置，便于统一样式
const STATUS_CONFIG = {
  pending: { label: "待开始", color: "bg-slate-400", dotColor: "bg-slate-400" },
  running: { label: "运行中", color: "bg-blue-600", dotColor: "bg-blue-500" },
  completed: { label: "已完成", color: "bg-emerald-600", dotColor: "bg-emerald-500" },
}

export function ProjectCard({ project, onClick, onDelete }: ProjectCardProps) {
  const statusConfig = STATUS_CONFIG[project.status]

  return (
    <Card
      className="p-6 cursor-pointer border border-border rounded-xl bg-gradient-to-br from-card to-card/50 shadow-sm hover:shadow-lg hover:border-primary/30 transition-all duration-300"
      onClick={onClick}
    >
      <div className="mb-5 flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-base font-semibold text-foreground mb-3 line-clamp-2 tracking-tight">{project.name}</h3>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 opacity-60" />
              <span className="font-normal">{project.createdAt}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 opacity-60" />
              <span className="font-normal">{project.audioDuration}</span>
            </div>
          </div>
        </div>
        {/* 状态徽章：展示当前项目进度 */}
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-2">
            <div className={`${statusConfig.dotColor} w-2 h-2 rounded-full animate-pulse`}></div>
            <span
              className={`${statusConfig.color} text-white px-3 py-1 rounded-md text-xs font-semibold whitespace-nowrap shadow-sm`}
            >
              {statusConfig.label}
            </span>
          </div>
        </div>
      </div>

      {/* 文件信息：音频文件名与体积 */}
      <div className="mb-5 pt-4 border-t border-border/40">
        <p className="text-xs text-muted-foreground font-normal">{project.audioFile}</p>
        <p className="text-xs text-muted-foreground mt-1.5 font-normal">{project.audioSize}</p>
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
          onClick={(e) => e.stopPropagation()}
          className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium shadow-sm"
        >
          查看 <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </Card>
  )
}
