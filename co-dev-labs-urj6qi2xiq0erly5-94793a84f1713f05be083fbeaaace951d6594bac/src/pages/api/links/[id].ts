import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { createClient } from '@/util/supabase/api';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid link ID' });
  }

  try {
    const supabase = createClient(req, res);
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('Auth error:', authError);
      return res.status(401).json({ error: 'Unauthorized', details: authError?.message });
    }

    // Verify link ownership before any operation
    const existingLink = await prisma.link.findFirst({
      where: {
        id: id,
        userId: user.id,
      },
    });

    if (!existingLink) {
      return res.status(404).json({ error: 'Link not found or access denied' });
    }

    if (req.method === 'DELETE') {
      await prisma.link.delete({
        where: {
          id: id,
          userId: user.id,
        },
      });

      return res.status(200).json({ message: 'Link deleted successfully' });
    }

    if (req.method === 'PUT' || req.method === 'PATCH') {
      const { title, url, type, platform } = req.body;

      // Validate input
      if (!title && !url && !type && !platform) {
        return res.status(400).json({ error: 'No update data provided' });
      }

      // Prepare update data
      const updateData: any = {};
      if (title) updateData.title = title;
      if (url) updateData.url = url;
      if (type) updateData.type = type;
      if (platform) updateData.platform = platform;

      // If it's a calendar type, force the URL
      if (type === 'calendar') {
        updateData.url = '/calendar';
      }

      try {
        const updatedLink = await prisma.link.update({
          where: {
            id: id,
            userId: user.id,
          },
          data: updateData,
        });

        return res.status(200).json(updatedLink);
      } catch (updateError) {
        console.error('Update error:', updateError);
        return res.status(500).json({ 
          error: 'Failed to update link',
          details: updateError instanceof Error ? updateError.message : 'Unknown error'
        });
      }
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}