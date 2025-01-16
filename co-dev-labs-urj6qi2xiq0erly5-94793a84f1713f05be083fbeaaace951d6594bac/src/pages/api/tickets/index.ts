import { NextApiRequest, NextApiResponse } from 'next'
import prisma from '@/lib/prisma'
import { createClient } from '@/util/supabase/api'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabase = createClient(req, res)
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  if (req.method === 'GET') {
    try {
      const tickets = await prisma.ticket.findMany({
        where: {
          userId: user.id,
        },
        include: {
          responses: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      })
      return res.status(200).json(tickets)
    } catch (error) {
      return res.status(500).json({ error: 'Error fetching tickets' })
    }
  }

  if (req.method === 'POST') {
    const { subject, description, priority } = req.body

    try {
      const ticket = await prisma.ticket.create({
        data: {
          subject,
          description,
          priority,
          userId: user.id,
        },
      })
      return res.status(201).json(ticket)
    } catch (error) {
      return res.status(500).json({ error: 'Error creating ticket' })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}