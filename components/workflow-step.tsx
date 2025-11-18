"use client"

import { useState, useEffect, useRef } from "react"
import { Card } from "@/components/ui/card"
import { ChevronDown, CheckCircle2, Circle, Pause } from "lucide-react"

interface WorkflowStepProps {
  step: {
    id: string
    name: string
    status: "waiting" | "running" | "completed" | "paused" | "error"
    logs: string[]
    result: string
    isExpanded: boolean
    showResult: boolean
  }
  stepNumber: number
  onExpand: (expanded: boolean) => void
}

export function WorkflowStep({ step, stepNumber, onExpand }: WorkflowStepProps) {
  const [logsExpanded, setLogsExpanded] = useState(true)
  const [resultExpanded, setResultExpanded] = useState(true)
  const logsContainerRef = useRef<HTMLDivElement>(null)
  const resultContainerRef = useRef<HTMLDivElement>(null)

  const statusConfig = {
    waiting: { icon: Circle, label: "等待", color: "text-gray-400", bgColor: "bg-gray-100 dark:bg-gray-900" },
    running: { icon: Circle, label: "运行中", color: "text-blue-500", bgColor: "bg-blue-50 dark:bg-blue-950" },
    completed: { icon: CheckCircle2, label: "完成", color: "text-green-500", bgColor: "bg-green-50 dark:bg-green-950" },
    paused: { icon: Pause, label: "已暂停", color: "text-amber-500", bgColor: "bg-amber-50 dark:bg-amber-950" },
    error: { icon: Circle, label: "出错", color: "text-red-500", bgColor: "bg-red-50 dark:bg-red-950" },
  }

  const statusInfo = statusConfig[step.status]
  const StatusIcon = statusInfo.icon

  // 滚动日志区域到底部
  useEffect(() => {
    if (logsExpanded && logsContainerRef.current && step.logs.length > 0) {
      const container = logsContainerRef.current
      requestAnimationFrame(() => {
        container.scrollTop = container.scrollHeight
      })
    }
  }, [step.logs, logsExpanded])

  // 滚动结果区域到底部
  useEffect(() => {
    if (resultExpanded && resultContainerRef.current && step.result) {
      const container = resultContainerRef.current
      requestAnimationFrame(() => {
        container.scrollTop = container.scrollHeight
      })
    }
  }, [step.result, resultExpanded])

  return (
    <Card className="overflow-hidden border border-border/40 shadow-md hover:shadow-lg transition-shadow duration-300 rounded-lg">
      {/* 步骤头部：点击可展开/折叠详情 */}
      <div
        className={`p-5 flex items-center gap-4 cursor-pointer border-b border-border/20 transition-all duration-200 ${
          step.isExpanded ? "bg-gradient-to-r from-muted/40 to-muted/20" : "bg-background"
        }`}
        onClick={() => onExpand(!step.isExpanded)}
      >
        {/* 状态图标 */}
        <div className="flex-shrink-0">
          <div className={`${statusInfo.color} ${step.status === "running" ? "animate-pulse" : ""}`}>
            <StatusIcon className="w-5 h-5" />
          </div>
        </div>

        {/* 基本信息 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">步骤 {stepNumber}</span>
            <h3 className="font-semibold text-foreground truncate">{step.name}</h3>
          </div>
        </div>

        {/* 状态徽标 */}
        <div className={`px-3 py-1.5 rounded-full text-xs font-semibold ${statusInfo.color} flex-shrink-0 bg-muted/40`}>
          {statusInfo.label}
        </div>

        {/* 展开/收起箭头 */}
        <ChevronDown
          className={`w-5 h-5 text-muted-foreground transition-transform flex-shrink-0 ${
            step.isExpanded ? "rotate-180" : ""
          }`}
        />
      </div>

      {/* 步骤内容 */}
      {step.isExpanded && (
        <div className="border-t border-border/20 bg-gradient-to-b from-background to-muted/5">
          {/* 日志区域 */}
          {step.logs.length > 0 && (
            <div className="border-b border-border/20">
              <div
                className="p-5 flex items-center gap-3 cursor-pointer bg-background hover:bg-muted/10 transition-colors duration-150"
                onClick={() => setLogsExpanded(!logsExpanded)}
              >
                <span className="text-sm font-semibold text-foreground">执行日志</span>
                <span className="text-xs px-2.5 py-1 bg-gradient-to-r from-blue-100 to-blue-50 dark:from-blue-950 dark:to-blue-900 rounded text-blue-700 dark:text-blue-300 font-mono font-semibold shadow-sm">
                  {step.logs.length}
                </span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform ml-auto text-muted-foreground ${
                    logsExpanded ? "rotate-180" : ""
                  }`}
                />
              </div>
              {logsExpanded && (
                <div 
                  ref={logsContainerRef}
                  className="p-5 bg-gradient-to-b from-muted/20 to-muted/5 font-mono text-sm text-muted-foreground max-h-48 overflow-y-auto border-l-3 border-blue-500 dark:border-blue-400"
                >
                  {step.logs.map((log, i) => (
                    <div key={i} className="py-1.5 flex items-start gap-3">
                      <span className="text-xs text-blue-600 dark:text-blue-400 min-w-fit font-bold">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="text-foreground">{log}</span>
                    </div>
                  ))}
                  {step.status === "running" && (
                    <div className="py-1.5 flex items-start gap-3 text-blue-500">
                      <span className="text-xs font-semibold animate-pulse">●●</span>
                      <span className="animate-pulse">处理中...</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 结果区域 */}
          {step.result && (
            <div>
              <div
                className="p-5 flex items-center gap-3 cursor-pointer bg-background hover:bg-muted/10 transition-colors duration-150"
                onClick={() => setResultExpanded(!resultExpanded)}
              >
                <span className="text-sm font-semibold text-foreground">
                  {step.id === "parse" ? "解析结果" : "执行结果"}
                </span>
                <span className="text-xs px-2.5 py-1 bg-gradient-to-r from-green-100 to-green-50 dark:from-green-950 dark:to-green-900 rounded text-green-700 dark:text-green-300 font-mono font-semibold shadow-sm ml-auto">
                  {step.result.split("\n").length} 行
                </span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform text-muted-foreground ${resultExpanded ? "rotate-180" : ""}`}
                />
              </div>
              {resultExpanded && (
                <div 
                  ref={resultContainerRef}
                  className="p-5 bg-gradient-to-b from-muted/20 to-muted/5 max-h-96 overflow-y-auto border-l-3 border-green-500 dark:border-green-400"
                >
                  <pre className="font-mono text-xs text-foreground whitespace-pre-wrap break-words bg-gradient-to-br from-card to-card/50 p-4 rounded-lg border border-border/30 shadow-sm">
                    {step.result}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </Card>
  )
}
