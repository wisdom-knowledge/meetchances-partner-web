import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'https://service-dev.meetchances.com/api/v1'

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    Accept: 'application/json',
  },
  // 携带 Cookie 参与鉴权
  withCredentials: true,
  // 无论状态码为何都返回到成功分支，便于拿到 response.status 做统一处理
  validateStatus: () => true,
})

// 登录地址（通过一个统一的环境变量覆盖）
const LOGIN_URL = import.meta.env.VITE_AUTH_LOGIN_URL

// 响应拦截器：统一解包 { status_code, status_msg, data }
api.interceptors.response.use(
  (response) => {
    const { status } = response
    const payload = response.data
    // 明确处理未登录/登录失效
    if (status === 401) {
      const loginUrl = LOGIN_URL
      if (typeof window !== 'undefined') {
        window.location.href = loginUrl!
      }
      return Promise.reject({ status_code: 401, status_msg: 'Unauthorized' })
    }
    // 若没有通用外层，直接返回原始数据
    if (!payload || typeof payload !== 'object' || !('status_code' in payload)) {
      // 对于非 2xx 的 HTTP 状态，抛出错误；否则返回数据
      if (status >= 200 && status < 300) {
        return payload
      }
      return Promise.reject({ status_code: status, status_msg: 'Request failed' })
    }

    const { status_code, status_msg, data } = payload as {
      status_code: number
      status_msg?: string
      data: unknown
    }

    if (status_code === 0) {
      return data
    }

    return Promise.reject({ status_code, status_msg })
  },
  (error) => {
    // HTTP 层错误或后端直接返回非 2xx
    // 跳转到第三方登录（区分环境）
    return Promise.reject(error)
  }
)

export interface CurrentUserResponse {
  email: string
  is_active: boolean
  is_superuser: boolean
  full_name: string
  id: number
}

export async function fetchCurrentUser(): Promise<CurrentUserResponse> {
  // 该接口直接返回用户对象（无通用外层包装）。拦截器已将响应解包为数据对象。
  return api.get('/users/me') as unknown as Promise<CurrentUserResponse>
}


