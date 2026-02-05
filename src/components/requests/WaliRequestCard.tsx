import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { WaliRequest } from '../../hooks/useWaliSystem';

interface WaliRequestCardProps {
  request: WaliRequest;
  onAccept: () => void;
  onDecline: () => void;
  onViewProfile: () => void;
  isReceived: boolean;
}

export function WaliRequestCard({ 
  request, 
  onAccept, 
  onDecline, 
  onViewProfile,
  isReceived 
}: WaliRequestCardProps) {
  const { colors } = useTheme();
  
  const profile = isReceived ? request.requester_profile : request.recipient_profile;
  const photo = profile?.photos?.[0];
  const name = profile?.first_name || 'Unknown';
  const age = profile?.age;
  const city = profile?.city;

  const handleAccept = () => {
    Alert.alert(
      'Accept Wali Request',
      `Are you sure you want to accept ${name}'s request to involve families? This is a serious step towards marriage.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Accept', onPress: onAccept },
      ]
    );
  };

  const handleDecline = () => {
    Alert.alert(
      'Decline Request',
      'Are you sure you want to decline this request?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Decline', style: 'destructive', onPress: onDecline },
      ]
    );
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.surface }]}>
      {/* Special Wali Badge */}
      <LinearGradient
        colors={['#FFD700', '#FFA500']}
        style={styles.waliBadge}
      >
        <Ionicons name="diamond" size={14} color="#fff" />
        <Text style={styles.waliBadgeText}>Wali Request</Text>
      </LinearGradient>

      <View style={styles.content}>
        {/* Profile Photo */}
        <TouchableOpacity onPress={onViewProfile}>
          {photo ? (
            <Image source={{ uri: photo }} style={styles.photo} />
          ) : (
            <View style={[styles.photo, styles.photoPlaceholder, { backgroundColor: colors.border }]}>
              <Ionicons name="person" size={30} color={colors.textSecondary} />
            </View>
          )}
        </TouchableOpacity>

        {/* Info */}
        <View style={styles.info}>
          <TouchableOpacity onPress={onViewProfile}>
            <Text style={[styles.name, { color: colors.text }]}>
              {name}{age ? `, ${age}` : ''}
            </Text>
          </TouchableOpacity>
          {city && (
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
              <Text style={[styles.location, { color: colors.textSecondary }]}>{city}</Text>
            </View>
          )}
          
          {/* Status Badge */}
          <View style={[
            styles.statusBadge,
            request.status === 'accepted' && { backgroundColor: '#4CAF5020' },
            request.status === 'declined' && { backgroundColor: '#F4433620' },
            request.status === 'pending' && { backgroundColor: `${colors.primary}20` },
          ]}>
            <Text style={[
              styles.statusText,
              request.status === 'accepted' && { color: '#4CAF50' },
              request.status === 'declined' && { color: '#F44336' },
              request.status === 'pending' && { color: colors.primary },
            ]}>
              {request.status === 'accepted' ? '✓ Accepted - Ready for Family' :
               request.status === 'declined' ? '✗ Declined' :
               '⏳ Awaiting Response'}
            </Text>
          </View>
        </View>
      </View>

      {/* Message */}
      <View style={[styles.messageContainer, { backgroundColor: `${colors.primary}08` }]}>
        <Ionicons name="chatbubble-outline" size={16} color={colors.primary} />
        <Text style={[styles.message, { color: colors.text }]}>
          "{request.message}"
        </Text>
      </View>

      {/* Action Buttons - Only for received pending requests */}
      {isReceived && request.status === 'pending' && (
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.declineButton, { borderColor: colors.error }]}
            onPress={handleDecline}
          >
            <Ionicons name="close" size={20} color={colors.error} />
            <Text style={[styles.declineText, { color: colors.error }]}>Decline</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.acceptButton}
            onPress={handleAccept}
          >
            <LinearGradient
              colors={['#FFD700', '#FFA500']}
              style={styles.acceptGradient}
            >
              <Ionicons name="diamond" size={20} color="#fff" />
              <Text style={styles.acceptText}>Accept & Involve Family</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}

      {/* Date */}
      <Text style={[styles.date, { color: colors.textSecondary }]}>
        {isReceived ? 'Received' : 'Sent'} {new Date(request.created_at).toLocaleDateString()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  waliBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12,
    gap: 4,
  },
  waliBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  content: {
    flexDirection: 'row',
    gap: 12,
  },
  photo: {
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  photoPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: {
    flex: 1,
    justifyContent: 'center',
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  location: {
    fontSize: 13,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    marginTop: 12,
  },
  message: {
    flex: 1,
    fontSize: 14,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  declineButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    gap: 6,
  },
  declineText: {
    fontSize: 14,
    fontWeight: '600',
  },
  acceptButton: {
    flex: 2,
    borderRadius: 12,
    overflow: 'hidden',
  },
  acceptGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
  },
  acceptText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  date: {
    fontSize: 12,
    marginTop: 12,
    textAlign: 'right',
  },
});
