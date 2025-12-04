import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

const { width: screenWidth } = Dimensions.get('window');

interface DeleteAccountModalProps {
  visible: boolean;
  loading?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function DeleteAccountModal({ visible, loading, onClose, onConfirm }: DeleteAccountModalProps) {
  const [confirmText, setConfirmText] = useState('');
  const isConfirmEnabled = confirmText.toLowerCase() === 'delete';

  const handleClose = () => {
    setConfirmText('');
    onClose();
  };

  const handleConfirm = () => {
    if (isConfirmEnabled) {
      onConfirm();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header with Warning Icon */}
          <View style={styles.iconContainer}>
            <LinearGradient
              colors={['#EF4444', '#DC2626']}
              style={styles.iconGradient}
            >
              <Ionicons name="warning" size={40} color="#fff" />
            </LinearGradient>
          </View>

          {/* Title */}
          <Text style={styles.title}>Delete Account?</Text>

          {/* Warning Badge */}
          <View style={styles.warningBadge}>
            <Ionicons name="alert-circle" size={16} color="#DC2626" />
            <Text style={styles.warningBadgeText}>This action cannot be undone</Text>
          </View>

          {/* Description */}
          <Text style={styles.description}>
            You're about to permanently delete your account and all associated data, including:
          </Text>

          {/* Data List */}
          <View style={styles.dataList}>
            <View style={styles.dataItem}>
              <Ionicons name="heart" size={18} color="#EF4444" />
              <Text style={styles.dataItemText}>All your matches</Text>
            </View>
            <View style={styles.dataItem}>
              <Ionicons name="chatbubbles" size={18} color="#EF4444" />
              <Text style={styles.dataItemText}>All your messages</Text>
            </View>
            <View style={styles.dataItem}>
              <Ionicons name="person" size={18} color="#EF4444" />
              <Text style={styles.dataItemText}>Your profile and photos</Text>
            </View>
            <View style={styles.dataItem}>
              <Ionicons name="star" size={18} color="#EF4444" />
              <Text style={styles.dataItemText}>Any premium subscription</Text>
            </View>
          </View>

          {/* Confirmation Input */}
          <View style={styles.confirmSection}>
            <Text style={styles.confirmLabel}>
              Type <Text style={styles.confirmKeyword}>DELETE</Text> to confirm:
            </Text>
            <TextInput
              style={[
                styles.confirmInput,
                isConfirmEnabled && styles.confirmInputValid,
              ]}
              placeholder="Type DELETE here"
              placeholderTextColor={colors.textSecondary}
              value={confirmText}
              onChangeText={setConfirmText}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
            />
          </View>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleClose}
              disabled={loading}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={18} color={colors.text} />
              <Text style={styles.cancelButtonText}>Keep My Account</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.deleteButton,
                !isConfirmEnabled && styles.deleteButtonDisabled,
              ]}
              onPress={handleConfirm}
              disabled={loading || !isConfirmEnabled}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="trash" size={18} color="#fff" />
                  <Text style={styles.deleteButtonText}>Delete Forever</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Footer Note */}
          <View style={styles.footerNote}>
            <Ionicons name="shield-checkmark" size={14} color={colors.textSecondary} />
            <Text style={styles.footerNoteText}>
              Your data will be permanently removed within 30 days
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    width: screenWidth - 40,
    maxWidth: 380,
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 20,
  },
  iconContainer: {
    marginBottom: 16,
  },
  iconGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  warningBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 16,
    gap: 6,
  },
  warningBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#DC2626',
  },
  description: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  dataList: {
    width: '100%',
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  dataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 10,
  },
  dataItemText: {
    fontSize: 14,
    color: '#991B1B',
    fontWeight: '500',
  },
  confirmSection: {
    width: '100%',
    marginBottom: 20,
  },
  confirmLabel: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  confirmKeyword: {
    fontWeight: '800',
    color: '#DC2626',
  },
  confirmInput: {
    width: '100%',
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    color: colors.text,
    textAlign: 'center',
    fontWeight: '600',
    backgroundColor: colors.background,
  },
  confirmInputValid: {
    borderColor: '#DC2626',
    backgroundColor: '#FEF2F2',
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  cancelButton: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  deleteButton: {
    flexDirection: 'row',
    backgroundColor: '#DC2626',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  deleteButtonDisabled: {
    backgroundColor: '#D1D5DB',
    shadowOpacity: 0,
    elevation: 0,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  footerNote: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    gap: 6,
  },
  footerNoteText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
});

