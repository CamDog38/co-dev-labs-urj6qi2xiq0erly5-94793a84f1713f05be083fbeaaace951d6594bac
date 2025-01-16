import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@/util/supabase/api';
import prisma from '@/lib/prisma';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabase = createClient(req, res);
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { seriesId, title, file } = req.body;

    if (!seriesId || !title || !file) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        received: { seriesId, title, filePresent: !!file }
      });
    }

    // Create document record in database
    const document = await prisma.document.create({
      data: {
        name: title,
        url: file.url,
        type: 'series',
        seriesId: seriesId,
        userId: user.id,
        order: 0
      },
    });

    return res.status(200).json(document);
  } catch (error) {
    console.error('Series document upload error:', error);
    return res.status(500).json({ 
      error: 'Failed to upload document',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}