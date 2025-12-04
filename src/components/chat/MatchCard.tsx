import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { ChatMatch } from '../../types/chat';
import { useTheme } from '../../contexts/ThemeContext';

interface MatchCardProps {
  match: ChatMatch;
  onPress: () => void;
}

export function MatchCard({ match, onPress }: MatchCardProps) {
  const { colors } = useTheme();

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
    <TouchableOpacity 
      style={[styles.container, { backgroundColor: colors.surface, borderBottomColor: colors.border }]} 
      onPress={onPress}
    >
      <View style={styles.avatarContainer}>
        <Image
          source={{ uri: match.other_user.photos[0] }}
          style={styles.avatar}
        />
        {match.unread_count > 0 && (
          <View style={[styles.unreadBadge, { backgroundColor: colors.primary }]}>
            <Text style={styles.unreadText}>{match.unread_count}</Text>
          </View>
        )}
      </View>

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.name, { color: colors.text }]}>{match.other_user.first_name}</Text>
          <Text style={[styles.age, { color: colors.textSecondary }]}>{match.other_user.age}</Text>
          <Text style={[styles.time, { color: colors.textSecondary }]}>{formatLastMessageTime()}</Text>
        </View>
        
        <Text style={[styles.lastMessage, { color: colors.textSecondary }]} numberOfLines={1}>
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
    borderBottomWidth: 1,
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
    marginRight: 8,
  },
  age: {
    fontSize: 14,
    marginRight: 8,
  },
  time: {
    fontSize: 12,
    marginLeft: 'auto',
  },
  lastMessage: {
    fontSize: 14,
  },
});
