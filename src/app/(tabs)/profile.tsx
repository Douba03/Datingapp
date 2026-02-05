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
import { calculateCompatibility } from '../../utils/compatibility';
import type { Profile as ProfileType } from '../../types/user';

const { width: screenWidth } = Dimensions.get('window');

// Helper function to format field values
const formatFieldValue = (value: string | null | undefined): string => {
  if (!value) return '';
  return value.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

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
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);

  const isReadonly = params.viewUserId && params.readonly === 'true';

  // Fetch other user's profile if viewing someone else
  React.useEffect(() => {
    if (params.viewUserId && params.viewUserId !== user?.id) {
      fetchOtherProfile(params.viewUserId);
    }
  }, [params.viewUserId]);

  const fetchOtherProfile = async (userId: string) => {
    setOtherLoading(true);
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (profileError) throw profileError;

      const { data: prefsData } = await supabase
        .from('preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      setOtherProfile({ ...profileData, preferences: prefsData } as ProfileType);
    } catch (error) {
      console.error('[Profile] Error fetching other profile:', error);
      Alert.alert('Error', 'Failed to load profile');
    } finally {
      setOtherLoading(false);
    }
  };

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
        religious_practice: formData.religious_practice,
        prayer_frequency: formData.prayer_frequency,
        hijab_preference: formData.hijab_preference,
        dietary_preference: formData.dietary_preference,
        family_involvement: formData.family_involvement,
        marriage_timeline: formData.marriage_timeline,
        education_level: formData.education_level,
        occupation: formData.occupation,
        living_situation: formData.living_situation,
        has_children: formData.has_children,
        wants_children: formData.wants_children,
        ethnicity: formData.ethnicity,
        languages: formData.languages,
        tribe_clan: formData.tribe_clan,
        updated_at: new Date().toISOString(),
      };
      
      const { error } = await supabase
        .from('profiles')
        .update(profileUpdates)
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      if (formData.age_min !== undefined || formData.age_max !== undefined || 
          formData.max_distance_km !== undefined || formData.relationship_intent !== undefined ||
          formData.seeking_genders !== undefined || formData.values !== undefined) {
        const prefsUpdate: any = {
          updated_at: new Date().toISOString(),
        };
        if (formData.age_min !== undefined) prefsUpdate.age_min = formData.age_min;
        if (formData.age_max !== undefined) prefsUpdate.age_max = formData.age_max;
        if (formData.max_distance_km !== undefined) prefsUpdate.max_distance_km = formData.max_distance_km;
        if (formData.relationship_intent !== undefined) prefsUpdate.relationship_intent = formData.relationship_intent;
        if (formData.seeking_genders !== undefined) prefsUpdate.seeking_genders = formData.seeking_genders;
        if (formData.values !== undefined) prefsUpdate.values = formData.values;
        
        await supabase
          .from('preferences')
          .update(prefsUpdate)
          .eq('user_id', user.id);
      }
      
      setShowEditModal(false);
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

  const displayProfile = (isReadonly ? otherProfile : profile) as ProfileType | null;
  const safeStats = stats || { matches: 0, likes: 0, superLikes: 0, matchRate: 0, swipeCount: 0 };
  const photos = displayProfile?.photos || [];

  const compatibility = (isReadonly && displayProfile && profile) 
    ? calculateCompatibility(displayProfile, profile, profile.preferences)
    : null;

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
              <Text style={[styles.noPhotoText, { color: colors.textSecondary }]}>Add photos to your profile</Text>
            </View>
          )}

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

          {!isReadonly && (
            <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
              <Ionicons name="pencil" size={20} color="#fff" />
            </TouchableOpacity>
          )}

          {isReadonly && (
            <TouchableOpacity 
              style={styles.backButton} 
              onPress={() => {
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

        {/* Compatibility Score - Only for other profiles */}
        {compatibility && (
          <View style={[styles.section, { backgroundColor: colors.surface }]}>
            <View style={styles.compatibilityHeader}>
              <View style={styles.scoreContainer}>
                <Text style={[styles.scoreText, { color: colors.primary }]}>{compatibility.score}%</Text>
                <Text style={[styles.scoreLabel, { color: colors.textSecondary }]}>Match</Text>
              </View>
              <View style={styles.compatibilityInfo}>
                <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 4 }]}>Compatibility</Text>
                <Text style={[styles.compatibilitySubtitle, { color: colors.textSecondary }]}>
                  Based on your preferences and values
                </Text>
              </View>
            </View>
            
            {compatibility.matches.length > 0 && (
              <View style={styles.matchList}>
                {compatibility.matches.map((match, index) => (
                  <View key={index} style={styles.matchItem}>
                    <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
                    <Text style={[styles.matchText, { color: colors.text }]}>{match}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}


        {/* About Me / Bio */}
        {displayProfile?.bio && (
          <View style={[styles.section, { backgroundColor: colors.surface }]}>
            <View style={styles.sectionHeader}>
              <Ionicons name="document-text" size={22} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>About Me</Text>
            </View>
            <Text style={[styles.bioText, { color: colors.textSecondary }]}>{displayProfile.bio}</Text>
          </View>
        )}

        {/* Religious & Cultural Information */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="moon" size={22} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Faith & Values</Text>
          </View>
          
          <View style={styles.infoGrid}>
            {displayProfile?.religious_practice && (
              <InfoItem
                icon="star"
                label="Religious Practice"
                value={formatFieldValue(displayProfile.religious_practice)}
                colors={colors}
              />
            )}
            {displayProfile?.prayer_frequency && (
              <InfoItem
                icon="time"
                label="Prayer Frequency"
                value={formatFieldValue(displayProfile.prayer_frequency)}
                colors={colors}
              />
            )}
            {displayProfile?.hijab_preference && (
              <InfoItem
                icon="person"
                label="Hijab"
                value={formatFieldValue(displayProfile.hijab_preference)}
                colors={colors}
              />
            )}
            {displayProfile?.dietary_preference && (
              <InfoItem
                icon="restaurant"
                label="Dietary"
                value={formatFieldValue(displayProfile.dietary_preference)}
                colors={colors}
              />
            )}
            {displayProfile?.marriage_timeline && (
              <InfoItem
                icon="calendar"
                label="Marriage Timeline"
                value={formatFieldValue(displayProfile.marriage_timeline)}
                colors={colors}
              />
            )}
            {displayProfile?.family_involvement && (
              <InfoItem
                icon="people"
                label="Family Involvement"
                value={formatFieldValue(displayProfile.family_involvement)}
                colors={colors}
              />
            )}
          </View>

          {/* Core Values */}
          {displayProfile?.preferences?.values && displayProfile.preferences.values.length > 0 && (
            <View style={styles.valuesContainer}>
              <Text style={[styles.subsectionTitle, { color: colors.text }]}>Core Values</Text>
              <View style={styles.chipsContainer}>
                {displayProfile.preferences.values.map((value, index) => (
                  <View key={index} style={[styles.chip, { backgroundColor: `${colors.primary}15`, borderColor: `${colors.primary}30` }]}>
                    <Ionicons name="heart" size={14} color={colors.primary} />
                    <Text style={[styles.chipText, { color: colors.text }]}>{value}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* Background & Lifestyle */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="briefcase" size={22} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Background & Lifestyle</Text>
          </View>
          
          <View style={styles.infoGrid}>
            {displayProfile?.education_level && (
              <InfoItem
                icon="school"
                label="Education"
                value={formatFieldValue(displayProfile.education_level)}
                colors={colors}
              />
            )}
            {displayProfile?.occupation && (
              <InfoItem
                icon="briefcase"
                label="Occupation"
                value={displayProfile.occupation}
                colors={colors}
              />
            )}
            {displayProfile?.living_situation && (
              <InfoItem
                icon="home"
                label="Living Situation"
                value={formatFieldValue(displayProfile.living_situation)}
                colors={colors}
              />
            )}
            {displayProfile?.ethnicity && (
              <InfoItem
                icon="globe"
                label="Ethnicity"
                value={displayProfile.ethnicity}
                colors={colors}
              />
            )}
            {displayProfile?.tribe_clan && (
              <InfoItem
                icon="people-circle"
                label="Tribe/Clan"
                value={displayProfile.tribe_clan}
                colors={colors}
              />
            )}
            {displayProfile?.has_children !== null && displayProfile?.has_children !== undefined && (
              <InfoItem
                icon="heart-circle"
                label="Has Children"
                value={displayProfile.has_children ? 'Yes' : 'No'}
                colors={colors}
              />
            )}
            {displayProfile?.wants_children !== null && displayProfile?.wants_children !== undefined && (
              <InfoItem
                icon="heart"
                label="Wants Children"
                value={displayProfile.wants_children ? 'Yes' : 'No'}
                colors={colors}
              />
            )}
          </View>

          {/* Languages */}
          {displayProfile?.languages && displayProfile.languages.length > 0 && (
            <View style={styles.valuesContainer}>
              <Text style={[styles.subsectionTitle, { color: colors.text }]}>Languages</Text>
              <View style={styles.chipsContainer}>
                {displayProfile.languages.map((lang, index) => (
                  <View key={index} style={[styles.chip, { backgroundColor: `${colors.primary}15`, borderColor: `${colors.primary}30` }]}>
                    <Ionicons name="language" size={14} color={colors.primary} />
                    <Text style={[styles.chipText, { color: colors.text }]}>{lang}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* Interests */}
        {displayProfile?.interests && displayProfile.interests.length > 0 && (
          <View style={[styles.section, { backgroundColor: colors.surface }]}>
            <View style={styles.sectionHeader}>
              <Ionicons name="heart-circle" size={22} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Interests & Hobbies</Text>
            </View>
            <View style={styles.chipsContainer}>
              {displayProfile.interests.map((interest, index) => (
                <View key={index} style={[styles.chip, { backgroundColor: `${colors.primary}15`, borderColor: `${colors.primary}30` }]}>
                  <Text style={[styles.chipText, { color: colors.text }]}>{interest}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Partner Preferences - Hidden from profile view */}
        {/* Quick Actions - Hidden from profile view */}

        {/* Sign Out Button */}
        {!isReadonly && (
          <TouchableOpacity 
            style={[styles.signOutButton, { backgroundColor: colors.surface }]}
            onPress={async () => {
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
            <Text style={[styles.signOutText, { color: colors.error }]}>Sign Out</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

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

// Info Item Component
function InfoItem({ icon, label, value, colors }: { icon: string; label: string; value: string; colors: any }) {
  return (
    <View style={styles.infoItem}>
      <View style={[styles.infoIconContainer, { backgroundColor: `${colors.primary}15` }]}>
        <Ionicons name={icon as any} size={18} color={colors.primary} />
      </View>
      <View style={styles.infoContent}>
        <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>{label}</Text>
        <Text style={[styles.infoValue, { color: colors.text }]}>{value}</Text>
      </View>
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
  
  // Hero Section
  heroSection: {
    height: 320,
    position: 'relative',
    backgroundColor: staticColors.border,
  },
  heroImage: {
    width: '100%',
    height: '100%',
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
    textShadowColor: 'rgba(0,0,0,0.6)',
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
    backgroundColor: 'rgba(0,0,0,0.5)',
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
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Compatibility Section
  compatibilityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 16,
  },
  scoreContainer: {
    alignItems: 'center',
  },
  scoreText: {
    fontSize: 36,
    fontWeight: '800',
    color: staticColors.primary,
  },
  scoreLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: staticColors.textSecondary,
    marginTop: 2,
  },
  compatibilityInfo: {
    flex: 1,
  },
  compatibilitySubtitle: {
    fontSize: 13,
    color: staticColors.textSecondary,
  },
  matchList: {
    gap: 8,
  },
  matchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  matchText: {
    flex: 1,
    fontSize: 14,
    color: staticColors.text,
  },

  // Stats Row
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: staticColors.surface,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statIconBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: staticColors.text,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: staticColors.textSecondary,
  },

  // Section Styles
  section: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: staticColors.surface,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: staticColors.text,
  },
  subsectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: staticColors.text,
    marginBottom: 12,
    marginTop: 16,
  },
  bioText: {
    fontSize: 15,
    lineHeight: 22,
    color: staticColors.textSecondary,
  },

  // Info Grid
  infoGrid: {
    gap: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${staticColors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: staticColors.textSecondary,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '600',
    color: staticColors.text,
  },

  // Chips Container
  valuesContainer: {
    marginTop: 16,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${staticColors.primary}15`,
    borderWidth: 1,
    borderColor: `${staticColors.primary}30`,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
    gap: 6,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
    color: staticColors.text,
  },

  // Preferences Grid
  preferencesGrid: {
    gap: 12,
  },
  prefCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${staticColors.primary}08`,
    borderRadius: 12,
    padding: 14,
    gap: 12,
  },
  prefLabel: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: staticColors.textSecondary,
  },
  prefValue: {
    fontSize: 15,
    fontWeight: '700',
    color: staticColors.text,
  },

  // Action Cards
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: staticColors.border,
    gap: 14,
  },
  actionIconBg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: staticColors.text,
    marginBottom: 2,
  },
  actionSubtitle: {
    fontSize: 13,
    color: staticColors.textSecondary,
  },

  // Sign Out Button
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: staticColors.surface,
    borderRadius: 16,
    padding: 16,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '700',
    color: staticColors.error,
  },
});

export default function ProtectedProfileScreen() {
  return (
    <ProtectedRoute>
      <ProfileScreen />
    </ProtectedRoute>
  );
}
