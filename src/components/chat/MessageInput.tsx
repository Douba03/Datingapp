import React, { useState, useRef, useMemo, useCallback } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

// Expanded built-in emoji palette (no external deps)
const emojiCategories: { key: string; label: string; emojis: string[] }[] = [
  {
    key: 'smileys',
    label: 'Smileys',
    emojis: '😀 😁 😂 🤣 😊 😇 🙂 🙃 😉 😍 🥰 😘 😗 😙 😚 😋 😛 😜 🤪 😝 🤑 🤗 🤭 🤫 🤔 🤐 🤨 😐 😑 😶 🙄 😏 😣 😥 😮 🤐 😯 😪 😫 🥱 😴 😌 😛'.split(' '),
  },
  {
    key: 'gestures',
    label: 'Gestures',
    emojis: '👍 👎 👌 🤌 🤏 ✌️ 🤞 🤟 🤘 🤙 👋 🤚 ✋ 🖖 👊 🤛 🤜 👏 🙌 👐 🤲 🙏 💪'.split(' '),
  },
  {
    key: 'hearts',
    label: 'Hearts',
    emojis: '❤️ 🧡 💛 💚 💙 💜 🖤 🤍 🤎 💖 💘 💝 💗 💓 💞 💕 💟 💔 ❣️ 💯'.split(' '),
  },
  {
    key: 'activities',
    label: 'Fun',
    emojis: '🎉 🎊 ✨ 🌟 ⭐ 🎈 🎁 🪅 🪩 🎂 🍰 🧁 🍕 🍔 🍟 🌮 🌯 🍣 🍜 🍩 🍪 🍫'.split(' '),
  },
  {
    key: 'animals',
    label: 'Animals',
    emojis: '🐶 🐱 🐭 🐹 🐰 🦊 🐻 🐼 🐨 🐯 🦁 🐮 🐷 🐸 🐵 🐔 🐧 🐦 🐤 🐣 🐺 🐗'.split(' '),
  },
  {
    key: 'travel',
    label: 'Travel',
    emojis: '🚗 🚌 🚎 🚕 🚙 🚓 🚑 🚒 🚚 ✈️ 🛫 🛬 🚂 🚆 🚄 🚀 🛸 🚁 ⛵ 🚢 🏖️ 🗺️'.split(' '),
  },
  {
    key: 'objects',
    label: 'Objects',
    emojis: '📱 💻 ⌨️ 🖱️ 🖥️ 🕹️ 📷 🎥 🎧 🎤 ⏰ 🕰️ 🔦 🔑 💡 🔋 🔌 📦 📎 📌 ✏️ 🖊️'.split(' '),
  },
  {
    key: 'symbols',
    label: 'Symbols',
    emojis: '✔️ ✖️ ➕ ➖ ➗ ❗ ❓ ‼️ ⁉️ 🔥 💥 💫 💨 🌀 💢 💬 🗯️ 🏁 🔔 🔕'.split(' '),
  },
];

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
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [emojiCategory, setEmojiCategory] = useState<string>('smileys');
  const textInputRef = useRef<TextInput>(null);

  // Memoize the chunk function to avoid recreating on every render
  const chunk = useCallback((arr: string[], size: number) => {
    const out: string[][] = [];
    for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
    return out;
  }, []);

  // Memoize handlers to prevent unnecessary re-renders
  const handleSend = useCallback(() => {
    if (message.trim() && !disabled && !loading) {
      onSend(message.trim());
      setMessage('');
      textInputRef.current?.blur();
    }
  }, [message, disabled, loading, onSend]);

  const handleEmojiPress = useCallback(() => {
    if (disabled) return;
    setShowEmojiPicker(prev => !prev);
  }, [disabled]);

  const handleAttachmentPress = useCallback(() => {
    if (disabled || loading || attachLoading) return;
    if (onAttach) onAttach();
  }, [disabled, loading, attachLoading, onAttach]);

  // Memoize derived state
  const canSend = useMemo(() => message.trim().length > 0 && !disabled && !loading, [message, disabled, loading]);

  // Memoize emoji grid - must be outside conditional render to follow hooks rules
  const emojiGridContent = useMemo(() => {
    if (!showEmojiPicker) return null;
    const emojis = emojiCategories.find(c => c.key === emojiCategory)?.emojis || [];
    return chunk(emojis, 8).map((row, idx) => (
      <View key={idx} style={styles.emojiRow}>
        {row.map(e => (
          <TouchableOpacity
            key={e}
            style={styles.emojiItem}
            onPress={() => {
              setMessage(prev => prev + e);
              textInputRef.current?.focus();
            }}
          >
            <Text style={styles.emojiText}>{e}</Text>
          </TouchableOpacity>
        ))}
      </View>
    ));
  }, [showEmojiPicker, emojiCategory, chunk]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
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
        <View style={[styles.inputWrapper, isFocused && styles.inputWrapperFocused]}>
          <TextInput
            ref={textInputRef}
            style={styles.textInput}
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
          
          {/* Emoji Button */}
          <TouchableOpacity
            style={styles.emojiButton}
            onPress={handleEmojiPress}
            disabled={disabled}
          >
            <Ionicons 
              name="happy-outline" 
              size={20} 
              color={disabled ? colors.textSecondary : colors.textSecondary} 
            />
          </TouchableOpacity>
        </View>

        {/* Send Button */}
        <TouchableOpacity
          style={[styles.sendButton, canSend && styles.sendButtonActive]}
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

      {showEmojiPicker && (
        <View style={styles.emojiPanel}>
          <View style={styles.emojiTabs}>
            {emojiCategories.map(cat => (
              <TouchableOpacity
                key={cat.key}
                style={[styles.emojiTab, emojiCategory === cat.key && styles.emojiTabActive]}
                onPress={() => setEmojiCategory(cat.key)}
              >
                <Text style={[styles.emojiTabText, emojiCategory === cat.key && styles.emojiTabTextActive]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.emojiGrid}>
            {emojiGridContent}
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
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
    backgroundColor: colors.background,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 4,
    paddingVertical: 4,
    minHeight: 48,
  },
  inputWrapperFocused: {
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  textInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    maxHeight: 100,
    color: colors.text,
  },
  emojiButton: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.textSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  sendButtonActive: {
    backgroundColor: colors.primary,
  },
  emojiPanel: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  emojiTabs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  emojiTab: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: colors.background,
  },
  emojiTabActive: {
    backgroundColor: `${colors.primary}20`,
  },
  emojiTabText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  emojiTabTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  emojiGrid: {
    maxHeight: 210,
  },
  emojiRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  emojiItem: {
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  emojiText: {
    fontSize: 22,
  },
});
