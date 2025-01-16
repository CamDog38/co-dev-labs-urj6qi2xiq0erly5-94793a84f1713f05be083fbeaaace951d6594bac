import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { username, search } = req.query;

  if (!username) {
    return res.status(400).json({ message: 'Username is required' });
  }

  try {
    // First get the user ID from username
    const user = await prisma.user.findFirst({
      where: { 
        username: username as string,
        NOT: {
          status: 'DELETED'
        }
      }
    });

    if (!user) {
      return res.status(404).json({ 
        message: 'User not found',
        requestedUsername: username
      });
    }

    // Get all events with results for this user
    const events = await prisma.event.findMany({
      where: {
        userId: user.id,
        results: {
          some: {} // Only get events that have results
        },
        ...(search ? {
          OR: [
            { title: { contains: search as string, mode: 'insensitive' } },
            { description: { contains: search as string, mode: 'insensitive' } },
            { results: {
              some: {
                boatClass: { contains: search as string, mode: 'insensitive' }
              }
            }}
          ]
        } : {})
      },
      orderBy: {
        startDate: 'desc'
      },
      include: {
        results: {
          orderBy: {
            boatClass: 'asc'
          }
        }
      }
    });

    // Transform the data to match the expected format
    const transformedEvents = events.map(event => ({
      id: event.id,
      name: event.title,
      date: event.startDate.getFullYear().toString(),
      results: event.results.map(result => ({
        id: result.id,
        url: result.documentUrl,
        boatClass: result.boatClass,
        dateRange: result.dateRange
      }))
    }));

    return res.status(200).json(transformedEvents);
  } catch (error) {
    console.error('Error in public results API:', error);
    return res.status(500).json({ 
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}