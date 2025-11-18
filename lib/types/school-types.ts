export interface SchoolMetadata {
  studentCount: number | null
  teacherCount: number | null
  partnerUniversityCount: number | null
  region: string | null
  schoolType: string | null
  schoolTypeDisplay: string | null
}

export interface SchoolIndex {
  school_name: string
  source_path: string
  total_files: number
  categories: {
    [key: string]: string[]
  }
  created_at: string
  metadata?: SchoolMetadata
}

export interface School {
  id: string
  name: string
  index: SchoolIndex
  chapters: {
    id: number
    title: string
    filename: string
    content: string
  }[]
  programCount: number
}

export interface Program {
  id: string
  filename: string
  title: string
  content: string
  partnerUniversity?: string
}

