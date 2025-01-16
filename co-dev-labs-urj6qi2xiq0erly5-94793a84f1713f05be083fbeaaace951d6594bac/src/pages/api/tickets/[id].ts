import { NextApiRequest, NextApiResponse } from 'next'
import prisma from '@/lib/prisma'
import { createClient } from '@/util/supabase/api'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabase = createClient(req, res)
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const { id } = req.query

  if (req.method === 'GET') {
    try {
      const ticket = await prisma.ticket.findUnique({
        where: { id: String(id) },
        include: {
          responses: {
            include: {
              createdBy: {
                select: {
                  email: true,
                  role: true,
                },
              },
            },
            orderBy: {
              createdAt: 'asc',
            },
          },
          createdBy: {
            select: {
              email: true,
              role: true,
            },
          },
        },
      })

      if (!ticket) {
        return res.status(404).json({ error: 'Ticket not found' })
      }

      // Check if user has access to the ticket
      if (ticket.userId !== user.id && user.role !== 'admin') {
        return res.status(403).json({ error: 'Forbidden' })
      }

      return res.status(200).json(ticket)
    } catch (error) {
      return res.status(500).json({ error: 'Error fetching ticket' })
    }
  }

  if (req.method === 'PUT') {
    const { status, priority } = req.body

    try {
      const ticket = await prisma.ticket.findUnique({
        where: { id: String(id) },
      })

      if (!ticket) {
        return res.status(404).json({ error: 'Ticket not found' })
      }

      // Only admins can update ticket status
      if (user.role !== 'admin') {
        return res.status(403).json({ error: 'Forbidden' })
      }

      const updatedTicket = await prisma.ticket.update({
        where: { id: String(id) },
        data: {
          status,
          priority,
        },
      })

      return res.status(200).json(updatedTicket)
    } catch (error) {
      return res.status(500).json({ error: 'Error updating ticket' })
    }
  }

  if (req.method === 'DELETE') {
    try {
      const ticket = await prisma.ticket.findUnique({
        where: { id: String(id) },
      })

      if (!ticket) {
        return res.status(404).json({ error: 'Ticket not found' })
      }

      // Only ticket creator or admin can delete
      if (ticket.userId !== user.id && user.role !== 'admin') {
        return res.status(403).json({ error: 'Forbidden' })
      }

      await prisma.ticket.delete({
        where: { id: String(id) },
      })

      return res.status(204).end()
    } catch (error) {
      return res.status(500).json({ error: 'Error deleting ticket' })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}