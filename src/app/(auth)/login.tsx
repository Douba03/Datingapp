import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../services/supabase/client';
import { Button } from '../../components/ui/Button';
import { colors } from '../../components/theme/colors';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const [showDebug, setShowDebug] = useState(false);
  
  const { signIn, signUp, user, session } = useAuth();
  const router = useRouter();

  const addDebugLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setDebugInfo(prev => [...prev, `[${timestamp}] ${message}`]);
    console.log(`[DEBUG] ${message}`);
  };

  const clearDebugLog = () => {
    setDebugInfo([]);
  };

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    const emailNormalized = email.trim().toLowerCase();

    addDebugLog(`Starting ${isSignUp ? 'sign up' : 'sign in'} process`);
    addDebugLog(`Email: ${emailNormalized}`);
    addDebugLog(`Password length: ${password.length}`);
    
    setLoading(true);
    try {
      addDebugLog(`Calling ${isSignUp ? 'signUp' : 'signIn'} function...`);
      
      const { data, error } = isSignUp 
        ? await signUp(emailNormalized, password)
        : await signIn(emailNormalized, password);

      addDebugLog(`Auth function completed`);
      addDebugLog(`Data: ${JSON.stringify(data, null, 2)}`);
      addDebugLog(`Error: ${error ? JSON.stringify(error, null, 2) : 'null'}`);

      if (error) {
        const errorMessage = error instanceof Error ? error.message : (error as any)?.message || 'Unknown error';
        addDebugLog(`❌ Authentication failed: ${errorMessage}`);
        Alert.alert('Error', errorMessage);
      } else {
        addDebugLog(`✅ Authentication successful!`);
        addDebugLog(`Data.user: ${JSON.stringify(data?.user, null, 2)}`);
        addDebugLog(`Data.session: ${JSON.stringify(data?.session, null, 2)}`);

        // Force-fetch session immediately to avoid UI stall
        addDebugLog(`Fetching fresh session from Supabase...`);
        const { data: { session: freshSession }, error: sessionErr } = await supabase.auth.getSession();
        if (sessionErr) {
          addDebugLog(`⚠️ getSession error: ${sessionErr.message}`);
        } else {
          addDebugLog(`Fresh session: ${JSON.stringify(!!freshSession)}`);
        }

        // Decide destination immediately to avoid UI stall
        try {
          const authUserId = freshSession?.user?.id || data?.user?.id;
          addDebugLog(`Checking onboarding via profiles for user: ${authUserId}`);
          if (authUserId) {
            const { data: dbProfile, error: profileErr } = await supabase
              .from('profiles')
              .select('first_name,bio,photos,interests')
              .eq('user_id', authUserId)
              .single();

            if (profileErr) {
              addDebugLog(`Profile fetch error (ok if new user): ${profileErr.message}`);
            }

            const emailPrefix = (emailNormalized || '').split('@')[0];
            const hasCompletedOnboarding = !!dbProfile && (
              (dbProfile.first_name && dbProfile.first_name !== emailPrefix) ||
              (dbProfile.bio && dbProfile.bio.length > 0) ||
              (Array.isArray(dbProfile.photos) && dbProfile.photos.length > 0) ||
              (Array.isArray(dbProfile.interests) && dbProfile.interests.length > 0)
            );

            addDebugLog(`Onboarding computed: ${JSON.stringify({ hasCompletedOnboarding })}`);
            const dest = hasCompletedOnboarding ? '/(tabs)' : '/(onboarding)/welcome';
            addDebugLog(`Routing to: ${dest}`);
            router.replace(dest);
          } else {
            addDebugLog(`No auth user id found; routing to root`);
            router.replace('/');
          }
        } catch (routingErr: any) {
          addDebugLog(`Routing decision error: ${routingErr?.message || routingErr}`);
          router.replace('/');
        }
      }
    } catch (error) {
      addDebugLog(`💥 Exception caught: ${error}`);
      Alert.alert('Error', 'Something went wrong');
    } finally {
      setLoading(false);
      addDebugLog(`Loading state set to false`);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <Text style={styles.title}>
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </Text>
          <Text style={styles.subtitle}>
            {isSignUp ? 'Join Partner Productivity' : 'Sign in to continue'}
          </Text>

          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            
            <TextInput
              style={styles.input}
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
            />

            <Button
              title={isSignUp ? 'Sign Up' : 'Sign In'}
              onPress={handleAuth}
              loading={loading}
              style={styles.authButton}
            />

            <Button
              title={isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
              onPress={() => setIsSignUp(!isSignUp)}
              variant="outline"
              style={styles.switchButton}
            />

            {/* Debug Toggle Button */}
            <TouchableOpacity 
              style={styles.debugToggle}
              onPress={() => setShowDebug(!showDebug)}
            >
              <Text style={styles.debugToggleText}>
                {showDebug ? '🔍 Hide Debug' : '🐛 Show Debug'}
              </Text>
            </TouchableOpacity>

            {/* Debug Panel */}
            {showDebug && (
              <View style={styles.debugPanel}>
                <View style={styles.debugHeader}>
                  <Text style={styles.debugTitle}>🐛 Debug Information</Text>
                  <TouchableOpacity onPress={clearDebugLog}>
                    <Text style={styles.clearButton}>Clear</Text>
                  </TouchableOpacity>
                </View>
                
                <ScrollView style={styles.debugLog} showsVerticalScrollIndicator={true}>
                  {debugInfo.length === 0 ? (
                    <Text style={styles.debugEmpty}>No debug information yet. Try logging in!</Text>
                  ) : (
                    debugInfo.map((log, index) => (
                      <Text key={index} style={styles.debugLogItem}>
                        {log}
                      </Text>
                    ))
                  )}
                </ScrollView>

                <View style={styles.debugStatus}>
                  <Text style={styles.debugStatusText}>
                    <Text style={styles.debugLabel}>Loading:</Text> {loading ? '✅ Yes' : '❌ No'}
                  </Text>
                  <Text style={styles.debugStatusText}>
                    <Text style={styles.debugLabel}>User:</Text> {user ? '✅ Logged in' : '❌ Not logged in'}
                  </Text>
                  <Text style={styles.debugStatusText}>
                    <Text style={styles.debugLabel}>Session:</Text> {session ? '✅ Active' : '❌ No session'}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 48,
  },
  form: {
    gap: 16,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
  },
  authButton: {
    marginTop: 8,
  },
  switchButton: {
    marginTop: 16,
  },
  debugToggle: {
    backgroundColor: colors.accent,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  debugToggleText: {
    color: colors.surface,
    fontWeight: 'bold',
    fontSize: 14,
  },
  debugPanel: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    marginTop: 16,
    padding: 16,
  },
  debugHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  debugTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  clearButton: {
    color: colors.error,
    fontSize: 14,
    fontWeight: 'bold',
  },
  debugLog: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    maxHeight: 200,
    marginBottom: 12,
  },
  debugEmpty: {
    color: colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  debugLogItem: {
    fontSize: 12,
    color: colors.text,
    marginBottom: 4,
    fontFamily: 'monospace',
  },
  debugStatus: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12,
  },
  debugStatusText: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 4,
  },
  debugLabel: {
    fontWeight: 'bold',
  },
});

