import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { useNotificationPreferences } from '../../hooks/useNotificationPreferences';
import { usePrivacySettings } from '../../hooks/usePrivacySettings';
import { useTheme } from '../../contexts/ThemeContext';
import { supabase } from '../../services/supabase/client';
import { ProtectedRoute } from '../../components/auth/ProtectedRoute';
import { ChangePasswordModal } from '../../components/settings/ChangePasswordModal';
import { SignOutModal } from '../../components/settings/SignOutModal';
import { DeleteAccountModal } from '../../components/settings/DeleteAccountModal';

function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, signOut } = useAuth();
  const { preferences, loading: prefsLoading, updatePreferences } = useNotificationPreferences();
  const { settings: privacySettings, loading: privacyLoading, updateSettings: updatePrivacySettings } = usePrivacySettings();
  const { colors, isDarkMode, toggleTheme } = useTheme();
  
  // Modal states
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [signOutLoading, setSignOutLoading] = useState(false);
  const [deleteAccountLoading, setDeleteAccountLoading] = useState(false);

  const handleDarkModeToggle = (value: boolean) => {
    toggleTheme();
      console.log('[Settings] Dark mode:', value ? 'enabled' : 'disabled');
  };

  // Notification handlers
  const handlePushNotificationsToggle = async (value: boolean) => {
    console.log('[Settings] Toggling push notifications:', value);
    const { error } = await updatePreferences({ push_enabled: value });
    if (error) {
      const errorMsg = `Failed to update notification settings: ${error}`;
      if (Platform.OS === 'web') {
        window.alert(errorMsg);
      } else {
        Alert.alert('Error', errorMsg);
      }
    } else {
      console.log('[Settings] ✅ Push notifications updated successfully');
    }
  };

  const handleMatchNotificationsToggle = async (value: boolean) => {
    console.log('[Settings] Toggling match notifications:', value);
    const { error } = await updatePreferences({ match_notifications: value });
    if (error) {
      const errorMsg = `Failed to update notification settings: ${error}`;
      if (Platform.OS === 'web') {
        window.alert(errorMsg);
      } else {
        Alert.alert('Error', errorMsg);
      }
    } else {
      console.log('[Settings] ✅ Match notifications updated successfully');
    }
  };

  const handleMessageNotificationsToggle = async (value: boolean) => {
    console.log('[Settings] Toggling message notifications:', value);
    const { error } = await updatePreferences({ message_notifications: value });
    if (error) {
      const errorMsg = `Failed to update notification settings: ${error}`;
      if (Platform.OS === 'web') {
        window.alert(errorMsg);
      } else {
        Alert.alert('Error', errorMsg);
      }
    } else {
      console.log('[Settings] ✅ Message notifications updated successfully');
    }
  };

  const handleLikeNotificationsToggle = async (value: boolean) => {
    console.log('[Settings] Toggling like notifications:', value);
    const { error } = await updatePreferences({ like_notifications: value });
    if (error) {
      const errorMsg = `Failed to update notification settings: ${error}`;
      if (Platform.OS === 'web') {
        window.alert(errorMsg);
      } else {
        Alert.alert('Error', errorMsg);
      }
    } else {
      console.log('[Settings] ✅ Like notifications updated successfully');
    }
  };

  // Privacy handlers
  const handleShowOnlineToggle = async (value: boolean) => {
    console.log('[Settings] Toggling show online status:', value);
    const { error } = await updatePrivacySettings({ show_online_status: value });
    if (error) {
      const errorMsg = `Failed to update privacy settings: ${error}`;
      if (Platform.OS === 'web') {
        window.alert(errorMsg);
      } else {
        Alert.alert('Error', errorMsg);
      }
    } else {
      console.log('[Settings] ✅ Show online status updated successfully');
    }
  };

  const handleSignOut = () => {
    setShowSignOutModal(true);
  };

  const confirmSignOut = async () => {
    setSignOutLoading(true);
    try {
      // Close modal first
      setShowSignOutModal(false);
      
      // Sign out
      const { error } = await signOut();
      
      if (error) {
        console.warn('[Settings] Sign out had error but continuing:', error);
      }
      
      // Small delay to ensure state is cleared before navigation
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Navigate to login
      router.replace('/(auth)/login');
    } catch (error) {
      console.error('[Settings] Sign out error:', error);
      // Even on error, try to navigate to login since local state is cleared
      router.replace('/(auth)/login');
    } finally {
      setSignOutLoading(false);
    }
  };

  const handleDeleteAccount = () => {
    if (!user) {
      const errorMsg = 'No user logged in';
      if (Platform.OS === 'web') {
        window.alert(errorMsg);
      } else {
        Alert.alert('Error', errorMsg);
      }
      return;
    }
    setShowDeleteAccountModal(true);
  };
    
  const confirmDeleteAccount = async () => {
    if (!user) return;
      
    setDeleteAccountLoading(true);
      try {
        console.log('[Settings] Deleting account for user:', user.id);

        // Delete user data
        await supabase.from('swipes').delete().or(`swiper_user_id.eq.${user.id},target_user_id.eq.${user.id}`);
        await supabase.from('matches').delete().or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`);
        await supabase.from('preferences').delete().eq('user_id', user.id);
        await supabase.from('swipe_counters').delete().eq('user_id', user.id);
        await supabase.from('profiles').delete().eq('user_id', user.id);

        await signOut();
      setShowDeleteAccountModal(false);
      
      if (Platform.OS === 'web') {
        window.alert('Your account has been deleted.');
      } else {
        Alert.alert('Account Deleted', 'Your account has been deleted.');
      }
        router.replace('/(auth)/login');
      } catch (err: any) {
        console.error('[Settings] Delete account error:', err);
      if (Platform.OS === 'web') {
        window.alert(err?.message || 'Failed to delete account.');
    } else {
                Alert.alert('Deletion Error', err?.message || 'Failed to delete account.');
              }
    } finally {
      setDeleteAccountLoading(false);
    }
  };

  const handleChangePassword = () => {
    setShowChangePasswordModal(true);
  };

  const handleChangeEmail = () => {
    if (Platform.OS === 'web') {
      window.alert('Email change functionality coming soon!');
    } else {
      Alert.alert('Change Email', 'Email change functionality coming soon!');
    }
  };

  const handleBlockedUsers = () => {
    router.push('/blocked-users');
  };

  const handlePrivacyPolicy = () => {
    router.push('/privacy-policy');
  };

  const handleTermsOfService = () => {
    router.push('/terms-of-service');
  };

  const handleHelp = () => {
    router.push('/support-ticket');
  };

  // Create styles with current theme colors
  const styles = createStyles(colors);

  return (
    <View
      style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}
    >
      <ChangePasswordModal
        visible={showChangePasswordModal}
        onClose={() => setShowChangePasswordModal(false)}
      />

      <SignOutModal
        visible={showSignOutModal}
        loading={signOutLoading}
        onClose={() => setShowSignOutModal(false)}
        onConfirm={confirmSignOut}
      />

      <DeleteAccountModal
        visible={showDeleteAccountModal}
        loading={deleteAccountLoading}
        onClose={() => setShowDeleteAccountModal(false)}
        onConfirm={confirmDeleteAccount}
      />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <View style={styles.headerLeft}>
          <View style={styles.logoRow}>
            <View style={[styles.logoContainer, { backgroundColor: colors.textSecondary }]}>
              <Ionicons name="cog" size={18} color="#fff" />
            </View>
            <View style={styles.titleContainer}>
              <Text style={styles.title}>Settings</Text>
              <Text style={styles.subtitle}>Manage your account</Text>
            </View>
          </View>
        </View>
        
        {/* Version badge */}
        <View style={styles.versionBadge}>
          <Text style={styles.versionText}>v1.0.0</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} bounces={false} overScrollMode="never">
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
              <Ionicons name={isDarkMode ? "moon" : "sunny"} size={20} color={colors.text} />
              <Text style={styles.settingLabel}>Dark Mode</Text>
            </View>
            <Switch
              value={isDarkMode}
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

          <TouchableOpacity style={styles.dangerButton} onPress={handleSignOut}>
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
    </View>
  );
}

// Create styles function that takes colors as parameter
const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    marginHorizontal: 12,
    marginTop: 4,
    marginBottom: 8,
    borderRadius: 20,
    shadowColor: '#6B7280',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  headerLeft: {
    flex: 1,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoContainer: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6B7280',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  titleContainer: {
    flexDirection: 'column',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 1,
  },
  versionBadge: {
    backgroundColor: colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  versionText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
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

export default function SettingsScreenWrapper() {
  return (
    <ProtectedRoute>
      <SettingsScreen />
    </ProtectedRoute>
  );
}

