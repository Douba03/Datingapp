import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { useLocationUpdate } from '../../hooks/useLocationUpdate';
import { useProfileStats } from '../../hooks/useProfileStats';
import { supabase } from '../../services/supabase/client';
import { Button } from '../../components/ui/Button';
import { ProfileEditModal } from '../../components/profile/ProfileEditModal';
import { ProfileSettings } from '../../components/profile/ProfileSettings';
import { ProtectedRoute } from '../../components/auth/ProtectedRoute';
import { colors } from '../../components/theme/colors';
import type { Profile as ProfileType } from '../../types/user';

function ProfileScreen() {
  const { user, profile, session, signOut, updateProfile, refreshProfile } = useAuth();
  const params = useLocalSearchParams<{ viewUserId?: string; readonly?: string }>();
  const { updateLocation, loading: locationLoading } = useLocationUpdate();
  const { stats, loading: statsLoading, refreshStats } = useProfileStats();
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [otherProfile, setOtherProfile] = useState<ProfileType | null>(null);
  const [otherLoading, setOtherLoading] = useState(false);

  // Debug logging for profile data
  React.useEffect(() => {
    if (profile) {
      console.log('[ProfileScreen] Profile loaded:', {
        first_name: profile.first_name,
        bio: profile.bio,
        interests: profile.interests,
        photos: profile.photos,
        photosLength: profile.photos?.length || 0,
        firstPhoto: profile.photos?.[0] || 'No photo'
      });
    }
  }, [profile]);

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive', 
          onPress: async () => {
            await signOut();
            // Force navigate to login
            router.replace('/(auth)/login');
          }
        },
      ]
    );
  };

  const handleEditProfile = () => {
    setShowEditModal(true);
  };

  const handleSaveProfile = async (formData: any) => {
    try {
      console.log('[Profile] Saving profile updates:', formData);
      console.log('[Profile] Current user:', user?.id);
      console.log('[Profile] Current profile:', profile?.user_id);
      
      if (!user) {
        throw new Error('No user logged in');
      }
      
      // Map form data to Profile type
      const profileUpdates = {
        first_name: formData.first_name || profile?.first_name || '',
        bio: formData.bio || '',
        interests: formData.interests || [],
        photos: formData.photos || [],
        city: formData.city || '',
        country: formData.country || '',
        updated_at: new Date().toISOString(),
      };
      
      console.log('[Profile] Profile updates mapped:', profileUpdates);
      
      // Update profile in database using direct Supabase call
      console.log('[Profile] Updating profile directly with Supabase...');
      const { data, error } = await supabase
        .from('profiles')
        .update(profileUpdates)
        .eq('user_id', user.id)
        .select()
        .single();
      
      if (error) {
        console.error('[Profile] Database error:', error);
        throw error;
      }
      
      if (!data) {
        console.error('[Profile] No data returned from update');
        throw new Error('No data returned from profile update');
      }
      
      console.log('[Profile] Profile updated successfully:', data);
      
      // Update preferences if they exist in formData
      if (formData.age_min !== undefined || formData.age_max !== undefined || 
          formData.max_distance_km !== undefined || formData.relationship_intent !== undefined) {
        
        const preferencesUpdates = {
          age_min: formData.age_min,
          age_max: formData.age_max,
          max_distance_km: formData.max_distance_km,
          relationship_intent: formData.relationship_intent,
          updated_at: new Date().toISOString(),
        };
        
        console.log('[Profile] Updating preferences:', preferencesUpdates);
        
        const { error: prefsError } = await supabase
          .from('preferences')
          .update(preferencesUpdates)
          .eq('user_id', user.id);
        
        if (prefsError) {
          console.error('[Profile] Preferences update error:', prefsError);
          // Don't throw, just log - preferences update is not critical
        } else {
          console.log('[Profile] Preferences updated successfully');
        }
      }
      
      // Refresh the profile data using useAuth hook
      await refreshProfile();
      await refreshStats();
      
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error: any) {
      console.error('[Profile] Error updating profile:', error);
      Alert.alert('Error', `Failed to update profile: ${error?.message || 'Unknown error'}`);
      throw error;
    }
  };


  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshStats();
    } finally {
      setRefreshing(false);
    }
  };

  const handlePrivacySettings = () => {
    Alert.alert('Privacy Settings', 'Privacy settings would open here');
  };

  const handleNotificationSettings = () => {
    Alert.alert('Notification Settings', 'Notification settings would open here');
  };

  const handleDeleteAccount = async () => {
    if (!user) {
      Alert.alert('Error', 'No user logged in');
      return;
    }
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all your data. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('[Profile] Deleting account for user:', user.id);

              // Delete swipes
              const { error: swipesError } = await supabase
                .from('swipes')
                .delete()
                .or(`swiper_user_id.eq.${user.id},target_user_id.eq.${user.id}`);
              if (swipesError) console.warn('[Profile] Swipes delete:', swipesError.message);

              // Delete matches (messages have ON DELETE CASCADE via match_id)
              const { error: matchesError } = await supabase
                .from('matches')
                .delete()
                .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`);
              if (matchesError) console.warn('[Profile] Matches delete:', matchesError.message);

              // Delete preferences
              const { error: prefsError } = await supabase
                .from('preferences')
                .delete()
                .eq('user_id', user.id);
              if (prefsError) console.warn('[Profile] Preferences delete:', prefsError.message);

              // Delete swipe counters
              const { error: countersError } = await supabase
                .from('swipe_counters')
                .delete()
                .eq('user_id', user.id);
              if (countersError) console.warn('[Profile] Swipe counters delete:', countersError.message);

              // Delete profile
              const { error: profileError } = await supabase
                .from('profiles')
                .delete()
                .eq('user_id', user.id);
              if (profileError) console.warn('[Profile] Profile delete:', profileError.message);

              await signOut();
              Alert.alert('Account Deleted', 'Your account has been deleted.');
              router.replace('/(auth)/login');
            } catch (err: any) {
              console.error('[Profile] Delete account error:', err);
              Alert.alert('Deletion Error', err?.message || 'Failed to delete account.');
            }
          },
        },
      ]
    );
  };

  const handleUpdateLocation = async () => {
    Alert.alert(
      'Update Location',
      'This will update your location to find matches nearby. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Update', 
          onPress: async () => {
            const { error } = await updateLocation();
            if (error) {
              Alert.alert('Error', 'Failed to update location. Please try again.');
            } else {
              Alert.alert('Success', 'Location updated successfully!');
            }
          }
        },
      ]
    );
  };

  const isReadonly = params?.readonly === '1' && params?.viewUserId && params.viewUserId !== user?.id;

  // Load other user's profile when opened from chat in read-only mode
  React.useEffect(() => {
    const loadOther = async () => {
      if (!isReadonly || !params?.viewUserId) return;
      try {
        setOtherLoading(true);
        const { data: dbProfile, error: pErr } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', params.viewUserId as string)
          .single();
        if (pErr) {
          console.warn('[ProfileScreen] Other profile fetch error:', pErr.message);
          setOtherProfile(null);
          return;
        }
        const { data: prefs } = await supabase
          .from('preferences')
          .select('*')
          .eq('user_id', params.viewUserId as string)
          .single();

        const combined: ProfileType = {
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
          preferences: prefs || undefined,
        } as ProfileType;
        setOtherProfile(combined);
      } finally {
        setOtherLoading(false);
      }
    };
    loadOther();
  }, [isReadonly, params?.viewUserId]);

  // Build a safe display profile: prefer loaded profile, else fallback from session while user/profile load
  const fallbackProfile: ProfileType | null = (!isReadonly && !profile && session) ? {
    user_id: session.user.id,
    first_name: (session.user.email || 'User').split('@')[0],
    date_of_birth: '1995-01-01',
    gender: 'prefer_not_to_say' as any,
    sexual_orientation: [],
    bio: '',
    photos: [],
    primary_photo_idx: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    is_verified: false,
    age: 0,
  } as unknown as ProfileType : null;

  const displayProfile = (isReadonly ? otherProfile : (profile || fallbackProfile)) as ProfileType | null;
  if (isReadonly && (otherLoading || !displayProfile)) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>Loading profile...</Text>
      </SafeAreaView>
    );
  }
  const isViewingOther = Boolean(isReadonly);
  const safeStats = stats || { matches: 0, likes: 0, superLikes: 0, matchRate: 0, swipeCount: 0 } as any;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>{isReadonly ? 'Profile' : 'My Profile'}</Text>
          {!isReadonly && (
            <TouchableOpacity onPress={handleEditProfile}>
              <Text style={styles.editButton}>
                {editing ? 'Save' : 'Edit'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            {displayProfile?.photos && displayProfile.photos[0] ? (
              <Image
                source={{ uri: displayProfile.photos[0] }}
                style={styles.avatar}
                onError={(error) => {
                  console.error('[Profile] Image load error:', error.nativeEvent.error);
                  console.log('[Profile] Photo URI:', displayProfile.photos[0]);
                }}
                onLoad={() => {
                  console.log('[Profile] Image loaded successfully:', displayProfile.photos[0]);
                }}
              />
            ) : (
              <View style={[styles.avatar, styles.placeholderAvatar]}>
                <Ionicons name="person" size={60} color={colors.textSecondary} />
              </View>
            )}
            {!isReadonly && displayProfile?.is_verified && (
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedText}>✓</Text>
              </View>
            )}
          </View>

          <View style={styles.infoContainer}>
            <Text style={styles.name}>
              {displayProfile?.first_name}{displayProfile?.age ? `, ${displayProfile.age}` : ''}
            </Text>
            <Text style={styles.meta}>
              {displayProfile?.gender?.replace('_', ' ')}{displayProfile?.city ? ` • ${displayProfile.city}` : ''}{displayProfile?.country ? `, ${displayProfile.country}` : ''}
            </Text>
            
            {displayProfile?.bio && (
              <Text style={styles.bio}>{displayProfile.bio}</Text>
            )}

            {/* location moved into meta line above for compactness */}

            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{safeStats.matches}</Text>
                <Text style={styles.statLabel}>Matches</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{safeStats.likes}</Text>
                <Text style={styles.statLabel}>Likes</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{safeStats.superLikes}</Text>
                <Text style={styles.statLabel}>Super Likes</Text>
              </View>
            </View>
            
            <View style={styles.additionalStats}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{safeStats.matchRate}%</Text>
                <Text style={styles.statLabel}>Match Rate</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{safeStats.swipeCount}</Text>
                <Text style={styles.statLabel}>Swipes</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Interests Section */}
        {displayProfile?.interests && displayProfile.interests.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="grid" size={20} color={colors.primary} />
              <Text style={styles.sectionTitle}>Interests</Text>
            </View>
            <View style={styles.interestsContainer}>
              {displayProfile.interests.map((interest, index) => (
                <View key={index} style={styles.interestTag}>
                  <Text style={styles.interestText}>{interest}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="heart" size={20} color={colors.primary} />
            <Text style={styles.sectionTitle}>Preferences</Text>
          </View>
          <View style={styles.preferenceItem}>
            <Text style={styles.preferenceLabel}>Looking for</Text>
            <Text style={styles.preferenceValue}>
              {displayProfile?.preferences?.relationship_intent?.replace('_', ' ') || 'Not set'}
            </Text>
          </View>
          <View style={styles.preferenceItem}>
            <Text style={styles.preferenceLabel}>Age range</Text>
            <Text style={styles.preferenceValue}>
              {displayProfile?.preferences?.age_min || 18} - {displayProfile?.preferences?.age_max || 100}
            </Text>
          </View>
          <View style={styles.preferenceItem}>
            <Text style={styles.preferenceLabel}>Maximum distance</Text>
            <Text style={styles.preferenceValue}>
              {displayProfile?.preferences?.max_distance_km || 50} km
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="location" size={20} color={colors.primary} />
            <Text style={styles.sectionTitle}>Location</Text>
          </View>
          <View style={styles.preferenceItem}>
            <Text style={styles.preferenceLabel}>Current location</Text>
            <Text style={styles.preferenceValue}>
              {displayProfile?.city || 'Unknown'}
            </Text>
          </View>
          <TouchableOpacity 
            style={styles.locationUpdateButton}
            onPress={handleUpdateLocation}
            disabled={locationLoading}
          >
            <Ionicons 
              name="refresh" 
              size={16} 
              color={colors.primary} 
              style={{ marginRight: 8 }}
            />
            <Text style={styles.locationUpdateText}>
              {locationLoading ? 'Updating...' : 'Update Location'}
            </Text>
          </TouchableOpacity>
        </View>

        {!isReadonly && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="person" size={20} color={colors.primary} />
              <Text style={styles.sectionTitle}>Account</Text>
            </View>
            <View style={styles.preferenceItem}>
              <Text style={styles.preferenceLabel}>Email</Text>
              <Text style={styles.preferenceValue}>{user?.email || session?.user?.email || '-'}</Text>
            </View>
            <View style={styles.preferenceItem}>
              <Text style={styles.preferenceLabel}>Member since</Text>
              <Text style={styles.preferenceValue}>
                {new Date((user?.created_at || (session?.user as any)?.created_at || new Date().toISOString())).toLocaleDateString()}
              </Text>
            </View>
          </View>
        )}

        {!isReadonly && (
          <>
            {/* Profile Settings */}
            <ProfileSettings
              onLocationUpdate={handleUpdateLocation}
              onDeleteAccount={handleDeleteAccount}
            />
            <Button
              title="Sign Out"
              onPress={handleSignOut}
              variant="outline"
              style={styles.signOutButton}
            />
          </>
        )}
      </ScrollView>

      {/* Profile Edit Modal */}
      <ProfileEditModal
        visible={showEditModal}
        profile={profile}
        onClose={() => setShowEditModal(false)}
        onSave={handleSaveProfile}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
  },
  editButton: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
  },
  profileCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 16,
    position: 'relative',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  placeholderAvatar: {
    backgroundColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.success,
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifiedText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  infoContainer: {
    alignItems: 'center',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  bio: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 8,
  },
  meta: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  location: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 12,
  },
  additionalStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  section: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginLeft: 8,
  },
  preferenceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  preferenceLabel: {
    fontSize: 16,
    color: colors.text,
  },
  preferenceValue: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  interestTag: {
    backgroundColor: `${colors.primary}20`,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: `${colors.primary}40`,
  },
  interestText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },
  locationUpdateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: `${colors.primary}15`,
    borderRadius: 8,
    marginTop: 8,
  },
  locationUpdateText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },
  signOutButton: {
    marginTop: 24,
  },
});

export default function ProfileScreenWrapper() {
  return (
    <ProtectedRoute>
      <ProfileScreen />
    </ProtectedRoute>
  );
}
