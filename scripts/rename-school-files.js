const fs = require('fs')
const path = require('path')

const SCHOOLS_DATA_DIR = path.join(__dirname, '..', 'data', 'schools')

// 获取学校ID的短名称（从 www.eaim.edu 提取 eaim）
function getShortSchoolId(schoolId) {
  // 移除 www. 和 .edu.sg/.edu/.com.sg 等后缀
  let short = schoolId
    .replace(/^www\./, '')
    .replace(/\.(edu|com|org)(\.sg)?$/, '')
    .replace(/\./g, '_')
  return short
}

// 重命名学校目录下的文件
function renameSchoolFiles(schoolId) {
  const schoolDir = path.join(SCHOOLS_DATA_DIR, schoolId)
  const shortId = getShortSchoolId(schoolId)
  
  if (!fs.existsSync(schoolDir)) {
    console.log(`目录不存在: ${schoolDir}`)
    return
  }
  
  console.log(`\n处理学校: ${schoolId} -> ${shortId}`)
  
  // 1. 重命名索引文件
  const oldIndexFile = `${schoolId}_文件分类索引.json`
  const newIndexFile = `${shortId}_index.json`
  const oldIndexPath = path.join(schoolDir, oldIndexFile)
  const newIndexPath = path.join(schoolDir, newIndexFile)
  
  if (fs.existsSync(oldIndexPath)) {
    fs.renameSync(oldIndexPath, newIndexPath)
    console.log(`  ✓ 索引文件: ${oldIndexFile} -> ${newIndexFile}`)
  }
  
  // 2. 重命名章节文件
  for (let i = 1; i <= 4; i++) {
    const pattern = `${schoolId}_第${i}章节_`
    const files = fs.readdirSync(schoolDir)
    const chapterFile = files.find(f => f.startsWith(pattern) && f.endsWith('.md'))
    
    if (chapterFile) {
      // 提取章节标题（去掉前缀和后缀）
      const title = chapterFile
        .replace(pattern, '')
        .replace('.md', '')
      
      const newChapterFile = `${shortId}_ch${i}_${title}.md`
      const oldPath = path.join(schoolDir, chapterFile)
      const newPath = path.join(schoolDir, newChapterFile)
      
      fs.renameSync(oldPath, newPath)
      console.log(`  ✓ 章节${i}: ${chapterFile} -> ${newChapterFile}`)
    }
  }
  
  // 3. 重命名专业文件
  const programsDir = path.join(schoolDir, 'programs')
  if (fs.existsSync(programsDir)) {
    const files = fs.readdirSync(programsDir)
    const programFiles = files.filter(f => f.startsWith(`${schoolId}_项目_`) && f.endsWith('.md'))
    
    console.log(`  处理 ${programFiles.length} 个专业文件...`)
    
    for (const file of programFiles) {
      // 提取项目名称部分（去掉前缀）
      const programPart = file.replace(`${schoolId}_项目_`, '')
      
      // 缩短文件名：如果太长，只保留前100个字符
      let shortProgramPart = programPart
      if (shortProgramPart.length > 100) {
        // 尝试在合适的位置截断（在最后一个下划线或连字符处）
        const truncateAt = shortProgramPart.lastIndexOf('_', 100) || shortProgramPart.lastIndexOf('-', 100) || 100
        shortProgramPart = shortProgramPart.substring(0, truncateAt) + '.md'
      }
      
      const newFile = `${shortId}_p_${shortProgramPart}`
      const oldPath = path.join(programsDir, file)
      const newPath = path.join(programsDir, newFile)
      
      // 检查新文件名是否超过255字符（Linux限制）
      if (newFile.length > 255) {
        // 进一步缩短
        const maxLength = 250
        const truncated = newFile.substring(0, maxLength) + '.md'
        fs.renameSync(oldPath, path.join(programsDir, truncated))
        console.log(`  ⚠ 文件名过长，已截断: ${truncated.substring(0, 50)}...`)
      } else {
        fs.renameSync(oldPath, newPath)
      }
    }
    
    console.log(`  ✓ 完成 ${programFiles.length} 个专业文件重命名`)
  }
}

// 主函数
function main() {
  const schools = fs.readdirSync(SCHOOLS_DATA_DIR, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name)
  
  console.log(`找到 ${schools.length} 个学校目录`)
  
  for (const schoolId of schools) {
    try {
      renameSchoolFiles(schoolId)
    } catch (error) {
      console.error(`处理 ${schoolId} 时出错:`, error.message)
    }
  }
  
  console.log('\n✓ 所有文件重命名完成！')
}

main()

