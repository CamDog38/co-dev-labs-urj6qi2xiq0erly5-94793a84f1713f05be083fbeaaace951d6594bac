import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const adminCount = await prisma.user.count({
      where: {
        role: 'admin'
      }
    });

    return res.status(200).json({ hasAdmin: adminCount > 0 });
  } catch (error) {
    console.error('Error checking admin existence:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}