// Debug component to help troubleshoot loading issues
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAuth } from '../hooks/useAuth';

const colors = {
  primary: '#FF6B6B',
  secondary: '#4ECDC4',
  background: '#F8F9FA',
  text: '#2C3E50',
  error: '#E74C3C',
};

export function DebugAuth() {
  const { user, profile, session, loading } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🔍 Debug Information</Text>
      
      <View style={styles.section}>
        <Text style={styles.label}>Loading:</Text>
        <Text style={styles.value}>{loading ? 'true' : 'false'}</Text>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.label}>Session:</Text>
        <Text style={styles.value}>{session ? 'exists' : 'null'}</Text>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.label}>User:</Text>
        <Text style={styles.value}>{user ? user.email : 'null'}</Text>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.label}>Profile:</Text>
        <Text style={styles.value}>{profile ? profile.first_name : 'null'}</Text>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.label}>Auth State:</Text>
        <Text style={styles.value}>
          {session ? 'Authenticated' : 'Not authenticated'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: colors.background,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 20,
  },
  section: {
    marginBottom: 15,
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 5,
  },
  value: {
    fontSize: 14,
    color: colors.text,
  },
});
