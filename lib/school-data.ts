import fs from 'fs'
import path from 'path'
import type { School, SchoolIndex, Program } from './types/school-types'

const SCHOOLS_DATA_DIR = path.join(process.cwd(), 'data', 'schools')

// 获取学校ID的短名称（从 www.eaim.edu 提取 eaim）
function getShortSchoolId(schoolId: string): string {
  return schoolId
    .replace(/^www\./, '')
    .replace(/\.(edu|com|org)(\.sg)?$/, '')
    .replace(/\./g, '_')
}

// 读取学校索引文件（支持新旧两种格式）
export function getSchoolIndex(schoolId: string): SchoolIndex | null {
  try {
    const shortId = getShortSchoolId(schoolId)
    // 先尝试新格式，再尝试旧格式
    const newIndexPath = path.join(SCHOOLS_DATA_DIR, schoolId, `${shortId}_index.json`)
    const oldIndexPath = path.join(SCHOOLS_DATA_DIR, schoolId, `${schoolId}_文件分类索引.json`)
    
    let indexPath = newIndexPath
    if (!fs.existsSync(newIndexPath) && fs.existsSync(oldIndexPath)) {
      indexPath = oldIndexPath
    }
    
    const fileContent = fs.readFileSync(indexPath, 'utf-8')
    return JSON.parse(fileContent)
  } catch (error) {
    console.error(`Error reading school index for ${schoolId}:`, error)
    return null
  }
}

// 读取章节文件
export function getChapterContent(schoolId: string, chapterFilename: string): string | null {
  try {
    const chapterPath = path.join(SCHOOLS_DATA_DIR, schoolId, chapterFilename)
    return fs.readFileSync(chapterPath, 'utf-8')
  } catch (error) {
    console.error(`Error reading chapter ${chapterFilename}:`, error)
    return null
  }
}

// 获取所有章节（支持新旧两种格式）
export function getSchoolChapters(schoolId: string): { id: number; title: string; filename: string; content: string }[] {
  const chapters: { id: number; title: string; filename: string; content: string }[] = []
  const shortId = getShortSchoolId(schoolId)
  const schoolDir = path.join(SCHOOLS_DATA_DIR, schoolId)
  
  // 扫描章节文件（第1章节到第4章节）
  for (let i = 1; i <= 4; i++) {
    try {
      const files = fs.readdirSync(schoolDir)
      // 先尝试新格式：shortId_ch1_xxx.md
      let chapterFile = files.find(f => f.startsWith(`${shortId}_ch${i}_`) && f.endsWith('.md'))
      // 如果找不到，尝试旧格式：schoolId_第i章节_xxx.md
      if (!chapterFile) {
        const oldPattern = `${schoolId}_第${i}章节_`
        chapterFile = files.find(f => f.startsWith(oldPattern) && f.endsWith('.md'))
      }
      
      if (chapterFile) {
        const content = getChapterContent(schoolId, chapterFile)
        if (content) {
          // 从内容中提取标题（第一行的 # 标题）
          const titleMatch = content.match(/^#\s+(.+)$/m)
          const title = titleMatch ? titleMatch[1] : `第${i}章节`
          
          chapters.push({
            id: i,
            title,
            filename: chapterFile,
            content
          })
        }
      }
    } catch (error) {
      console.error(`Error reading chapter ${i} for ${schoolId}:`, error)
    }
  }
  
  return chapters
}

// 获取学校信息
export function getSchool(schoolId: string): School | null {
  const index = getSchoolIndex(schoolId)
  if (!index) return null
  
  const chapters = getSchoolChapters(schoolId)
  
  // 统计专业数量
  const programsDir = path.join(SCHOOLS_DATA_DIR, schoolId, 'programs')
  let programCount = 0
  try {
    if (fs.existsSync(programsDir)) {
      const files = fs.readdirSync(programsDir)
      programCount = files.filter(f => f.endsWith('.md') && f.includes('项目_')).length
    }
  } catch (error) {
    console.error(`Error counting programs for ${schoolId}:`, error)
  }
  
  return {
    id: schoolId,
    name: index.school_name,
    index,
    chapters,
    programCount
  }
}

// 获取所有学校列表
export function getAllSchools(): School[] {
  const schools: School[] = []
  
  try {
    if (!fs.existsSync(SCHOOLS_DATA_DIR)) {
      return schools
    }
    
    const dirs = fs.readdirSync(SCHOOLS_DATA_DIR, { withFileTypes: true })
    
    for (const dir of dirs) {
      if (dir.isDirectory()) {
        const schoolId = dir.name
        const school = getSchool(schoolId)
        if (school) {
          schools.push(school)
        }
      }
    }
  } catch (error) {
    console.error('Error reading schools directory:', error)
  }
  
  return schools
}

// 获取专业列表（支持新旧两种格式）
export function getPrograms(schoolId: string): Program[] {
  const programs: Program[] = []
  const programsDir = path.join(SCHOOLS_DATA_DIR, schoolId, 'programs')
  const shortId = getShortSchoolId(schoolId)
  
  try {
    if (!fs.existsSync(programsDir)) {
      return programs
    }
    
    const files = fs.readdirSync(programsDir)
    // 支持新格式：shortId_p_xxx.md 和旧格式：schoolId_项目_xxx.md
    const programFiles = files.filter(f => 
      f.endsWith('.md') && 
      (f.startsWith(`${shortId}_p_`) || f.includes('项目_'))
    )
    
    for (const file of programFiles) {
      try {
        const filePath = path.join(programsDir, file)
        const content = fs.readFileSync(filePath, 'utf-8')
        
        // 提取标题（第一行的 # 标题）
        const titleMatch = content.match(/^#\s+(.+)$/m)
        const title = titleMatch ? titleMatch[1] : file.replace('.md', '')
        
        // 提取合作大学（如果有）
        const partnerMatch = content.match(/\*\*合作大学\*\*:\s*(.+)/)
        const partnerUniversity = partnerMatch ? partnerMatch[1].trim() : undefined
        
        // 生成ID（从文件名，支持新旧格式）
        let id = file.replace('.md', '')
        if (file.startsWith(`${shortId}_p_`)) {
          id = id.replace(`${shortId}_p_`, '')
        } else if (file.includes('项目_')) {
          id = id.replace(`${schoolId}_项目_`, '')
        }
        
        programs.push({
          id,
          filename: file,
          title,
          content,
          partnerUniversity
        })
      } catch (error) {
        console.error(`Error reading program file ${file}:`, error)
      }
    }
  } catch (error) {
    console.error(`Error reading programs for ${schoolId}:`, error)
  }
  
  return programs
}

// 获取单个专业
export function getProgram(schoolId: string, programId: string): Program | null {
  const programs = getPrograms(schoolId)
  return programs.find(p => p.id === programId || p.filename.includes(programId)) || null
}

