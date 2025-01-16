import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useAuth } from '@/contexts/AuthContext'
import { ChevronUp, ChevronDown } from "lucide-react"

interface Notice {
  id: string
  content: string
  createdAt: string
  sequence: number
  createdBy: {
    email: string
  }
}

interface NoticeBoardProps {
  eventId: string
  notices?: Notice[]
  onNoticeAdded?: () => void
}

export default function NoticeBoard({ eventId, notices: initialNotices, onNoticeAdded }: NoticeBoardProps) {
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [notices, setNotices] = useState<Notice[]>(initialNotices || [])
  const [expandedNotices, setExpandedNotices] = useState<Record<string, boolean>>({})
  const { user } = useAuth()

  const fetchNotices = async () => {
    try {
      const response = await fetch(`/api/notices?eventId=${eventId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch notices');
      }
      const data = await response.json();
      setNotices(data);
    } catch (error) {
      console.error('Error fetching notices:', error);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, [eventId]);

  const handleNoticeAdded = () => {
    fetchNotices();
    if (onNoticeAdded) {
      onNoticeAdded();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!subject.trim() || !message.trim() || isSubmitting) return

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/notices/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: `${subject}\n${message}`,
          eventId,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create notice')
      }

      setSubject('')
      setMessage('')
      handleNoticeAdded()
    } catch (error) {
      console.error('Error creating notice:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReorder = async (noticeId: string, direction: 'up' | 'down') => {
    const currentIndex = notices.findIndex(notice => notice.id === noticeId)
    if (
      (direction === 'up' && currentIndex === 0) ||
      (direction === 'down' && currentIndex === notices.length - 1)
    ) {
      return
    }

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    const newNotices = [...notices]
    const [movedItem] = newNotices.splice(currentIndex, 1)
    newNotices.splice(newIndex, 0, movedItem)

    const updatedNotices = newNotices.map((notice, index) => ({
      ...notice,
      sequence: index,
    }))

    setNotices(updatedNotices)

    try {
      const response = await fetch('/api/notices/reorder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notices: updatedNotices.map((notice) => ({
            id: notice.id,
            sequence: notice.sequence,
          })),
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to reorder notices')
      }
      
      // Call onNoticeAdded to update parent component
      if (onNoticeAdded) {
        onNoticeAdded();
      }
    } catch (error) {
      console.error('Error reordering notices:', error)
    }
  }

  const handleDeleteNotice = async (noticeId: string) => {
    try {
      const response = await fetch(`/api/notices/${noticeId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete notice')
      }

      handleNoticeAdded() // Refresh the notices list
    } catch (error) {
      console.error('Error deleting notice:', error)
    }
  }

  const toggleNotice = (noticeId: string) => {
    setExpandedNotices(prev => ({
      ...prev,
      [noticeId]: !prev[noticeId]
    }))
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const parseNoticeContent = (content: string) => {
    const [subject, ...messageParts] = content.split('\n')
    return {
      subject,
      message: messageParts.join('\n')
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-4">
        <div className="font-medium text-lg">Manage Notices</div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Subject"
          />
          <div className="relative">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Message (max 300 characters)"
              maxLength={300}
              className="min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
            <div className="absolute bottom-2 right-2 text-xs text-gray-500">
              {message.length}/300 characters
            </div>
          </div>
          <Button 
            type="submit" 
            className="w-full"
            disabled={isSubmitting || !subject.trim() || !message.trim()}
          >
            Add Notice
          </Button>
        </form>
      </div>

      <div className="space-y-4">
        <div className="font-medium text-lg">Notices</div>
        <ScrollArea className="h-[400px] w-full rounded-md border">
          {notices.length === 0 ? (
            <div className="p-4 text-sm text-gray-500">No notices posted yet</div>
          ) : (
            <div className="p-4 space-y-4">
              {notices.map((notice, index) => {
                const { subject, message } = parseNoticeContent(notice.content)
                const isExpanded = expandedNotices[notice.id]
                return (
                  <div
                    key={notice.id}
                    className="rounded-lg border bg-card text-card-foreground shadow-sm"
                  >
                    <div className="p-4 space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <h4 className="text-sm font-medium">{subject}</h4>
                          {isExpanded && (
                            <p className="text-sm text-gray-500 whitespace-pre-wrap">{message}</p>
                          )}
                          <p className="text-xs text-gray-500">
                            Added: {formatDate(notice.createdAt)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex flex-col">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleReorder(notice.id, 'up')}
                              disabled={index === 0}
                              className="h-6 px-2"
                            >
                              <ChevronUp className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleReorder(notice.id, 'down')}
                              disabled={index === notices.length - 1}
                              className="h-6 px-2"
                            >
                              <ChevronDown className="h-4 w-4" />
                            </Button>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleNotice(notice.id)}
                          >
                            {isExpanded ? 'Hide' : 'Show'}
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteNotice(notice.id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  )
}