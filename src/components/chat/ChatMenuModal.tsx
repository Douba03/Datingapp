import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ChatMenuModalProps {
  visible: boolean;
  userName: string;
  onReport: () => void;
  onBlock: () => void;
  onCancel: () => void;
}

export function ChatMenuModal({
  visible,
  userName,
  onReport,
  onBlock,
  onCancel,
}: ChatMenuModalProps) {
  const { colors, isDarkMode } = useTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <TouchableOpacity 
        style={styles.overlay} 
        activeOpacity={1} 
        onPress={onCancel}
      >
        <View style={[styles.menuContainer, { backgroundColor: colors.surface }]}>
          {/* Header */}
          <View style={[styles.menuHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.menuTitle, { color: colors.text }]}>
              Options for {userName}
            </Text>
          </View>

          {/* Report Option */}
          <TouchableOpacity
            style={[styles.menuItem, { borderBottomColor: colors.border }]}
            onPress={onReport}
            activeOpacity={0.7}
          >
            <View style={[styles.menuIconContainer, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
              <Ionicons name="flag" size={20} color="#F59E0B" />
            </View>
            <View style={styles.menuItemContent}>
              <Text style={[styles.menuItemTitle, { color: colors.text }]}>Report User</Text>
              <Text style={[styles.menuItemDescription, { color: colors.textSecondary }]}>
                Report inappropriate behavior
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          {/* Block Option */}
          <TouchableOpacity
            style={[styles.menuItem, { borderBottomColor: colors.border }]}
            onPress={onBlock}
            activeOpacity={0.7}
          >
            <View style={[styles.menuIconContainer, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
              <Ionicons name="ban" size={20} color="#EF4444" />
            </View>
            <View style={styles.menuItemContent}>
              <Text style={[styles.menuItemTitle, { color: colors.text }]}>Block User</Text>
              <Text style={[styles.menuItemDescription, { color: colors.textSecondary }]}>
                Stop seeing this person
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          {/* Cancel Button */}
          <TouchableOpacity
            style={[styles.cancelButton, { backgroundColor: isDarkMode ? colors.background : '#F3F4F6' }]}
            onPress={onCancel}
            activeOpacity={0.8}
          >
            <Text style={[styles.cancelButtonText, { color: colors.text }]}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  menuContainer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34,
    overflow: 'hidden',
  },
  menuHeader: {
    padding: 16,
    borderBottomWidth: 1,
    alignItems: 'center',
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuItemContent: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  menuItemDescription: {
    fontSize: 13,
    marginTop: 2,
  },
  cancelButton: {
    margin: 16,
    marginTop: 8,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
