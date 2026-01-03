import React, { useMemo, useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
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
  const [isPlaying, setIsPlaying] = useState(false);
  const [playProgress, setPlayProgress] = useState(0); // 0 to 1
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  
  // Memoize isOwn to prevent unnecessary re-renders and layout jumps
  const isOwn = useMemo(() => {
    return message.sender_id === user?.id;
  }, [message.sender_id, user?.id]);

  const isVoiceMessage = message.message_type === 'voice';

  // Extract duration from body like "🎤 Voice message (3s)"
  const voiceDuration = useMemo(() => {
    if (!isVoiceMessage) return 0;
    const match = message.body?.match(/\((\d+)s\)/);
    return match ? parseInt(match[1], 10) : 0;
  }, [message.body, isVoiceMessage]);

  const playVoice = async () => {
    if (!message.media?.[0]) return;

    try {
      if (isPlaying && sound) {
        await sound.stopAsync();
        await sound.unloadAsync();
        setSound(null);
        setIsPlaying(false);
        setPlayProgress(0);
        return;
      }

      await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: message.media[0] },
        { shouldPlay: true }
      );
      setSound(newSound);
      setIsPlaying(true);

      newSound.setOnPlaybackStatusUpdate((status: any) => {
        if (status.isLoaded) {
          // Update progress
          if (status.durationMillis > 0) {
            setPlayProgress(status.positionMillis / status.durationMillis);
          }
        }
        if (status.didJustFinish) {
          setIsPlaying(false);
          setPlayProgress(0);
          newSound.unloadAsync();
          setSound(null);
        }
      });
    } catch (error) {
      console.error('[MessageBubble] Play voice error:', error);
      setIsPlaying(false);
    }
  };

  // Voice message UI
  if (isVoiceMessage) {
    // Calculate number of bars based on duration (min 15, max 35)
    const numBars = Math.min(35, Math.max(15, Math.floor(voiceDuration * 3)));
    // Bar width decreases as duration increases to fit more bars
    const barWidth = voiceDuration > 10 ? 2 : voiceDuration > 5 ? 2.5 : 3;
    // Gap decreases for longer messages
    const barGap = voiceDuration > 10 ? 1 : voiceDuration > 5 ? 1.5 : 2;
    
    // Generate consistent waveform based on message id (so it doesn't change on re-render)
    const waveformSeed = message.id.charCodeAt(0) + message.id.charCodeAt(message.id.length - 1);
    
    return (
      <View style={[styles.container, isOwn ? styles.ownMessage : styles.otherMessage]}>
        <View style={[
          styles.voiceBubble, 
          isOwn 
            ? { backgroundColor: colors.primary } 
            : { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }
        ]}>
          <TouchableOpacity onPress={playVoice} style={styles.playButton}>
            <Ionicons 
              name={isPlaying ? 'pause' : 'play'} 
              size={20} 
              color={isOwn ? '#fff' : colors.primary} 
            />
          </TouchableOpacity>
          
          {/* Waveform visualization - scales with duration, fills on play */}
          <View style={[styles.voiceWaveform, { gap: barGap }]}>
            {[...Array(numBars)].map((_, i) => {
              // Deterministic height based on position and seed
              const height = 4 + Math.abs(Math.sin((i + waveformSeed) * 0.7)) * 16;
              // Calculate if this bar should be filled based on progress
              const barProgress = i / numBars;
              const isFilled = playProgress > barProgress;
              
              // Colors: unfilled = faded, filled = solid
              const unfilledColor = isOwn ? 'rgba(255,255,255,0.3)' : `${colors.primary}40`;
              const filledColor = isOwn ? 'rgba(255,255,255,0.9)' : colors.primary;
              
              return (
                <View
                  key={i}
                  style={[
                    styles.voiceBar,
                    { 
                      width: barWidth,
                      height,
                      backgroundColor: isFilled ? filledColor : unfilledColor,
                    }
                  ]}
                />
              );
            })}
          </View>
          
          <Text style={[styles.voiceDuration, { color: isOwn ? 'rgba(255,255,255,0.8)' : colors.textSecondary }]}>
            {voiceDuration}s
          </Text>
        </View>
        <Text style={[styles.voiceTime, { color: colors.textSecondary, textAlign: isOwn ? 'right' : 'left' }]}>
          {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    );
  }

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
  // Voice message styles
  voiceBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 10,
  },
  playButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  voiceWaveform: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    height: 24,
  },
  voiceBar: {
    width: 3,
    borderRadius: 1.5,
    minHeight: 4,
  },
  voiceDuration: {
    fontSize: 12,
    fontWeight: '500',
    minWidth: 24,
  },
  voiceTime: {
    fontSize: 11,
    marginTop: 4,
    paddingHorizontal: 4,
  },
});
