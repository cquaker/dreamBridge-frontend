"use client"

import { useState, useMemo, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import type { StudentProfile } from "@/lib/types/dreambridge-api-types"

/**
 * 学生画像表单组件
 * 
 * 根据 JSON 结构动态生成表单字段，并预填充值
 */
interface StudentProfileFormProps {
  profile: StudentProfile
  onContinue: (updatedProfile: StudentProfile) => void
}

/**
 * 递归渲染表单字段
 */
function renderFormFields(
  data: any,
  path: string = "",
  onChange: (path: string, value: any) => void
): JSX.Element[] {
  const fields: JSX.Element[] = []

  if (!data || typeof data !== "object") {
    return fields
  }

  // 如果是数组，转换为对象处理
  if (Array.isArray(data)) {
    return fields
  }

  Object.entries(data).forEach(([key, value]) => {
    // 跳过不需要生成表单项的字段
    if (key === "profile_name" || key === "profile_json" || key === "profile_url") {
      return
    }

    const currentPath = path ? `${path}.${key}` : key
    const fieldId = `field-${currentPath.replace(/\./g, "-")}`

    if (value === null || value === undefined) {
      // null 或 undefined 值，渲染为可编辑字段
      fields.push(
        <div key={fieldId} className="space-y-2">
          <label className="text-sm font-medium text-foreground block">
            {key}
          </label>
          <Textarea
            value=""
            onChange={(e) => onChange(currentPath, e.target.value || null)}
            placeholder={`请输入${key}`}
            rows={2}
            className="resize-none"
          />
        </div>
      )
    } else if (typeof value === "string") {
      // 字符串值，根据长度选择 Input 或 Textarea
      const isLongText = value.length > 100 || value.includes("\n") || value.includes("。") || value.includes("，")
      
      if (isLongText) {
        fields.push(
          <div key={fieldId} className="space-y-2">
            <label className="text-sm font-medium text-foreground block">
              {key}
            </label>
            <Textarea
              value={value}
              onChange={(e) => onChange(currentPath, e.target.value)}
              placeholder={`请输入${key}`}
              rows={4}
              className="resize-none"
            />
          </div>
        )
      } else {
        fields.push(
          <div key={fieldId} className="space-y-2">
            <label className="text-sm font-medium text-foreground block">
              {key}
            </label>
            <Input
              value={value}
              onChange={(e) => onChange(currentPath, e.target.value)}
              placeholder={`请输入${key}`}
            />
          </div>
        )
      }
    } else if (typeof value === "number") {
      // 数字值
      fields.push(
        <div key={fieldId} className="space-y-2">
          <label className="text-sm font-medium text-foreground block">
            {key}
          </label>
          <Input
            type="number"
            value={value}
            onChange={(e) => onChange(currentPath, Number.parseFloat(e.target.value) || 0)}
            placeholder={`请输入${key}`}
          />
        </div>
      )
    } else if (typeof value === "boolean") {
      // 布尔值
      fields.push(
        <div key={fieldId} className="space-y-2">
          <label className="text-sm font-medium text-foreground block">
            {key}
          </label>
          <select
            value={value ? "true" : "false"}
            onChange={(e) => onChange(currentPath, e.target.value === "true")}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="true">是</option>
            <option value="false">否</option>
          </select>
        </div>
      )
    } else if (typeof value === "object" && !Array.isArray(value)) {
      // 嵌套对象，递归渲染
      const nestedFields = renderFormFields(value, currentPath, onChange)
      if (nestedFields.length > 0) {
        fields.push(
          <div key={fieldId} className="space-y-4 pt-4 border-t border-border">
            <h3 className="font-bold text-foreground text-lg border-b pb-2">
              {key}
            </h3>
            <div className="space-y-4">{nestedFields}</div>
          </div>
        )
      }
    } else if (Array.isArray(value)) {
      // 数组值，转换为逗号分隔的字符串
      fields.push(
        <div key={fieldId} className="space-y-2">
          <label className="text-sm font-medium text-foreground block">
            {key}
          </label>
          <Input
            value={value.join(", ")}
            onChange={(e) => {
              const arrayValue = e.target.value
                .split(",")
                .map((item) => item.trim())
                .filter(Boolean)
              onChange(currentPath, arrayValue)
            }}
            placeholder={`请输入${key}（用逗号分隔）`}
          />
        </div>
      )
    }
  })

  return fields
}

/**
 * 根据路径更新嵌套对象的值
 */
function updateNestedValue(obj: any, path: string, value: any): any {
  const keys = path.split(".")
  const newObj = { ...obj }
  let current: any = newObj

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i]
    if (!(key in current) || typeof current[key] !== "object" || current[key] === null) {
      current[key] = {}
    } else {
      current[key] = { ...current[key] }
    }
    current = current[key]
  }

  const lastKey = keys[keys.length - 1]
  current[lastKey] = value

  return newObj
}

export function StudentProfileForm({ profile: initialProfile, onContinue }: StudentProfileFormProps) {
  const [profile, setProfile] = useState(initialProfile)
  const [loading, setLoading] = useState(false)

  // 处理字段值变化
  const handleFieldChange = useCallback((path: string, value: any) => {
    setProfile((prev) => updateNestedValue(prev, path, value))
  }, [])

  // 生成表单字段
  const formFields = useMemo(() => {
    return renderFormFields(profile, "", handleFieldChange)
  }, [profile, handleFieldChange])

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

      {/* 动态生成的表单字段 */}
      <div className="space-y-6">{formFields}</div>

      {/* 操作按钮 */}
      <div className="flex gap-3 justify-end pt-6 border-t border-border">
        <Button 
          variant="outline" 
          onClick={handleReset}
          disabled={loading}
          className="hidden"
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
