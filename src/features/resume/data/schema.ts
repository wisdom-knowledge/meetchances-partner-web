import { z } from 'zod'

export const resumeSchema = z.object({
  name: z.string().optional(),
  gender: z.enum(['男', '女', '其他', '不愿透露']).optional(),
  phone: z.preprocess(
    (v) => (v == null ? '' : (typeof v === 'string' ? v.trim() : v)),
    z
      .string()
      .min(1, '电话为必填项')
      .refine((val) => {
        // 优先匹配中国大陆手机号；其次匹配座机（区号+本地号，可选分机）；否则回退为 E.164（7–15 位数字）
        const normalized = val.trim()
        const cnMobile = /^1[3-9]\d{9}$/
        if (cnMobile.test(normalized)) return true
        const landline = /^0\d{2,3}-?\d{7,8}(?:-\d{1,4})?$/
        if (landline.test(normalized)) return true
        // 禁止包含字母等非法字符，仅允许 + 数字 空格 - ()
        if (/[A-Za-z]/.test(normalized)) return false
        if (!/^[+\d\s()-]+$/.test(normalized)) return false
        const digits = normalized.replace(/\D/g, '')
        return digits.length >= 7 && digits.length <= 15
      }, '请输入有效电话号码')
  ),
  email: z.preprocess(
    (v) => (v == null ? '' : (typeof v === 'string' ? v.trim() : v)),
    z
      .string()
      .min(1, '邮箱为必填项')
      .email('请输入有效邮箱地址')
  ),
  city: z.string().optional(),
  origin: z.string().optional(),
  expectedSalary: z.string().optional(),
  hobbies: z.string().optional(),
  skills: z.string().optional(),
  workSkillName: z.string().optional(),
  workSkillLevel: z.enum(['初级', '中级', '高级', '专家', '熟悉', '精通']).optional(),
  softSkills: z.string().optional(),
  selfEvaluation: z.string().optional(),
  workSkills: z
    .array(
      z.object({
        name: z.string().optional(),
        level: z.enum(['初级', '中级', '高级', '专家', '熟悉', '精通']).optional(),
      })
    )
    .optional(),
  workExperience: z
    .array(
      z.object({
        organization: z.string().optional(),
        title: z.string().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        city: z.string().optional(),
        employmentType: z.string().optional(),
        achievements: z.string().optional(),
      })
    )
    .optional(),
  projectExperience: z
    .array(
      z.object({
        organization: z.string().optional(),
        role: z.string().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        achievements: z.string().optional(),
      })
    )
    .optional(),
  education: z
    .array(
      z.object({
        institution: z.string().optional(),
        major: z.string().optional(),
        degreeType: z.string().optional(),
        degreeStatus: z.string().optional(),
        city: z.string().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        achievements: z.string().optional(),
      })
    )
    .optional(),
})

export type ResumeFormValues = z.infer<typeof resumeSchema>


