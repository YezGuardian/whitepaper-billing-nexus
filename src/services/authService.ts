
import { supabase } from '@/integrations/supabase/client';
import { User } from '@/types';
import { AuthError } from '@supabase/supabase-js';

export const handleAuthError = (error: AuthError): never => {
  let message = "Authentication failed. Please try again.";
  
  if (error.message.includes("email address is already registered")) {
    message = "This email is already registered. Please log in instead.";
  } else if (error.message.includes("Invalid login credentials")) {
    message = "Invalid email or password. Please check your credentials.";
  } else if (error.message.includes("rate limited")) {
    message = "Too many attempts. Please try again later.";
  } else if (error.message.includes("Email not confirmed")) {
    message = "Please verify your email address before logging in.";
  }
  
  const enhancedError = new Error(message);
  throw enhancedError;
};

export const signInWithEmail = async (email: string, password: string) => {
  console.log('Signing in with:', email);
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  if (error) {
    console.error('Error signing in:', error);
    throw handleAuthError(error);
  }
  
  return data;
};

export const signUpWithEmail = async (email: string, password: string, userData: Partial<User>) => {
  console.log('Signing up with:', email, 'and user data:', userData);
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: userData,
    },
  });
  
  if (error) {
    console.error('Error signing up:', error);
    throw handleAuthError(error);
  }
  
  console.log('Signup successful:', data);
  return data;
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  
  if (error) {
    console.error('Error signing out:', error);
    throw error;
  }
};

export const getCurrentUser = async () => {
  const { data, error } = await supabase.auth.getUser();
  
  if (error) {
    console.error('Error getting current user:', error);
    return null;
  }
  
  return data.user;
};

export const getUserProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
    
  if (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
  
  return data;
};

export const onAuthStateChange = (callback: (user: any) => void) => {
  const { data } = supabase.auth.onAuthStateChange((event, session) => {
    callback(session?.user || null);
  });
  
  return data.subscription;
};
