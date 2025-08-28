import { type ResumeFormValues } from './schema'

// 映射后端字段 -> 前端表单字段
export const resumeFieldMap = {
  name: 'structured_resume.basic_info.name',
  phone: 'structured_resume.basic_info.phone',
  city: 'structured_resume.basic_info.city',
  gender: 'structured_resume.basic_info.gender',
  email: 'structured_resume.basic_info.email',
  work_experience: 'structured_resume.experience.work_experience',
  project_experience: 'structured_resume.experience.project_experience',
  education: 'structured_resume.experience.education',
  self_summary: 'structured_resume.self_assessment.summary',
  hard_skills: 'structured_resume.self_assessment.hard_skills',
  soft_skills: 'structured_resume.self_assessment.soft_skills',
} as const

// 选项配置
export const options = {
  gender: ['男', '女', '不愿透露'],
  city: ['北京', '上海', '广州', '深圳', '杭州', '成都', '其他'],
  proficiency: ['初级', '中级', '高级', '专家', '熟悉', '精通'],
  employmentType: ['全职', '实习', '兼职'],
  degreeType: ['本科', '硕士', '博士'],
  degreeStatus: ['毕业', '在读', '肄业', '结业'],
} as const

// for array item key typing
export type WorkExperienceItemKey = keyof NonNullable<ResumeFormValues['workExperience']>[number]
export type ProjectExperienceItemKey = keyof NonNullable<ResumeFormValues['projectExperience']>[number]
export type EducationItemKey = keyof NonNullable<ResumeFormValues['education']>[number]

// 表单渲染配置（展示、文案、组件类型、占位符等）
type ArraySectionConfig = {
  name: 'workExperience' | 'projectExperience' | 'education' | 'workSkills'
  addButtonText: string
  emptyText: string
  itemTitlePrefix?: string
  itemFields: Array<{
    key: string
    label: string
    component: 'input' | 'select' | 'textarea'
    placeholder?: string
    optionsKey?: keyof typeof options
    colSpan?: 1 | 2
  }>
}

export const resumeFormConfig: {
  sections: Array<{
    key: string
    title: string
    fields?: Array<{
      key: keyof ResumeFormValues
      label: string
      component: 'input' | 'select' | 'textarea' | 'tags'
      placeholder?: string
      optionsKey?: keyof typeof options
      disabled?: boolean
      hint?: string
      colSpan?: 1 | 2
      hideLabel?: boolean
    }>
    // 针对可增删的列表型表单（如工作/项目/教育经历）
    array?: ArraySectionConfig
    // 可选：控制该区块的栅格列数（默认 2 列）
    gridCols?: 1 | 2
  }>
} = {
  sections: [
    {
      key: 'basic',
      title: '基本信息',
      fields: [
        { key: 'name', label: '姓名', component: 'input', placeholder: '请输入姓名' },
        { key: 'gender', label: '性别', component: 'select', optionsKey: 'gender', placeholder: '请选择性别' },
        { key: 'phone', label: '电话', component: 'input', placeholder: '请输入电话号码' },
        { key: 'email', label: '邮箱', component: 'input', placeholder: '请输入邮箱地址' },
        { key: 'city', label: '所在城市', component: 'input', placeholder: '请输入所在城市' },
        { key: 'origin', label: '籍贯', component: 'input', placeholder: '请输入籍贯' },
        { key: 'expectedSalary', label: '期望薪资/月', component: 'input', placeholder: '例如：30000; 3万; 20k-40k' },
      ],
    },
    {
      key: 'workExperience',
      title: '工作经历',
      array: {
        name: 'workExperience',
        addButtonText: '添加工作经历',
        emptyText: '暂无工作经历，点击上方按钮添加',
        itemTitlePrefix: '工作经历',
        itemFields: [
          { key: 'organization', label: '公司/组织', component: 'input', placeholder: '例如：某某科技有限公司' },
          { key: 'title', label: '职位', component: 'input', placeholder: '例如：前端工程师' },
          { key: 'startDate', label: '开始时间', component: 'input', placeholder: '例如：2021/07' },
          { key: 'endDate', label: '结束时间', component: 'input', placeholder: '例如：2022/06 或 至今' },
          { key: 'city', label: '城市', component: 'input', placeholder: '请输入城市' },
          { key: 'employmentType', label: '雇佣形式', component: 'select', optionsKey: 'employmentType', placeholder: '请选择雇佣形式' },
          { key: 'achievements', label: '工作内容/业绩', component: 'textarea', placeholder: '每行一条，支持换行', colSpan: 2 },
        ],
      },
    },
    {
      key: 'projectExperience',
      title: '项目经历',
      array: {
        name: 'projectExperience',
        addButtonText: '添加项目经历',
        emptyText: '暂无项目经历，点击上方按钮添加',
        itemTitlePrefix: '项目经历',
        itemFields: [
          { key: 'organization', label: '组织/项目方', component: 'input', placeholder: '例如：外包项目' },
          { key: 'role', label: '角色', component: 'input', placeholder: '例如：场景概念设计师' },
          { key: 'startDate', label: '开始时间', component: 'input', placeholder: '例如：2022/01' },
          { key: 'endDate', label: '结束时间', component: 'input', placeholder: '例如：2023/12' },
          { key: 'achievements', label: '项目内容/业绩', component: 'textarea', placeholder: '每行一条，支持换行', colSpan: 2 },
        ],
      },
    },
    {
      key: 'education',
      title: '教育经历',
      array: {
        name: 'education',
        addButtonText: '添加教育经历',
        emptyText: '暂无教育经历，点击上方按钮添加',
        itemTitlePrefix: '教育经历',
        itemFields: [
          { key: 'institution', label: '学校/机构', component: 'input', placeholder: '例如：某某大学' },
          { key: 'major', label: '专业', component: 'input', placeholder: '例如：计算机科学' },
          { key: 'degreeType', label: '学历/学位(选择)', component: 'select', optionsKey: 'degreeType', placeholder: '请选择学历/学位' },
          { key: 'degreeStatus', label: '获取状态', component: 'select', optionsKey: 'degreeStatus', placeholder: '请选择状态' },
          { key: 'startDate', label: '开始时间', component: 'input', placeholder: '例如：2018/09' },
          { key: 'endDate', label: '结束时间', component: 'input', placeholder: '例如：2021/08' },
          { key: 'city', label: '城市', component: 'input', placeholder: '请输入城市' },
          { key: 'achievements', label: '备注/成就', component: 'textarea', placeholder: '每行一条，支持换行', colSpan: 2 },
        ],
      },
    },
    {
      key: 'interests',
      title: '兴趣与技能',
      fields: [
        { key: 'hobbies', label: '兴趣爱好', component: 'tags', placeholder: '例如：阅读、旅行、摄影、编程...' },
        { key: 'skills', label: '技能', component: 'tags', placeholder: '例如：JavaScript、Python、UI设计...' },
      ],
    },
    {
      key: 'workSkills',
      title: '工作技能',
      array: {
        name: 'workSkills',
        addButtonText: '添加技能',
        emptyText: '暂无技能，点击上方按钮添加',
        itemTitlePrefix: '技能',
        itemFields: [
          { key: 'name', label: '技能名称', component: 'input', placeholder: '例如：前端开发' },
          { key: 'level', label: '熟练程度', component: 'select', optionsKey: 'proficiency', placeholder: '请选择熟练程度' },
        ],
      },
      fields: [
        { key: 'softSkills', label: '软技能', component: 'tags', placeholder: '例如：团队协作、沟通能力、项目管理...', colSpan: 2 },
      ],
    },
    {
      key: 'self',
      title: '自我评价',
      gridCols: 1,
      fields: [
        {
          key: 'selfEvaluation',
          label: '自我评价',
          component: 'textarea',
          placeholder: '请输入自我评价...',
          hideLabel: true,
          colSpan: 2,
        },
      ],
    },
  ],
}


