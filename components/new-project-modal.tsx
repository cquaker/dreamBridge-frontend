"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Upload } from "lucide-react"

interface NewProjectModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreateProject: (data: { name: string; audioFile: File }) => void
}

export function NewProjectModal({ open, onOpenChange, onCreateProject }: NewProjectModalProps) {
  const [projectName, setProjectName] = useState("")
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 监听文件选择与拖拽，限制为单个音频文件
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setAudioFile(file)
    }
  }

  // 模拟上传耗时，请求完成后通过回调创建项目
  const handleCreateProject = async () => {
    if (!projectName.trim() || !audioFile) return

    setLoading(true)
    // 简单的延时方法，未来可替换为真实 API 调用
    await new Promise((resolve) => setTimeout(resolve, 1000))
    onCreateProject({
      name: projectName,
      audioFile: audioFile,
    })
    setProjectName("")
    setAudioFile(null)
    setLoading(false)
  }

  const isValid = projectName.trim().length > 0 && audioFile !== null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle id="project-modal-title">新建项目</DialogTitle>
        </DialogHeader>

        <div className="space-y-6" id="project-modal-description">
          {/* 项目名称输入 */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">项目名称</label>
            <Input
              placeholder="输入项目名称，如：李明 - 美国留学计划"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="h-10"
            />
            {projectName && projectName.length < 1 && <p className="text-xs text-destructive mt-1">项目名称不能为空</p>}
          </div>

          {/* 音频文件上传区域 */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">上传音频文件</label>
            <div
              className="border border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-blue-500/50 hover:bg-muted/50 transition-all duration-200"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault()
                e.currentTarget.classList.add("border-blue-500/50", "bg-muted/50")
              }}
              onDragLeave={(e) => {
                e.currentTarget.classList.remove("border-blue-500/50", "bg-muted/50")
              }}
              onDrop={(e) => {
                e.preventDefault()
                const file = e.dataTransfer.files[0]
                if (file && file.type.startsWith("audio/")) {
                  setAudioFile(file)
                }
              }}
            >
              <Upload className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">点击选择或拖拽音频文件</p>
              <p className="text-xs text-muted-foreground mt-1">支持格式：MP3, WAV, M4A | 最大 50MB</p>
              <input ref={fileInputRef} type="file" accept="audio/*" onChange={handleFileChange} className="hidden" />
            </div>

            {audioFile && (
              <div className="mt-3 p-3 bg-muted rounded-lg flex items-center justify-between border border-border/50">
                <span className="text-sm text-foreground">
                  <svg className="w-4 h-4 inline mr-2 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {audioFile.name} ({(audioFile.size / 1024 / 1024).toFixed(1)} MB)
                </span>
                <button
                  onClick={() => setAudioFile(null)}
                  className="text-xs text-destructive hover:text-destructive/80 transition-colors"
                >
                  移除
                </button>
              </div>
            )}
          </div>

          {/* 操作按钮：取消/创建 */}
          <div className="flex gap-2 justify-end pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              取消
            </Button>
            <Button
              onClick={handleCreateProject}
              disabled={!isValid || loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? "创建中..." : "创建项目"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
