import { useQuery, type UseQueryOptions } from '@tanstack/react-query'
import { z } from 'zod'
import { api } from '@/lib/api'
import type { TalentItem } from './types'

// 枚举：与后端数值枚举对齐
export enum RegistrationStatus {
  UNREGISTERED = 0,
  REGISTERED = 10,
}

export enum TalentStatusCode {
  INVITABLE = 0,
  LOCKED = 10,
}

export enum JobMatchStatus {
  UNREGISTERED = 0,
  INCOMPLETE_INTERVIEW = 10,
  INTERVIEWED = 20,
}

export enum MatchScoreStatus {
  NOT_COMPUTED = 0,
  COMPUTING = 10,
  SUCCESS = 20,
}

// 运行时校验 Schema（基于你提供的示例返回）
const ResumeListItemSchema = z.object({
  name: z.string().min(1),
  resume_id: z.number(),
  registration_status: z.nativeEnum(RegistrationStatus),
  talent_status: z.nativeEnum(TalentStatusCode),
  job_match_status: z.nativeEnum(JobMatchStatus).optional(),
  match_score_status: z.nativeEnum(MatchScoreStatus).optional(),
  upload_time: z.string().optional(),
})

const ResumeListResponseSchema = z.object({
  data: z.array(ResumeListItemSchema),
  count: z.number(),
})

export interface TalentPoolQueryParams {
  skip?: number
  limit?: number
  registration_status?: number | number[] | string
  interview_status?: number | number[] | string
  talent_status?: number | number[] | string
  name?: string
  sort_by_upload_time?: 'asc' | 'desc'
}

export interface TalentPoolQueryResult {
  data: TalentItem[]
  total?: number
}

function mapToTalentItem(item: z.infer<typeof ResumeListItemSchema>): TalentItem {
  const isRegistered = item.registration_status === RegistrationStatus.REGISTERED
  const talentStatus = item.talent_status === TalentStatusCode.LOCKED ? '锁定中' : '可聘请'
  return {
    resume_id: item.resume_id,
    name: item.name,
    isRegistered,
    talentStatus,
    uploadTime: item.upload_time,
  }
}

export async function fetchTalentPool(_params: TalentPoolQueryParams = {}): Promise<TalentPoolQueryResult> {
  // 参数组装：将数组参数转为逗号分隔字符串
  const toCommaParam = (v?: number | number[] | string) => {
    if (v === undefined || v === null) return undefined
    if (Array.isArray(v)) return v.join(',')
    return String(v)
  }

  const { skip, limit, registration_status, interview_status, talent_status, name, sort_by_upload_time } = _params
  const query = {
    skip,
    limit,
    registration_status: toCommaParam(registration_status),
    interview_status: toCommaParam(interview_status),
    talent_status: toCommaParam(talent_status),
    name,
    sort_by_upload_time,
  }

  const raw = await api.get('/headhunter/talent_pool', { params: query })
  const parsed = ResumeListResponseSchema.safeParse(raw)

  if (!parsed.success) {
    return { data: [] }
  }

  const { data, count } = parsed.data
  return {
    data: data.map(mapToTalentItem),
    total: count,
  }
}

export function useTalentPoolQuery(
  params: TalentPoolQueryParams = {},
  options?: UseQueryOptions<TalentPoolQueryResult>
) {
  return useQuery({
    queryKey: ['talent-pool', params],
    queryFn: () => fetchTalentPool(params),
    // 当筛选参数变化时，TanStack Query 会根据 queryKey 触发重新请求
    ...options,
  })
}


