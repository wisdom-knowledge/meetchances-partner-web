import { useRef } from 'react'
import { useForm, type SubmitHandler, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { Separator } from '@/components/ui/separator'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { IconListDetails, IconPlus, IconStar, IconUser, IconWand, IconUpload } from '@tabler/icons-react'

import { showSubmittedData } from '@/utils/show-submitted-data'
import { Button } from '@/components/ui/button'
import { Form } from '@/components/ui/form'
import { resumeSchema, type ResumeFormValues } from './data/schema'
import { resumeMockData } from './data/mock'
import { options } from './data/config'
// import { options } from './data/config'
import SectionNav, { type SectionNavItem } from './components/section-nav'
import DynamicBasicForm from './components/dynamic-basic-form'
import DynamicWorkExperience from './components/dynamic-work-experience'
import ResumeSection from './components/resume-section'

export default function ResumePage() {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const scrollContainerRef = useRef<HTMLDivElement | null>(null)

  // 性别默认值为空，由用户选择或后端数据填充
  const defaultGender = undefined

  const form = useForm<ResumeFormValues>({
    resolver: zodResolver(resumeSchema) as Resolver<ResumeFormValues>,
    defaultValues: {
      name: '',
      phone: '',
      city: undefined,
      gender: defaultGender,
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
    },
    mode: 'onChange',
  })

  // 开发调试：将 mock 数据映射为表单值
  function mapMockToFormValues(): ResumeFormValues {
    const rawGender = resumeMockData.structured_resume.basic_info.gender as (typeof options.gender)[number] | null
    const gender = options.gender.includes(rawGender as (typeof options.gender)[number])
      ? (rawGender as (typeof options.gender)[number])
      : undefined

    return {
      name: resumeMockData.structured_resume.basic_info.name ?? '',
      phone: resumeMockData.structured_resume.basic_info.phone ?? '',
      city: (resumeMockData.structured_resume.basic_info.city as string | null) ?? undefined,
      gender,
      email: resumeMockData.structured_resume.basic_info.email ?? '',
      origin: '',
      expectedSalary: '',
      hobbies: '',
      skills: '',
      workSkillName: '',
      workSkillLevel: undefined,
      softSkills: (resumeMockData.structured_resume.self_assessment.soft_skills ?? []).join('、'),
      selfEvaluation: resumeMockData.structured_resume.self_assessment.summary ?? '',
      workExperience:
        (resumeMockData.structured_resume.experience.work_experience ?? []).map((w) => ({
          organization: w.organization ?? '',
          title: w.title ?? '',
          startDate: w.start_date ?? '',
          endDate: w.end_date ?? '',
          city: (w.city as string | null) ?? '',
          employmentType: (w.employment_type as string | null) ?? '',
          achievements: (w.achievements ?? []).join('\n'),
        })),
      projectExperience:
        (resumeMockData.structured_resume.experience.project_experience ?? []).map((p) => ({
          organization: p.organization ?? '',
          role: p.role ?? '',
          startDate: p.start_date ?? '',
          endDate: p.end_date ?? '',
          achievements: (p.achievements ?? []).join('\n'),
        })),
      education:
        (resumeMockData.structured_resume.experience.education ?? []).map((e) => ({
          institution: e.institution ?? '',
          major: e.major ?? '',
          degreeType: e.degree_type ?? '',
          degreeStatus: (e.degree_status as string | null) ?? '',
          city: (e.city as string | null) ?? '',
          startDate: e.start_date ?? '',
          endDate: e.end_date ?? '',
          achievements: e.achievements
            ? Array.isArray(e.achievements)
              ? e.achievements.join('\n')
              : String(e.achievements)
            : '',
        })),
    }
  }

  // experiences 由动态组件内部管理；此处不需要声明

  const onSubmit: SubmitHandler<ResumeFormValues> = (values) => {
    showSubmittedData(values)
  }

  // 仅开发环境暴露：一键填充 mock 数据，便于调试
  const isDev = import.meta.env.DEV
  function fillWithMock() {
    if (!isDev) return
    const mockValues = mapMockToFormValues()
    form.reset(mockValues)
  }

  return (
    <>
      <Header fixed>
        <div className='ml-auto flex items-center space-x-4'>
          <ProfileDropdown />
        </div>
      </Header>

      <Main fixed>
        <div className='space-y-0.5'>
          <h1 className='text-2xl font-bold tracking-tight md:text-3xl mb-2'>我的简历</h1>
          <p className='text-muted-foreground'>完善你的基本信息与经历，便于精准匹配项目。</p>
        </div>
        <Separator className='my-4 lg:my-6' />

        <div className='flex flex-1 flex-col space-y-2 overflow-hidden md:space-y-2 lg:flex-row lg:space-y-0 lg:space-x-12'>
          <aside className='top-0 lg:sticky lg:w-1/5'>
            <SectionNav
              items={[
                { id: 'section-basic', title: '基本信息', icon: <IconUser size={18} /> },
                { id: 'section-experience', title: '经历', icon: <IconListDetails size={18} /> },
                { id: 'section-qualifications', title: '附加资质', icon: <IconStar size={18} /> },
                { id: 'section-interests', title: '兴趣与技能', icon: <IconWand size={18} /> },
                { id: 'section-self', title: '自我评价', icon: <IconWand size={18} /> },
              ] satisfies SectionNavItem[]}
            />
          </aside>

          <div className='flex w-full overflow-y-hidden p-1'>
            <div className='w-full pb-24'>
              {/* 上传按钮 */}
              <div className='w-full mb-6'>
                <div className='flex items-center justify-between'>
                  <div className='flex-1' />
                  <div className='flex items-center gap-2'>
                    <div className='flex gap-2'>
                      <input
                        ref={fileInputRef}
                        type='file'
                        className='hidden'
                        accept='.pdf,.doc,.docx,.md,.txt'
                        aria-label='上传简历文件'
                        title='上传简历文件'
                        onChange={() => {
                          /* no-op for now */
                        }}
                      />
                      <Button
                        variant='outline'
                        onClick={() => fileInputRef.current?.click()}
                        className='h-10 px-4 py-2'
                      >
                        <IconUpload className='h-4 w-4' />
                        上传新简历
                      </Button>
                      {isDev && (
                        <Button variant='outline' className='h-10 px-4 py-2' onClick={fillWithMock}>
                          用 Mock 数据填充
                        </Button>
                      )}
                      <Button className='h-10 px-4 py-2' onClick={form.handleSubmit(onSubmit)}>
                        保存
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <div ref={scrollContainerRef} className='space-y-10 faded-bottom h-full w-full overflow-y-auto scroll-smooth pr-4 pb-12 [overflow-anchor:none]'>
                {/* 基本信息 */}
                <ResumeSection id='section-basic' title='基本信息'>
                  <Form {...form}>
                    <form className='w-full space-y-6' onSubmit={form.handleSubmit(onSubmit)}>
                      <DynamicBasicForm scrollContainerRef={scrollContainerRef} />
                    </form>
                  </Form>
                </ResumeSection>

                {/* 经历 */}
                <ResumeSection variant='plain' id='section-experience' title='经历'>
                  <Form {...form}>
                  {/* 工作经历（配置驱动） */}
                  <DynamicWorkExperience sectionKey='workExperience' scrollContainerRef={scrollContainerRef} />

                  {/* 项目经历（配置驱动） */}
                  <DynamicWorkExperience sectionKey='projectExperience' scrollContainerRef={scrollContainerRef} />

                  {/* 教育经历（配置驱动） */}
                  <DynamicWorkExperience sectionKey='education' scrollContainerRef={scrollContainerRef} />
                  </Form>
                </ResumeSection>

                {/* 附加资质 */}
                <ResumeSection variant='plain' id='section-qualifications' title='附加资质' className='space-y-10'>
                    {/* 奖励 */}
                    <div className='mb-10'>
                      <div className='mb-6 flex items-center justify-between'>
                        <h3 className='text-lg leading-none'>奖励</h3>
                        <Button variant='outline' className='h-9 rounded-md px-3'>
                          <IconPlus className='h-4 w-4' /> 添加奖励
                        </Button>
                      </div>
                      <div className='space-y-6'>
                        <div className='border border-block-layout-border bg-block-layout text-block-layout-foreground p-6 shadow-xs rounded-lg'>
                          <div className='text-center py-10 text-gray-500'>
                            <span className='text-xs text-muted-foreground leading-none'>
                              暂无奖励记录，点击上方按钮添加
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 论文发表 */}
                    <div className='mb-10'>
                      <div className='mb-6 flex items-center justify-between'>
                        <h3 className='text-lg leading-none'>论文发表</h3>
                        <Button variant='outline' className='h-9 rounded-md px-3'>
                          <IconPlus className='h-4 w-4' /> 添加论文发表
                        </Button>
                      </div>
                      <div className='space-y-6'>
                        <div className='border border-block-layout-border bg-block-layout text-block-layout-foreground p-6 shadow-xs rounded-lg'>
                          <div className='text-center py-10 text-gray-500'>
                            <span className='text-xs text-muted-foreground leading-none'>
                              暂无论文发表记录，点击上方按钮添加
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 代码仓库 */}
                    <div className='mb-10'>
                      <div className='mb-6 flex items-center justify-between'>
                        <h3 className='text-lg leading-none'>代码仓库</h3>
                        <Button variant='outline' className='h-9 rounded-md px-3'>
                          <IconPlus className='h-4 w-4' /> 添加代码仓库
                        </Button>
                      </div>
                      <div className='space-y-6'>
                        <div className='border border-block-layout-border bg-block-layout text-block-layout-foreground p-6 shadow-xs rounded-lg'>
                          <div className='text-center py-10 text-gray-500'>
                            <span className='text-xs text-muted-foreground leading-none'>
                              暂无代码仓库记录，点击上方按钮添加
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 专利 */}
                    <div className='mb-10'>
                      <div className='mb-6 flex items-center justify-between'>
                        <h3 className='text-lg leading-none'>专利</h3>
                        <Button variant='outline' className='h-9 rounded-md px-3'>
                          <IconPlus className='h-4 w-4' /> 添加专利
                        </Button>
                      </div>
                      <div className='space-y-6'>
                        <div className='border border-block-layout-border bg-block-layout text-block-layout-foreground p-6 shadow-xs rounded-lg'>
                          <div className='text-center py-10 text-gray-500'>
                            <span className='text-xs text-muted-foreground leading-none'>
                              暂无专利记录，点击上方按钮添加
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 社交媒体 */}
                    <div className='mb-10'>
                      <div className='mb-6 flex items-center justify-between'>
                        <h3 className='text-lg leading-none'>社交媒体</h3>
                        <Button variant='outline' className='h-9 rounded-md px-3'>
                          <IconPlus className='h-4 w-4' /> 添加社交媒体
                        </Button>
                      </div>
                      <div className='space-y-6'>
                        <div className='border border-block-layout-border bg-block-layout text-block-layout-foreground p-6 shadow-xs rounded-lg'>
                          <div className='text-center py-10 text-gray-500'>
                            <span className='text-xs text-muted-foreground leading-none'>
                              暂无社交媒体记录，点击上方按钮添加
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                </ResumeSection>

                {/* 兴趣与技能（配置驱动） */}
                <ResumeSection id='section-interests' title='兴趣与技能'>
                  <Form {...form}>
                    <form className='w-full space-y-6' onSubmit={form.handleSubmit(onSubmit)}>
                      <DynamicBasicForm sectionKey='interests' scrollContainerRef={scrollContainerRef} />
                      </form>
                    </Form>
                </ResumeSection>

                {/* 工作技能（配置驱动，可手动添加） */}
                <ResumeSection variant='plain' id='section-self' title='工作技能'>
                  <Form {...form}>
                    <form className='w-full space-y-6' onSubmit={form.handleSubmit(onSubmit)}>
                      <DynamicWorkExperience sectionKey='workSkills' scrollContainerRef={scrollContainerRef} />
                      {/* 软技能标签（仍然配置化） */}
                      <DynamicBasicForm sectionKey='workSkills' scrollContainerRef={scrollContainerRef} />
                      </form>
                    </Form>
                </ResumeSection>

                {/* 自我评价（配置驱动） */}
                <ResumeSection variant='plain' title='自我评价'>
                  <Form {...form}>
                    <form className='w-full space-y-6' onSubmit={form.handleSubmit(onSubmit)}>
                      <DynamicBasicForm sectionKey='self' />
                      </form>
                    </Form>
                </ResumeSection>
              </div>
            </div>
          </div>
        </div>
      </Main>
    </>
  )
}


