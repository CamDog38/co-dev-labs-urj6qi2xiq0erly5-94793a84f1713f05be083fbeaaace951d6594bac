import { NextApiRequest, NextApiResponse } from 'next'
import prisma from '@/lib/prisma'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const { username } = req.query

  if (!username || typeof username !== 'string') {
    return res.status(400).json({ message: 'Username is required' })
  }

  try {
    // Get user profile data
    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        links: {
          orderBy: { order: 'asc' }
        },
        appearance: true
      }
    })

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    return res.status(200).json({
      userId: user.id,
      links: user.links,
      appearance: user.appearance
    })
  } catch (error) {
    console.error('Error fetching profile data:', error)
    return res.status(500).json({ message: 'Internal server error' })
  }
}