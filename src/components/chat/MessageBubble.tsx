import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { ChatMessage } from '../../types/chat';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../contexts/ThemeContext';

interface MessageBubbleProps {
  message: ChatMessage;
  onImagePress?: (url: string) => void;
}

export function MessageBubble({ message, onImagePress }: MessageBubbleProps) {
  const { user } = useAuth();
  const { colors } = useTheme();
  
  // Memoize isOwn to prevent unnecessary re-renders and layout jumps
  const isOwn = useMemo(() => {
    return message.sender_id === user?.id;
  }, [message.sender_id, user?.id]);

  return (
    <View style={[styles.container, isOwn ? styles.ownMessage : styles.otherMessage]}>
      <View style={[
        styles.bubble, 
        isOwn 
          ? [styles.ownBubble, { backgroundColor: colors.primary }] 
          : [styles.otherBubble, { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }]
      ]}>
        {message.body ? (
          <Text style={[styles.text, isOwn ? styles.ownText : { color: colors.text }]}>
            {message.body}
          </Text>
        ) : null}
        
        {message.media && message.media.length > 0 && (
          <View style={styles.mediaContainer}>
            {message.media.map((media, index) => (
              <TouchableOpacity key={index} activeOpacity={0.8} onPress={() => onImagePress?.(media)}>
                <Image source={{ uri: media }} style={styles.mediaImage} />
              </TouchableOpacity>
            ))}
          </View>
        )}
        
        <Text style={[styles.time, isOwn ? styles.ownTime : { color: colors.textSecondary }]}>
          {new Date(message.created_at).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
    paddingHorizontal: 16,
    width: '100%',
    flexDirection: 'column',
  },
  ownMessage: {
    alignItems: 'flex-end',
  },
  otherMessage: {
    alignItems: 'flex-start',
  },
  bubble: {
    maxWidth: '80%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
  },
  ownBubble: {
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    borderBottomLeftRadius: 4,
  },
  text: {
    fontSize: 16,
    lineHeight: 20,
  },
  ownText: {
    color: '#fff',
  },
  mediaContainer: {
    marginTop: 8,
    gap: 8,
  },
  mediaImage: {
    width: 200,
    height: 200,
    borderRadius: 12,
  },
  time: {
    fontSize: 12,
    marginTop: 4,
  },
  ownTime: {
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'right',
  },
});
