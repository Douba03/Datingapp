import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { ChatMessage } from '../../types/chat';
import { useAuth } from '../../hooks/useAuth';
import { colors } from '../theme/colors';

interface MessageBubbleProps {
  message: ChatMessage;
  onImagePress?: (url: string) => void;
}

export function MessageBubble({ message, onImagePress }: MessageBubbleProps) {
  const { user } = useAuth();
  const isOwn = message.sender_id === user?.id;

  return (
    <View style={[styles.container, isOwn && styles.ownMessage]}>
      <View style={[styles.bubble, isOwn ? styles.ownBubble : styles.otherBubble]}>
        <Text style={[styles.text, isOwn ? styles.ownText : styles.otherText]}>
          {message.body}
        </Text>
        
        {message.media && message.media.length > 0 && (
          <View style={styles.mediaContainer}>
            {message.media.map((media, index) => (
              <TouchableOpacity key={index} activeOpacity={0.8} onPress={() => onImagePress?.(media)}>
                <Image source={{ uri: media }} style={styles.mediaImage} />
              </TouchableOpacity>
            ))}
          </View>
        )}
        
        <Text style={[styles.time, isOwn ? styles.ownTime : styles.otherTime]}>
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
  },
  ownMessage: {
    alignItems: 'flex-end',
  },
  bubble: {
    maxWidth: '80%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
  },
  ownBubble: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: colors.border,
    borderBottomLeftRadius: 4,
  },
  text: {
    fontSize: 16,
    lineHeight: 20,
  },
  ownText: {
    color: '#fff',
  },
  otherText: {
    color: colors.text,
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
  otherTime: {
    color: colors.textSecondary,
  },
});
