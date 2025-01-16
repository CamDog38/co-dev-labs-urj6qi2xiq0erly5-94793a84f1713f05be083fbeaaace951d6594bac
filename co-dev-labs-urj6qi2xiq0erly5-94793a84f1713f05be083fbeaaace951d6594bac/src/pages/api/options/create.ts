import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { createClient } from '@/util/supabase/api';
import { Prisma } from '@prisma/client';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const supabase = createClient(req, res);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { type, value, label } = req.body;

    if (!type || !value || !label) {
      return res.status(400).json({ 
        message: 'Missing required fields',
        details: {
          type: !type ? 'Type is required' : null,
          value: !value ? 'Value is required' : null,
          label: !label ? 'Label is required' : null
        }
      });
    }

    // Validate option type
    const validTypes = ['eventType', 'boatClass', 'location'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ 
        message: 'Invalid option type',
        details: `Type must be one of: ${validTypes.join(', ')}`
      });
    }

    const option = await prisma.option.create({
      data: {
        type,
        value: value.toLowerCase().trim(),
        label: label.trim(),
        userId: user.id,
      },
    });

    return res.status(201).json(option);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return res.status(409).json({ 
          message: 'Option already exists',
          details: 'An option with this type and value combination already exists'
        });
      }
    }
    console.error('Error creating option:', error);
    return res.status(500).json({ 
      message: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
}