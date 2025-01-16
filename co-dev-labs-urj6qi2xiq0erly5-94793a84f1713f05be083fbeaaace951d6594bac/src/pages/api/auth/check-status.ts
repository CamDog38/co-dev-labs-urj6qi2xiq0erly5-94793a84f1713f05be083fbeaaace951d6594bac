import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { createClient } from '@/util/supabase/api';

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

async function retryOperation<T>(operation: () => Promise<T>, retries = MAX_RETRIES): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return retryOperation(operation, retries - 1);
    }
    throw error;
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const supabase = createClient(req, res);
    
    const session = await retryOperation(async () => {
      const { data: { session } } = await supabase.auth.getSession();
      return session;
    });

    if (!session) {
      return res.status(401).json({ 
        message: 'Unauthorized',
        details: 'No valid session found'
      });
    }

    const user = await retryOperation(async () => {
      const user = await prisma.user.findUnique({
        where: {
          id: session.user.id,
        },
        select: {
          status: true
        }
      });
      
      if (!user) {
        throw new Error('User not found');
      }
      
      return user;
    });

    return res.status(200).json({ 
      status: user.status,
      userId: session.user.id
    });
  } catch (error) {
    console.error('Error checking user status:', error);
    
    if (error instanceof Error && error.message === 'User not found') {
      return res.status(404).json({ 
        message: 'User not found',
        details: 'The user account could not be found in the database'
      });
    }
    
    return res.status(500).json({ 
      message: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
}