"use client"

import { useParams } from "next/navigation"
import { ThemeProvider } from "@/components/theme-provider"
import { WorkflowPage } from "@/components/pages/workflow"

export default function ProjectPage() {
  const params = useParams()
  // 动态路由参数 id 用来向工作流页面透传项目上下文
  const projectId = params.id as string

  return (
    <ThemeProvider>
      {/* WorkflowPage 会根据 projectId 拉取对应 mock 数据 */}
      <WorkflowPage projectId={projectId} />
    </ThemeProvider>
  )
}
