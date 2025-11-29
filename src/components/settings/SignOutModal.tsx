import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SignOutModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  loading: boolean;
  colors: any;
}

export function SignOutModal({ visible, onClose, onConfirm, loading, colors }: SignOutModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: colors.surface }]}>
          {/* Header with emoji */}
          <View style={styles.header}>
            <View style={styles.emojiCircle}>
              <Text style={styles.emoji}>👋</Text>
            </View>
            <Text style={[styles.title, { color: colors.text }]}>Leaving so soon?</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              We'll miss you! Your matches will be waiting when you return 💕
            </Text>
          </View>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.stayButton, { backgroundColor: colors.primary }]}
              onPress={onClose}
              disabled={loading}
            >
              <Ionicons name="heart" size={18} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.stayButtonText}>Stay & Keep Matching</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.signOutButton, { borderColor: colors.border }]}
              onPress={onConfirm}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color={colors.textSecondary} />
              ) : (
                <>
                  <Ionicons name="log-out-outline" size={18} color={colors.textSecondary} style={{ marginRight: 8 }} />
                  <Text style={[styles.signOutButtonText, { color: colors.textSecondary }]}>Sign Out</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Footer note */}
          <Text style={[styles.footerNote, { color: colors.textSecondary }]}>
            Don't worry, your profile stays safe!
          </Text>
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
    borderRadius: 24,
    width: '100%',
    maxWidth: 340,
    paddingVertical: 32,
    paddingHorizontal: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
  },
  header: {
    alignItems: 'center',
    marginBottom: 28,
  },
  emojiCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emoji: {
    fontSize: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 8,
  },
  buttonContainer: {
    gap: 12,
  },
  stayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 14,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  stayButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    backgroundColor: 'transparent',
  },
  signOutButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  footerNote: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 20,
    fontStyle: 'italic',
  },
});

