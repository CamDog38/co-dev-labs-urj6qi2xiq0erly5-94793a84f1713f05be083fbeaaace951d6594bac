import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { type } = req.query;

    if (!type) {
      return res.status(400).json({ message: 'Type parameter is required' });
    }

    const options = await prisma.option.findMany({
      where: {
        type: type as string,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return res.status(200).json(options);
  } catch (error) {
    console.error('Error fetching options:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}