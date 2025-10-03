export interface TalentItem {
  resume_id?: number
  name: string
  isRegistered: boolean
  talentStatus: '可聘请' | '锁定中'
  matchScore?: number | '-'
  interviewStatus?: number
  uploadTime?: string
}


