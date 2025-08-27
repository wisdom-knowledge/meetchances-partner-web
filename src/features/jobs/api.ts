import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { Job } from '@/types/solutions'
import { JobType } from '@/constants/explore'

export enum InviteTokenType {
  HeadhunterRecommend = 1,
}

export interface GenerateInviteTokenPayload {
  job_id: string | number
  headhunter_id: string | number
  token_type: InviteTokenType
}

export async function generateInviteToken(payload: GenerateInviteTokenPayload): Promise<string | null> {
  const res = (await api.post('/jobs/gen_invite_token', payload)) 

  if (typeof res === 'string') return res
  const token = (res as { invite_token?: string })?.invite_token
  return token ?? null
}

export interface JobsListParams {
  skip?: number
  limit?: number
}

export interface JobsListResponse {
  items?: Job[]
  total?: number
}

type ApiJob = {
  id: number | string
  title: string
  description: string
  job_type: 'full_time' | 'part_time'
  salary_type: string
  salary_min: number
  salary_max: number
  referral_bonus: number
  company?: { name?: string }
  company_id?: number
}

function mapApiJobToClient(job: ApiJob): Job {
  return {
    id: job.id,
    title: job.title,
    company: job?.company?.name ?? '',
    description: job.description ?? '',
    jobType: job.job_type === 'part_time' ? JobType.PART_TIME : JobType.FULL_TIME,
    salaryType: job.salary_type ?? 'hour',
    salaryRange: [job.salary_min ?? 0, job.salary_max ?? 0],
    referralBonus: job.referral_bonus ?? 0,
  }
}

async function fetchJobs(params: JobsListParams = { skip: 0, limit: 20 }): Promise<{ data: Job[]; total?: number }> {
  const { skip = 0, limit = 20 } = params
  const raw = await api.get(`/jobs/`, { params: { skip, limit } })
  // API may return array或 {items,total}; 这里做兼容
  if (Array.isArray(raw)) {
    return { data: (raw as ApiJob[]).map(mapApiJobToClient) }
  }
  const maybe: { items?: ApiJob[]; total?: number; count?: number } = raw as unknown as {
    items?: ApiJob[]
    total?: number
    count?: number
  }
  if (maybe && Array.isArray(maybe.items)) {
    return { data: maybe.items.map(mapApiJobToClient), total: maybe.total ?? maybe.count }
  }
  return { data: [] }
}

export function useJobsQuery(
  params: JobsListParams = { skip: 0, limit: 20 },
  options?: UseQueryOptions<{ data: Job[]; total?: number }>
) {
  return useQuery({
    queryKey: ['jobs', params],
    queryFn: () => fetchJobs(params),
    ...options,
  })
}

async function fetchJobDetail(id: string | number): Promise<Job> {
  const data = (await api.get(`/jobs/${id}`)) as unknown as ApiJob
  return mapApiJobToClient(data)
}

export function useJobDetailQuery(id: string | number | null, enabled = true, options?: UseQueryOptions<Job>) {
  return useQuery({
    queryKey: ['job', id],
    queryFn: () => fetchJobDetail(id as string | number),
    enabled: Boolean(id) && enabled,
    ...options,
  })
}


