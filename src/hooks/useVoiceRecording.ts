import { useState, useRef, useEffect } from 'react';
import { Alert } from 'react-native';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';
import { supabase } from '../services/supabase/client';

interface UseVoiceRecordingReturn {
  isRecording: boolean;
  recordingDuration: number;
  metering: number;
  waveformData: number[]; // Store actual voice levels
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<string | null>;
  cancelRecording: () => Promise<void>;
  uploadVoiceNote: (uri: string) => Promise<{ url: string | null; error: Error | null }>;
}

export function useVoiceRecording(): UseVoiceRecordingReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [metering, setMetering] = useState(0);
  const [waveformData, setWaveformData] = useState<number[]>([]);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync().catch(() => {});
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Microphone access is needed for voice messages.');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // Clear previous waveform data
      setWaveformData([]);

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
        (status: any) => {
          if (status.isRecording && status.metering !== undefined) {
            const normalized = Math.max(0, (status.metering + 60) / 60);
            setMetering(normalized);
            // Add to waveform data (keep last 40 samples)
            setWaveformData(prev => {
              const newData = [...prev, normalized];
              return newData.slice(-40);
            });
          }
        },
        100 // Update every 100ms
      );

      recordingRef.current = recording;
      setIsRecording(true);
      setRecordingDuration(0);

      timerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error('[VoiceRecording] Start error:', error);
      Alert.alert('Error', 'Failed to start recording');
    }
  };

  const stopRecording = async (): Promise<string | null> => {
    try {
      if (!recordingRef.current) return null;

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      // Get URI before stopping
      const uri = recordingRef.current.getURI();
      
      // Check status before trying to stop
      const status = await recordingRef.current.getStatusAsync();
      if (status.isRecording || status.canRecord) {
        await recordingRef.current.stopAndUnloadAsync();
      }

      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });

      recordingRef.current = null;
      setIsRecording(false);
      setRecordingDuration(0);
      setMetering(0);

      return uri;
    } catch (error) {
      console.error('[VoiceRecording] Stop error:', error);
      recordingRef.current = null;
      setIsRecording(false);
      setRecordingDuration(0);
      setMetering(0);
      return null;
    }
  };

  const cancelRecording = async () => {
    try {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (recordingRef.current) {
        await recordingRef.current.stopAndUnloadAsync();
        recordingRef.current = null;
      }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
      setIsRecording(false);
      setRecordingDuration(0);
      setMetering(0);
    } catch (error) {
      console.error('[VoiceRecording] Cancel error:', error);
      setIsRecording(false);
    }
  };

  const uploadVoiceNote = async (uri: string): Promise<{ url: string | null; error: Error | null }> => {
    try {
      // Get current user for path
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { url: null, error: new Error('Not authenticated') };
      }

      const base64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });
      const fileName = `voice_${Date.now()}.m4a`;
      // Use user ID in path to match RLS policy (same as photos)
      const filePath = `${user.id}/${fileName}`;

      const binaryString = atob(base64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const { error } = await supabase.storage
        .from('profile-pictures')
        .upload(filePath, bytes, { contentType: 'audio/m4a', upsert: false });

      if (error) {
        return { url: null, error: new Error(error.message) };
      }

      const { data: urlData } = supabase.storage.from('profile-pictures').getPublicUrl(filePath);
      return { url: urlData.publicUrl, error: null };
    } catch (error) {
      return { url: null, error: error as Error };
    }
  };

  return {
    isRecording,
    recordingDuration,
    metering,
    waveformData,
    startRecording,
    stopRecording,
    cancelRecording,
    uploadVoiceNote,
  };
}
