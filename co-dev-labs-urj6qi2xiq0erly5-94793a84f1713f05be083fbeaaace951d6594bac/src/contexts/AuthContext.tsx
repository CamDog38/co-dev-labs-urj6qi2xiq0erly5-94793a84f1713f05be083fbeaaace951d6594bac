import React, { createContext, useState, ReactNode, useContext, useEffect } from 'react';
import { createClient } from '@/util/supabase/component';
import { User, Provider } from '@supabase/supabase-js';
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from 'next/router';

interface ExtendedUser extends User {
  username?: string;
}

interface AuthContextType {
  user: ExtendedUser | null;
  isAdmin: boolean;
  createUser: (user: User) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signInWithMagicLink: (email: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  updateProfile: (data: { email?: string; full_name?: string }) => Promise<void>;
  initializing: boolean;
  checkUserStatus: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  createUser: async () => {},
  signIn: async () => {},
  signUp: async () => {},
  signInWithMagicLink: async () => {},
  signInWithGoogle: async () => {},
  signOut: async () => {},
  resetPassword: async () => {},
  initializing: false
});

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const supabase = createClient();
  const { toast } = useToast();

  const checkAdminStatus = async (userId: string) => {
    try {
      const response = await fetch('/api/user/role');
      const data = await response.json();
      setIsAdmin(data.role === 'admin');
    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsAdmin(false);
    }
  };

  const fetchUserData = async (sessionUser: User) => {
    try {
      const response = await fetch(`/api/user?userId=${sessionUser.id}`);
      const userData = await response.json();
      setUser({ ...sessionUser, username: userData.username });
      return userData.username;
    } catch (error) {
      console.error('Error fetching user data:', error);
      setUser(sessionUser);
      return null;
    }
  };

  React.useEffect(() => {
    const fetchSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await fetchUserData(session.user);
      } else {
        setUser(null);
      }
      setInitializing(false);
    };

    fetchSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        await fetchUserData(session.user);
      } else {
        setUser(null);
      }
      setInitializing(false);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const createUser = async (user: User) => {
    try {
      const { data, error } = await supabase
        .from('User')
        .select('id')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (!data) {
        const { error: insertError } = await supabase
          .from('User')
          .insert({
            id: user.id,
            email: user.email,
          });

        if (insertError) {
          throw insertError;
        }
      }
    } catch (error) {
      console.error('Error creating user:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create user profile",
      });
    }
  };

  React.useEffect(() => {
    if (user) {
      createUser(user);
    }
  }, [user]);

  const checkUserStatus = async () => {
    if (!user) return;
    
    try {
      const response = await fetch('/api/auth/check-status');
      const data = await response.json();
      
      if (data.status === 'blocked') {
        await signOut();
        toast({
          variant: "destructive",
          title: "Access Denied",
          description: "Your account has been suspended. Please contact the administrator.",
        });
        router.push('/login');
      }
    } catch (error) {
      console.error('Error checking user status:', error);
    }
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (!error && data.user) {
      await createUser(data.user);
      
      // Check user status immediately after sign in
      try {
        const response = await fetch('/api/auth/check-status');
        const statusData = await response.json();
        
        if (statusData.status === 'blocked') {
          await signOut();
          toast({
            variant: "destructive",
            title: "Access Denied",
            description: "Your account has been suspended. Please contact the administrator.",
          });
          return { user: null, error: new Error('Account suspended') };
        }
        
        toast({
          title: "Success",
          description: "You have successfully signed in",
        });
        return { user: data.user, error: null };
      } catch (error) {
        console.error('Error checking user status:', error);
        return { user: null, error: new Error('Error checking account status') };
      }
    }
    
    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
      return { user: null, error };
    }
    return { user: null, error: new Error('Unknown error occurred') };
  };

  const signUp = async (email: string, password: string, role?: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role: role || 'viewer'
        }
      }
    });

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
      throw error;
    } else {
      if (data.user) {
        await createUser(data.user);
      }
      toast({
        title: "Success",
        description: "Check your email for the confirmation link",
      });
    }
  };

  const signInWithMagicLink = async (email: string) => {
    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false,
        emailRedirectTo: `${window.location.origin}/dashboard`,
      },
    });
    if (!error && data.user) {
      await createUser(data.user);
    }
    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
      throw error;
    } else {
      toast({
        title: "Success",
        description: "Check your email for the login link",
      });
    }
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google' as Provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    });
    
    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
      throw error;
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } else {
      toast({
        title: "Success",
        description: "You have successfully signed out",
      });
      router.push('/');
    }
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
      throw error;
    } else {
      toast({
        title: "Success",
        description: "Check your email for the password reset link",
      });
    }
  };

  const updatePassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({
      password: password
    });

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
      throw error;
    } else {
      toast({
        title: "Success",
        description: "Password has been updated successfully",
      });
    }
  };

  const updateProfile = async (data: { email?: string; full_name?: string }) => {
    try {
      const { error } = await supabase.auth.updateUser({
        email: data.email,
        data: { full_name: data.full_name }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update profile",
      });
      throw error;
    }
  };

  // Add effect to periodically check user status with debouncing
  React.useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let isChecking = false;

    const debouncedCheckStatus = async () => {
      if (isChecking || !user) return;
      
      try {
        isChecking = true;
        await checkUserStatus();
      } catch (error) {
        console.error('Status check failed:', error);
      } finally {
        isChecking = false;
      }
    };

    if (user) {
      // Initial check with delay
      timeoutId = setTimeout(debouncedCheckStatus, 2000);

      // Set up periodic check every 10 minutes
      const interval = setInterval(debouncedCheckStatus, 10 * 60 * 1000);
      
      return () => {
        clearTimeout(timeoutId);
        clearInterval(interval);
      };
    }
  }, [user]);

  return (
    <AuthContext.Provider value={{
      user,
      isAdmin,
      createUser,
      signIn,
      signUp,
      signInWithMagicLink,
      signInWithGoogle,
      signOut,
      resetPassword,
      updatePassword,
      updateProfile,
      initializing,
      checkUserStatus,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);