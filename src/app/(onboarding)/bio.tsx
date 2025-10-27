import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../../components/ui/Button';
import { colors } from '../../components/theme/colors';
import { useOnboarding } from '../../contexts/OnboardingContext';

const BIO_MAX_LENGTH = 500;

const bioPrompts = [
  "I'm passionate about...",
  "My ideal weekend involves...",
  "I'm looking for someone who...",
  "You should know that I...",
  "My friends describe me as...",
  "I'm always down to...",
];

export default function BioScreen() {
  const router = useRouter();
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
    // Save bio to context
    updateData({ bio });
    console.log('[Bio] Saved bio, navigating to interests...');
    router.push('/(onboarding)/interests');
  };

  const handleSkip = () => {
    // Save empty bio
    updateData({ bio: '' });
    router.push('/(onboarding)/interests');
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header with progress */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, { width: '42%' }]} />
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            {/* Title */}
            <View style={styles.titleSection}>
              <Text style={styles.title}>Write your bio</Text>
              <Text style={styles.subtitle}>
                Tell others about yourself. What makes you unique?
              </Text>
            </View>

            {/* Bio Input */}
            <View style={styles.inputSection}>
              <TextInput
                style={styles.bioInput}
                placeholder="Start writing your bio here..."
                placeholderTextColor={colors.textSecondary}
                value={bio}
                onChangeText={setBio}
                multiline
                maxLength={BIO_MAX_LENGTH}
                textAlignVertical="top"
              />
              <Text style={styles.charCount}>
                {bio.length} / {BIO_MAX_LENGTH}
              </Text>
            </View>

            {/* Bio Prompts */}
            <View style={styles.promptsSection}>
              <Text style={styles.promptsTitle}>💡 Need inspiration? Try these prompts:</Text>
              <View style={styles.promptsList}>
                {bioPrompts.map((prompt, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.promptChip}
                    onPress={() => handlePromptSelect(prompt)}
                  >
                    <Text style={styles.promptText}>{prompt}</Text>
                    <Ionicons name="add" size={16} color={colors.primary} />
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Tips */}
            <View style={styles.tipsSection}>
              <Text style={styles.tipsTitle}>✨ Bio Tips</Text>
              <View style={styles.tipsList}>
                <TipItem text="Be authentic and genuine" />
                <TipItem text="Mention your hobbies and interests" />
                <TipItem text="Add a touch of humor" />
                <TipItem text="Keep it positive and upbeat" />
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity onPress={handleSkip}>
            <Text style={styles.skipText}>Skip for now</Text>
          </TouchableOpacity>
          <Button
            title="Continue"
            onPress={handleContinue}
            style={styles.continueButton}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function TipItem({ text }: { text: string }) {
  return (
    <View style={styles.tipItem}>
      <View style={styles.tipBullet} />
      <Text style={styles.tipText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
    marginBottom: 12,
  },
  progressContainer: {
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
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
    marginBottom: 32,
    marginTop: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  inputSection: {
    marginBottom: 24,
  },
  bioInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: colors.text,
    minHeight: 150,
  },
  charCount: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'right',
    marginTop: 8,
  },
  promptsSection: {
    marginBottom: 24,
  },
  promptsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  promptsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  promptChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  promptText: {
    fontSize: 14,
    color: colors.text,
  },
  tipsSection: {
    backgroundColor: `${colors.primary}10`,
    borderRadius: 12,
    padding: 16,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  tipsList: {
    gap: 8,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  tipBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
    marginTop: 7,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  footer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  skipText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '500',
  },
  continueButton: {
    flex: 1,
    marginLeft: 16,
    paddingVertical: 14,
  },
});
