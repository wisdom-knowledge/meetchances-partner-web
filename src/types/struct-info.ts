export interface StructInfo {
  basic_info?: {
    city?: string | null
    name?: string | null
    email?: string | null
    phone?: string | null
    gender?: '男' | '女' | string | null
  }
  experience?: {
    education?: Array<{
      city?: string | null
      major?: string | null
      end_date?: string | null
      start_date?: string | null
      degree_type?: string | null
      institution?: string | null
      achievements?: string[] | null
      degree_status?: string | null
    }>
    work_experience?: Array<{
      city?: string | null
      title?: string | null
      end_date?: string | null
      start_date?: string | null
      achievements?: string[] | null
      organization?: string | null
      employment_type?: string | null
    }>
    project_experience?: Array<{
      role?: string | null
      end_date?: string | null
      start_date?: string | null
      achievements?: string[] | null
      organization?: string | null
    }>
  }
  self_assessment?: {
    summary?: string | null
    hard_skills?: Array<{ skill_name?: string | null; proficiency?: string | null }>
    soft_skills?: unknown[]
  } | null
}


