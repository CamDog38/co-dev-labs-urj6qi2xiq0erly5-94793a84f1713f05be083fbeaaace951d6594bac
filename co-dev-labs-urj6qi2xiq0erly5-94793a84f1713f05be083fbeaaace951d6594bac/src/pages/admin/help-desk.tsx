import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/router'
import AdminLayout from '@/components/admin/AdminLayout'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface Ticket {
  id: string
  subject: string
  description: string
  status: string
  priority: string
  createdAt: string
  responses: TicketResponse[]
  createdBy: {
    email: string
    role: string
  }
}

interface TicketResponse {
  id: string
  content: string
  createdAt: string
  createdBy: {
    email: string
    role: string
  }
}

export default function HelpDesk() {
  const { user, loading, isAdmin } = useAuth()
  const router = useRouter()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [response, setResponse] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      router.push('/admin/login')
      return
    }
  }, [user, loading, isAdmin, router])

  useEffect(() => {
    fetchTickets()
  }, [])

  const fetchTickets = async () => {
    try {
      const response = await fetch('/api/tickets')
      const data = await response.json()
      setTickets(data)
    } catch (error) {
      console.error('Error fetching tickets:', error)
    }
  }

  const handleStatusChange = async (ticketId: string, status: string) => {
    try {
      await fetch(`/api/tickets/${ticketId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      })
      fetchTickets()
    } catch (error) {
      console.error('Error updating ticket status:', error)
    }
  }

  const handlePriorityChange = async (ticketId: string, priority: string) => {
    try {
      await fetch(`/api/tickets/${ticketId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ priority }),
      })
      fetchTickets()
    } catch (error) {
      console.error('Error updating ticket priority:', error)
    }
  }

  const handleSubmitResponse = async () => {
    if (!selectedTicket || !response.trim()) return

    try {
      await fetch(`/api/tickets/${selectedTicket.id}/responses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: response }),
      })
      setResponse('')
      fetchTickets()
    } catch (error) {
      console.error('Error submitting response:', error)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-500'
      case 'medium':
        return 'bg-yellow-500'
      case 'low':
        return 'bg-green-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-blue-500'
      case 'in-progress':
        return 'bg-yellow-500'
      case 'closed':
        return 'bg-green-500'
      default:
        return 'bg-gray-500'
    }
  }

  if (loading || !user) {
    return <div>Loading...</div>
  }

  return (
    <AdminLayout>
      <div className="container mx-auto py-6">
        <h1 className="text-2xl font-bold mb-6">Help Desk</h1>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Subject</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Created By</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tickets.map((ticket) => (
              <TableRow key={ticket.id}>
                <TableCell>{ticket.subject}</TableCell>
                <TableCell>
                  <Select
                    value={ticket.status}
                    onValueChange={(value) => handleStatusChange(ticket.id, value)}
                  >
                    <SelectTrigger className="w-[120px]">
                      <SelectValue>
                        <Badge className={getStatusColor(ticket.status)}>
                          {ticket.status}
                        </Badge>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Select
                    value={ticket.priority}
                    onValueChange={(value) =>
                      handlePriorityChange(ticket.id, value)
                    }
                  >
                    <SelectTrigger className="w-[120px]">
                      <SelectValue>
                        <Badge className={getPriorityColor(ticket.priority)}>
                          {ticket.priority}
                        </Badge>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>{ticket.createdBy.email}</TableCell>
                <TableCell>
                  {new Date(ticket.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedTicket(ticket)
                      setIsDialogOpen(true)
                    }}
                  >
                    View Details
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Ticket Details</DialogTitle>
            </DialogHeader>
            {selectedTicket && (
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold">Subject</h3>
                  <p>{selectedTicket.subject}</p>
                </div>
                <div>
                  <h3 className="font-semibold">Description</h3>
                  <p>{selectedTicket.description}</p>
                </div>
                <div>
                  <h3 className="font-semibold">Responses</h3>
                  <div className="space-y-2">
                    {selectedTicket.responses.map((response) => (
                      <div
                        key={response.id}
                        className="p-3 bg-gray-100 rounded-lg"
                      >
                        <p className="text-sm text-gray-600">
                          {response.createdBy.email} (
                          {new Date(response.createdAt).toLocaleString()})
                        </p>
                        <p className="mt-1">{response.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Textarea
                    placeholder="Type your response..."
                    value={response}
                    onChange={(e) => setResponse(e.target.value)}
                  />
                  <Button onClick={handleSubmitResponse}>Submit Response</Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  )
}