import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useRequests } from '../../hooks/useRequests';
import { useWaliSystem } from '../../hooks/useWaliSystem';
import { IncomingRequestCard } from '../../components/requests/IncomingRequestCard';
import { WaliRequestCard } from '../../components/requests/WaliRequestCard';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { ProtectedRoute } from '../../components/auth/ProtectedRoute';
import { useTheme } from '../../contexts/ThemeContext';
import { DeclineReason } from '../../types/requests';

type TabType = 'received' | 'sent' | 'wali';

function RequestsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { 
    incomingRequests,
    outgoingRequests,
    loading, 
    respondToRequest, 
    refetchRequests 
  } = useRequests();
  
  const {
    waliRequests,
    fetchReceivedWaliRequests,
    acceptWaliRequest,
    declineWaliRequest,
    loading: waliLoading,
  } = useWaliSystem();
  
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('received');

  useFocusEffect(
    useCallback(() => {
      refetchRequests();
      fetchReceivedWaliRequests();
    }, [])
  );

  const pendingWaliRequests = waliRequests.filter(r => r.status === 'pending');

  const handleAccept = async (requestId: string) => {
    const { error } = await respondToRequest(requestId, true);
    
    if (error) {
      Alert.alert('Error', 'Could not accept request');
    } else {
      Alert.alert(
        'Request Accepted!', 
        'You can now chat with each other.',
        [
          { text: 'Go to messages', onPress: () => router.push('/(tabs)/matches') },
          { text: 'Stay here', style: 'cancel' }
        ]
      );
    }
  };

  const handleDecline = async (requestId: string, reason: DeclineReason, note?: string) => {
    const { error } = await respondToRequest(requestId, false, reason, note);
    
    if (error) {
      Alert.alert('Error', 'Could not decline request');
    }
  };

  const handleViewProfile = (userId: string) => {
    router.push(`/(tabs)/profile?viewUserId=${userId}&readonly=true`);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetchRequests();
    await fetchReceivedWaliRequests();
    setRefreshing(false);
  };

  // Wali request handlers
  const handleAcceptWali = async (requestId: string) => {
    const success = await acceptWaliRequest(requestId);
    if (success) {
      Alert.alert(
        '🎉 Congratulations!',
        'You have both agreed to take the next step. This match has been marked as successful and ready for family involvement.',
        [{ text: 'OK' }]
      );
    } else {
      Alert.alert('Error', 'Could not accept the request');
    }
  };

  const handleDeclineWali = async (requestId: string) => {
    const success = await declineWaliRequest(requestId);
    if (!success) {
      Alert.alert('Error', 'Could not decline the request');
    }
  };

  if (loading) {
    return (
      <LinearGradient
        colors={[colors.backgroundGradientStart, colors.backgroundGradientEnd]}
        style={styles.container}
      >
        <LoadingSpinner text="Loading requests..." />
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
              colors={[colors.primary, colors.primaryDark]}
              style={styles.logoContainer}
            >
              <Ionicons name="mail" size={18} color="#fff" />
            </LinearGradient>
            <View style={styles.titleContainer}>
              <Text style={[styles.title, { color: colors.text }]}>Requests</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                {activeTab === 'received' 
                  ? incomingRequests.length > 0 
                    ? `${incomingRequests.length} pending` 
                    : 'No new requests'
                  : outgoingRequests.length > 0
                    ? `${outgoingRequests.length} sent`
                    : 'No sent requests'}
              </Text>
            </View>
          </View>
        </View>
        
        {activeTab === 'received' && incomingRequests.length > 0 && (
          <View style={[styles.countBadge, { backgroundColor: `${colors.primary}15` }]}>
            <Text style={[styles.countText, { color: colors.primary }]}>
              {incomingRequests.length}
            </Text>
          </View>
        )}
      </View>

      {/* Tabs */}
      <View style={[styles.tabsContainer, { backgroundColor: colors.surface }]}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'received' && styles.tabActive]}
          onPress={() => setActiveTab('received')}
        >
          <Text style={[
            styles.tabText,
            { color: activeTab === 'received' ? colors.primary : colors.textSecondary }
          ]}>
            Received
          </Text>
          {incomingRequests.length > 0 && (
            <View style={[styles.tabBadge, { backgroundColor: colors.primary }]}>
              <Text style={styles.tabBadgeText}>{incomingRequests.length}</Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'sent' && styles.tabActive]}
          onPress={() => setActiveTab('sent')}
        >
          <Text style={[
            styles.tabText,
            { color: activeTab === 'sent' ? colors.primary : colors.textSecondary }
          ]}>
            Sent
          </Text>
          {outgoingRequests.length > 0 && (
            <View style={[styles.tabBadge, { backgroundColor: colors.textSecondary }]}>
              <Text style={styles.tabBadgeText}>{outgoingRequests.length}</Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'wali' && styles.tabActive]}
          onPress={() => setActiveTab('wali')}
        >
          <Text style={[
            styles.tabText,
            { color: activeTab === 'wali' ? '#FFD700' : colors.textSecondary }
          ]}>
            💍 Wali
          </Text>
          {pendingWaliRequests.length > 0 && (
            <View style={[styles.tabBadge, { backgroundColor: '#FFD700' }]}>
              <Text style={styles.tabBadgeText}>{pendingWaliRequests.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {activeTab === 'received' && incomingRequests.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={[styles.emptyIconContainer, { backgroundColor: `${colors.primary}10` }]}>
            <Ionicons name="mail-open-outline" size={64} color={colors.primary} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            No Requests Yet
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            When someone wants to talk to you{'\n'}you'll see it here!
          </Text>
        </View>
      ) : activeTab === 'sent' && outgoingRequests.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={[styles.emptyIconContainer, { backgroundColor: `${colors.primary}10` }]}>
            <Ionicons name="paper-plane-outline" size={64} color={colors.primary} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            No Sent Requests
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            Send a request to someone you're{'\n'}interested in to start chatting!
          </Text>
        </View>
      ) : activeTab === 'wali' && pendingWaliRequests.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={[styles.emptyIconContainer, { backgroundColor: '#FFD70020' }]}>
            <Ionicons name="diamond-outline" size={64} color="#FFD700" />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            No Wali Requests
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            When someone is ready to take the{'\n'}next step, you'll see it here!
          </Text>
          <Text style={[styles.emptyHint, { color: colors.textSecondary }]}>
            💡 Wali requests can be sent after 5 days of matching
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
            />
          }
        >
          {activeTab === 'received' ? (
            incomingRequests.map((request) => (
              <IncomingRequestCard
                key={request.id}
                request={request}
                onAccept={() => handleAccept(request.id)}
                onDecline={(reason, note) => handleDecline(request.id, reason, note)}
                onViewProfile={() => handleViewProfile(request.sender_id)}
              />
            ))
          ) : activeTab === 'wali' ? (
            pendingWaliRequests.map((request) => (
              <WaliRequestCard
                key={request.id}
                request={request}
                isReceived={true}
                onAccept={() => handleAcceptWali(request.id)}
                onDecline={() => handleDeclineWali(request.id)}
                onViewProfile={() => handleViewProfile(request.requester_id)}
              />
            ))
          ) : (
            outgoingRequests.map((request) => (
              <View key={request.id} style={[styles.outgoingCard, { backgroundColor: colors.surface }]}>
                <View style={styles.outgoingHeader}>
                  <View style={styles.outgoingInfo}>
                    <Text style={[styles.outgoingName, { color: colors.text }]}>
                      {request.receiver_profile?.first_name || 'User'}
                    </Text>
                    <Text style={[styles.outgoingStatus, { color: colors.textSecondary }]}>
                      {request.status === 'pending' ? '⏳ Pending' : 
                       request.status === 'accepted' ? '✅ Accepted' : 
                       '❌ Declined'}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.viewProfileButton}
                    onPress={() => handleViewProfile(request.receiver_id)}
                  >
                    <Ionicons name="person-outline" size={20} color={colors.primary} />
                  </TouchableOpacity>
                </View>
                {request.message && (
                  <Text style={[styles.outgoingMessage, { color: colors.textSecondary }]}>
                    "{request.message}"
                  </Text>
                )}
                <Text style={[styles.outgoingDate, { color: colors.textSecondary }]}>
                  Sent {new Date(request.created_at).toLocaleDateString()}
                </Text>
              </View>
            ))
          )}
          
          <View style={{ height: 20 }} />
        </ScrollView>
      )}
    </LinearGradient>
  );
}

export default function RequestsScreenWrapper() {
  return (
    <ProtectedRoute>
      <RequestsScreen />
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
    marginHorizontal: 12,
    marginTop: 4,
    marginBottom: 16,
    borderRadius: 20,
    shadowColor: '#0B1F3B',
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
    shadowColor: '#0B1F3B',
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
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  countBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  countText: {
    fontSize: 16,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    alignItems: 'center',
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
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  emptyHint: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 16,
    fontStyle: 'italic',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 12,
    marginBottom: 16,
    borderRadius: 16,
    padding: 4,
    shadowColor: '#0B1F3B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 6,
  },
  tabActive: {
    backgroundColor: '#F3F4F6',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
  },
  tabBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },
  outgoingCard: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#0B1F3B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  outgoingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  outgoingInfo: {
    flex: 1,
  },
  outgoingName: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  outgoingStatus: {
    fontSize: 14,
    fontWeight: '500',
  },
  viewProfileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  outgoingMessage: {
    fontSize: 14,
    fontStyle: 'italic',
    marginBottom: 8,
    lineHeight: 20,
  },
  outgoingDate: {
    fontSize: 12,
    fontWeight: '500',
  },
});
