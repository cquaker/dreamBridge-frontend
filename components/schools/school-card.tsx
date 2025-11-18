"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { GraduationCap, Users, BookOpen, UserCheck, Building2 } from "lucide-react"
import type { School } from "@/lib/types/school-types"

interface SchoolCardProps {
  school: School
  onClick: () => void
}

export function SchoolCard({ school, onClick }: SchoolCardProps) {
  // 从索引文件的 metadata 中读取数据
  const metadata = school.index.metadata
  
  // 构建信息列表
  const infoItems = []
  
  // 专业数量（始终显示）
  infoItems.push({
    icon: BookOpen,
    text: `${school.programCount} 个专业`
  })
  
  // 学生人数
  if (metadata?.studentCount) {
    infoItems.push({
      icon: Users,
      text: `约 ${metadata.studentCount.toLocaleString()} 名学生`
    })
  }
  
  // 教师人数
  if (metadata?.teacherCount) {
    infoItems.push({
      icon: UserCheck,
      text: `约 ${metadata.teacherCount.toLocaleString()} 名教师`
    })
  }
  
  // 合作大学数量
  if (metadata?.partnerUniversityCount) {
    infoItems.push({
      icon: Building2,
      text: `${metadata.partnerUniversityCount} 所合作大学`
    })
  }
  
  // 学校类型
  const schoolTypeText = metadata?.schoolTypeDisplay || null
  
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
        {/* 信息列表 */}
        <div className="space-y-2 mb-4">
          {infoItems.map((item, index) => {
            const Icon = item.icon
            return (
              <div 
                key={index}
                className="flex items-center gap-2 text-sm text-muted-foreground group-hover:text-foreground transition-colors duration-300"
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span>{item.text}</span>
              </div>
            )
          })}
        </div>
        
        {/* 学校类型标签 */}
        {schoolTypeText && (
          <div className="mt-3 pt-3 border-t border-border/50">
            <Badge variant="secondary" className="text-xs group-hover:bg-primary/10 group-hover:text-primary transition-colors duration-300">
              {schoolTypeText}
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

