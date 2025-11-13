"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useTheme } from "@/components/theme-provider"
import { ProjectCard } from "@/components/project-card"
import { NewProjectModal } from "@/components/new-project-modal"
import { Moon, Sun, Plus } from "lucide-react"

// 模拟项目列表，用来驱动页面展示与交互
const MOCK_PROJECTS = [
  {
    id: "1",
    name: "李明 - 美国留学计划",
    audioFile: "interview_liming.mp3",
    audioSize: "5.2 MB",
    audioDuration: "5:23",
    status: "completed" as const,
    createdAt: "2025-11-10",
  },
  {
    id: "2",
    name: "王丽 - 英国申请方案",
    audioFile: "interview_wangli.mp3",
    audioSize: "4.8 MB",
    audioDuration: "4:45",
    status: "running" as const,
    createdAt: "2025-11-12",
  },
  {
    id: "3",
    name: "张浩 - 硕士申请规划",
    audioFile: "interview_zhanghao.mp3",
    audioSize: "6.1 MB",
    audioDuration: "6:12",
    status: "pending" as const,
    createdAt: "2025-11-11",
  },
]

export function Home() {
  const router = useRouter()
  const { isDark, toggleTheme } = useTheme()
  const [projects, setProjects] = useState(MOCK_PROJECTS)
  const [showNewProjectModal, setShowNewProjectModal] = useState(false)

  const handleCreateProject = (projectData: any) => {
    const newProject = {
      id: String(projects.length + 1),
      name: projectData.name,
      audioFile: projectData.audioFile.name,
      audioSize: (projectData.audioFile.size / 1024 / 1024).toFixed(1) + " MB",
      audioDuration: "0:00",
      status: "pending" as const,
      createdAt: new Date().toISOString().split("T")[0],
    }
    setProjects([newProject, ...projects])
    setShowNewProjectModal(false)
    // 创建后立即跳转至对应的工作流路由，方便继续执行智能流程
    router.push(`/project/${newProject.id}`)
  }

  const handleDeleteProject = (id: string) => {
    setProjects(projects.filter((p) => p.id !== id))
  }

  const handleProjectClick = (id: string) => {
    router.push(`/project/${id}`)
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
            <div className="flex items-center gap-4">
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
            <p className="text-sm text-muted-foreground mt-2 font-normal">{projects.length} 个项目</p>
          </div>
          <Button
            onClick={() => setShowNewProjectModal(true)}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium shadow-lg"
          >
            <Plus className="w-4 h-4 mr-2" />
            新建项目
          </Button>
        </div>

        {/* 项目网格：根据列表状态切换空态或卡片 */}
        {projects.length === 0 ? (
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
            {projects.map((project, index) => (
              <div
                key={project.id}
                style={{
                  animation: `fadeInUp 0.5s ease-out ${index * 0.1}s both`,
                }}
              >
                <ProjectCard
                  project={project}
                  onClick={() => handleProjectClick(project.id)}
                  onDelete={() => handleDeleteProject(project.id)}
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
