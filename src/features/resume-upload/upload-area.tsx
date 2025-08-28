import React, { useState, useRef } from 'react'
import { Upload, FileIcon, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import Progress from '@/components/ui/progress'
import { uploadFiles, type UploadResultItem } from './utils/api'
import { toast } from 'sonner'

export type UploadResult = UploadResultItem

interface UploadAreaProps {
  onUploadComplete?: (results: UploadResult[]) => void
}

export function UploadArea({ onUploadComplete }: UploadAreaProps) {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [dragOver, setDragOver] = useState(false)
  const [uploadingFiles, setUploadingFiles] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  

  const handleUpload = async (files: File[]) => {
    if (files.length === 0) return

    setUploading(true)
    setUploadingFiles(files)
    setProgress(0)

    try {
      const formData = new FormData()
      files.forEach((file) => {
        formData.append('files', file)
      })

      // 模拟进度更新
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          const newProgress = prev + Math.random() * 15
          return newProgress >= 90 ? 90 : newProgress
        })
      }, 200)

      const response = await uploadFiles(formData)

      clearInterval(progressInterval)
      setProgress(100)
      if (response.success) {
        // 后端已经返回了正确格式的 UploadResult[]
        const results: UploadResult[] = response.data

        toast.success(`文件已上传，正在解析中...`)
        onUploadComplete?.(results)
      } else {
        toast.error('上传失败')
      }
    } catch (error) {
      const err = error as { message?: string }
      toast.error(`上传失败：${err?.message || '未知错误'}`)
    } finally {
      setUploading(false)
      setUploadingFiles([])
      setProgress(0)
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    handleUpload(files)
  }

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setDragOver(false)
    const files = Array.from(event.dataTransfer.files)
    handleUpload(files)
  }

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = () => {
    setDragOver(false)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <Card
        className={`transition-all duration-300 cursor-pointer rounded-[12px] border-2 border-dashed ${
          dragOver
            ? 'border-[#4E02E4]/50 bg-[#4E02E4]/10 scale-[1.02]'
            : 'border-[#4E02E4]/50 bg-[#4E02E4]/10'
        }`}
        onClick={() => fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <CardContent className="p-12 text-center">
          <div className="flex flex-col items-center justify-center space-y-6">
            <div className={`transition-all duration-300 ${dragOver ? 'scale-110' : ''}`}>
              <Upload className="h-16 w-16 text-muted-foreground" />
            </div>

            <div className="space-y-3">
              <h3 className="text-xl font-semibold">{dragOver ? '释放鼠标以上传' : '批量上传简历'}</h3>
              <p className="text-sm text-muted-foreground">支持拖拽或点击选择多个文件</p>
            </div>

            <Button size="lg" className="pointer-events-none" disabled={uploading}>
              选择文件
            </Button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFileSelect}
            disabled={uploading}
            aria-label="选择文件"
            title="选择文件"
          />
        </CardContent>
      </Card>

      {/* Upload Progress */}
      {uploading && (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-semibold">正在上传文件</h4>
                <span className="text-sm text-muted-foreground">{Math.round(progress)}%</span>
              </div>

              <Progress value={progress} className="h-2" />

              <div className="space-y-3">
                {uploadingFiles.map((file, index) => (
                  <div key={index} className="flex items-center space-x-3 p-3 bg-muted/30 rounded-lg">
                    <FileIcon className="h-8 w-8 text-blue-500" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                    </div>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}



