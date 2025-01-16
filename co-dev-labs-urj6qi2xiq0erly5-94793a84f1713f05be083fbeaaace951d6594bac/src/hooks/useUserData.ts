import { useState, useEffect } from 'react';

interface UserData {
  id: string;
  username: string;
  appearance?: any;
  links?: any[];
  [key: string]: any;
}

// Cache object to store user data
const userCache: { [key: string]: { data: UserData; timestamp: number } } = {};
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

export function useUserData(username: string | undefined) {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!username) {
        setLoading(false);
        return;
      }

      // Check cache first
      const cachedData = userCache[username];
      const now = Date.now();

      if (cachedData && now - cachedData.timestamp < CACHE_DURATION) {
        setUserData(cachedData.data);
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/user?username=${username}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Failed to fetch user data');
        }

        // Update cache
        userCache[username] = {
          data,
          timestamp: now,
        };

        setUserData(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        setUserData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [username]);

  // Function to force refresh the data
  const refreshData = async () => {
    if (!username) return;
    
    setLoading(true);
    delete userCache[username]; // Clear cache for this user
    
    try {
      const response = await fetch(`/api/user?username=${username}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch user data');
      }

      // Update cache
      userCache[username] = {
        data,
        timestamp: Date.now(),
      };

      setUserData(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setUserData(null);
    } finally {
      setLoading(false);
    }
  };

  return {
    userData,
    loading,
    error,
    refreshData,
  };
}