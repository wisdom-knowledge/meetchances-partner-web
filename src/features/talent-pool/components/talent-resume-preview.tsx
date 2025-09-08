import { useForm } from 'react-hook-form'
import { useEffect, useMemo } from 'react'
import type { ReactNode } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Form } from '@/components/ui/form'
import { resumeSchema, type ResumeFormValues } from '@/features/resume/data/schema'
import type { StructInfo } from '@/types/struct-info'
import DynamicBasicForm from '@/features/resume/components/dynamic-basic-form'
import DynamicWorkExperience from '@/features/resume/components/dynamic-work-experience'
import ResumeSection from '@/features/resume/components/resume-section'
import { cn } from '@/lib/utils'

// Deprecated: previously used to build default footer content
// interface InviteContext { ... }

interface TalentResumePreviewProps {
  values?: ResumeFormValues
  struct?: StructInfo
  fallbackName?: string
  editable?: boolean
  footer?: ReactNode
  className?: string
  onStructChange?: (struct: StructInfo) => void
}

function mapStructInfoToResumeValues(struct: StructInfo | undefined, fallbackName?: string): ResumeFormValues {
  const basic = struct?.basic_info ?? {}
  const exp = struct?.experience ?? {}
  const self = struct?.self_assessment ?? {}

  const work = Array.isArray(exp?.work_experience)
    ? exp.work_experience.map((w) => ({
        organization: w?.organization ?? '',
        title: w?.title ?? '',
        startDate: w?.start_date ?? '',
        endDate: w?.end_date ?? '',
        city: w?.city ?? '',
        employmentType: w?.employment_type ?? '',
        achievements: Array.isArray(w?.achievements) ? w.achievements.join('\n') : '',
      }))
    : []

  const projects = Array.isArray(exp?.project_experience)
    ? exp.project_experience.map((p) => ({
        organization: p?.organization ?? '',
        role: p?.role ?? '',
        startDate: p?.start_date ?? '',
        endDate: p?.end_date ?? '',
        achievements: Array.isArray(p?.achievements) ? p.achievements.join('\n') : '',
      }))
    : []

  const education = Array.isArray(exp?.education)
    ? exp.education.map((e) => ({
        institution: e?.institution ?? '',
        major: e?.major ?? '',
        degreeType: e?.degree_type ?? '',
        degreeStatus: e?.degree_status ?? '',
        city: e?.city ?? '',
        startDate: e?.start_date ?? '',
        endDate: e?.end_date ?? '',
        achievements: Array.isArray(e?.achievements) ? e.achievements.join('\n') : '',
      }))
    : []

  const skillsStr = Array.isArray(self?.hard_skills)
    ? (self?.hard_skills as Array<{ skill_name?: string | null }>)
        .map((s) => s?.skill_name || '')
        .filter(Boolean)
        .join('、')
    : ''

  const hobbiesStr = Array.isArray(self?.soft_skills)
    ? (self?.soft_skills as unknown[])
        .map((s) => (typeof s === 'string' ? s : (s as { skill_name?: string | null })?.skill_name || ''))
        .filter(Boolean)
        .join('、')
    : ''

  const gender = ((): '男' | '女' | '其他' | '不愿透露' | undefined => {
    const g = basic?.gender ?? undefined
    if (g === '男' || g === '女' || g === '其他' || g === '不愿透露') return g
    return undefined
  })()

  const values: ResumeFormValues = {
    name: basic?.name ?? fallbackName ?? '',
    phone: basic?.phone ?? '',
    city: basic?.city ?? '',
    gender,
    email: basic?.email ?? '',
    origin: '',
    expectedSalary: '',
    hobbies: hobbiesStr,
    skills: skillsStr,
    workSkillName: '',
    workSkillLevel: undefined,
    softSkills: Array.isArray(self?.soft_skills)
      ? (self?.soft_skills as unknown[])
          .map((s) => (typeof s === 'string' ? s : (s as { skill_name?: string | null })?.skill_name || ''))
          .filter(Boolean)
          .join('、')
      : '',
    selfEvaluation: self?.summary ?? '',
    workExperience: work,
    projectExperience: projects,
    education,
  }
  return values
}

export default function TalentResumePreview({ values, struct, fallbackName, editable = true, footer, className, onStructChange }: TalentResumePreviewProps) {
  const computedValues: ResumeFormValues = useMemo(() => {
    if (struct) return mapStructInfoToResumeValues(struct, fallbackName)
    return (
      values ?? {
        name: fallbackName ?? '',
        phone: '',
        city: '',
        gender: undefined,
        email: '',
        origin: '',
        expectedSalary: '',
        hobbies: '',
        skills: '',
        workSkillName: '',
        workSkillLevel: undefined,
        softSkills: '',
        selfEvaluation: '',
        workExperience: [],
        projectExperience: [],
        education: [],
      }
    )
  }, [struct, values, fallbackName])

  const form = useForm<ResumeFormValues>({ resolver: zodResolver(resumeSchema), defaultValues: computedValues, mode: 'onChange' })

  // 当外部传入内容变化时，重置表单，避免保留上一次的内容
  useEffect(() => {
    form.reset(computedValues)
  }, [computedValues, form])

  function mapFormValuesToStructInfo(v: ResumeFormValues): StructInfo {
    const skillTokens = (v.skills || '')
      .split(/[,，、\n]/)
      .map((s) => s.trim())
      .filter(Boolean)
    const hardSkills = skillTokens.map((skill) => ({ skill_name: skill, proficiency: null }))

    const tokenize = (text: string) =>
      String(text || '')
        .split(/[,，、\s\n]+/u)
        .map((s) => s.trim())
        .filter(Boolean)

    const combinedHobbies = Array.from(new Set([...tokenize(v.hobbies || ''), ...tokenize(v.softSkills || '')]))

    return {
      basic_info: {
        name: v.name || '',
        phone: v.phone || '',
        city: v.city || '',
        gender: v.gender ?? null,
        email: v.email || '',
      },
      experience: {
        work_experience: (v.workExperience || []).map((w) => ({
          organization: w.organization || '',
          title: w.title || '',
          start_date: w.startDate || '',
          end_date: w.endDate || '',
          city: w.city || '',
          employment_type: w.employmentType || '',
          achievements: (w.achievements || '')
            ? String(w.achievements)
                .split(/\n/)
                .map((t) => t.trim())
                .filter(Boolean)
            : [],
        })),
        project_experience: (v.projectExperience || []).map((p) => ({
          organization: p.organization || '',
          role: p.role || '',
          start_date: p.startDate || '',
          end_date: p.endDate || '',
          achievements: (p.achievements || '')
            ? String(p.achievements)
                .split(/\n/)
                .map((t) => t.trim())
                .filter(Boolean)
            : [],
        })),
        education: (v.education || []).map((e) => ({
          institution: e.institution || '',
          major: e.major || '',
          degree_type: e.degreeType || '',
          degree_status: e.degreeStatus || '',
          city: e.city || '',
          start_date: e.startDate || '',
          end_date: e.endDate || '',
          achievements: (e.achievements || '')
            ? String(e.achievements)
                .split(/\n/)
                .map((t) => t.trim())
                .filter(Boolean)
            : [],
        })),
      },
      self_assessment: {
        summary: v.selfEvaluation || '',
        hard_skills: hardSkills,
        soft_skills: combinedHobbies,
      },
    }
  }

  // 将表单实时变更映射为 StructInfo 上抛
  useEffect(() => {
    const subscription = form.watch((val) => {
      try {
        const structInfo = mapFormValuesToStructInfo(val as ResumeFormValues)
        onStructChange?.(structInfo)
      } catch {
        // ignore mapping errors
      }
    })
    return () => subscription.unsubscribe()
  }, [form, onStructChange])

  // Footer 内容由外部传入

  return (
    <>
      <div
        className={cn(
          'space-y-10 faded-bottom h-full w-full overflow-y-auto scroll-smooth pr-4 [overflow-anchor:none]',
          footer != null ? 'pb-28' : 'pb-6',
          className
        )}
      >
        <ResumeSection id='section-basic' title='基本信息'>
          <Form {...form}>
            <form className='w-full space-y-6'>
              <DynamicBasicForm readOnly={!editable} />
            </form>
          </Form>
        </ResumeSection>

        <ResumeSection variant='plain' id='section-experience' title='经历'>
          <Form {...form}>
            <DynamicWorkExperience sectionKey='workExperience' readOnly={!editable} />
            <DynamicWorkExperience sectionKey='projectExperience' readOnly={!editable} />
            <DynamicWorkExperience sectionKey='education' readOnly={!editable} />
          </Form>
        </ResumeSection>

        <ResumeSection id='section-interests' title='兴趣与技能'>
          <Form {...form}>
            <form className='w-full space-y-6'>
              <DynamicBasicForm sectionKey='interests' readOnly />
            </form>
          </Form>
        </ResumeSection>

        <ResumeSection variant='plain' title='自我评价'>
          <Form {...form}>
            <form className='w-full space-y-6'>
              <DynamicBasicForm sectionKey='self' readOnly={!editable} />
            </form>
          </Form>
        </ResumeSection>
      </div>
      {/* 吸底操作区 */}
      {footer != null && (
        <div className='sticky bottom-0 left-0 right-0 z-10 -mb-10 pt-3 pb-3 bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/60'>
          {footer}
        </div>
      )}
    </>
  )
}


