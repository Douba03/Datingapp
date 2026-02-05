import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useRequests } from '../../hooks/useRequests';
import { RequestCounter } from '../../components/requests/RequestCounter';
import { NoRequestsModal } from '../../components/requests/NoRequestsModal';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { ProtectedRoute } from '../../components/auth/ProtectedRoute';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../contexts/ThemeContext';
import { useWaliSystem } from '../../hooks/useWaliSystem';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../services/supabase/client';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

function DiscoverScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, profile } = useAuth();
  const { colors } = useTheme();
  const { recordProfileView } = useWaliSystem();
  const { 
    profiles, 
    requestCounter, 
    loading, 
    sendRequest, 
    canSendRequest, 
    getNextRefillTime, 
    refetch 
  } = useRequests();
  
  const [showNoRequestsModal, setShowNoRequestsModal] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [actionLoading, setActionLoading] = useState(false);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  
  // Current profile to display (ONE at a time)
  const currentProfile = profiles[currentIndex] || null;
  const remainingProfiles = profiles.length - currentIndex;
  
  // Preload images for next few profiles
  useEffect(() => {
    if (profiles.length > 0) {
      // Preload current and next 5 profiles
      const imagesToPreload = profiles
        .slice(currentIndex, currentIndex + 6)
        .flatMap(p => p.photos || [])
        .filter(Boolean) as string[];
      
      imagesToPreload.forEach(uri => {
        Image.prefetch(uri, 'memory-disk').catch(() => {});
      });
    }
  }, [profiles, currentIndex]);
  
  // Reset photo index when profile changes
  useEffect(() => {
    setActivePhotoIndex(0);
  }, [currentIndex]);

  // Move to next profile
  const goToNextProfile = () => {
    if (currentIndex < profiles.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  // Send interest request
  const handleSendRequest = async () => {
    if (!currentProfile) return;
    
    if (!canSendRequest()) {
      setShowNoRequestsModal(true);
      return;
    }
    
    setActionLoading(true);
    const { error } = await sendRequest(currentProfile.user_id);
    setActionLoading(false);
    
    if (error) {
      Alert.alert('Error', (error as Error).message || 'Could not send request');
    } else {
      // Move to next profile
      goToNextProfile();
    }
  };

  // Not interested - hide profile
  const handleNotLookingFor = async () => {
    if (!currentProfile) return;
    
    setActionLoading(true);
    try {
      const { error } = await supabase.rpc('hide_profile', {
        target_user_id: currentProfile.user_id,
        reason: 'not_looking_for'
      });
      
      if (error) {
        console.error('[handleNotLookingFor] Error:', error);
        // Even if RPC fails, still move to next profile
      }
      
      // Move to next profile
      goToNextProfile();
    } catch (error) {
      console.error('[handleNotLookingFor] Unexpected error:', error);
    } finally {
      setActionLoading(false);
    }
  };

  // View full profile - records profile view for premium feature
  const handleViewProfile = () => {
    if (!currentProfile) return;
    // Record that this user viewed the profile (for "Who viewed your profile" feature)
    recordProfileView(currentProfile.user_id);
    router.push(`/(tabs)/profile?viewUserId=${currentProfile.user_id}&readonly=true`);
  };
  
  // Refresh profiles
  const handleRefresh = async () => {
    setCurrentIndex(0);
    await refetch();
  };

  // Loading state
  if (loading && profiles.length === 0) {
    return (
      <LinearGradient
        colors={[colors.backgroundGradientStart, colors.backgroundGradientEnd]}
        style={styles.container}
      >
        <LoadingSpinner text="Finding profiles..." />
      </LinearGradient>
    );
  }

  // No profiles or all profiles viewed
  if (!currentProfile || currentIndex >= profiles.length) {
    return (
      <LinearGradient
        colors={[colors.backgroundGradientStart, colors.backgroundGradientEnd]}
        style={styles.container}
      >
        <View style={[styles.safeArea, { paddingTop: insets.top }]}>
          {/* Header */}
          <View style={[styles.header, { backgroundColor: colors.surface }]}>
            <Text style={[styles.headerTitle, { color: colors.primary }]}>Calafdoon</Text>
            <View style={styles.headerRight}>
              {/* Premium Button */}
              <TouchableOpacity
                style={styles.premiumButton}
                onPress={() => router.push('/(tabs)/premium/dashboard')}
              >
                <LinearGradient
                  colors={['#FFD700', '#FFA500']}
                  style={styles.premiumButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Ionicons name="diamond" size={12} color="#fff" />
                  <Text style={styles.premiumButtonText}>Premium</Text>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => router.push('/(tabs)/profile')}
                style={[styles.profileButton, { borderColor: colors.primary }]}
              >
                <Ionicons name="person" size={14} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.emptyContainer}>
            <View style={[styles.emptyIconContainer, { backgroundColor: `${colors.primary}10` }]}>
              <Ionicons name="heart-outline" size={64} color={colors.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              No More Profiles
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              You've seen all available profiles.{'\n'}Check back later for new matches!
            </Text>
            
            <TouchableOpacity
              style={[styles.refreshButton, { backgroundColor: colors.primary }]}
              onPress={handleRefresh}
              activeOpacity={0.8}
            >
              <Ionicons name="refresh" size={20} color="#fff" />
              <Text style={styles.refreshButtonText}>Refresh</Text>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
    );
  }

  const photos = currentProfile.photos || [];
  const currentPhoto = photos[activePhotoIndex] || photos[0];

  return (
    <LinearGradient
      colors={[colors.backgroundGradientStart, colors.backgroundGradientEnd]}
      style={styles.container}
    >
      <View style={[styles.safeArea, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.surface }]}>
          <View style={styles.headerLeft}>
            <Text style={[styles.headerTitle, { color: colors.primary }]}>Calafdoon</Text>
            <Text style={[styles.profileCounter, { color: colors.textSecondary }]}>
              {remainingProfiles} profiles left
            </Text>
          </View>
          
          <View style={styles.headerRight}>
            {/* Premium Button */}
            <TouchableOpacity
              style={styles.premiumButton}
              onPress={() => router.push('/(tabs)/premium/dashboard')}
            >
              <LinearGradient
                colors={['#FFD700', '#FFA500']}
                style={styles.premiumButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Ionicons name="diamond" size={12} color="#fff" />
                <Text style={styles.premiumButtonText}>Premium</Text>
              </LinearGradient>
            </TouchableOpacity>
            
            <RequestCounter counter={requestCounter} />
            <TouchableOpacity 
              onPress={() => router.push('/(tabs)/profile')}
              style={[styles.profileButton, { borderColor: colors.primary }]}
            >
              {profile?.photos?.[0] ? (
                <Image source={{ uri: profile.photos[0] }} style={styles.profileImage} />
              ) : (
                <Ionicons name="person" size={14} color={colors.primary} />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Single Profile Card */}
        <View style={styles.cardContainer}>
          <View style={[styles.profileCard, { backgroundColor: colors.surface }]}>
            {/* Photo */}
            <TouchableOpacity 
              style={styles.photoContainer}
              onPress={handleViewProfile}
              activeOpacity={0.95}
            >
              {currentPhoto ? (
                <Image
                  source={{ uri: currentPhoto }}
                  style={styles.profilePhoto}
                  contentFit="cover"
                  transition={200}
                />
              ) : (
                <View style={[styles.noPhoto, { backgroundColor: colors.border }]}>
                  <Ionicons name="person" size={80} color={colors.textSecondary} />
                </View>
              )}
              
              {/* Photo indicators */}
              {photos.length > 1 && (
                <View style={styles.photoIndicators}>
                  {photos.map((_, idx) => (
                    <TouchableOpacity
                      key={idx}
                      style={[
                        styles.indicator,
                        idx === activePhotoIndex && styles.indicatorActive
                      ]}
                      onPress={() => setActivePhotoIndex(idx)}
                    />
                  ))}
                </View>
              )}
              
              {/* Photo navigation */}
              <View style={styles.photoNavigation}>
                <TouchableOpacity
                  style={styles.photoNavButton}
                  onPress={() => setActivePhotoIndex(prev => Math.max(0, prev - 1))}
                />
                <TouchableOpacity
                  style={styles.photoNavButton}
                  onPress={() => setActivePhotoIndex(prev => Math.min(photos.length - 1, prev + 1))}
                />
              </View>
              
              {/* Gradient overlay */}
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.8)']}
                style={styles.photoGradient}
              />
              
              {/* Profile info overlay */}
              <View style={styles.profileInfo}>
                <View style={styles.nameRow}>
                  <Text style={styles.profileName}>
                    {currentProfile.first_name}, {currentProfile.age || '?'}
                  </Text>
                  {(currentProfile as any).is_premium && (
                    <View style={styles.verifiedBadge}>
                      <Ionicons name="checkmark-circle" size={20} color="#2196F3" />
                    </View>
                  )}
                </View>
                {currentProfile.city && (
                  <View style={styles.locationRow}>
                    <Ionicons name="location" size={14} color="#fff" />
                    <Text style={styles.locationText}>{currentProfile.city}</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
            
            {/* Action Buttons - Circular design */}
            <View style={styles.actionButtonsRow}>
              {/* Skip Button */}
              <TouchableOpacity
                style={styles.circleButtonWrapper}
                onPress={handleNotLookingFor}
                disabled={actionLoading}
              >
                <View style={[styles.circleButton, styles.skipCircle, { borderColor: colors.border }]}>
                  <Ionicons name="hand-left-outline" size={28} color={colors.textSecondary} />
                </View>
                <Text style={[styles.circleButtonLabel, { color: colors.textSecondary }]}>Not Now</Text>
              </TouchableOpacity>
              
              {/* View Profile Button */}
              <TouchableOpacity
                style={styles.circleButtonWrapper}
                onPress={handleViewProfile}
              >
                <View style={[styles.circleButton, styles.profileCircle, { borderColor: colors.primary }]}>
                  <Ionicons name="person-outline" size={26} color={colors.primary} />
                </View>
                <Text style={[styles.circleButtonLabel, { color: colors.primary }]}>Profile</Text>
              </TouchableOpacity>
              
              {/* Send Request Button - Ring icon for marriage */}
              <TouchableOpacity
                style={styles.circleButtonWrapper}
                onPress={handleSendRequest}
                disabled={actionLoading}
              >
                <View style={[styles.circleButton, styles.sendCircle, { backgroundColor: colors.primary }]}>
                  {actionLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Ionicons name="diamond-outline" size={30} color="#fff" />
                  )}
                </View>
                <Text style={[styles.circleButtonLabel, { color: colors.primary }]}>Request</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* No Requests Modal */}
        <NoRequestsModal
          visible={showNoRequestsModal}
          nextRefillTime={getNextRefillTime()}
          onClose={() => setShowNoRequestsModal(false)}
          onGetPremium={() => {
            setShowNoRequestsModal(false);
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
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 8,
    marginTop: 4,
    marginBottom: 6,
    borderRadius: 16,
    shadowColor: '#0B1F3B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  headerLeft: {
    flexShrink: 0,
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
    shadowColor: '#0B1F3B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  titleContainer: {
    flexDirection: 'column',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
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
    gap: 6,
    flexShrink: 0,
  },
  premiumButton: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  premiumButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 4,
    gap: 2,
  },
  premiumButtonText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
  },
  profileButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  profileImage: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  counterRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  listContent: {
    paddingBottom: 20,
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 60, // Add some top padding if list is empty
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 16,
    borderWidth: 2,
    marginTop: 24,
    gap: 8,
  },
  refreshButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  loadMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    borderWidth: 2,
    marginHorizontal: 16,
    marginVertical: 16,
    gap: 8,
  },
  loadMoreText: {
    fontSize: 15,
    fontWeight: '600',
  },
  // New single-profile card styles
  profileCounter: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  cardContainer: {
    flex: 1,
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  profileCard: {
    flex: 1,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  photoContainer: {
    flex: 1,
    position: 'relative',
  },
  profilePhoto: {
    width: '100%',
    height: '100%',
  },
  noPhoto: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  photoGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 200,
  },
  profileInfo: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  profileName: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  verifiedBadge: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  locationText: {
    fontSize: 16,
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  bioContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  bioText: {
    fontSize: 15,
    lineHeight: 22,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 20,
  },
  actionButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    backgroundColor: '#fff',
  },
  passButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  infoButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  likeButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#10B981',
    borderWidth: 0,
  },
  // New button styles
  skipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
    flex: 1,
  },
  skipButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  sendRequestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
    flex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  sendRequestButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  viewProfileLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 4,
  },
  viewProfileLinkText: {
    fontSize: 14,
    fontWeight: '600',
  },
  // New circular button styles
  actionButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingVertical: 20,
    paddingHorizontal: 20,
    gap: 32,
  },
  circleButtonWrapper: {
    alignItems: 'center',
    gap: 8,
  },
  circleButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  skipCircle: {
    borderWidth: 2,
  },
  profileCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
  },
  sendCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 0,
  },
  circleButtonLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
});
