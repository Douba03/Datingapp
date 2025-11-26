import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../services/supabase/client';
import { colors } from '../components/theme/colors';

interface BlockedUser {
  id: string;
  blocked_user_id: string;
  created_at: string;
  blocked_user: {
    user_id: string;
    first_name: string;
    age: number;
    photos: string[];
    city?: string;
  };
}

export default function BlockedUsersScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [unblocking, setUnblocking] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchBlockedUsers();
    }
  }, [user]);

  const fetchBlockedUsers = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_blocks')
        .select(`
          id,
          blocked_user_id,
          created_at
        `)
        .eq('blocker_user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[BlockedUsers] Error fetching blocked users:', error);
        return;
      }

      // Fetch blocked user profiles separately
      if (data && data.length > 0) {
        const blockedUserIds = data.map(block => block.blocked_user_id);
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('user_id, first_name, age, photos, city')
          .in('user_id', blockedUserIds);

        if (profilesError) {
          console.error('[BlockedUsers] Error fetching profiles:', profilesError);
          setBlockedUsers(data.map(block => ({
            ...block,
            blocked_user: {
              user_id: block.blocked_user_id,
              first_name: 'Unknown',
              age: 0,
              photos: [],
              city: undefined
            }
          })));
          return;
        }

        // Combine blocks with profiles
        const blocksWithProfiles = data.map(block => ({
          ...block,
          blocked_user: profiles?.find(p => p.user_id === block.blocked_user_id) || {
            user_id: block.blocked_user_id,
            first_name: 'Unknown',
            age: 0,
            photos: [],
            city: undefined
          }
        }));

        console.log('[BlockedUsers] Fetched blocked users:', blocksWithProfiles);
        setBlockedUsers(blocksWithProfiles);
      } else {
        setBlockedUsers([]);
      }
    } catch (error) {
      console.error('[BlockedUsers] Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnblock = async (blockId: string, userName: string) => {
    const confirmUnblock = () => {
      setUnblocking(blockId);
      performUnblock(blockId);
    };

    if (Platform.OS === 'web') {
      const confirmed = window.confirm(
        `Are you sure you want to unblock ${userName}? You will be able to see their profile and match with them again.`
      );
      if (confirmed) {
        confirmUnblock();
      }
    } else {
      Alert.alert(
        'Unblock User',
        `Are you sure you want to unblock ${userName}? You will be able to see their profile and match with them again.`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Unblock',
            style: 'destructive',
            onPress: confirmUnblock,
          },
        ]
      );
    }
  };

  const performUnblock = async (blockId: string) => {
    try {
      const { error } = await supabase
        .from('user_blocks')
        .delete()
        .eq('id', blockId);

      if (error) {
        console.error('[BlockedUsers] Error unblocking user:', error);
        
        const errorMessage = 'Failed to unblock user. Please try again.';
        if (Platform.OS === 'web') {
          window.alert(errorMessage);
        } else {
          Alert.alert('Error', errorMessage);
        }
        return;
      }

      // Remove from local state
      setBlockedUsers(prev => prev.filter(block => block.id !== blockId));

      const successMessage = 'User unblocked successfully!';
      if (Platform.OS === 'web') {
        window.alert(successMessage);
      } else {
        Alert.alert('Success', successMessage);
      }
    } catch (error: any) {
      console.error('[BlockedUsers] Error:', error);
      
      const errorMessage = error?.message || 'Failed to unblock user';
      if (Platform.OS === 'web') {
        window.alert(errorMessage);
      } else {
        Alert.alert('Error', errorMessage);
      }
    } finally {
      setUnblocking(null);
    }
  };

  const renderBlockedUser = ({ item }: { item: BlockedUser }) => {
    const blockedUser = item.blocked_user;
    const isUnblocking = unblocking === item.id;

    return (
      <View style={styles.userCard}>
        <Image
          source={{
            uri: blockedUser.photos?.[0] || 'https://via.placeholder.com/60',
          }}
          style={styles.userImage}
        />
        <View style={styles.userInfo}>
          <Text style={styles.userName}>
            {blockedUser.first_name}, {blockedUser.age}
          </Text>
          {blockedUser.city && (
            <Text style={styles.userLocation}>
              <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
              {' '}{blockedUser.city}
            </Text>
          )}
          <Text style={styles.blockedDate}>
            Blocked {new Date(item.created_at).toLocaleDateString()}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.unblockButton, isUnblocking && styles.unblockButtonDisabled]}
          onPress={() => handleUnblock(item.id, blockedUser.first_name)}
          disabled={isUnblocking}
        >
          {isUnblocking ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
              <Text style={styles.unblockButtonText}>Unblock</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading blocked users...</Text>
        </View>
      ) : blockedUsers.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="ban-outline" size={64} color={colors.textSecondary} />
          <Text style={styles.emptyTitle}>No Blocked Users</Text>
          <Text style={styles.emptyText}>
            You haven't blocked anyone yet. Blocked users won't be able to see your profile or contact you.
          </Text>
        </View>
      ) : (
        <FlatList
          data={blockedUsers}
          keyExtractor={(item) => item.id}
          renderItem={renderBlockedUser}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    marginTop: 16,
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  emptyText: {
    marginTop: 8,
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  listContainer: {
    padding: 16,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  userImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  userLocation: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  blockedDate: {
    fontSize: 12,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  unblockButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  unblockButtonDisabled: {
    opacity: 0.7,
  },
  unblockButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
