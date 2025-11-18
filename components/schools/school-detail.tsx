"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MarkdownContent } from "./markdown-content"
import { ArrowLeft, BookOpen, GraduationCap } from "lucide-react"
import type { School } from "@/lib/types/school-types"

interface SchoolDetailProps {
  school: School
}

export function SchoolDetail({ school }: SchoolDetailProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("chapter-1")

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 h-16">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/')}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              返回首页
            </Button>
            <div className="flex-1">
              <h1 className="text-lg font-semibold text-foreground">{school.name}</h1>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 学校概览卡片 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5" />
              学校概览
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">专业数量</p>
                <p className="text-2xl font-bold">{school.programCount}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">文件总数</p>
                <p className="text-2xl font-bold">{school.index.total_files}</p>
              </div>
              <div>
                <Button
                  onClick={() => router.push(`/schools/${school.id}/programs`)}
                  className="w-full"
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  查看所有专业
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 章节内容 */}
        <Card>
          <CardHeader>
            <CardTitle>学校详细信息</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                {school.chapters.map((chapter) => (
                  <TabsTrigger key={chapter.id} value={`chapter-${chapter.id}`}>
                    {chapter.title}
                  </TabsTrigger>
                ))}
              </TabsList>
              {school.chapters.map((chapter) => (
                <TabsContent key={chapter.id} value={`chapter-${chapter.id}`} className="mt-6">
                  <div className="prose prose-slate max-w-none">
                    <MarkdownContent content={chapter.content} />
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

