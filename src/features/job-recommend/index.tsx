import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Button } from '@/components/ui/button'
import TalentTable from '@/features/talent-pool/components/talent-table'
import { IconBriefcase, IconWorldPin } from '@tabler/icons-react'
import { useNavigate, useRouterState } from '@tanstack/react-router'
import { useMemo, useState, useCallback } from 'react'
import { useJobApplyListQuery } from './api'
import { useJobDetailQuery } from '@/features/jobs/api'

export default function JobRecommendPage() {
  const navigate = useNavigate()
  const { location } = useRouterState()
  const search = location.search as Record<string, unknown>
  const jobId = useMemo(() => {
    const v = search?.job_id
    if (typeof v === 'string') return Number(v)
    if (typeof v === 'number') return v
    return null
  }, [search])

  const [serverFilters, setServerFilters] = useState<{ name?: string; talent_status?: number[]; interview_status?: number[] }>({})
  const { data } = useJobApplyListQuery({
    job_id: jobId,
    name: serverFilters.name,
    talent_status: serverFilters.talent_status,
    interview_status: serverFilters.interview_status,
  })
  const list = data?.data ?? []

  // 从 job_id 拉取职位详情
  const { data: jobDetail } = useJobDetailQuery(jobId, true)

  const handleFilterChange = useCallback((filters: { name?: string; registration_status?: number[]; talent_status?: number[]; interview_status?: number[] }) => {
    setServerFilters({ name: filters.name, talent_status: filters.talent_status, interview_status: filters.interview_status })
  }, [])
  return (
    <>
      <Header fixed>
        <div className='ml-auto flex items-center space-x-4'>
          <ProfileDropdown />
        </div>
      </Header>

      <Main fixed>

        {/* 职位信息头部（来自 jobs 详情顶部区域） */}
        <div className='flex items-start justify-between border-b border-border py-5'>
          <div className='min-w-0 flex-1'>
            <div className='mb-2 truncate text-2xl font-bold leading-tight text-foreground'>{jobDetail?.title ?? '岗位'}</div>
            <div className='mb-2 flex items-center gap-4 text-primary'>
              <div className='flex items-center'>
                <IconBriefcase className='mr-1 h-4 w-4' />
                <span className='text-[14px]'>时薪制</span>
              </div>
              <div className='flex items-center'>
                <IconWorldPin className='mr-1 h-4 w-4' />
                <span className='text-[14px]'>远程</span>
              </div>
            </div>
          </div>
          <div className='hidden min-w-[140px] flex-col items-end md:flex'>
            <div className='mb-1 text-xl font-semibold text-foreground'>
              ¥{jobDetail?.salaryRange?.[0] ?? 0}~¥{jobDetail?.salaryRange?.[1] ?? 0}
            </div>
            <div className='mb-3 text-xs text-muted-foreground'>每小时</div>
            <div className='flex gap-2'>
            <Button variant='default' onClick={() => navigate({ to: '/resume-upload' })}>上传新简历</Button>
          </div>
          </div>
        </div>

        <div className='mt-6 flex-1 min-h-0 overflow-y-auto'>
          <div className='pb-4'>
            <TalentTable
              data={list}
              onFilterChange={handleFilterChange}
              mode='jobRecommend'
              inviteContext={{ jobTitle: jobDetail?.title, salaryMin: jobDetail?.salaryRange?.[0], salaryMax: jobDetail?.salaryRange?.[1] }}
            />
          </div>
        </div>
      </Main>
    </>
  )
}


