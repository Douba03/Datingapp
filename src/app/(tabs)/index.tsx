import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Alert,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useMatches } from '../../hooks/useMatches';
import { SwipeCard } from '../../components/swipe/SwipeCard';
import { SwipeCounter } from '../../components/swipe/SwipeCounter';
import { NoSwipesLeftBanner } from '../../components/swipe/NoSwipesLeftBanner';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { ProtectedRoute } from '../../components/auth/ProtectedRoute';
import { SimpleWarningAlert } from '../../components/warnings/SimpleWarningAlert';
import { MatchModal } from '../../components/matches/MatchModal';
import { UpgradePrompt } from '../../components/premium/UpgradePrompt';
import { useAuth } from '../../hooks/useAuth';
import { colors } from '../../components/theme/colors';

const { width } = Dimensions.get('window');

// Memoized Action Button Component
const ActionButton = React.memo(({ 
  onPress, 
  icon, 
  gradientColors, 
  size = 60,
  iconSize = 28,
}: {
  onPress: () => void;
  icon: string;
  gradientColors: string[];
  size?: number;
  iconSize?: number;
}) => {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.9,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      useNativeDriver: true,
    }).start();
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={0.9}
    >
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <LinearGradient
          colors={gradientColors as any}
          style={[
            styles.actionButton,
            { width: size, height: size, borderRadius: size / 2 }
          ]}
        >
          <Ionicons name={icon as any} size={iconSize} color="#fff" />
        </LinearGradient>
      </Animated.View>
    </TouchableOpacity>
  );
});

function DiscoverScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { 
    profiles, 
    swipeCounter, 
    loading, 
    swipe, 
    canSwipe, 
    getNextRefillTime, 
    undoLastSwipe,
    refreshSwipeCounter 
  } = useMatches();
  
  const [matchModalVisible, setMatchModalVisible] = useState(false);
  const [matchedUser, setMatchedUser] = useState<{ name: string; photo?: string } | null>(null);
  const [isSuperLikeMatch, setIsSuperLikeMatch] = useState(false);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);

  const currentProfile = useMemo(() => profiles[0], [profiles]);

  const handleSwipe = useCallback(async (action: 'like' | 'pass' | 'superlike') => {
    if (!canSwipe()) {
      const nextRefill = getNextRefillTime();
      if (nextRefill) {
        Alert.alert(
          'No Swipes Left',
          `Your swipes will refill at ${nextRefill.toLocaleTimeString()}`,
          [{ text: 'OK' }]
        );
      }
      return;
    }

    const profile = currentProfile;
    if (!profile) {
      return;
    }

    try {
      const { data, error } = await swipe(profile.user_id, action);
      
      if (error) {
        console.error('[Discover] Swipe error:', error);
        Alert.alert('Error', error instanceof Error ? error.message : 'Failed to swipe');
        return;
      }

      if (data?.is_match) {
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
  }, [canSwipe, getNextRefillTime, currentProfile, swipe]);

  const handleProfilePress = useCallback(() => {
    Alert.alert('Profile', 'Profile detail screen would open here');
  }, []);

  const handleMatchContinue = useCallback(() => {
    setMatchModalVisible(false);
  }, []);

  const handleMatchMessage = useCallback(() => {
    setMatchModalVisible(false);
    router.push('/(tabs)/matches');
  }, [router]);

  const handleTimerComplete = useCallback(() => {
    refreshSwipeCounter();
  }, [refreshSwipeCounter]);

  const handleUpgrade = useCallback(() => {
    setShowUpgradePrompt(true);
  }, []);

  const handleLike = useCallback(() => handleSwipe('like'), [handleSwipe]);
  const handlePass = useCallback(() => handleSwipe('pass'), [handleSwipe]);
  const handleSuperlike = useCallback(() => handleSwipe('superlike'), [handleSwipe]);

  // Loading state
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <LoadingSpinner />
          <Text style={styles.loadingText}>Finding matches... 💕</Text>
        </View>
      </SafeAreaView>
    );
  }

  // No swipes left
  const noSwipesLeft = swipeCounter && swipeCounter.remaining <= 0;
  if (noSwipesLeft) {
    return (
      <SafeAreaView style={styles.container}>
        <NoSwipesLeftBanner
          nextRefillTime={getNextRefillTime()}
          onUpgrade={handleUpgrade}
          onTimerComplete={handleTimerComplete}
        />
        <UpgradePrompt
          visible={showUpgradePrompt}
          onClose={() => setShowUpgradePrompt(false)}
          onUpgrade={() => {
            setShowUpgradePrompt(false);
            router.push('/(premium)/subscribe');
          }}
        />
      </SafeAreaView>
    );
  }

  // No profiles left
  if (profiles.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <LinearGradient
            colors={['#FDF2F8', '#FCE7F3']}
            style={styles.emptyCard}
          >
            <Text style={styles.emptyEmoji}>🎉</Text>
            <Text style={styles.emptyTitle}>You've Seen Everyone!</Text>
            <Text style={styles.emptySubtitle}>
              You've gone through all potential matches in your area. Check back later for new people!
            </Text>
            
            <View style={styles.tipsList}>
              <View style={styles.tipItem}>
                <Text style={styles.tipIcon}>💡</Text>
                <Text style={styles.tipText}>Expand your distance preferences</Text>
              </View>
              <View style={styles.tipItem}>
                <Text style={styles.tipIcon}>🔄</Text>
                <Text style={styles.tipText}>Check back tomorrow for new users</Text>
              </View>
              <View style={styles.tipItem}>
                <Text style={styles.tipIcon}>💬</Text>
                <Text style={styles.tipText}>Chat with your existing matches</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.viewMatchesButton}
              onPress={() => router.push('/(tabs)/matches')}
            >
              <LinearGradient
                colors={[colors.primary, colors.secondary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.viewMatchesGradient}
              >
                <Ionicons name="heart" size={20} color="#fff" />
                <Text style={styles.viewMatchesText}>View My Matches</Text>
              </LinearGradient>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <SimpleWarningAlert />
      
      {/* Swipe Counter Badge */}
      {swipeCounter && (
        <View style={styles.counterBadge}>
          <SwipeCounter 
            remaining={swipeCounter.remaining} 
            total={swipeCounter.daily_limit} 
          />
        </View>
      )}

      {/* Main Card */}
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
      <View style={styles.actionsContainer}>
        <ActionButton
          onPress={handlePass}
          icon="close"
          gradientColors={['#F87171', '#EF4444']}
          size={56}
          iconSize={26}
        />
        <ActionButton
          onPress={handleSuperlike}
          icon="star"
          gradientColors={['#60A5FA', '#3B82F6']}
          size={48}
          iconSize={22}
        />
        <ActionButton
          onPress={handleLike}
          icon="heart"
          gradientColors={[colors.primary, colors.secondary]}
          size={56}
          iconSize={26}
        />
      </View>

      {/* Match Modal */}
      <MatchModal
        visible={matchModalVisible}
        matchedUser={matchedUser}
        isSuperLike={isSuperLikeMatch}
        onContinue={handleMatchContinue}
        onMessage={handleMatchMessage}
      />

      {/* Upgrade Prompt */}
      <UpgradePrompt
        visible={showUpgradePrompt}
        onClose={() => setShowUpgradePrompt(false)}
        onUpgrade={() => {
          setShowUpgradePrompt(false);
          router.push('/(premium)/subscribe');
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
  },
  counterBadge: {
    position: 'absolute',
    top: 60,
    right: 16,
    zIndex: 10,
  },
  cardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 10,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
    paddingVertical: 20,
    paddingBottom: 30,
  },
  actionButton: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  emptyCard: {
    width: width - 32,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
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
    marginBottom: 24,
    gap: 12,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    gap: 12,
  },
  tipIcon: {
    fontSize: 20,
  },
  tipText: {
    fontSize: 14,
    color: colors.text,
    flex: 1,
  },
  viewMatchesButton: {
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  viewMatchesGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 32,
    gap: 8,
  },
  viewMatchesText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default function DiscoverScreenWrapper() {
  return (
    <ProtectedRoute>
      <DiscoverScreen />
    </ProtectedRoute>
  );
}
