import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { createClient } from '@/util/supabase/api';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { username } = req.query;

    // If username is provided, fetch public profile
    if (username) {
      const user = await prisma.user.findFirst({
        where: {
          username: username as string,
        },
      });

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const links = await prisma.link.findMany({
        where: {
          userId: user.id,
          isPublic: true,
        },
        orderBy: [
          {
            order: 'asc',
          },
          {
            createdAt: 'desc',
          },
        ],
      });

      return res.status(200).json(links);
    }

    // If no username, handle authenticated user request
    const supabase = createClient(req, res);
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return res.status(401).json({ 
        message: 'User not authenticated',
        error: authError?.message 
      });
    }

    const dbUser = await prisma.user.findUnique({
      where: {
        id: user.id,
      },
    });

    if (!dbUser) {
      await prisma.user.create({
        data: {
          id: user.id,
          email: user.email || '',
        },
      });
    }

    const links = await prisma.link.findMany({
      where: {
        userId: user.id,
      },
      orderBy: [
        {
          order: 'asc',
        },
        {
          createdAt: 'desc',
        },
      ],
    });

    return res.status(200).json(links);
  } catch (error) {
    console.error('Error in /api/links:', error);
    return res.status(500).json({ 
      message: 'Internal server error',
      error: error instanceof Error ? error.message : String(error)
    });
  }
}