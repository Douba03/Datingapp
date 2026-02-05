import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../hooks/useAuth';
import { useTheme } from '../../../contexts/ThemeContext';
import { useWaliSystem } from '../../../hooks/useWaliSystem';
import { ProtectedRoute } from '../../../components/auth/ProtectedRoute';

const { width } = Dimensions.get('window');

interface ProfileViewer {
  viewer_id: string;
  first_name: string;
  age: number;
  photos: string[];
  viewed_at: string;
}

function PremiumDashboard() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, profile } = useAuth();
  const { colors } = useTheme();
  const { fetchProfileViews } = useWaliSystem();
  
  const [profileViewers, setProfileViewers] = useState<ProfileViewer[]>([]);
  const [loading, setLoading] = useState(true);
  
  const isPremium = user?.is_premium || false;

  useEffect(() => {
    loadData();
  }, [isPremium]);

  const loadData = async () => {
    if (!isPremium) {
      setLoading(false);
      return;
    }

    try {
      const views = await fetchProfileViews();
      setProfileViewers(views || []);
    } catch (err) {
      console.error('[PremiumDashboard] Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  // Premium features list
  const premiumFeatures = [
    {
      id: 'profile_views',
      icon: 'eye',
      title: 'Profile Views',
      description: 'See who viewed your profile',
      color: '#4A90D9',
      count: profileViewers.length,
      onPress: () => {}, // Already on this screen
    },
    {
      id: 'unlimited_requests',
      icon: 'infinite',
      title: 'Unlimited Requests',
      description: 'Send unlimited connection requests',
      color: '#FF6B9D',
      badge: '∞',
    },
    {
      id: 'priority_profile',
      icon: 'arrow-up-circle',
      title: 'Priority Profile',
      description: 'Your profile appears higher in discover',
      color: '#4CAF50',
      badge: 'Active',
    },
    {
      id: 'verified_badge',
      icon: 'checkmark-circle',
      title: 'Verified Badge',
      description: 'Blue checkmark on your profile',
      color: '#2196F3',
      badge: '✓',
    },
  ];

  // Non-premium view
  if (!isPremium) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.surface }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Premium</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Hero Section */}
          <LinearGradient
            colors={['#FFD700', '#FFA500']}
            style={styles.heroSection}
          >
            <View style={styles.heroIcon}>
              <Ionicons name="diamond" size={48} color="#fff" />
            </View>
            <Text style={styles.heroTitle}>Unlock Premium</Text>
            <Text style={styles.heroSubtitle}>
              Get access to exclusive features and find your perfect match faster
            </Text>
          </LinearGradient>

          {/* Features List */}
          <View style={styles.featuresSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Premium Features</Text>
            
            {premiumFeatures.map((feature) => (
              <View key={feature.id} style={[styles.featureCard, { backgroundColor: colors.surface }]}>
                <View style={[styles.featureIcon, { backgroundColor: `${feature.color}15` }]}>
                  <Ionicons name={feature.icon as any} size={24} color={feature.color} />
                </View>
                <View style={styles.featureContent}>
                  <Text style={[styles.featureTitle, { color: colors.text }]}>{feature.title}</Text>
                  <Text style={[styles.featureDescription, { color: colors.textSecondary }]}>
                    {feature.description}
                  </Text>
                </View>
                <View style={styles.featureLock}>
                  <Ionicons name="lock-closed" size={20} color={colors.textSecondary} />
                </View>
              </View>
            ))}
          </View>

          {/* CTA Button */}
          <TouchableOpacity
            style={styles.ctaButton}
            onPress={() => router.push('/(onboarding)/payment')}
          >
            <LinearGradient
              colors={['#FFD700', '#FFA500']}
              style={styles.ctaGradient}
            >
              <Ionicons name="diamond" size={24} color="#fff" />
              <Text style={styles.ctaText}>Get Premium Now</Text>
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  // Premium view
  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Premium</Text>
          <View style={styles.premiumBadge}>
            <Ionicons name="diamond" size={12} color="#FFD700" />
            <Text style={styles.premiumBadgeText}>Active</Text>
          </View>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Quick Stats */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
            <Ionicons name="eye" size={24} color="#4A90D9" />
            <Text style={[styles.statNumber, { color: colors.text }]}>{profileViewers.length}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Profile Views</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
            <Ionicons name="infinite" size={24} color="#FF6B9D" />
            <Text style={[styles.statNumber, { color: colors.text }]}>∞</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Requests</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
            <Ionicons name="checkmark-circle" size={24} color="#2196F3" />
            <Text style={[styles.statNumber, { color: colors.text }]}>✓</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Verified</Text>
          </View>
        </View>

        {/* Profile Views Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              👀 Who Viewed Your Profile
            </Text>
            {profileViewers.length > 0 && (
              <View style={[styles.countBadge, { backgroundColor: colors.primary }]}>
                <Text style={styles.countBadgeText}>{profileViewers.length}</Text>
              </View>
            )}
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : profileViewers.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: colors.surface }]}>
              <Ionicons name="eye-outline" size={40} color={colors.textSecondary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No one has viewed your profile yet.{'\n'}Keep your profile updated to attract more views!
              </Text>
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.viewersScroll}>
              {profileViewers.map((viewer) => (
                <TouchableOpacity
                  key={viewer.viewer_id}
                  style={[styles.viewerCard, { backgroundColor: colors.surface }]}
                  onPress={() => router.push(`/(tabs)/profile?viewUserId=${viewer.viewer_id}&readonly=true`)}
                >
                  <Image
                    source={{ uri: viewer.photos?.[0] || 'https://via.placeholder.com/100' }}
                    style={styles.viewerPhoto}
                    contentFit="cover"
                  />
                  <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.8)']}
                    style={styles.viewerGradient}
                  >
                    <Text style={styles.viewerName}>{viewer.first_name}, {viewer.age}</Text>
                    <Text style={styles.viewerTime}>{formatTimeAgo(viewer.viewed_at)}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Actions</Text>
          
          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: colors.surface }]}
            onPress={() => router.push('/(tabs)/requests')}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#4CAF5015' }]}>
              <Ionicons name="paper-plane" size={24} color="#4CAF50" />
            </View>
            <View style={styles.actionContent}>
              <Text style={[styles.actionTitle, { color: colors.text }]}>Send Requests</Text>
              <Text style={[styles.actionDescription, { color: colors.textSecondary }]}>
                Unlimited requests with Premium
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

export default function PremiumDashboardWrapper() {
  return (
    <ProtectedRoute>
      <PremiumDashboard />
    </ProtectedRoute>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 12,
    marginTop: 4,
    marginBottom: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFD70020',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginTop: 4,
    gap: 4,
  },
  premiumBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFD700',
  },
  scrollContent: {
    paddingBottom: 100,
  },
  heroSection: {
    marginHorizontal: 16,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
  },
  heroIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    lineHeight: 20,
  },
  featuresSection: {
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureContent: {
    flex: 1,
    marginLeft: 12,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  featureDescription: {
    fontSize: 13,
  },
  featureLock: {
    marginLeft: 8,
  },
  ctaButton: {
    marginHorizontal: 16,
    marginTop: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  ctaGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  ctaText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '800',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 11,
    marginTop: 4,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  countBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  countBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyCard: {
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 20,
  },
  viewersScroll: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  viewerCard: {
    width: 120,
    height: 160,
    borderRadius: 16,
    overflow: 'hidden',
    marginRight: 12,
  },
  viewerPhoto: {
    width: '100%',
    height: '100%',
  },
  viewerGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 10,
  },
  viewerName: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  viewerTime: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 10,
    marginTop: 2,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionContent: {
    flex: 1,
    marginLeft: 12,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  actionDescription: {
    fontSize: 13,
  },
});
