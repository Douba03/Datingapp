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

export default function PrivacyPolicyScreen() {
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
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.lastUpdated}>Last Updated: January 2025</Text>

        <Text style={styles.sectionTitle}>Introduction</Text>
        <Text style={styles.paragraph}>
          Welcome to our dating app. We respect your privacy and are committed to protecting your personal data. 
          This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our application.
        </Text>

        <Text style={styles.sectionTitle}>1. Information We Collect</Text>
        <Text style={styles.subsectionTitle}>1.1 Information You Provide Directly</Text>
        <Text style={styles.paragraph}>
          • Account Information: Email address, password (encrypted){'\n'}
          • Profile Information: Name, date of birth, gender, photos, bio, interests{'\n'}
          • Preferences: Age range, distance preferences, relationship intent{'\n'}
          • Location Data: City, country, approximate location{'\n'}
          • Communications: Messages you send through our chat feature
        </Text>

        <Text style={styles.subsectionTitle}>1.2 Information Collected Automatically</Text>
        <Text style={styles.paragraph}>
          • Device Information: Device type, operating system, unique identifiers{'\n'}
          • Usage Data: How you interact with the app, features used{'\n'}
          • Log Data: IP address, browser type, time and date of visits{'\n'}
          • Location Data: GPS location (if you grant permission)
        </Text>

        <Text style={styles.sectionTitle}>2. How We Use Your Information</Text>
        <Text style={styles.paragraph}>
          We use your information to:{'\n\n'}
          • Create and manage your account{'\n'}
          • Provide matching and discovery features{'\n'}
          • Enable communication between matched users{'\n'}
          • Personalize your experience{'\n'}
          • Verify your identity and prevent fraud{'\n'}
          • Improve our services and develop new features{'\n'}
          • Send you notifications about matches, messages, and likes
        </Text>

        <Text style={styles.sectionTitle}>3. How We Share Your Information</Text>
        <Text style={styles.subsectionTitle}>3.1 With Other Users</Text>
        <Text style={styles.paragraph}>
          • Your profile information (photos, bio, interests) is visible to other users{'\n'}
          • Your first name and age are visible to matched users{'\n'}
          • Your approximate location/distance is shown to potential matches{'\n'}
          • Messages are visible to users you match with
        </Text>

        <Text style={styles.subsectionTitle}>3.2 With Service Providers</Text>
        <Text style={styles.paragraph}>
          We share information with third-party service providers who help us operate our app:{'\n\n'}
          • Cloud Hosting: Supabase (database and authentication){'\n'}
          • Payment Processing: For premium subscriptions{'\n'}
          • Analytics: For usage analytics{'\n'}
          • Push Notifications: For app notifications
        </Text>

        <Text style={styles.subsectionTitle}>3.3 For Legal Reasons</Text>
        <Text style={styles.paragraph}>
          We may disclose your information if required by law or in response to legal processes, 
          government requests, or to protect our rights and safety.
        </Text>

        <Text style={styles.sectionTitle}>4. Your Privacy Rights and Choices</Text>
        <Text style={styles.paragraph}>
          • Access and Update: You can access and update your profile information in the app settings{'\n'}
          • Delete Your Account: You can delete your account from the Settings page{'\n'}
          • Communication Preferences: Control push notifications in app settings{'\n'}
          • Location Data: Disable location services in your device settings{'\n'}
          • Privacy Settings: Control who can see your online status
        </Text>

        <Text style={styles.sectionTitle}>5. Data Retention</Text>
        <Text style={styles.paragraph}>
          • Active Accounts: We retain your data while your account is active{'\n'}
          • Deleted Accounts: Most data is deleted within 30 days of account deletion{'\n'}
          • Legal Compliance: Some data may be retained longer for legal or security purposes
        </Text>

        <Text style={styles.sectionTitle}>6. Security</Text>
        <Text style={styles.paragraph}>
          We implement appropriate technical and organizational measures to protect your data:{'\n\n'}
          • Encryption of data in transit (HTTPS/TLS){'\n'}
          • Encryption of passwords and sensitive data{'\n'}
          • Secure database access controls{'\n'}
          • Regular security audits and updates{'\n\n'}
          However, no method of transmission over the internet is 100% secure.
        </Text>

        <Text style={styles.sectionTitle}>7. Children's Privacy</Text>
        <Text style={styles.paragraph}>
          Our service is not intended for users under 18 years of age. We do not knowingly collect 
          personal information from children under 18. If we discover that a child under 18 has 
          provided us with personal information, we will delete it immediately.
        </Text>

        <Text style={styles.sectionTitle}>8. Changes to This Privacy Policy</Text>
        <Text style={styles.paragraph}>
          We may update this Privacy Policy from time to time. We will notify you of any changes by 
          posting the new Privacy Policy in the app and updating the "Last Updated" date.
        </Text>

        <Text style={styles.sectionTitle}>9. Contact Us</Text>
        <Text style={styles.paragraph}>
          If you have questions, concerns, or requests regarding this Privacy Policy or your data, 
          please contact us through the app's Help & Support section.
        </Text>

        <Text style={styles.sectionTitle}>Summary</Text>
        <Text style={styles.paragraph}>
          We collect information you provide (profile, photos, messages) and usage data to provide 
          our dating service. We share data with service providers and other users as necessary. 
          You have rights to access, update, and delete your data. We take security seriously and 
          comply with applicable privacy laws.
        </Text>

        <Text style={styles.important}>
          By using our app, you acknowledge that you have read and understood this Privacy Policy.
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

