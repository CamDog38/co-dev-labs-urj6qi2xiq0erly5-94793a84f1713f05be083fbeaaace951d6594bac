import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@/util/supabase/api';
import prisma from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const supabase = createClient(req, res);
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const { bio, profileImage, username } = req.body;

    // If username is being updated
    if (username !== undefined) {
      // Check if username is already taken
      const existingUser = await prisma.user.findUnique({
        where: { username },
      });

      if (existingUser && existingUser.id !== user.id) {
        return res.status(400).json({ message: 'Username is already taken' });
      }

      // Update username
      await prisma.user.update({
        where: { id: user.id },
        data: { username },
      });

      return res.status(200).json({ message: 'Username updated successfully' });
    }

    const updatedAppearance = await prisma.appearance.upsert({
      where: { userId: user.id },
      update: { 
        bio: bio || '',
        profileImage: profileImage || null
      },
      create: {
        userId: user.id,
        bio: bio || '',
        profileImage: profileImage || null
      },
    });

    return res.status(200).json(updatedAppearance);
  } catch (error) {
    console.error('Error updating appearance:', error);
    return res.status(500).json({ message: 'Error updating appearance settings', error: String(error) });
  }
}