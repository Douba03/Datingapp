import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';

interface WarningModalProps {
  visible: boolean;
  reason: string;
  onAcknowledge: () => void;
}

export function WarningModal({ visible, reason, onAcknowledge }: WarningModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onAcknowledge}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Warning Icon */}
          <View style={styles.iconContainer}>
            <View style={styles.iconCircle}>
              <Text style={styles.iconText}>⚠️</Text>
            </View>
          </View>

          {/* Title */}
          <Text style={styles.title}>WARNING FROM ADMIN</Text>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Message */}
          <Text style={styles.message}>
            You have been warned by an administrator.
          </Text>

          {/* Reason Box */}
          <View style={styles.reasonContainer}>
            <Text style={styles.reasonLabel}>Reason:</Text>
            <Text style={styles.reasonText}>{reason}</Text>
          </View>

          {/* Guidelines Text */}
          <Text style={styles.guidelinesText}>
            Please make sure to follow the community rules and guidelines.
          </Text>

          {/* Action Button */}
          <TouchableOpacity
            style={styles.button}
            onPress={onAcknowledge}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>I Understand</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const { width } = Dimensions.get('window');
const modalWidth = Math.min(width - 48, 400);

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContainer: {
    width: modalWidth,
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 2,
    borderColor: '#fbbf24',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fef3c7',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fbbf24',
  },
  iconText: {
    fontSize: 48,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fbbf24',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: 1,
  },
  divider: {
    height: 2,
    backgroundColor: '#fbbf24',
    marginBottom: 20,
    borderRadius: 1,
  },
  message: {
    fontSize: 16,
    color: '#e5e5e5',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 24,
  },
  reasonContainer: {
    backgroundColor: '#292524',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#fbbf24',
  },
  reasonLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fbbf24',
    marginBottom: 8,
  },
  reasonText: {
    fontSize: 15,
    color: '#ffffff',
    lineHeight: 22,
  },
  guidelinesText: {
    fontSize: 14,
    color: '#a3a3a3',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  button: {
    backgroundColor: '#fbbf24',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
    shadowColor: '#fbbf24',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    letterSpacing: 0.5,
  },
});

