"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"

interface StudentProfileFormProps {
  profile: any
  onContinue: (updatedProfile: any) => void
}

export function StudentProfileForm({ profile: initialProfile, onContinue }: StudentProfileFormProps) {
  const [profile, setProfile] = useState(initialProfile)
  const [loading, setLoading] = useState(false)

  // 根据分类与字段更新嵌套对象，保持不可变数据结构
  const updateField = (category: string, field: string, value: any) => {
    setProfile({
      ...profile,
      [category]: {
        ...profile[category],
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
              value={profile["基本信息"]?.姓名 || ""}
              onChange={(e) => updateField("基本信息", "姓名", e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground block mb-2">当前学校</label>
            <Input
              value={profile["基本信息"]?.当前学校 || ""}
              onChange={(e) => updateField("基本信息", "当前学校", e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground block mb-2">年级</label>
            <Input
              value={profile["基本信息"]?.年级 || ""}
              onChange={(e) => updateField("基本信息", "年级", e.target.value)}
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
              value={profile["学术成绩"]?.GPA || ""}
              onChange={(e) => updateField("学术成绩", "GPA", Number.parseFloat(e.target.value) || 0)}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground block mb-2">托福成绩</label>
            <Input
              type="number"
              value={profile["学术成绩"]?.托福成绩 || ""}
              onChange={(e) => updateField("学术成绩", "托福成绩", Number.parseInt(e.target.value) || 0)}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground block mb-2">SAT 成绩</label>
            <Input
              type="number"
              value={profile["学术成绩"]?.SAT || ""}
              onChange={(e) => updateField("学术成绩", "SAT", Number.parseInt(e.target.value) || 0)}
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
            <label className="text-sm font-medium text-foreground block mb-2">目标排名</label>
            <Input
              value={profile["申请意向"]?.目标排名 || ""}
              onChange={(e) => updateField("申请意向", "目标排名", e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground block mb-2">专业方向</label>
            <Input
              value={profile["申请意向"]?.专业方向 || ""}
              onChange={(e) => updateField("申请意向", "专业方向", e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground block mb-2">时间规划</label>
            <Input
              value={profile["申请意向"]?.时间规划 || ""}
              onChange={(e) => updateField("申请意向", "时间规划", e.target.value)}
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
