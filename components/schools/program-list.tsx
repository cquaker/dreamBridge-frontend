"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Search, BookOpen } from "lucide-react"
import type { School, Program } from "@/lib/types/school-types"

interface ProgramListProps {
  school: School
  programs: Program[]
}

export function ProgramList({ school, programs }: ProgramListProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [partnerFilter, setPartnerFilter] = useState<string>("all")
  const [levelFilter, setLevelFilter] = useState<string>("all")

  // 提取所有合作大学
  const partnerUniversities = useMemo(() => {
    const partners = new Set<string>()
    programs.forEach(p => {
      if (p.partnerUniversity && p.partnerUniversity !== "待补充") {
        partners.add(p.partnerUniversity)
      }
    })
    return Array.from(partners).sort()
  }, [programs])

  // 提取学历层次
  const getProgramLevel = (title: string): string => {
    if (title.includes("Certificate") || title.includes("证书")) return "证书"
    if (title.includes("Diploma") || title.includes("文凭")) {
      if (title.includes("Advanced") || title.includes("高级")) return "高级文凭"
      if (title.includes("Postgraduate") || title.includes("研究生")) return "研究生文凭"
      return "文凭"
    }
    if (title.includes("Bachelor") || title.includes("学士")) return "学士"
    if (title.includes("Master") || title.includes("硕士")) return "硕士"
    if (title.includes("Preparatory") || title.includes("预备")) return "预备课程"
    return "其他"
  }

  // 筛选程序
  const filteredPrograms = useMemo(() => {
    return programs.filter(program => {
      // 搜索筛选
      const matchesSearch = 
        searchQuery === "" ||
        program.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (program.partnerUniversity && program.partnerUniversity.toLowerCase().includes(searchQuery.toLowerCase()))

      // 合作大学筛选
      const matchesPartner = 
        partnerFilter === "all" ||
        (partnerFilter === "none" && !program.partnerUniversity) ||
        program.partnerUniversity === partnerFilter

      // 学历层次筛选
      const level = getProgramLevel(program.title)
      const matchesLevel = levelFilter === "all" || level === levelFilter

      return matchesSearch && matchesPartner && matchesLevel
    })
  }, [programs, searchQuery, partnerFilter, levelFilter])

  const handleProgramClick = (programId: string) => {
    router.push(`/schools/${school.id}/programs/${encodeURIComponent(programId)}`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 dark:from-muted/10 dark:via-muted/20 dark:to-muted/30">
      <nav className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 h-16">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/schools/${school.id}`)}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              返回学校详情
            </Button>
            <div className="flex-1">
              <h1 className="text-lg font-semibold text-foreground">{school.name} - 专业列表</h1>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 搜索和筛选 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>搜索和筛选</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="搜索专业名称或合作大学..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={partnerFilter} onValueChange={setPartnerFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="选择合作大学" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">所有合作大学</SelectItem>
                  <SelectItem value="none">无合作大学</SelectItem>
                  {partnerUniversities.map(partner => (
                    <SelectItem key={partner} value={partner}>{partner}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={levelFilter} onValueChange={setLevelFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="选择学历层次" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">所有层次</SelectItem>
                  <SelectItem value="证书">证书</SelectItem>
                  <SelectItem value="文凭">文凭</SelectItem>
                  <SelectItem value="高级文凭">高级文凭</SelectItem>
                  <SelectItem value="研究生文凭">研究生文凭</SelectItem>
                  <SelectItem value="学士">学士</SelectItem>
                  <SelectItem value="硕士">硕士</SelectItem>
                  <SelectItem value="预备课程">预备课程</SelectItem>
                  <SelectItem value="其他">其他</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="mt-4 text-sm text-muted-foreground">
              找到 {filteredPrograms.length} 个专业（共 {programs.length} 个）
            </div>
          </CardContent>
        </Card>

        {/* 专业列表 */}
        {filteredPrograms.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">没有找到匹配的专业</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPrograms.map((program) => {
              const level = getProgramLevel(program.title)
              return (
                <Card
                  key={program.id}
                  className="group cursor-pointer border border-border rounded-xl bg-card shadow-sm hover:shadow-xl hover:border-primary/40 transition-all duration-300 hover:-translate-y-1 h-full flex flex-col"
                  onClick={() => handleProgramClick(program.id)}
                >
                  <CardHeader>
                    <CardTitle className="text-lg line-clamp-2 group-hover:text-primary transition-colors duration-300">{program.title}</CardTitle>
                    {program.partnerUniversity && program.partnerUniversity !== "待补充" && (
                      <CardDescription className="mt-2 group-hover:text-foreground/80 transition-colors duration-300">
                        合作大学: {program.partnerUniversity}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col justify-end">
                    <Badge variant="secondary" className="w-fit group-hover:bg-primary/10 group-hover:text-primary transition-colors duration-300">
                      {level}
                    </Badge>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}

