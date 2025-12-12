import React, { useState, useRef } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';

interface MessageInputProps {
  onSend: (message: string) => void;
  onAttach?: () => void | Promise<void>;
  disabled?: boolean;
  placeholder?: string;
  loading?: boolean;
  attachLoading?: boolean;
}

export function MessageInput({
  onSend,
  onAttach,
  disabled = false,
  placeholder = 'Type a message...',
  loading = false,
  attachLoading = false,
}: MessageInputProps) {
  const [message, setMessage] = useState('');
  const inputRef = useRef<TextInput>(null);
  const { colors } = useTheme();

  const handleSend = () => {
    const trimmedMessage = message.trim();
    if (trimmedMessage && !disabled && !loading) {
      onSend(trimmedMessage);
      setMessage('');
      // Keep focus on input after sending
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  };

  const handleAttachmentPress = () => {
    if (disabled || loading || attachLoading) return;
    if (onAttach) onAttach();
  };

  const canSend = message.trim().length > 0 && !disabled && !loading;

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
      <View style={styles.inputRow}>
        {/* Attachment Button */}
        <TouchableOpacity
          style={styles.iconButton}
          onPress={handleAttachmentPress}
          disabled={disabled || attachLoading}
          activeOpacity={0.7}
        >
          {attachLoading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Ionicons 
              name="add-circle-outline" 
              size={28} 
              color={disabled ? colors.textSecondary : colors.primary} 
            />
          )}
        </TouchableOpacity>

        {/* Text Input */}
        <View style={[styles.inputBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <TextInput
            ref={inputRef}
            style={[styles.input, { color: colors.text }]}
            value={message}
            onChangeText={setMessage}
            placeholder={placeholder}
            placeholderTextColor={colors.textSecondary}
            multiline={true}
            numberOfLines={1}
            maxLength={500}
            editable={!disabled}
            autoCapitalize="sentences"
            autoCorrect={true}
            textAlignVertical="center"
            underlineColorAndroid="transparent"
            selectionColor={colors.primary}
          />
        </View>

        {/* Send Button */}
        <TouchableOpacity
          style={[
            styles.sendButton, 
            { backgroundColor: canSend ? colors.primary : colors.textSecondary }
          ]}
          onPress={handleSend}
          disabled={!canSend}
          activeOpacity={0.7}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="send" size={20} color="#fff" />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    paddingBottom: 12,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputBox: {
    flex: 1,
    borderRadius: 22,
    borderWidth: 1,
    minHeight: 44,
    maxHeight: 100,
    justifyContent: 'center',
  },
  input: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    lineHeight: 20,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
