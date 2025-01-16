import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { userId, username } = req.query;

  try {
    let user;
    
    if (userId && typeof userId === 'string') {
      user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          appearance: true,
          links: {
            orderBy: { order: 'asc' }
          },
        }
      });
    } else if (username && typeof username === 'string') {
      user = await prisma.user.findUnique({
        where: { username },
        include: {
          appearance: true,
          links: {
            orderBy: { order: 'asc' }
          },
        }
      });
    } else {
      return res.status(400).json({ message: 'Either userId or username is required' });
    }

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}