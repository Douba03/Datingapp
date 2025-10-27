import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase/client';
import { ChatMessage, ChatMatch } from '../types/chat';
import { useAuth } from './useAuth';

export function useChat() {
  const { user } = useAuth();
  const [matches, setMatches] = useState<ChatMatch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    fetchMatches();

    // Subscribe to real-time updates
    let messagesSubscription: any = null;
    try {
      messagesSubscription = supabase
        .channel('messages')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'messages',
          },
          () => {
            fetchMatches();
          }
        )
        .subscribe();
    } catch (error) {
      console.error('[useChat] Error setting up real-time subscription:', error);
      // Continue without real-time updates
    }

    return () => {
      if (messagesSubscription) {
        supabase.removeChannel(messagesSubscription);
      }
    };
  }, [user]);

  const fetchMatches = async () => {
    if (!user) return;

    try {
      console.log('[useChat] Fetching matches for user:', user.id);

      // Fetch block lists (both directions) to exclude blocked conversations
      const [{ data: myBlocks }, { data: blockedMe }] = await Promise.all([
        supabase.from('user_blocks').select('blocked_user_id').eq('blocker_user_id', user.id),
        supabase.from('user_blocks').select('blocker_user_id').eq('blocked_user_id', user.id),
      ]);
      const blockedIds = [
        ...(myBlocks?.map(b => (b as any).blocked_user_id) || []),
        ...(blockedMe?.map(b => (b as any).blocker_user_id) || []),
      ];

      // Get matches for this user
      const { data: matchesData, error: matchesError } = await supabase
        .from('matches')
        .select('*')
        .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`)
        .eq('status', 'active')
        .order('last_message_at', { ascending: false, nullsFirst: false });

      if (matchesError) {
        console.error('[useChat] Matches query error:', matchesError);
        throw matchesError;
      }

      let filteredMatches = matchesData || [];
      // Exclude blocked users client-side (simpler than complex PostgREST filters)
      if (blockedIds.length > 0) {
        filteredMatches = filteredMatches.filter((m: any) => {
          const otherId = m.user_a_id === user.id ? m.user_b_id : m.user_a_id;
          return !blockedIds.includes(otherId);
        });
      }

      if (!filteredMatches || filteredMatches.length === 0) {
        console.log('[useChat] No matches found');
        setMatches([]);
        return;
      }

      console.log('[useChat] Found matches:', filteredMatches.length);

      // Get profiles for all other users in matches
      const otherUserIds = filteredMatches.map(match => 
        match.user_a_id === user.id ? match.user_b_id : match.user_a_id
      );

      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, first_name, photos, age')
        .in('user_id', otherUserIds);

      if (profilesError) {
        console.error('[useChat] Profiles query error:', profilesError);
        // Continue without profiles - don't crash
      }

      // Get last message and unread count for each match
      const matchesWithMessages = await Promise.all(
        filteredMatches.map(async (match) => {
          const otherUserId = match.user_a_id === user.id ? match.user_b_id : match.user_a_id;
          const otherUserProfile = profilesData?.find(p => p.user_id === otherUserId);

          try {
            const { data: lastMessage } = await supabase
              .from('messages')
              .select('*')
              .eq('match_id', match.id)
              .order('created_at', { ascending: false })
              .limit(1)
              .single();

            const { count: unreadCount } = await supabase
              .from('messages')
              .select('*', { count: 'exact', head: true })
              .eq('match_id', match.id)
              .eq('sender_id', otherUserId)
              .eq(`read_by_${match.user_a_id === user.id ? 'a' : 'b'}`, false);

            return {
              ...match,
              other_user: otherUserProfile || {
                user_id: otherUserId,
                first_name: 'Unknown',
                photos: [],
                age: 0,
              },
              last_message: lastMessage,
              unread_count: unreadCount || 0,
            };
          } catch (error) {
            console.error('[useChat] Error processing match:', match.id, error);
            return {
              ...match,
              other_user: otherUserProfile || {
                user_id: otherUserId,
                first_name: 'Unknown',
                photos: [],
                age: 0,
              },
              last_message: null,
              unread_count: 0,
            };
          }
        })
      );

      console.log('[useChat] Processed matches:', matchesWithMessages.length);
      setMatches(matchesWithMessages);
    } catch (error) {
      console.error('[useChat] Error fetching matches:', error);
      setMatches([]); // Set empty array instead of crashing
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (matchId: string, body: string, media: string[] = []) => {
    if (!user) return { error: new Error('No user logged in') };

    console.log('[useChat] Sending message:', { matchId, body });

    const { data, error } = await supabase
      .from('messages')
      .insert({
        match_id: matchId,
        sender_id: user.id,
        body,
        media,
        message_type: media.length > 0 ? 'image' : 'text',
      })
      .select()
      .single();

    if (!error) {
      console.log('[useChat] Message sent successfully:', data);
      
      // Update last_message_at on match
      await supabase
        .from('matches')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', matchId);

      // Send push notification (get recipient from match)
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
          
          const { notificationService } = await import('../services/notifications');
          await notificationService.sendMessageNotification(
            recipientId,
            user.id,
            data.id,
            matchId,
            body
          );
          console.log('[useChat] Push notification sent');
        }
      } catch (notificationError) {
        console.error('[useChat] Failed to send push notification:', notificationError);
        // Don't fail the message send if notification fails
      }
      */
      console.log('[useChat] Push notifications disabled until Edge Functions are deployed');
    } else {
      console.error('[useChat] Error sending message:', error);
    }

    return { data, error };
  };

  const fetchMessages = async (matchId: string) => {
    if (!user) return { data: [], error: new Error('No user logged in') };

    try {
      console.log('[useChat] Fetching messages for match:', matchId);
      
      // Fetch messages without foreign key join (avoid PGRST200 error)
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .eq('match_id', matchId)
        .order('created_at', { ascending: true });

      if (messagesError) {
        console.error('[useChat] Error fetching messages:', messagesError);
        return { data: [], error: messagesError };
      }

      if (!messagesData || messagesData.length === 0) {
        console.log('[useChat] No messages found');
        return { data: [], error: null };
      }

      // Get unique sender IDs
      const senderIds = [...new Set(messagesData.map(msg => msg.sender_id))];
      
      // Fetch sender profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, first_name, photos')
        .in('user_id', senderIds);

      if (profilesError) {
        console.error('[useChat] Error fetching sender profiles:', profilesError);
        // Continue without sender data
      }

      // Combine messages with sender data
      const messagesWithSenders = messagesData.map(message => ({
        ...message,
        sender: profilesData?.find(profile => profile.user_id === message.sender_id) || {
          user_id: message.sender_id,
          first_name: 'Unknown',
          photos: []
        }
      }));

      console.log('[useChat] Messages fetched:', messagesWithSenders.length);
      return { data: messagesWithSenders, error: null };
    } catch (error) {
      console.error('[useChat] Error in fetchMessages:', error);
      return { data: [], error };
    }
  };

  const markAsRead = async (matchId: string) => {
    if (!user) return { error: new Error('No user logged in') };

    const { data: match } = await supabase
      .from('matches')
      .select('user_a_id, user_b_id')
      .eq('id', matchId)
      .single();

    if (!match) return { error: new Error('Match not found') };

    const isUserA = match.user_a_id === user.id;
    const readField = isUserA ? 'read_by_a' : 'read_by_b';
    const readAtField = isUserA ? 'read_at_a' : 'read_at_b';

    const { error } = await supabase
      .from('messages')
      .update({
        [readField]: true,
        [readAtField]: new Date().toISOString(),
      })
      .eq('match_id', matchId)
      .eq('sender_id', match[isUserA ? 'user_b_id' : 'user_a_id']);

    return { error };
  };

  return {
    matches,
    loading,
    sendMessage,
    markAsRead,
    fetchMatches,
    fetchMessages,
  };
}
