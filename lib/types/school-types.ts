export interface SchoolIndex {
  school_name: string
  source_path: string
  total_files: number
  categories: {
    [key: string]: string[]
  }
  created_at: string
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

