import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { createClient } from '@/util/supabase/api';

const defaultAppearance = {
  fontFamily: 'Inter',
  fontSize: 16,
  fontColor: '#000000',
  backgroundColor: '#ffffff',
  buttonColor: '#000000',
  buttonFontColor: '#ffffff',
  buttonShape: 'square',
  buttonStyle: 'default',
  buttonShadow: 'none',
  iconColor: '#000000',
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    const { username } = req.query;

    try {
      let userId;

      if (username) {
        // Public access via username
        const user = await prisma.user.findFirst({
          where: {
            username: username as string,
          },
          select: {
            id: true,
          },
        });

        if (!user) {
          return res.status(404).json({ error: 'User not found' });
        }

        userId = user.id;
        // Set longer cache for public profiles
        res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
      } else {
        // Authenticated access
        const supabase = createClient(req, res);
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
          return res.status(401).json({ error: 'Unauthorized' });
        }

        userId = user.id;
        // Set shorter cache for authenticated users
        res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');
      }

      const appearance = await prisma.appearance.findFirst({
        where: {
          userId: userId,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      const responseData = appearance || defaultAppearance;

      // Generate ETag based on the data
      const etag = `W/"${Buffer.from(JSON.stringify(responseData)).toString('base64')}"`;
      res.setHeader('ETag', etag);

      // Check if the client's cached version matches
      const ifNoneMatch = req.headers['if-none-match'];
      if (ifNoneMatch === etag) {
        return res.status(304).end();
      }

      return res.status(200).json(responseData);
    } catch (error) {
      console.error('Error fetching appearance:', error);
      return res.status(500).json({ error: 'Failed to fetch appearance settings' });
    }
  }

  if (req.method === 'POST' || req.method === 'PUT') {
    try {
      const supabase = createClient(req, res);
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const {
        fontFamily,
        fontSize,
        fontColor,
        backgroundColor,
        buttonColor,
        buttonFontColor,
        buttonShape,
        buttonStyle,
        buttonShadow,
        iconColor,
        bio,
        profileImage,
        resultsView,
      } = req.body;

      const appearance = await prisma.appearance.upsert({
        where: {
          userId: user.id,
        },
        update: {
          fontFamily,
          fontSize,
          fontColor,
          backgroundColor,
          buttonColor,
          buttonFontColor,
          buttonShape,
          buttonStyle,
          buttonShadow,
          iconColor,
          bio,
          profileImage,
          resultsView,
        },
        create: {
          userId: user.id,
          fontFamily: fontFamily || defaultAppearance.fontFamily,
          fontSize: fontSize || defaultAppearance.fontSize,
          fontColor: fontColor || defaultAppearance.fontColor,
          backgroundColor: backgroundColor || defaultAppearance.backgroundColor,
          buttonColor: buttonColor || defaultAppearance.buttonColor,
          buttonFontColor: buttonFontColor || defaultAppearance.buttonFontColor,
          buttonShape: buttonShape || defaultAppearance.buttonShape,
          buttonStyle: buttonStyle || defaultAppearance.buttonStyle,
          buttonShadow: buttonShadow || defaultAppearance.buttonShadow,
          iconColor: iconColor || defaultAppearance.iconColor,
          bio,
          profileImage,
          resultsView,
        },
      });

      // Clear cache headers for updates
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      return res.status(200).json(appearance);
    } catch (error) {
      console.error('Error updating appearance:', error);
      return res.status(500).json({ error: 'Failed to update appearance settings' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}