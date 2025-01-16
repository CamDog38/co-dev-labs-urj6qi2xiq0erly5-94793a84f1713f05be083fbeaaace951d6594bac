import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface AppearanceSettings {
  eventColors: {
    default: string;
    race: string;
    training: string;
    social: string;
    other: string;
  };
  fontFamily: string;
  fontSize: number;
  fontColor: string;
  backgroundColor: string;
  buttonColor: string;
  buttonFontColor: string;
  buttonShape: string;
  buttonStyle: string;
  buttonShadow: string;
  iconColor: string;
  bio?: string;
  profileImage?: string;
  resultsView: 'accordion' | 'timeline';
}

const defaultSettings: AppearanceSettings = {
  eventColors: {
    default: '#2563eb',
    race: '#dc2626',
    training: '#16a34a',
    social: '#9333ea',
    other: '#f59e0b',
  },
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
  resultsView: 'accordion',
};

const AppearanceContext = createContext<{
  settings: AppearanceSettings;
  updateSettings: (settings: Partial<AppearanceSettings>) => void;
  setExternalSettings: (settings: AppearanceSettings) => void;
}>({
  settings: defaultSettings,
  updateSettings: () => {},
  setExternalSettings: () => {},
});

export function useAppearance() {
  return useContext(AppearanceContext);
}

export function AppearanceProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const fetchingRef = useRef(false);
  const [settings, setSettings] = useState<AppearanceSettings>(() => {
    // Try to get settings from localStorage first
    if (typeof window === 'undefined') return defaultSettings;
    const savedSettings = localStorage.getItem('appearance_settings');
    return savedSettings ? JSON.parse(savedSettings) : defaultSettings;
  });

  const fetchSettings = useCallback(async () => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;

    try {
      const response = await fetch('/api/appearance', {
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      const data = await response.json();
      if (data && Object.keys(data).length > 0) {
        setSettings(data);
        localStorage.setItem('appearance_settings', JSON.stringify(data));
      }
    } catch (error) {
      console.error('Failed to fetch appearance settings:', error);
    } finally {
      fetchingRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchSettings();
    }
  }, [user, fetchSettings]);

  const updateSettings = async (newSettings: Partial<AppearanceSettings>) => {
    if (!user) return; // Don't update if no user is logged in
    
    // Optimistically update local state
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    localStorage.setItem('appearance_settings', JSON.stringify(updatedSettings));
    
    try {
      const response = await fetch('/api/appearance', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedSettings),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update appearance settings');
      }

      const data = await response.json();
      // Only update if the server response is different
      if (JSON.stringify(data) !== JSON.stringify(updatedSettings)) {
        setSettings(data);
        localStorage.setItem('appearance_settings', JSON.stringify(data));
      }
    } catch (error) {
      console.error('Failed to persist appearance settings:', error);
      // Revert to previous settings on error
      setSettings(settings);
      localStorage.setItem('appearance_settings', JSON.stringify(settings));
    }
  };

  // New function to set settings from external sources (like public profiles)
  const setExternalSettings = (newSettings: AppearanceSettings) => {
    setSettings(newSettings);
  };

  return (
    <AppearanceContext.Provider value={{ settings, updateSettings, setExternalSettings }}>
      {children}
    </AppearanceContext.Provider>
  );
}