import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useMatches } from '../../hooks/useMatches';
import { SwipeCard } from '../../components/swipe/SwipeCard';
import { SwipeCounter } from '../../components/swipe/SwipeCounter';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { ProtectedRoute } from '../../components/auth/ProtectedRoute';
import { SimpleWarningAlert } from '../../components/warnings/SimpleWarningAlert';
import { MatchModal } from '../../components/matches/MatchModal';
import { colors } from '../../components/theme/colors';

function DiscoverScreen() {
  const router = useRouter();
  const { profiles, swipeCounter, loading, swipe, canSwipe, getNextRefillTime } = useMatches();
  const [matchModalVisible, setMatchModalVisible] = useState(false);
  const [matchedUser, setMatchedUser] = useState<{ name: string; photo?: string } | null>(null);

  const handleSwipe = async (action: 'like' | 'pass' | 'superlike') => {
    console.log(`[Discover] Button pressed: ${action}`);
    console.log(`[Discover] Current profiles count: ${profiles.length}`);
    console.log(`[Discover] Can swipe: ${canSwipe()}`);
    
    if (!canSwipe()) {
      console.log('[Discover] No swipes left');
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
        console.error('[Discover] Error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        Alert.alert('Error', error instanceof Error ? error.message : 'Failed to swipe');
        return;
      }

      console.log('[Discover] Swipe result:', data);

      // Check if it's a match
      if (data?.is_match) {
        console.log(`[Discover] 🎉 MATCH with ${profile.first_name}!`);
        setMatchedUser({ 
          name: profile.first_name, 
          photo: profile.photos?.[0] 
        });
        setMatchModalVisible(true);
      }
    } catch (error) {
      console.error('[Discover] Unexpected error:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    }
  };

  const handleProfilePress = () => {
    // Navigate to profile detail screen
    Alert.alert('Profile', 'Profile detail screen would open here');
  };

  const handleMatchContinue = () => {
    setMatchModalVisible(false);
    setMatchedUser(null);
  };

  const handleSendMessage = () => {
    setMatchModalVisible(false);
    setMatchedUser(null);
    router.push('/(tabs)/matches');
  };

  if (loading) {
    return <LoadingSpinner text="Finding matches..." />;
  }

  if (profiles.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <SimpleWarningAlert />
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>No More Profiles</Text>
          <Text style={styles.emptySubtitle}>
            Check back later for new matches!
          </Text>
        </View>
        <SwipeCounter counter={swipeCounter} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <SimpleWarningAlert />
      
      {/* Match Modal */}
      <MatchModal
        visible={matchModalVisible}
        matchedUserName={matchedUser?.name || ''}
        matchedUserPhoto={matchedUser?.photo}
        onContinue={handleMatchContinue}
        onSendMessage={handleSendMessage}
      />
      
      <View style={styles.header}>
        <Text style={styles.title}>Discover</Text>
        <SwipeCounter counter={swipeCounter} />
      </View>

      <View style={styles.cardContainer}>
        <SwipeCard
          profile={profiles[0]}
          onSwipe={handleSwipe}
          onPress={handleProfilePress}
        />
      </View>

      <View style={styles.actionButtons}>
        <View style={styles.buttonRow}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.passButton]}
            onPress={() => handleSwipe('pass')}
          >
            <Text style={styles.actionButtonText}>✕</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionButton, styles.superlikeButton]}
            onPress={() => handleSwipe('superlike')}
          >
            <Text style={styles.actionButtonText}>⭐</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionButton, styles.likeButton]}
            onPress={() => handleSwipe('like')}
          >
            <Text style={styles.actionButtonText}>♥</Text>
          </TouchableOpacity>
        </View>
      </View>
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
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  cardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  actionButtons: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
  },
  actionButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  passButton: {
    backgroundColor: colors.pass,
  },
  superlikeButton: {
    backgroundColor: colors.superlike,
  },
  likeButton: {
    backgroundColor: colors.like,
  },
  actionButtonText: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});