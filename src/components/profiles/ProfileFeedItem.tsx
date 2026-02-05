import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Profile } from '../../types/user';
import { useTheme } from '../../contexts/ThemeContext';

interface ProfileFeedItemProps {
  profile: Profile;
  onPress: () => void;
  onSendRequest: () => void;
  onNotLookingFor?: () => void;
}

export function ProfileFeedItem({ profile, onPress, onSendRequest, onNotLookingFor }: ProfileFeedItemProps) {
  const { colors } = useTheme();

  // Helper to format religious practice for display
  const formatReligiousPractice = (practice?: string) => {
    if (!practice) return null;
    return practice.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const religiousPractice = formatReligiousPractice(profile.religious_practice);

  return (
    <TouchableOpacity 
      style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]} 
      onPress={onPress}
      activeOpacity={0.9}
    >
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: profile.photos?.[0] }}
          style={styles.image}
          contentFit="cover"
          transition={200}
        />
        {religiousPractice && (
          <View style={styles.badgeContainer}>
            <LinearGradient
              colors={[colors.primary, colors.primaryDark]}
              style={styles.badge}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Ionicons name="moon" size={10} color="#fff" style={{ marginRight: 4 }} />
              <Text style={styles.badgeText}>{religiousPractice}</Text>
            </LinearGradient>
          </View>
        )}
      </View>

      <View style={styles.infoContainer}>
        <View style={styles.headerRow}>
          <View style={styles.nameRow}>
            <Text style={[styles.name, { color: colors.text }]}>
              {profile.first_name}, {profile.age}
            </Text>
            {profile.compatibilityScore !== undefined && profile.compatibilityScore > 0 && (
              <View style={[styles.compatibilityBadge, { 
                backgroundColor: profile.compatibilityScore >= 70 ? '#10B981' : 
                                 profile.compatibilityScore >= 50 ? '#F59E0B' : '#6B7280' 
              }]}>
                <Text style={styles.compatibilityText}>{profile.compatibilityScore}%</Text>
              </View>
            )}
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Ionicons name="location-sharp" size={12} color={colors.textSecondary} />
            <Text style={[styles.location, { color: colors.textSecondary }]}>
              {profile.city || 'Unknown'}
            </Text>
          </View>
        </View>

        <View style={styles.detailsRow}>
           {profile.marriage_timeline && (
            <View style={styles.detailItem}>
              <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
              <Text style={[styles.detailText, { color: colors.textSecondary }]}>
                {profile.marriage_timeline.replace(/_/g, ' ')}
              </Text>
            </View>
           )}
           {profile.education_level && (
            <View style={styles.detailItem}>
              <Ionicons name="school-outline" size={14} color={colors.textSecondary} />
              <Text style={[styles.detailText, { color: colors.textSecondary }]}>
                {profile.education_level.replace(/_/g, ' ')}
              </Text>
            </View>
           )}
           {profile.wants_children !== undefined && (
             <View style={styles.detailItem}>
               <Ionicons name="heart-outline" size={14} color={colors.textSecondary} />
               <Text style={[styles.detailText, { color: colors.textSecondary }]}>
                 {profile.wants_children ? 'Wants children' : 'No children'}
               </Text>
             </View>
           )}
        </View>

        {profile.bio && (
          <Text style={[styles.bio, { color: colors.textSecondary }]} numberOfLines={2}>
            {profile.bio}
          </Text>
        )}

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.sendButton, { backgroundColor: `${colors.primary}15` }]}
            onPress={(e) => {
              e.stopPropagation();
              onSendRequest();
            }}
          >
            <Ionicons name="heart" size={16} color={colors.primary} />
            <Text style={[styles.actionButtonText, { color: colors.primary }]}>Send Request</Text>
          </TouchableOpacity>

          {onNotLookingFor && (
            <TouchableOpacity
              style={[styles.actionButton, styles.notLookingForButton, { backgroundColor: 'rgba(107, 114, 128, 0.1)' }]}
              onPress={(e) => {
                e.stopPropagation();
                onNotLookingFor();
              }}
            >
              <Ionicons name="close-circle" size={16} color="#6B7280" />
              <Text style={[styles.actionButtonText, { color: '#6B7280' }]}>Not What I'm Looking For</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginHorizontal: 16,
  },
  imageContainer: {
    width: 100,
    height: 140,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  badgeContainer: {
    position: 'absolute',
    top: 8,
    left: 8,
    right: 8, // constrain width if text is long
    alignItems: 'flex-start',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
  },
  infoContainer: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  headerRow: {
    marginBottom: 4,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  compatibilityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  compatibilityText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  name: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 2,
  },
  location: {
    fontSize: 12,
    fontWeight: '500',
  },
  detailsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.03)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  detailText: {
    fontSize: 11,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  bio: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 8,
  },
  requestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
  },
  requestButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    gap: 4,
    flex: 1,
    minWidth: 90,
  },
  sendButton: {
    flex: 1,
  },
  notLookingForButton: {
    flex: 1,
  },
  actionButtonText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
