import { useQuery, type UseQueryOptions } from '@tanstack/react-query'
import { z } from 'zod'
import { api } from '@/lib/api'
import type { TalentItem } from '@/features/talent-pool/types'

export enum RegistrationStatus {
  UNREGISTERED = 0,
  REGISTERED = 10,
}

export enum TalentStatusCode {
  INVITABLE = 0,
  LOCKED = 10,
}

export enum InterviewStatusCode {
  NOT_INTERVIEWED = 0,
  INTERVIEWED = 10,
}

const JobApplyListItemSchema = z.object({
  name: z.string().min(1),
  resume_id: z.number(),
  registration_status: z.nativeEnum(RegistrationStatus).optional(),
  talent_status: z.nativeEnum(TalentStatusCode),
  interview_status: z.nativeEnum(InterviewStatusCode),
  match_score: z.number().optional(),
  match_score_status: z.number().optional(),
})

const JobApplyListResponseSchema = z.object({
  data: z.array(JobApplyListItemSchema),
  count: z.number(),
})

export interface JobApplyListParams {
  job_id: number | null
  interview_status?: number | number[] | string
  talent_status?: number | number[] | string
  name?: string
  skip?: number
  limit?: number
}

export interface JobApplyListResult {
  data: (TalentItem & { matchScore?: number | '-' ; interviewStatus: InterviewStatusCode })[]
  total?: number
}

function mapToTalentItem(item: z.infer<typeof JobApplyListItemSchema>): JobApplyListResult['data'][number] {
  const isRegistered = item.registration_status === RegistrationStatus.REGISTERED
  const talentStatus = item.talent_status === TalentStatusCode.LOCKED ? '锁定中' : '可聘请'
  return {
    resume_id: item.resume_id,
    name: item.name,
    isRegistered: Boolean(isRegistered),
    talentStatus,
    matchScore: typeof item.match_score === 'number' && item.match_score >= 0 ? item.match_score : '-',
    interviewStatus: item.interview_status,
  }
}

export async function fetchJobApplyList(params: JobApplyListParams): Promise<JobApplyListResult> {
  if (!params.job_id) return { data: [] }

  const toCommaParam = (v?: number | number[] | string) => {
    if (v === undefined || v === null) return undefined
    if (Array.isArray(v)) return v.join(',')
    return String(v)
  }

  const raw = await api.get('/headhunter/job_apply_list', {
    params: {
      job_id: params.job_id,
      interview_status: toCommaParam(params.interview_status),
      talent_status: toCommaParam(params.talent_status),
      name: params.name,
      skip: params.skip,
      limit: params.limit,
    },
  })

  const parsed = JobApplyListResponseSchema.safeParse(raw)
  if (!parsed.success) return { data: [] }

  const { data, count } = parsed.data
  return {
    data: data.map(mapToTalentItem),
    total: count,
  }
}

export function useJobApplyListQuery(
  params: JobApplyListParams,
  options?: UseQueryOptions<JobApplyListResult>
) {
  return useQuery({
    queryKey: ['job-apply-list', params],
    queryFn: () => fetchJobApplyList(params),
    enabled: Boolean(params.job_id),
    ...options,
  })
}


