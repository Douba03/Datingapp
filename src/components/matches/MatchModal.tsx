import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Dimensions, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface MatchModalProps {
  visible: boolean;
  matchedUserName: string;
  matchedUserPhoto?: string;
  onContinue: () => void;
  onSendMessage?: () => void;
  isSuperLike?: boolean;
}

export function MatchModal({ 
  visible, 
  matchedUserName, 
  matchedUserPhoto,
  onContinue,
  onSendMessage,
  isSuperLike = false
}: MatchModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onContinue}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Gradient Top Border */}
          <View style={styles.topBorder} />
          
          {/* Decorative Icons Background */}
          <View style={styles.heartsContainer}>
            <View style={[styles.heartIconWrapper, styles.heart1]}>
              <Ionicons name="heart" size={40} color="#FF6B9D" />
            </View>
            <View style={[styles.heartIconWrapper, styles.heart2]}>
              <Ionicons name="heart" size={35} color="#FF8A65" />
            </View>
            <View style={[styles.heartIconWrapper, styles.heart3]}>
              <Ionicons name="heart" size={30} color="#FF6B9D" />
            </View>
            <View style={[styles.heartIconWrapper, styles.heart4]}>
              <Ionicons name="star" size={45} color="#FFD700" />
            </View>
            <View style={[styles.heartIconWrapper, styles.heart5]}>
              <Ionicons name="sparkles" size={38} color="#FF6B9D" />
            </View>
          </View>

          {/* Match Icon Badge */}
          <View style={styles.iconContainer}>
            <View style={styles.iconCircle}>
              <Ionicons name="heart" size={50} color="#FF6B9D" />
            </View>
          </View>

          {/* Title */}
          <Text style={styles.title}>IT'S A MATCH!</Text>
          
          {/* Subtitle */}
          <Text style={styles.subtitle}>
            {isSuperLike ? (
              <>
                <Text style={styles.matchName}>{matchedUserName}</Text> Super Liked You!
              </>
            ) : (
              <>
                You and <Text style={styles.matchName}>{matchedUserName}</Text> liked each other!
              </>
            )}
          </Text>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Profile Photo (if available) */}
          {matchedUserPhoto && (
            <View style={styles.photoContainer}>
              <Image 
                source={{ uri: matchedUserPhoto }} 
                style={styles.photo}
                resizeMode="cover"
              />
              <View style={styles.photoOverlay}>
                <Ionicons name="heart" size={18} color="#fff" />
              </View>
            </View>
          )}

          {/* Match Info Card */}
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name="sparkles" size={20} color="#FF6B9D" style={styles.infoIcon} />
              <Text style={styles.infoText}>Start a conversation and get to know each other!</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="chatbubble" size={20} color="#FF6B9D" style={styles.infoIcon} />
              <Text style={styles.infoText}>Be respectful and have fun chatting!</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="checkmark-circle" size={20} color="#FF6B9D" style={styles.infoIcon} />
              <Text style={styles.infoText}>Your match is waiting in your Messages tab!</Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            {onSendMessage && (
              <TouchableOpacity 
                style={styles.primaryButton}
                onPress={onSendMessage}
                activeOpacity={0.8}
              >
                <Ionicons name="chatbubble" size={18} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.primaryButtonText}>Send Message</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity 
              style={styles.secondaryButton}
              onPress={onContinue}
              activeOpacity={0.8}
            >
              <Ionicons 
                name={onSendMessage ? "play-forward" : "checkmark"} 
                size={18} 
                color="#FF6B9D" 
                style={{ marginRight: 8 }} 
              />
              <Text style={styles.secondaryButtonText}>
                {onSendMessage ? 'Keep Swiping' : 'Continue'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Celebration Message */}
          <Text style={styles.celebrationText}>
            Congratulations on your new match!
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    width: Math.min(width - 40, 450),
    maxHeight: height * 0.85,
    overflow: 'hidden',
    position: 'relative',
  },
  topBorder: {
    height: 6,
    backgroundColor: '#FF6B9D',
  },
  heartsContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.15,
    pointerEvents: 'none',
  },
  heartIconWrapper: {
    position: 'absolute',
  },
  heart1: {
    top: 30,
    left: 20,
  },
  heart2: {
    top: 50,
    right: 30,
  },
  heart3: {
    top: 120,
    left: 40,
  },
  heart4: {
    top: 200,
    right: 50,
  },
  heart5: {
    top: 280,
    left: 60,
  },
  iconContainer: {
    alignItems: 'center',
    marginTop: 32,
    zIndex: 10,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFE5EC',
    borderWidth: 4,
    borderColor: '#FF6B9D',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF6B9D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FF6B9D',
    textAlign: 'center',
    marginTop: 24,
    marginHorizontal: 20,
    letterSpacing: 1.5,
    textShadowColor: 'rgba(255, 107, 157, 0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 12,
    marginHorizontal: 24,
    lineHeight: 24,
  },
  matchName: {
    fontWeight: '700',
    color: '#FF6B9D',
    fontSize: 17,
  },
  divider: {
    height: 2,
    backgroundColor: '#FF6B9D',
    marginHorizontal: 40,
    marginTop: 20,
    marginBottom: 20,
    borderRadius: 1,
    opacity: 0.3,
  },
  photoContainer: {
    alignItems: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  photo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: '#FF6B9D',
  },
  photoOverlay: {
    position: 'absolute',
    bottom: -5,
    right: '50%',
    marginRight: -55,
    backgroundColor: '#FF6B9D',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#ffffff',
  },
  infoCard: {
    backgroundColor: '#FFF0F5',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#FF6B9D',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  infoIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#444',
    lineHeight: 20,
  },
  buttonContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#FF6B9D',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    shadowColor: '#FF6B9D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  secondaryButton: {
    backgroundColor: '#ffffff',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FF6B9D',
  },
  secondaryButtonText: {
    color: '#FF6B9D',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  celebrationText: {
    fontSize: 13,
    color: '#999',
    textAlign: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
    fontStyle: 'italic',
  },
});
