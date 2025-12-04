import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../services/supabase/client';
import { useAuth } from '../../hooks/useAuth';

interface Warning {
  id: string;
  reason: string;
  severity: 'warning' | 'final_warning' | 'notice';
  acknowledged: boolean;
  created_at: string;
}

export function WarningBanner() {
  const { user } = useAuth();
  const [warnings, setWarnings] = useState<Warning[]>([]);
  const [unacknowledgedCount, setUnacknowledgedCount] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchWarnings();
    
    // Subscribe to new warnings
    const subscription = supabase
      .channel('user_warnings')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_warnings',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchWarnings();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  const fetchWarnings = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_warnings')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[WarningBanner] Error fetching warnings:', error);
        return;
      }

      setWarnings(data || []);
      const unacknowledged = data?.filter(w => !w.acknowledged).length || 0;
      setUnacknowledgedCount(unacknowledged);

      // Auto-show modal if there are unacknowledged warnings
      if (unacknowledged > 0) {
        setModalVisible(true);
      }
    } catch (err) {
      console.error('[WarningBanner] Exception:', err);
    }
  };

  const acknowledgeWarning = async (warningId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('acknowledge_warning', {
        warning_id: warningId,
      });

      if (error) {
        console.error('[WarningBanner] Error acknowledging warning:', error);
        Alert.alert('Error', 'Failed to acknowledge warning');
        return;
      }

      // Refresh warnings
      await fetchWarnings();
    } catch (err) {
      console.error('[WarningBanner] Exception:', err);
      Alert.alert('Error', 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const acknowledgeAll = async () => {
    setLoading(true);
    try {
      const unacknowledged = warnings.filter(w => !w.acknowledged);
      
      for (const warning of unacknowledged) {
        await supabase.rpc('acknowledge_warning', {
          warning_id: warning.id,
        });
      }

      await fetchWarnings();
      setModalVisible(false);
    } catch (err) {
      console.error('[WarningBanner] Exception:', err);
      Alert.alert('Error', 'Failed to acknowledge warnings');
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'final_warning':
        return '#DC2626'; // Red
      case 'warning':
        return '#F59E0B'; // Orange
      case 'notice':
        return '#3B82F6'; // Blue
      default:
        return '#F59E0B';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'final_warning':
        return 'alert-circle';
      case 'warning':
        return 'warning';
      case 'notice':
        return 'information-circle';
      default:
        return 'warning';
    }
  };

  const getSeverityLabel = (severity: string) => {
    switch (severity) {
      case 'final_warning':
        return 'FINAL WARNING';
      case 'warning':
        return 'WARNING';
      case 'notice':
        return 'NOTICE';
      default:
        return 'WARNING';
    }
  };

  if (warnings.length === 0) return null;

  return (
    <>
      {/* Banner - only show if there are unacknowledged warnings */}
      {unacknowledgedCount > 0 && (
        <TouchableOpacity
          style={styles.banner}
          onPress={() => setModalVisible(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="warning" size={20} color="#FFF" />
          <Text style={styles.bannerText}>
            You have {unacknowledgedCount} unread warning{unacknowledgedCount > 1 ? 's' : ''}
          </Text>
          <Ionicons name="chevron-forward" size={20} color="#FFF" />
        </TouchableOpacity>
      )}

      {/* Modal with warnings */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Account Warnings</Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.warningsList}>
              {warnings.map((warning) => (
                <View
                  key={warning.id}
                  style={[
                    styles.warningCard,
                    { borderLeftColor: getSeverityColor(warning.severity) },
                    warning.acknowledged && styles.acknowledgedCard,
                  ]}
                >
                  <View style={styles.warningHeader}>
                    <View style={styles.warningHeaderLeft}>
                      <Ionicons
                        name={getSeverityIcon(warning.severity) as any}
                        size={20}
                        color={getSeverityColor(warning.severity)}
                      />
                      <Text
                        style={[
                          styles.severityLabel,
                          { color: getSeverityColor(warning.severity) },
                        ]}
                      >
                        {getSeverityLabel(warning.severity)}
                      </Text>
                    </View>
                    {warning.acknowledged && (
                      <View style={styles.acknowledgedBadge}>
                        <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                        <Text style={styles.acknowledgedText}>Read</Text>
                      </View>
                    )}
                  </View>

                  <Text style={styles.warningReason}>{warning.reason}</Text>

                  <Text style={styles.warningDate}>
                    {new Date(warning.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>

                  {!warning.acknowledged && (
                    <TouchableOpacity
                      style={styles.acknowledgeButton}
                      onPress={() => acknowledgeWarning(warning.id)}
                      disabled={loading}
                    >
                      <Text style={styles.acknowledgeButtonText}>
                        {loading ? 'Acknowledging...' : 'I Understand'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </ScrollView>

            {unacknowledgedCount > 0 && (
              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={styles.acknowledgeAllButton}
                  onPress={acknowledgeAll}
                  disabled={loading}
                >
                  <Text style={styles.acknowledgeAllButtonText}>
                    {loading ? 'Processing...' : 'Acknowledge All'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F59E0B',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  bannerText: {
    flex: 1,
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingTop: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111',
  },
  warningsList: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  warningCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  acknowledgedCard: {
    opacity: 0.6,
  },
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  warningHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  severityLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  acknowledgedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  acknowledgedText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#10B981',
  },
  warningReason: {
    fontSize: 15,
    color: '#111',
    lineHeight: 22,
    marginBottom: 8,
  },
  warningDate: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 12,
  },
  acknowledgeButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  acknowledgeButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  acknowledgeAllButton: {
    backgroundColor: '#111',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  acknowledgeAllButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

