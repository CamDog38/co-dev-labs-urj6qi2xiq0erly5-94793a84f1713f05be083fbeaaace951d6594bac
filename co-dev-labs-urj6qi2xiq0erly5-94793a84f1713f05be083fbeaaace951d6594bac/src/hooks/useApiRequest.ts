import { useState, useCallback } from 'react';
import { useDebounce } from './useDebounce';

interface ApiRequestOptions extends RequestInit {
  debounceMs?: number;
}

interface ApiRequestState<T> {
  data: T | null;
  error: Error | null;
  isLoading: boolean;
}

export function useApiRequest<T>(initialState: T | null = null) {
  const [state, setState] = useState<ApiRequestState<T>>({
    data: initialState,
    error: null,
    isLoading: false,
  });

  const execute = useCallback(async (
    url: string,
    options: ApiRequestOptions = {}
  ) => {
    const { debounceMs = 0, ...fetchOptions } = options;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      if (debounceMs > 0) {
        await new Promise(resolve => setTimeout(resolve, debounceMs));
      }

      const response = await fetch(url, fetchOptions);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setState({ data, error: null, isLoading: false });
      return { data, error: null };
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      setState({
        data: null,
        error: new Error(errorMessage),
        isLoading: false,
      });
      return { data: null, error };
    }
  }, []);

  return {
    ...state,
    execute,
  };
}