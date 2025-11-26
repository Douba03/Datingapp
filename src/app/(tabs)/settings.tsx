import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Platform,
  ActivityIndicator,
  Modal,
  TextInput,
  KeyboardAvoidingView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { useNotificationPreferences } from '../../hooks/useNotificationPreferences';
import { usePrivacySettings } from '../../hooks/usePrivacySettings';
import { supabase } from '../../services/supabase/client';
import { ProtectedRoute } from '../../components/auth/ProtectedRoute';
import { ChangePasswordModal } from '../../components/settings/ChangePasswordModal';
import { colors as lightColors } from '../../components/theme/colors';
import { lightTheme, darkTheme } from '../../components/theme/themes';

const THEME_STORAGE_KEY = '@app_theme';

function SettingsScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { preferences, loading: prefsLoading, updatePreferences } = useNotificationPreferences();
  const { settings: privacySettings, loading: privacyLoading, updateSettings: updatePrivacySettings } = usePrivacySettings();
  
  // App settings
  const [darkMode, setDarkMode] = useState(false);
  const [colors, setColors] = useState(lightTheme);
  
  // Modal states
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  // Load dark mode preference on mount
  useEffect(() => {
    loadDarkModePreference();
  }, []);

  // Update colors when dark mode changes
  useEffect(() => {
    setColors(darkMode ? darkTheme : lightTheme);
  }, [darkMode]);

  const loadDarkModePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme === 'dark') {
        setDarkMode(true);
      }
    } catch (error) {
      console.error('[Settings] Error loading dark mode preference:', error);
    }
  };

  const handleDarkModeToggle = async (value: boolean) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, value ? 'dark' : 'light');
      setDarkMode(value);
      console.log('[Settings] Dark mode:', value ? 'enabled' : 'disabled');
      
      const message = value 
        ? 'Dark mode enabled! Some screens will update on next visit.'
        : 'Light mode enabled! Some screens will update on next visit.';
      
      if (Platform.OS === 'web') {
        window.alert(message);
      } else {
        Alert.alert('Theme Changed', message);
      }
    } catch (error) {
      console.error('[Settings] Error saving dark mode preference:', error);
    }
  };

  // Notification handlers
  const handlePushNotificationsToggle = async (value: boolean) => {
    const { error } = await updatePreferences({ push_enabled: value });
    if (error) Alert.alert('Error', `Failed to update settings: ${error}`);
  };

  const handleMatchNotificationsToggle = async (value: boolean) => {
    const { error } = await updatePreferences({ match_notifications: value });
    if (error) Alert.alert('Error', `Failed to update settings: ${error}`);
  };

  const handleMessageNotificationsToggle = async (value: boolean) => {
    const { error } = await updatePreferences({ message_notifications: value });
    if (error) Alert.alert('Error', `Failed to update settings: ${error}`);
  };

  const handleLikeNotificationsToggle = async (value: boolean) => {
    const { error } = await updatePreferences({ like_notifications: value });
    if (error) Alert.alert('Error', `Failed to update settings: ${error}`);
  };

  // Privacy handlers
  const handleShowOnlineToggle = async (value: boolean) => {
    const { error } = await updatePrivacySettings({ show_online_status: value });
    if (error) Alert.alert('Error', `Failed to update settings: ${error}`);
  };

  const handleSignOut = () => {
    setShowSignOutModal(true);
  };

  const performSignOut = async () => {
    setSigningOut(true);
    try {
      console.log('[Settings] User requested sign out');
      await signOut();
      console.log('[Settings] Sign out successful, navigating to login');
      setShowSignOutModal(false);
      router.replace('/(auth)/login');
    } catch (err) {
      console.error('[Settings] Sign out exception:', err);
      setShowSignOutModal(false);
      router.replace('/(auth)/login');
    } finally {
      setSigningOut(false);
    }
  };

  const handleDeleteAccount = () => {
    if (!user) return;
    setShowDeleteAccountModal(true);
  };

  const performDeleteAccount = async () => {
    if (!user) return;
    
    console.log('[Settings] Deleting account for user:', user.id);

    // Delete user data
    await supabase.from('swipes').delete().or(`swiper_user_id.eq.${user.id},target_user_id.eq.${user.id}`);
    await supabase.from('matches').delete().or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`);
    await supabase.from('preferences').delete().eq('user_id', user.id);
    await supabase.from('swipe_counters').delete().eq('user_id', user.id);
    await supabase.from('profiles').delete().eq('user_id', user.id);

    await signOut();
    setShowDeleteAccountModal(false);
    router.replace('/(auth)/login');
  };

  const handleChangePassword = () => setShowChangePasswordModal(true);
  const handleChangeEmail = () => Alert.alert('Change Email', 'Coming soon!');
  const handleBlockedUsers = () => router.push('/blocked-users');
  const handlePrivacyPolicy = () => router.push('/privacy-policy');
  const handleTermsOfService = () => router.push('/terms-of-service');
  const handleHelp = () => router.push('/support-ticket');

  const styles = createStyles(colors);

  return (
    <SafeAreaView style={styles.container}>
      <ChangePasswordModal
        visible={showChangePasswordModal}
        onClose={() => setShowChangePasswordModal(false)}
      />
      
      <DeleteAccountModal
        visible={showDeleteAccountModal}
        onClose={() => setShowDeleteAccountModal(false)}
        onConfirm={performDeleteAccount}
        colors={colors}
      />

      <SignOutModal
        visible={showSignOutModal}
        onClose={() => setShowSignOutModal(false)}
        onConfirm={performSignOut}
        loading={signingOut}
        colors={colors}
      />
      
      {/* No header - clean look */}

      <ScrollView style={styles.content}>
        {/* Account Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="person-circle" size={24} color={colors.primary} />
            <Text style={styles.sectionTitle}>Account</Text>
          </View>

          <TouchableOpacity style={styles.settingItem} onPress={handleChangeEmail}>
            <View style={styles.settingLeft}>
              <Ionicons name="mail" size={20} color={colors.text} />
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingLabel}>Email</Text>
                <Text style={styles.settingValue}>{user?.email || 'Not set'}</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem} onPress={handleChangePassword}>
            <View style={styles.settingLeft}>
              <Ionicons name="lock-closed" size={20} color={colors.text} />
              <Text style={styles.settingLabel}>Change Password</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Notifications Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="notifications" size={24} color={colors.primary} />
            <Text style={styles.sectionTitle}>Notifications</Text>
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="notifications-outline" size={20} color={colors.text} />
              <Text style={styles.settingLabel}>Push Notifications</Text>
            </View>
            {prefsLoading ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Switch
                value={preferences.push_enabled}
                onValueChange={handlePushNotificationsToggle}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#fff"
              />
            )}
          </View>

          {preferences.push_enabled && !prefsLoading && (
            <>
              <View style={styles.settingItem}>
                <View style={styles.settingLeft}>
                  <Ionicons name="heart" size={20} color={colors.text} />
                  <Text style={styles.settingLabel}>New Matches</Text>
                </View>
                <Switch
                  value={preferences.match_notifications}
                  onValueChange={handleMatchNotificationsToggle}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor="#fff"
                />
              </View>

              <View style={styles.settingItem}>
                <View style={styles.settingLeft}>
                  <Ionicons name="chatbubble" size={20} color={colors.text} />
                  <Text style={styles.settingLabel}>New Messages</Text>
                </View>
                <Switch
                  value={preferences.message_notifications}
                  onValueChange={handleMessageNotificationsToggle}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor="#fff"
                />
              </View>

              <View style={styles.settingItem}>
                <View style={styles.settingLeft}>
                  <Ionicons name="thumbs-up" size={20} color={colors.text} />
                  <Text style={styles.settingLabel}>New Likes</Text>
                </View>
                <Switch
                  value={preferences.like_notifications}
                  onValueChange={handleLikeNotificationsToggle}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor="#fff"
                />
              </View>
            </>
          )}
        </View>

        {/* Privacy Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="shield-checkmark" size={24} color={colors.primary} />
            <Text style={styles.sectionTitle}>Privacy</Text>
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="eye" size={20} color={colors.text} />
              <Text style={styles.settingLabel}>Show Online Status</Text>
            </View>
            {privacyLoading ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Switch
                value={privacySettings.show_online_status}
                onValueChange={handleShowOnlineToggle}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#fff"
              />
            )}
          </View>

          <TouchableOpacity style={styles.settingItem} onPress={handleBlockedUsers}>
            <View style={styles.settingLeft}>
              <Ionicons name="ban" size={20} color={colors.text} />
              <Text style={styles.settingLabel}>Blocked Users</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* App Settings Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="settings" size={24} color={colors.primary} />
            <Text style={styles.sectionTitle}>App Settings</Text>
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="moon" size={20} color={colors.text} />
              <Text style={styles.settingLabel}>Dark Mode</Text>
            </View>
            <Switch
              value={darkMode}
              onValueChange={handleDarkModeToggle}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {/* Legal Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="document-text" size={24} color={colors.primary} />
            <Text style={styles.sectionTitle}>Legal</Text>
          </View>

          <TouchableOpacity style={styles.settingItem} onPress={handlePrivacyPolicy}>
            <View style={styles.settingLeft}>
              <Ionicons name="shield" size={20} color={colors.text} />
              <Text style={styles.settingLabel}>Privacy Policy</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem} onPress={handleTermsOfService}>
            <View style={styles.settingLeft}>
              <Ionicons name="document" size={20} color={colors.text} />
              <Text style={styles.settingLabel}>Terms of Service</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Support Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="help-circle" size={24} color={colors.primary} />
            <Text style={styles.sectionTitle}>Support</Text>
          </View>

          <TouchableOpacity style={styles.settingItem} onPress={handleHelp}>
            <View style={styles.settingLeft}>
              <Ionicons name="chatbubble-ellipses" size={20} color={colors.text} />
              <Text style={styles.settingLabel}>Help & Support</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="information-circle" size={20} color={colors.text} />
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingLabel}>App Version</Text>
                <Text style={styles.settingValue}>1.0.0</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Danger Zone */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="warning" size={24} color={colors.error} />
            <Text style={[styles.sectionTitle, { color: colors.error }]}>Danger Zone</Text>
          </View>

          <TouchableOpacity 
            style={styles.dangerButton} 
            onPress={handleSignOut}
            activeOpacity={0.6}
          >
            <Ionicons name="log-out" size={20} color={colors.error} />
            <Text style={styles.dangerButtonText}>Sign Out</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.dangerButton} onPress={handleDeleteAccount}>
            <Ionicons name="trash" size={20} color={colors.error} />
            <Text style={styles.dangerButtonText}>Delete Account</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

interface SignOutModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  loading: boolean;
  colors: any;
}

function SignOutModal({ visible, onClose, onConfirm, loading, colors }: SignOutModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContainer, { backgroundColor: colors.surface }]}>
          <View style={styles.modalHeader}>
            <View style={[styles.modalIconContainer, { backgroundColor: `${colors.primary}15` }]}>
              <Ionicons name="log-out" size={32} color={colors.primary} />
            </View>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Sign Out?</Text>
          </View>

          <View style={styles.modalContent}>
            <Text style={[styles.warningText, { color: colors.textSecondary }]}>
              Are you sure you want to sign out? You'll need to sign in again to access your account.
            </Text>
          </View>

          <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
            <TouchableOpacity
              style={[styles.cancelButton, { backgroundColor: colors.background }]}
              onPress={onClose}
              disabled={loading}
            >
              <Text style={[styles.cancelButtonText, { color: colors.text }]}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.signOutButton, loading && styles.deleteButtonDisabled]}
              onPress={onConfirm}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.signOutButtonText}>Sign Out</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

interface DeleteAccountModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  colors: any;
}

function DeleteAccountModal({ visible, onClose, onConfirm, colors }: DeleteAccountModalProps) {
  const [confirmWord, setConfirmWord] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [targetWord, setTargetWord] = useState('');

  const randomWords = ['DELETE', 'BYE', 'ERASE', 'GONE', 'EXIT'];

  useEffect(() => {
    if (visible) {
      const random = randomWords[Math.floor(Math.random() * randomWords.length)];
      setTargetWord(random);
      setConfirmWord('');
      setError(null);
    }
  }, [visible]);

  const handleConfirm = async () => {
    if (confirmWord.toUpperCase() !== targetWord) {
      setError(`Please type "${targetWord}" correctly.`);
      return;
    }

    setLoading(true);
    try {
      await onConfirm();
    } catch (err: any) {
      setError(err.message || 'Failed to delete account');
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.surface }]}>
          <View style={styles.modalHeader}>
            <View style={[styles.modalIconContainer, { backgroundColor: '#FEF2F2' }]}>
              <Ionicons name="warning" size={32} color={colors.error} />
            </View>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Delete Account?</Text>
          </View>

          <View style={styles.modalContent}>
            <Text style={[styles.warningText, { color: colors.text }]}>
              We're sorry to see you go. This action will <Text style={{ fontWeight: 'bold', color: colors.error }}>permanently delete</Text> your account, matches, messages, and all data.
            </Text>
            
            <Text style={[styles.regretText, { color: colors.textSecondary }]}>
              Are you absolutely sure you want to lose all your connections forever? This action cannot be undone.
            </Text>

            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>
                Type <Text style={{ fontWeight: 'bold', color: colors.primary, letterSpacing: 1 }}>{targetWord}</Text> to confirm:
              </Text>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: colors.background, 
                  borderColor: colors.border,
                  color: colors.text 
                }]}
                value={confirmWord}
                onChangeText={(text) => {
                  setConfirmWord(text);
                  setError(null);
                }}
                placeholder={targetWord}
                placeholderTextColor={colors.textSecondary}
                autoCapitalize="characters"
              />
              {error && <Text style={styles.errorText}>{error}</Text>}
            </View>
          </View>

          <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
            <TouchableOpacity
              style={[styles.cancelButton, { backgroundColor: colors.background }]}
              onPress={onClose}
              disabled={loading}
            >
              <Text style={[styles.cancelButtonText, { color: colors.text }]}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.deleteButton,
                (confirmWord.toUpperCase() !== targetWord || loading) && styles.deleteButtonDisabled
              ]}
              onPress={handleConfirm}
              disabled={confirmWord.toUpperCase() !== targetWord || loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.deleteButtonText}>Delete Forever</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// Create styles function that takes colors as parameter
const createStyles = (colors: typeof lightTheme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: colors.surface,
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginLeft: 8,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    color: colors.text,
    marginLeft: 12,
  },
  settingValue: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  dangerButtonText: {
    fontSize: 16,
    color: colors.error,
    marginLeft: 12,
    fontWeight: '500',
  },
  bottomSpacer: {
    height: 40,
  },
});

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    borderRadius: 20,
    width: '100%',
    maxWidth: 400,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHeader: {
    alignItems: 'center',
    paddingTop: 24,
    paddingHorizontal: 20,
  },
  modalIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  modalContent: {
    padding: 20,
  },
  warningText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 22,
  },
  regretText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    fontStyle: 'italic',
  },
  inputContainer: {
    width: '100%',
  },
  inputLabel: {
    fontSize: 14,
    marginBottom: 8,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    textAlign: 'center',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#EF4444',
    alignItems: 'center',
  },
  deleteButtonDisabled: {
    opacity: 0.5,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  signOutButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: lightColors.primary,
    alignItems: 'center',
  },
  signOutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

export default function SettingsScreenWrapper() {
  return (
    <ProtectedRoute>
      <SettingsScreen />
    </ProtectedRoute>
  );
}
