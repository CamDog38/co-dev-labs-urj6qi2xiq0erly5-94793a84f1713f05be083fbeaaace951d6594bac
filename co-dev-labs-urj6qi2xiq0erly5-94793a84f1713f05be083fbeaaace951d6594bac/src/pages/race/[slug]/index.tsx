import { useEffect, useState } from "react"
import { useRouter } from "next/router"
import { useAuth } from "@/contexts/AuthContext"
import { TimelinePost } from "@/components/TimelinePost"
import { CreateTimelinePost } from "@/components/CreateTimelinePost"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { RaceAuthForm } from "@/components/RaceAuthForm"

interface Post {
  id: string
  content: string
  mediaUrl?: string
  mediaType?: string
  createdAt: string
  author: {
    username?: string
    role: string
  }
  isApproved: boolean
}

interface TimelineData {
  id: string
  eventId: string
  isActive: boolean
  requireApproval: boolean
  allowPublicViewing: boolean
  allowParticipantPosting: boolean
  event: {
    id: string
    title: string
    description?: string
    userId: string
  }
  posts: Post[]
}

export default function RaceTimeline() {
  const router = useRouter()
  const { slug } = router.query
  const { user } = useAuth()
  const [timeline, setTimeline] = useState<TimelineData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [showAuthDialog, setShowAuthDialog] = useState(false)

  const fetchTimeline = async () => {
    try {
      const response = await fetch(`/api/timeline/event/${slug}`)
      const responseData = await response.json()
      
      if (!response.ok) {
        throw new Error(responseData.error || "Failed to fetch timeline")
      }
      
      setTimeline(responseData)
      setError("")
    } catch (error) {
      console.error("[Frontend] Error fetching timeline:", error)
      setError(error instanceof Error ? error.message : "Unable to load timeline")
      setTimeline(null)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (router.isReady && slug) {
      fetchTimeline()
    }
  }, [router.isReady, slug])

  const handleCreatePost = async (data: {
    content: string
    mediaUrl?: string
    mediaType?: "image" | "video"
  }) => {
    if (!timeline) return

    if (!user) {
      setShowAuthDialog(true)
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/timeline/${timeline.eventId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      const responseData = await response.json()

      if (!response.ok) {
        throw new Error(responseData.error || "Failed to create post")
      }

      setTimeline(prev => prev ? {
        ...prev,
        posts: [responseData, ...prev.posts]
      } : null)
    } catch (error) {
      console.error("[Frontend] Error creating post:", error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  if (!router.isReady || isLoading) {
    return (
      <div className="container mx-auto py-8 max-w-3xl">
        <Card className="p-6 mb-8">
          <Skeleton className="h-8 w-[250px] mb-4" />
          <Skeleton className="h-4 w-[300px] mb-2" />
          <Skeleton className="h-4 w-[200px]" />
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <Card className="p-6">
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </Card>
      </div>
    )
  }

  if (!timeline) {
    return (
      <div className="container mx-auto py-8">
        <Card className="p-6">
          <Alert>
            <AlertDescription>Timeline not found</AlertDescription>
          </Alert>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 max-w-3xl">
      <Card className="p-6 mb-8">
        <h1 className="text-2xl font-bold mb-4">{timeline.event.title}</h1>
        {timeline.event.description && (
          <p className="text-muted-foreground">{timeline.event.description}</p>
        )}
      </Card>

      {timeline.allowParticipantPosting && user && (
        <Card className="p-6 mb-8">
          <CreateTimelinePost 
            onSubmit={handleCreatePost}
            isLoading={isLoading}
          />
        </Card>
      )}

      <div className="space-y-4">
        {timeline.posts.map((post) => (
          <TimelinePost 
            key={post.id} 
            {...post} 
            createdAt={new Date(post.createdAt)}
            requireAuth={!timeline.allowPublicViewing}
          />
        ))}
      </div>

      {timeline.allowParticipantPosting && !user && (
        <Dialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
          <DialogContent className="sm:max-w-md">
            <RaceAuthForm onSuccess={fetchTimeline} />
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}