import { useRouter } from 'next/router'
import { useEffect, useState, useCallback, useRef } from 'react'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import PreviewContent from '@/components/PreviewContent'
import { useAppearance } from '@/components/AppearanceProvider'

export default function ClubPreview() {
  const router = useRouter()
  const { username } = router.query
  const [loading, setLoading] = useState(true)
  const [links, setLinks] = useState<any[]>([])
  const [error, setError] = useState('')
  const [userId, setUserId] = useState<string | null>(null)
  const { settings, setExternalSettings } = useAppearance()
  const fetchTimeoutRef = useRef<NodeJS.Timeout>()
  const lastFetchedUsernameRef = useRef<string>()

  const fetchUserData = useCallback(async (username: string, signal: AbortSignal) => {
    if (!username || lastFetchedUsernameRef.current === username) return
    
    try {
      const response = await fetch(`/api/user?username=${username}`, {
        signal,
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      })
      const data = await response.json()

      if (response.ok) {
        setLinks(data.links)
        if (data.appearance) {
          setExternalSettings(data.appearance)
        }
        setUserId(data.userId)
        lastFetchedUsernameRef.current = username
      } else {
        setError('Club profile not found')
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return
      setError('Failed to load club profile')
    } finally {
      setLoading(false)
    }
  }, [setExternalSettings])

  useEffect(() => {
    const controller = new AbortController()

    if (router.isReady && username && typeof username === 'string') {
      // Clear any existing timeout
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current)
      }

      // Set a small delay to prevent multiple rapid requests
      fetchTimeoutRef.current = setTimeout(() => {
        fetchUserData(username, controller.signal)
      }, 100)
    }

    return () => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current)
      }
      controller.abort()
    }
  }, [username, router.isReady, fetchUserData])

  if (!router.isReady || loading) {
    return (
      <div className="min-h-screen w-full" style={{ backgroundColor: settings?.backgroundColor }}>
        <div className="container mx-auto p-4">
          <Card className="p-6">
            <Skeleton className="h-8 w-[250px] mb-4" />
            <Skeleton className="h-4 w-[300px] mb-2" />
            <Skeleton className="h-4 w-[200px]" />
          </Card>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen w-full" style={{ backgroundColor: settings?.backgroundColor }}>
        <div className="container mx-auto p-4">
          <Card className="p-6">
            <h1 className="text-2xl font-bold text-red-500">{error}</h1>
            <p className="text-gray-600 mt-2">Please check the URL and try again.</p>
            <p className="text-gray-500 text-sm mt-4">The URL should be in the format: https://[domain]/[club-username]</p>
            {username && <p className="text-gray-500 text-sm mt-2">Current username: {username}</p>}
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full" style={{ backgroundColor: settings?.backgroundColor }}>
      <div className="max-w-lg mx-auto">
        <PreviewContent links={links} userId={userId} username={username as string} />
      </div>
    </div>
  )
}