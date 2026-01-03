import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../hooks/useAuth';
import { useTheme } from '../../../contexts/ThemeContext';
import { supabase } from '../../../services/supabase/client';
import { colors as staticColors } from '../../../components/theme/colors';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

interface LikedByUser {
  id: string;
  first_name: string;
  age: number;
  photos: string[];
  location?: string;
}

export default function WhoLikesYouScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { colors } = useTheme();
  const [likedByUsers, setLikedByUsers] = useState<LikedByUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.is_premium) {
      fetchLikedByUsers();
    } else {
      setLoading(false);
    }
  }, [user?.is_premium]);

  const fetchLikedByUsers = async () => {
    if (!user) return;
    
    try {
      // Get users who liked the current user
      const { data: swipesData, error: swipesError } = await supabase
        .from('swipes')
        .select('swiper_user_id, created_at, action')
        .eq('target_user_id', user.id)
        .in('action', ['like', 'superlike'])
        .order('created_at', { ascending: false });

      if (swipesError) {
        console.error('[WhoLikesYou] Error fetching swipes:', swipesError);
        setLikedByUsers([]);
        return;
      }

      if (!swipesData || swipesData.length === 0) {
        setLikedByUsers([]);
        return;
      }

      // Get unique user IDs
      const userIds = [...new Set(swipesData.map(s => s.swiper_user_id))];

      // Fetch profiles for these users separately
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, first_name, date_of_birth, photos, city')
        .in('user_id', userIds);

      if (profilesError) {
        console.error('[WhoLikesYou] Error fetching profiles:', profilesError);
        setLikedByUsers([]);
        return;
      }

      if (profilesData) {
        const users: LikedByUser[] = profilesData.map((profile: any) => {
          const birthDate = new Date(profile.date_of_birth);
          const age = Math.floor((Date.now() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
          
          return {
            id: profile.user_id,
            first_name: profile.first_name,
            age,
            photos: profile.photos || [],
            location: profile.city,
          };
        });
        
        setLikedByUsers(users);
      }
    } catch (err) {
      console.error('[WhoLikesYou] Error:', err);
      setLikedByUsers([]);
    } finally {
      setLoading(false);
    }
  };

  // Non-premium view - show blurred preview
  if (!user?.is_premium) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        {/* Header - Settings style */}
        <View style={[styles.header, { backgroundColor: colors.surface }]}>
          <View style={styles.headerLeft}>
            <View style={styles.logoRow}>
              <View style={[styles.logoContainer, { backgroundColor: colors.primary }]}>
                <Ionicons name="people" size={18} color="#fff" />
              </View>
              <View style={styles.titleContainer}>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Who Likes You</Text>
                <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>See your admirers</Text>
              </View>
            </View>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} bounces={false} overScrollMode="never">
          {/* Blurred Preview Cards */}
          <View style={styles.grid}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <View key={i} style={[styles.blurredCard, { backgroundColor: colors.surface }]}>
                <View style={[styles.blurredPhoto, { backgroundColor: colors.border }]}>
                  <View style={styles.blurOverlay}>
                    <Ionicons name="lock-closed" size={32} color="#fff" />
                  </View>
                </View>
                <View style={styles.blurredInfo}>
                  <View style={[styles.blurredName, { backgroundColor: colors.border }]} />
                  <View style={[styles.blurredAge, { backgroundColor: colors.border }]} />
                </View>
              </View>
            ))}
          </View>

          {/* Unlock CTA */}
          <View style={[styles.unlockCard, { backgroundColor: colors.surface }]}>
            <View style={styles.unlockIconContainer}>
              <Ionicons name="eye" size={40} color="#FFD700" />
            </View>
            <Text style={[styles.unlockTitle, { color: colors.text }]}>
              See Who Likes You
            </Text>
            <Text style={[styles.unlockSubtitle, { color: colors.textSecondary }]}>
              Upgrade to Premium to reveal everyone who's interested in you
            </Text>
            
            <TouchableOpacity
              style={styles.unlockButton}
              onPress={() => router.push('/(onboarding)/payment')}
            >
              <LinearGradient
                colors={['#FFD700', '#FFA500']}
                style={styles.unlockGradient}
              >
                <Ionicons name="diamond" size={20} color="#fff" />
                <Text style={styles.unlockButtonText}>Unlock with Premium</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  // Premium view - show actual users
  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* Header - Settings style */}
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <View style={styles.headerLeft}>
          <View style={styles.logoRow}>
            <View style={[styles.logoContainer, { backgroundColor: colors.primary }]}>
              <Ionicons name="people" size={18} color="#fff" />
            </View>
            <View style={styles.titleContainer}>
              <Text style={[styles.headerTitle, { color: colors.text }]}>Who Likes You</Text>
              <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
                {likedByUsers.length > 0 ? `${likedByUsers.length} admirers` : 'See your admirers'}
              </Text>
            </View>
          </View>
        </View>
        {likedByUsers.length > 0 && (
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{likedByUsers.length}</Text>
          </View>
        )}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading...</Text>
        </View>
      ) : likedByUsers.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={[styles.emptyIconContainer, { backgroundColor: `${colors.primary}20` }]}>
            <Ionicons name="heart-outline" size={50} color={colors.primary} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No likes yet</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            Keep swiping! When someone likes you, they'll appear here.
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} bounces={false} overScrollMode="never">
          <View style={styles.grid}>
            {likedByUsers.map((likedUser) => (
              <TouchableOpacity
                key={likedUser.id}
                style={[styles.userCard, { backgroundColor: colors.surface }]}
                activeOpacity={0.8}
              >
                <Image
                  source={{ uri: likedUser.photos[0] || 'https://via.placeholder.com/200' }}
                  style={styles.userPhoto}
                />
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.7)']}
                  style={styles.photoGradient}
                >
                  <Text style={styles.userName}>{likedUser.first_name}, {likedUser.age}</Text>
                  {likedUser.location && (
                    <View style={styles.locationRow}>
                      <Ionicons name="location" size={12} color="#fff" />
                      <Text style={styles.userLocation}>{likedUser.location}</Text>
                    </View>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      )}
    </View>
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
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 1,
  },
  countBadge: {
    backgroundColor: '#FF6B9D',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  countText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  content: {
    padding: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  
  // User Cards (Premium)
  userCard: {
    width: CARD_WIDTH,
    height: CARD_WIDTH * 1.3,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  userPhoto: {
    width: '100%',
    height: '100%',
  },
  photoGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
  },
  userName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  userLocation: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 12,
  },

  // Blurred Cards (Non-Premium)
  blurredCard: {
    width: CARD_WIDTH,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  blurredPhoto: {
    width: '100%',
    height: CARD_WIDTH,
    justifyContent: 'center',
    alignItems: 'center',
  },
  blurOverlay: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  blurredInfo: {
    padding: 12,
    gap: 8,
  },
  blurredName: {
    width: '70%',
    height: 14,
    borderRadius: 7,
  },
  blurredAge: {
    width: '40%',
    height: 10,
    borderRadius: 5,
  },

  // Unlock Card
  unlockCard: {
    marginTop: 24,
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  unlockIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,215,0,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  unlockTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  unlockSubtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  unlockButton: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  unlockGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  unlockButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
  },

  // Loading & Empty States
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
});
