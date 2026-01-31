import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Toast from 'react-native-toast-message';

import { getFunctionById } from './api';
import useFunctionActions from './useFunctionActions';
import { supabase } from '@services/supabaseClient';

export default function FunctionDetailScreen({ navigation, route }) {
  const functionId = route?.params?.functionId;
  const { deleteFunction } = useFunctionActions();

  const [functionData, setFunctionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [contribution, setContribution] = useState(null);
  const [loadingContribution, setLoadingContribution] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        if (!functionId) {
          throw new Error('Missing function ID');
        }

        // Load function data (includes category and location via joins)
        const data = await getFunctionById(functionId);
        if (!data) {
          throw new Error('Function not found');
        }
        setFunctionData(data);
      } catch (error) {
        console.error('[FunctionDetail] Load error:', error);
        setError(error.message || 'Failed to load function');
        Toast.show({ 
          type: 'error', 
          text1: 'Error',
          text2: error.message || 'Failed to load function'
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [functionId]);

  // Load contribution for INVITATION functions
  useEffect(() => {
    const loadContribution = async () => {
      if (!functionData || functionData.function_type !== 'INVITATION') {
        setContribution(null);
        return;
      }

      try {
        setLoadingContribution(true);
        const { data, error } = await supabase
          .from('contributions')
          .select('id, person_name, family_name, spouse_name, amount, contribution_type, returned, returned_at, places:place_id(id, name, tamil_name)')
          .eq('function_id', functionId)
          .eq('direction', 'GIVEN_TO_ME')
          .limit(1);

        if (error) {
          throw error;
        }

        setContribution(data && data.length > 0 ? data[0] : null);
      } catch (error) {
        console.error('[FunctionDetail] Failed to load contribution:', error);
        setContribution(null);
      } finally {
        setLoadingContribution(false);
      }
    };

    loadContribution();
  }, [functionData, functionId]);

  const handleEdit = useCallback(() => {
    if (!functionId) return;
    navigation.navigate('FunctionForm', { functionId });
  }, [functionId, navigation]);

  const handleViewContributions = useCallback(() => {
    if (!functionId) return;
    navigation.navigate('ContributionsList', { functionId });
  }, [functionId, navigation]);

  const handleAddContribution = useCallback(() => {
    if (!functionId) return;
    navigation.navigate('AddContribution', {
      functionId,
      functionTitle: functionData?.title,
    });
  }, [functionId, navigation, functionData?.title]);

  const handleEditContribution = useCallback(() => {
    if (!contribution?.id) return;
    navigation.navigate('ContributionsEdit', {
      contributionId: contribution.id,
      functionId,
    });
  }, [contribution?.id, functionId, navigation]);

  const handleDelete = useCallback(() => {
    if (!functionData) return;
    
    Alert.alert(
      'Delete Function',
      `Are you sure you want to delete "${functionData?.title}"?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const success = await deleteFunction(functionId);

              if (success) {
                Toast.show({ type: 'success', text1: 'Function deleted' });
                navigation.goBack();
              } else {
                Toast.show({ type: 'error', text1: 'Failed to delete function' });
              }
            } catch (error) {
              console.error('[FunctionDetail] Delete error:', error);
              Toast.show({ type: 'error', text1: 'Failed to delete function' });
            }
          },
        },
      ]
    );
  }, [functionId, functionData, deleteFunction, navigation]);

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#1976D2" />
        <Text style={styles.loaderText}>Loading...</Text>
      </View>
    );
  }

  if (error || !functionData) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorText}>{error || 'Function not found'}</Text>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!functionData) {
    return null;
  }

  const getStatusStyle = status => {
    switch (status) {
      case 'upcoming':
        return styles.statusBadgeUpcoming;
      case 'completed':
        return styles.statusBadgeCompleted;
      case 'cancelled':
        return styles.statusBadgeCancelled;
      default:
        return styles.statusBadgeUpcoming;
    }
  };

  // Format date from YYYY-MM-DD
  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch (error) {
      return dateStr;
    }
  };

  // Format time from HH:mm:ss to HH:mm
  const formatTime = (timeStr) => {
    if (!timeStr) return 'N/A';
    return timeStr.substring(0, 5);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      {/* Header Section */}
      <View style={styles.headerSection}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{functionData.title || 'Untitled'}</Text>
          {functionData.function_type && (
            <View style={[styles.typeBadge, functionData.function_type === 'INVITATION' ? styles.typeBadgeInvitation : styles.typeBadgeMyFunction]}>
              <Text style={styles.typeBadgeText}>
                {functionData.function_type === 'INVITATION' ? '👤 Invitation' : '📋 My Function'}
              </Text>
            </View>
          )}
        </View>
        <View style={[styles.statusBadge, getStatusStyle(functionData.status)]}>
          <Text style={styles.statusText}>
            {functionData.status ? functionData.status.charAt(0).toUpperCase() + functionData.status.slice(1) : 'Unknown'}
          </Text>
        </View>
      </View>

      {/* Date & Time Section */}
      <View style={styles.card}>
        <View style={styles.cardRow}>
          <Text style={styles.cardLabel}>Date</Text>
          <Text style={styles.cardValue}>
            {formatDate(functionData.function_date)}
          </Text>
        </View>
        <View style={styles.cardRow}>
          <Text style={styles.cardLabel}>Time</Text>
          <Text style={styles.cardValue}>
            {formatTime(functionData.function_time)}
          </Text>
        </View>
      </View>

      {/* Category Section */}
      <View style={styles.card}>
        <View style={styles.cardRow}>
          <Text style={styles.cardLabel}>Category</Text>
          <Text style={styles.cardValue}>{functionData.category?.name || 'Unknown Category'}</Text>
        </View>
      </View>

      {/* Location Section */}
      {functionData.location ? (
        <View style={styles.card}>
          <View style={styles.cardRow}>
            <Text style={styles.cardLabel}>Location</Text>
            <Text style={styles.cardValue}>{functionData.location.name || 'Unknown Location'}</Text>
          </View>
        </View>
      ) : null}

      {/* Notes Section */}
      {functionData.notes ? (
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Notes</Text>
          <Text style={styles.notesText}>{functionData.notes}</Text>
        </View>
      ) : null}

      {/* Metadata Section */}
      <View style={styles.metadataSection}>
        <Text style={styles.metaText}>
          Created: {new Date(functionData.created_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })}
        </Text>
        <Text style={styles.metaText}>
          Updated: {new Date(functionData.updated_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })}
        </Text>
      </View>

      {/* Your Contribution Section for INVITATION functions */}
      {functionData?.function_type === 'INVITATION' && (
        <View>
          <Text style={styles.sectionTitle}>👤 Your Contribution</Text>
          {loadingContribution ? (
            <View style={[styles.card, styles.centerContent]}>
              <ActivityIndicator size="small" color="#1976D2" />
              <Text style={styles.loadingText}>Loading contribution...</Text>
            </View>
          ) : contribution ? (
            <View style={[styles.card, styles.contributionCard]}>
              <View style={styles.contributionHeader}>
                <Text style={styles.contributionName}>
                  {contribution.person_name}
                  {contribution.family_name ? ` (${contribution.family_name})` : ''}
                </Text>
                {contribution.returned && (
                  <View style={styles.returnedBadge}>
                    <Text style={styles.returnedBadgeText}>✓ Returned</Text>
                  </View>
                )}
              </View>
              <View style={styles.contributionDetails}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Amount:</Text>
                  <Text style={styles.detailValue}>
                    {contribution.contribution_type === 'gold'
                      ? `${contribution.amount} grams`
                      : `₹${parseFloat(contribution.amount).toLocaleString('en-IN')}`}
                  </Text>
                </View>
                {contribution.places && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Location:</Text>
                    <Text style={styles.detailValue}>{contribution.places.name}</Text>
                  </View>
                )}
                {contribution.returned_at && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Returned:</Text>
                    <Text style={styles.detailValue}>
                      {new Date(contribution.returned_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </Text>
                  </View>
                )}
              </View>
              <TouchableOpacity
                style={[styles.button, styles.secondaryButton]}
                onPress={handleEditContribution}
              >
                <Text style={styles.secondaryButtonText}>Edit Contribution</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.card, styles.contributionCTA]}
              onPress={handleAddContribution}
            >
              <Text style={styles.contributionCTAIcon}>➕</Text>
              <Text style={styles.contributionCTAText}>Add Your Contribution</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* View Contributions Button */}
      <TouchableOpacity
        style={[styles.button, styles.viewContributionsButton]}
        onPress={handleViewContributions}
      >
        <Text style={styles.buttonText}>View Contributions</Text>
      </TouchableOpacity>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <TouchableOpacity style={[styles.button, styles.editButton]} onPress={handleEdit}>
          <Text style={styles.buttonText}>Edit</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, styles.deleteButton]} onPress={handleDelete}>
          <Text style={styles.buttonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F8FA',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F6F8FA',
  },
  loaderText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F6F8FA',
    padding: 20,
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 18,
    color: '#333',
    textAlign: 'center',
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: '#1976D2',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

  /* Header Section */
  headerSection: {
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  titleRow: {
    marginBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    lineHeight: 34,
  },
  typeBadge: {
    alignSelf: 'flex-start',
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  typeBadgeInvitation: {
    backgroundColor: '#F3E5F5',
  },
  typeBadgeMyFunction: {
    backgroundColor: '#E8F5E9',
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusBadgeUpcoming: {
    backgroundColor: '#2196F3',
  },
  statusBadgeCompleted: {
    backgroundColor: '#4CAF50',
  },
  statusBadgeCancelled: {
    backgroundColor: '#F44336',
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
    textTransform: 'capitalize',
  },

  /* Card Sections */
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  cardRow: {
    flexDirection: 'column',
  },
  cardLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#999',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardValue: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
    fontWeight: '500',
  },
  notesText: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
    marginTop: 4,
  },

  /* Metadata Section */
  metadataSection: {
    marginTop: 12,
    marginBottom: 24,
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  metaText: {
    fontSize: 13,
    color: '#999',
    marginBottom: 6,
    fontWeight: '500',
  },

  /* Section Title */
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    marginTop: 8,
    marginBottom: 12,
  },

  /* Your Contribution Section */
  contributionCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#1976D2',
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 13,
    color: '#999',
  },
  contributionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  contributionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    flex: 1,
  },
  returnedBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  returnedBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  contributionDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#999',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  contributionCTA: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#1976D2',
    backgroundColor: '#F0F7FF',
  },
  contributionCTAIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  contributionCTAText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1976D2',
  },
  secondaryButton: {
    backgroundColor: '#E3F2FD',
    marginTop: 8,
  },
  secondaryButtonText: {
    color: '#1976D2',
    fontSize: 14,
    fontWeight: '600',
  },

  /* View Contributions Button */
  viewContributionsButton: {
    backgroundColor: '#1976D2',
    marginBottom: 24,
    paddingVertical: 14,
  },

  /* Actions */
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 6,
  },
  editButton: {
    backgroundColor: '#1976D2',
  },
  deleteButton: {
    backgroundColor: '#E53935',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
