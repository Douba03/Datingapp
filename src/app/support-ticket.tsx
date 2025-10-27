import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
  ActivityIndicator,
  Modal,
  Animated,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../services/supabase/client';
import { colors } from '../components/theme/colors';
import { Stack } from 'expo-router';

type TicketCategory = 'technical' | 'account' | 'billing' | 'safety' | 'feedback' | 'other';

interface CategoryOption {
  id: TicketCategory;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  description: string;
}

const CATEGORIES: CategoryOption[] = [
  {
    id: 'technical',
    label: 'Technical Issue',
    icon: 'bug',
    description: 'App crashes, bugs, or errors',
  },
  {
    id: 'account',
    label: 'Account Issue',
    icon: 'person-circle',
    description: 'Login, profile, or account problems',
  },
  {
    id: 'billing',
    label: 'Billing & Payments',
    icon: 'card',
    description: 'Subscription or payment issues',
  },
  {
    id: 'safety',
    label: 'Safety Concern',
    icon: 'shield-checkmark',
    description: 'Report safety or security issues',
  },
  {
    id: 'feedback',
    label: 'Feedback',
    icon: 'chatbubble-ellipses',
    description: 'Suggestions or feature requests',
  },
  {
    id: 'other',
    label: 'Other',
    icon: 'help-circle',
    description: 'Something else',
  },
];

export default function SupportTicketScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState<TicketCategory>('other');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [scaleAnim] = useState(new Animated.Value(0));
  const [checkmarkAnim] = useState(new Animated.Value(0));

  const showSuccessAnimation = () => {
    setShowSuccessModal(true);
    
    // Scale animation
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start();

    // Checkmark animation
    setTimeout(() => {
      Animated.spring(checkmarkAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }).start();
    }, 300);
  };

  const hideSuccessModal = () => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(checkmarkAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowSuccessModal(false);
      router.push('/(tabs)/settings');
    });
  };

  const handleSubmit = async () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to submit a ticket');
      return;
    }

    if (!subject.trim()) {
      Alert.alert('Missing Subject', 'Please enter a subject for your ticket');
      return;
    }

    if (!email.trim()) {
      Alert.alert('Missing Email', 'Please enter your email address so we can contact you');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert('Invalid Email', 'Please enter a valid email address');
      return;
    }

    if (!message.trim()) {
      Alert.alert('Missing Message', 'Please describe your issue');
      return;
    }

    setSubmitting(true);

    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .insert({
          user_id: user.id,
          subject: subject.trim(),
          category,
          message: message.trim(),
          email: email.trim(),
          status: 'open',
          priority: 'normal',
        })
        .select()
        .single();

      if (error) {
        console.error('[SupportTicket] Error creating ticket:', error);
        throw error;
      }

      console.log('[SupportTicket] Ticket created:', data);

      // Show success animation instead of alert
      showSuccessAnimation();
    } catch (error: any) {
      console.error('[SupportTicket] Error:', error);
      Alert.alert('Error', error?.message || 'Failed to submit ticket. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Stack.Screen 
        options={{ 
          title: 'Contact Support',
          headerShown: false 
        }} 
      />
      <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.push('/(tabs)/settings')}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Contact Support</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content}>
        {/* Category Selection */}
        <Text style={styles.sectionTitle}>Category *</Text>
        <View style={styles.categoriesContainer}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.categoryCard,
                category === cat.id && styles.categoryCardSelected,
              ]}
              onPress={() => setCategory(cat.id)}
            >
              <View style={styles.categoryHeader}>
                <Ionicons
                  name={cat.icon}
                  size={24}
                  color={category === cat.id ? colors.primary : colors.text}
                />
                <Text
                  style={[
                    styles.categoryLabel,
                    category === cat.id && styles.categoryLabelSelected,
                  ]}
                >
                  {cat.label}
                </Text>
              </View>
              <Text style={styles.categoryDescription}>{cat.description}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Subject */}
        <Text style={styles.sectionTitle}>Subject *</Text>
        <TextInput
          style={styles.input}
          placeholder="Brief summary of your issue"
          placeholderTextColor={colors.textSecondary}
          value={subject}
          onChangeText={setSubject}
          maxLength={200}
        />

        {/* Email */}
        <Text style={styles.sectionTitle}>Email Address *</Text>
        <TextInput
          style={styles.input}
          placeholder="your.email@example.com"
          placeholderTextColor={colors.textSecondary}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />

        {/* Message */}
        <Text style={styles.sectionTitle}>Message *</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Please describe your issue in detail..."
          placeholderTextColor={colors.textSecondary}
          value={message}
          onChangeText={setMessage}
          multiline
          numberOfLines={8}
          textAlignVertical="top"
        />

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="send" size={20} color="#fff" />
              <Text style={styles.submitButtonText}>Submit Ticket</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        transparent
        animationType="fade"
        onRequestClose={hideSuccessModal}
      >
        <View style={styles.modalOverlay}>
          <Animated.View
            style={[
              styles.modalContainer,
              {
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            {/* Success Icon */}
            <View style={styles.successIconContainer}>
              <View style={styles.successCircle}>
                <Animated.View
                  style={[
                    styles.checkmarkContainer,
                    {
                      transform: [{ scale: checkmarkAnim }],
                    },
                  ]}
                >
                  <Ionicons name="checkmark" size={40} color="#fff" />
                </Animated.View>
              </View>
            </View>

            {/* Success Text */}
            <Text style={styles.successTitle}>Ticket Submitted!</Text>
            <Text style={styles.successMessage}>
              Your support ticket has been submitted successfully.{'\n'}
              Our team will review it and get back to you soon.
            </Text>

            {/* Action Button */}
            <TouchableOpacity
              style={styles.successButton}
              onPress={hideSuccessModal}
            >
              <Text style={styles.successButtonText}>Back to Settings</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
    marginTop: 8,
  },
  categoriesContainer: {
    marginBottom: 24,
  },
  categoryCard: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: colors.border,
  },
  categoryCardSelected: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}10`,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  categoryLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 12,
  },
  categoryLabelSelected: {
    color: colors.primary,
  },
  categoryDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 36,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.text,
    marginBottom: 20,
  },
  textArea: {
    minHeight: 150,
    maxHeight: 300,
  },
  submitButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  bottomSpacer: {
    height: 40,
  },
  // Success Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContainer: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    maxWidth: 340,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  successIconContainer: {
    marginBottom: 24,
  },
  successCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#10B981',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  checkmarkContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  successMessage: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  successButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    minWidth: 200,
  },
  successButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

