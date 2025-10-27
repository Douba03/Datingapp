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
      
      // Show a message that the app will fully apply on restart
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

  const handleSignOut = async () => {
    const confirmMessage = 'Are you sure you want to sign out?';
    
    if (Platform.OS === 'web') {
      const confirmed = window.confirm(confirmMessage);
      if (confirmed) {
        await signOut();
        router.replace('/(auth)/login');
      }
    } else {
      Alert.alert(
        'Sign Out',
        confirmMessage,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Sign Out', 
            style: 'destructive', 
            onPress: async () => {
              await signOut();
              router.replace('/(auth)/login');
            }
          },
        ]
      );
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) {
      const errorMsg = 'No user logged in';
      if (Platform.OS === 'web') {
        window.alert(errorMsg);
      } else {
        Alert.alert('Error', errorMsg);
      }
      return;
    }

    const confirmMessage = 'This will permanently delete your account and all your data. This action cannot be undone. Continue?';
    
    if (Platform.OS === 'web') {
      const confirmed = window.confirm(confirmMessage);
      if (!confirmed) return;
      
      try {
        console.log('[Settings] Deleting account for user:', user.id);

        // Delete user data
        await supabase.from('swipes').delete().or(`swiper_user_id.eq.${user.id},target_user_id.eq.${user.id}`);
        await supabase.from('matches').delete().or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`);
        await supabase.from('preferences').delete().eq('user_id', user.id);
        await supabase.from('swipe_counters').delete().eq('user_id', user.id);
        await supabase.from('profiles').delete().eq('user_id', user.id);

        await signOut();
        window.alert('Your account has been deleted.');
        router.replace('/(auth)/login');
      } catch (err: any) {
        console.error('[Settings] Delete account error:', err);
        window.alert(err?.message || 'Failed to delete account.');
      }
    } else {
      Alert.alert(
        'Delete Account',
        confirmMessage,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              try {
                console.log('[Settings] Deleting account for user:', user.id);

                await supabase.from('swipes').delete().or(`swiper_user_id.eq.${user.id},target_user_id.eq.${user.id}`);
                await supabase.from('matches').delete().or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`);
                await supabase.from('preferences').delete().eq('user_id', user.id);
                await supabase.from('swipe_counters').delete().eq('user_id', user.id);
                await supabase.from('profiles').delete().eq('user_id', user.id);

                await signOut();
                Alert.alert('Account Deleted', 'Your account has been deleted.');
                router.replace('/(auth)/login');
              } catch (err: any) {
                console.error('[Settings] Delete account error:', err);
                Alert.alert('Deletion Error', err?.message || 'Failed to delete account.');
              }
            },
          },
        ]
      );
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
    <SafeAreaView style={styles.container}>
      <ChangePasswordModal
        visible={showChangePasswordModal}
        onClose={() => setShowChangePasswordModal(false)}
      />
      
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>

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
    </SafeAreaView>
  );
}

// Create styles function that takes colors as parameter
const createStyles = (colors: typeof lightTheme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
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

