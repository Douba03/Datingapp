import React, { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Dimensions, ScrollView } from 'react-native';

interface BlockUserModalProps {
  visible: boolean;
  userName: string;
  onBlock: (reason: string, details: string) => void;
  onCancel: () => void;
}

const blockReasons = [
  { key: 'spam', label: 'Spam', icon: '📧', description: 'Sending unwanted messages' },
  { key: 'harassment', label: 'Harassment', icon: '😠', description: 'Abusive or threatening behavior' },
  { key: 'inappropriate', label: 'Inappropriate', icon: '🚫', description: 'Inappropriate content or behavior' },
  { key: 'fake_profile', label: 'Fake Profile', icon: '🎭', description: 'Fake or misleading profile' },
  { key: 'scam', label: 'Scam', icon: '⚠️', description: 'Suspicious or fraudulent activity' },
  { key: 'other', label: 'Other', icon: '❓', description: 'Other reason' },
];

export function BlockUserModal({ visible, userName, onBlock, onCancel }: BlockUserModalProps) {
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [details, setDetails] = useState('');
  const [step, setStep] = useState<'select' | 'confirm'>('select');

  const handleReasonSelect = (reason: string) => {
    setSelectedReason(reason);
    setStep('confirm');
  };

  const handleConfirmBlock = () => {
    if (selectedReason) {
      onBlock(selectedReason, details);
      // Reset state
      setSelectedReason(null);
      setDetails('');
      setStep('select');
    }
  };

  const handleCancel = () => {
    setSelectedReason(null);
    setDetails('');
    setStep('select');
    onCancel();
  };

  const handleBack = () => {
    setStep('select');
    setSelectedReason(null);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Red Gradient Top Border */}
          <View style={styles.topBorder} />
          
          {/* Icon Badge */}
          <View style={styles.iconContainer}>
            <View style={styles.iconCircle}>
              <Text style={styles.iconText}>🚫</Text>
            </View>
          </View>

          {step === 'select' ? (
            <>
              {/* Title */}
              <Text style={styles.title}>Block User</Text>
              
              {/* Subtitle */}
              <Text style={styles.subtitle}>
                Why do you want to block <Text style={styles.userName}>{userName}</Text>?
              </Text>

              {/* Divider */}
              <View style={styles.divider} />

              {/* Reasons List */}
              <ScrollView style={styles.reasonsContainer} showsVerticalScrollIndicator={false}>
                {blockReasons.map((reason) => (
                  <TouchableOpacity
                    key={reason.key}
                    style={styles.reasonCard}
                    onPress={() => handleReasonSelect(reason.key)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.reasonIcon}>
                      <Text style={styles.reasonIconText}>{reason.icon}</Text>
                    </View>
                    <View style={styles.reasonContent}>
                      <Text style={styles.reasonLabel}>{reason.label}</Text>
                      <Text style={styles.reasonDescription}>{reason.description}</Text>
                    </View>
                    <Text style={styles.reasonArrow}>›</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Info Box */}
              <View style={styles.infoBox}>
                <Text style={styles.infoIcon}>ℹ️</Text>
                <Text style={styles.infoText}>
                  Blocking will prevent you from seeing or matching with this user again.
                </Text>
              </View>

              {/* Cancel Button */}
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={handleCancel}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              {/* Confirm Step */}
              <Text style={styles.title}>Confirm Block</Text>
              
              <Text style={styles.subtitle}>
                Are you sure you want to block <Text style={styles.userName}>{userName}</Text>?
              </Text>

              <View style={styles.divider} />

              {/* Selected Reason Display */}
              <View style={styles.selectedReasonBox}>
                <Text style={styles.selectedReasonIcon}>
                  {blockReasons.find(r => r.key === selectedReason)?.icon}
                </Text>
                <View style={styles.selectedReasonContent}>
                  <Text style={styles.selectedReasonLabel}>Reason:</Text>
                  <Text style={styles.selectedReasonText}>
                    {blockReasons.find(r => r.key === selectedReason)?.label}
                  </Text>
                </View>
              </View>

              {/* Warning Box */}
              <View style={styles.warningBox}>
                <View style={styles.warningHeader}>
                  <Text style={styles.warningIcon}>⚠️</Text>
                  <Text style={styles.warningTitle}>This action will:</Text>
                </View>
                <View style={styles.warningList}>
                  <Text style={styles.warningItem}>• Remove this match from your list</Text>
                  <Text style={styles.warningItem}>• Prevent future matches with this user</Text>
                  <Text style={styles.warningItem}>• Hide all messages from this conversation</Text>
                  <Text style={styles.warningItem}>• Cannot be undone easily</Text>
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.buttonContainer}>
                <TouchableOpacity 
                  style={styles.backButton}
                  onPress={handleBack}
                  activeOpacity={0.8}
                >
                  <Text style={styles.backButtonText}>← Back</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.blockButton}
                  onPress={handleConfirmBlock}
                  activeOpacity={0.8}
                >
                  <Text style={styles.blockButtonText}>🚫 Block User</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    width: Math.min(width - 40, 450),
    maxHeight: height * 0.85,
    overflow: 'hidden',
    position: 'relative',
  },
  topBorder: {
    height: 6,
    background: 'linear-gradient(90deg, #EF4444 0%, #DC2626 50%, #B91C1C 100%)',
    backgroundColor: '#EF4444', // Fallback for non-web
  },
  iconContainer: {
    alignItems: 'center',
    marginTop: 32,
    zIndex: 10,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FEE2E2',
    borderWidth: 4,
    borderColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  iconText: {
    fontSize: 50,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#EF4444',
    textAlign: 'center',
    marginTop: 24,
    marginHorizontal: 20,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 12,
    marginHorizontal: 24,
    lineHeight: 24,
  },
  userName: {
    fontWeight: '700',
    color: '#EF4444',
    fontSize: 17,
  },
  divider: {
    height: 2,
    backgroundColor: '#EF4444',
    marginHorizontal: 40,
    marginTop: 20,
    marginBottom: 20,
    borderRadius: 1,
    opacity: 0.3,
  },
  reasonsContainer: {
    maxHeight: 320,
    paddingHorizontal: 20,
  },
  reasonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  reasonIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  reasonIconText: {
    fontSize: 24,
  },
  reasonContent: {
    flex: 1,
  },
  reasonLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  reasonDescription: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  reasonArrow: {
    fontSize: 32,
    color: '#9CA3AF',
    marginLeft: 8,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  infoIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#1E40AF',
    lineHeight: 20,
  },
  cancelButton: {
    backgroundColor: '#ffffff',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  cancelButtonText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '600',
  },
  selectedReasonBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  selectedReasonIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  selectedReasonContent: {
    flex: 1,
  },
  selectedReasonLabel: {
    fontSize: 12,
    color: '#991B1B',
    fontWeight: '600',
    marginBottom: 4,
  },
  selectedReasonText: {
    fontSize: 16,
    color: '#DC2626',
    fontWeight: '700',
  },
  warningBox: {
    backgroundColor: '#FEF3C7',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  warningIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#92400E',
  },
  warningList: {
    marginLeft: 4,
  },
  warningItem: {
    fontSize: 13,
    color: '#78350F',
    lineHeight: 22,
  },
  buttonContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 12,
  },
  backButton: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  backButtonText: {
    color: '#6B7280',
    fontSize: 15,
    fontWeight: '600',
  },
  blockButton: {
    flex: 2,
    backgroundColor: '#EF4444',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  blockButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});


