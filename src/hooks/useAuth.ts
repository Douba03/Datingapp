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
    // Increase timeout to avoid premature sign-out perception on slow networks
    const loadingTimeout = setTimeout(() => {
      console.log('[useAuth] Loading timeout reached, setting loading to false');
      setLoading(false);
    }, 20000); // 20 seconds

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
              await fetchUserData((session?.user?.id as string) || user?.id || '');
              clearTimeout(loadingTimeout);
              return;
            }

            // Grace period retry: transient null session
            console.log('[useAuth] Session temporarily null, retrying getSession in 1500ms...');
            setTimeout(async () => {
              const { data: { session: reSession } } = await supabase.auth.getSession();
              if (reSession?.user) {
                console.log('[useAuth] Retry recovered session, fetching user data');
                await fetchUserData(reSession.user.id);
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
      
      // Get auth user data
      const { data: authUser, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        console.error('[useAuth] Error getting auth user:', authError);
        setLoading(false);
        return;
      }
      
      if (authUser?.user) {
        console.log('[useAuth] Creating user data object...');
        // Create a basic user object from auth data
        const userData = {
          id: authUser.user.id,
          email: authUser.user.email || 'user@example.com',
          auth_provider: 'email',
          status: 'active' as const,
          onboarding_completed: false,
          is_premium: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          last_seen_at: new Date().toISOString(),
        };
        
        setUser(userData);

        // Try to load real profile from database
        console.log('[useAuth] Fetching profile from database...');
        const { data: dbProfile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', userId)
          .single();

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

          // Fetch preferences separately
          const { data: preferences, error: prefError } = await supabase
            .from('preferences')
            .select('*')
            .eq('user_id', userId)
            .single();

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
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      
      console.log('[useAuth] signUp response:', { data, error });
      
      if (error) {
        console.error('[useAuth] Signup error:', error);
        return { data, error };
      }
      
      // If signup successful, wait a moment for the trigger to create the user
      if (data.user) {
        console.log('[useAuth] Signup successful, waiting for user creation...');
        // Wait 2 seconds for the trigger to create the user in public.users
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Try to fetch the created user
        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.user.id)
          .single();
        
        console.log('[useAuth] User in public.users:', userData);
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
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    console.log('[useAuth] signIn response:', { data, error });
    console.log('[useAuth] Data user:', data?.user);
    console.log('[useAuth] Data session:', data?.session);
    return { data, error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
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
  };
}

