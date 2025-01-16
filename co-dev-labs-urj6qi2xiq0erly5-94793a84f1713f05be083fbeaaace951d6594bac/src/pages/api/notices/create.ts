import { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@/util/supabase/api'
import prisma from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const supabase = createClient(req, res)
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  try {
    const { content, subject, eventId, sequence } = req.body

    if (!content || !eventId || !subject) {
      return res.status(400).json({ message: 'Missing required fields' })
    }

    const notice = await prisma.notice.create({
      data: {
        content,
        subject,
        eventId,
        userId: user.id,
        sequence: sequence || 0,
      },
    })

    return res.status(200).json(notice)
  } catch (error) {
    console.error('Error creating notice:', error)
    return res.status(500).json({ message: 'Error creating notice' })
  }
}