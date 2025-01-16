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

  if (req.method === 'POST') {
    const { content } = req.body

    try {
      const ticket = await prisma.ticket.findUnique({
        where: { id: String(id) },
      })

      if (!ticket) {
        return res.status(404).json({ error: 'Ticket not found' })
      }

      // Only ticket creator or admin can add responses
      if (ticket.userId !== user.id && user.role !== 'admin') {
        return res.status(403).json({ error: 'Forbidden' })
      }

      const response = await prisma.ticketResponse.create({
        data: {
          content,
          ticketId: String(id),
          userId: user.id,
        },
        include: {
          createdBy: {
            select: {
              email: true,
              role: true,
            },
          },
        },
      })

      return res.status(201).json(response)
    } catch (error) {
      return res.status(500).json({ error: 'Error creating response' })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}