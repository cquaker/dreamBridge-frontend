"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { GraduationCap, Users, BookOpen } from "lucide-react"
import type { School } from "@/lib/types/school-types"

interface SchoolCardProps {
  school: School
  onClick: () => void
}

export function SchoolCard({ school, onClick }: SchoolCardProps) {
  // 从第1章节提取学生人数
  const chapter1 = school.chapters.find(c => c.id === 1)
  const extractStudentCount = (content: string): string | null => {
    // 匹配模式：**学生人数**：...约X名... 或 学生人数：...约X名...
    const patterns = [
      /\*\*学生人数\*\*[：:]\s*[^，,。.\n]*?约?\s*([\d,，]+)\s*名[^，,。.\n]*/,
      /学生人数[：:]\s*[^，,。.\n]*?约?\s*([\d,，]+)\s*名[^，,。.\n]*/,
      /约\s*([\d,，]+)\s*名[^，,。.\n]*学生/,
    ]
    
    for (const pattern of patterns) {
      const match = content.match(pattern)
      if (match && match[1]) {
        // 清理数字，移除逗号和中文逗号
        const count = match[1].replace(/[,，]/g, '')
        return count
      }
    }
    return null
  }
  
  const studentCount = chapter1 ? extractStudentCount(chapter1.content) : null
  const studentCountText = studentCount ? `约 ${parseInt(studentCount).toLocaleString()} 名学生` : null
  
  // 从章节内容中提取学校类型和地区信息
  const extractSchoolType = (): string | null => {
    // 优先从第2章节提取（办学资质章节通常有更准确的信息）
    const chapter2 = school.chapters.find(c => c.id === 2)
    const chapter1Content = chapter1?.content || ''
    const chapter2Content = chapter2?.content || ''
    const allContent = chapter1Content + '\n' + chapter2Content
    
    // 提取地区信息
    const regionPatterns: Array<{ pattern: RegExp; name: string }> = [
      { pattern: /新加坡/, name: '新加坡' },
      { pattern: /中国/, name: '中国' },
      { pattern: /美国/, name: '美国' },
      { pattern: /英国/, name: '英国' },
      { pattern: /澳大利亚/, name: '澳大利亚' },
      { pattern: /加拿大/, name: '加拿大' },
    ]
    
    let region: string | null = null
    for (const { pattern, name } of regionPatterns) {
      if (pattern.test(allContent)) {
        region = name
        break
      }
    }
    
    // 提取学校类型
    const typePatterns: Array<{ pattern: RegExp; type: string }> = [
      { pattern: /私立教育机构|私立院校|私立学院|PEI/, type: '私立' },
      { pattern: /公立大学|公立院校/, type: '公立' },
      { pattern: /大学/, type: '大学' },
      { pattern: /学院/, type: '学院' },
    ]
    
    let schoolType: string | null = null
    for (const { pattern, type } of typePatterns) {
      if (pattern.test(allContent)) {
        schoolType = type
        break
      }
    }
    
    // 组合地区和类型
    if (region && schoolType) {
      return `${region}${schoolType}${schoolType === '大学' || schoolType === '学院' ? '' : '院校'}`
    } else if (region) {
      return `${region}院校`
    } else if (schoolType) {
      return schoolType === '大学' || schoolType === '学院' ? schoolType : `${schoolType}院校`
    }
    
    return null
  }
  
  const schoolTypeText = extractSchoolType()
  
  return (
    <Card 
      className="group cursor-pointer border border-border rounded-xl bg-card shadow-sm hover:shadow-xl hover:border-primary/40 transition-all duration-300 hover:-translate-y-1 h-full flex flex-col"
      onClick={onClick}
    >
      <CardHeader>
        <CardTitle className="text-xl group-hover:text-primary transition-colors duration-300">
          {school.name}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-end">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1 group-hover:text-foreground transition-colors duration-300">
            <BookOpen className="w-4 h-4" />
            <span>{school.programCount} 个专业</span>
          </div>
          {studentCountText && (
            <div className="flex items-center gap-1 group-hover:text-foreground transition-colors duration-300">
              <Users className="w-4 h-4" />
              <span>{studentCountText}</span>
            </div>
          )}
        </div>
        {schoolTypeText && (
          <div className="mt-3">
            <Badge variant="secondary" className="text-xs group-hover:bg-primary/10 group-hover:text-primary transition-colors duration-300">
              {schoolTypeText}
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

