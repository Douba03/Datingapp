import { useState, useEffect } from 'react';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '../services/supabase/client';
import { User, Profile } from '../types/user';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [supabaseError, setSupabaseError] = useState<string | null>(null);

  useEffect(() => {
    // Shorter timeout to prevent infinite loading - show auth screen if takes too long
    const loadingTimeout = setTimeout(() => {
      console.warn('[useAuth] Loading timeout reached (10s), setting loading to false');
      setLoading(false);
    }, 10000); // 10 seconds - faster timeout

    // Try to initialize Supabase auth
    const initializeAuth = async () => {
      try {
        console.log('[useAuth] Initializing auth...');
        
        // Get initial session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('[useAuth] Error getting session:', error);
          setSupabaseError(error.message);
          setLoading(false);
          clearTimeout(loadingTimeout);
          return;
        }
        
        setSession(session);
        if (session?.user) {
          console.log('[useAuth] Found existing session, fetching user data...');
          await fetchUserData(session.user.id);
        } else {
          console.log('[useAuth] No existing session');
          setLoading(false);
          clearTimeout(loadingTimeout);
        }

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            console.log('[useAuth] Auth state changed:', { event, session: !!session, userId: session?.user?.id });
            setSession(session || null);

            // Handle explicit sign-outs only
            if (event === 'SIGNED_OUT') {
              console.log('[useAuth] Explicit sign-out/delete, clearing user state');
              setUser(null);
              setProfile(null);
              setLoading(false);
              clearTimeout(loadingTimeout);
              return;
            }

            // For signed in / token refresh / user updated, fetch immediately
            if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED' || session?.user) {
              console.log('[useAuth] Auth active, fetching user data...');
              // Wrap fetchUserData in a timeout to ensure it always completes
              const fetchTimeout = setTimeout(() => {
                console.warn('[useAuth] fetchUserData timeout, forcing loading to false');
                setLoading(false);
              }, 12000); // 12 second overall timeout
              
              try {
                await fetchUserData((session?.user?.id as string) || user?.id || '');
              } catch (err) {
                console.error('[useAuth] Error in fetchUserData during auth state change:', err);
                setLoading(false);
              } finally {
                clearTimeout(fetchTimeout);
              }
              clearTimeout(loadingTimeout);
              return;
            }

            // Grace period retry: transient null session
            console.log('[useAuth] Session temporarily null, retrying getSession in 1500ms...');
            setTimeout(async () => {
              const { data: { session: reSession } } = await supabase.auth.getSession();
              if (reSession?.user) {
                console.log('[useAuth] Retry recovered session, fetching user data');
                const fetchTimeout = setTimeout(() => {
                  console.warn('[useAuth] fetchUserData timeout in retry, forcing loading to false');
                  setLoading(false);
                }, 12000);
                
                try {
                  await fetchUserData(reSession.user.id);
                } catch (err) {
                  console.error('[useAuth] Error in fetchUserData during retry:', err);
                  setLoading(false);
                } finally {
                  clearTimeout(fetchTimeout);
                }
              } else {
                console.log('[useAuth] Retry found no session, keeping user state as is until explicit sign-out');
                // Do not forcibly clear here; UI will handle unauth only after explicit SIGNED_OUT
              }
              setLoading(false);
              clearTimeout(loadingTimeout);
            }, 1500);
          }
        );

        return () => {
          subscription.unsubscribe();
          clearTimeout(loadingTimeout);
        };
        
      } catch (error) {
        console.error('[useAuth] Error initializing auth:', error);
        setSupabaseError('Failed to connect to authentication service');
        setLoading(false);
        clearTimeout(loadingTimeout);
      }
    };

    initializeAuth();

    return () => {
      clearTimeout(loadingTimeout);
    };
  }, []);

  const fetchUserData = async (userId: string) => {
    try {
      console.log('[useAuth] Fetching user data for:', userId);
      
      // Add timeout to prevent hanging
      const fetchTimeout = setTimeout(() => {
        console.warn('[useAuth] Fetch user data timeout, setting loading to false');
        setLoading(false);
      }, 8000); // 8 second timeout for fetch
      
      // Get auth user data
      const { data: authUser, error: authError } = await supabase.auth.getUser();
      
      clearTimeout(fetchTimeout);
      
      if (authError) {
        console.error('[useAuth] Error getting auth user:', authError);
        setLoading(false);
        return;
      }
      
      if (authUser?.user) {
        console.log('[useAuth] Creating user data object...');
        
        // Fetch user data from database first to get premium status
        // Add timeout protection
        let dbUser: any = null;
        try {
          const dbUserResult = await Promise.race([
            supabase
              .from('users')
              .select('*')
              .eq('id', userId)
              .single(),
            new Promise((resolve) => 
              setTimeout(() => resolve({ data: null, error: null }), 5000)
            ) as Promise<any>
          ]);
          dbUser = (dbUserResult as any)?.data || null;
        } catch (err) {
          console.warn('[useAuth] Error or timeout fetching user data:', err);
          dbUser = null;
        }

        // Create a basic user object from auth data
        const userData = {
          id: authUser.user.id,
          email: authUser.user.email || 'user@example.com',
          auth_provider: dbUser?.auth_provider || 'email',
          status: (dbUser?.status || 'active') as 'active' | 'suspended' | 'deleted',
          onboarding_completed: dbUser?.onboarding_completed || false,
          is_premium: dbUser?.is_premium || false,
          premium_until: dbUser?.premium_until,
          grace_period_until: dbUser?.grace_period_until,
          created_at: dbUser?.created_at || new Date().toISOString(),
          updated_at: dbUser?.updated_at || new Date().toISOString(),
          last_seen_at: dbUser?.last_seen_at || new Date().toISOString(),
        };
        
        setUser(userData);

        // Try to load real profile from database
        console.log('[useAuth] Fetching profile from database...');
        let dbProfile: any = null;
        let profileError: any = null;
        try {
          const profileResult = await Promise.race([
            supabase
              .from('profiles')
              .select('*')
              .eq('user_id', userId)
              .single(),
            new Promise((resolve) => 
              setTimeout(() => resolve({ data: null, error: { message: 'Timeout' } }), 5000)
            ) as Promise<any>
          ]);
          dbProfile = (profileResult as any)?.data || null;
          profileError = (profileResult as any)?.error || null;
        } catch (err) {
          console.warn('[useAuth] Error or timeout fetching profile:', err);
          profileError = { message: 'Timeout or error' };
        }

        if (profileError) {
          console.warn('[useAuth] No profile found or error fetching profile:', profileError?.message);
        }

        if (dbProfile) {
          console.log('[useAuth] Profile data loaded:', {
            first_name: dbProfile.first_name,
            bio: dbProfile.bio,
            interests: dbProfile.interests,
            photos: dbProfile.photos?.length || 0
          });

          // Fetch preferences separately with timeout protection
          let preferences: any = null;
          let prefError: any = null;
          try {
            const prefResult = await Promise.race([
              supabase
                .from('preferences')
                .select('*')
                .eq('user_id', userId)
                .single(),
              new Promise((resolve) => 
                setTimeout(() => resolve({ data: null, error: { message: 'Timeout' } }), 5000)
              ) as Promise<any>
            ]);
            preferences = (prefResult as any)?.data || null;
            prefError = (prefResult as any)?.error || null;
          } catch (err) {
            console.warn('[useAuth] Error or timeout fetching preferences:', err);
            prefError = { message: 'Timeout or error' };
          }

          if (prefError) {
            console.warn('[useAuth] No preferences found:', prefError?.message);
          }

          setProfile({
            user_id: dbProfile.user_id,
            first_name: dbProfile.first_name,
            date_of_birth: dbProfile.date_of_birth,
            gender: dbProfile.gender,
            custom_gender: dbProfile.custom_gender || undefined,
            sexual_orientation: dbProfile.sexual_orientation || [],
            bio: dbProfile.bio || '',
            photos: dbProfile.photos || [],
            primary_photo_idx: dbProfile.primary_photo_idx || 0,
            location: dbProfile.location || undefined,
            city: dbProfile.city || undefined,
            country: dbProfile.country || undefined,
            interests: dbProfile.interests || [],
            created_at: dbProfile.created_at,
            updated_at: dbProfile.updated_at,
            is_verified: dbProfile.is_verified || false,
            verification_photo: dbProfile.verification_photo || undefined,
            age: dbProfile.age || 0,
            preferences: preferences
              ? {
                  user_id: preferences.user_id,
                  seeking_genders: preferences.seeking_genders || [],
                  age_min: preferences.age_min,
                  age_max: preferences.age_max,
                  max_distance_km: preferences.max_distance_km,
                  relationship_intent: preferences.relationship_intent,
                  lifestyle: preferences.lifestyle || {},
                  values: preferences.values || [],
                  deal_breakers: preferences.deal_breakers || [],
                  interests: preferences.interests || [],
                  quiet_hours_start: preferences.quiet_hours_start || undefined,
                  quiet_hours_end: preferences.quiet_hours_end || undefined,
                  focus_session_duration: preferences.focus_session_duration || 25,
                  daily_goal: preferences.daily_goal || undefined,
                  created_at: preferences.created_at,
                  updated_at: preferences.updated_at,
                }
              : undefined,
          });
          console.log('[useAuth] Profile loaded from database');
        } else {
          // Fallback minimal placeholder to avoid blank UI until profile is created
          const placeholder = {
            user_id: userId,
            first_name: authUser.user.email?.split('@')[0] || 'User',
            date_of_birth: '1995-01-01',
            gender: 'prefer_not_to_say' as const,
            sexual_orientation: [],
            bio: '',
            photos: [],
            primary_photo_idx: 0,
            city: undefined,
            country: undefined,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            is_verified: false,
            age: 0,
          };
          setProfile(placeholder as any);
        }
        console.log('[useAuth] User data set successfully');
      }
      
      setLoading(false);
    } catch (error) {
      console.error('[useAuth] Error fetching user data:', error);
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string) => {
    console.log('[useAuth] signUp called with:', { email, passwordLength: password.length });
    try {
      console.log('[useAuth] Calling supabase.auth.signUp...');
      // Simplified signup without email confirmation for testing
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          // Don't require email verification for now
          emailRedirectTo: typeof window !== 'undefined' && window.location?.origin ? window.location.origin : 'https://zfnwtnqwokwvuxxwxgsr.supabase.co',
          data: {
            first_name: email.split('@')[0],
          }
        }
      });
      
      console.log('[useAuth] signUp response:', { data, error });
      
      if (error) {
        console.error('[useAuth] Signup error:', error);
        return { data, error };
      }
      
      // If signup successful, manually create the profile
      if (data.user) {
        console.log('[useAuth] Signup successful, creating profile...');
        
        try {
          // Create a profile for the user with timeout protection
          let profileData: any = null;
          let profileError: any = null;
          try {
            const profileCreateResult = await Promise.race([
              supabase
                .from('profiles')
                .insert([
                  { 
                    user_id: data.user.id,
                    first_name: email.split('@')[0],
                    date_of_birth: '1995-01-01', // Default value
                    gender: 'prefer_not_to_say',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                  }
                ])
                .select(),
              new Promise((resolve) => 
                setTimeout(() => resolve({ data: null, error: { message: 'Timeout' } }), 5000)
              ) as Promise<any>
            ]);
            profileData = (profileCreateResult as any)?.data || null;
            profileError = (profileCreateResult as any)?.error || null;
          } catch (err) {
            console.warn('[useAuth] Error or timeout creating profile:', err);
            profileError = { message: 'Timeout or error' };
          }
          
          if (profileError) {
            console.error('[useAuth] Error creating profile:', profileError);
          } else {
            console.log('[useAuth] Profile created successfully:', profileData);
          }
          
          // Create preferences for the user with timeout protection
          let prefData: any = null;
          let prefError: any = null;
          try {
            const prefCreateResult = await Promise.race([
              supabase
                .from('preferences')
                .insert([
                  { 
                    user_id: data.user.id,
                    age_min: 18,
                    age_max: 100,
                    max_distance_km: 50,
                    relationship_intent: 'not_sure',
                    focus_session_duration: 25,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                  }
                ])
                .select(),
              new Promise((resolve) => 
                setTimeout(() => resolve({ data: null, error: { message: 'Timeout' } }), 5000)
              ) as Promise<any>
            ]);
            prefData = (prefCreateResult as any)?.data || null;
            prefError = (prefCreateResult as any)?.error || null;
          } catch (err) {
            console.warn('[useAuth] Error or timeout creating preferences:', err);
            prefError = { message: 'Timeout or error' };
          }
            
          if (prefError) {
            console.error('[useAuth] Error creating preferences:', prefError);
          } else {
            console.log('[useAuth] Preferences created successfully:', prefData);
          }
        } catch (createError) {
          console.error('[useAuth] Error in profile/preferences creation:', createError);
        }
      }
      
      return { data, error };
    } catch (err) {
      console.error('[useAuth] Signup catch error:', err);
      return { data: null, error: err };
    }
  };

  const signIn = async (email: string, password: string) => {
    console.log('[useAuth] signIn called with:', { email, passwordLength: password.length });
    console.log('[useAuth] Calling supabase.auth.signInWithPassword...');
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      console.log('[useAuth] signIn response:', { data, error });
      
      // If auth error (wrong password, user doesn't exist in auth), return error
      if (error) {
        return { data, error, needsOnboarding: false };
      }
      
      // If login successful, check if profile exists
      if (data?.user) {
        console.log('[useAuth] Login successful, checking if profile exists...');
        
        // Check if profile exists with timeout protection
        let existingProfile: any = null;
        try {
          const profileCheckResult = await Promise.race([
            supabase
              .from('profiles')
              .select('*')
              .eq('user_id', data.user.id)
              .maybeSingle(),
            new Promise((resolve) => 
              setTimeout(() => resolve({ data: null, error: { message: 'Timeout' } }), 5000)
            ) as Promise<any>
          ]);
          existingProfile = (profileCheckResult as any)?.data || null;
        } catch (err) {
          console.warn('[useAuth] Error or timeout checking profile:', err);
        }
        
        // If no profile exists, return needsOnboarding flag
        if (!existingProfile) {
          console.log('[useAuth] No profile found - user needs to complete onboarding');
          return { data, error: null, needsOnboarding: true };
        }
        
        console.log('[useAuth] Profile exists, login complete');
      }
      
      return { data, error, needsOnboarding: false };
    } catch (err) {
      console.error('[useAuth] Login catch error:', err);
      return { data: null, error: err, needsOnboarding: false };
    }
  };

  const signOut = async () => {
    try {
      console.log('[useAuth] Signing out...');
      
      // Clear local state first
      setUser(null);
      setProfile(null);
      setSession(null);
      
      // Then sign out from Supabase
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('[useAuth] Sign out error:', error);
        return { error };
      }
      
      console.log('[useAuth] ✅ Sign out successful');
      return { error: null };
    } catch (err) {
      console.error('[useAuth] Sign out exception:', err);
      // Still clear state even if there's an error
      setUser(null);
      setProfile(null);
      setSession(null);
      return { error: err };
    }
  };

  const refreshProfile = async () => {
    if (!user) return { error: new Error('No user logged in') };

    try {
      console.log('[useAuth] Refreshing profile data...');
      
      // Fetch profile from database
      const { data: dbProfile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profileError) {
        console.error('[useAuth] Error refreshing profile:', profileError);
        return { error: profileError };
      }

      if (dbProfile) {
        // Fetch preferences separately
        const { data: preferences, error: prefError } = await supabase
          .from('preferences')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (prefError) {
          console.warn('[useAuth] No preferences found during refresh:', prefError?.message);
        }

        const updatedProfile = {
          user_id: dbProfile.user_id,
          first_name: dbProfile.first_name,
          date_of_birth: dbProfile.date_of_birth,
          gender: dbProfile.gender,
          custom_gender: dbProfile.custom_gender || undefined,
          sexual_orientation: dbProfile.sexual_orientation || [],
          bio: dbProfile.bio || '',
          photos: dbProfile.photos || [],
          primary_photo_idx: dbProfile.primary_photo_idx || 0,
          location: dbProfile.location || undefined,
          city: dbProfile.city || undefined,
          country: dbProfile.country || undefined,
          interests: dbProfile.interests || [],
          created_at: dbProfile.created_at,
          updated_at: dbProfile.updated_at,
          is_verified: dbProfile.is_verified || false,
          verification_photo: dbProfile.verification_photo || undefined,
          age: dbProfile.age || 0,
          preferences: preferences || undefined,
        };

        console.log('[useAuth] Profile refreshed successfully:', {
          first_name: updatedProfile.first_name,
          bio: updatedProfile.bio,
          interests: updatedProfile.interests,
          photos: updatedProfile.photos?.length || 0
        });

        setProfile(updatedProfile);
        return { data: updatedProfile, error: null };
      }

      return { error: new Error('No profile data found') };
    } catch (error) {
      console.error('[useAuth] Error refreshing profile:', error);
      return { error };
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return { error: new Error('No user logged in') };

    console.log('[useAuth] Updating profile:', updates);

    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('[useAuth] Profile update error:', error);
      return { data: null, error };
    }

    if (data) {
      console.log('[useAuth] Profile updated successfully:', data);
      // Refresh the full profile data to ensure UI updates
      await refreshProfile();
    }

    return { data, error };
  };

  const resetPassword = async (email: string) => {
    console.log('[useAuth] resetPassword called with:', { email });
    try {
      // Use the app scheme for deep linking
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'https://auth.expo.io/@qossai03/partner-productivity-app/reset-password',
      });
      console.log('[useAuth] resetPassword response:', { data, error });
      return { data, error };
    } catch (err) {
      console.error('[useAuth] resetPassword catch error:', err);
      return { data: null, error: err };
    }
  };

  const updatePassword = async (newPassword: string) => {
    console.log('[useAuth] updatePassword called');
    try {
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      console.log('[useAuth] updatePassword response:', { data, error });
      return { data, error };
    } catch (err) {
      console.error('[useAuth] updatePassword catch error:', err);
      return { data: null, error: err };
    }
  };

  return {
    user,
    profile,
    session,
    loading,
    supabaseError,
    signUp,
    signIn,
    signOut,
    updateProfile,
    refreshProfile,
    resetPassword,
    updatePassword,
  };
}

