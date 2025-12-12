import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
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
  const { user } = useAuth();
  const { colors } = useTheme();
  const { profiles, swipeCounter, loading, swipe, canSwipe, getNextRefillTime, undoLastSwipe } = useMatches();
  const [matchModalVisible, setMatchModalVisible] = useState(false);
  const [matchedUser, setMatchedUser] = useState<{ name: string; photo?: string } | null>(null);
  const [isSuperLikeMatch, setIsSuperLikeMatch] = useState(false);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [showNoSwipesModal, setShowNoSwipesModal] = useState(false);

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
    console.log(`[Discover] Profile data:`, profile);

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
      const { error } = await undoLastSwipe();
      if (error) {
        Alert.alert('No Swipe to Undo', 'You haven\'t swiped anyone yet');
      } else {
        Alert.alert('Success', 'Last swipe undone!');
      }
    } catch (error) {
      console.error('[Discover] Error undoing swipe:', error);
      Alert.alert('Error', 'Failed to undo swipe');
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
        style={[styles.container, { paddingTop: insets.top }]}
      >
        <SimpleWarningAlert />
        
        {/* Swipe Counter */}
        <View style={styles.counterRow}>
          <SwipeCounter counter={swipeCounter} />
        </View>
        
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
          
          {isOutOfSwipes && (
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
        
        {/* Swipe Counter Row */}
        <View style={styles.counterRow}>
          <SwipeCounter counter={swipeCounter} />
        </View>

        {/* Card Container */}
        <View style={styles.cardContainer}>
          <SwipeCard
            profile={profiles[0]}
            onSwipe={handleSwipe}
            onPress={handleProfilePress}
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtons: {
    paddingHorizontal: 16,
    paddingBottom: 16,
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