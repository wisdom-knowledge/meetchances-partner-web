import { api } from '@/lib/api'
import { useMutation, type UseMutationOptions } from '@tanstack/react-query'
import { BackendStatus } from '@/features/resume-upload/types'
import type { StructInfo } from '@/types/struct-info'

export interface UploadBackendSubset {
  source: number
  status: BackendStatus
  struct_info: StructInfo | null
  is_in_pool: boolean
  is_del: boolean
  id: number
  user_id: number
}

export interface UploadResultItem {
  success: boolean
  status: BackendStatus
  data?: {
    fileName: string
    originalName: string
    url: string
    size: number
    ext: string
    compressed?: boolean
    originalSize?: number
    compressionRatio?: number
  }
  fileName?: string
  error?: string
  backend: UploadBackendSubset
  // 本地增强：便于“重新上传”时复用原始文件
  originalFile?: File
}

type BackendItem = {
  file_name: string
  file_size: number
  bucket_id?: string
  file_key?: string
  content_hash?: string
  source: number
  status: number
  status_msg?: string
  struct_info: StructInfo | null
  is_in_pool: boolean
  is_del: boolean
  id: number
  user_id: number
}

function mapBackendItems(items: BackendItem[]): UploadResultItem[] {
  return items.map((item) => {
    const fileName = item.file_name || '文件'
    const ext = fileName.includes('.') ? fileName.split('.').pop() || '' : ''
    const numericStatus = Number(item.status) as BackendStatus
    const isSuccess = numericStatus === BackendStatus.Success
    return {
      success: isSuccess,
      status: numericStatus,
      error: item.status_msg,
      data: {
        fileName,
        originalName: fileName,
        url: '',
        size: Number(item.file_size) || 0,
        ext,
      },
      fileName,
      backend: {
        source: Number(item.source),
        status: numericStatus,
        struct_info: item.struct_info,
        is_in_pool: Boolean(item.is_in_pool),
        is_del: Boolean(item.is_del),
        id: Number(item.id),
        user_id: Number(item.user_id),
      },
    }
  })
}

// 对接后端：/api/v1/headhunter/upload_resume
// - 表单字段：files (可多文件)
// - 响应由 axios 拦截器解包后，返回 payload.data，即 { data: BackendItem[], count: number }
export async function uploadFiles(formData: FormData): Promise<{ success: boolean; data: UploadResultItem[] }> {
  try {
    // 注意：api 的 baseURL 默认为 /api/v1，因此这里仅写相对路径
    const res = (await api.post('/headhunter/upload_resume', formData)) as {
      data?: BackendItem[]
      count?: number
    }

    const items = Array.isArray(res?.data) ? res.data : []
    return { success: true, data: mapBackendItems(items) }
  } catch (_e) {
    return { success: false, data: [] }
  }
}

// 刷新上传结果
export async function fetchResumesByIds(resumeIds: number[]): Promise<{ success: boolean; data: UploadResultItem[] }> {
  try {
    const res = (await api.get('/headhunter/resumes', { params: { resume_ids: resumeIds.join(',') } })) as {
      data?: BackendItem[]
      count?: number
    }
    const items = Array.isArray(res?.data) ? res.data : []
    return { success: true, data: mapBackendItems(items) }
  } catch (_e) {
    return { success: false, data: [] }
  }
}

// 新增：分页+状态筛选获取上传记录
export interface FetchResumesParams {
  skip?: number
  limit?: number
  status?: BackendStatus
}

export async function fetchResumes(params: FetchResumesParams): Promise<{
  success: boolean;
  data: UploadResultItem[];
  count: number;
  average_parse_time: number;
}> {
  const toCommaParam = (v?: number | number[] | string) => {
    if (v === undefined || v === null) return undefined
    if (Array.isArray(v)) return v.join(',')
    return String(v)
  }
  try {
    const res = (await api.get('/headhunter/resumes', {
      params: {
        skip: params.skip,
        limit: params.limit,
        status: toCommaParam(params.status),
      },
    })) as {
      data?: BackendItem[]
      count?: number
      average_parse_time?: number
    }
    const items = Array.isArray(res?.data) ? res.data : []
    const count = typeof res?.count === 'number' ? res.count : items.length
    const average_parse_time = typeof res?.average_parse_time === 'number' ? res.average_parse_time : 0
    return { success: true, data: mapBackendItems(items), count, average_parse_time }
  } catch (_e) {
    return { success: false, data: [], count: 0, average_parse_time: 0 }
  }
}

// 简历详情（用于人才表查看简历）
export async function fetchResumeDetail(resumeId: number): Promise<{ success: boolean; item?: UploadResultItem }> {
  try {
    const res = (await api.get(`/headhunter/resume_detail/${resumeId}`)) as
      | { data?: BackendItem }
      | BackendItem

    const rawItem: BackendItem | undefined = (res as { data?: BackendItem })?.data ?? (res as BackendItem)
    if (!rawItem) return { success: false }

    const mapped = mapBackendItems([rawItem])
    return { success: true, item: mapped[0] }
  } catch (_e) {
    return { success: false }
  }
}

// TanStack hooks
export function useResumesRefreshMutation(
  options?: UseMutationOptions<{ success: boolean; data: UploadResultItem[] }, unknown, number[]>
) {
  return useMutation({ mutationFn: (ids: number[]) => fetchResumesByIds(ids), ...options })
}

export function useUploadResumesMutation(
  options?: UseMutationOptions<{ success: boolean; data: UploadResultItem[] }, unknown, FormData>
) {
  return useMutation({ mutationFn: (fd: FormData) => uploadFiles(fd), ...options })
}


// 更新简历详情：PATCH /api/v1/headhunter/resume_detail/{resume_id}
export async function updateResumeDetail(resumeId: number, structInfo: StructInfo | Record<string, never>): Promise<{ success: boolean, error?: string }> {
  try {
    await api.patch(`/headhunter/resume_detail/${resumeId}`, { struct_info: structInfo })
    return { success: true }
  } catch (_e) {
    return { success: false, error: (_e as { status_msg: string }).status_msg }
  }
}


