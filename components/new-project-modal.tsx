"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Upload } from "lucide-react"
import { apiClient } from "@/lib/api/client"
import { useToast } from "@/hooks/use-toast"
import type { AudioItem } from "@/lib/types/dreambridge-api-types"

interface NewProjectModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreateProject: (audio: AudioItem) => void
}

export function NewProjectModal({ open, onOpenChange, onCreateProject }: NewProjectModalProps) {
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<string>("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  // 验证音频文件的辅助函数
  const validateAudioFile = (file: File): boolean => {
    // 验证文件格式
    const validFormats = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/m4a', 'audio/mp4']
    if (!validFormats.includes(file.type) && !file.name.match(/\.(mp3|wav|m4a|mp4)$/i)) {
      toast({
        title: "文件格式不支持",
        description: "请上传 MP3、WAV、M4A 或 MP4 格式的音频文件",
        variant: "destructive",
      })
      return false
    }
    
    // 验证文件大小（最大 200MB）
    if (file.size > 200 * 1024 * 1024) {
      toast({
        title: "文件过大",
        description: "音频文件不能超过 200MB",
        variant: "destructive",
      })
      return false
    }
    
    return true
  }

  // 监听文件选择与拖拽，限制为单个音频文件
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && validateAudioFile(file)) {
      setAudioFile(file)
    }
  }

  // 上传音频到后端并创建项目
  const handleCreateProject = async () => {
    if (!audioFile) return

    setLoading(true)
    setUploadProgress("正在上传音频文件...")

    try {
      // 上传音频文件
      const response = await apiClient.uploadAudio(audioFile)

      if (!response.success || !response.data) {
        throw new Error(response.error?.message || "上传失败")
      }

      setUploadProgress("上传成功！")
      
      toast({
        title: "创建成功",
        description: `项目 "${audioFile.name}" 已创建`,
      })

      // 通知父组件项目已创建
      onCreateProject(response.data)

      // 重置表单
      setAudioFile(null)
      setUploadProgress("")
      onOpenChange(false)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "上传失败，请检查网络连接"
      
      toast({
        title: "创建失败",
        description: errorMessage,
        variant: "destructive",
      })
      
      setUploadProgress("")
    } finally {
      setLoading(false)
    }
  }

  const isValid = audioFile !== null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>新建项目</DialogTitle>
          <DialogDescription>
            上传音频文件开始创建新的学习方案分析项目
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
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
                if (file && validateAudioFile(file)) {
                  setAudioFile(file)
                }
              }}
            >
              <Upload className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">点击选择或拖拽音频文件</p>
              <p className="text-xs text-muted-foreground mt-1">支持格式：MP3, WAV, M4A | 最大 200MB</p>
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

          {/* 上传进度提示 */}
          {uploadProgress && (
            <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-900 dark:text-blue-100">{uploadProgress}</p>
            </div>
          )}

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
              {loading ? "上传中..." : "创建项目"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
