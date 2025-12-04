import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

const { width: screenWidth } = Dimensions.get('window');

interface SignOutModalProps {
  visible: boolean;
  loading?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function SignOutModal({ visible, loading, onClose, onConfirm }: SignOutModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header with Icon */}
          <View style={styles.iconContainer}>
            <LinearGradient
              colors={['#6366F1', '#8B5CF6']}
              style={styles.iconGradient}
            >
              <Ionicons name="log-out-outline" size={36} color="#fff" />
            </LinearGradient>
          </View>

          {/* Title */}
          <Text style={styles.title}>Sign Out?</Text>

          {/* Description */}
          <Text style={styles.description}>
            You're about to sign out of your account. You can sign back in anytime with your email and password.
          </Text>

          {/* Info Box */}
          <View style={styles.infoBox}>
            <Ionicons name="information-circle" size={20} color="#6366F1" />
            <Text style={styles.infoText}>
              Your matches and messages will be waiting for you when you return!
            </Text>
          </View>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
              disabled={loading}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelButtonText}>Stay Signed In</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.signOutButton}
              onPress={onConfirm}
              disabled={loading}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#6366F1', '#8B5CF6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.signOutGradient}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="log-out-outline" size={20} color="#fff" />
                    <Text style={styles.signOutButtonText}>Sign Out</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  container: {
    width: screenWidth - 48,
    maxWidth: 360,
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
  },
  iconContainer: {
    marginBottom: 20,
  },
  iconGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 24,
    gap: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#4338CA',
    lineHeight: 18,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  cancelButton: {
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  signOutButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  signOutGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  signOutButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});

