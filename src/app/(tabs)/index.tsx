import React, { useState, useRef, memo, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Alert,
  TouchableOpacity,
  Animated,
  Platform,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useMatches } from '../../hooks/useMatches';
import { SwipeCard } from '../../components/swipe/SwipeCard';
import { NoSwipesLeftBanner } from '../../components/swipe/NoSwipesLeftBanner';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { ProtectedRoute } from '../../components/auth/ProtectedRoute';
import { SimpleWarningAlert } from '../../components/warnings/SimpleWarningAlert';
import { MatchModal } from '../../components/matches/MatchModal';
import { UpgradePrompt } from '../../components/premium/UpgradePrompt';
import { useAuth } from '../../hooks/useAuth';
import { Ionicons } from '@expo/vector-icons';
import { colors, shadows } from '../../components/theme/colors';

const { width: screenWidth } = Dimensions.get('window');
const isSmallDevice = screenWidth < 375;

// Button configs - defined once outside component
const BUTTON_CONFIGS = {
  pass: {
    gradient: [colors.pass, '#8A8590'] as [string, string],
    icon: 'close' as const,
    size: isSmallDevice ? 54 : 60,
    iconSize: isSmallDevice ? 26 : 30,
  },
  superlike: {
    gradient: [colors.superlike, colors.secondaryDark] as [string, string],
    icon: 'star' as const,
    size: isSmallDevice ? 48 : 52,
    iconSize: isSmallDevice ? 22 : 24,
  },
  like: {
    gradient: [colors.like, colors.primaryDark] as [string, string],
    icon: 'heart' as const,
    size: isSmallDevice ? 54 : 60,
    iconSize: isSmallDevice ? 26 : 30,
  },
};

// Action Button Component - memoized to prevent re-renders
interface ActionButtonProps {
  type: 'pass' | 'superlike' | 'like';
  onPress: () => void;
  disabled?: boolean;
}

const ActionButton = memo(function ActionButton({ type, onPress, disabled }: ActionButtonProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const config = BUTTON_CONFIGS[type];

  const handlePressIn = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 0.88,
      useNativeDriver: true,
    }).start();
  }, [scaleAnim]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      tension: 200,
      useNativeDriver: true,
    }).start();
  }, [scaleAnim]);

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      activeOpacity={1}
    >
      <Animated.View
        style={[
          {
            width: config.size,
            height: config.size,
            borderRadius: config.size / 2,
            transform: [{ scale: scaleAnim }],
            ...shadows.medium,
          },
        ]}
      >
        <LinearGradient
          colors={config.gradient}
          style={[
            styles.actionButton,
            {
              width: config.size,
              height: config.size,
              borderRadius: config.size / 2,
            },
          ]}
        >
          <Ionicons name={config.icon} size={config.iconSize} color="#fff" />
        </LinearGradient>
      </Animated.View>
    </TouchableOpacity>
  );
});

function DiscoverScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { profiles, swipeCounter, loading, swipe, canSwipe, getNextRefillTime, undoLastSwipe, refreshSwipeCounter } = useMatches();
  const [matchModalVisible, setMatchModalVisible] = useState(false);
  const [matchedUser, setMatchedUser] = useState<{ name: string; photo?: string } | null>(null);
  const [isSuperLikeMatch, setIsSuperLikeMatch] = useState(false);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);

  // Memoize current profile to prevent unnecessary re-renders
  const currentProfile = useMemo(() => profiles[0], [profiles]);

  const handleSwipe = useCallback(async (action: 'like' | 'pass' | 'superlike') => {
    if (!canSwipe()) {
      const nextRefill = getNextRefillTime();
      if (nextRefill) {
        Alert.alert(
          '💕 No Swipes Left',
          `Your swipes will refill at ${nextRefill.toLocaleTimeString()}`,
          [{ text: 'OK' }]
        );
      }
      return;
    }

    if (!currentProfile) return;

    try {
      const { data, error } = await swipe(currentProfile.user_id, action);
      
      if (error) {
        Alert.alert('Error', (error as any).message || 'Failed to swipe');
        return;
      }

      if (data?.is_match) {
        setMatchedUser({ name: currentProfile.first_name, photo: currentProfile.photos?.[0] });
        setIsSuperLikeMatch(action === 'superlike');
        setMatchModalVisible(true);
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
    }
  }, [canSwipe, getNextRefillTime, swipe, currentProfile]);

  const handleProfilePress = useCallback(() => {
    Alert.alert('Profile', 'Profile detail screen would open here');
  }, []);

  const handleMatchContinue = useCallback(() => {
    setMatchModalVisible(false);
    setMatchedUser(null);
    setIsSuperLikeMatch(false);
  }, []);

  const handleSendMessage = useCallback(() => {
    setMatchModalVisible(false);
    setMatchedUser(null);
    setIsSuperLikeMatch(false);
    router.push('/(tabs)/matches');
  }, [router]);

  const handleUndo = useCallback(async () => {
    if (!user?.is_premium) {
      setShowUpgradePrompt(true);
      return;
    }

    try {
      const { error } = await undoLastSwipe();
      if (error) {
        Alert.alert('No Swipe to Undo', 'You haven\'t swiped anyone yet');
      } else {
        Alert.alert('✨ Success', 'Last swipe undone!');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to undo swipe');
    }
  }, [user?.is_premium, undoLastSwipe]);

  const handleUpgrade = useCallback(() => {
    setShowUpgradePrompt(true);
  }, []);

  // Memoize handlers for action buttons
  const handlePassPress = useCallback(() => handleSwipe('pass'), [handleSwipe]);
  const handleSuperlikePress = useCallback(() => handleSwipe('superlike'), [handleSwipe]);
  const handleLikePress = useCallback(() => handleSwipe('like'), [handleSwipe]);

  const isOutOfSwipes = swipeCounter && swipeCounter.remaining === 0;

  if (loading) {
    return <LoadingSpinner text="Finding matches..." emoji="💕" />;
  }

  // Show NoSwipesLeftBanner when out of swipes
  if (isOutOfSwipes) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={['#FDF8F8', '#FFF0F5', '#FAF0FF']} style={styles.backgroundGradient} />
        <SimpleWarningAlert />
        <NoSwipesLeftBanner 
          nextRefillTime={getNextRefillTime()} 
          onUpgradePress={handleUpgrade}
          onTimerComplete={refreshSwipeCounter}
        />
        <UpgradePrompt
          visible={showUpgradePrompt}
          onClose={() => setShowUpgradePrompt(false)}
          onUpgrade={() => {
            setShowUpgradePrompt(false);
            Alert.alert('Coming Soon', 'Premium payment will be available soon!');
          }}
          trigger="swipes"
        />
      </SafeAreaView>
    );
  }

  // No more profiles - come back later message
  if (profiles.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={['#FDF8F8', '#FFF0F5', '#FAF0FF']} style={styles.backgroundGradient} />
        <SimpleWarningAlert />
        <View style={styles.emptyContainer}>
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconContainer}>
              <Text style={styles.emptyEmoji}>🌟</Text>
            </View>
            <Text style={styles.emptyTitle}>You've Seen Everyone!</Text>
            <Text style={styles.emptySubtitle}>
              Great job! You've gone through all available profiles in your area.
            </Text>
            
            <View style={styles.tipsList}>
              <View style={styles.tipItem}>
                <Text style={styles.tipIcon}>⏰</Text>
                <Text style={styles.tipText}>Come back later for new people</Text>
              </View>
              <View style={styles.tipItem}>
                <Text style={styles.tipIcon}>📍</Text>
                <Text style={styles.tipText}>Try expanding your distance settings</Text>
              </View>
              <View style={styles.tipItem}>
                <Text style={styles.tipIcon}>💬</Text>
                <Text style={styles.tipText}>Check your matches and start chatting</Text>
              </View>
            </View>

            <TouchableOpacity 
              style={styles.checkMatchesButton}
              onPress={() => router.push('/(tabs)/matches')}
              activeOpacity={0.85}
            >
              <LinearGradient colors={[colors.primary, colors.primaryDark]} style={styles.buttonGradient}>
                <Text style={styles.checkMatchesText}>💕 View My Matches</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#FDF8F8', '#FEFEFE', '#FAF8FF']} style={styles.backgroundGradient} />
      
      <SimpleWarningAlert />
      
      <MatchModal
        visible={matchModalVisible}
        matchedUserName={matchedUser?.name || ''}
        matchedUserPhoto={matchedUser?.photo}
        onContinue={handleMatchContinue}
        onSendMessage={handleSendMessage}
        isSuperLike={isSuperLikeMatch}
      />

      {/* Swipe counter badge - top right */}
      {swipeCounter && (
        <View style={styles.swipeCounterBadge}>
          <Text style={styles.swipeCounterText}>{swipeCounter.remaining}</Text>
          <Ionicons name="heart" size={12} color={colors.primary} />
        </View>
      )}

      {/* Card Container - full screen */}
      <View style={styles.cardContainer}>
        {currentProfile && (
          <SwipeCard
            profile={currentProfile}
            onSwipe={handleSwipe}
            onPress={handleProfilePress}
          />
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        {user?.is_premium && (
          <TouchableOpacity style={styles.undoButton} onPress={handleUndo}>
            <Ionicons name="refresh" size={18} color={colors.accent} />
          </TouchableOpacity>
        )}
        
        <View style={styles.buttonRow}>
          <ActionButton type="pass" onPress={handlePassPress} />
          <ActionButton type="superlike" onPress={handleSuperlikePress} />
          <ActionButton type="like" onPress={handleLikePress} />
        </View>
      </View>

      <UpgradePrompt
        visible={showUpgradePrompt}
        onClose={() => setShowUpgradePrompt(false)}
        onUpgrade={() => {
          setShowUpgradePrompt(false);
          Alert.alert('Coming Soon', 'Premium payment will be available soon!');
        }}
        trigger="undo"
      />
    </SafeAreaView>
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
    backgroundColor: colors.background,
  },
  backgroundGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  swipeCounterBadge: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 40 : 50,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
    zIndex: 100,
    ...shadows.small,
  },
  swipeCounterText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  cardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: Platform.OS === 'android' ? 20 : 10,
  },
  actionButtons: {
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === 'ios' ? 20 : 16,
    alignItems: 'center',
  },
  undoButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.small,
    position: 'absolute',
    top: -45,
    right: 20,
    zIndex: 10,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: isSmallDevice ? 20 : 28,
  },
  actionButton: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    width: '100%',
    maxWidth: 360,
    ...shadows.large,
  },
  emptyIconContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: `${colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyEmoji: {
    fontSize: 45,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 10,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  tipsList: {
    width: '100%',
    gap: 12,
    marginBottom: 24,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceElevated,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 12,
  },
  tipIcon: {
    fontSize: 18,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
  },
  checkMatchesButton: {
    width: '100%',
    borderRadius: 14,
    overflow: 'hidden',
    ...shadows.glow,
  },
  buttonGradient: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  checkMatchesText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
