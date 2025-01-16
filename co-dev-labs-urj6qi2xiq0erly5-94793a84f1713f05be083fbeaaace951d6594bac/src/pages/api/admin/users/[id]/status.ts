import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { createClient } from '@/util/supabase/api';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

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

  const { id } = req.query;
  const { status } = req.body;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ message: 'Invalid user ID' });
  }

  if (!status || !['active', 'suspended'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status value' });
  }

  try {
    // Don't allow blocking the current admin
    if (id === session.user.id) {
      return res.status(400).json({ message: 'Cannot modify own account status' });
    }

    const user = await prisma.user.update({
      where: {
        id: id,
      },
      data: {
        status: status,
      },
    });

    return res.status(200).json(user);
  } catch (error) {
    console.error('Error updating user status:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}