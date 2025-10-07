import { z } from 'zod'

export const resumeSchema = z.object({
  name: z.string().optional(),
  gender: z.enum(['男', '女', '其他', '不愿透露']).optional(),
  phone: z.string().optional(),
  email: z.string().email('请输入有效邮箱地址').optional().or(z.literal('')),
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


