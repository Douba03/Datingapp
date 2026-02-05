import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';

interface WaliRequestModalProps {
  visible: boolean;
  onClose: () => void;
  onSend: (message: string) => Promise<{ success: boolean; error?: string }>;
  recipientName: string;
  daysUntilAvailable: number;
  loading?: boolean;
}

export function WaliRequestModal({
  visible,
  onClose,
  onSend,
  recipientName,
  daysUntilAvailable,
  loading = false,
}: WaliRequestModalProps) {
  const { colors } = useTheme();
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const canSend = daysUntilAvailable <= 0;

  const handleSend = async () => {
    if (!message.trim() || !canSend) return;

    setSending(true);
    const result = await onSend(message.trim());
    setSending(false);

    if (result.success) {
      setMessage('');
      onClose();
    }
  };

  const handleClose = () => {
    setMessage('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={handleClose}
        />
        
        <View style={[styles.container, { backgroundColor: colors.surface }]}>
          {/* Header */}
          <LinearGradient
            colors={['#FFD700', '#FFA500']}
            style={styles.header}
          >
            <View style={styles.headerIcon}>
              <Ionicons name="diamond" size={32} color="#fff" />
            </View>
            <Text style={styles.headerTitle}>Wali Request</Text>
            <Text style={styles.headerSubtitle}>
              Take the next step towards marriage
            </Text>
          </LinearGradient>

          {/* Close Button */}
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <Ionicons name="close" size={24} color={colors.textSecondary} />
          </TouchableOpacity>

          {/* Content */}
          <View style={styles.content}>
            {!canSend ? (
              // Not yet available - Professional waiting message
              <View style={styles.waitingContainer}>
                <View style={[styles.waitingIcon, { backgroundColor: `${colors.primary}15` }]}>
                  <Ionicons name="time-outline" size={48} color={colors.primary} />
                </View>
                <Text style={[styles.waitingTitle, { color: colors.text }]}>
                  {daysUntilAvailable} {daysUntilAvailable === 1 ? 'Day' : 'Days'} Remaining
                </Text>
                <Text style={[styles.waitingText, { color: colors.textSecondary }]}>
                  We want to ensure that you and {recipientName} have had enough time to truly get to know each other before taking this important step.
                </Text>
                
                <View style={[styles.questionSection, { backgroundColor: `${colors.primary}05`, borderColor: `${colors.primary}20` }]}>
                  <Text style={[styles.questionTitle, { color: colors.text }]}>
                    💭 Questions to Consider
                  </Text>
                  <Text style={[styles.questionItem, { color: colors.textSecondary }]}>
                    • Have you discussed your religious practices and expectations?
                  </Text>
                  <Text style={[styles.questionItem, { color: colors.textSecondary }]}>
                    • Do you share similar views on family and children?
                  </Text>
                  <Text style={[styles.questionItem, { color: colors.textSecondary }]}>
                    • Have you talked about career goals and living arrangements?
                  </Text>
                  <Text style={[styles.questionItem, { color: colors.textSecondary }]}>
                    • Do your values and life priorities align?
                  </Text>
                  <Text style={[styles.questionItem, { color: colors.textSecondary }]}>
                    • Have you been honest about your past and expectations?
                  </Text>
                </View>

                <View style={[styles.tipBox, { backgroundColor: '#E8F5E9' }]}>
                  <Ionicons name="shield-checkmark" size={20} color="#4CAF50" />
                  <Text style={[styles.tipText, { color: '#2E7D32' }]}>
                    Marriage is a lifelong commitment. Taking time now to ask the right questions will help build a strong foundation for your future together, In Shaa Allah.
                  </Text>
                </View>
              </View>
            ) : (
              // Ready to send
              <>
                <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                  You are about to send a serious request to <Text style={{ fontWeight: '700', color: colors.text }}>{recipientName}</Text> indicating your intention to involve families in your relationship.
                </Text>

                <View style={[styles.warningBox, { backgroundColor: '#FFF3E0' }]}>
                  <Ionicons name="warning-outline" size={20} color="#FF9800" />
                  <Text style={styles.warningText}>
                    This is a significant step. Only send this request if you are genuinely interested in pursuing marriage.
                  </Text>
                </View>

                <Text style={[styles.label, { color: colors.text }]}>
                  Your Message to {recipientName}
                </Text>
                <TextInput
                  style={[styles.input, { 
                    backgroundColor: colors.background,
                    color: colors.text,
                    borderColor: colors.border,
                  }]}
                  placeholder="Write a sincere message about your intentions..."
                  placeholderTextColor={colors.textSecondary}
                  value={message}
                  onChangeText={setMessage}
                  multiline
                  numberOfLines={4}
                  maxLength={500}
                  textAlignVertical="top"
                />
                <Text style={[styles.charCount, { color: colors.textSecondary }]}>
                  {message.length}/500
                </Text>

                <TouchableOpacity
                  style={[
                    styles.sendButton,
                    (!message.trim() || sending) && styles.sendButtonDisabled,
                  ]}
                  onPress={handleSend}
                  disabled={!message.trim() || sending}
                >
                  <LinearGradient
                    colors={message.trim() && !sending ? ['#FFD700', '#FFA500'] : ['#ccc', '#aaa']}
                    style={styles.sendButtonGradient}
                  >
                    {sending ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <Ionicons name="diamond" size={20} color="#fff" />
                        <Text style={styles.sendButtonText}>Send Wali Request</Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  container: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    overflow: 'hidden',
  },
  header: {
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  headerIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  waitingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  waitingIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  waitingTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 12,
  },
  waitingText: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  questionSection: {
    width: '100%',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  questionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  questionItem: {
    fontSize: 14,
    lineHeight: 24,
    marginLeft: 4,
  },
  tipBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  infoText: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 16,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    borderRadius: 12,
    gap: 10,
    marginBottom: 20,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: '#E65100',
    lineHeight: 18,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    minHeight: 120,
  },
  charCount: {
    fontSize: 12,
    textAlign: 'right',
    marginTop: 4,
    marginBottom: 20,
  },
  sendButton: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  sendButtonDisabled: {
    opacity: 0.7,
  },
  sendButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
