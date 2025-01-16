import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { createClient } from '@/util/supabase/api';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const supabase = createClient(req, res);
  
  // Check if the requester is authenticated and is an admin
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  // Verify admin role
  const admin = await prisma.user.findUnique({
    where: {
      id: session.user.id,
    },
  });

  if (!admin || admin.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden' });
  }

  if (req.method === 'GET') {
    try {
      const users = await prisma.user.findMany({
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          _count: {
            select: {
              events: true
            }
          }
        }
      });

      const formattedUsers = users.map(user => ({
        id: user.id,
        email: user.email || '',
        name: user.name || '',
        role: user.role || 'user',
        status: user.status || 'active',
        createdAt: user.createdAt?.toISOString() || null,
        lastLogin: user.lastLogin?.toISOString() || null,
        eventsCreated: user._count.events
      }));

      return res.status(200).json(formattedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}