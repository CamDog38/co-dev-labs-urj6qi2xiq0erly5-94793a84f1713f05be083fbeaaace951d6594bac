import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { createClient } from '@/util/supabase/api';
import { generateUniqueSlug } from '@/util/slug';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const supabase = createClient(req, res);
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { username } = req.body;

    if (!username) {
      return res.status(400).json({ message: 'Username is required' });
    }

    // Check if user already has a profile
    const existingProfile = await prisma.publicProfile.findFirst({
      where: {
        userId: user.id
      }
    });

    if (existingProfile) {
      // If profile exists, just update the username if it changed
      const currentUser = await prisma.user.findUnique({
        where: { id: user.id }
      });

      if (currentUser?.username === username) {
        return res.status(200).json({
          user: currentUser,
          publicProfile: existingProfile,
          message: 'Profile already exists'
        });
      }

      // Check if new username is taken by someone else
      const usernameExists = await prisma.user.findFirst({
        where: {
          username: username,
          NOT: {
            id: user.id
          }
        }
      });

      if (usernameExists) {
        return res.status(400).json({ message: 'Username is already taken' });
      }

      // Update just the username
      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: { username: username }
      });

      return res.status(200).json({
        user: updatedUser,
        publicProfile: existingProfile,
        message: 'Username updated successfully'
      });
    }

    // If no profile exists, proceed with new profile creation
    // Check if username is already taken
    const existingUser = await prisma.user.findFirst({
      where: {
        username: username,
        NOT: {
          id: user.id
        }
      }
    });

    if (existingUser) {
      return res.status(400).json({ message: 'Username is already taken' });
    }

    // Generate a unique slug from the username
    const slug = await generateUniqueSlug(username, async (slug) => {
      const exists = await prisma.publicProfile.findUnique({
        where: { slug }
      });
      return !!exists;
    });

    // Update user and create public profile
    const [updatedUser, publicProfile] = await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { username: username }
      }),
      prisma.publicProfile.create({
        data: {
          slug: slug,
          userId: user.id,
          isActive: true
        }
      })
    ]);

    return res.status(200).json({
      user: updatedUser,
      publicProfile: publicProfile,
      message: 'Profile created successfully'
    });
  } catch (error) {
    console.error('Error in profile creation:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}