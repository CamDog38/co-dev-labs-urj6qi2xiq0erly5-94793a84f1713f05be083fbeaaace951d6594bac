import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { createClient } from '@/util/supabase/api';

interface LinkOrderItem {
  id: string;
}

const MAX_LINKS = 100; // Reasonable limit for number of links

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ 
      success: false,
      message: 'Method not allowed' 
    });
  }

  // Add request body parsing error handling
  let requestBody;
  try {
    requestBody = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch (e) {
    return res.status(400).json({
      success: false,
      message: 'Invalid request body format',
      error: 'Request body must be valid JSON'
    });
  }

  try {
    // Authentication check
    const supabase = createClient(req, res);
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return res.status(401).json({ 
        success: false,
        message: 'Unauthorized access'
      });
    }

    // Request body validation
    const { links } = req.body;

    if (!links) {
      return res.status(400).json({ 
        success: false,
        message: 'Missing links data in request body'
      });
    }

    // Array validation
    if (!Array.isArray(links)) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid links data: expected an array',
        details: { received: typeof links }
      });
    }

    // Size validation
    if (links.length > MAX_LINKS) {
      return res.status(400).json({ 
        success: false,
        message: `Too many links. Maximum allowed is ${MAX_LINKS}`
      });
    }

    // Empty array check
    if (links.length === 0) {
      return res.status(200).json({ 
        success: true,
        message: 'No links to update',
        updates: []
      });
    }

    // Structure validation
    const invalidLink = links.find(link => !link?.id || typeof link.id !== 'string');
    if (invalidLink) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid link format: each link must have a string id',
        details: { invalidLink }
      });
    }

    // Verify ownership and existence
    const linkIds = links.map(link => link.id);
    const existingLinks = await prisma.link.findMany({
      where: {
        id: { in: linkIds },
        userId: user.id
      },
      select: {
        id: true
      }
    });

    if (existingLinks.length !== links.length) {
      const existingIds = new Set(existingLinks.map(link => link.id));
      const invalidIds = linkIds.filter(id => !existingIds.has(id));
      return res.status(400).json({ 
        success: false,
        message: 'Some links are invalid or do not belong to the user',
        details: { invalidLinkIds: invalidIds }
      });
    }

    // Perform updates in a transaction with optimized approach
    const updates = await prisma.$transaction(
      links.map((link, index) => 
        prisma.link.update({
          where: {
            id: link.id,
            userId: user.id
          },
          data: { 
            order: index 
          },
          select: {
            id: true,
            order: true,
            title: true
          }
        })
      ),
      {
        timeout: 15000 // 15 second timeout
      }
    );

    return res.status(200).json({ 
      success: true,
      message: 'Link order updated successfully',
      updates
    });

  } catch (error) {
    console.error('Error in link order update:', error);
    
    // Handle specific error types
    if (error instanceof Error) {
      // Prisma errors
      if (error.message.includes('Prisma')) {
        return res.status(500).json({ 
          success: false,
          message: 'Database operation failed',
          error: process.env.NODE_ENV === 'development' ? error.message : 'Database error occurred'
        });
      }
      
      // Transaction timeout
      if (error.message.includes('timeout')) {
        return res.status(500).json({ 
          success: false,
          message: 'Operation timed out',
          error: 'The request took too long to process'
        });
      }
    }
    
    // Generic error response
    return res.status(500).json({ 
      success: false,
      message: 'Internal server error while updating link order',
      error: process.env.NODE_ENV === 'development' ? String(error) : 'An unexpected error occurred'
    });
  }
}