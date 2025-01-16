import { NextApiRequest, NextApiResponse } from 'next'
import prisma from '@/lib/prisma'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const search = typeof req.query.search === 'string' ? req.query.search : ''
    const userId = typeof req.query.userId === 'string' ? req.query.userId : undefined

    const isPublic = req.query.public === 'true'

    const events = await prisma.event.findMany({
      where: {
        results: {
          some: {}
        },
        ...(userId ? {
          userId: userId
        } : {}),
        ...(isPublic ? {
          isPublic: true
        } : {}),
        ...(search ? {
          OR: [
            { title: { contains: search, mode: 'insensitive' } }
          ]
        } : {})
      },
      select: {
        id: true,
        title: true,
        results: {
          select: {
            id: true,
            documentUrl: true,
            dateRange: true,
            boatClass: true,
          }
        },
      },
      orderBy: {
        startDate: 'desc',
      },
    })

    const formattedEvents = events.map(event => ({
      id: event.id,
      name: event.title,
      results: event.results.map(result => ({
        id: result.id,
        url: result.documentUrl,
        dateRange: result.dateRange,
        boatClass: result.boatClass
      }))
    }))

    return res.status(200).json(formattedEvents)
  } catch (error) {
    console.error('Error in /api/results:', error)
    return res.status(500).json({ 
      message: 'Internal server error', 
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}