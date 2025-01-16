import { NextApiResponse } from 'next';
import prisma from './prisma';

export interface ApiError {
  message: string;
  details?: string;
  code?: string;
}

export const MAX_RETRIES = 3;
export const RETRY_DELAY = 1000; // 1 second
export const MAX_BACKOFF = 5000; // 5 seconds

interface DatabaseOperation<T> {
  operation: () => Promise<T>;
  maxRetries?: number;
  retryDelay?: number;
}

export async function withDatabaseRetry<T>({
  operation,
  maxRetries = MAX_RETRIES,
  retryDelay = RETRY_DELAY
}: DatabaseOperation<T>): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Check connection before operation
      await ensureConnection();
      return await operation();
    } catch (error: any) {
      lastError = error;
      console.error(`Database operation attempt ${attempt} failed:`, error);
      
      // Check if it's a connection error
      if (error.code === 'P1001' || error.code === 'P1002') {
        if (attempt < maxRetries) {
          const backoffDelay = Math.min(retryDelay * attempt, MAX_BACKOFF);
          await new Promise(resolve => setTimeout(resolve, backoffDelay));
          continue;
        }
      }
      
      // If it's not a connection error or we're out of retries, throw
      throw error;
    }
  }
  
  throw lastError || new Error('Database operation failed');
}

export async function safeDbOperation<T>(
  operation: () => Promise<T>
): Promise<{ data: T | null; error: Error | null }> {
  try {
    const result = await withDatabaseRetry({ operation });
    return { data: result, error: null };
  } catch (error: any) {
    console.error('Database operation failed:', error);
    return {
      data: null,
      error: error instanceof Error ? error : new Error(String(error))
    };
  }
}

export async function retryOperation<T>(
  operation: () => Promise<T>, 
  retries = MAX_RETRIES,
  initialDelay = RETRY_DELAY
): Promise<T> {
  try {
    return await operation();
  } catch (error: any) {
    // Don't retry on certain errors
    if (error.status === 401 || error.status === 403 || error.status === 404) {
      throw error;
    }

    if (retries > 0) {
      // Exponential backoff with jitter
      const delay = Math.min(initialDelay * (MAX_RETRIES - retries + 1), MAX_BACKOFF);
      const jitter = Math.random() * 200; // Add up to 200ms of random jitter
      await new Promise(resolve => setTimeout(resolve, delay + jitter));
      return retryOperation(operation, retries - 1, initialDelay);
    }
    throw error;
  }
}

// Helper to ensure database connection is alive
export async function ensureConnection() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error('Database connection check failed:', error);
    return false;
  }
}

export function handleApiError(error: unknown, res: NextApiResponse) {
  console.error('API Error:', error);

  if (error instanceof Error) {
    // Handle known error types
    if (error.message === 'User not found') {
      return res.status(404).json({
        message: 'User not found',
        details: 'The user account could not be found in the database',
        code: 'USER_NOT_FOUND'
      });
    }

    if (error.message.includes('Unauthorized')) {
      return res.status(401).json({
        message: 'Unauthorized',
        details: 'Authentication required',
        code: 'UNAUTHORIZED'
      });
    }

    // Database connection errors
    if (error.message.includes('P1001') || error.message.includes('P1002')) {
      return res.status(503).json({
        message: 'Service temporarily unavailable',
        details: 'Database connection issue',
        code: 'DATABASE_CONNECTION_ERROR'
      });
    }

    // Generic error response
    return res.status(500).json({
      message: 'Internal server error',
      details: error.message,
      code: 'INTERNAL_SERVER_ERROR'
    });
  }

  // Fallback for unknown error types
  return res.status(500).json({
    message: 'Internal server error',
    details: 'An unknown error occurred',
    code: 'UNKNOWN_ERROR'
  });
}

export function setCorsHeaders(res: NextApiResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

export function handleOptions(res: NextApiResponse) {
  setCorsHeaders(res);
  return res.status(200).end();
}