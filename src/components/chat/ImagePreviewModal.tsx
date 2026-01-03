import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { BlurView } from 'expo-blur';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ImagePreviewModalProps {
  visible: boolean;
  imageUri: string | null;
  onSend: () => void;
  onCancel: () => void;
  sending?: boolean;
}

export function ImagePreviewModal({
  visible,
  imageUri,
  onSend,
  onCancel,
  sending = false,
}: ImagePreviewModalProps) {
  const { colors } = useTheme();

  if (!imageUri) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.container}>
        {/* Background blur */}
        <BlurView intensity={90} style={StyleSheet.absoluteFill} tint="dark" />
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.closeButton} 
            onPress={onCancel}
            disabled={sending}
          >
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Preview</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Image Preview */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: imageUri }}
            style={styles.previewImage}
            resizeMode="contain"
          />
        </View>

        {/* Bottom Actions */}
        <View style={styles.bottomActions}>
          <TouchableOpacity
            style={[styles.cancelButton, { borderColor: 'rgba(255,255,255,0.3)' }]}
            onPress={onCancel}
            disabled={sending}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.sendButton, { backgroundColor: colors.primary }]}
            onPress={onSend}
            disabled={sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="send" size={20} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.sendButtonText}>Send</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
  },
  closeButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  headerSpacer: {
    width: 44,
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  previewImage: {
    width: SCREEN_WIDTH - 40,
    height: SCREEN_HEIGHT * 0.5,
    borderRadius: 12,
  },
  bottomActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 50,
    gap: 16,
  },
  cancelButton: {
    flex: 1,
    height: 50,
    borderRadius: 25,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  sendButton: {
    flex: 1,
    height: 50,
    borderRadius: 25,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
