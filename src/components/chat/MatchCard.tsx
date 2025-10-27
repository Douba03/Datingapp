import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { ChatMatch } from '../../types/chat';
import { colors } from '../theme/colors';

interface MatchCardProps {
  match: ChatMatch;
  onPress: () => void;
}

export function MatchCard({ match, onPress }: MatchCardProps) {
  const formatLastMessage = () => {
    if (!match.last_message) return 'Start a conversation';
    
    const message = match.last_message.body;
    return message.length > 50 ? `${message.substring(0, 50)}...` : message;
  };

  const formatLastMessageTime = () => {
    if (!match.last_message) return '';
    
    const date = new Date(match.last_message.created_at);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return 'now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
    return date.toLocaleDateString();
  };

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.avatarContainer}>
        <Image
          source={{ uri: match.other_user.photos[0] }}
          style={styles.avatar}
        />
        {match.unread_count > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadText}>{match.unread_count}</Text>
          </View>
        )}
      </View>

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.name}>{match.other_user.first_name}</Text>
          <Text style={styles.age}>{match.other_user.age}</Text>
          <Text style={styles.time}>{formatLastMessageTime()}</Text>
        </View>
        
        <Text style={styles.lastMessage} numberOfLines={1}>
          {formatLastMessage()}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  unreadBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: colors.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginRight: 8,
  },
  age: {
    fontSize: 14,
    color: colors.textSecondary,
    marginRight: 8,
  },
  time: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 'auto',
  },
  lastMessage: {
    fontSize: 14,
    color: colors.textSecondary,
  },
});