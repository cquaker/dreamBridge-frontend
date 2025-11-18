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
function extractSchoolTypeAndRegion(chapter1Content, chapter2Content, schoolName) {
  const allContent = (chapter1Content || '') + '\n' + (chapter2Content || '')
  
  const regionPatterns = [
    { pattern: /新加坡/, name: '新加坡' },
    { pattern: /中国/, name: '中国' },
    { pattern: /美国/, name: '美国' },
    { pattern: /英国/, name: '英国' },
    { pattern: /澳大利亚/, name: '澳大利亚' },
    { pattern: /加拿大/, name: '加拿大' },
  ]
  
  let region = null
  for (const { pattern, name } of regionPatterns) {
    if (pattern.test(allContent)) {
      region = name
      break
    }
  }
  
  // 优先从第2章节（办学资质）提取学校类型，更准确
  const contentToCheck = chapter2Content || chapter1Content || ''
  
  let schoolType = null
  
  // 优先级1：对于新加坡学校，先检查是否是已知的公立大学（最可靠，避免误判）
  if (region === '新加坡') {
    // 首先检查学校名称，如果是明确的私立机构，直接标记为私立
    if (/新加坡管理学院|SIM|Management Institute/.test(schoolName)) {
      schoolType = '私立'
    }
    // 新加坡公立大学：NUS, NTU, SMU, SUTD, SUSS, SIT
    // 通过学校名称匹配，这些是确定的公立大学
    else if (/(^|[^a-zA-Z])(南洋理工大学|NTU|新加坡国立大学|NUS|新加坡管理大学|SMU|新加坡科技设计大学|SUTD|新加坡社科大学|SUSS|新加坡理工大学|SIT)([^a-zA-Z]|$)/.test(allContent)) {
      schoolType = '公立'
    }
    // 检查监管机构：教育部（MOE）且没有CPE/SSG，通常是公立
    else if (/教育部|Ministry of Education|MOE/.test(contentToCheck) && !/CPE|SSG|私立教育理事会/.test(contentToCheck)) {
      schoolType = '公立'
    }
    // 检查是否有明确的"公立大学"、"公立应用型大学"描述
    else if (/公立大学|公立应用型大学/.test(allContent)) {
      schoolType = '公立'
    }
    // 检查是否有明确的"私立教育机构"、"PEI"等关键词（排除"待补充"的情况）
    else if (/私立教育机构|作为.*PEI|PEI.*注册|私立教育和/.test(contentToCheck) && !/待补充/.test(contentToCheck)) {
      schoolType = '私立'
    }
    // 检查EduTrust认证（但排除"待补充"的情况，因为公立大学也可能提到但未获得）
    else if (/EduTrust.*认证|获得.*EduTrust/.test(contentToCheck) && !/待补充/.test(contentToCheck)) {
      schoolType = '私立'
    }
    // 检查CPE/SSG监管（私立教育理事会）
    else if (/CPE|SSG|私立教育理事会/.test(contentToCheck)) {
      schoolType = '私立'
    }
  } else {
    // 非新加坡学校
    // 优先检查公立大学（更具体的关键词）
    if (/公立大学|公立应用型大学|公立院校/.test(contentToCheck)) {
      schoolType = '公立'
    }
    // 检查私立教育机构（PEI、EduTrust等关键词）
    else if (/私立教育机构|PEI|EduTrust|私立教育和/.test(contentToCheck)) {
      schoolType = '私立'
    }
  }
  
  // 如果还没确定，从第1章节再次检查
  if (!schoolType && chapter1Content) {
    if (/公立大学|公立应用型大学|公立院校/.test(chapter1Content)) {
      schoolType = '公立'
    } else if (/私立教育机构|PEI|私立教育和/.test(chapter1Content)) {
      schoolType = '私立'
    }
  }
  
  // 组合地区和类型
  let schoolTypeText = null
  if (region && schoolType) {
    if (schoolType === '公立') {
      schoolTypeText = `${region}${schoolType}大学`
    } else {
      schoolTypeText = `${region}${schoolType}院校`
    }
  } else if (region) {
    schoolTypeText = `${region}院校`
  } else if (schoolType) {
    if (schoolType === '公立') {
      schoolTypeText = `${schoolType}大学`
    } else {
      schoolTypeText = `${schoolType}院校`
    }
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
  const schoolName = indexData.school_name || ''
  
  // 读取第1章节文件
  const chapter1Path = path.join(schoolDir, `${shortId}_ch1_学校概况.md`)
  if (!fs.existsSync(chapter1Path)) {
    console.log(`  跳过：第1章节文件不存在 ${chapter1Path}`)
    return
  }
  
  const chapter1Content = fs.readFileSync(chapter1Path, 'utf-8')
  
  // 读取第2章节文件（办学资质与认证），用于更准确提取学校类型
  const chapter2Path = path.join(schoolDir, `${shortId}_ch2_办学资质与认证.md`)
  let chapter2Content = null
  if (fs.existsSync(chapter2Path)) {
    chapter2Content = fs.readFileSync(chapter2Path, 'utf-8')
  }
  
  // 提取数据
  const studentCount = extractStudentCount(chapter1Content)
  const schoolTypeInfo = extractSchoolTypeAndRegion(chapter1Content, chapter2Content, schoolName)
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

