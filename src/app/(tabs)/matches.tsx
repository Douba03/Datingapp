import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  TextInput,
  StatusBar,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useChat } from '../../hooks/useChat';
import { MatchCard } from '../../components/chat/MatchCard';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { ProtectedRoute } from '../../components/auth/ProtectedRoute';
import { colors, shadows } from '../../components/theme/colors';
import { Ionicons } from '@expo/vector-icons';

function MatchesScreen() {
  const { matches, loading } = useChat();
  const router = useRouter();

  const handleMatchPress = (matchId: string) => {
    router.push(`/(tabs)/chat/${matchId}`);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient
          colors={['#FDF8F8', '#FFF0F5', '#FDF8F8']}
          style={styles.backgroundGradient}
        />
        <Text style={styles.loadingEmoji}>💬</Text>
        <Text style={styles.loadingText}>Loading matches...</Text>
      </View>
    );
  }

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <LinearGradient
          colors={['rgba(255,107,138,0.08)', 'rgba(155,93,229,0.08)']}
          style={styles.searchGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <Ionicons name="search-outline" size={20} color={colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search matches..."
            placeholderTextColor={colors.textLight}
          />
        </LinearGradient>
      </View>
      
      {/* Section Header */}
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionIcon}>💖</Text>
          <Text style={styles.sectionTitle}>Your Matches</Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#FDF8F8', '#FEFEFE', '#FAF8FF']}
        style={styles.backgroundGradient}
      />
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={styles.safeArea}>
        {matches.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyCard}>
              <View style={styles.emptyIconContainer}>
                <Text style={styles.emptyEmoji}>💫</Text>
              </View>
              <Text style={styles.emptyTitle}>No Matches Yet</Text>
              <Text style={styles.emptySubtitle}>
                Your matches will appear here when someone likes you back. Keep swiping to find your perfect match!
              </Text>
              
              <View style={styles.comeBackMessage}>
                <Text style={styles.comeBackIcon}>⏰</Text>
                <Text style={styles.comeBackText}>Come back later to discover more people</Text>
              </View>
              
              <TouchableOpacity 
                style={styles.startSwipingButton}
                onPress={() => router.push('/(tabs)')}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={[colors.primary, colors.primaryDark]}
                  style={styles.buttonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.buttonEmoji}>💕</Text>
                  <Text style={styles.startSwipingText}>Find Matches</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
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
            ListHeaderComponent={renderHeader}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
          />
        )}
      </SafeAreaView>
    </View>
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
    backgroundColor: colors.background,
  },
  backgroundGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  safeArea: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingEmoji: {
    fontSize: 50,
  },
  loadingText: {
    fontSize: 18,
    color: colors.textSecondary,
    marginTop: 16,
    fontWeight: '500',
  },
  headerContainer: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 40 : 16,
    paddingBottom: 10,
  },
  searchContainer: {
    marginBottom: 24,
    borderRadius: 16,
    overflow: 'hidden',
    ...shadows.small,
  },
  searchGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 50,
    backgroundColor: colors.surface,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    height: '100%',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionIcon: {
    fontSize: 18,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  listContainer: {
    paddingBottom: 100,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    width: '100%',
    maxWidth: 360,
    ...shadows.large,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: `${colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyEmoji: {
    fontSize: 48,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  comeBackMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceElevated,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 10,
    marginBottom: 24,
    width: '100%',
  },
  comeBackIcon: {
    fontSize: 20,
  },
  comeBackText: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  startSwipingButton: {
    borderRadius: 30,
    overflow: 'hidden',
    ...shadows.glow,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 36,
    paddingVertical: 16,
    gap: 10,
  },
  buttonEmoji: {
    fontSize: 22,
  },
  startSwipingText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
});
