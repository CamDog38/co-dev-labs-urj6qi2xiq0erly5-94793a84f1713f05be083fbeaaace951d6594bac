import type { NextApiRequest, NextApiResponse } from "next";
import prisma from '@/lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // Test database connection by counting users
    const count = await prisma.user.count();
    res.status(200).json({ status: 'Database connection successful', userCount: count });
  } catch (error) {
    console.error('Database connection error:', error);
    res.status(500).json({ status: 'Database connection failed', error: error.message });
  }
}