"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { useTheme } from "@/components/theme-provider"
import { WorkflowStep } from "@/components/workflow-step"
import { StudentProfileForm } from "@/components/student-profile-form"
import { ArrowLeft, Moon, Sun, Music, CheckCircle2, Loader2 } from "lucide-react"
import { apiClient } from "@/lib/api/client"
import { useToast } from "@/hooks/use-toast"
import type { AudioItem, StudentProfile } from "@/lib/types/dreambridge-api-types"

/**
 * 工作流步骤状态接口
 */
interface StepState {
  id: string
  name: string
  status: "waiting" | "running" | "completed" | "paused" | "error"
  logs: string[]
  result: string
  isExpanded: boolean
  showResult: boolean
  errorMessage?: string
}

/**
 * 工作流页面组件
 * 
 * 功能：
 * 1. 从 API 加载音频信息
 * 2. 顺序执行 6 个工作流步骤
 * 3. 支持流式显示日志和结果
 * 4. 在步骤 3 暂停，等待用户确认学生画像
 * 5. 显示所有生成的文件下载链接
 */
export function WorkflowPage({ projectId }: { projectId: string }) {
  const router = useRouter()
  const { isDark, toggleTheme } = useTheme()
  const { toast } = useToast()
  
  // 解码 URL 中的文件名
  const audioName = decodeURIComponent(projectId)
  
  // 音频信息状态
  const [audio, setAudio] = useState<AudioItem | null>(null)
  const [loading, setLoading] = useState(true)
  
  // 工作流步骤状态
  const [steps, setSteps] = useState<StepState[]>([])
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null)
  const [isWorkflowRunning, setIsWorkflowRunning] = useState(false)
  
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  
  // 防重复执行：跟踪正在执行的步骤
  const executingStepsRef = useRef<Set<number>>(new Set())

  // 定义工作流的 6 个步骤
  const stepDefinitions = [
    { id: "transcribe", name: "转录音频", description: "提取音频字幕和转录文本" },
    { id: "extract", name: "提取学生画像", description: "分析关键信息点" },
    { id: "parse", name: "解析学生画像", description: "转换为结构化数据" },
    { id: "recommend", name: "撰写学习方案", description: "生成个性化学习方案 JSON" },
    { id: "report", name: "撰写学习报告", description: "生成详细的学习报告" },
    { id: "ppt", name: "撰写 PPT 文稿", description: "生成演示文稿内容" },
  ]

  /**
   * 初始化：加载音频信息并设置步骤状态
   */
  useEffect(() => {
    loadAudioInfo()
  }, [])

  /**
   * 从 API 加载音频信息
   * @param skipInitSteps 是否跳过步骤初始化（用于刷新时保持当前步骤状态）
   */
  const loadAudioInfo = async (skipInitSteps = false) => {
    try {
      if (!skipInitSteps) {
        setLoading(true)
      }
      
      const response = await apiClient.listAudios()
      
      if (!response.success || !response.data) {
        throw new Error(response.error?.message || "获取音频列表失败")
      }

      // 查找当前音频
      const foundAudio = response.data.items.find((item: AudioItem) => item.name === audioName)
      
      if (!foundAudio) {
        toast({
          title: "音频未找到",
          description: `找不到音频文件: ${audioName}`,
          variant: "destructive",
        })
        router.push("/")
        return
      }

      setAudio(foundAudio)
      
      // 只在初始加载时初始化步骤
      if (!skipInitSteps) {
        initializeSteps(foundAudio)
      }
      
    } catch (error) {
      toast({
        title: "加载失败",
        description: error instanceof Error ? error.message : "未知错误",
        variant: "destructive",
      })
    } finally {
      if (!skipInitSteps) {
        setLoading(false)
      }
    }
  }

  /**
   * 初始化步骤状态，根据已完成的标志跳过已完成的步骤
   */
  const initializeSteps = (audioItem: AudioItem) => {
    const initialSteps: StepState[] = stepDefinitions.map((def) => {
      // 根据 audio 的标志判断步骤是否已完成
      let status: StepState["status"] = "waiting"
      
      if (def.id === "transcribe" && audioItem.has_transcript) {
        status = "completed"
      } else if (def.id === "extract" && audioItem.has_profile) {
        status = "completed"
      } else if (def.id === "parse" && audioItem.has_profile) {
        status = "completed"
      } else if (def.id === "recommend" && audioItem.has_report) {
        status = "completed"
      } else if (def.id === "report" && audioItem.has_report) {
        status = "completed"
      } else if (def.id === "ppt" && audioItem.has_ppt) {
        status = "completed"
      }

      return {
        id: def.id,
        name: def.name,
        status,
        logs: [],
        result: "",
        isExpanded: false,
        showResult: false,
      }
    })

    setSteps(initialSteps)

    // 找到第一个未完成的步骤并开始执行
    const firstPendingIndex = initialSteps.findIndex((s) => s.status === "waiting")
    
    if (firstPendingIndex !== -1) {
      setTimeout(() => {
        setCurrentStepIndex(firstPendingIndex)
        startStep(firstPendingIndex, initialSteps)
      }, 800)
    }
  }

  // 监听 steps 变化，将滚动容器滑动到底部，方便查看最新日志
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight
    }
  }, [steps])

  /**
   * 辅助函数：更新步骤状态
   */
  const updateStep = (index: number, updates: Partial<StepState>) => {
    setSteps((prevSteps) => {
      const newSteps = [...prevSteps]
      newSteps[index] = { ...newSteps[index], ...updates }
      return newSteps
    })
  }

  /**
   * 辅助函数：添加日志
   */
  const addLog = (index: number, log: string) => {
    setSteps((prevSteps) => {
      const newSteps = [...prevSteps]
      newSteps[index].logs.push(log)
      return newSteps
    })
  }

  /**
   * 辅助函数：追加结果内容
   */
  const appendResult = (index: number, content: string) => {
    setSteps((prevSteps) => {
      const newSteps = [...prevSteps]
      newSteps[index].result += content
      return newSteps
    })
  }

  /**
   * 启动指定步骤
   */
  const startStep = (index: number, currentSteps: StepState[]) => {
    const newSteps = [...currentSteps]
    newSteps[index].status = "running"
    newSteps[index].isExpanded = true
    setSteps(newSteps)
    setIsWorkflowRunning(true)
    executeStep(index, newSteps)
  }

  /**
   * 执行指定步骤
   */
  const executeStep = async (index: number, currentSteps?: StepState[]) => {
    // 防重复执行检查
    if (executingStepsRef.current.has(index)) {
      console.log(`[executeStep] 步骤 ${index} 已在执行中，跳过`)
      return
    }
    
    // 使用传入的 steps 或当前的 state
    const stepsToUse = currentSteps || steps
    const step = stepsToUse[index]
    
    if (!step) {
      console.error(`步骤 ${index} 未找到`)
      return
    }
    
    // 标记为执行中
    executingStepsRef.current.add(index)
    console.log(`[executeStep] 开始执行步骤 ${index}: ${step.name}`)
    
    try {
      switch (step.id) {
        case "transcribe":
          await executeTranscribe(index, stepsToUse)
          break
        case "extract":
          await executeExtract(index, stepsToUse)
          break
        case "parse":
          await executeParse(index, stepsToUse)
          break
        case "recommend":
          await executeRecommend(index, stepsToUse)
          break
        case "report":
          await executeReport(index, stepsToUse)
          break
        case "ppt":
          await executePPT(index, stepsToUse)
          break
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "未知错误"
      updateStep(index, {
        status: "error",
        errorMessage,
      })
      addLog(index, `❌ 错误: ${errorMessage}`)
      setIsWorkflowRunning(false)
      
      toast({
        title: "步骤执行失败",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      // 执行完成，从集合中移除
      executingStepsRef.current.delete(index)
      console.log(`[executeStep] 步骤 ${index} 执行完成`)
    }
  }

  /**
   * 步骤 1: 音频转录
   */
  const executeTranscribe = async (index: number, currentSteps?: StepState[]) => {
    addLog(index, "开始转录音频...")
    
    try {
      await apiClient.streamTranscription(audioName, (event) => {
        switch (event.event) {
          case "start":
            addLog(index, `音频时长: ${(event.total_duration_ms / 1000).toFixed(1)}秒`)
            break
          case "sentence":
            addLog(index, `[${event.begin_time.toFixed(1)}s] ${event.text}`)
            appendResult(index, event.srt_entry + "\n")
            break
          case "complete":
            addLog(index, "✅ 转录完成")
            updateStep(index, { status: "completed", showResult: true })
            // 自动进入下一步
            setTimeout(() => proceedToNextStep(index), 1000)
            break
        }
      })
    } catch (error) {
      throw new Error(`转录失败: ${error instanceof Error ? error.message : "未知错误"}`)
    }
  }

  /**
   * 步骤 2: 提取学生画像
   */
  const executeExtract = async (index: number, currentSteps?: StepState[]) => {
    const subtitleName = audioName.replace(/\.(wav|mp3|m4a|mp4)$/i, ".srt")
    addLog(index, `分析字幕文件: ${subtitleName}`)
    
    try {
      await apiClient.streamExtraction(subtitleName, (event) => {
        switch (event.event) {
          case "started":
            addLog(index, "开始提取学生画像...")
            break
          case "log":
            addLog(index, event.message)
            break
          case "chunk":
            appendResult(index, event.content)
            break
          case "completed":
            addLog(index, "✅ 画像提取完成")
            updateStep(index, { status: "completed", showResult: true })
            // 自动进入下一步
            setTimeout(() => proceedToNextStep(index), 1000)
            break
        }
      })
    } catch (error) {
      throw new Error(`提取画像失败: ${error instanceof Error ? error.message : "未知错误"}`)
    }
  }

  /**
   * 步骤 3: 获取学生画像（需要用户确认）
   */
  const executeParse = async (index: number, currentSteps?: StepState[]) => {
    // 根据音频文件名生成画像文件名
    // 例如：test.wav -> test-student_profile.json
    const profileName = audioName.replace(/\.(wav|mp3|m4a|mp4)$/i, "-student_profile.json")
    addLog(index, `从接口获取学生画像: ${profileName}`)
    
    try {
      addLog(index, `调用 GET /api/profiles/${profileName}...`)
      
      // 从 API 接口获取画像 JSON
      const response = await apiClient.getProfile(profileName)
      
      if (!response.success || !response.data) {
        throw new Error(response.error?.message || "获取画像失败")
      }

      const profile = response.data
      
      addLog(index, "✅ 画像获取成功")
      addLog(index, "等待用户确认...")
      
      // 暂停工作流，显示表单
      updateStep(index, {
        status: "paused",
        result: JSON.stringify(profile, null, 2),
        showResult: true,
      })
      setStudentProfile(profile)
      setIsWorkflowRunning(false)
      
    } catch (error) {
      throw new Error(
        `获取画像失败: ${error instanceof Error ? error.message : "未知错误"}`
      )
    }
  }

  /**
   * 步骤 4: 撰写学习方案（输出 JSON）
   */
  const executeRecommend = async (index: number, currentSteps?: StepState[]) => {
    const profileName = audioName.replace(/\.(wav|mp3|m4a|mp4)$/i, "-student_profile.json")
    addLog(index, `撰写学习方案: ${profileName}`)
    
    try {
      addLog(index, "正在生成学习方案 JSON...")
      
      // 使用同步 API 生成推荐方案
      const response = await apiClient.generateRecommendation(profileName)
      
      if (!response.success || !response.data) {
        throw new Error(response.error?.message || "生成学习方案失败")
      }

      // 格式化并显示 JSON 结果
      const jsonString = JSON.stringify(response.data.recommendation_json, null, 2)
      updateStep(index, {
        status: "completed",
        result: jsonString,
        showResult: true,
      })
      
      addLog(index, "✅ 学习方案撰写完成")
      
      // 自动进入下一步
      setTimeout(() => proceedToNextStep(index), 1000)
    } catch (error) {
      throw new Error(`撰写学习方案失败: ${error instanceof Error ? error.message : "未知错误"}`)
    }
  }

  /**
   * 步骤 5: 撰写学习报告（流式输出）
   */
  const executeReport = async (index: number, currentSteps?: StepState[]) => {
    const profileName = audioName.replace(/\.(wav|mp3|m4a|mp4)$/i, "-student_profile.json")
    addLog(index, `撰写学习报告: ${profileName}`)
    
    try {
      await apiClient.streamReport(profileName, (event) => {
        switch (event.event) {
          case "started":
            addLog(index, event.message || "开始撰写学习报告...")
            break
          case "log":
            addLog(index, event.message)
            break
          case "chunk":
            appendResult(index, event.content)
            break
          case "completed":
            addLog(index, "✅ 学习报告撰写完成")
            updateStep(index, { status: "completed", showResult: true })
            // 自动进入下一步
            setTimeout(() => proceedToNextStep(index), 1000)
            break
        }
      })
    } catch (error) {
      throw new Error(`撰写学习报告失败: ${error instanceof Error ? error.message : "未知错误"}`)
    }
  }

  /**
   * 步骤 6: 撰写 PPT 文稿
   */
  const executePPT = async (index: number, currentSteps?: StepState[]) => {
    const profileName = audioName.replace(/\.(wav|mp3|m4a|mp4)$/i, "-student_profile.json")
    addLog(index, `撰写 PPT 文稿: ${profileName}`)
    
    try {
      await apiClient.streamPPT(profileName, (event) => {
        switch (event.event) {
          case "started":
            addLog(index, event.message || "开始撰写 PPT...")
            break
          case "log":
            addLog(index, event.message)
            break
          case "chunk":
            appendResult(index, event.content)
            break
          case "completed":
            addLog(index, "✅ PPT 文稿撰写完成")
            updateStep(index, { status: "completed", showResult: true })
            setIsWorkflowRunning(false)
            
            // 重新加载音频信息以获取所有生成文件的 URL
            addLog(index, "刷新文件列表...")
            loadAudioInfo(true).then(() => {
              addLog(index, "✅ 文件列表已更新")
            }).catch((error) => {
              console.error("刷新文件列表失败:", error)
            })
            
            // 全部完成
            toast({
              title: "工作流完成！",
              description: "所有步骤已成功执行",
            })
            break
        }
      })
    } catch (error) {
      throw new Error(`撰写 PPT 失败: ${error instanceof Error ? error.message : "未知错误"}`)
    }
  }

  /**
   * 进入下一个步骤
   */
  const proceedToNextStep = (currentIndex: number) => {
    const nextIndex = currentIndex + 1
    
    console.log(`[proceedToNextStep] 当前步骤: ${currentIndex}, 下一步: ${nextIndex}`)
    
    // 使用函数式状态更新，获取最新的步骤状态
    setSteps((prevSteps) => {
      console.log(`[proceedToNextStep] prevSteps.length: ${prevSteps.length}`)
      
      // 检查是否还有下一步
      if (nextIndex >= prevSteps.length) {
        console.log(`[proceedToNextStep] 没有更多步骤，工作流结束`)
        // 在回调外设置
        setTimeout(() => setIsWorkflowRunning(false), 0)
        return prevSteps
      }
      
      console.log(`[proceedToNextStep] 启动步骤 ${nextIndex}: ${prevSteps[nextIndex]?.name}`)
      
      // 在回调外设置
      setTimeout(() => setCurrentStepIndex(nextIndex), 0)
      
      const newSteps = [...prevSteps]
      newSteps[nextIndex] = {
        ...newSteps[nextIndex],
        status: "running",
        isExpanded: true,
      }
      
      // 将更新后的步骤传递给 executeStep，避免竞态条件
      setTimeout(() => {
        executeStep(nextIndex, newSteps)
      }, 50)
      
      return newSteps
    })
  }

  /**
   * 用户确认学生画像后继续
   */
  const handleContinueFromPause = async (updatedProfile: StudentProfile) => {
    const parseIndex = steps.findIndex((s) => s.id === "parse")
    
    if (parseIndex === -1) return

    try {
      // 保存更新后的画像
      const subtitleName = audioName.replace(/\.(wav|mp3|m4a|mp4)$/i, ".srt")
      
      addLog(parseIndex, "保存学生画像...")
      
      const response = await apiClient.saveProfile(subtitleName, updatedProfile)
      
      if (!response.success) {
        throw new Error(response.error?.message || "保存画像失败")
      }

      addLog(parseIndex, "✅ 画像已保存")
      
      // 更新步骤结果，显示保存后的 JSON（使用用户编辑后的数据，而不是从接口重新获取）
      updateStep(parseIndex, {
        status: "completed",
        result: JSON.stringify(updatedProfile, null, 2),
        showResult: true,
      })
      setStudentProfile(updatedProfile)
      
      // 继续下一步
      setTimeout(() => {
        setIsWorkflowRunning(true)
        proceedToNextStep(parseIndex)
      }, 500)
      
    } catch (error) {
      toast({
        title: "保存失败",
        description: error instanceof Error ? error.message : "未知错误",
        variant: "destructive",
      })
    }
  }

  /**
   * 手动继续工作流（处理错误或暂停状态）
   */
  const handleContinueWorkflow = () => {
    // 查找第一个非完成状态的步骤
    const nextIndex = steps.findIndex(
      (s) => s.status !== "completed" && s.status !== "running"
    )
    
    if (nextIndex === -1) {
      toast({
        title: "无可执行步骤",
        description: "所有步骤已完成或正在执行",
      })
      return
    }

    // 如果是暂停状态（解析步骤），不自动继续
    if (steps[nextIndex].status === "paused") {
      toast({
        title: "请先确认学生画像",
        description: "需要您审核并确认学生信息后才能继续",
      })
      return
    }

    // 继续执行
    setCurrentStepIndex(nextIndex)
    setIsWorkflowRunning(true)
    
    // 使用函数式状态更新，并将更新后的步骤传递给 executeStep
    setSteps((prevSteps) => {
      const newSteps = [...prevSteps]
      newSteps[nextIndex] = {
        ...newSteps[nextIndex],
        status: "running",
        isExpanded: true,
      }
      
      // 延迟执行，确保状态更新完成
      setTimeout(() => {
        executeStep(nextIndex, newSteps)
      }, 100)
      
      return newSteps
    })
  }

  // 加载中状态
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-muted-foreground">加载音频信息...</p>
        </div>
      </div>
    )
  }

  // 音频未找到
  if (!audio) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-medium text-foreground mb-2">音频未找到</p>
          <p className="text-sm text-muted-foreground mb-4">请返回首页重新选择</p>
          <button
            onClick={() => router.push("/")}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            返回首页
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      {/* 导航栏：展示任务标题与主题切换 */}
      <nav className="border-b border-border/30 bg-card/70 sticky top-0 z-10 backdrop-blur-xl shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push("/")}
                className="p-2 rounded-lg transition-all duration-200 active:bg-muted"
                aria-label="返回首页"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-lg font-semibold text-foreground truncate max-w-md">
                  {audioName}
                </h1>
                <p className="text-xs text-muted-foreground">
                  {isWorkflowRunning ? "工作流执行中" : "准备就绪"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isWorkflowRunning && (
                <div className="px-3 py-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-xs rounded-full font-medium shadow-md flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  运行中
                </div>
              )}
              {!isWorkflowRunning && steps.length > 0 && !steps.every((s) => s.status === "completed") && (
                <button
                  onClick={handleContinueWorkflow}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-sm rounded-lg font-medium shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2"
                >
                  继续工作流
                </button>
              )}
              {!isWorkflowRunning && steps.every((s) => s.status === "completed") && (
                <div className="px-3 py-1 bg-gradient-to-r from-green-600 to-green-700 text-white text-xs rounded-full font-medium shadow-md">
                  已完成
                </div>
              )}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg transition-all duration-200 active:bg-muted"
                aria-label="切换主题"
              >
                {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* 主视图：滚动容器承载音频信息与步骤 */}
      <main
        ref={scrollContainerRef}
        className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 overflow-y-auto"
        style={{ height: "calc(100vh - 80px)" }}
      >
        {/* 音频信息卡片 */}
        <Card className="mb-8 p-6 border border-border/40 bg-gradient-to-br from-card via-card to-card/50 shadow-md rounded-xl">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-950 dark:to-blue-900 rounded-lg flex-shrink-0 shadow-sm">
              <Music className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground truncate">{audio.name}</h3>
              <p className="text-sm text-muted-foreground">
                上传时间: {new Date(audio.uploaded_at).toLocaleString("zh-CN")}
              </p>
            </div>
            {audio.url && (
              <audio
                controls
                className="w-64 h-10 flex-shrink-0"
                style={{
                  accentColor: isDark ? "#3B82F6" : "#2563EB",
                }}
              >
                <source src={audio.url} type="audio/mpeg" />
                您的浏览器不支持音频播放
              </audio>
            )}
          </div>
        </Card>

        {/* 工作流步骤列表 */}
        <div className="space-y-3">
          {steps.map((step, index) => {
            // 只显示非等待状态的步骤
            if (step.status === "waiting") return null

            return (
              <div
                key={step.id}
                style={{
                  animation:
                    index <= currentStepIndex + 1
                      ? "fadeInUp 0.5s ease-out"
                      : "none",
                }}
              >
                <WorkflowStep
                  step={step}
                  stepNumber={index + 1}
                  onExpand={(expanded) => {
                    updateStep(index, { isExpanded: expanded })
                  }}
                />

                {/* 当解析步骤被暂停时展示学生画像表单 */}
                {step.id === "parse" && step.status === "paused" && studentProfile && (
                  <div className="mt-3 animate-in fade-in slide-in-from-top-4">
                    <StudentProfileForm
                      profile={studentProfile}
                      onContinue={handleContinueFromPause}
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* 全部完成后的提示模块 */}
        {steps.every((s) => s.status === "completed") && (
          <div className="mt-8 p-8 bg-gradient-to-br from-indigo-50 via-blue-50 to-indigo-50 dark:from-indigo-950/40 dark:via-blue-950/40 dark:to-indigo-950/40 rounded-xl border border-indigo-200/50 dark:border-indigo-800/50 shadow-lg">
            <div className="flex flex-col lg:flex-row gap-8">
              {/* 左侧：主要内容 */}
              <div className="flex-1 flex flex-col gap-4">
                {/* 图标和标题 */}
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-gradient-to-br from-indigo-100 to-indigo-50 dark:from-indigo-900 dark:to-indigo-800 rounded-lg shadow-sm flex-shrink-0">
                    <CheckCircle2 className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-foreground mb-2">学习方案文稿已生成</h2>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      AI 已根据您的信息生成了个性化的学习方案 PPT 文稿，包含详细的学习路径、时间规划和目标分析。
                    </p>
                  </div>
                </div>

                {/* 下载按钮 */}
                {audio.ppt_url && (
                  <div className="flex flex-col gap-3 pt-2">
                    <button
                      onClick={async () => {
                        try {
                          const profileName = audioName.replace(/\.(wav|mp3|m4a|mp4)$/i, "-student_profile.json")
                          console.log("开始下载 PPT，profileName:", profileName)
                          await apiClient.downloadPPT(profileName)
                          toast({
                            title: "下载成功",
                            description: "PPT 文稿已开始下载",
                          })
                        } catch (error) {
                          console.error("下载 PPT 失败:", error)
                          toast({
                            title: "下载失败",
                            description: error instanceof Error ? error.message : "未知错误",
                            variant: "destructive",
                          })
                        }
                      }}
                      className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-all duration-150 shadow-md hover:shadow-lg active:shadow-sm flex items-center justify-center gap-2 w-fit"
                    >
                      <span>↓</span>
                      <span>下载 PPT 文稿</span>
                    </button>
                  </div>
                )}
              </div>

              {/* 右侧：文稿包含内容列表 */}
              <div className="lg:w-80 flex-shrink-0">
                <h3 className="text-sm font-semibold text-foreground mb-4">文稿包含内容</h3>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
                    <span>学生背景与优势分析</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
                    <span>个性化学习方案</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
                    <span>四阶段详细规划</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
                    <span>时间表与关键节点</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
                    <span>风险评估与建议</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

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
