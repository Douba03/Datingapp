import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useMatches } from '../../hooks/useMatches';
import { SwipeCard } from '../../components/swipe/SwipeCard';
import { SwipeCounter } from '../../components/swipe/SwipeCounter';
import { NoSwipesModal } from '../../components/swipe/NoSwipesModal';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { ProtectedRoute } from '../../components/auth/ProtectedRoute';
import { SimpleWarningAlert } from '../../components/warnings/SimpleWarningAlert';
import { MatchModal } from '../../components/matches/MatchModal';
import { UpgradePrompt } from '../../components/premium/UpgradePrompt';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { colors as staticColors } from '../../components/theme/colors';

const { width: screenWidth } = Dimensions.get('window');

function DiscoverScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, profile } = useAuth();
  const { colors } = useTheme();
  const { profiles, swipeCounter, loading, swipe, canSwipe, getNextRefillTime, undoLastSwipe, refetch } = useMatches();
  const [matchModalVisible, setMatchModalVisible] = useState(false);
  const [matchedUser, setMatchedUser] = useState<{ name: string; photo?: string } | null>(null);
  const [isSuperLikeMatch, setIsSuperLikeMatch] = useState(false);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [showNoSwipesModal, setShowNoSwipesModal] = useState(false);
  const [lastSwipeDirection, setLastSwipeDirection] = useState<'left' | 'right' | 'top' | 'bottom' | undefined>(undefined);

  // Preload images for upcoming profiles to reduce loading delay
  useEffect(() => {
    if (profiles.length > 0) {
      // Preload next 5 profiles' first 2 photos each
      const imagesToPreload = profiles
        .slice(0, 5)
        .flatMap(p => p.photos?.slice(0, 2) || [])
        .filter(Boolean);
      
      // Use expo-image's prefetch with memory-disk caching
      imagesToPreload.forEach(uri => {
        Image.prefetch(uri, 'memory-disk').catch(() => {
          // Silently fail - prefetch is best effort
        });
      });
    }
  }, [profiles]);

  const handleSwipe = async (action: 'like' | 'pass' | 'superlike') => {
    console.log(`[Discover] Button pressed: ${action}`);
    console.log(`[Discover] Current profiles count: ${profiles.length}`);
    console.log(`[Discover] Can swipe: ${canSwipe()}`);
    
    if (!canSwipe()) {
      console.log('[Discover] No swipes left - showing modal');
      setShowNoSwipesModal(true);
      return;
    }

    const profile = profiles[0];
    if (!profile) {
      console.log('[Discover] No profile to swipe on');
      Alert.alert('No Profile', 'No profile available to swipe on');
      return;
    }

    console.log(`[Discover] Swiping ${action} on ${profile.first_name} (${profile.user_id})`);
    
    // Set the direction for next card entry animation (opposite of swipe direction)
    if (action === 'like') {
      setLastSwipeDirection('left'); // Card went right, next comes from left
    } else if (action === 'pass') {
      setLastSwipeDirection('right'); // Card went left, next comes from right
    } else if (action === 'superlike') {
      setLastSwipeDirection('bottom'); // Card went up, next comes from bottom
    }

    try {
      console.log(`[Discover] Calling swipe function...`);
      const { data, error } = await swipe(profile.user_id, action);
      
      if (error) {
        console.error('[Discover] Swipe error:', error);
        const swipeError = error as { code?: string; message?: string; details?: string; hint?: string };
        console.error('[Discover] Error details:', {
          code: swipeError.code,
          message: swipeError.message,
          details: swipeError.details,
          hint: swipeError.hint
        });
        Alert.alert('Error', error instanceof Error ? error.message : 'Failed to swipe');
        return;
      }

      console.log('[Discover] Swipe result:', data);

      // Check if it's a match
      if (data?.is_match) {
        console.log(`[Discover] MATCH with ${profile.first_name}!`);
        setMatchedUser({ 
          name: profile.first_name, 
          photo: profile.photos?.[0] 
        });
        setIsSuperLikeMatch(action === 'superlike');
        setMatchModalVisible(true);
      }
    } catch (error) {
      console.error('[Discover] Unexpected error:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    }
  };

  const handleProfilePress = () => {
    // Navigate to profile detail screen with the current profile
    const currentProfile = profiles[0];
    if (currentProfile && currentProfile.user_id) {
      router.push(`/(tabs)/profile?viewUserId=${currentProfile.user_id}&readonly=true`);
    }
  };

  const handleMatchContinue = () => {
    setMatchModalVisible(false);
    setMatchedUser(null);
    setIsSuperLikeMatch(false);
  };

  const handleSendMessage = () => {
    setMatchModalVisible(false);
    setMatchedUser(null);
    setIsSuperLikeMatch(false);
    router.push('/(tabs)/matches');
  };

  const handleUndo = async () => {
    if (!user?.is_premium) {
      setShowUpgradePrompt(true);
      return;
    }

    try {
      const { data, error } = await undoLastSwipe();
      if (error) {
        console.log('[Discover] No swipe to undo');
        return;
      }
      
      // Set direction for card to come back from where it went (reverse of swipe)
      if (data?.action === 'like') {
        setLastSwipeDirection('right'); // Was swiped right, comes back from right
      } else if (data?.action === 'pass') {
        setLastSwipeDirection('left'); // Was swiped left, comes back from left
      } else if (data?.action === 'superlike') {
        setLastSwipeDirection('top'); // Was swiped up, comes back from top
      }
      // No dialog - the smooth card animation is enough feedback
    } catch (error) {
      console.error('[Discover] Error undoing swipe:', error);
    }
  };

  if (loading) {
    return (
      <LinearGradient
        colors={[colors.backgroundGradientStart, colors.backgroundGradientEnd]}
        style={styles.container}
      >
        <LoadingSpinner text="Finding your match..." />
      </LinearGradient>
    );
  }

  if (profiles.length === 0) {
    const isOutOfSwipes = swipeCounter?.remaining === 0;
    
    return (
      <LinearGradient
        colors={[colors.backgroundGradientStart, colors.backgroundGradientEnd]}
        style={styles.container}
      >
        <View style={[styles.safeArea, { paddingTop: insets.top }]}>
          {/* Header - Settings style */}
          <View style={[styles.header, { backgroundColor: colors.surface }]}>
            <View style={styles.headerLeft}>
              <View style={styles.logoRow}>
                <LinearGradient
                  colors={[colors.primary, colors.primaryDark]}
                  style={styles.logoContainer}
                >
                  <Ionicons name="heart" size={18} color="#fff" />
                </LinearGradient>
                <View style={styles.titleContainer}>
                  <Text style={[styles.headerTitle, { color: colors.primary }]}>Mali Match</Text>
                  <View style={styles.subtitleRow}>
                    <Ionicons name="location" size={10} color={colors.textSecondary} />
                    <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>Discover nearby</Text>
                  </View>
                </View>
              </View>
            </View>
            
            {/* Right buttons - Premium & Profile */}
            <View style={styles.headerRight}>
              {/* Premium Button - only show if not premium */}
              {!user?.is_premium && (
                <TouchableOpacity 
                  onPress={() => router.push('/(onboarding)/payment')}
                  style={styles.premiumButton}
                >
                  <Ionicons name="diamond" size={20} color="#fff" />
                </TouchableOpacity>
              )}
              
              {/* Profile Button */}
              <TouchableOpacity 
                onPress={() => router.push('/(tabs)/profile')}
                style={[styles.profileButton, { borderColor: colors.primary, backgroundColor: colors.surface }]}
              >
                {profile?.photos?.[0] ? (
                  <Image 
                    source={{ uri: profile.photos[0] }} 
                    style={styles.profileImage}
                  />
                ) : (
                  <Ionicons name="person" size={20} color={colors.primary} />
                )}
              </TouchableOpacity>
            </View>
          </View>
          
          <SimpleWarningAlert />
          
          <View style={styles.emptyContainer}>
            <View style={[styles.emptyIconContainer, isOutOfSwipes && styles.emptyIconContainerWarning]}>
              <Ionicons 
                name={isOutOfSwipes ? "time-outline" : "heart-outline"} 
                size={64} 
                color={isOutOfSwipes ? colors.warning : colors.primary} 
              />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              {isOutOfSwipes ? "You're Out of Swipes!" : "No More Profiles"}
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              {isOutOfSwipes 
                ? "Wait for your swipes to refill or\nget Premium for unlimited swipes!"
                : "We're finding more people for you.\nCheck back soon!"
              }
            </Text>
            
            {isOutOfSwipes && !user?.is_premium && (
              <TouchableOpacity
                style={styles.emptyPremiumButton}
                onPress={() => router.push('/(onboarding)/payment')}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={[colors.accent, '#FFA000']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.emptyPremiumGradient}
                >
                  <Ionicons name="diamond" size={18} color="#fff" />
                  <Text style={styles.emptyPremiumText}>Get Premium</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
            
            {/* Refresh button when no profiles */}
            {!isOutOfSwipes && (
              <TouchableOpacity
                style={[styles.refreshButton, { borderColor: colors.primary }]}
                onPress={() => refetch()}
                activeOpacity={0.8}
              >
                <Ionicons name="refresh" size={18} color={colors.primary} />
                <Text style={[styles.refreshButtonText, { color: colors.primary }]}>Check for New People</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={[colors.backgroundGradientStart, colors.backgroundGradientEnd]}
      style={styles.container}
    >
      <View style={[styles.safeArea, { paddingTop: insets.top }]}>
        {/* Header - Settings style */}
        <View style={[styles.header, { backgroundColor: colors.surface }]}>
          <View style={styles.headerLeft}>
            <View style={styles.logoRow}>
              <LinearGradient
                colors={[colors.primary, colors.primaryDark]}
                style={styles.logoContainer}
              >
                <Ionicons name="heart" size={18} color="#fff" />
              </LinearGradient>
              <View style={styles.titleContainer}>
                <Text style={[styles.headerTitle, { color: colors.primary }]}>Mali Match</Text>
                <View style={styles.subtitleRow}>
                  <Ionicons name="location" size={10} color={colors.textSecondary} />
                  <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>Discover nearby</Text>
                </View>
              </View>
            </View>
          </View>
          
          {/* Right buttons - Premium & Profile */}
          <View style={styles.headerRight}>
            {/* Premium Button - only show if not premium */}
            {!user?.is_premium && (
              <TouchableOpacity 
                onPress={() => router.push('/(onboarding)/payment')}
                style={styles.premiumButton}
              >
                <Ionicons name="diamond" size={20} color="#fff" />
              </TouchableOpacity>
            )}
            
            {/* Profile Button */}
            <TouchableOpacity 
              onPress={() => router.push('/(tabs)/profile')}
              style={[styles.profileButton, { borderColor: colors.primary, backgroundColor: colors.surface }]}
            >
              {profile?.photos?.[0] ? (
                <Image 
                  source={{ uri: profile.photos[0] }} 
                  style={styles.profileImage}
                />
              ) : (
                <Ionicons name="person" size={20} color={colors.primary} />
              )}
            </TouchableOpacity>
          </View>
        </View>
        
        <SimpleWarningAlert />
        
        {/* Match Modal */}
        <MatchModal
          visible={matchModalVisible}
          matchedUserName={matchedUser?.name || ''}
          matchedUserPhoto={matchedUser?.photo}
          onContinue={handleMatchContinue}
          onSendMessage={handleSendMessage}
          isSuperLike={isSuperLikeMatch}
        />
        
        {/* Card Container with Counter Overlay */}
        <View style={styles.cardContainer}>
          {/* Swipe Counter - positioned on top right of card */}
          <View style={styles.counterOverlay}>
            <SwipeCounter counter={swipeCounter} />
          </View>
          
          <SwipeCard
            key={profiles[0].user_id}
            profile={profiles[0]}
            onSwipe={handleSwipe}
            onPress={handleProfilePress}
            enterFrom={lastSwipeDirection}
          />
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <View style={styles.buttonRow}>
            {/* Undo Button - Premium only */}
            <TouchableOpacity 
              style={[styles.actionButton, styles.undoActionButton]}
              onPress={handleUndo}
              activeOpacity={0.85}
            >
              <View style={[styles.undoButtonCircle, !user?.is_premium && styles.lockedButton]}>
                <Ionicons name="arrow-undo" size={22} color={user?.is_premium ? "#9C27B0" : "#999"} />
                {!user?.is_premium && (
                  <View style={styles.lockBadge}>
                    <Ionicons name="lock-closed" size={10} color="#fff" />
                  </View>
                )}
              </View>
            </TouchableOpacity>
          
            {/* Pass Button (Red) */}
            <TouchableOpacity 
              style={[styles.actionButton, styles.passButton]}
              onPress={() => handleSwipe('pass')}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={[colors.pass, colors.passShadow]}
                style={styles.gradientButton}
              >
                <Ionicons name="close" size={32} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
            
            {/* Superlike Button (Blue) */}
            <TouchableOpacity 
              style={[styles.actionButton, styles.superlikeButton]}
              onPress={() => handleSwipe('superlike')}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={[colors.superlike, colors.superlikeShadow]}
                style={styles.gradientButton}
              >
                <Ionicons name="star" size={28} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
            
            {/* Like Button (Green) */}
            <TouchableOpacity 
              style={[styles.actionButton, styles.likeButton]}
              onPress={() => handleSwipe('like')}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={[colors.like, colors.likeShadow]}
                style={styles.gradientButton}
              >
                <Ionicons name="heart" size={32} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* Upgrade Prompt Modal */}
        <UpgradePrompt
          visible={showUpgradePrompt}
          onClose={() => setShowUpgradePrompt(false)}
          onUpgrade={() => {
            setShowUpgradePrompt(false);
            router.push('/(onboarding)/payment');
          }}
          trigger="undo"
        />

        {/* No Swipes Left Modal */}
        <NoSwipesModal
          visible={showNoSwipesModal}
          nextRefillTime={getNextRefillTime()}
          onClose={() => setShowNoSwipesModal(false)}
          onGetPremium={() => {
            setShowNoSwipesModal(false);
            router.push('/(onboarding)/payment');
          }}
        />
      </View>
    </LinearGradient>
  );
}

export default function DiscoverScreenWrapper() {
  return (
    <ProtectedRoute>
      <DiscoverScreen />
    </ProtectedRoute>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    marginHorizontal: 12,
    marginTop: 4,
    marginBottom: 8,
    borderRadius: 20,
    shadowColor: '#FF6B9D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  headerLeft: {
    flex: 1,
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
    shadowColor: '#FF6B9D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  titleContainer: {
    flexDirection: 'column',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },
  headerSubtitle: {
    fontSize: 11,
    fontWeight: '500',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  premiumButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFD700',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  profileButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 2.5,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  profileImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  counterRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  cardContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 4,
    marginTop: 0,
    position: 'relative',
  },
  counterOverlay: {
    position: 'absolute',
    top: 16,
    right: 24,
    zIndex: 10,
  },
  actionButtons: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  actionButton: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  undoActionButton: {
    shadowColor: '#9C27B0',
    shadowOpacity: 0.2,
  },
  undoButtonCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: staticColors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E1BEE7',
  },
  gradientButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  passButton: {
    shadowColor: staticColors.pass,
  },
  superlikeButton: {
    shadowColor: staticColors.superlike,
    transform: [{ scale: 0.85 }],
  },
  likeButton: {
    shadowColor: staticColors.like,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 107, 157, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyIconContainerWarning: {
    backgroundColor: 'rgba(255, 179, 0, 0.1)',
  },
  emptyTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: staticColors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: staticColors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  emptyPremiumButton: {
    marginTop: 24,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: staticColors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  emptyPremiumGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 32,
    gap: 8,
  },
  emptyPremiumText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 16,
    borderWidth: 2,
    marginTop: 16,
    gap: 8,
  },
  refreshButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  lockedButton: {
    backgroundColor: '#f0f0f0',
    borderColor: '#ddd',
  },
  lockBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#666',
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
});