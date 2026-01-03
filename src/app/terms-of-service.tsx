import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

export default function TermsOfServiceScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = getStyles(colors);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Terms of Service</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.lastUpdated}>Last Updated: January 2025</Text>

        <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
        <Text style={styles.paragraph}>
          Welcome! By accessing or using our dating application, you agree to be bound by these Terms of Service. 
          If you do not agree to these Terms, please do not use our Service.
        </Text>

        <Text style={styles.sectionTitle}>2. Eligibility</Text>
        <Text style={styles.subsectionTitle}>2.1 Age Requirement</Text>
        <Text style={styles.paragraph}>
          • You must be at least 18 years old to use our Service{'\n'}
          • By creating an account, you represent that you are 18 or older{'\n'}
          • We reserve the right to verify your age and terminate accounts of users under 18
        </Text>

        <Text style={styles.subsectionTitle}>2.2 Account Restrictions</Text>
        <Text style={styles.paragraph}>
          • You may only create one account{'\n'}
          • You cannot create an account if we previously banned you{'\n'}
          • You must use your real identity and accurate information
        </Text>

        <Text style={styles.sectionTitle}>3. Account Registration and Security</Text>
        <Text style={styles.paragraph}>
          • You must provide accurate, current, and complete information{'\n'}
          • You must keep your account information up to date{'\n'}
          • You are responsible for maintaining the confidentiality of your password{'\n'}
          • You are responsible for all activities under your account{'\n'}
          • Notify us immediately of any unauthorized access
        </Text>

        <Text style={styles.sectionTitle}>4. User Conduct and Prohibited Activities</Text>
        <Text style={styles.subsectionTitle}>You Agree NOT To:</Text>
        
        <Text style={styles.paragraph}>
          <Text style={styles.bold}>Illegal Activities{'\n'}</Text>
          • Violate any local, state, national, or international law{'\n'}
          • Engage in any illegal or harmful activities{'\n\n'}
          
          <Text style={styles.bold}>Harassment and Abuse{'\n'}</Text>
          • Harass, bully, stalk, intimidate, or threaten other users{'\n'}
          • Send unsolicited sexual content or messages{'\n'}
          • Engage in hate speech or discrimination{'\n\n'}
          
          <Text style={styles.bold}>Fraud and Deception{'\n'}</Text>
          • Impersonate any person or entity{'\n'}
          • Use fake photos or misrepresent your identity{'\n'}
          • Create fake or duplicate accounts{'\n'}
          • Scam or defraud other users{'\n\n'}
          
          <Text style={styles.bold}>Spam and Commercial Use{'\n'}</Text>
          • Send spam or unsolicited commercial messages{'\n'}
          • Use the Service for commercial purposes without our permission{'\n'}
          • Advertise or promote third-party products or services{'\n\n'}
          
          <Text style={styles.bold}>Minors{'\n'}</Text>
          • Contact or communicate with minors{'\n'}
          • Share content involving minors{'\n\n'}
          
          <Text style={styles.bold}>Inappropriate Content{'\n'}</Text>
          • Share pornographic, obscene, or sexually explicit content (unsolicited){'\n'}
          • Share violent, graphic, or disturbing content{'\n'}
          • Share content that promotes self-harm or suicide{'\n\n'}
          
          <Text style={styles.bold}>Platform Abuse{'\n'}</Text>
          • Use bots, scripts, or automated tools{'\n'}
          • Attempt to hack, reverse engineer, or compromise the Service{'\n'}
          • Interfere with the proper functioning of the Service
        </Text>

        <Text style={styles.sectionTitle}>5. Content and Intellectual Property</Text>
        <Text style={styles.subsectionTitle}>5.1 Your Content</Text>
        <Text style={styles.paragraph}>
          • You retain ownership of content you post (photos, messages, profile information){'\n'}
          • By posting content, you grant us a license to use, display, and distribute your content for operating the Service{'\n'}
          • You represent that you have the right to post your content{'\n'}
          • You are responsible for your content
        </Text>

        <Text style={styles.subsectionTitle}>5.2 Our Intellectual Property</Text>
        <Text style={styles.paragraph}>
          • The Service, including its design, features, and functionality, is owned by us{'\n'}
          • Our trademarks, logos, and brand features are protected{'\n'}
          • You may not copy, modify, or create derivative works without our permission
        </Text>

        <Text style={styles.subsectionTitle}>5.3 Content Removal</Text>
        <Text style={styles.paragraph}>
          • We may remove content that violates these Terms{'\n'}
          • We may remove content for any reason at our discretion{'\n'}
          • We are not obligated to monitor content, but we reserve the right to do so
        </Text>

        <Text style={styles.sectionTitle}>6. Matching and Communication</Text>
        <Text style={styles.paragraph}>
          • We use algorithms to suggest potential matches based on your preferences{'\n'}
          • We do not guarantee matches or successful relationships{'\n'}
          • You are responsible for your interactions with other users{'\n'}
          • Messages are private between matched users{'\n'}
          • Do not share personal financial information or passwords
        </Text>

        <Text style={styles.sectionTitle}>7. Safety and Reporting</Text>
        <Text style={styles.subsectionTitle}>7.1 Meeting in Person</Text>
        <Text style={styles.paragraph}>
          • We do not conduct background checks on users{'\n'}
          • Exercise caution when meeting someone in person{'\n'}
          • Meet in public places and inform friends or family{'\n'}
          • We are not responsible for offline interactions
        </Text>

        <Text style={styles.subsectionTitle}>7.2 Reporting and Blocking</Text>
        <Text style={styles.paragraph}>
          • You can report users or content that violates these Terms{'\n'}
          • We will investigate reports and take appropriate action{'\n'}
          • You can block users to prevent them from contacting you{'\n'}
          • False or malicious reports may result in account termination
        </Text>

        <Text style={styles.subsectionTitle}>7.3 Warnings and Bans</Text>
        <Text style={styles.paragraph}>
          • We may issue warnings for minor violations{'\n'}
          • Serious or repeated violations may result in account suspension or permanent ban{'\n'}
          • We reserve the right to ban users without warning for severe violations
        </Text>

        <Text style={styles.sectionTitle}>8. Premium Features and Payments</Text>
        <Text style={styles.paragraph}>
          • We offer premium features through paid subscriptions{'\n'}
          • Subscription fees are charged in advance on a recurring basis{'\n'}
          • Prices are subject to change with notice{'\n'}
          • All fees are non-refundable except as required by law{'\n'}
          • You can cancel your subscription at any time{'\n'}
          • Cancellation takes effect at the end of the current billing period
        </Text>

        <Text style={styles.sectionTitle}>9. Disclaimers and Limitations of Liability</Text>
        <Text style={styles.subsectionTitle}>9.1 Service "As Is"</Text>
        <Text style={styles.paragraph}>
          • The Service is provided "as is" and "as available"{'\n'}
          • We make no warranties, express or implied{'\n'}
          • We do not guarantee uninterrupted or error-free service
        </Text>

        <Text style={styles.subsectionTitle}>9.2 No Background Checks</Text>
        <Text style={styles.paragraph}>
          • We do not conduct criminal background checks{'\n'}
          • We do not verify user identities or information{'\n'}
          • You are responsible for your own safety
        </Text>

        <Text style={styles.subsectionTitle}>9.3 User Interactions</Text>
        <Text style={styles.paragraph}>
          • We are not responsible for user conduct or content{'\n'}
          • We are not liable for damages resulting from interactions with other users{'\n'}
          • You assume all risks of using the Service
        </Text>

        <Text style={styles.sectionTitle}>10. Changes to Terms</Text>
        <Text style={styles.paragraph}>
          • We may modify these Terms at any time{'\n'}
          • We will notify you of material changes via email or in-app notification{'\n'}
          • Continued use of the Service after changes constitutes acceptance{'\n'}
          • If you do not agree to changes, you must stop using the Service
        </Text>

        <Text style={styles.sectionTitle}>11. Contact Us</Text>
        <Text style={styles.paragraph}>
          If you have questions about these Terms, please contact us through the app's Help & Support section.
        </Text>

        <Text style={styles.sectionTitle}>Summary of Key Points</Text>
        <Text style={styles.paragraph}>
          1. You must be 18+ to use the Service{'\n'}
          2. Be respectful - no harassment, fraud, or illegal activity{'\n'}
          3. We don't conduct background checks - use caution when meeting users{'\n'}
          4. Your content is your responsibility - we can remove violating content{'\n'}
          5. Premium features are paid - subscriptions are non-refundable{'\n'}
          6. We provide the Service "as is" - we're not liable for user conduct{'\n'}
          7. We can modify these Terms - we'll notify you of changes
        </Text>

        <Text style={styles.important}>
          By using our app, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
          {'\n\n'}
          If you do not agree to these Terms, you must not use the Service.
        </Text>

        <View style={styles.bottomSpacer} />
      </ScrollView>
      </SafeAreaView>
    </>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
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
  lastUpdated: {
    fontSize: 14,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 24,
    marginBottom: 12,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  paragraph: {
    fontSize: 15,
    lineHeight: 24,
    color: colors.text,
    marginBottom: 12,
  },
  bold: {
    fontWeight: 'bold',
  },
  important: {
    fontSize: 15,
    lineHeight: 24,
    color: colors.text,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 12,
    padding: 16,
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  bottomSpacer: {
    height: 40,
  },
});

