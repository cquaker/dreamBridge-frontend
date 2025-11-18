"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useTheme } from "@/components/theme-provider"
import { ProjectCard } from "@/components/project-card"
import { NewProjectModal } from "@/components/new-project-modal"
import { Moon, Sun, Plus, RefreshCw } from "lucide-react"
import { apiClient } from "@/lib/api/client"
import { useToast } from "@/hooks/use-toast"
import type { AudioItem } from "@/lib/types/dreambridge-api-types"

export function Home() {
  const router = useRouter()
  const { isDark, toggleTheme } = useTheme()
  const { toast } = useToast()
  const [audios, setAudios] = useState<AudioItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [showNewProjectModal, setShowNewProjectModal] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [audioToDelete, setAudioToDelete] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  // 从后端获取项目列表
  const fetchProjects = async (showLoading = true) => {
    if (showLoading) {
      setLoading(true)
    } else {
      setRefreshing(true)
    }

    try {
      console.log('[Home] Fetching projects...');
      const response = await apiClient.listAudios()
      
      console.log('[Home] API response:', response);

      if (!response.success || !response.data) {
        console.error('[Home] API request failed:', response.error);
        throw new Error(response.error?.message || "获取项目列表失败")
      }

      console.log('[Home] Projects loaded:', response.data.items.length);
      setAudios(response.data.items)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "加载失败，请检查网络连接"
      
      toast({
        title: "加载失败",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  // 页面加载时获取项目列表
  useEffect(() => {
    fetchProjects()
  }, [])

  // 创建项目（上传音频）
  const handleCreateProject = (audio: AudioItem) => {
    // 添加到列表顶部
    setAudios([audio, ...audios])
    setShowNewProjectModal(false)
    
    // 创建后立即跳转至工作流页面
    router.push(`/project/${encodeURIComponent(audio.name)}`)
  }

  // 打开删除确认对话框
  const handleDeleteProject = (audioName: string) => {
    setAudioToDelete(audioName)
    setDeleteDialogOpen(true)
  }

  // 确认删除项目
  const confirmDeleteProject = async () => {
    if (!audioToDelete) return

    setDeleting(true)
    try {
      console.log('[Home] Deleting audio:', audioToDelete)
      const response = await apiClient.deleteAudio(audioToDelete)

      if (!response.success || !response.data) {
        console.error('[Home] Delete failed:', response.error)
        throw new Error(response.error?.message || "删除失败")
      }

      const deleteResult = response.data
      console.log('[Home] Delete success:', deleteResult)

      // 从列表中移除已删除的项目（立即更新 UI）
      setAudios(prevAudios => prevAudios.filter(audio => audio.name !== audioToDelete))

      // 显示成功提示
      const deletedCount = deleteResult.deleted_files.length
      const failedCount = deleteResult.failed_files.length
      let description = `已删除 ${deletedCount} 个文件`
      if (deleteResult.srt_kept && deleteResult.srt_path) {
        description += `，已保留字幕文件：${deleteResult.srt_path}`
      }
      if (failedCount > 0) {
        description += `，${failedCount} 个文件删除失败`
      }

      toast({
        title: "删除成功",
        description: description,
      })

      // 关闭对话框
      setDeleteDialogOpen(false)
      setAudioToDelete(null)

      // 刷新列表以确保与后端同步（防止后端仍返回已删除的项目）
      // 使用不显示加载状态的方式刷新，避免影响用户体验
      await fetchProjects(false)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "删除失败，请检查网络连接"
      console.error('[Home] Delete error:', error)
      
      toast({
        title: "删除失败",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setDeleting(false)
    }
  }

  // 点击项目卡片
  const handleProjectClick = (audioName: string) => {
    router.push(`/project/${encodeURIComponent(audioName)}`)
  }

  // 刷新列表
  const handleRefresh = () => {
    fetchProjects(false)
  }

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      <nav className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-md">
                AI
              </div>
              <h1 className="text-lg font-semibold text-foreground tracking-tight">学习方案工作流 Agent</h1>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="p-2 rounded-lg hover:bg-muted/50 transition-colors disabled:opacity-50"
                aria-label="刷新列表"
                title="刷新列表"
              >
                <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg hover:bg-muted/50 transition-colors"
                aria-label="Toggle theme"
              >
                {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* 主内容区：展示摘要与创建按钮 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-between items-center mb-10">
          <div>
            <h2 className="text-3xl font-bold text-foreground tracking-tight">项目管理</h2>
            <p className="text-sm text-muted-foreground mt-2 font-normal">
              {loading ? "加载中..." : `${audios.length} 个项目`}
            </p>
          </div>
          <Button
            onClick={() => setShowNewProjectModal(true)}
            disabled={loading}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium shadow-lg"
          >
            <Plus className="w-4 h-4 mr-2" />
            新建项目
          </Button>
        </div>

        {/* 加载状态 */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            <p className="text-sm text-muted-foreground mt-4">加载项目列表...</p>
          </div>
        ) : audios.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center mb-4 shadow-sm">
              <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <p className="text-base text-muted-foreground mb-6 font-normal">暂无项目，点击下方按钮开始创建</p>
            <Button
              onClick={() => setShowNewProjectModal(true)}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium shadow-lg"
            >
              <Plus className="w-4 h-4 mr-2" />
              新建项目
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {audios.map((audio, index) => (
              <div
                key={audio.name}
                style={{
                  animation: `fadeInUp 0.5s ease-out ${index * 0.1}s both`,
                }}
              >
                <ProjectCard
                  audio={audio}
                  onClick={() => handleProjectClick(audio.name)}
                  onDelete={() => handleDeleteProject(audio.name)}
                />
              </div>
            ))}
          </div>
        )}
      </main>

      {/* 新建项目弹窗：复用表单逻辑 */}
      <NewProjectModal
        open={showNewProjectModal}
        onOpenChange={setShowNewProjectModal}
        onCreateProject={handleCreateProject}
      />

      {/* 删除确认对话框 */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除项目</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除项目 <strong>{audioToDelete}</strong> 吗？
              <br />
              此操作将删除音频文件及其相关文件（转录、画像、报告、PPT 等文件）。
              <br />
              <span className="text-destructive font-medium">此操作不可撤销。</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteProject}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "删除中..." : "确认删除"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}
