import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { ImageUpload } from "@/components/ImageUpload"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface CreateTimelinePostProps {
  onSubmit: (data: {
    content: string
    mediaUrl?: string
    mediaType?: "image" | "video"
  }) => Promise<void>
  isLoading: boolean
}

export function CreateTimelinePost({ onSubmit, isLoading }: CreateTimelinePostProps) {
  const [content, setContent] = useState("")
  const [mediaUrl, setMediaUrl] = useState("")
  const [mediaType, setMediaType] = useState<"image" | "video" | undefined>()
  const [error, setError] = useState("")
  const [uploadKey, setUploadKey] = useState(0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return

    try {
      await onSubmit({
        content,
        mediaUrl: mediaUrl || undefined,
        mediaType: mediaUrl ? mediaType : "text",
      })
      // Reset form
      setContent("")
      setMediaUrl("")
      setMediaType(undefined)
      setError("")
      
      // Force re-render of ImageUpload component
      setUploadKey(prev => prev + 1)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create post")
    }
  }

  const handleVideoUrlChange = (url: string) => {
    setMediaUrl(url)
    setMediaType("video")
  }

  const handleImageUpload = (url: string) => {
    setMediaUrl(url)
    setMediaType("image")
  }

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit}>
        <Tabs defaultValue="text" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="text">Text</TabsTrigger>
            <TabsTrigger value="image">Image</TabsTrigger>
            <TabsTrigger value="video">Video</TabsTrigger>
          </TabsList>

          <TabsContent value="text">
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share your race moment..."
              className="w-full min-h-[100px]"
            />
          </TabsContent>

          <TabsContent value="image">
            <div className="space-y-4">
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Add a caption..."
                className="w-full"
              />
              <div className="border-2 border-dashed border-gray-200 rounded-lg p-4">
                <ImageUpload 
                  key={uploadKey}
                  onChange={handleImageUpload}
                  onImageSelect={handleImageUpload}
                  value={mediaUrl}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="video">
            <div className="space-y-4">
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Add a caption..."
                className="w-full"
              />
              <div className="space-y-2">
                <Label htmlFor="videoUrl">Video URL</Label>
                <Input
                  id="videoUrl"
                  type="url"
                  placeholder="Enter video URL..."
                  value={mediaUrl}
                  onChange={(e) => handleVideoUrlChange(e.target.value)}
                />
              </div>
              {mediaType === "video" && mediaUrl && (
                <div className="mt-4">
                  <video
                    src={mediaUrl}
                    controls
                    className="max-h-48 w-full rounded-lg"
                  />
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="mt-4 flex justify-end">
          <Button type="submit" disabled={isLoading || !content.trim()}>
            {isLoading ? "Posting..." : "Post"}
          </Button>
        </div>
      </form>
    </Card>
  )
}