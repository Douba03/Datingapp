import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { UpgradePrompt } from '../../../components/premium/UpgradePrompt';
import { PremiumBadge } from '../../../components/premium/PremiumBadge';
import { colors } from '../../../components/theme/colors';
import { supabase } from '../../../services/supabase/client';
import { useAuth } from '../../../hooks/useAuth';
import { Profile } from '../../../types/user';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

export default function LikesYouScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [likedUsers, setLikedUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);

  // Fetch likes for ALL users (premium and non-premium)
  useEffect(() => {
    if (user) {
      fetchLikedUsers();
    }
  }, [user]);

  const fetchLikedUsers = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Get all users who liked current user
      const { data: swipesData, error: swipesError } = await supabase
        .from('swipes')
        .select('swiper_user_id, created_at, action')
        .eq('target_user_id', user.id)
        .in('action', ['like', 'superlike'])
        .order('created_at', { ascending: false });

      if (swipesError) {
        console.error('[LikesYou] Error fetching swipes:', swipesError);
        Alert.alert('Error', 'Failed to load likes');
        setLoading(false);
        return;
      }

      if (!swipesData || swipesData.length === 0) {
        console.log('[LikesYou] No one has liked you yet');
        setLikedUsers([]);
        setLoading(false);
        return;
      }

      // Get unique user IDs
      const userIds = [...new Set(swipesData.map(s => s.swiper_user_id))];

      // Fetch profiles for these users
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .in('user_id', userIds);

      if (profilesError) {
        console.error('[LikesYou] Error fetching profiles:', profilesError);
        Alert.alert('Error', 'Failed to load profiles');
        setLoading(false);
        return;
      }

      // Combine swipe data with profile data
      const combined = profilesData.map(profile => {
        const swipeData = swipesData.find(s => s.swiper_user_id === profile.user_id);
        return {
          ...profile,
          liked_at: swipeData?.created_at,
          is_superlike: swipeData?.action === 'superlike',
        };
      });

      setLikedUsers(combined);
    } catch (error) {
      console.error('[LikesYou] Unexpected error:', error);
      Alert.alert('Error', 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleUserPress = (userId: string) => {
    // Navigate to their profile or swipe on them
    Alert.alert(
      'Open Profile',
      'Would you like to see their full profile and swipe?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'View Profile',
          onPress: () => router.push(`/profile/${userId}`),
        },
      ]
    );
  };

  if (loading) {
    return (
      <LinearGradient
        colors={[colors.backgroundGradientStart, colors.backgroundGradientEnd]}
        style={styles.container}
      >
        <LoadingSpinner text="Loading your admirers..." />
      </LinearGradient>
    );
  }

  // Show blurred preview for non-premium users
  if (!user?.is_premium) {
    return (
      <LinearGradient
        colors={[colors.backgroundGradientStart, colors.backgroundGradientEnd]}
        style={[styles.container, { paddingTop: insets.top }]}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={22} color={colors.text} />
            </TouchableOpacity>
            <View style={styles.logoRow}>
              <LinearGradient
                colors={[colors.accent, '#FFA000']}
                style={styles.logoContainer}
              >
                <Ionicons name="diamond" size={18} color="#fff" />
              </LinearGradient>
              <View style={styles.titleContainer}>
                <Text style={styles.title}>Premium</Text>
                <Text style={styles.subtitle}>
                  {likedUsers.length > 0 ? `${likedUsers.length} people like you` : 'See who likes you'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {likedUsers.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="heart-dislike-outline" size={60} color={colors.textSecondary} style={{ marginBottom: 16 }} />
            <Text style={styles.emptyTitle}>No Likes Yet</Text>
            <Text style={styles.emptyDescription}>
              Keep swiping! People who like you will appear here.
            </Text>
          </View>
        ) : (
          <>
            {/* Teaser Banner */}
            <View style={styles.teaserBanner}>
              <View style={styles.teaserIconContainer}>
                <Ionicons name="heart" size={32} color="#fff" />
                <View style={styles.teaserBadge}>
                  <Text style={styles.teaserBadgeText}>{likedUsers.length}</Text>
                </View>
              </View>
              <View style={styles.teaserTextContainer}>
                <Text style={styles.teaserTitle}>
                  {likedUsers.length} {likedUsers.length === 1 ? 'person likes' : 'people like'} you!
                </Text>
                <Text style={styles.teaserSubtitle}>
                  Upgrade to Premium to see who they are
                </Text>
              </View>
            </View>

            {/* Blurred Grid Preview */}
            <ScrollView 
              style={styles.blurredScrollView}
              contentContainerStyle={styles.blurredGrid}
            >
              {likedUsers.slice(0, 6).map((likedUser, index) => (
                <TouchableOpacity 
                  key={likedUser.user_id || index}
                  style={styles.blurredCard}
                  onPress={() => setShowUpgradePrompt(true)}
                  activeOpacity={0.8}
                >
                  {likedUser.photos && likedUser.photos[0] ? (
                    <Image
                      source={{ uri: likedUser.photos[0] }}
                      style={styles.blurredImage}
                      blurRadius={25}
                    />
                  ) : (
                    <View style={[styles.blurredImage, styles.placeholderBlur]}>
                      <Ionicons name="person" size={40} color={colors.textSecondary} />
                    </View>
                  )}
                  
                  {/* Overlay gradient */}
                  <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.7)']}
                    style={styles.blurredOverlay}
                  >
                    <View style={styles.blurredInfo}>
                      <Text style={styles.blurredName}>???</Text>
                      {likedUser.is_superlike && (
                        <View style={styles.superlikeBadgeSmall}>
                          <Ionicons name="star" size={12} color="#FFD700" />
                        </View>
                      )}
                    </View>
                  </LinearGradient>
                  
                  {/* Lock Icon */}
                  <View style={styles.lockOverlay}>
                    <Ionicons name="lock-closed" size={24} color="#fff" />
                  </View>
                </TouchableOpacity>
              ))}
              
              {/* Show more card if there are more than 6 */}
              {likedUsers.length > 6 && (
                <TouchableOpacity 
                  style={[styles.blurredCard, styles.moreCard]}
                  onPress={() => setShowUpgradePrompt(true)}
                >
                  <Text style={styles.moreCount}>+{likedUsers.length - 6}</Text>
                  <Text style={styles.moreText}>more</Text>
                </TouchableOpacity>
              )}
            </ScrollView>

            {/* Upgrade CTA */}
            <View style={styles.upgradeCTA}>
              <TouchableOpacity
                style={styles.upgradeButton}
                onPress={() => setShowUpgradePrompt(true)}
              >
                <Ionicons name="star" size={20} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.upgradeButtonText}>Unlock Premium to See Them</Text>
              </TouchableOpacity>
              
              <Text style={styles.priceHint}>
                Only $1.99/month • Cancel anytime
              </Text>
            </View>
          </>
        )}

        <UpgradePrompt
          visible={showUpgradePrompt}
          onClose={() => setShowUpgradePrompt(false)}
          onUpgrade={() => {
            setShowUpgradePrompt(false);
            router.push('/(onboarding)/payment');
          }}
          trigger="likes"
        />
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={[colors.backgroundGradientStart, colors.backgroundGradientEnd]}
      style={[styles.container, { paddingTop: insets.top }]}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.logoRow}>
            <LinearGradient
              colors={[colors.accent, '#FFA000']}
              style={styles.logoContainer}
            >
              <Ionicons name="diamond" size={18} color="#fff" />
            </LinearGradient>
            <View style={styles.titleContainer}>
              <Text style={styles.title}>Premium</Text>
              <Text style={styles.subtitle}>
                {likedUsers.length > 0 ? `${likedUsers.length} people like you` : 'See who likes you'}
              </Text>
            </View>
          </View>
        </View>
        <PremiumBadge size="small" />
      </View>

      {/* Content */}
      {likedUsers.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="heart-dislike-outline" size={60} color={colors.textSecondary} style={{ marginBottom: 16 }} />
          <Text style={styles.emptyTitle}>No Likes Yet</Text>
          <Text style={styles.emptyDescription}>
            Keep swiping! People who like you will appear here.
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {likedUsers.map((user) => (
            <LikedUserCard
              key={user.user_id}
              user={user}
              onPress={() => handleUserPress(user.user_id)}
            />
          ))}
        </ScrollView>
      )}
    </LinearGradient>
  );
}

// Liked User Card Component
function LikedUserCard({ user, onPress }: { user: any; onPress: () => void }) {
  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const then = new Date(timestamp);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return then.toLocaleDateString();
  };

  return (
    <TouchableOpacity
      style={styles.userCard}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* User Photo */}
      <View style={styles.photoContainer}>
        {user.photos && user.photos.length > 0 ? (
          <Image
            source={{ uri: user.photos[0] }}
            style={styles.userPhoto}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.placeholderPhoto}>
            <Ionicons name="person" size={30} color={colors.textSecondary} />
          </View>
        )}
        {user.is_superlike && (
          <View style={styles.superlikeBadge}>
            <Ionicons name="star" size={16} color="#FFD700" />
          </View>
        )}
      </View>

      {/* User Info */}
      <View style={styles.userInfo}>
        <View style={styles.userHeader}>
          <Text style={styles.userName}>
            {user.first_name}
            {user.age && `, ${user.age}`}
          </Text>
          {user.is_superlike && (
            <View style={styles.superlikeLabel}>
              <Ionicons name="star" size={14} color="#FFD700" />
              <Text style={styles.superlikeText}>Super Liked!</Text>
            </View>
          )}
        </View>
        {user.city && (
          <View style={styles.locationContainer}>
            <Ionicons name="location" size={14} color={colors.textSecondary} />
            <Text style={styles.locationText}>{user.city}</Text>
          </View>
        )}
        {user.liked_at && (
          <Text style={styles.timeText}>{getTimeAgo(user.liked_at)}</Text>
        )}
      </View>

      {/* Arrow */}
      <Ionicons name="chevron-forward" size={24} color={colors.textSecondary} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    marginHorizontal: 12,
    marginTop: 4,
    marginBottom: 8,
    borderRadius: 20,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoContainer: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  titleContainer: {
    flexDirection: 'column',
  },
  backButton: {
    marginRight: 10,
    padding: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 1,
  },
  count: {
    color: colors.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  // Teaser Banner Styles
  teaserBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    margin: 16,
    padding: 20,
    borderRadius: 20,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  teaserIconContainer: {
    position: 'relative',
    marginRight: 16,
  },
  teaserBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FF4D67',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  teaserBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  teaserTextContainer: {
    flex: 1,
  },
  teaserTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  teaserSubtitle: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 14,
  },
  // Blurred Grid Styles
  blurredScrollView: {
    flex: 1,
  },
  blurredGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    paddingTop: 0,
    gap: 16,
  },
  blurredCard: {
    width: CARD_WIDTH,
    height: CARD_WIDTH * 1.3,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    position: 'relative',
  },
  blurredImage: {
    width: '100%',
    height: '100%',
  },
  placeholderBlur: {
    backgroundColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  blurredOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    justifyContent: 'flex-end',
    padding: 12,
  },
  blurredInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  blurredName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  superlikeBadgeSmall: {
    marginLeft: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8,
    padding: 4,
  },
  lockOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreCard: {
    backgroundColor: `${colors.primary}20`,
    borderWidth: 2,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreCount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.primary,
  },
  moreText: {
    fontSize: 16,
    color: colors.primary,
    marginTop: 4,
  },
  // Upgrade CTA Styles
  upgradeCTA: {
    padding: 16,
    paddingTop: 8,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  priceHint: {
    textAlign: 'center',
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 12,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  photoContainer: {
    position: 'relative',
    marginRight: 16,
  },
  userPhoto: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  placeholderPhoto: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderEmoji: {
    fontSize: 24,
  },
  superlikeBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  userInfo: {
    flex: 1,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  superlikeLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E1',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 4,
  },
  superlikeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#F57C00',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 4,
  },
  locationText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  timeText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  upgradeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  lockedIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  lockedTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },
  lockedDescription: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  benefitList: {
    width: '100%',
    marginBottom: 32,
    gap: 16,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    borderWidth: 1,
    borderColor: colors.border,
  },
  benefitText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 16,
  },
  upgradeButton: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 30,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  upgradeButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
