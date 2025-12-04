import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../components/theme/colors';
import { useOnboarding } from '../../contexts/OnboardingContext';

const BIO_MAX_LENGTH = 500;

const bioPrompts = [
  "I'm passionate about...",
  "My ideal weekend involves...",
  "I'm looking for someone who...",
  "You should know that I...",
  "My friends describe me as...",
];

export default function BioScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { updateData } = useOnboarding();
  const [bio, setBio] = useState('');

  const handlePromptSelect = (prompt: string) => {
    if (bio.trim()) {
      setBio(bio + '\n\n' + prompt);
    } else {
      setBio(prompt);
    }
  };

  const handleContinue = () => {
    updateData({ bio });
    router.push('/(onboarding)/interests');
  };

  const handleSkip = () => {
    updateData({ bio: '' });
    router.push('/(onboarding)/interests');
  };

  return (
    <LinearGradient
      colors={[colors.backgroundGradientStart, colors.backgroundGradientEnd]}
      style={styles.container}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          
          <View style={styles.progressContainer}>
            <LinearGradient
              colors={[colors.primary, colors.primaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.progressBar, { width: '42%' }]}
            />
          </View>
          
          <Text style={styles.stepText}>Step 3 of 7</Text>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            {/* Title */}
            <View style={styles.titleSection}>
              <Ionicons name="create" size={48} color="#FF6B9D" />
              <Text style={styles.title}>Tell your story</Text>
              <Text style={styles.subtitle}>
                Let others know what makes you unique!
              </Text>
            </View>

            {/* Bio Input */}
            <View style={styles.inputSection}>
              <View style={styles.inputWrapper}>
              <TextInput
                style={styles.bioInput}
                  placeholder="Write something about yourself..."
                placeholderTextColor={colors.textSecondary}
                value={bio}
                onChangeText={setBio}
                multiline
                maxLength={BIO_MAX_LENGTH}
                textAlignVertical="top"
              />
              </View>
              <View style={styles.charCountContainer}>
                <Ionicons 
                  name={bio.length > 0 ? "create" : "create-outline"} 
                  size={16} 
                  color={bio.length > BIO_MAX_LENGTH * 0.8 ? colors.warning : colors.textSecondary} 
                />
                <Text style={[
                  styles.charCount,
                  bio.length > BIO_MAX_LENGTH * 0.8 && { color: colors.warning }
                ]}>
                {bio.length} / {BIO_MAX_LENGTH}
              </Text>
              </View>
            </View>

            {/* Prompts Section */}
            <View style={styles.promptsSection}>
              <View style={styles.promptsHeader}>
                <View style={styles.promptsIconContainer}>
                  <Ionicons name="bulb" size={18} color="#FFB347" />
                </View>
                <Text style={styles.promptsTitle}>Need inspiration?</Text>
              </View>
              <View style={styles.promptsList}>
                {bioPrompts.map((prompt, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.promptChip}
                    onPress={() => handlePromptSelect(prompt)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.promptText}>{prompt}</Text>
                    <View style={styles.addPromptIcon}>
                      <Ionicons name="add" size={14} color={colors.primary} />
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Tips Card */}
            <View style={styles.tipsCard}>
              <Text style={styles.tipsTitle}>Pro Tips</Text>
              <View style={styles.tipsList}>
                <TipItem text="Be authentic and genuine" />
                <TipItem text="Mention your hobbies" />
                <TipItem text="Add a touch of humor" />
                <TipItem text="Keep it positive!" />
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
          <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
            <Text style={styles.skipText}>Skip for now</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.continueButton}
            onPress={handleContinue}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={[colors.primary, colors.primaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.buttonGradient}
            >
              <Text style={styles.buttonText}>Continue</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

function TipItem({ text }: { text: string }) {
  return (
    <View style={styles.tipItem}>
      <Ionicons name="checkmark-circle" size={16} color={colors.success} />
      <Text style={styles.tipText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  progressContainer: {
    height: 6,
    backgroundColor: 'rgba(255, 107, 157, 0.15)',
    borderRadius: 3,
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  stepText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  content: {
    paddingHorizontal: 24,
  },
  titleSection: {
    marginBottom: 28,
    alignItems: 'center',
  },
  emoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 22,
    textAlign: 'center',
  },
  inputSection: {
    marginBottom: 24,
  },
  inputWrapper: {
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  bioInput: {
    paddingHorizontal: 20,
    paddingVertical: 18,
    fontSize: 16,
    color: colors.text,
    minHeight: 160,
    lineHeight: 24,
  },
  charCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 10,
    gap: 6,
  },
  charCount: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  promptsSection: {
    marginBottom: 24,
  },
  promptsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 10,
  },
  promptsIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 179, 71, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  promptsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  promptsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  promptChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 24,
    paddingVertical: 10,
    paddingLeft: 16,
    paddingRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  promptText: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  addPromptIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: `${colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tipsCard: {
    backgroundColor: `${colors.primary}08`,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: `${colors.primary}15`,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 14,
  },
  tipsList: {
    gap: 10,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 16,
  },
  skipButton: {
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  skipText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
  },
  continueButton: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
});
