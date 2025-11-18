"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { useTheme } from "@/components/theme-provider"
import { WorkflowStep } from "@/components/workflow-step"
import { StudentProfileForm } from "@/components/student-profile-form"
import { ArrowLeft, Moon, Sun, Music, CheckCircle2, Loader2, RefreshCw } from "lucide-react"
import { apiClient, normalizeApiUrl, apiBaseURL } from "@/lib/api/client"
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
  
  // 滚动节流：避免过于频繁的滚动操作
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  // 防重复执行：跟踪正在执行的步骤
  const executingStepsRef = useRef<Set<number>>(new Set())
  
  // 防重复初始化：跟踪是否已经初始化过
  const isInitializedRef = useRef(false)
  
  // 防重复初始化：跟踪是否正在初始化
  const isInitializingRef = useRef(false)
  
  // 防重复初始化：跟踪步骤是否已经初始化过
  const stepsInitializedRef = useRef(false)

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
   * 使用 useRef 防止 React Strict Mode 导致的重复执行
   */
  useEffect(() => {
    // 如果已经初始化过或正在初始化，则跳过
    if (isInitializedRef.current || isInitializingRef.current) {
      return
    }
    
    // 标记为正在初始化
    isInitializingRef.current = true
    
    loadAudioInfo().finally(() => {
      // 标记为已初始化
      isInitializedRef.current = true
      isInitializingRef.current = false
    })
    
    // 清理函数：组件卸载时重置标志
    return () => {
      isInitializedRef.current = false
      isInitializingRef.current = false
      stepsInitializedRef.current = false
    }
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

      // 规范化音频 URL 和其他资源 URL，确保通过 Next.js 代理访问
      const normalizedAudio: AudioItem = {
        ...foundAudio,
        url: normalizeApiUrl(foundAudio.url, apiBaseURL) || foundAudio.url,
        transcript_url: normalizeApiUrl(foundAudio.transcript_url, apiBaseURL),
        subtitle_url: normalizeApiUrl(foundAudio.subtitle_url, apiBaseURL),
        subtitle_view_url: normalizeApiUrl(foundAudio.subtitle_view_url, apiBaseURL),
        profile_url: normalizeApiUrl(foundAudio.profile_url, apiBaseURL),
        profile_json_url: normalizeApiUrl(foundAudio.profile_json_url, apiBaseURL),
        recommendation_url: normalizeApiUrl(foundAudio.recommendation_url, apiBaseURL),
        report_url: normalizeApiUrl(foundAudio.report_url, apiBaseURL),
        report_view_url: normalizeApiUrl(foundAudio.report_view_url, apiBaseURL),
        ppt_url: normalizeApiUrl(foundAudio.ppt_url, apiBaseURL),
      }

      setAudio(normalizedAudio)
      
      // 只在初始加载时初始化步骤
      if (!skipInitSteps) {
        await initializeSteps(normalizedAudio)
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
   * 重新推理规划：删除除音频和 srt 外的文件，然后从"提取学生画像"步骤重新开始
   */
  const handleRerunPlanning = async () => {
    if (!audio) {
      toast({
        title: "操作失败",
        description: "音频信息未加载",
        variant: "destructive",
      })
      return
    }

    try {
      // 显示加载提示
      toast({
        title: "正在重新推理规划",
        description: "正在删除旧文件并重置工作流...",
      })

      // 1. 调用 API 重置音频相关文件（删除除音频和 srt 外的文件）
      console.log("[handleRerunPlanning] 开始重置文件，audioName:", audioName)
      const resetResponse = await apiClient.resetAudio(audioName)

      if (!resetResponse.success || !resetResponse.data) {
        throw new Error(resetResponse.error?.message || "重置文件失败")
      }

      const resetResult = resetResponse.data
      console.log("[handleRerunPlanning] 重置成功:", resetResult)

      // 显示重置结果
      const deletedCount = resetResult.deleted_files.length
      const failedCount = resetResult.failed_files.length
      let description = `已删除 ${deletedCount} 个文件`
      
      // 确认音频文件已保留
      if (resetResult.audio_kept && resetResult.audio_path) {
        description += `，已保留音频文件`
      }
      
      // 确认字幕文件是否保留
      if (resetResult.srt_kept && resetResult.srt_path) {
        description += `，已保留字幕文件`
      }
      
      if (failedCount > 0) {
        description += `，${failedCount} 个文件删除失败`
      }

      toast({
        title: "文件重置成功",
        description: description,
      })

      // 2. 重新加载音频信息
      setLoading(true)
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

      // 规范化音频 URL
      const normalizedAudio: AudioItem = {
        ...foundAudio,
        url: normalizeApiUrl(foundAudio.url, apiBaseURL) || foundAudio.url,
        transcript_url: normalizeApiUrl(foundAudio.transcript_url, apiBaseURL),
        subtitle_url: normalizeApiUrl(foundAudio.subtitle_url, apiBaseURL),
        subtitle_view_url: normalizeApiUrl(foundAudio.subtitle_view_url, apiBaseURL),
        profile_url: normalizeApiUrl(foundAudio.profile_url, apiBaseURL),
        profile_json_url: normalizeApiUrl(foundAudio.profile_json_url, apiBaseURL),
        recommendation_url: normalizeApiUrl(foundAudio.recommendation_url, apiBaseURL),
        report_url: normalizeApiUrl(foundAudio.report_url, apiBaseURL),
        report_view_url: normalizeApiUrl(foundAudio.report_view_url, apiBaseURL),
        ppt_url: normalizeApiUrl(foundAudio.ppt_url, apiBaseURL),
      }

      setAudio(normalizedAudio)

      // 3. 重置工作流状态
      // 清除执行中的步骤标记
      executingStepsRef.current.clear()
      setIsWorkflowRunning(false)

      // 4. 重新初始化步骤，从步骤1（提取学生画像）开始
      // 步骤索引：0=transcribe, 1=extract, 2=parse, 3=recommend, 4=report, 5=ppt
      const extractStepIndex = stepDefinitions.findIndex((def) => def.id === "extract")
      if (extractStepIndex === -1) {
        throw new Error("找不到提取学生画像步骤")
      }

      // 重新初始化步骤，从步骤1开始
      await initializeSteps(normalizedAudio, extractStepIndex)

      toast({
        title: "重新推理规划已启动",
        description: "工作流已从「提取学生画像」步骤重新开始",
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "未知错误"
      console.error("[handleRerunPlanning] 错误:", error)

      toast({
        title: "重新推理规划失败",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  /**
   * 从 localStorage 加载保存的步骤状态
   * 暂时禁用
   */
  // const loadStepsFromStorage = (): StepState[] | null => {
  //   try {
  //     const storageKey = `workflow_steps_${audioName}`
  //     const saved = localStorage.getItem(storageKey)
  //     if (saved) {
  //       const parsed = JSON.parse(saved)
  //       // 验证数据格式
  //       if (Array.isArray(parsed) && parsed.length === stepDefinitions.length) {
  //         return parsed as StepState[]
  //       }
  //     }
  //   } catch (error) {
  //     console.error("加载保存的步骤状态失败:", error)
  //   }
  //   return null
  // }

  /**
   * 保存步骤状态到 localStorage
   * 暂时禁用
   */
  // const saveStepsToStorage = (stepsToSave: StepState[]) => {
  //   try {
  //     const storageKey = `workflow_steps_${audioName}`
  //     localStorage.setItem(storageKey, JSON.stringify(stepsToSave))
  //   } catch (error) {
  //     console.error("保存步骤状态失败:", error)
  //   }
  // }

  /**
   * 从 URL 获取文件内容
   */
  const fetchFileContent = async (url: string | null | undefined): Promise<string> => {
    if (!url) {
      throw new Error("URL 不存在")
    }
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`获取文件失败: ${response.statusText}`)
    }
    return await response.text()
  }

  /**
   * 加载已完成步骤的执行结果
   */
  const loadStepResults = async (steps: StepState[], audioItem: AudioItem) => {
    const updatedSteps = [...steps]
    
    // 步骤1: 转录音频 - 获取字幕内容
    const transcribeIndex = updatedSteps.findIndex(s => s.id === "transcribe")
    if (transcribeIndex !== -1 && updatedSteps[transcribeIndex].status === "completed" && audioItem.subtitle_url) {
      try {
        const subtitleContent = await fetchFileContent(audioItem.subtitle_url)
        updatedSteps[transcribeIndex].result = subtitleContent
        updatedSteps[transcribeIndex].showResult = true
      } catch (error) {
        console.error("获取字幕内容失败:", error)
      }
    }

    // 步骤2: 提取学生画像 - 获取画像 JSON
    const extractIndex = updatedSteps.findIndex(s => s.id === "extract")
    if (extractIndex !== -1 && updatedSteps[extractIndex].status === "completed" && audioItem.profile_json_url) {
      try {
        const profileContent = await fetchFileContent(audioItem.profile_json_url)
        updatedSteps[extractIndex].result = profileContent
        updatedSteps[extractIndex].showResult = true
      } catch (error) {
        console.error("获取画像内容失败:", error)
      }
    }

    // 步骤3: 解析学生画像 - 获取画像 JSON
    const parseIndex = updatedSteps.findIndex(s => s.id === "parse")
    if (parseIndex !== -1 && updatedSteps[parseIndex].status === "completed") {
      try {
        const profileName = audioName.replace(/\.(wav|mp3|m4a|mp4)$/i, "-student_profile.json")
        const response = await apiClient.getProfile(profileName)
        if (response.success && response.data) {
          updatedSteps[parseIndex].result = JSON.stringify(response.data, null, 2)
          updatedSteps[parseIndex].showResult = true
        }
      } catch (error) {
        console.error("获取画像 JSON 失败:", error)
      }
    }

    // 步骤4: 撰写学习方案 - 获取推荐方案 JSON
    const recommendIndex = updatedSteps.findIndex(s => s.id === "recommend")
    if (recommendIndex !== -1 && updatedSteps[recommendIndex].status === "completed" && audioItem.recommendation_url) {
      try {
        const recommendationContent = await fetchFileContent(audioItem.recommendation_url)
        updatedSteps[recommendIndex].result = recommendationContent
        updatedSteps[recommendIndex].showResult = true
      } catch (error) {
        console.error("获取推荐方案内容失败:", error)
      }
    }

    // 步骤5: 撰写学习报告 - 获取报告内容
    const reportIndex = updatedSteps.findIndex(s => s.id === "report")
    if (reportIndex !== -1 && updatedSteps[reportIndex].status === "completed" && audioItem.report_url) {
      try {
        const reportContent = await fetchFileContent(audioItem.report_url)
        updatedSteps[reportIndex].result = reportContent
        updatedSteps[reportIndex].showResult = true
      } catch (error) {
        console.error("获取报告内容失败:", error)
      }
    }

    // 步骤6: 撰写 PPT 文稿 - 获取 PPT 内容
    const pptIndex = updatedSteps.findIndex(s => s.id === "ppt")
    if (pptIndex !== -1 && updatedSteps[pptIndex].status === "completed" && audioItem.ppt_url) {
      try {
        const pptContent = await fetchFileContent(audioItem.ppt_url)
        updatedSteps[pptIndex].result = pptContent
        updatedSteps[pptIndex].showResult = true
      } catch (error) {
        console.error("获取 PPT 内容失败:", error)
      }
    }

    setSteps(updatedSteps)
  }

  /**
   * 初始化步骤状态，根据已完成的标志跳过已完成的步骤
   * 添加防重复执行检查，确保不会重复初始化
   * @param audioItem 音频信息
   * @param startFromStep 从指定步骤索引开始（可选，用于重新推理规划）
   */
  const initializeSteps = async (audioItem: AudioItem, startFromStep?: number) => {
    // 如果指定了从某个步骤开始，则重置初始化标志
    if (startFromStep !== undefined) {
      stepsInitializedRef.current = false
    }
    
    // 如果步骤已经初始化过，跳过重复初始化
    if (stepsInitializedRef.current) {
      console.log("[initializeSteps] 步骤已初始化，跳过重复初始化")
      return
    }
    
    // 标记为正在初始化
    stepsInitializedRef.current = true
    
    // 创建新的步骤状态
    const initialSteps: StepState[] = stepDefinitions.map((def, index) => {
      // 如果指定了从某个步骤开始，则在该步骤之前的步骤标记为已完成
      if (startFromStep !== undefined) {
        if (index < startFromStep) {
          return {
            id: def.id,
            name: def.name,
            status: "completed" as const,
            logs: [],
            result: "",
            isExpanded: false,
            showResult: false,
          }
        }
        // 从指定步骤开始，后续步骤都标记为等待
        return {
          id: def.id,
          name: def.name,
          status: "waiting" as const,
          logs: [],
          result: "",
          isExpanded: false,
          showResult: false,
        }
      }
      
      // 根据 audio 的标志判断步骤是否已完成
      let status: StepState["status"] = "waiting"
      
      // 转录步骤：优先检查 srt 文件是否存在（has_subtitle 或 subtitle_url）
      // 如果 srt 文件存在，说明转录已完成，跳过转录步骤
      if (def.id === "transcribe" && (audioItem.has_subtitle || audioItem.subtitle_url || audioItem.has_transcript)) {
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
        isExpanded: false, // 默认折叠
        showResult: false,
      }
    })

    setSteps(initialSteps)

    // 加载已完成步骤的执行结果
    await loadStepResults(initialSteps, audioItem)

    // 找到第一个未完成的步骤并开始执行
    const firstPendingIndex = startFromStep !== undefined 
      ? startFromStep 
      : initialSteps.findIndex((s) => s.status === "waiting")
    
    if (firstPendingIndex !== -1) {
      setTimeout(() => {
        setCurrentStepIndex(firstPendingIndex)
        startStep(firstPendingIndex, initialSteps)
      }, 800)
    }
  }

  // 滚动到底部的辅助函数（带节流）
  const scrollToBottom = (smooth: boolean = true, immediate: boolean = false) => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current
      
      // 如果要求立即滚动（不节流），直接执行
      if (immediate) {
        requestAnimationFrame(() => {
          if (smooth) {
            container.scrollTo({
              top: container.scrollHeight,
              behavior: 'smooth'
            })
          } else {
            container.scrollTop = container.scrollHeight
          }
        })
        return
      }
      
      // 节流：清除之前的定时器
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }
      
      // 设置新的滚动定时器（50ms 节流）
      scrollTimeoutRef.current = setTimeout(() => {
        requestAnimationFrame(() => {
          if (scrollContainerRef.current) {
            const container = scrollContainerRef.current
            if (smooth) {
              container.scrollTo({
                top: container.scrollHeight,
                behavior: 'smooth'
              })
            } else {
              container.scrollTop = container.scrollHeight
            }
          }
        })
      }, 50)
    }
  }

  // 监听 steps 变化，将滚动容器滑动到底部，方便查看最新日志
  useEffect(() => {
    // 延迟滚动，确保 DOM 完全更新
    const timer = setTimeout(() => {
      scrollToBottom(true)
    }, 50)
    return () => clearTimeout(timer)
  }, [steps])

  /**
   * 辅助函数：更新步骤状态
   */
  const updateStep = (index: number, updates: Partial<StepState>) => {
    setSteps((prevSteps) => {
      const newSteps = [...prevSteps]
      newSteps[index] = { ...newSteps[index], ...updates }
      // 暂时取消保存到 localStorage
      // saveStepsToStorage(newSteps)
      return newSteps
    })
  }

  /**
   * 辅助函数：添加日志
   */
  const addLog = (index: number, log: string) => {
    setSteps((prevSteps) => {
      const newSteps = [...prevSteps]
      // 确保 logs 数组存在
      if (!newSteps[index].logs) {
        newSteps[index].logs = []
      }
      newSteps[index].logs.push(log)
      // 暂时取消保存到 localStorage
      // saveStepsToStorage(newSteps)
      return newSteps
    })
    // 添加日志后滚动到底部（使用节流）
    scrollToBottom(true, false)
  }

  /**
   * 辅助函数：追加结果内容
   */
  const appendResult = (index: number, content: string) => {
    setSteps((prevSteps) => {
      const newSteps = [...prevSteps]
      newSteps[index].result += content
      // 暂时取消保存到 localStorage
      // saveStepsToStorage(newSteps)
      return newSteps
    })
    // 追加结果后滚动到底部（使用节流）
    scrollToBottom(true, false)
  }

  /**
   * 启动指定步骤
   */
  const startStep = (index: number, currentSteps: StepState[]) => {
    const newSteps = [...currentSteps]
    // 确保 logs 数组存在（如果不存在则初始化为空数组）
    if (!newSteps[index].logs) {
      newSteps[index].logs = []
    }
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
   * 优先检查 srt 文件是否存在，如果存在则直接加载，跳过转录 API 调用
   */
  const executeTranscribe = async (index: number, currentSteps?: StepState[]) => {
    // 优先检查 srt 文件是否存在
    if (audio && (audio.has_subtitle || audio.subtitle_url)) {
      addLog(index, "检测到字幕文件已存在，跳过转录步骤")
      addLog(index, "正在加载字幕文件...")
      
      try {
        // 如果有 subtitle_url，直接加载字幕文件内容
        if (audio.subtitle_url) {
          const subtitleContent = await fetchFileContent(audio.subtitle_url)
          appendResult(index, subtitleContent)
          addLog(index, "✅ 字幕文件加载完成")
        } else {
          // 如果没有 subtitle_url，尝试从音频文件名推断 srt 文件名
          const subtitleName = audioName.replace(/\.(wav|mp3|m4a|mp4)$/i, ".srt")
          addLog(index, `尝试加载字幕文件: ${subtitleName}`)
          // 这里可以尝试通过 API 获取字幕文件，或者直接标记为完成
          addLog(index, "✅ 字幕文件已存在，跳过转录")
        }
        
        updateStep(index, { status: "completed", showResult: true })
        // 自动进入下一步
        setTimeout(() => proceedToNextStep(index), 1000)
        return
      } catch (error) {
        // 如果加载字幕文件失败，继续执行转录
        addLog(index, `⚠️ 加载字幕文件失败，将执行转录: ${error instanceof Error ? error.message : "未知错误"}`)
      }
    }
    
    // 如果 srt 文件不存在，执行转录
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
            // appendResult 内部已经会触发滚动，这里不需要再次调用
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
      addLog(index, "正在连接流式提取服务...")
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
          case "error":
            addLog(index, `❌ 错误: ${event.message || "未知错误"}`)
            throw new Error(event.message || "提取画像失败")
        }
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "未知错误"
      addLog(index, `❌ 提取画像失败: ${errorMessage}`)
      throw new Error(`提取画像失败: ${errorMessage}`)
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
   * 步骤 4: 撰写学习方案（流式输出 JSON）
   */
  const executeRecommend = async (index: number, currentSteps?: StepState[]) => {
    const profileName = audioName.replace(/\.(wav|mp3|m4a|mp4)$/i, "-student_profile.json")
    addLog(index, `撰写学习方案: ${profileName}`)
    
    try {
      addLog(index, "正在连接流式生成服务...")
      await apiClient.streamRecommendation(profileName, (event) => {
        switch (event.event) {
          case "started":
            addLog(index, event.message || "开始撰写学习方案...")
            break
          case "log":
            addLog(index, event.message)
            break
          case "chunk":
            appendResult(index, event.content)
            break
          case "completed":
            addLog(index, "✅ 学习方案撰写完成")
            updateStep(index, { status: "completed", showResult: true })
            // 自动进入下一步
            setTimeout(() => proceedToNextStep(index), 1000)
            break
          case "error":
            addLog(index, `❌ 错误: ${event.message || "未知错误"}`)
            throw new Error(event.message || "撰写学习方案失败")
        }
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "未知错误"
      addLog(index, `❌ 撰写学习方案失败: ${errorMessage}`)
      throw new Error(`撰写学习方案失败: ${errorMessage}`)
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
   * 暂时只关闭表单，不执行保存操作
   */
  const handleContinueFromPause = async (updatedProfile: StudentProfile) => {
    const parseIndex = steps.findIndex((s) => s.id === "parse")
    
    if (parseIndex === -1) return

    // 添加日志
    addLog(parseIndex, "用户已确认画像")
    
    // 将步骤状态从 "paused" 改为 "completed"，完成步骤3
    updateStep(parseIndex, {
      status: "completed",
    })
    
    // 继续下一步
    setTimeout(() => {
      proceedToNextStep(parseIndex)
    }, 500)
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 dark:from-muted/10 dark:via-muted/20 dark:to-muted/30">
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
        <div className="space-y-4">
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

                {/* 下载按钮和重新推理按钮 */}
                {audio && (audio.has_ppt || audio.ppt_url) && (
                  <div className="flex flex-col gap-3 pt-2">
                    <div className="flex items-center gap-3 flex-wrap">
                      {audio.ppt_url && (
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
                          className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-all duration-150 shadow-md hover:shadow-lg active:shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <span>↓</span>
                          <span>下载 PPT 文稿</span>
                        </button>
                      )}
                      <button
                        onClick={handleRerunPlanning}
                        className="px-6 py-2.5 border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 rounded-lg font-medium transition-all duration-150 shadow-md hover:shadow-lg active:shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <RefreshCw className="w-4 h-4" />
                        <span>重新推理规划</span>
                      </button>
                    </div>
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
