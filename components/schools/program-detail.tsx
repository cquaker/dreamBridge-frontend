"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MarkdownContent } from "./markdown-content"
import { ArrowLeft, BookOpen } from "lucide-react"
import type { School, Program } from "@/lib/types/school-types"

interface ProgramDetailProps {
  school: School
  program: Program
}

export function ProgramDetail({ school, program }: ProgramDetailProps) {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 h-16">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/schools/${school.id}/programs`)}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              返回专业列表
            </Button>
            <div className="flex-1">
              <h1 className="text-lg font-semibold text-foreground line-clamp-1">{program.title}</h1>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 专业基本信息 */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-2xl mb-2">{program.title}</CardTitle>
                {program.partnerUniversity && program.partnerUniversity !== "待补充" && (
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline">合作大学</Badge>
                    <span className="text-muted-foreground">{program.partnerUniversity}</span>
                  </div>
                )}
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* 专业详细内容 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              专业详情
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-slate max-w-none">
              <MarkdownContent content={program.content} />
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

