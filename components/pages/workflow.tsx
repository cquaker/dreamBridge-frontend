"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { useTheme } from "@/components/theme-provider"
import { WorkflowStep } from "@/components/workflow-step"
import { StudentProfileForm } from "@/components/student-profile-form"
import { ArrowLeft, Moon, Sun, Music, CheckCircle2 } from "lucide-react"

// 模拟项目数据源：实际接入 API 时可用 projectId 请求后端
const MOCK_PROJECTS: Record<string, any> = {
  "1": {
    name: "李明 - 美国留学计划",
    audioFile: "interview_liming.mp3",
    audioSize: "5.2 MB",
    audioDuration: "5:23",
    status: "completed",
  },
  "2": {
    name: "王丽 - 英国申请方案",
    audioFile: "interview_wangli.mp3",
    audioSize: "4.8 MB",
    audioDuration: "4:45",
    status: "running",
  },
  "3": {
    name: "张浩 - 硕士申请规划",
    audioFile: "interview_zhanghao.mp3",
    audioSize: "6.1 MB",
    audioDuration: "6:12",
    status: "pending",
  },
}

interface StepState {
  id: string
  name: string
  status: "waiting" | "running" | "completed" | "paused" | "error"
  logs: string[]
  result: string
  isExpanded: boolean
  showResult: boolean
}

export function WorkflowPage({ projectId }: { projectId: string }) {
  const router = useRouter()
  const { isDark, toggleTheme } = useTheme()
  const [project, setProject] = useState(MOCK_PROJECTS[projectId])
  const [steps, setSteps] = useState<StepState[]>([])
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [studentProfile, setStudentProfile] = useState<any>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // 定义工作流的步骤顺序与描述，驱动 UI 呈现
  const stepDefinitions = [
    { id: "transcribe", name: "转录音频", description: "提取音频字幕和转录文本" },
    { id: "extract", name: "提取学生画像", description: "分析关键信息点" },
    { id: "parse", name: "解析学生画像", description: "转换为结构化数据" },
    { id: "plan", name: "撰写学习方案", description: "生成个性化学习方案" },
    { id: "report", name: "撰写学习报告", description: "详细的推荐报告" },
    { id: "ppt", name: "撰写 PPT 文稿", description: "演示文稿内容" },
  ]

  // 初始化步骤列表，并触发首个任务
  useEffect(() => {
    const initialSteps: StepState[] = stepDefinitions.map((def) => ({
      id: def.id,
      name: def.name,
      status: "waiting",
      logs: [],
      result: "",
      isExpanded: false,
      showResult: false,
    }))
    setSteps(initialSteps)

    // 首个步骤稍作延迟后置为运行态，模拟调用后端任务
    setTimeout(() => {
      initialSteps[0].status = "running"
      initialSteps[0].isExpanded = true
      setSteps([...initialSteps])
      executeStep(0, initialSteps)
    }, 500)
  }, [])

  // 监听 steps 变化，将滚动容器滑动到底部，方便查看最新日志
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight
    }
  }, [steps])

  // 驱动每个步骤的“执行 + 流式更新”过程
  const executeStep = async (index: number, currentSteps: StepState[]) => {
    const step = currentSteps[index]
    const mockStepData = MOCK_STEP_DATA[step.id]

    // 模拟日志流式输出，每条日志逐条推送
    for (const log of mockStepData.logs) {
      await new Promise((resolve) => setTimeout(resolve, 200))
      currentSteps[index].logs.push(log)
      setSteps([...currentSteps])
    }

    // 模拟结果内容分批写入，提升真实感
    const resultText = mockStepData.result
    let resultContent = ""
    for (let i = 0; i < resultText.length; i += 50) {
      await new Promise((resolve) => setTimeout(resolve, 50))
      resultContent += resultText.substring(i, i + 50)
      currentSteps[index].result = resultContent
      setSteps([...currentSteps])
    }

    // 完成当前步骤，默认展示结果面板
    currentSteps[index].status = "completed"
    currentSteps[index].showResult = true

    // 解析学生画像步骤需要人工确认，因此暂停并注入表单
    if (step.id === "parse") {
      currentSteps[index].status = "paused"
      setStudentProfile(JSON.parse(mockStepData.result))
      setSteps([...currentSteps])
      return
    }

    setSteps([...currentSteps])

    // 进入下一个步骤，保持执行节奏
    if (index + 1 < currentSteps.length) {
      await new Promise((resolve) => setTimeout(resolve, 500))
      currentSteps[index + 1].status = "running"
      currentSteps[index + 1].isExpanded = true
      setSteps([...currentSteps])
      setCurrentStepIndex(index + 1)
      executeStep(index + 1, currentSteps)
    }
  }

  // 表单确认后恢复工作流，并将 paused 步骤标记为完成
  const handleContinueFromPause = (updatedProfile: any) => {
    setStudentProfile(updatedProfile)
    const newSteps = [...steps]
    newSteps[2].status = "completed"
    setSteps(newSteps)

    // 继续执行 plan 步骤
    setTimeout(() => {
      const nextIndex = 3
      newSteps[nextIndex].status = "running"
      newSteps[nextIndex].isExpanded = true
      setSteps([...newSteps])
      setCurrentStepIndex(nextIndex)
      executeStep(nextIndex, newSteps)
    }, 500)
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
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-lg font-semibold text-foreground">{project?.name}</h1>
                <p className="text-xs text-muted-foreground">工作流执行中</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="px-3 py-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-xs rounded-full font-medium shadow-md">
                运行中
              </div>
              <button onClick={toggleTheme} className="p-2 rounded-lg transition-all duration-200 active:bg-muted">
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
              <h3 className="font-semibold text-foreground truncate">{project?.audioFile}</h3>
              <p className="text-sm text-muted-foreground">
                {project?.audioSize} • {project?.audioDuration}
              </p>
            </div>
            <audio
              controls
              className="w-64 h-10 flex-shrink-0"
              style={{
                accentColor: isDark ? "#3B82F6" : "#2563EB",
              }}
            >
              <source src="/placeholder.mp3" type="audio/mpeg" />
            </audio>
          </div>
        </Card>

        {/* 工作流步骤列表 */}
        <div className="space-y-3">
          {steps.map(
            (step, index) =>
              step.status !== "waiting" && (
                <div
                  key={step.id}
                  style={{
                    animation:
                      step.status !== "waiting" && index <= currentStepIndex + 1 ? "fadeInUp 0.5s ease-out" : "none",
                  }}
                >
                  <WorkflowStep
                    step={step}
                    stepNumber={index + 1}
                    onExpand={(expanded) => {
                      const newSteps = [...steps]
                      newSteps[index].isExpanded = expanded
                      setSteps(newSteps)
                    }}
                  />

                  {/* 当解析步骤被暂停时展示学生画像表单 */}
                  {step.id === "parse" && step.status === "paused" && studentProfile && (
                    <div className="mt-3 animate-in fade-in slide-in-from-top-4">
                      <StudentProfileForm profile={studentProfile} onContinue={handleContinueFromPause} />
                    </div>
                  )}
                </div>
              ),
          )}
        </div>

        {/* 全部完成后的提示模块 */}
        {steps.every((s) => s.status === "completed") && (
          <div className="mt-8 p-8 bg-gradient-to-br from-indigo-50 via-blue-50 to-indigo-50 dark:from-indigo-950/40 dark:via-blue-950/40 dark:to-indigo-950/40 rounded-xl border border-indigo-200/50 dark:border-indigo-800/50 shadow-lg">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              {/* 左侧内容：总结生成物并提供按钮 */}
              <div>
                <div className="mb-4 flex">
                  <div className="p-3 bg-gradient-to-br from-indigo-100 to-indigo-50 dark:from-indigo-900 dark:to-indigo-800 rounded-lg shadow-sm">
                    <CheckCircle2 className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-2">学习方案文稿已生成</h2>
                <p className="text-muted-foreground mb-4 max-w-md leading-relaxed">
                  AI 已根据您的信息生成了个性化的学习方案 PPT 文稿，包含详细的学习路径、时间规划和目标分析。
                </p>
                <div className="flex flex-wrap gap-3">
                  <button className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white rounded-lg font-medium transition-all duration-150 shadow-md active:shadow-sm">
                    ↓ 下载 PPT 文稿
                  </button>
                  <button
                    onClick={() => router.push("/")}
                    className="px-6 py-2.5 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg font-medium transition-all duration-150"
                  >
                    返回首页
                  </button>
                </div>
              </div>

              {/* 右侧补充信息卡片 */}
              <div className="lg:min-w-[280px] p-5 bg-white/60 dark:bg-black/30 rounded-lg border border-indigo-100/50 dark:border-indigo-900/50 backdrop-blur-sm shadow-sm">
                <h3 className="text-sm font-semibold text-foreground mb-3">文稿包含内容</h3>
                <ul className="space-y-2.5 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-600 dark:text-indigo-400 font-bold mt-0.5 text-base">✓</span>
                    <span>学生背景与优势分析</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-600 dark:text-indigo-400 font-bold mt-0.5 text-base">✓</span>
                    <span>个性化学习方案</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-600 dark:text-indigo-400 font-bold mt-0.5 text-base">✓</span>
                    <span>四阶段详细规划</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-600 dark:text-indigo-400 font-bold mt-0.5 text-base">✓</span>
                    <span>时间表与关键节点</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-600 dark:text-indigo-400 font-bold mt-0.5 text-base">✓</span>
                    <span>风险评估与建议</span>
                  </li>
                </ul>
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

// 每个步骤对应的模拟日志与结果，便于演示流式体验
const MOCK_STEP_DATA: Record<string, { logs: string[]; result: string }> = {
  transcribe: {
    logs: ["正在连接音频转写服务...", "开始转录音频文件...", "处理音频流...", "生成字幕文本（流式输出）..."],
    result: `[00:00:00] 你好，我是李明
[00:00:02] 我想申请美国的大学
[00:00:05] 我的GPA是3.8，托福成绩是105分
[00:00:10] 我参加过学科竞赛，获得过全国二等奖
[00:00:15] 我在一家科技公司实习过，主要从事前端开发
[00:00:20] 我对计算机科学和人工智能特别感兴趣
[00:00:25] 我的梦想是进入像麻省理工学院或斯坦福这样的顶尖大学`,
  },
  extract: {
    logs: ["开始分析字幕内容...", "提取关键信息点...", "结构化学生画像数据...", "生成 JSON 格式输出（流式）..."],
    result: `{
  "基本信息": {
    "姓名": "李明",
    "学校": "待定",
    "年级": "高三",
    "申请方向": "计算机科学"
  },
  "学术成绩": {
    "GPA": 3.8,
    "托福": 105,
    "SAT": "待考"
  },
  "竞赛与获奖": [
    "全国学科竞赛二等奖"
  ],
  "实习经验": [
    {
      "公司": "科技公司",
      "职位": "前端开发实习生",
      "时长": "3个月"
    }
  ],
  "申请目标": [
    "麻省理工学院",
    "斯坦福大学"
  ]
}`,
  },
  parse: {
    logs: [
      "开始解析 JSON...",
      "读取学生画像 JSON 数据...",
      "验证 JSON 格式...",
      "解析 JSON 结构...",
      "提取字段信息...",
      "转换为表单数据...",
      "解析完成，展示表单",
    ],
    result: `{
  "基本信息": {
    "姓名": "李明",
    "当前学校": "北京市第一中学",
    "年级": "高三"
  },
  "学术成绩": {
    "GPA": 3.8,
    "核心课程": ["数学", "物理", "化学", "英语"],
    "托福成绩": 105
  },
  "语言能力": {
    "当前水平": "高级",
    "目标分数": "110+",
    "备考计划": "每天2小时，持续6个月"
  },
  "软实力背景": {
    "实习经验": "科技公司前端开发实习",
    "竞赛获奖": "全国学科竞赛二等奖",
    "课外活动": "担任学生会主席，组织校内编程比赛"
  },
  "家庭背景": {
    "经济状况": "良好",
    "价格敏感度": "中等",
    "支持程度": "高"
  },
  "申请意向": {
    "目标国家": ["美国"],
    "目标排名": "TOP 20",
    "专业方向": "计算机科学",
    "时间规划": "2024年秋季入学"
  }
}`,
  },
  plan: {
    logs: ["开始分析：生成学习方案", "准备执行任务...", "读取学生画像数据...", "开始生成 JSON 方案（流式）..."],
    result: `{
  "方案概述": {
    "总体目标": "冲刺美国TOP 20大学",
    "预期周期": "12个月",
    "核心策略": "学术提升 + 竞争力建设"
  },
  "第一阶段（0-3个月）": {
    "目标": "夯实学术基础",
    "任务": [
      "GPA保持在3.8以上",
      "准备SAT考试，目标1500+",
      "加强数学和物理深度学习"
    ]
  },
  "第二阶段（3-6个月）": {
    "目标": "培养竞争优势",
    "任务": [
      "参加更多高水平竞赛",
      "开发个人项目（编程方向）",
      "积累更多实习经验"
    ]
  },
  "第三阶段（6-9个月）": {
    "目标": "打造申请材料",
    "任务": [
      "撰写高质量文书",
      "准备推荐信",
      "整理申请材料"
    ]
  },
  "第四阶段（9-12个月）": {
    "目标": "完成申请流程",
    "任务": [
      "提交申请",
      "准备面试",
      "等待录取结果"
    ]
  }
}`,
  },
  report: {
    logs: [
      "开始分析：生成推荐报告",
      "准备执行任务...",
      "读取推荐方案数据...",
      "开始生成 Markdown 报告...",
      "连接到流式生成 API...",
      "正在生成推荐报告（流式）...",
    ],
    result: `# 李明学生申请推荐报告

## 学生概况
李明是一位优秀的高中生，具有较强的学术能力和竞争优势。

### 学术成绩
- GPA: 3.8（优秀）
- 托福: 105（良好）
- 竞赛: 全国学科竞赛二等奖

### 申请目标
- 目标国家: 美国
- 目标排名: TOP 20
- 专业方向: 计算机科学

## 优势分析
1. **学术实力强**: GPA 3.8，综合成绩优异
2. **竞赛经验丰富**: 获得全国二等奖，体现竞争力
3. **实习背景良好**: 科技公司实习经验，符合申请方向
4. **时间安排合理**: 充足的准备期

## 需要改进的方向
1. **标化成绩**: 托福 105 尚可，可继续提升至 110+
2. **SAT 准备**: 需着手准备 SAT 考试
3. **个人项目**: 可开发展示编程能力的项目

## 建议方案
### 短期计划（0-3个月）
- 准备 SAT 考试，目标 1500+
- 继续保持 GPA 3.8+
- 深化数学和物理学习

### 中期计划（3-6个月）
- 参加高水平竞赛
- 开发个人编程项目
- 积累更多实习经验

### 长期计划（6-12个月）
- 撰写高质量文书
- 准备申请材料
- 完成大学申请流程

## 录取概率评估
- **MIT/Stanford**: 中等概率
- **TOP 20**: 较高概率
- **建议目标**: 制定冲刺、主申、保底三个梯度`,
  },
  ppt: {
    logs: [
      "开始分析：生成 PPT 文稿",
      "准备执行任务...",
      "读取学习方案和报告数据...",
      "开始生成 PPT 文稿 Markdown...",
      "连接到流式生成 API...",
      "正在生成演示文稿内容（流式）...",
    ],
    result: `# 李明美国大学申请方案演示文稿

---

## 第一页：封面
### 学生申请方案
#### 姓名：李明
#### 目标：美国 TOP 20 大学
#### 专业：计算机科学
#### 日期：2025年11月

---

## 第二页：学生概况

### 基本信息
- 学校：北京市第一中学
- 年级：高三
- 目标国家：美国
- 目标大学排名：TOP 20

### 核心数据
- GPA：3.8
- 托福：105
- 竞赛：全国学科竞赛二等奖
- 实习：科技公司前端开发实习生

---

## 第三页：学术优势

### 成绩分析
- GPA 3.8，在同级别学生中处于优势地位
- 托福 105，虽然良好但有提升空间
- 核心课程成绩出色（数学、物理、化学、英语）

### 竞赛成就
- 全国学科竞赛二等奖
- 展现了较强的学术竞争力
- 证明学术能力在省级及以上水平

---

## 第四页：竞争力建设

### 软实力背景
1. **实习经验**
   - 科技公司前端开发实习
   - 获得实际工程经验
   
2. **竞赛获奖**
   - 全国学科竞赛二等奖
   - 体现学术深度

3. **课外活动**
   - 学生会主席
   - 组织校内编程比赛

### 个人发展
- 具有明确的学术方向定位
- 在计算机科学领域有专业积累

---

## 第五页：申请策略

### 整体目标
- 冲刺美国 TOP 20 大学
- 计算机科学专业方向
- 预期 2024 年秋季入学

### 四阶段计划

**第一阶段（0-3个月）：学术基础**
- GPA 保持 3.8+
- 准备 SAT，目标 1500+
- 深化核心课程学习

**第二阶段（3-6个月）：竞争力建设**
- 参加更多高水平竞赛
- 开发个人编程项目
- 积累实习经验

---

## 第六页：申请策略（续）

**第三阶段（6-9个月）：申请材料**
- 撰写高质量文书
- 准备推荐信
- 整理申请材料包

**第四阶段（9-12个月）：申请执行**
- 提交大学申请
- 准备面试
- 等待录取

---

## 第七页：风险评估与建议

### 需要改进的方向
1. **标化成绩提升**
   - 托福可提升至 110+
   - 尽快准备 SAT

2. **个人项目**
   - 开发展示编程能力的项目
   - 参与开源社区

3. **文书准备**
   - 提前规划申请文书
   - 深化个人故事挖掘

### 建议
- 制定冲刺、主申、保底三个申请梯度
- 关注目标大学的申请截止时间
- 准备充分的申请材料

---

## 第八页：预期结果与时间表

### 录取概率评估
| 目标 | 概率 | 备注 |
|------|------|------|
| MIT/Stanford | 中等 | 顶尖学校，竞争激烈 |
| TOP 20 其他 | 较高 | 申请重点 |
| TOP 50 | 高 | 保底目标 |

### 关键时间节点
- 2025年1月：完成 SAT 考试
- 2025年4月：完成申请文书
- 2025年9月：提交大学申请
- 2026年3月-4月：获得录取决定

---

## 第九页：沟通与反馈

### 后续沟通计划
- 月度进度评审
- 文书修改反馈
- 面试准备指导

### 联系方式
- 电话：[电话号码]
- 邮箱：[邮箱地址]
- 微信：[微信号]

### 致谢
感谢李明及其家人的信任与配合！`,
  },
}
