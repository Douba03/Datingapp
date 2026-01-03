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
import { ImagePreviewModal } from '../../../components/chat/ImagePreviewModal';
import { GifPicker, PICKER_HEIGHT } from '../../../components/chat/GifPicker';
import { ChatMenuModal } from '../../../components/chat/ChatMenuModal';
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
  const [imagePreviewUri, setImagePreviewUri] = useState<string | null>(null);
  const [sendingImage, setSendingImage] = useState(false);
  const [gifPickerVisible, setGifPickerVisible] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const { uploadPhoto, pickPhoto, takePhoto } = usePhotoUpload();

  const match = matches.find(m => m.id === matchId);

  // Track last message timestamp for smart polling
  const lastMessageTimeRef = useRef<string | null>(null);
  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load messages when matchId changes
  useEffect(() => {
    let subscription: any = null;
    
    if (matchId && user) {
      loadMessages();
      subscription = setupRealtimeSubscription();
      
      // Smart polling fallback - check for new messages every 5 seconds
      // This runs silently without any UI refresh
      pollingIntervalRef.current = setInterval(() => {
        pollForNewMessages();
      }, 5000);
    }

    return () => {
      if (subscription) {
        supabase.removeChannel(subscription);
      }
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [matchId, user]);

  // Silent polling for new messages - no UI flicker
  const pollForNewMessages = async () => {
    if (!matchId || !user) return;
    
    try {
      // Only fetch messages newer than our last known message
      let query = supabase
        .from('messages')
        .select('*')
        .eq('match_id', matchId)
        .neq('sender_id', user.id) // Only check for OTHER user's messages
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (lastMessageTimeRef.current) {
        query = query.gt('created_at', lastMessageTimeRef.current);
      }
      
      const { data: newMessages } = await query;
      
      if (newMessages && newMessages.length > 0) {
        // Get sender info for new messages
        const senderIds = [...new Set(newMessages.map(m => m.sender_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, first_name, photos')
          .in('user_id', senderIds);
        
        // Add new messages to state without full reload
        const messagesWithSenders = newMessages.map(msg => ({
          ...msg,
          sender: profiles?.find(p => p.user_id === msg.sender_id) || {
            user_id: msg.sender_id,
            first_name: 'Unknown',
            photos: []
          }
        }));
        
        setMessages(prev => {
          // Filter out duplicates
          const existingIds = new Set(prev.map(m => m.id));
          const uniqueNew = messagesWithSenders.filter(m => !existingIds.has(m.id));
          
          if (uniqueNew.length > 0) {
            // Update last message time
            lastMessageTimeRef.current = uniqueNew[0].created_at;
            // Inverted FlatList auto-shows new messages at bottom
            return [...prev, ...uniqueNew.reverse()];
          }
          return prev;
        });
      }
    } catch (error) {
      // Silent fail - don't show errors for background polling
    }
  };

  // Also load messages when match data is available
  useEffect(() => {
    if (match && matchId) {
      // Update last message time when messages change
      if (messages.length > 0) {
        lastMessageTimeRef.current = messages[messages.length - 1].created_at;
      }
    }
  }, [match, messages.length]);

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
      setLoadingMessages(false);
      // With inverted FlatList, newest messages are automatically at the bottom
      
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
          if (status === 'SUBSCRIBED') {
            console.log('[ChatScreen] Real-time active');
          }
          // Silently handle errors - polling will be used as fallback
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

  // With inverted FlatList, new messages automatically appear at bottom
  // No manual scroll needed

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

  const sendMediaMessage = async (url: string) => {
    if (!match || !user) return;
    
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
    
    console.log('[ChatScreen] Media message sent');
    await loadMessages();
  };

  const handleCamera = async () => {
    if (!match || !user) return;
    try {
      setAttachLoading(true);
      const { uri, error } = await takePhoto();
      
      // User cancelled - no error, just return silently
      if (!uri && !error) {
        return;
      }
      
      if (error) {
        Alert.alert('Camera Error', error?.message || 'Failed to capture photo');
        return;
      }
      
      // Show preview instead of sending immediately
      setImagePreviewUri(uri);
    } catch (e: any) {
      console.error('[ChatScreen] handleCamera error:', e);
      Alert.alert('Error', e?.message || 'Camera failed');
    } finally {
      setAttachLoading(false);
    }
  };

  const handleImage = async () => {
    if (!match || !user) return;
    try {
      setAttachLoading(true);
      const { uri, error } = await pickPhoto();
      
      // User cancelled - no error, just return silently
      if (!uri && !error) {
        return;
      }
      
      if (error) {
        Alert.alert('Upload Error', error?.message || 'Failed to select image');
        return;
      }
      
      // Show preview instead of sending immediately
      setImagePreviewUri(uri);
    } catch (e: any) {
      console.error('[ChatScreen] handleImage error:', e);
      Alert.alert('Error', e?.message || 'Image selection failed');
    } finally {
      setAttachLoading(false);
    }
  };

  const handleSendImage = async () => {
    if (!imagePreviewUri || !match || !user) return;
    
    try {
      setSendingImage(true);
      const { url, error } = await uploadPhoto(imagePreviewUri);
      
      if (error || !url) {
        Alert.alert('Upload Error', error?.message || 'Failed to upload image');
        return;
      }
      
      await sendMediaMessage(url);
      setImagePreviewUri(null);
    } catch (e: any) {
      console.error('[ChatScreen] handleSendImage error:', e);
      Alert.alert('Error', e?.message || 'Failed to send image');
    } finally {
      setSendingImage(false);
    }
  };

  const handleCancelImagePreview = () => {
    setImagePreviewUri(null);
  };

  const handleSendVoice = async (voiceUrl: string, duration: number) => {
    if (!match || !user) return;
    
    // Optimistic update
    const tempId = `temp-voice-${Date.now()}`;
    const tempMessage = {
      id: tempId,
      match_id: matchId,
      sender_id: user.id,
      body: `🎤 Voice message (${duration}s)`,
      media: [voiceUrl],
      message_type: 'voice',
      created_at: new Date().toISOString(),
      sender: {
        id: user.id,
        first_name: 'You',
      },
    };
    
    setMessages(prev => [...prev, tempMessage]);
    // Inverted FlatList auto-shows new messages
    
    try {
      const { data, error: sendErr } = await supabase
        .from('messages')
        .insert({
          match_id: matchId,
          sender_id: user.id,
          body: `🎤 Voice message (${duration}s)`,
          media: [voiceUrl],
          message_type: 'voice',
        })
        .select()
        .single();
        
      if (sendErr) {
        console.error('[ChatScreen] Voice send error:', sendErr);
        setMessages(prev => prev.filter(m => m.id !== tempId));
        Alert.alert('Error', 'Failed to send voice message');
        return;
      }
      
      setMessages(prev => prev.map(m => m.id === tempId ? { ...data, sender: tempMessage.sender } : m));
      console.log('[ChatScreen] Voice message sent');
    } catch (e: any) {
      console.error('[ChatScreen] handleSendVoice error:', e);
      setMessages(prev => prev.filter(m => m.id !== tempId));
      Alert.alert('Error', e?.message || 'Failed to send voice message');
    }
  };

  const handleGif = () => {
    setGifPickerVisible(true);
  };

  const handleSelectGif = async (gifUrl: string) => {
    if (!match || !user) return;
    
    setGifPickerVisible(false);
    
    // Optimistic update - add GIF immediately to UI
    const tempId = `temp-gif-${Date.now()}`;
    const tempMessage = {
      id: tempId,
      match_id: matchId,
      sender_id: user.id,
      body: '',
      media: [gifUrl],
      message_type: 'gif',
      created_at: new Date().toISOString(),
      sender: {
        id: user.id,
        first_name: 'You',
      },
    };
    
    setMessages(prev => [...prev, tempMessage]);
    // Inverted FlatList auto-shows new messages
    
    try {
      // Send GIF to database
      const { data, error: sendErr } = await supabase
        .from('messages')
        .insert({
          match_id: matchId,
          sender_id: user.id,
          body: '',
          media: [gifUrl],
          message_type: 'gif',
        })
        .select()
        .single();
        
      if (sendErr) {
        console.error('[ChatScreen] GIF send error:', sendErr);
        // Remove temp message on error
        setMessages(prev => prev.filter(m => m.id !== tempId));
        Alert.alert('Error', 'Failed to send GIF');
        return;
      }
      
      // Replace temp message with real one
      setMessages(prev => prev.map(m => m.id === tempId ? { ...data, sender: tempMessage.sender } : m));
      console.log('[ChatScreen] GIF message sent');
    } catch (e: any) {
      console.error('[ChatScreen] handleSelectGif error:', e);
      setMessages(prev => prev.filter(m => m.id !== tempId));
      Alert.alert('Error', e?.message || 'Failed to send GIF');
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
      
      // Navigate to matches page after blocking
      router.replace('/(tabs)/matches');
    } catch (e: any) {
      console.error('[ChatScreen] Block error:', e);
      Alert.alert('Error', e?.message || 'Failed to block user');
    }
  };

  const handleBackPress = () => {
    // Navigate explicitly to matches page instead of using back()
    // This prevents navigation issues with nested routes
    router.replace('/(tabs)/matches');
  };

  const handleProfilePress = () => {
    if (!match) return;
    // Open the other user's profile directly in read-only mode
    // Pass returnTo so profile knows where to go back
    router.push({ 
      pathname: '/(tabs)/profile', 
      params: { 
        viewUserId: (match.other_user as any).user_id, 
        readonly: '1',
        returnTo: `/(tabs)/chat/${matchId}`
      } as any 
    });
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

      {/* Image Preview Modal */}
      <ImagePreviewModal
        visible={!!imagePreviewUri}
        imageUri={imagePreviewUri}
        onSend={handleSendImage}
        onCancel={handleCancelImagePreview}
        sending={sendingImage}
      />


      {/* Chat Menu Modal */}
      <ChatMenuModal
        visible={menuVisible}
        userName={match.other_user.first_name}
        onReport={() => {
          setMenuVisible(false);
          setTimeout(() => setReportModalVisible(true), 300);
        }}
        onBlock={() => {
          setMenuVisible(false);
          setTimeout(() => setBlockModalVisible(true), 300);
        }}
        onCancel={() => setMenuVisible(false)}
      />

      {/* Header - Matching app default style */}
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.headerContent} onPress={handleProfilePress}>
            <View style={[styles.avatarContainer, { backgroundColor: colors.primary }]}>
              <Image
                source={{ 
                  uri: match.other_user.photos?.[0] || 'https://via.placeholder.com/40' 
                }}
                style={styles.headerAvatar}
              />
            </View>
            <View style={styles.headerTitleContainer}>
              <Text style={[styles.headerTitle, { color: colors.text }]}>
                {match.other_user.first_name}, {match.other_user.age}
              </Text>
              <Text style={[styles.headerSubtitle, { color: colors.success }]}>
                {isTyping ? 'Typing...' : 'Online'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Menu Button */}
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => setMenuVisible(true)}
          accessibilityLabel="More options"
        >
          <Ionicons name="ellipsis-vertical" size={22} color={colors.text} />
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
          data={[...messages].reverse()}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <MessageBubble message={item} onImagePress={handleImageOpen} />}
          contentContainerStyle={styles.messagesContainer}
          inverted={true}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="always"
          ListEmptyComponent={() => (
            <View style={[styles.emptyMessages, { transform: [{ scaleY: -1 }] }]}>
              <Ionicons name="chatbubbles-outline" size={48} color={colors.textSecondary} />
              <Text style={[styles.emptyText, { color: colors.text }]}>Start the conversation!</Text>
              <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>Say hi to {match.other_user.first_name}!</Text>
            </View>
          )}
        />

        {/* Message Input - Always visible */}
        <MessageInput
          onSend={handleSendMessage}
          onSendVoice={handleSendVoice}
          onCamera={handleCamera}
          onImage={handleImage}
          onGif={handleGif}
          onInputFocus={() => setGifPickerVisible(false)}
          attachLoading={attachLoading}
          placeholder={`Message ${match.other_user.first_name}...`}
          disabled={sendingMessage}
        />

        {/* GIF Picker (shows below input, same space as keyboard) */}
        {gifPickerVisible && (
          <GifPicker
            onSelect={handleSelectGif}
            onClose={() => setGifPickerVisible(false)}
          />
        )}
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    marginHorizontal: 12,
    marginTop: 8,
    marginBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  headerTitleContainer: {
    marginLeft: 12,
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  headerSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  chatArea: {
    flex: 1,
  },
  backButton: {
    padding: 4,
    marginRight: 8,
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
  menuButton: {
    padding: 8,
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