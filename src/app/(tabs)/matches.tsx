import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useChat } from '../../hooks/useChat';
import { MatchCard } from '../../components/chat/MatchCard';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { ProtectedRoute } from '../../components/auth/ProtectedRoute';
import { useTheme } from '../../contexts/ThemeContext';
import { colors as staticColors } from '../../components/theme/colors';

function MatchesScreen() {
  const { matches, loading, fetchMatches } = useChat();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  // Refresh matches when screen comes into focus (e.g., returning from chat)
  useFocusEffect(
    useCallback(() => {
      fetchMatches();
    }, [])
  );

  const handleMatchPress = (matchId: string) => {
    router.push(`/(tabs)/chat/${matchId}`);
  };

  if (loading) {
    return (
      <LinearGradient
        colors={[colors.backgroundGradientStart, colors.backgroundGradientEnd]}
        style={styles.container}
      >
        <LoadingSpinner text="Loading matches..." />
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={[colors.backgroundGradientStart, colors.backgroundGradientEnd]}
      style={[styles.container, { paddingTop: insets.top }]}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <View style={styles.headerLeft}>
          <View style={styles.logoRow}>
            <LinearGradient
              colors={[colors.like, colors.likeShadow]}
              style={styles.logoContainer}
            >
              <Ionicons name="chatbubbles" size={18} color="#fff" />
            </LinearGradient>
            <View style={styles.titleContainer}>
              <Text style={[styles.title, { color: colors.text }]}>Messages</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                {matches.length > 0 ? `${matches.length} conversation${matches.length !== 1 ? 's' : ''}` : 'Start chatting'}
              </Text>
            </View>
          </View>
        </View>
        
        {/* Match count badge */}
        {matches.length > 0 && (
          <View style={styles.countBadge}>
            <Ionicons name="heart" size={14} color={colors.like} />
            <Text style={styles.countText}>{matches.length}</Text>
          </View>
        )}
      </View>

      {matches.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={[styles.emptyIconContainer, { backgroundColor: `${colors.like}15` }]}>
            <Ionicons name="chatbubbles-outline" size={64} color={colors.like} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No Matches Yet</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            Start swiping to find your{'\n'}perfect match!
          </Text>
        </View>
      ) : (
        <FlatList
          data={matches}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <MatchCard
              match={item}
              onPress={() => handleMatchPress(item.id)}
            />
          )}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
    </LinearGradient>
  );
}

export default function MatchesScreenWrapper() {
  return (
    <ProtectedRoute>
      <MatchesScreen />
    </ProtectedRoute>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    marginHorizontal: 12,
    marginTop: 4,
    marginBottom: 8,
    borderRadius: 20,
    shadowColor: staticColors.like,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  headerLeft: {
    flex: 1,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoContainer: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: staticColors.like,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  titleContainer: {
    flexDirection: 'column',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: staticColors.text,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12,
    color: staticColors.textSecondary,
    marginTop: 1,
  },
  countBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: staticColors.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 64, 129, 0.2)',
  },
  countText: {
    fontSize: 14,
    fontWeight: '700',
    color: staticColors.like,
  },
  listContainer: {
    paddingBottom: 16,
    paddingHorizontal: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 64, 129, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: staticColors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: staticColors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
});
