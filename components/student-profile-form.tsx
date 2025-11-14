"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import type { StudentProfile } from "@/lib/types/dreambridge-api-types"

/**
 * 学生画像表单组件
 * 
 * 用于用户确认和编辑从音频提取的学生画像信息
 */
interface StudentProfileFormProps {
  profile: StudentProfile
  onContinue: (updatedProfile: StudentProfile) => void
}

export function StudentProfileForm({ profile: initialProfile, onContinue }: StudentProfileFormProps) {
  const [profile, setProfile] = useState(initialProfile)
  const [loading, setLoading] = useState(false)

  // 更新嵌套字段
  const updateBasicInfo = (field: keyof StudentProfile["basic_info"], value: any) => {
    setProfile({
      ...profile,
      basic_info: {
        ...profile.basic_info,
        [field]: value,
      },
    })
  }

  const updateAcademic = (field: string, value: any) => {
    setProfile({
      ...profile,
      academic: {
        ...profile.academic,
        [field]: value,
      },
    })
  }

  const updateGoals = (field: string, value: any) => {
    setProfile({
      ...profile,
      goals: {
        ...profile.goals,
        [field]: value,
      },
    })
  }

  const updateFamily = (field: string, value: any) => {
    setProfile({
      ...profile,
      family: {
        ...profile.family,
        [field]: value,
      },
    })
  }

  const updateInterests = (value: string) => {
    // 将逗号分隔的字符串转换为数组
    const interests = value.split(",").map((item) => item.trim()).filter(Boolean)
    setProfile({
      ...profile,
      interests,
    })
  }

  // 模拟异步延迟，提交表单后回调父组件
  const handleContinue = async () => {
    setLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 500))
    onContinue(profile)
    setLoading(false)
  }

  const handleReset = () => {
    setProfile(initialProfile)
  }

  return (
    <Card className="p-6 space-y-6 border-2 border-blue-500 dark:border-blue-700">
      <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded border border-blue-200 dark:border-blue-800">
        <p className="text-sm text-foreground font-medium">
          ✏️ 请检查并编辑以下信息，确认无误后点击「确认并继续」
        </p>
      </div>

      {/* 基本信息 */}
      <div className="space-y-4">
        <h3 className="font-bold text-foreground text-lg border-b pb-2">👤 基本信息</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-foreground block mb-2">学生姓名 *</label>
            <Input
              value={profile.basic_info?.name || ""}
              onChange={(e) => updateBasicInfo("name", e.target.value)}
              placeholder="请输入姓名"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground block mb-2">性别</label>
            <Input
              value={profile.basic_info?.gender || ""}
              onChange={(e) => updateBasicInfo("gender", e.target.value)}
              placeholder="男/女"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground block mb-2">年龄</label>
            <Input
              type="number"
              value={profile.basic_info?.age || ""}
              onChange={(e) => updateBasicInfo("age", Number.parseInt(e.target.value) || undefined)}
              placeholder="请输入年龄"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground block mb-2">年级</label>
            <Input
              value={profile.basic_info?.grade || ""}
              onChange={(e) => updateBasicInfo("grade", e.target.value)}
              placeholder="例如: 高二"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground block mb-2">当前学校</label>
            <Input
              value={profile.basic_info?.school || ""}
              onChange={(e) => updateBasicInfo("school", e.target.value)}
              placeholder="请输入学校名称"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground block mb-2">联系方式</label>
            <Input
              value={profile.basic_info?.contact || ""}
              onChange={(e) => updateBasicInfo("contact", e.target.value)}
              placeholder="电话或邮箱"
            />
          </div>
        </div>
      </div>

      {/* 学术成绩 */}
      <div className="space-y-4 pt-4 border-t border-border">
        <h3 className="font-bold text-foreground text-lg border-b pb-2">📚 学术成绩</h3>
        
        {/* GPA */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-foreground block mb-2">GPA</label>
            <Input
              type="number"
              step="0.01"
              min="0"
              max="4"
              value={profile.academic?.gpa || ""}
              onChange={(e) => updateAcademic("gpa", Number.parseFloat(e.target.value) || undefined)}
              placeholder="例如: 3.8"
            />
          </div>
        </div>

        {/* 标准化考试成绩 */}
        <div>
          <h4 className="text-sm font-semibold text-foreground mb-3">标准化考试成绩</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground block mb-2">托福 (TOEFL)</label>
              <Input
                type="number"
                min="0"
                max="120"
                value={profile.academic?.test_scores?.toefl || ""}
                onChange={(e) =>
                  updateAcademic("test_scores", {
                    ...profile.academic?.test_scores,
                    toefl: Number.parseInt(e.target.value) || undefined,
                  })
                }
                placeholder="0-120"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground block mb-2">雅思 (IELTS)</label>
              <Input
                type="number"
                step="0.5"
                min="0"
                max="9"
                value={profile.academic?.test_scores?.ielts || ""}
                onChange={(e) =>
                  updateAcademic("test_scores", {
                    ...profile.academic?.test_scores,
                    ielts: Number.parseFloat(e.target.value) || undefined,
                  })
                }
                placeholder="0-9"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground block mb-2">SAT</label>
              <Input
                type="number"
                min="400"
                max="1600"
                value={profile.academic?.test_scores?.sat || ""}
                onChange={(e) =>
                  updateAcademic("test_scores", {
                    ...profile.academic?.test_scores,
                    sat: Number.parseInt(e.target.value) || undefined,
                  })
                }
                placeholder="400-1600"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground block mb-2">ACT</label>
              <Input
                type="number"
                min="1"
                max="36"
                value={profile.academic?.test_scores?.act || ""}
                onChange={(e) =>
                  updateAcademic("test_scores", {
                    ...profile.academic?.test_scores,
                    act: Number.parseInt(e.target.value) || undefined,
                  })
                }
                placeholder="1-36"
              />
            </div>
          </div>
        </div>

        {/* 主修科目 */}
        <div>
          <label className="text-sm font-medium text-foreground block mb-2">主修科目</label>
          <Input
            value={profile.academic?.subjects?.join(", ") || ""}
            onChange={(e) =>
              updateAcademic(
                "subjects",
                e.target.value.split(",").map((s) => s.trim()).filter(Boolean)
              )
            }
            placeholder="例如: 数学, 物理, 化学（用逗号分隔）"
          />
        </div>

        {/* 学术成就 */}
        <div>
          <label className="text-sm font-medium text-foreground block mb-2">学术成就</label>
          <Textarea
            value={profile.academic?.achievements?.join("\n") || ""}
            onChange={(e) =>
              updateAcademic(
                "achievements",
                e.target.value.split("\n").filter(Boolean)
              )
            }
            placeholder="例如：&#10;- 全国数学竞赛一等奖&#10;- 科研论文发表&#10;（每行一项）"
            rows={3}
            className="resize-none"
          />
        </div>

        {/* 课外活动 */}
        <div>
          <label className="text-sm font-medium text-foreground block mb-2">课外活动</label>
          <Textarea
            value={profile.academic?.activities?.join("\n") || ""}
            onChange={(e) =>
              updateAcademic(
                "activities",
                e.target.value.split("\n").filter(Boolean)
              )
            }
            placeholder="例如：&#10;- 学生会主席&#10;- 志愿者活动&#10;（每行一项）"
            rows={3}
            className="resize-none"
          />
        </div>
      </div>

      {/* 兴趣爱好 */}
      <div className="space-y-4 pt-4 border-t border-border">
        <h3 className="font-bold text-foreground text-lg border-b pb-2">🎨 兴趣爱好</h3>
        <div>
          <label className="text-sm font-medium text-foreground block mb-2">兴趣爱好</label>
          <Input
            value={profile.interests?.join(", ") || ""}
            onChange={(e) => updateInterests(e.target.value)}
            placeholder="例如: 编程, 阅读, 音乐, 运动（用逗号分隔）"
          />
        </div>
      </div>

      {/* 申请意向 */}
      <div className="space-y-4 pt-4 border-t border-border">
        <h3 className="font-bold text-foreground text-lg border-b pb-2">🎯 申请意向</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-foreground block mb-2">目标国家</label>
            <Input
              value={profile.goals?.target_countries?.join(", ") || ""}
              onChange={(e) =>
                updateGoals(
                  "target_countries",
                  e.target.value.split(",").map((s) => s.trim()).filter(Boolean)
                )
              }
              placeholder="例如: 美国, 英国, 加拿大（用逗号分隔）"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground block mb-2">专业方向</label>
            <Input
              value={profile.goals?.target_majors?.join(", ") || ""}
              onChange={(e) =>
                updateGoals(
                  "target_majors",
                  e.target.value.split(",").map((s) => s.trim()).filter(Boolean)
                )
              }
              placeholder="例如: 计算机科学, 人工智能（用逗号分隔）"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground block mb-2">目标学校层级</label>
            <Input
              value={profile.goals?.target_school_tier || ""}
              onChange={(e) => updateGoals("target_school_tier", e.target.value)}
              placeholder="例如: TOP 20, TOP 50"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground block mb-2">申请时间规划</label>
            <Input
              value={profile.goals?.application_timeline || ""}
              onChange={(e) => updateGoals("application_timeline", e.target.value)}
              placeholder="例如: 2025年秋季入学"
            />
          </div>
        </div>
      </div>

      {/* 家庭背景 */}
      <div className="space-y-4 pt-4 border-t border-border">
        <h3 className="font-bold text-foreground text-lg border-b pb-2">👨‍👩‍👧‍👦 家庭背景</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium text-foreground block mb-2">父母职业</label>
            <Input
              value={profile.family?.parents_occupation || ""}
              onChange={(e) => updateFamily("parents_occupation", e.target.value)}
              placeholder="例如: 教师, 工程师"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground block mb-2">家庭年收入</label>
            <Input
              value={profile.family?.family_income || ""}
              onChange={(e) => updateFamily("family_income", e.target.value)}
              placeholder="例如: 50-100万"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground block mb-2">留学预算</label>
            <Input
              value={profile.family?.budget || ""}
              onChange={(e) => updateFamily("budget", e.target.value)}
              placeholder="例如: 50万/年"
            />
          </div>
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="flex gap-3 justify-end pt-6 border-t border-border">
        <Button 
          variant="outline" 
          onClick={handleReset}
          disabled={loading}
        >
          重置
        </Button>
        <Button 
          onClick={handleContinue} 
          disabled={loading} 
          className="bg-blue-600 hover:bg-blue-700 text-white px-8"
        >
          {loading ? "处理中..." : "✓ 确认并继续"}
        </Button>
      </div>
    </Card>
  )
}
