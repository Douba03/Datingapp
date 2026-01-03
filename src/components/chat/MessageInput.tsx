import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Keyboard,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useVoiceRecording } from '../../hooks/useVoiceRecording';

interface MessageInputProps {
  onSend: (message: string) => void;
  onSendVoice?: (voiceUrl: string, duration: number) => void | Promise<void>;
  onCamera?: () => void | Promise<void>;
  onImage?: () => void | Promise<void>;
  onGif?: () => void | Promise<void>;
  onInputFocus?: () => void;
  disabled?: boolean;
  placeholder?: string;
  loading?: boolean;
  attachLoading?: boolean;
}

export function MessageInput({
  onSend,
  onSendVoice,
  onCamera,
  onImage,
  onGif,
  onInputFocus,
  disabled = false,
  placeholder = 'Type a message...',
  loading = false,
  attachLoading = false,
}: MessageInputProps) {
  const [message, setMessage] = useState('');
  const [sendingVoice, setSendingVoice] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const { colors } = useTheme();
  const { isRecording, recordingDuration, metering, waveformData, startRecording, stopRecording, cancelRecording, uploadVoiceNote } = useVoiceRecording();
  
  // Animation values
  const iconsOpacity = useRef(new Animated.Value(1)).current;
  const sendOpacity = useRef(new Animated.Value(0)).current;
  const sendScale = useRef(new Animated.Value(0.5)).current;

  const hasText = message.trim().length > 0;

  // Format duration as MM:SS
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Animate between icons and send button
  useEffect(() => {
    if (hasText) {
      // Hide icons, show send
      Animated.parallel([
        Animated.timing(iconsOpacity, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(sendOpacity, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.spring(sendScale, {
          toValue: 1,
          friction: 8,
          tension: 100,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Show icons, hide send
      Animated.parallel([
        Animated.timing(iconsOpacity, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(sendOpacity, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(sendScale, {
          toValue: 0.5,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [hasText]);

  const handleSend = () => {
    const trimmedMessage = message.trim();
    if (trimmedMessage && !disabled && !loading) {
      onSend(trimmedMessage);
      setMessage('');
      Keyboard.dismiss();
    }
  };

  const handleCamera = () => {
    if (disabled || loading || attachLoading) return;
    if (onCamera) onCamera();
  };

  const handleImage = () => {
    if (disabled || loading || attachLoading) return;
    if (onImage) onImage();
  };

  const handleMicPress = async () => {
    if (disabled || loading) return;
    if (!isRecording) {
      await startRecording();
    }
  };

  const handleSendVoice = async () => {
    if (!isRecording || sendingVoice) return;
    
    setSendingVoice(true);
    const duration = recordingDuration;
    const uri = await stopRecording();
    
    if (uri && onSendVoice) {
      const { url, error } = await uploadVoiceNote(uri);
      if (url) {
        await onSendVoice(url, duration);
      } else {
        console.error('[MessageInput] Voice upload failed:', error);
      }
    }
    setSendingVoice(false);
  };

  const handleCancelVoice = async () => {
    await cancelRecording();
  };

  const handleGif = () => {
    if (disabled || loading) return;
    // Dismiss keyboard before opening GIF picker
    Keyboard.dismiss();
    if (onGif) onGif();
  };

  const canSend = hasText && !disabled && !loading;

  // Voice Recording UI
  if (isRecording) {
    // Use real waveform data, reversed so newest is on right (moving backward to left)
    const numBars = 35;
    const reversedWaveform = [...waveformData].reverse();
    
    // Pad with zeros if not enough data yet
    const paddedWaveform = [...Array(numBars)].map((_, i) => {
      const dataIndex = i;
      if (dataIndex < reversedWaveform.length) {
        return reversedWaveform[dataIndex];
      }
      return 0.1; // Minimum height for empty bars
    });
    
    // Reverse again so oldest is on left, newest on right (appears to move left)
    const displayWaveform = paddedWaveform.reverse();

    return (
      <View style={[styles.inputBox, styles.recordingBox, { backgroundColor: colors.background, borderColor: colors.primary }]}>
        {/* Trash/Cancel Button - Left */}
        <TouchableOpacity
          style={styles.cancelRecordButton}
          onPress={handleCancelVoice}
          activeOpacity={0.7}
        >
          <Ionicons name="trash-outline" size={22} color={colors.error || '#EF4444'} />
        </TouchableOpacity>

        {/* Waveform - Real voice data, moves backward (left) as you speak */}
        <View style={styles.waveformContainer}>
          {displayWaveform.map((level, i) => {
            const height = 4 + level * 24; // 4px min, up to 28px max
            return (
              <View
                key={i}
                style={[
                  styles.waveformBar,
                  { 
                    backgroundColor: colors.primary,
                    height: height,
                    opacity: 0.5 + level * 0.5, // Louder = more opaque
                  }
                ]}
              />
            );
          })}
        </View>

        {/* Timer + Send Button - Right */}
        <View style={styles.recordingRight}>
          <Text style={[styles.recordingTimer, { color: colors.text }]}>
            {formatDuration(recordingDuration)}
          </Text>
          
          <TouchableOpacity
            style={[styles.sendVoiceButton, { backgroundColor: colors.primary }]}
            onPress={handleSendVoice}
            disabled={sendingVoice}
            activeOpacity={0.7}
          >
            {sendingVoice ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="send" size={18} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.inputBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
      {/* Camera Button - Left inside (HIDDEN) */}
      {/* <TouchableOpacity
        style={styles.cameraButton}
        onPress={handleCamera}
        disabled={disabled || attachLoading}
        activeOpacity={0.7}
      >
        {attachLoading ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          <Ionicons 
            name="camera" 
            size={22} 
            color={disabled ? colors.textSecondary : colors.primary} 
          />
        )}
      </TouchableOpacity> */}

      {/* Text Input */}
      <TextInput
        ref={inputRef}
        style={[styles.input, { color: colors.text }]}
        value={message}
        onChangeText={setMessage}
        onFocus={() => {
          // Close GIF picker when input is focused (keyboard will open)
          if (onInputFocus) onInputFocus();
        }}
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
      
      {/* Right side - Icons or Send button */}
      <View style={styles.rightSection}>
        {/* Icons (visible when no text) */}
        <Animated.View 
          style={[
            styles.inputIcons, 
            { opacity: iconsOpacity },
            !hasText ? {} : styles.hidden
          ]}
          pointerEvents={hasText ? 'none' : 'auto'}
        >
          {/* Mic Button (HIDDEN) */}
          {/* <TouchableOpacity
            style={styles.inputIconButton}
            onPress={handleMicPress}
            disabled={disabled}
            activeOpacity={0.7}
          >
            <Ionicons name="mic-outline" size={20} color={colors.textSecondary} />
          </TouchableOpacity> */}

          <TouchableOpacity
            style={styles.inputIconButton}
            onPress={handleImage}
            disabled={disabled || attachLoading}
            activeOpacity={0.7}
          >
            <Ionicons name="image-outline" size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          {/* GIF Button (HIDDEN) */}
          {/* <TouchableOpacity
            style={styles.inputIconButton}
            onPress={handleGif}
            disabled={disabled}
            activeOpacity={0.7}
          >
            <Text style={{ fontSize: 14, fontWeight: '700', color: colors.textSecondary }}>GIF</Text>
          </TouchableOpacity> */}
        </Animated.View>

        {/* Send Button (visible when has text) */}
        <Animated.View 
          style={[
            styles.sendButtonContainer,
            { 
              opacity: sendOpacity,
              transform: [{ scale: sendScale }],
            },
            hasText ? {} : styles.hidden
          ]}
          pointerEvents={hasText ? 'auto' : 'none'}
        >
          <TouchableOpacity
            style={[styles.sendButton, { backgroundColor: colors.primary }]}
            onPress={handleSend}
            disabled={!canSend}
            activeOpacity={0.7}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="send" size={16} color="#fff" />
            )}
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 24,
    borderWidth: 1,
    minHeight: 48,
    maxHeight: 100,
    marginHorizontal: 12,
    marginVertical: 8,
    marginBottom: 12,
    paddingLeft: 4,
    paddingRight: 6,
  },
  cameraButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    fontSize: 16,
    lineHeight: 20,
  },
  rightSection: {
    position: 'relative',
    height: 36,
    justifyContent: 'center',
  },
  inputIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputIconButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonContainer: {
    position: 'absolute',
    right: 0,
  },
  sendButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hidden: {
    position: 'absolute',
  },
  // Voice Recording Styles
  recordingBox: {
    borderWidth: 2,
    paddingHorizontal: 8,
  },
  cancelRecordButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  waveformContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 32,
    marginHorizontal: 12,
  },
  waveformBar: {
    width: 2.5,
    borderRadius: 1.5,
    minHeight: 4,
  },
  recordingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  recordingTimer: {
    fontSize: 14,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
    minWidth: 45,
  },
  sendVoiceButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
