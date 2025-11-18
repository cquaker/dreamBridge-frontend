const fs = require('fs')
const path = require('path')

const SCHOOLS_DATA_DIR = path.join(__dirname, '..', 'data', 'schools')

// 获取学校ID的短名称
function getShortSchoolId(schoolId) {
  return schoolId
    .replace(/^www\./, '')
    .replace(/\.(edu|com|org)(\.sg)?$/, '')
    .replace(/\./g, '_')
}

// 提取学生人数
function extractStudentCount(content) {
  const patterns = [
    /\*\*学生人数\*\*[：:]\s*[^，,。.\n]*?约?\s*([\d,，]+)\s*名[^，,。.\n]*/,
    /学生人数[：:]\s*[^，,。.\n]*?约?\s*([\d,，]+)\s*名[^，,。.\n]*/,
    /约\s*([\d,，]+)\s*名[^，,。.\n]*学生/,
    /([\d,，]+)\s*名[^，,。.\n]*学生[^，,。.\n]*/,
  ]
  
  for (const pattern of patterns) {
    const match = content.match(pattern)
    if (match && match[1]) {
      const count = match[1].replace(/[,，]/g, '')
      const num = parseInt(count)
      if (!isNaN(num) && num > 0) {
        return num
      }
    }
  }
  return null
}

// 提取学校类型和地区
function extractSchoolTypeAndRegion(content) {
  const regionPatterns = [
    { pattern: /新加坡/, name: '新加坡' },
    { pattern: /中国/, name: '中国' },
    { pattern: /美国/, name: '美国' },
    { pattern: /英国/, name: '英国' },
    { pattern: /澳大利亚/, name: '澳大利亚' },
    { pattern: /加拿大/, name: '加拿大' },
  ]
  
  const typePatterns = [
    { pattern: /私立教育机构|私立院校|私立学院|PEI/, type: '私立' },
    { pattern: /公立大学|公立院校/, type: '公立' },
    { pattern: /大学/, type: '大学' },
    { pattern: /学院/, type: '学院' },
  ]
  
  let region = null
  for (const { pattern, name } of regionPatterns) {
    if (pattern.test(content)) {
      region = name
      break
    }
  }
  
  let schoolType = null
  for (const { pattern, type } of typePatterns) {
    if (pattern.test(content)) {
      schoolType = type
      break
    }
  }
  
  // 组合地区和类型
  let schoolTypeText = null
  if (region && schoolType) {
    schoolTypeText = `${region}${schoolType}${schoolType === '大学' || schoolType === '学院' ? '' : '院校'}`
  } else if (region) {
    schoolTypeText = `${region}院校`
  } else if (schoolType) {
    schoolTypeText = schoolType === '大学' || schoolType === '学院' ? schoolType : `${schoolType}院校`
  }
  
  return {
    region: region || null,
    type: schoolType || null,
    displayText: schoolTypeText
  }
}

// 提取教师人数
function extractTeacherCount(content) {
  const patterns = [
    /\*\*教师人数\*\*[：:]\s*[^，,。.\n]*?约?\s*([\d,，]+)\s*名[^，,。.\n]*/,
    /教师人数[：:]\s*[^，,。.\n]*?约?\s*([\d,，]+)\s*名[^，,。.\n]*/,
    /约\s*([\d,，]+)\s*名[^，,。.\n]*教师/,
  ]
  
  for (const pattern of patterns) {
    const match = content.match(pattern)
    if (match && match[1]) {
      const count = match[1].replace(/[,，]/g, '')
      const num = parseInt(count)
      if (!isNaN(num) && num > 0) {
        return num
      }
    }
  }
  return null
}

// 提取合作大学数量
function extractPartnerUniversityCount(content) {
  const patterns = [
    /\*\*合作大学数量\*\*[：:]\s*[^，,。.\n]*?([\d,，]+)\s*所[^，,。.\n]*/,
    /合作大学数量[：:]\s*[^，,。.\n]*?([\d,，]+)\s*所[^，,。.\n]*/,
    /([\d,，]+)\s*所[^，,。.\n]*合作大学/,
    /超过\s*([\d,，]+)\s*所[^，,。.\n]*大学/,
  ]
  
  for (const pattern of patterns) {
    const match = content.match(pattern)
    if (match && match[1]) {
      const count = match[1].replace(/[,，]/g, '')
      const num = parseInt(count)
      if (!isNaN(num) && num > 0) {
        return num
      }
    }
  }
  return null
}

// 处理单个学校
function processSchool(schoolId) {
  const schoolDir = path.join(SCHOOLS_DATA_DIR, schoolId)
  const shortId = getShortSchoolId(schoolId)
  
  // 读取索引文件
  const indexPath = path.join(schoolDir, `${shortId}_index.json`)
  if (!fs.existsSync(indexPath)) {
    console.log(`  跳过：索引文件不存在 ${indexPath}`)
    return
  }
  
  const indexData = JSON.parse(fs.readFileSync(indexPath, 'utf-8'))
  
  // 读取第1章节文件
  const chapter1Path = path.join(schoolDir, `${shortId}_ch1_学校概况.md`)
  if (!fs.existsSync(chapter1Path)) {
    console.log(`  跳过：第1章节文件不存在 ${chapter1Path}`)
    return
  }
  
  const chapter1Content = fs.readFileSync(chapter1Path, 'utf-8')
  
  // 提取数据
  const studentCount = extractStudentCount(chapter1Content)
  const schoolTypeInfo = extractSchoolTypeAndRegion(chapter1Content)
  const teacherCount = extractTeacherCount(chapter1Content)
  const partnerUniversityCount = extractPartnerUniversityCount(chapter1Content)
  
  // 更新索引数据
  indexData.metadata = {
    studentCount: studentCount,
    teacherCount: teacherCount,
    partnerUniversityCount: partnerUniversityCount,
    region: schoolTypeInfo.region,
    schoolType: schoolTypeInfo.type,
    schoolTypeDisplay: schoolTypeInfo.displayText
  }
  
  // 写回文件
  fs.writeFileSync(indexPath, JSON.stringify(indexData, null, 2), 'utf-8')
  
  console.log(`  ✓ ${schoolId}`)
  console.log(`    学生人数: ${studentCount || '未找到'}`)
  console.log(`    学校类型: ${schoolTypeInfo.displayText || '未找到'}`)
  if (teacherCount) console.log(`    教师人数: ${teacherCount}`)
  if (partnerUniversityCount) console.log(`    合作大学: ${partnerUniversityCount} 所`)
}

// 主函数
function main() {
  const schools = fs.readdirSync(SCHOOLS_DATA_DIR, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name)
  
  console.log(`处理 ${schools.length} 个学校...\n`)
  
  for (const schoolId of schools) {
    try {
      processSchool(schoolId)
    } catch (error) {
      console.error(`处理 ${schoolId} 时出错:`, error.message)
    }
  }
  
  console.log('\n✓ 所有学校元数据提取完成！')
}

main()

