import { useEffect, useState } from 'react'
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
import { useToast } from '@/components/ui/use-toast'
import CreateTicketDialog from './CreateTicketDialog'

interface Ticket {
  id: string
  subject: string
  description: string
  status: string
  priority: string
  createdAt: string
  responses: TicketResponse[]
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

export default function UserTickets() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [response, setResponse] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const { toast } = useToast()

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

  const handleSubmitResponse = async () => {
    if (!selectedTicket || !response.trim()) return

    try {
      const res = await fetch('/api/tickets/' + selectedTicket.id + '/responses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: response }),
      })

      if (!res.ok) {
        throw new Error('Failed to submit response')
      }

      toast({
        title: 'Success',
        description: 'Response submitted successfully',
      })

      setResponse('')
      fetchTickets()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to submit response',
        variant: 'destructive',
      })
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">My Support Tickets</h2>
        <CreateTicketDialog />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Subject</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Created At</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tickets.map((ticket) => (
            <TableRow key={ticket.id}>
              <TableCell>{ticket.subject}</TableCell>
              <TableCell>
                <Badge className={getStatusColor(ticket.status)}>
                  {ticket.status}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge className={getPriorityColor(ticket.priority)}>
                  {ticket.priority}
                </Badge>
              </TableCell>
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
              {selectedTicket.status !== 'closed' && (
                <div className="space-y-2">
                  <Textarea
                    placeholder="Type your response..."
                    value={response}
                    onChange={(e) => setResponse(e.target.value)}
                  />
                  <Button onClick={handleSubmitResponse}>Submit Response</Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}