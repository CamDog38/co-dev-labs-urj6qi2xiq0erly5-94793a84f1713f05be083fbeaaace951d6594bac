import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { createClient } from '@/util/supabase/api';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabase = createClient(req, res);
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('Auth error:', authError);
      return res.status(401).json({ error: 'Unauthorized', details: authError?.message });
    }

    const { title, url, type = 'link', platform } = req.body;

    // Validate required fields
    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    if (!url && type !== 'calendar') {
      return res.status(400).json({ error: 'URL is required' });
    }

    // For calendar type, set default URL
    const finalUrl = type === 'calendar' ? '/calendar' : url;

    try {
      // Get the highest order value
      const lastLink = await prisma.link.findFirst({
        where: { userId: user.id },
        orderBy: { order: 'desc' },
      });

      const newOrder = lastLink ? (lastLink.order || 0) + 1 : 0;

      const link = await prisma.link.create({
        data: {
          title,
          url: finalUrl,
          type,
          platform,
          userId: user.id,
          order: newOrder,
        },
      });

      return res.status(200).json(link);
    } catch (dbError) {
      console.error('Database error:', dbError);
      return res.status(500).json({ 
        error: 'Failed to create link',
        details: dbError instanceof Error ? dbError.message : 'Unknown error'
      });
    }
  } catch (error) {
    console.error('Error creating link:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}