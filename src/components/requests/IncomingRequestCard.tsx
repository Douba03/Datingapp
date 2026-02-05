import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Profile } from '../../types/user';
import { ConnectionRequest, DeclineReason, DECLINE_REASON_LABELS } from '../../types/requests';
import { useTheme } from '../../contexts/ThemeContext';
import { calculateDistance, formatDistance } from '../../utils/location';
import { useAuth } from '../../hooks/useAuth';

const PLACEHOLDER_BLURHASH = { blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' };

interface IncomingRequestCardProps {
  request: ConnectionRequest & { sender_profile?: Profile };
  onAccept: () => void;
  onDecline: (reason: DeclineReason, note?: string) => void;
  onViewProfile: () => void;
}

const { width: screenWidth } = Dimensions.get('window');
const CARD_WIDTH = screenWidth - 32;

export function IncomingRequestCard({ 
  request, 
  onAccept, 
  onDecline, 
  onViewProfile 
}: IncomingRequestCardProps) {
  const [showDeclineOptions, setShowDeclineOptions] = useState(false);
  const { profile: currentUserProfile } = useAuth();
  const { colors } = useTheme();
  const senderProfile = request.sender_profile;

  if (!senderProfile) return null;

  const getDistanceText = () => {
    if (!currentUserProfile?.location || !senderProfile.location) {
      return senderProfile.city || 'Unknown location';
    }
    const distance = calculateDistance(currentUserProfile.location, senderProfile.location);
    return formatDistance(distance);
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

  const handleDecline = (reason: DeclineReason) => {
    onDecline(reason);
    setShowDeclineOptions(false);
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.surface }]}>
      <TouchableOpacity 
        onPress={onViewProfile} 
        style={styles.cardContent}
        activeOpacity={0.95}
      >
        {/* Profile Image */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: senderProfile.photos?.[0] }}
            style={styles.image}
            contentFit="cover"
            placeholder={PLACEHOLDER_BLURHASH}
            transition={200}
          />
          
          {/* Time badge */}
          <View style={[styles.timeBadge, { backgroundColor: colors.surface }]}>
            <Ionicons name="time-outline" size={12} color={colors.textSecondary} />
            <Text style={[styles.timeText, { color: colors.textSecondary }]}>
              {formatTimeAgo(request.created_at)}
            </Text>
          </View>
        </View>

        {/* Info Section */}
        <View style={styles.infoContainer}>
          <View style={styles.nameRow}>
            <Text style={[styles.name, { color: colors.text }]}>
              {senderProfile.first_name}, {senderProfile.age}
            </Text>
          </View>
          
          <View style={styles.locationRow}>
            <Ionicons name="location" size={14} color={colors.textSecondary} />
            <Text style={[styles.locationText, { color: colors.textSecondary }]}>
              {getDistanceText()}
            </Text>
          </View>

          {request.message && (
            <View style={[styles.messageContainer, { backgroundColor: `${colors.primary}10` }]}>
              <Ionicons name="chatbubble" size={14} color={colors.primary} />
              <Text style={[styles.messageText, { color: colors.text }]} numberOfLines={2}>
                "{request.message}"
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>

      {/* Action Buttons */}
      {!showDeclineOptions ? (
        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={[styles.declineButton, { borderColor: colors.error }]}
            onPress={() => setShowDeclineOptions(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="close" size={22} color={colors.error} />
            <Text style={[styles.declineButtonText, { color: colors.error }]}>
              Decline
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.acceptButton}
            onPress={onAccept}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={[colors.success, colors.successDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.acceptButtonGradient}
            >
              <Ionicons name="checkmark" size={22} color="#fff" />
              <Text style={styles.acceptButtonText}>Accept</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.declineOptionsContainer}>
          <Text style={[styles.declineTitle, { color: colors.text }]}>
            Why are you declining?
          </Text>
          <View style={styles.declineOptions}>
            {(Object.keys(DECLINE_REASON_LABELS) as DeclineReason[]).map((reason) => (
              <TouchableOpacity
                key={reason}
                style={[styles.declineOption, { borderColor: colors.border }]}
                onPress={() => handleDecline(reason)}
              >
                <Text style={[styles.declineOptionText, { color: colors.text }]}>
                  {DECLINE_REASON_LABELS[reason]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => setShowDeclineOptions(false)}
          >
            <Text style={[styles.cancelButtonText, { color: colors.textSecondary }]}>
              Cancel
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  cardContent: {
    flexDirection: 'row',
    padding: 16,
  },
  imageContainer: {
    position: 'relative',
  },
  image: {
    width: 100,
    height: 120,
    borderRadius: 12,
  },
  timeBadge: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
  },
  timeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  infoContainer: {
    flex: 1,
    marginLeft: 14,
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  name: {
    fontSize: 20,
    fontWeight: '700',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 10,
  },
  locationText: {
    fontSize: 14,
    fontWeight: '500',
  },
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 10,
    borderRadius: 10,
    gap: 8,
  },
  messageText: {
    flex: 1,
    fontSize: 13,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  actionContainer: {
    flexDirection: 'row',
    padding: 16,
    paddingTop: 0,
    gap: 12,
  },
  declineButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    gap: 6,
  },
  declineButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  acceptButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  acceptButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
  },
  acceptButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  declineOptionsContainer: {
    padding: 16,
    paddingTop: 0,
  },
  declineTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  declineOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  declineOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
  },
  declineOptionText: {
    fontSize: 13,
    fontWeight: '500',
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
