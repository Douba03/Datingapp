import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SafeAreaView,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useChat } from '../../../hooks/useChat';
import { useAuth } from '../../../hooks/useAuth';
import { useTheme } from '../../../contexts/ThemeContext';
import { MessageBubble } from '../../../components/chat/MessageBubble';
import { MessageInput } from '../../../components/chat/MessageInput';
import { ProtectedRoute } from '../../../components/auth/ProtectedRoute';
import { BlockUserModal } from '../../../components/chat/BlockUserModal';
import { ReportUserModal } from '../../../components/chat/ReportUserModal';
import { supabase } from '../../../services/supabase/client';
import { usePhotoUpload } from '../../../hooks/usePhotoUpload';
import { colors as staticColors } from '../../../components/theme/colors';

function ChatScreen() {
  const { matchId } = useLocalSearchParams<{ matchId: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { colors } = useTheme();
  const { matches, sendMessage, markAsRead, loading, fetchMessages } = useChat();
  const [messages, setMessages] = useState<any[]>([]);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [attachLoading, setAttachLoading] = useState(false);
  const [blockModalVisible, setBlockModalVisible] = useState(false);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const { pickAndUploadPhoto } = usePhotoUpload();

  const match = matches.find(m => m.id === matchId);

  // Load messages when matchId changes
  useEffect(() => {
    let subscription: any = null;
    
    if (matchId && user) {
      console.log('[ChatScreen] MatchId changed:', matchId);
      loadMessages();
      subscription = setupRealtimeSubscription();
    }

    return () => {
      // Cleanup subscription
      console.log('[ChatScreen] Cleaning up subscriptions');
      if (subscription) {
        supabase.removeChannel(subscription);
      }
    };
  }, [matchId, user]);

  // Also load messages when match data is available
  useEffect(() => {
    if (match && matchId) {
      console.log('[ChatScreen] Match data available');
      // Don't load messages again - already loaded in the first useEffect
    }
  }, [match]);

  // Manual refresh function for debugging
  const refreshMessages = async () => {
    console.log('[ChatScreen] Manual refresh triggered');
    await loadMessages();
  };

  const loadMessages = async () => {
    if (!matchId) return;
    
    setLoadingMessages(true);
    try {
      console.log('[ChatScreen] Loading messages for match:', matchId);
      
      // Direct query to avoid hook complexity
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .eq('match_id', matchId)
        .order('created_at', { ascending: true });

      if (messagesError) {
        console.error('[ChatScreen] Error fetching messages:', messagesError);
        setMessages([]);
        return;
      }

      if (!messagesData || messagesData.length === 0) {
        console.log('[ChatScreen] No messages found for match:', matchId);
        setMessages([]);
        return;
      }

      console.log('[ChatScreen] Raw messages from DB:', messagesData.length);

      // Get sender profiles for display
      const senderIds = [...new Set(messagesData.map(msg => msg.sender_id))];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, first_name, photos')
        .in('user_id', senderIds);

      // Combine messages with sender info
      const messagesWithSenders = messagesData.map(message => ({
        ...message,
        sender: profilesData?.find(profile => profile.user_id === message.sender_id) || {
          user_id: message.sender_id,
          first_name: 'Unknown',
          photos: []
        }
      }));

      console.log('[ChatScreen] Messages loaded with senders:', messagesWithSenders.length);
      setMessages(messagesWithSenders);
      
    } catch (error) {
      console.error('[ChatScreen] Error in loadMessages:', error);
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  };

  const setupRealtimeSubscription = () => {
    console.log('[ChatScreen] 🔧 setupRealtimeSubscription called with matchId:', matchId, 'user:', user ? 'exists' : 'missing');
    
    if (!matchId || !user) {
      console.log('[ChatScreen] ❌ Cannot setup subscription - missing matchId or user');
      return null;
    }

    console.log('[ChatScreen] ✅ Setting up real-time subscription for match:', matchId);

    try {
      // Test subscription status first
      console.log('[ChatScreen] Testing real-time connection...');

      const subscription = supabase
        .channel(`match:${matchId}:messages`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `match_id=eq.${matchId}`,
          },
          (payload) => {
            console.log('[ChatScreen] 🔔 Real-time message received:', payload);

            if (payload.new) {
              const newMessage = payload.new as any;
              console.log('[ChatScreen] New message data:', newMessage);

              // Check if this message is from another user (not current user)
              if (newMessage.sender_id === user.id) {
                console.log('[ChatScreen] Ignoring own message in real-time update');
                return;
              }

              console.log('[ChatScreen] Adding message from other user');

              // Add message immediately with basic sender info
              setMessages(prev => {
                const exists = prev.some(msg => msg.id === newMessage.id);
                if (exists) {
                  console.log('[ChatScreen] Message already exists, skipping');
                  return prev;
                }

                const messageWithSender = {
                  ...newMessage,
                  sender: {
                    user_id: newMessage.sender_id,
                    first_name: 'User',
                    photos: []
                  }
                };

                console.log('[ChatScreen] ✅ Adding new message to chat');
                return [...prev, messageWithSender];
              });
            }
          }
        )
        .subscribe((status) => {
          console.log('[ChatScreen] 📡 Subscription status:', status);
          if (status === 'SUBSCRIBED') {
            console.log('[ChatScreen] ✅ Real-time subscription active');
          } else if (status === 'CHANNEL_ERROR') {
            console.error('[ChatScreen] ❌ Real-time subscription error - real-time may not be enabled');
          } else if (status === 'TIMED_OUT') {
            console.error('[ChatScreen] ❌ Real-time subscription timed out');
          } else if (status === 'CLOSED') {
            console.log('[ChatScreen] ❌ Real-time subscription closed');
          }
        });

      return subscription;
    } catch (error) {
      console.error('[ChatScreen] Error setting up real-time subscription:', error);
      return null;
    }
  };

  useEffect(() => {
    if (match) {
      // Mark messages as read when entering chat
      markAsRead(matchId);
    }
  }, [matchId, markAsRead, match]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  const handleSendMessage = async (message: string) => {
    if (!match || sendingMessage || !user) return;

    setSendingMessage(true);
    
    // Add message optimistically to UI for immediate feedback
    const tempMessage = {
      id: `temp-${Date.now()}`,
      body: message,
      sender_id: user.id,
      match_id: matchId,
      created_at: new Date().toISOString(),
      message_type: 'text',
      media: [],
      is_temp: true,
    };
    
    setMessages(prev => [...prev, tempMessage]);
    console.log('[ChatScreen] Sending message:', message);

    try {
      const { data, error } = await sendMessage(matchId, message);
      if (error) {
        console.error('[ChatScreen] Error sending message:', error);
        Alert.alert('Error', 'Failed to send message. Please try again.');
        // Remove temp message on error
        setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
      } else {
        console.log('[ChatScreen] Message sent successfully:', data);
        // Replace temp message with the saved message - ensure sender_id is preserved
        setMessages(prev =>
          prev.map(msg => (msg.id === tempMessage.id ? { 
            ...data, 
            sender_id: user.id, // Ensure sender_id is always set correctly
            sender: {
              user_id: user.id,
              first_name: (user as any).user_metadata?.first_name || 'You',
              photos: []
            }
          } : msg))
        );
      }
    } catch (error) {
      console.error('[ChatScreen] Error sending message:', error);
      Alert.alert('Error', 'Failed to send message. Please try again.');
      setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
    } finally {
      setSendingMessage(false);
    }
  };

  const handleAttach = async () => {
    if (!match || !user) return;
    try {
      setAttachLoading(true);
      const { url, error } = await pickAndUploadPhoto();
      if (error || !url) {
        Alert.alert('Upload Error', error?.message || 'Failed to upload');
        return;
      }
      // Send media message with empty body + media array
      const { data, error: sendErr } = await supabase
        .from('messages')
        .insert({
          match_id: matchId,
          sender_id: user.id,
          body: '',
          media: [url],
          message_type: 'image',
        })
        .select()
        .single();
      if (sendErr) {
        console.error('[ChatScreen] Media send error:', sendErr);
        Alert.alert('Error', 'Failed to send attachment');
        return;
      }

      // Send push notification for media message
      // Temporarily disabled until Edge Functions are deployed
      /*
      try {
        const { data: matchData } = await supabase
          .from('matches')
          .select('user_a_id, user_b_id')
          .eq('id', matchId)
          .single();

        if (matchData) {
          const recipientId = matchData.user_a_id === user.id ? matchData.user_b_id : matchData.user_a_id;
          
          const { notificationService } = await import('../../../services/notifications');
          await notificationService.sendMessageNotification(
            recipientId,
            user.id,
            data.id,
            matchId,
            '📷 Photo'
          );
          console.log('[ChatScreen] Push notification sent for media');
        }
      } catch (notificationError) {
        console.error('[ChatScreen] Failed to send push notification:', notificationError);
      }
      */
      console.log('[ChatScreen] Push notifications disabled until Edge Functions are deployed');

      // Refresh list; realtime will also catch it, but ensure immediate UX
      await loadMessages();
    } catch (e: any) {
      console.error('[ChatScreen] handleAttach error:', e);
      Alert.alert('Error', e?.message || 'Attachment failed');
    } finally {
      setAttachLoading(false);
    }
  };

  const handleBlockUser = async (reason: string, details: string) => {
    if (!match || !user) return;

    try {
      const { error } = await supabase
        .from('user_blocks')
        .insert({ blocker_user_id: user.id, blocked_user_id: (match.other_user as any).user_id });
      
      if (error) {
        console.error('[ChatScreen] Block error:', error);
        Alert.alert('Error', 'Failed to block user');
        return;
      }

      // Log a lightweight report entry as context (optional)
      await supabase
        .from('user_reports')
        .insert({
          reporter_user_id: user.id,
          reported_user_id: (match.other_user as any).user_id,
          match_id: match.id,
          reason,
          details: details || 'User chose to block',
        });

      setBlockModalVisible(false);
      
      if (Platform.OS === 'web') {
        window.alert('User blocked successfully. You will no longer see or match with this user.');
      } else {
        Alert.alert('Blocked', 'You will no longer see or match with this user.');
      }
      
      router.back();
    } catch (e: any) {
      console.error('[ChatScreen] Block error:', e);
      Alert.alert('Error', e?.message || 'Failed to block user');
    }
  };

  const handleBackPress = () => {
    router.back();
  };

  const handleProfilePress = () => {
    if (!match) return;
    // Open the other user's profile directly in read-only mode
    router.push({ pathname: '/(tabs)/profile', params: { viewUserId: (match.other_user as any).user_id, readonly: '1' } as any });
  };

  const handleReportUser = async (reason: string, details: string) => {
    if (!match || !user) return;

    try {
      const { error } = await supabase
        .from('user_reports')
        .insert({
          reporter_user_id: user.id,
          reported_user_id: (match.other_user as any).user_id,
          match_id: match.id,
          reason,
          details,
        });
      
      if (error) {
        console.error('[ChatScreen] Report submit error:', error);
        Alert.alert('Error', 'Failed to submit report');
        return;
      }

      setReportModalVisible(false);
      
      if (Platform.OS === 'web') {
        window.alert('Thank you for your report. Our team will review it shortly.');
      } else {
        Alert.alert('Thank you', 'Your report has been submitted and will be reviewed by our team.');
      }
    } catch (e: any) {
      console.error('[ChatScreen] Report error:', e);
      Alert.alert('Error', e?.message || 'Failed to submit report');
    }
  };

  const handleImageOpen = (url: string) => {
    // For now, open in a new tab on web; could replace with a modal/gallery later
    try {
      // @ts-ignore - web only
      if (typeof window !== 'undefined' && window?.open) {
        window.open(url, '_blank');
      }
    } catch {}
  };

  if (loading || loadingMessages) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading chat...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!match) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.errorContainer}>
          <Ionicons name="chatbubbles-outline" size={64} color={colors.textSecondary} />
          <Text style={[styles.errorText, { color: colors.text }]}>Match not found</Text>
          <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
            <Text style={[styles.backButtonText, { color: colors.primary }]}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Block User Modal */}
      <BlockUserModal
        visible={blockModalVisible}
        userName={match.other_user.first_name}
        onBlock={handleBlockUser}
        onCancel={() => setBlockModalVisible(false)}
      />

      {/* Report User Modal */}
      <ReportUserModal
        visible={reportModalVisible}
        userName={match.other_user.first_name}
        onReport={handleReportUser}
        onCancel={() => setReportModalVisible(false)}
      />

      {/* Enhanced Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.profileSection} onPress={handleProfilePress}>
          <Image
            source={{ 
              uri: match.other_user.photos?.[0] || 'https://via.placeholder.com/40' 
            }}
            style={[styles.profileImage, { borderColor: colors.primary }]}
          />
          <View style={styles.profileInfo}>
            <Text style={[styles.matchName, { color: colors.text }]}>
              {match.other_user.first_name}, {match.other_user.age}
            </Text>
            <Text style={[styles.onlineStatus, { color: colors.success }]}>
              {isTyping ? 'Typing...' : 'Online'}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.moreButton}
          onPress={() => setReportModalVisible(true)}
          accessibilityLabel="Report user"
        >
          <Ionicons name="flag-outline" size={22} color={colors.error} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.refreshButton}
          onPress={refreshMessages}
          accessibilityLabel="Refresh messages"
        >
          <Ionicons name="refresh" size={20} color={colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.moreButton}
          onPress={() => setBlockModalVisible(true)}
          accessibilityLabel="Block user"
        >
          <Ionicons name="ban-outline" size={22} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Messages + Input wrapped in KeyboardAvoidingView */}
      <KeyboardAvoidingView 
        style={styles.chatArea}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 25}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <MessageBubble message={item} onImagePress={handleImageOpen} />}
          contentContainerStyle={styles.messagesContainer}
          inverted={false}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="always"
          ListEmptyComponent={() => (
            <View style={styles.emptyMessages}>
              <Ionicons name="chatbubbles-outline" size={48} color={colors.textSecondary} />
              <Text style={[styles.emptyText, { color: colors.text }]}>Start the conversation!</Text>
              <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>Say hi to {match.other_user.first_name}!</Text>
            </View>
          )}
        />

        {/* Message Input */}
        <MessageInput
          onSend={handleSendMessage}
          onAttach={handleAttach}
          attachLoading={attachLoading}
          placeholder={`Message ${match.other_user.first_name}...`}
          disabled={sendingMessage}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: staticColors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: staticColors.textSecondary,
  },
  header: {
    backgroundColor: staticColors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: staticColors.border,
    elevation: 2,
    height: 50,
  },
  chatArea: {
    flex: 1,
  },
  backButton: {
    padding: 4,
    marginRight: 4,
  },
  profileSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
    borderWidth: 2,
    borderColor: staticColors.primary,
  },
  profileInfo: {
    flex: 1,
  },
  matchName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: staticColors.text,
  },
  onlineStatus: {
    fontSize: 12,
    color: staticColors.success,
    marginTop: 1,
  },
  moreButton: {
    padding: 6,
    marginLeft: 4,
  },
  refreshButton: {
    padding: 6,
    marginLeft: 2,
  },
  messagesContainer: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  emptyMessages: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: staticColors.text,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: staticColors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: staticColors.text,
    marginTop: 16,
    textAlign: 'center',
  },
  backButtonText: {
    fontSize: 16,
    color: staticColors.primary,
    fontWeight: 'bold',
    marginTop: 16,
  },
});

export default function ChatScreenWrapper() {
  return (
    <ProtectedRoute>
      <ChatScreen />
    </ProtectedRoute>
  );
}