"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
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

  // 模拟异步延迟，提交表单后回调父组件
  const handleContinue = async () => {
    setLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 500))
    onContinue(profile)
    setLoading(false)
  }

  return (
    <Card className="p-6 space-y-6 border-2 border-blue-500">
      <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded border border-blue-200 dark:border-blue-800">
        <p className="text-sm text-foreground font-medium">请检查并编辑以下信息，确认无误后点击「确认并继续」</p>
      </div>

      {/* 基本信息 */}
      <div className="space-y-4">
        <h3 className="font-bold text-foreground text-lg">基本信息</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-foreground block mb-2">学生姓名</label>
            <Input
              value={profile.basic_info?.name || ""}
              onChange={(e) => updateBasicInfo("name", e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground block mb-2">当前学校</label>
            <Input
              value={profile.basic_info?.school || ""}
              onChange={(e) => updateBasicInfo("school", e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground block mb-2">年级</label>
            <Input
              value={profile.basic_info?.grade || ""}
              onChange={(e) => updateBasicInfo("grade", e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground block mb-2">年龄</label>
            <Input
              type="number"
              value={profile.basic_info?.age || ""}
              onChange={(e) => updateBasicInfo("age", Number.parseInt(e.target.value) || undefined)}
            />
          </div>
        </div>
      </div>

      {/* 学术成绩 */}
      <div className="space-y-4 pt-4 border-t border-border">
        <h3 className="font-bold text-foreground text-lg">学术成绩</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium text-foreground block mb-2">GPA</label>
            <Input
              type="number"
              step="0.1"
              value={profile.academic?.gpa || ""}
              onChange={(e) => updateAcademic("gpa", Number.parseFloat(e.target.value) || 0)}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground block mb-2">托福成绩</label>
            <Input
              type="number"
              value={profile.academic?.test_scores?.toefl || ""}
              onChange={(e) =>
                updateAcademic("test_scores", {
                  ...profile.academic?.test_scores,
                  toefl: Number.parseInt(e.target.value) || 0,
                })
              }
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground block mb-2">SAT 成绩</label>
            <Input
              type="number"
              value={profile.academic?.test_scores?.sat || ""}
              onChange={(e) =>
                updateAcademic("test_scores", {
                  ...profile.academic?.test_scores,
                  sat: Number.parseInt(e.target.value) || 0,
                })
              }
              placeholder="待考"
            />
          </div>
        </div>
      </div>

      {/* 申请意向 */}
      <div className="space-y-4 pt-4 border-t border-border">
        <h3 className="font-bold text-foreground text-lg">申请意向</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-foreground block mb-2">目标学校层级</label>
            <Input
              value={profile.goals?.target_school_tier || ""}
              onChange={(e) => updateGoals("target_school_tier", e.target.value)}
              placeholder="例如: TOP 20"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground block mb-2">专业方向</label>
            <Input
              value={profile.goals?.target_majors?.[0] || ""}
              onChange={(e) => updateGoals("target_majors", [e.target.value])}
              placeholder="例如: 计算机科学"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground block mb-2">时间规划</label>
            <Input
              value={profile.goals?.application_timeline || ""}
              onChange={(e) => updateGoals("application_timeline", e.target.value)}
              placeholder="例如: 2024年秋季入学"
            />
          </div>
        </div>
      </div>

      {/* 操作按钮：重置/继续 */}
      <div className="flex gap-3 justify-end pt-4 border-t border-border">
        <Button variant="outline">重置</Button>
        <Button onClick={handleContinue} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
          {loading ? "处理中..." : "确认并继续"}
        </Button>
      </div>
    </Card>
  )
}
