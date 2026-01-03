import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Dimensions,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { useLocationUpdate } from '../../hooks/useLocationUpdate';
import { useProfileStats } from '../../hooks/useProfileStats';
import { useProfile } from '../../hooks/useProfile';
import { useTheme } from '../../contexts/ThemeContext';
import { supabase } from '../../services/supabase/client';
import { ProfileEditModal } from '../../components/profile/ProfileEditModal';
import { ProtectedRoute } from '../../components/auth/ProtectedRoute';
import { UpgradePrompt } from '../../components/premium/UpgradePrompt';
import { colors as staticColors } from '../../components/theme/colors';
import type { Profile as ProfileType } from '../../types/user';

const { width: screenWidth } = Dimensions.get('window');

function ProfileScreen() {
  const { user, profile, session, signOut, updateProfile, refreshProfile } = useAuth();
  const params = useLocalSearchParams<{ viewUserId?: string; readonly?: string; returnTo?: string }>();
  const insets = useSafeAreaInsets();
  const { updateLocation, loading: locationLoading } = useLocationUpdate();
  const { stats, loading: statsLoading, refreshStats } = useProfileStats();
  const { boostProfile } = useProfile();
  const { colors } = useTheme();
  const router = useRouter();
  const [showEditModal, setShowEditModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [otherProfile, setOtherProfile] = useState<ProfileType | null>(null);
  const [otherLoading, setOtherLoading] = useState(false);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [upgradeTrigger, setUpgradeTrigger] = useState<'likes' | 'boost'>('likes');
  const [boostLoading, setBoostLoading] = useState(false);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);

  const handleEditProfile = () => setShowEditModal(true);

  const handleSaveProfile = async (formData: any) => {
    try {
      if (!user) throw new Error('No user logged in');
      
      const profileUpdates = {
        first_name: formData.first_name || profile?.first_name || '',
        bio: formData.bio || '',
        interests: formData.interests || [],
        photos: formData.photos || [],
        city: formData.city || '',
        country: formData.country || '',
        updated_at: new Date().toISOString(),
      };
      
      const { error } = await supabase
        .from('profiles')
        .update(profileUpdates)
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      if (formData.age_min !== undefined || formData.age_max !== undefined || 
          formData.max_distance_km !== undefined || formData.relationship_intent !== undefined ||
          formData.seeking_genders !== undefined) {
        const prefsUpdate: any = {
          updated_at: new Date().toISOString(),
        };
        if (formData.age_min !== undefined) prefsUpdate.age_min = formData.age_min;
        if (formData.age_max !== undefined) prefsUpdate.age_max = formData.age_max;
        if (formData.max_distance_km !== undefined) prefsUpdate.max_distance_km = formData.max_distance_km;
        if (formData.relationship_intent !== undefined) prefsUpdate.relationship_intent = formData.relationship_intent;
        if (formData.seeking_genders !== undefined) prefsUpdate.seeking_genders = formData.seeking_genders;
        
        console.log('[Profile] Updating preferences:', prefsUpdate);
        
        await supabase
          .from('preferences')
          .update(prefsUpdate)
          .eq('user_id', user.id);
      }
      
      // Close modal first, then refresh in background
      setShowEditModal(false);
      
      // Small delay to let modal close before refreshing
      setTimeout(async () => {
        await refreshProfile();
        await refreshStats();
      }, 100);
      
      Alert.alert('Success', 'Profile updated!');
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to update');
      throw error;
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshProfile();
      await refreshStats();
    } finally {
      setRefreshing(false);
    }
  };

  const handleBoost = async () => {
    if (!user?.is_premium) {
      setUpgradeTrigger('boost');
      setShowUpgradePrompt(true);
      return;
    }
    setBoostLoading(true);
    try {
      const { error } = await boostProfile();
      if (error) {
        Alert.alert('Error', 'Failed to boost profile');
      } else {
        Alert.alert('🚀 Boosted!', 'Your profile is now 2x more visible for 1 hour!');
      }
    } finally {
      setBoostLoading(false);
    }
  };

  const isReadonly = (params?.readonly === 'true' || params?.readonly === '1') && params?.viewUserId && params.viewUserId !== user?.id;

  React.useEffect(() => {
    const loadOther = async () => {
      if (!isReadonly || !params?.viewUserId) return;
      try {
        setOtherLoading(true);
        const { data: dbProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', params.viewUserId as string)
          .single();
        if (dbProfile) {
        const { data: prefs } = await supabase
          .from('preferences')
          .select('*')
          .eq('user_id', params.viewUserId as string)
          .single();
          setOtherProfile({ ...dbProfile, preferences: prefs } as ProfileType);
        }
      } finally {
        setOtherLoading(false);
      }
    };
    loadOther();
  }, [isReadonly, params?.viewUserId]);

  const fallbackProfile: ProfileType | null = (!isReadonly && !profile && session) ? {
    user_id: session.user.id,
    first_name: (session.user.email || 'User').split('@')[0],
    date_of_birth: '1995-01-01',
    gender: 'prefer_not_to_say' as any,
    bio: '',
    photos: [],
    interests: [],
    age: 0,
  } as unknown as ProfileType : null;

  const displayProfile = (isReadonly ? otherProfile : (profile || fallbackProfile)) as ProfileType | null;
  const safeStats = stats || { matches: 0, likes: 0, superLikes: 0, matchRate: 0, swipeCount: 0 };
  const photos = displayProfile?.photos || [];

  if (isReadonly && (otherLoading || !displayProfile)) {
    return (
      <View style={[styles.container, styles.loadingContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
        }
      >
        {/* Hero Photo Section */}
        <View style={styles.heroSection}>
          {photos.length > 0 ? (
            <>
              <Image 
                source={{ uri: photos[activePhotoIndex] }} 
                style={styles.heroImage}
                contentFit="cover"
                transition={200}
                cachePolicy="memory-disk"
              />
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.8)']}
                style={styles.heroGradient}
              />
              {/* Photo Indicators */}
              {photos.length > 1 && (
                <View style={styles.photoIndicators}>
                  {photos.map((_, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[styles.indicator, activePhotoIndex === index && styles.indicatorActive]}
                      onPress={() => setActivePhotoIndex(index)}
                    />
                  ))}
              </View>
            )}
              {/* Photo Navigation */}
              <View style={styles.photoNavigation}>
                <TouchableOpacity
                  style={styles.photoNavButton}
                  onPress={() => setActivePhotoIndex(prev => Math.max(0, prev - 1))}
                  disabled={activePhotoIndex === 0}
                >
                  <View style={activePhotoIndex === 0 ? styles.navButtonDisabled : undefined} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.photoNavButton}
                  onPress={() => setActivePhotoIndex(prev => Math.min(photos.length - 1, prev + 1))}
                  disabled={activePhotoIndex === photos.length - 1}
                >
                  <View style={activePhotoIndex === photos.length - 1 ? styles.navButtonDisabled : undefined} />
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <View style={styles.noPhotoContainer}>
              <Ionicons name="camera" size={60} color={colors.textSecondary} />
              <Text style={styles.noPhotoText}>Add photos to your profile</Text>
          </View>
          )}

          {/* Hero Content Overlay */}
          <View style={styles.heroContent}>
            <View style={styles.heroNameRow}>
              <Text style={styles.heroName}>
                {displayProfile?.first_name}{displayProfile?.age ? `, ${displayProfile.age}` : ''}
              </Text>
              {user?.is_premium && (
                <View style={styles.premiumBadge}>
                  <Ionicons name="diamond" size={14} color="#fff" />
                  <Text style={styles.premiumBadgeText}>PRO</Text>
                </View>
              )}
            </View>
            {displayProfile?.city && (
              <View style={styles.heroLocation}>
                <Ionicons name="location" size={16} color="#fff" />
                <Text style={styles.heroLocationText}>
                  {displayProfile.city}{displayProfile.country ? `, ${displayProfile.country}` : ''}
            </Text>
              </View>
            )}
          </View>

          {/* Edit Button */}
          {!isReadonly && (
            <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
              <Ionicons name="pencil" size={20} color="#fff" />
            </TouchableOpacity>
            )}

          {/* Back Button for readonly */}
          {isReadonly && (
            <TouchableOpacity 
              style={styles.backButton} 
              onPress={() => {
                // Use returnTo if provided, otherwise go back
                if (params.returnTo) {
                  router.replace(params.returnTo as any);
                } else {
                  router.back();
                }
              }}
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
          )}
        </View>

        {/* Stats Cards */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
            <LinearGradient colors={[colors.primary, colors.primaryDark]} style={styles.statIconBg}>
              <Ionicons name="heart" size={20} color="#fff" />
            </LinearGradient>
                <Text style={[styles.statNumber, { color: colors.text }]}>{safeStats.matches}</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Matches</Text>
              </View>
          <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
            <LinearGradient colors={['#FF6B6B', '#EE5A5A']} style={styles.statIconBg}>
              <Ionicons name="flame" size={20} color="#fff" />
            </LinearGradient>
                <Text style={[styles.statNumber, { color: colors.text }]}>{safeStats.likes}</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Likes</Text>
              </View>
          <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
            <LinearGradient colors={['#4ECDC4', '#44A08D']} style={styles.statIconBg}>
              <Ionicons name="star" size={20} color="#fff" />
            </LinearGradient>
                <Text style={[styles.statNumber, { color: colors.text }]}>{safeStats.superLikes}</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Super Likes</Text>
              </View>
            </View>
            
        {/* Bio Section */}
        {displayProfile?.bio && (
          <View style={[styles.section, { backgroundColor: colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>About Me</Text>
            <Text style={[styles.bioText, { color: colors.textSecondary }]}>{displayProfile.bio}</Text>
              </View>
        )}

        {/* Interests Section */}
        {displayProfile?.interests && displayProfile.interests.length > 0 && (
          <View style={[styles.section, { backgroundColor: colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Interests</Text>
            <View style={styles.interestsGrid}>
              {displayProfile.interests.map((interest, index) => (
                <View key={index} style={[styles.interestChip, { backgroundColor: `${colors.primary}20` }]}>
                  <Text style={[styles.interestText, { color: colors.text }]}>{interest}</Text>
              </View>
              ))}
            </View>
          </View>
        )}

        {/* Quick Actions */}
        {!isReadonly && (
          <View style={[styles.section, { backgroundColor: colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Actions</Text>
            
            {/* See Who Liked You */}
            <TouchableOpacity
              style={[styles.actionCard, { borderBottomColor: colors.border }]}
              onPress={() => {
                if (user?.is_premium) {
                  router.push('/(tabs)/premium/likes-you');
                } else {
                  setUpgradeTrigger('likes');
                  setShowUpgradePrompt(true);
                }
              }}
            >
              <LinearGradient colors={[colors.primary, colors.primaryDark]} style={styles.actionIconBg}>
                <Ionicons name="eye" size={24} color="#fff" />
              </LinearGradient>
              <View style={styles.actionContent}>
                <Text style={[styles.actionTitle, { color: colors.text }]}>See Who Liked You</Text>
                <Text style={[styles.actionSubtitle, { color: colors.textSecondary }]}>
                  {user?.is_premium ? `${safeStats.likes} people like you` : 'Premium feature'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color={colors.textSecondary} />
            </TouchableOpacity>

            {/* Boost Profile - Hidden from premium functions */}
            {/* <TouchableOpacity style={styles.actionCard} onPress={handleBoost} disabled={boostLoading}>
              <LinearGradient colors={['#9C27B0', '#7B1FA2']} style={styles.actionIconBg}>
                <Ionicons name="rocket" size={24} color="#fff" />
              </LinearGradient>
              <View style={styles.actionContent}>
                <Text style={styles.actionTitle}>Boost Profile</Text>
                <Text style={styles.actionSubtitle}>
                  {user?.is_premium ? 'Get 2x more visibility' : 'Premium feature'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color={colors.textSecondary} />
            </TouchableOpacity> */}

            {/* Update Location */}
            <TouchableOpacity
              style={[styles.actionCard, { borderBottomColor: colors.border }]}
              onPress={() => {
                Alert.alert(
                  'Update Location',
                  'Would you like to update your location to your current position?',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Update', onPress: async () => {
                      const result = await updateLocation();
                      if (!result.error) {
                        Alert.alert('Success', 'Your location has been updated!');
                        refreshProfile();
                      } else {
                        Alert.alert('Error', 'Failed to update location');
                      }
                    }}
                  ]
                );
              }}
              disabled={locationLoading}
            >
              <LinearGradient colors={['#2196F3', '#1976D2']} style={styles.actionIconBg}>
                <Ionicons name="location" size={24} color="#fff" />
              </LinearGradient>
              <View style={styles.actionContent}>
                <Text style={[styles.actionTitle, { color: colors.text }]}>Update Location</Text>
                <Text style={[styles.actionSubtitle, { color: colors.textSecondary }]}>
                  {displayProfile?.city || 'Set your location'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        )}

        {/* Preferences Summary */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Dating Preferences</Text>
          <View style={styles.preferencesGrid}>
            <View style={styles.prefItem}>
              <Ionicons name="heart-outline" size={20} color={colors.primary} />
              <Text style={[styles.prefLabel, { color: colors.textSecondary }]}>Looking for</Text>
              <Text style={[styles.prefValue, { color: colors.text }]}>
                {displayProfile?.preferences?.relationship_intent?.replace(/_/g, ' ') || 'Not set'}
            </Text>
          </View>
            <View style={styles.prefItem}>
              <Ionicons name="calendar-outline" size={20} color={colors.primary} />
              <Text style={[styles.prefLabel, { color: colors.textSecondary }]}>Age range</Text>
              <Text style={[styles.prefValue, { color: colors.text }]}>
              {displayProfile?.preferences?.age_min || 18} - {displayProfile?.preferences?.age_max || 100}
            </Text>
          </View>
            <View style={styles.prefItem}>
              <Ionicons name="navigate-outline" size={20} color={colors.primary} />
              <Text style={[styles.prefLabel, { color: colors.textSecondary }]}>Distance</Text>
              <Text style={[styles.prefValue, { color: colors.text }]}>
              {displayProfile?.preferences?.max_distance_km || 50} km
            </Text>
          </View>
        </View>
          </View>

        {/* Sign Out Button */}
        {!isReadonly && (
          <TouchableOpacity 
            style={[styles.signOutButton, { backgroundColor: colors.surface }]}
            onPress={async () => {
              // Use window.confirm for web, Alert for native
              if (Platform.OS === 'web') {
                const confirmed = window.confirm('Are you sure you want to sign out?');
                if (confirmed) {
                  await signOut();
                  router.replace('/(auth)/login');
                }
              } else {
                Alert.alert('Sign Out', 'Are you sure?', [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Sign Out', style: 'destructive', onPress: async () => {
                    await signOut();
                    router.replace('/(auth)/login');
                  }}
                ]);
              }
            }}
          >
            <Ionicons name="log-out-outline" size={20} color={colors.error} />
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Modals */}
      <ProfileEditModal
        visible={showEditModal}
        profile={profile}
        onClose={() => setShowEditModal(false)}
        onSave={handleSaveProfile}
      />
      <UpgradePrompt
        visible={showUpgradePrompt}
        onClose={() => setShowUpgradePrompt(false)}
        onUpgrade={() => {
          setShowUpgradePrompt(false);
          router.push('/(onboarding)/payment');
        }}
        trigger={upgradeTrigger}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: staticColors.background,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: staticColors.textSecondary,
  },
  
  // Hero Section - Mobile optimized
  heroSection: {
    height: 320,
    position: 'relative',
    backgroundColor: staticColors.border,
  },
  heroImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  heroGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 180,
  },
  noPhotoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: staticColors.border,
  },
  noPhotoText: {
    marginTop: 12,
    fontSize: 16,
    color: staticColors.textSecondary,
  },
  photoIndicators: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    gap: 4,
  },
  indicator: {
    flex: 1,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.4)',
    borderRadius: 2,
  },
  indicatorActive: {
    backgroundColor: '#fff',
  },
  photoNavigation: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
  },
  photoNavButton: {
    flex: 1,
  },
  navButtonDisabled: {
    opacity: 0,
  },
  heroContent: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
  },
  heroNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  heroName: {
    fontSize: 26,
    fontWeight: '800',
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: staticColors.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 3,
  },
  premiumBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },
  heroLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 4,
  },
  heroLocationText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.95)',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  editButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButton: {
    position: 'absolute',
    top: 12,
    left: 12,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Stats - Mobile optimized
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    marginTop: 16,
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: staticColors.surface,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  statIconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: staticColors.text,
  },
  statLabel: {
    fontSize: 11,
    color: staticColors.textSecondary,
    marginTop: 2,
    textAlign: 'center',
  },

  // Sections - Mobile optimized
  section: {
    backgroundColor: staticColors.surface,
    marginHorizontal: 12,
    marginTop: 12,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: staticColors.text,
    marginBottom: 12,
  },
  bioText: {
    fontSize: 15,
    color: staticColors.textSecondary,
    lineHeight: 22,
  },

  // Interests - Mobile optimized
  interestsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  interestChip: {
    backgroundColor: `${staticColors.primary}15`,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: `${staticColors.primary}30`,
  },
  interestText: {
    fontSize: 13,
    color: staticColors.primary,
    fontWeight: '600',
  },

  // Action Cards - Mobile optimized
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: staticColors.border,
  },
  actionIconBg: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionContent: {
    flex: 1,
    marginLeft: 12,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: staticColors.text,
  },
  actionSubtitle: {
    fontSize: 12,
    color: staticColors.textSecondary,
    marginTop: 2,
  },

  // Preferences - Mobile optimized
  preferencesGrid: {
    gap: 12,
  },
  prefItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  prefLabel: {
    flex: 1,
    fontSize: 14,
    color: staticColors.text,
  },
  prefValue: {
    fontSize: 14,
    color: staticColors.textSecondary,
    fontWeight: '500',
  },

  // Sign Out - Mobile optimized
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 12,
    marginTop: 20,
    paddingVertical: 14,
    backgroundColor: `${staticColors.error}10`,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: `${staticColors.error}30`,
  },
  signOutText: {
    fontSize: 15,
    color: staticColors.error,
    fontWeight: '600',
  },
});

export default function ProfileScreenWrapper() {
  return (
    <ProtectedRoute>
      <ProfileScreen />
    </ProtectedRoute>
  );
}
