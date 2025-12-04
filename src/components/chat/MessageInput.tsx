import React, { useState, useRef, useMemo, useCallback } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
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
  const [isFocused, setIsFocused] = useState(false);
  const textInputRef = useRef<TextInput>(null);
  const { colors } = useTheme();

  // Memoize handlers to prevent unnecessary re-renders
  const handleSend = useCallback(() => {
    if (message.trim() && !disabled && !loading) {
      onSend(message.trim());
      setMessage('');
      textInputRef.current?.blur();
    }
  }, [message, disabled, loading, onSend]);

  const handleAttachmentPress = useCallback(() => {
    if (disabled || loading || attachLoading) return;
    if (onAttach) onAttach();
  }, [disabled, loading, attachLoading, onAttach]);

  // Memoize derived state
  const canSend = useMemo(() => message.trim().length > 0 && !disabled && !loading, [message, disabled, loading]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: colors.surface, borderTopColor: colors.border }]}
    >
      <View style={styles.inputContainer}>
        {/* Attachment Button */}
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleAttachmentPress}
          disabled={disabled || attachLoading}
        >
          {attachLoading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Ionicons 
              name="add-circle-outline" 
              size={24} 
              color={disabled ? colors.textSecondary : colors.primary} 
            />
          )}
        </TouchableOpacity>

        {/* Text Input */}
        <View style={[
          styles.inputWrapper, 
          { backgroundColor: colors.background, borderColor: colors.border },
          isFocused && { borderColor: colors.primary, shadowColor: colors.primary }
        ]}>
          <TextInput
            ref={textInputRef}
            style={[styles.textInput, { color: colors.text }]}
            value={message}
            onChangeText={setMessage}
            placeholder={placeholder}
            placeholderTextColor={colors.textSecondary}
            multiline
            maxLength={500}
            editable={!disabled}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            returnKeyType="send"
            onSubmitEditing={handleSend}
          />
        </View>

        {/* Send Button */}
        <TouchableOpacity
          style={[
            styles.sendButton, 
            { backgroundColor: colors.textSecondary },
            canSend && { backgroundColor: colors.primary }
          ]}
          onPress={handleSend}
          disabled={!canSend}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons 
              name="send" 
              size={20} 
              color={canSend ? "#fff" : colors.textSecondary} 
            />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  actionButton: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 4,
    paddingVertical: 4,
    minHeight: 48,
  },
  textInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
});
