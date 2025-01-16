import { Card } from "@/components/ui/card"
import { Avatar } from "@/components/ui/avatar"
import { formatDistanceToNow } from "date-fns"
import { AspectRatio } from "@/components/ui/aspect-ratio"
import { useState, useEffect } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { ThumbsUp, MessageCircle, Send } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/contexts/AuthContext"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { AuthPromptDialog } from "./AuthPromptDialog"

interface TimelinePostProps {
  id: string
  content: string
  mediaUrl?: string
  mediaType?: string
  createdAt: Date
  author: {
    username?: string
    role: string
  }
  eventId: string
  requireAuth?: boolean
  onAuthRequired?: () => void
}

interface Comment {
  id: string
  content: string
  createdAt: string
  user: {
    username: string | null
  }
  userId: string
  postId: string
}

const getYouTubeVideoId = (url: string) => {
  try {
    const urlObj = new URL(url);
    if (urlObj.hostname.includes('youtube.com') || urlObj.hostname.includes('youtu.be')) {
      const searchParams = new URLSearchParams(urlObj.search);
      return searchParams.get('v') || urlObj.pathname.slice(1);
    }
  } catch (e) {
    console.error('Error parsing video URL:', e);
  }
  return null;
};

export function TimelinePost({ 
  id, 
  content, 
  mediaUrl, 
  mediaType, 
  createdAt, 
  author, 
  eventId,
  requireAuth,
  onAuthRequired 
}: TimelinePostProps) {
  const [isMediaLoading, setIsMediaLoading] = useState(true);
  const [mediaError, setMediaError] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const { user } = useAuth();
  const [showAuthDialog, setShowAuthDialog] = useState(false);

  // Load initial likes count and user's like status
  useEffect(() => {
    const loadLikes = async () => {
      if (!eventId || !id) return;
      
      try {
        const response = await fetch(`/api/timeline/${eventId}/posts/${id}/likes`);
        if (!response.ok) {
          console.error('Error loading likes:', response.statusText);
          return;
        }
        const data = await response.json();
        setLikesCount(data.count || 0);
        setLiked(!!data.userLiked);
      } catch (error) {
        console.error('Error loading likes:', error);
      }
    };

    loadLikes();
  }, [eventId, id]);

  const isYouTubeVideo = mediaType === "video" && mediaUrl?.includes("youtube");
  const youtubeVideoId = isYouTubeVideo ? getYouTubeVideoId(mediaUrl || "") : null;

  const handleMediaLoad = () => {
    setIsMediaLoading(false);
    setMediaError(false);
  };

  const handleMediaError = () => {
    setIsMediaLoading(false);
    setMediaError(true);
  };

  const handleInteraction = async (action: () => void) => {
    console.log('Handling interaction - User:', !!user, 'RequireAuth:', requireAuth);
    if (requireAuth && !user) {
      console.log('Auth required but no user - showing auth dialog');
      setShowAuthDialog(true);
      if (onAuthRequired) {
        onAuthRequired();
      }
      return;
    }
    try {
      await action();
    } catch (error) {
      console.error('Error during interaction:', error);
    }
  };

  const toggleLike = async () => {
    if (!user) return;

    try {
      const method = liked ? 'DELETE' : 'POST';
      await fetch(`/api/timeline/${eventId}/posts/${id}/likes`, {
        method,
      });
      setLiked(!liked);
      setLikesCount(prev => liked ? prev - 1 : prev + 1);
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const loadComments = async () => {
    try {
      const response = await fetch(`/api/timeline/${eventId}/posts/${id}/comments`);
      const data = await response.json();
      setComments(data);
    } catch (error) {
      console.error('Error loading comments:', error);
    }
  };

  const submitComment = async () => {
    if (!newComment.trim() || !user) return;

    try {
      const response = await fetch(`/api/timeline/${eventId}/posts/${id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: newComment }),
      });
      const data = await response.json();
      setComments(prev => [data, ...prev]);
      setNewComment("");
    } catch (error) {
      console.error('Error submitting comment:', error);
    }
  };

  useEffect(() => {
    if (showComments) {
      loadComments();
    }
  }, [showComments]);

  return (
    <>
      <AuthPromptDialog 
        open={showAuthDialog} 
        onOpenChange={setShowAuthDialog}
      />
      <Card className="overflow-hidden mb-4">
      <div className="p-4">
        <div className="flex items-start space-x-4">
          <Avatar className="w-10 h-10">
            <div className="w-full h-full flex items-center justify-center bg-primary text-primary-foreground">
              {author.username?.[0]?.toUpperCase() || "U"}
            </div>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <span className="font-medium">{author.username || "Anonymous"}</span>
              <span className="text-sm text-muted-foreground">
                {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
              </span>
              <span className="text-sm text-primary">{author.role}</span>
            </div>
            <p className="mt-2 text-sm whitespace-pre-wrap">{content}</p>
          </div>
        </div>
      </div>

      {mediaUrl && (
        <div className="mt-2">
          {mediaType === "image" ? (
            <AspectRatio ratio={16 / 9} className="bg-muted">
              {isMediaLoading && (
                <Skeleton className="w-full h-full absolute inset-0" />
              )}
              {!mediaError ? (
                <img
                  src={mediaUrl}
                  alt="Post media"
                  className={`w-full h-full object-cover transition-opacity duration-200 ${
                    isMediaLoading ? 'opacity-0' : 'opacity-100'
                  }`}
                  loading="lazy"
                  onLoad={handleMediaLoad}
                  onError={handleMediaError}
                  crossOrigin="anonymous"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  Failed to load image
                </div>
              )}
            </AspectRatio>
          ) : mediaType === "video" ? (
            <AspectRatio ratio={16 / 9} className="bg-muted">
              {isYouTubeVideo && youtubeVideoId ? (
                <iframe
                  src={`https://www.youtube.com/embed/${youtubeVideoId}`}
                  title="YouTube video"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                  onLoad={handleMediaLoad}
                  onError={handleMediaError}
                />
              ) : (
                <>
                  {isMediaLoading && (
                    <Skeleton className="w-full h-full absolute inset-0" />
                  )}
                  <video
                    src={mediaUrl}
                    controls
                    className={`w-full h-full object-contain transition-opacity duration-200 ${
                      isMediaLoading ? 'opacity-0' : 'opacity-100'
                    }`}
                    preload="metadata"
                    onLoadedData={handleMediaLoad}
                    onError={handleMediaError}
                    crossOrigin="anonymous"
                  />
                  {mediaError && (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground absolute inset-0">
                      Failed to load video
                    </div>
                  )}
                </>
              )}
            </AspectRatio>
          ) : null}
        </div>
      )}

      <div className="p-4 pt-2">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            className={`flex items-center space-x-2 ${liked ? 'text-primary' : ''}`}
            onClick={() => handleInteraction(toggleLike)}
          >
            <ThumbsUp className="w-4 h-4" />
            <span>{likesCount} Likes</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="flex items-center space-x-2"
            onClick={() => handleInteraction(() => setShowComments(!showComments))}
          >
            <MessageCircle className="w-4 h-4" />
            <span>{comments.length} Comments</span>
          </Button>
        </div>

        {showComments && (
          <div className="mt-4">
            <div className="flex space-x-2">
              <Input
                placeholder={requireAuth && !user ? "Sign in to comment" : "Write a comment..."}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && user) {
                    submitComment();
                  }
                }}
                disabled={requireAuth && !user}
              />
              <Button 
                size="icon" 
                onClick={() => handleInteraction(submitComment)}
                disabled={!newComment.trim() || (requireAuth && !user)}
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>

            <ScrollArea className="h-[200px] mt-4">
              {comments.map((comment, index) => (
                <div key={comment.id}>
                  {index > 0 && <Separator className="my-2" />}
                  <div className="py-2">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-sm">
                        {comment.user.username || "Anonymous"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-sm mt-1">{comment.content}</p>
                  </div>
                </div>
              ))}
            </ScrollArea>
          </div>
        )}
      </div>
    </Card>
    </>
  )
}