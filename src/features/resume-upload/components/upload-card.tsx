import { FileIcon, Upload, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { motion, useAnimation } from 'framer-motion'
import { useEffect, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { UploadCardStatusCode } from '@/features/resume-upload/types'
import { uploadFiles } from '@/features/resume-upload/utils/api'
import { toast } from 'sonner'

export type UploadStatusCode = `${UploadCardStatusCode}`

export interface UploadCardProps {
  fileName: string
  fileExt?: string
  status_code: UploadStatusCode
  onRetryUpload?: () => void
  onRetryParse?: () => void
  onRetryImport?: () => void
  onManualEdit?: () => void
  errorMsg?: string
  parseMinutes?: number
}

const statusTextMap: Record<UploadStatusCode, string> = {
  [UploadCardStatusCode.Queued]: '正在上传中',
  [UploadCardStatusCode.Uploading]: '正在解析中，预计需要5分钟',
  [UploadCardStatusCode.Uploaded]: '上传完成',
  [UploadCardStatusCode.Parsing]: '正在解析中',
  [UploadCardStatusCode.Parsed]: '解析完成',
  [UploadCardStatusCode.Importing]: '候选人信息录入中',
  [UploadCardStatusCode.Success]: '上传成功',
  [UploadCardStatusCode.UploadFailed]: '上传失败',
  [UploadCardStatusCode.FormatUnsupported]: '文件格式不支持',
  [UploadCardStatusCode.FileCorrupted]: '文件损坏',
  [UploadCardStatusCode.ExceedLimit]: '简历超出上传限制',
  [UploadCardStatusCode.ParseFailed]: '解析失败',
  [UploadCardStatusCode.ParseAbnormal]: '解析内容异常',
  [UploadCardStatusCode.ImportFailed]: '录入失败',
  [UploadCardStatusCode.ImportMissingInfo]: '录入中缺失信息',
  [UploadCardStatusCode.DuplicateExists]: '已在系统中存在',
}

function getRetryButtonLabel(status: UploadStatusCode, errorMsg?: string): string {
  const needUpdateInfoMessages = [
    '解析结果中缺少有效的手机号',
    '解析结果中缺少有效的邮箱',
    '解析结果中缺少有效的姓名',
    '解析结果中缺少有效的性别',
  ]
  if (needUpdateInfoMessages.includes(errorMsg || '')) {
    return '更新信息'
  }
  if (
    status === UploadCardStatusCode.ParseFailed ||
    status === UploadCardStatusCode.ParseAbnormal
  ) {
    return '重新解析'
  }
  if (status.startsWith('import_')) {
    return '重新录入'
  }
  return '重新上传'
}

export default function UploadCard({
  fileName,
  status_code,
  onRetryUpload,
  onRetryParse,
  onRetryImport,
  onManualEdit,
  errorMsg,
  parseMinutes = 5,
}: UploadCardProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const isError = status_code.includes('failed') ||
    status_code === UploadCardStatusCode.FormatUnsupported ||
    status_code === UploadCardStatusCode.FileCorrupted ||
    status_code === UploadCardStatusCode.ExceedLimit ||
    status_code === UploadCardStatusCode.ParseAbnormal

  const handleFilesSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    if (files.length === 0) return
    const formData = new FormData()
    files.forEach((file) => formData.append('files', file))
    try {
      const res = await uploadFiles(formData)
      if (res.success) {
        toast.success('文件已上传，正在解析中...')
        onRetryUpload?.()
      }
    } catch {
      // ignore, 页面其他地方会有统一错误提示
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  function handleRetryButtonClick() {
    const label = getRetryButtonLabel(status_code, errorMsg)
    if (label === '重新上传') {
      fileInputRef.current?.click()
      return
    }
    if (label === '重新解析') {
      onRetryParse?.()
      return
    }
    // 手动编辑 / 更新信息 / 重新录入 等等
    if (onManualEdit) {
      onManualEdit()
      return
    }
    onRetryImport?.()
  }

  const showRetry =
    status_code === UploadCardStatusCode.UploadFailed ||
    status_code === UploadCardStatusCode.FormatUnsupported ||
    status_code === UploadCardStatusCode.FileCorrupted ||
    status_code === UploadCardStatusCode.ParseFailed ||
    status_code === UploadCardStatusCode.ParseAbnormal ||
    status_code === UploadCardStatusCode.ImportFailed ||
    status_code === UploadCardStatusCode.ImportMissingInfo

  return (
    <Card className={cn('border-primary/30')}>
      <CardContent className="p-5">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center text-primary">
            <FileIcon className="h-6 w-6" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium truncate">{fileName}</div>
            <div className={cn('text-sm text-muted-foreground flex items-center gap-2')}
            >
              {isError ? (
                <>
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  <span className="text-destructive">{errorMsg || statusTextMap[status_code]}</span>
                </>
              ) : status_code === UploadCardStatusCode.Success ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <span>{statusTextMap[status_code]}</span>
                </>
              ) : status_code === UploadCardStatusCode.Uploading ? (
                <UploadingTicker minutes={parseMinutes} />
              ) : (
                <>
                  <Upload className="h-4 w-4 text-primary" />
                  <span>{statusTextMap[status_code]}</span>
                </>
              )}
            </div>

          </div>

          {showRetry && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFilesSelected}
                aria-label="重新上传文件"
              />
              <Button size="sm" variant="secondary" onClick={handleRetryButtonClick}>
                {getRetryButtonLabel(status_code, errorMsg)}
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}


function UploadingTicker({ minutes = 5 }: { minutes?: number }) {
  const controls = useAnimation()

  useEffect(() => {
    let isActive = true
    let rafId = 0
    async function loop() {
      while (isActive) {
        controls.set({ y: 0 })
        await new Promise((r) => setTimeout(r, 3000))
        await controls.start({ y: -20, transition: { duration: 0.5, ease: 'easeInOut' } })
        await new Promise((r) => setTimeout(r, 3000))
        await controls.start({ y: -40, transition: { duration: 0.5, ease: 'easeInOut' } })
        controls.set({ y: 0 })
      }
    }
    // 确保在组件挂载后的下一帧再启动动画
    rafId = requestAnimationFrame(() => {
      void loop()
    })
    return () => {
      isActive = false
      cancelAnimationFrame(rafId)
    }
  }, [controls])

  return (
    <div className="flex items-center gap-2">
      <Upload className="h-4 w-4 text-primary" />
      <div className="relative h-5 overflow-hidden">
        <motion.div className="flex flex-col" animate={controls}>
          <span className="leading-5">正在解析中</span>
          <span className="leading-5">预计需要{minutes}分钟</span>
          {/* 复制一份第一行，便于始终向上滚动 */}
          <span className="leading-5">正在解析中</span>
        </motion.div>
      </div>
    </div>
  )
}


