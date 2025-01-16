import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Image, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/contexts/AuthContext"

interface ImageUploadProps {
  value?: string;
  onChange?: (value: string) => void;
  onImageSelect?: (value: string) => void;
  className?: string;
  key?: string | number;
}

export function ImageUpload({ value, onChange, onImageSelect, className }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [preview, setPreview] = useState<string | undefined>(value)
  const { toast } = useToast()
  const { user } = useAuth()

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    if (!user) {
      toast({
        variant: "destructive",
        title: "Authentication Required",
        description: "Please log in to upload images.",
      })
      return
    }

    // Validate file type
    if (!['image/jpeg', 'image/png', 'image/gif'].includes(file.type)) {
      console.log('Client-side file type:', file.type);
      toast({
        variant: "destructive",
        title: "Invalid File Type",
        description: `Only JPEG, PNG and GIF files are allowed. Received: ${file.type}`,
      })
      return
    }

    // Validate file size
    if (file.size > 10 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "File Too Large",
        description: "Maximum file size is 10MB.",
      })
      return
    }

    // Create preview immediately
    const objectUrl = URL.createObjectURL(file)
    setPreview(objectUrl)

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      console.log('Uploading file:', {
        name: file.name,
        type: file.type,
        size: file.size
      })

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
        // Add duplex option required by Node.js for streaming
        duplex: 'half'
      } as RequestInit)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('Upload response error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        })
        throw new Error(errorData.details || errorData.message || 'Upload failed')
      }

      const data = await response.json()

      if (!data.url) {
        throw new Error('No URL returned from upload')
      }

      console.log('Upload successful:', data)

      if (onChange) onChange(data.url)
      if (onImageSelect) onImageSelect(data.url)
      
      toast({
        title: "Success",
        description: "Image uploaded successfully",
      })
    } catch (error) {
      console.error('Upload error:', error)
      toast({
        variant: "destructive",
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to upload image. Please try again.",
      })
      // Revert to previous image if upload fails
      setPreview(value)
    } finally {
      setIsUploading(false)
    }
  }, [onChange, value, toast, user, onImageSelect])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/gif': ['.gif']
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
    disabled: isUploading
  })

  return (
    <div
      {...getRootProps()}
      className={cn(
        'border-2 border-dashed rounded-lg p-4 cursor-pointer transition-colors max-w-[200px]',
        isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25',
        isUploading ? 'opacity-50 pointer-events-none' : '',
        className
      )}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center justify-center space-y-2 text-center">
        {preview ? (
          <img
            src={preview}
            alt="Preview"
            className="w-full h-32 object-cover rounded-lg"
            onError={() => {
              console.error('Image preview failed to load')
              setPreview(undefined)
              toast({
                variant: "destructive",
                title: "Preview Error",
                description: "Failed to load image preview",
              })
            }}
          />
        ) : (
          <Image className="h-10 w-10 text-muted-foreground" />
        )}
        <div className="text-sm text-muted-foreground">
          {isUploading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Uploading...</span>
            </div>
          ) : isDragActive ? (
            'Drop the image here'
          ) : (
            <>
              <span className="font-semibold text-primary">Click to upload</span> or drag and drop
              <div className="text-xs">PNG, JPG, GIF up to 10MB</div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}