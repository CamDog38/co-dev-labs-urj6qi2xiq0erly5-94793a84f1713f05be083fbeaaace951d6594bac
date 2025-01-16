interface FetchOptions extends RequestInit {
  retries?: number;
  retryDelay?: number;
}

class NetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NetworkError';
  }
}

class DatabaseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DatabaseError';
  }
}

export async function fetchWithRetry(
  url: string,
  options: FetchOptions = {}
): Promise<any> {
  const {
    retries = 3,
    retryDelay = 1000,
    ...fetchOptions
  } = options;

  let lastError: Error | null = null;

  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, fetchOptions);
      
      if (!response.ok) {
        throw new NetworkError(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error: any) {
      lastError = error;
      
      // Don't wait on the last attempt
      if (i < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, retryDelay * (i + 1)));
      }
    }
  }

  throw lastError || new Error('Request failed');
}

export async function safeFetch<T>(
  url: string,
  options: FetchOptions = {}
): Promise<{ data: T | null; error: Error | null }> {
  try {
    const data = await fetchWithRetry(url, options);
    return { data, error: null };
  } catch (error: any) {
    console.error('API Request failed:', error);
    return {
      data: null,
      error: error instanceof Error ? error : new Error(String(error))
    };
  }
}