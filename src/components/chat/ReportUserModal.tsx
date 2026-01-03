import React, { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Dimensions, ScrollView, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';

interface ReportUserModalProps {
  visible: boolean;
  userName: string;
  onReport: (reason: string, details: string) => void;
  onCancel: () => void;
}

const reportReasons = [
  { key: 'spam', label: 'Spam', icon: 'mail' as const, description: 'Unwanted or repetitive messages', color: '#F59E0B' },
  { key: 'inappropriate', label: 'Inappropriate Content', icon: 'ban' as const, description: 'Sexual, violent, or offensive content', color: '#EF4444' },
  { key: 'fake_profile', label: 'Fake Profile', icon: 'person-remove' as const, description: 'Fake photos or misleading information', color: '#8B5CF6' },
  { key: 'harassment', label: 'Harassment', icon: 'alert-circle' as const, description: 'Bullying, threats, or hate speech', color: '#DC2626' },
  { key: 'scam', label: 'Scam or Fraud', icon: 'warning' as const, description: 'Asking for money or suspicious activity', color: '#F97316' },
  { key: 'other', label: 'Other', icon: 'help-circle' as const, description: 'Something else that concerns you', color: '#6B7280' },
];

export function ReportUserModal({ visible, userName, onReport, onCancel }: ReportUserModalProps) {
  const { colors, isDarkMode } = useTheme();
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [details, setDetails] = useState('');
  const [step, setStep] = useState<'select' | 'details'>('select');

  const handleReasonSelect = (reason: string) => {
    setSelectedReason(reason);
    setStep('details');
  };

  const handleSubmitReport = () => {
    if (selectedReason) {
      onReport(selectedReason, details);
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
    setDetails('');
  };

  const selectedReasonData = reportReasons.find(r => r.key === selectedReason);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleCancel}
    >
      <View style={styles.overlay}>
        <View style={[styles.modalContainer, { backgroundColor: colors.surface }]}>
          {/* Orange Gradient Top Border */}
          <View style={styles.topBorder} />
          
          {/* Icon Badge */}
          <View style={styles.iconContainer}>
            <View style={styles.iconCircle}>
              <Text style={styles.iconText}>🚩</Text>
            </View>
          </View>

          {step === 'select' ? (
            <>
              {/* Title */}
              <Text style={[styles.title, { color: colors.text }]}>Report User</Text>
              
              {/* Subtitle */}
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                Why are you reporting <Text style={styles.userName}>{userName}</Text>?
              </Text>

              {/* Divider */}
              <View style={styles.divider} />

              {/* Reasons List */}
              <ScrollView style={styles.reasonsContainer} showsVerticalScrollIndicator={false}>
                {reportReasons.map((reason) => (
                  <TouchableOpacity
                    key={reason.key}
                    style={[styles.reasonCard, { backgroundColor: isDarkMode ? colors.background : '#F9FAFB', borderColor: colors.border }]}
                    onPress={() => handleReasonSelect(reason.key)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.reasonIcon, { backgroundColor: `${reason.color}20` }]}>
                      <Ionicons name={reason.icon} size={24} color={reason.color} />
                    </View>
                    <View style={styles.reasonContent}>
                      <Text style={[styles.reasonLabel, { color: colors.text }]}>{reason.label}</Text>
                      <Text style={[styles.reasonDescription, { color: colors.textSecondary }]}>{reason.description}</Text>
                    </View>
                    <Text style={[styles.reasonArrow, { color: colors.textSecondary }]}>›</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Info Box */}
              <View style={[styles.infoBox, { backgroundColor: isDarkMode ? 'rgba(59, 130, 246, 0.15)' : '#EFF6FF' }]}>
                <Text style={styles.infoIcon}>🔒</Text>
                <Text style={[styles.infoText, { color: isDarkMode ? colors.primary : '#1E40AF' }]}>
                  Your report is anonymous and will be reviewed by our team. We take all reports seriously.
                </Text>
              </View>

              {/* Cancel Button */}
              <TouchableOpacity 
                style={[styles.cancelButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={handleCancel}
                activeOpacity={0.8}
              >
                <Text style={[styles.cancelButtonText, { color: colors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              {/* Details Step */}
              <Text style={[styles.title, { color: colors.text }]}>Add Details</Text>
              
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                Help us understand what happened with <Text style={styles.userName}>{userName}</Text>
              </Text>

              <View style={styles.divider} />

              <ScrollView 
                style={styles.detailsScrollView}
                showsVerticalScrollIndicator={false}
              >
                {/* Selected Reason Display */}
                {selectedReasonData && (
                  <View style={[styles.selectedReasonBox, { borderLeftColor: selectedReasonData.color }]}>
                    <Text style={styles.selectedReasonIcon}>{selectedReasonData.icon}</Text>
                    <View style={styles.selectedReasonContent}>
                      <Text style={styles.selectedReasonLabel}>Reporting for:</Text>
                      <Text style={[styles.selectedReasonText, { color: selectedReasonData.color }]}>
                        {selectedReasonData.label}
                      </Text>
                    </View>
                  </View>
                )}

                {/* Details Input */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Additional Details (Optional)</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="What happened? Provide any relevant details..."
                    placeholderTextColor="#9CA3AF"
                    value={details}
                    onChangeText={setDetails}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                  />
                  <Text style={styles.inputHint}>
                    The more details you provide, the better we can help.
                  </Text>
                </View>

                {/* Guidelines Box */}
                <View style={styles.guidelinesBox}>
                  <View style={styles.guidelinesHeader}>
                    <Ionicons name="information-circle" size={18} color="#666" style={styles.guidelinesIcon} />
                    <Text style={styles.guidelinesTitle}>What happens next?</Text>
                  </View>
                  <View style={styles.guidelinesList}>
                    <Text style={styles.guidelinesItem}>• Team reviews within 24 hours</Text>
                    <Text style={styles.guidelinesItem}>• May take action against user</Text>
                    <Text style={styles.guidelinesItem}>• You remain anonymous</Text>
                    <Text style={styles.guidelinesItem}>• False reports = restrictions</Text>
                  </View>
                </View>
              </ScrollView>

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
                  style={styles.submitButton}
                  onPress={handleSubmitReport}
                  activeOpacity={0.8}
                >
                  <Text style={styles.submitButtonText}>🚩 Submit Report</Text>
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
    maxHeight: height * 0.9,
    overflow: 'hidden',
    position: 'relative',
  },
  topBorder: {
    height: 6,
    backgroundColor: '#F59E0B',
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
    backgroundColor: '#FEF3C7',
    borderWidth: 4,
    borderColor: '#F59E0B',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#F59E0B',
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
    color: '#F59E0B',
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
    color: '#F59E0B',
    fontSize: 17,
  },
  divider: {
    height: 2,
    backgroundColor: '#F59E0B',
    marginHorizontal: 40,
    marginTop: 20,
    marginBottom: 20,
    borderRadius: 1,
    opacity: 0.3,
  },
  reasonsContainer: {
    maxHeight: height * 0.4,
    paddingHorizontal: 20,
  },
  detailsScrollView: {
    maxHeight: height * 0.45,
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
    backgroundColor: '#DBEAFE',
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
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
  },
  selectedReasonIcon: {
    fontSize: 28,
    marginRight: 10,
  },
  selectedReasonContent: {
    flex: 1,
  },
  selectedReasonLabel: {
    fontSize: 12,
    color: '#92400E',
    fontWeight: '600',
    marginBottom: 4,
  },
  selectedReasonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: '#1F2937',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    minHeight: 90,
  },
  inputHint: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 8,
    fontStyle: 'italic',
  },
  guidelinesBox: {
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  guidelinesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  guidelinesIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  guidelinesTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#065F46',
  },
  guidelinesList: {
    marginLeft: 4,
  },
  guidelinesItem: {
    fontSize: 12,
    color: '#047857',
    lineHeight: 18,
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
  submitButton: {
    flex: 2,
    backgroundColor: '#F59E0B',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});

