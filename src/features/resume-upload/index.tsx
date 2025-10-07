import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { Separator } from '@/components/ui/separator'
import { ProfileDropdown } from '@/components/profile-dropdown'
import UploadCard from './components/upload-card'
import { UploadArea, type UploadResult } from '@/features/resume-upload/upload-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BackendStatus, UploadCardStatusCode } from './types'
import { Button } from '@/components/ui/button'
import { fetchResumes, fetchResumeDetail, updateResumeDetail, type UploadResultItem } from './utils/api'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import TalentResumePreview from '@/features/talent-pool/components/talent-resume-preview'
import type { ResumeFormValues } from '@/features/resume/data/schema'
import type { StructInfo } from '@/types/struct-info'
import { toast } from 'sonner'

export interface FileItem {
  id: string
  name: string
  ext: string
  status_code: `${UploadCardStatusCode}`
  progress?: number
  numericStatus?: BackendStatus
  errorMsg?: string
  backend?: {
    id: number
  }
}

export default function ResumeUploadPage() {
  const [items, setItems] = useState<FileItem[]>([])
  const [tab, setTab] = useState<'running' | 'failed' | 'success'>('running')
  const [tabsDisabled, setTabsDisabled] = useState(false)
  const [pageSize, setPageSize] = useState(10)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [counts, setCounts] = useState<{ running: number; failed: number; success: number }>({
    running: 0,
    failed: 0,
    success: 0,
  })
  const [avgParseMinutes, setAvgParseMinutes] = useState<number>(5)
  const [resumeOpen, setResumeOpen] = useState(false)
  const [resumeValues, setResumeValues] = useState<ResumeFormValues | null>(null)
  const [currentName, setCurrentName] = useState<string>('简历预览')
  const [resumeStruct, setResumeStruct] = useState<StructInfo | null>(null)
  const [editedStruct, setEditedStruct] = useState<StructInfo | null>(null)
  const [currentResumeId, setCurrentResumeId] = useState<number | null>(null)

  const handleStructChange = useCallback((s: StructInfo) => {
    setEditedStruct(s)
  }, [])

  const mapErrorToStatus = (error?: string, backendStatus?: BackendStatus): `${UploadCardStatusCode}` => {
    // 优先按后端数值状态映射
    if (backendStatus === BackendStatus.InProgress) return UploadCardStatusCode.Uploading
    if (backendStatus === BackendStatus.Success) return UploadCardStatusCode.Success
    if (backendStatus === BackendStatus.Failed) return UploadCardStatusCode.UploadFailed
    if (backendStatus === BackendStatus.ParseFailed) return UploadCardStatusCode.ParseFailed
    if (backendStatus === BackendStatus.ImportMissingInfo) return UploadCardStatusCode.ImportMissingInfo
    switch (error) {
      case '文件格式不支持':
        return UploadCardStatusCode.FormatUnsupported
      case '文件损坏':
        return UploadCardStatusCode.FileCorrupted
      case '解析失败':
        return UploadCardStatusCode.ParseFailed
      case '解析内容异常':
        return UploadCardStatusCode.ParseAbnormal
      case '录入失败':
        return UploadCardStatusCode.ImportFailed
      case '录入中缺失信息':
        return UploadCardStatusCode.ImportMissingInfo
      case '简历超出上传限制':
        return UploadCardStatusCode.ExceedLimit
      default:
        return UploadCardStatusCode.UploadFailed
    }
  }

  const groups = useMemo(() => {
    // 优先使用接口返回的数字状态分组：0-进行中 10-成功 20/30/31-失败
    const running = items.filter((i) => i.numericStatus === BackendStatus.InProgress)
    const success = items.filter((i) => i.numericStatus === BackendStatus.Success)
    const failed = items.filter(
      (i) =>
        i.numericStatus === BackendStatus.Failed ||
        i.numericStatus === BackendStatus.ParseFailed ||
        i.numericStatus === BackendStatus.ImportMissingInfo
    )
    return { running, failed, success }
  }, [items])

  async function handleManualEdit(file: FileItem) {
    setCurrentName(file.name)
    setResumeOpen(true)
    setResumeStruct(null)
    setCurrentResumeId(null)
    const resumeId = file.backend?.id
    if (!resumeId) {
      setResumeValues({
        name: file.name,
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
      })
      return
    }
    setCurrentResumeId(resumeId)
    const res = await fetchResumeDetail(resumeId)
    const struct = res.success ? (res.item?.backend?.struct_info as StructInfo | undefined) : undefined
    if (struct) {
      setResumeValues(null)
      setResumeStruct(struct)
    } else {
      setResumeValues({
        name: file.name,
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
      })
    }
  }

  async function handleRefresh(options?: { refreshCounts?: boolean }) {
    const refreshCounts = options?.refreshCounts ?? false
    // 改为调用 headhunter/resumes 接口（枚举值）
    const statusParam = tab === 'running' ? BackendStatus.InProgress : tab === 'success' ? BackendStatus.Success : BackendStatus.Failed
    const skip = (page - 1) * pageSize
    const res = await fetchResumes({ skip, limit: pageSize, status: statusParam })
    if (!res.success) return
    const refreshed: FileItem[] = res.data.map((r: UploadResultItem, idx: number) => ({
      id: `${r.backend.id}-${idx}`,
      name: r.data?.originalName || r.fileName || `文件_${idx + 1}`,
      ext: r.data?.ext || 'pdf',
      status_code: r.success ? UploadCardStatusCode.Success : mapErrorToStatus(undefined, r.status),
      numericStatus: r.status,
      errorMsg: r.error,
      progress: 100,
      backend: { id: r.backend.id },
    }))
    setItems(refreshed)
    setTotal(res.count)
    // 解析耗时：后端单位为秒，前端显示分钟，向上取整
    const minutes = Math.max(1, Math.ceil((res.average_parse_time ?? 0) / 60))
    setAvgParseMinutes(minutes)

    // 仅在需要时刷新计数，尽量避免重复请求
    if (refreshCounts) {
      const getCount = async (statusValue: BackendStatus) => {
        const r = await fetchResumes({ skip: 0, limit: 1, status: statusValue })
        return r.count || 0
      }

      const currentTab = tab
      let runningCount = counts.running
      let failedCount = counts.failed
      let successCount = counts.success

      // running 与 success 可以复用当前接口返回的 count，减少请求
      if (currentTab === 'running') {
        runningCount = res.count
      }
      if (currentTab === 'success') {
        successCount = res.count
      }

      const promises: Promise<void>[] = []
      if (currentTab !== 'running') {
        promises.push(
          getCount(BackendStatus.InProgress).then((c) => {
            runningCount = c
          })
        )
      }
      if (currentTab !== 'success') {
        promises.push(
          getCount(BackendStatus.Success).then((c) => {
            successCount = c
          })
        )
      }

      // 失败需要聚合（20/30/31）
      if (currentTab === 'failed') {
        // res.count 仅代表 Failed(20)，仍需补齐另外两种失败状态
        let parseFailed = 0
        let importMissing = 0
        await Promise.all([
          getCount(BackendStatus.ParseFailed).then((c) => { parseFailed = c }),
          getCount(BackendStatus.ImportMissingInfo).then((c) => { importMissing = c }),
        ])
        failedCount = res.count + parseFailed + importMissing
      } else {
        let failed = 0
        let parseFailed = 0
        let importMissing = 0
        await Promise.all([
          getCount(BackendStatus.Failed).then((c) => { failed = c }),
          getCount(BackendStatus.ParseFailed).then((c) => { parseFailed = c }),
          getCount(BackendStatus.ImportMissingInfo).then((c) => { importMissing = c }),
        ])
        failedCount = failed + parseFailed + importMissing
      }

      setCounts({ running: runningCount, failed: failedCount, success: successCount })
    }
  }

  // 切换 Tab 或首次加载：拉取列表并刷新计数
  useEffect(() => {
    setTabsDisabled(true)
    void (async () => {
      try {
        await handleRefresh({ refreshCounts: true })
      } finally {
        setTabsDisabled(false)
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab])

  // 分页变化：仅拉取当前 tab 列表，不刷新计数，避免重复调用
  useEffect(() => {
    void handleRefresh({ refreshCounts: false })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize])

  // 当“进行中”列表存在数据时，启动5s自动刷新
  const isPollingRef = useRef(false)
  useEffect(() => {
    if (tab !== 'running' || groups.running.length === 0) return

    const intervalId = setInterval(async () => {
      if (isPollingRef.current) return
      isPollingRef.current = true
      try {
        // 轮询也刷新计数，确保 Tab 数字实时更新
        await handleRefresh({ refreshCounts: true })
      } finally {
        isPollingRef.current = false
      }
    }, 5000)

    return () => {
      clearInterval(intervalId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, groups.running.length])

  return (
    <>
      <Header fixed>
        <div className='ml-auto flex items-center space-x-4'>
          <ProfileDropdown />
        </div>
      </Header>

      <Main fixed>
        <div className='space-y-0.5'>
          <div className='flex items-start justify-between'>
            <div>
              <h1 className='text-2xl font-bold tracking-tight md:text-3xl mb-2'>批量上传简历</h1>
            </div>
            {items.length > 0 && (
              <Button variant='outline' onClick={() => { void handleRefresh({ refreshCounts: true }) }}>刷新</Button>
            )}
          </div>
        </div>
        <Separator className='my-4 lg:my-6' />

        <div className='space-y-6 overflow-y-auto'>
          <UploadArea
            onUploadComplete={(_results: UploadResult[]) => {
              // 上传完成后，不再直接使用 upload 接口返回渲染，改为调用 headhunter/resumes 拉取
              void handleRefresh({ refreshCounts: true })
            }}
          />

          <Tabs
            value={tab}
            onValueChange={(v) => {
              if (tabsDisabled) return
              setTabsDisabled(true)
              setTab(v as typeof tab)
            }}
            className="w-full"
            disabled={tabsDisabled}
          >
            <TabsList>
              <TabsTrigger value="running">进行中({counts.running})</TabsTrigger>
              <TabsTrigger value="failed">失败({counts.failed})</TabsTrigger>
              <TabsTrigger value="success">成功({counts.success})</TabsTrigger>
            </TabsList>

            <TabsContent value="running">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {groups.running.map((f) => (
                  <UploadCard key={f.id} fileName={f.name} fileExt={f.ext} status_code={f.status_code} errorMsg={f.errorMsg} parseMinutes={avgParseMinutes} onManualEdit={() => { void handleManualEdit(f) }} />
                ))}
              </div>
            </TabsContent>
            <TabsContent value="failed">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {groups.failed.map((f) => (
                  <UploadCard
                    key={f.id}
                    fileName={f.name}
                    fileExt={f.ext}
                    status_code={f.status_code}
                    errorMsg={f.errorMsg}
                    parseMinutes={avgParseMinutes}
                    onManualEdit={() => { void handleManualEdit(f) }}
                    onRetryUpload={async () => {
                      // 失败项重试：重拉当前列表并刷新计数
                      await handleRefresh({ refreshCounts: true })
                    }}
                  />
                ))}
              </div>
            </TabsContent>
            <TabsContent value="success">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {groups.success.map((f) => (
                  <UploadCard key={f.id} fileName={f.name} fileExt={f.ext} status_code={f.status_code} errorMsg={f.errorMsg} parseMinutes={avgParseMinutes} onManualEdit={() => { void handleManualEdit(f) }} />
                ))}
              </div>
            </TabsContent>
          </Tabs>

          {/* 简单分页器（与 users 的分页组件风格保持一致性可后续复用） */}
          <div className="flex items-center justify-between pt-2">
            <div className="text-sm text-muted-foreground">共 {total} 条</div>
            <div className="flex items-center gap-2">
              <select
                className="h-8 rounded-md border px-2"
                value={pageSize}
                onChange={(e) => {
                  setPage(1)
                  setPageSize(Number(e.target.value))
                }}
                aria-label="每页条数"
              >
                <option value={10}>10/页</option>
                <option value={20}>20/页</option>
                <option value={30}>30/页</option>
              </select>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>{'<'}</Button>
                <div className="text-sm">第 {page} 页</div>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page * pageSize >= total}
                  onClick={() => setPage((p) => p + 1)}
                >
                  {'>'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Main>

      {/* Drawer: 简历预览（复用人才库预览样式） */}
      <Sheet open={resumeOpen} onOpenChange={setResumeOpen}>
        <SheetContent className='flex w-full sm:max-w-none md:w-[85vw] lg:w-[60vw] xl:w-[50vw] flex-col px-4 md:px-5'>
          <SheetTitle className='sr-only'>简历预览</SheetTitle>
          <div className='flex pt-2 pb-2'>
            <div className='text-2xl font-semibold'>{resumeStruct?.basic_info?.name ?? currentName}</div>
          </div>
          {resumeStruct ? (
            <TalentResumePreview
              struct={resumeStruct}
              fallbackName={currentName}
              onStructChange={handleStructChange}
              footer={
                <div className='flex gap-2 justify-end'>
                  <Button variant='outline' onClick={() => setResumeOpen(false)}>关闭</Button>
                  <Button onClick={async () => {
                    // 先触发表单校验（复用人才库预览的事件）
                    const isValid = await new Promise<boolean>((resolve) => {
                      const ev = new CustomEvent('talent-resume-preview:validate', { detail: { resolve } }) as Event
                      window.dispatchEvent(ev)
                    })
                    if (!isValid) return
                    if (!currentResumeId) {
                      setResumeOpen(false)
                      setResumeValues(null)
                      setResumeStruct(null)
                      return
                    }
                    const payload = editedStruct ?? resumeStruct ?? ({} as StructInfo)
                    const result = await updateResumeDetail(currentResumeId, payload)
                    if (result.success) {
                      toast.success('提交成功')
                      await handleRefresh({ refreshCounts: true })
                    } else {
                      toast.error('提交失败')
                    }
                    setResumeOpen(false)
                    setResumeValues(null)
                    setResumeStruct(null)
                  }}>提交</Button>
                </div>
              }
            />
          ) : (
            resumeValues && (
              <TalentResumePreview
                values={resumeValues}
                onStructChange={handleStructChange}
                footer={<Button onClick={() => setResumeOpen(false)}>关闭</Button>}
              />
            )
          )}
        </SheetContent>
      </Sheet>
    </>
  )
}


