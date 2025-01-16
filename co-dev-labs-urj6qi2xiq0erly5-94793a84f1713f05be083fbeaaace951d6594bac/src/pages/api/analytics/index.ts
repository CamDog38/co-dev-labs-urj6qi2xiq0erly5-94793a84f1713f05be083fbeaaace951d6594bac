import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { createClient } from '@/util/supabase/api';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      // For GET requests, return only enabled analytics
      const analytics = await prisma.analytics.findMany({
        where: { enabled: true },
        select: {
          id: true,
          type: true,
          code: true,
        }
      });
      return res.status(200).json(analytics || []);
    }

    // For POST requests, require authentication and admin role
    if (req.method === 'POST') {
      const supabase = createClient(req, res);
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { role: true }
      });

      if (!dbUser || dbUser.role !== 'admin') {
        return res.status(403).json({ error: 'Forbidden' });
      }

      const { type, code, enabled } = req.body;

      if (!type || !code) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const existing = await prisma.analytics.findFirst({
        where: { type },
      });

      if (existing) {
        const updated = await prisma.analytics.update({
          where: { id: existing.id },
          data: { code, enabled },
        });
        return res.status(200).json(updated);
      }

      const analytics = await prisma.analytics.create({
        data: { type, code, enabled: enabled ?? true },
      });
      return res.status(201).json(analytics);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Error in analytics API:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}