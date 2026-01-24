import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSync } from '@context/SyncContext';

/**
 * SyncStatusBanner - Global sync status indicator
 * Shows status of offline queue sync operations
 * 
 * Displays:
 * - 'syncing' → "Syncing changes…" (blue)
 * - 'success' → "All changes synced" (green, auto-hides after 2s)
 * - 'error' → "Sync failed. Will retry when online" (red)
 * - 'idle' → hidden
 */
export default function SyncStatusBanner() {
  const { status } = useSync();
  const [visible, setVisible] = useState(false);

  // Auto-hide success messages after 2 seconds
  useEffect(() => {
    if (status === 'success') {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
      }, 2000);
      return () => clearTimeout(timer);
    } else if (status === 'idle') {
      setVisible(false);
    } else {
      setVisible(true);
    }
  }, [status]);

  if (!visible) {
    return null;
  }

  const getMessageAndColor = () => {
    switch (status) {
      case 'syncing':
        return { message: 'Syncing changes…', color: '#2196F3' };
      case 'success':
        return { message: 'All changes synced', color: '#4CAF50' };
      case 'error':
        return { message: 'Sync failed. Will retry when online', color: '#F44336' };
      default:
        return { message: '', color: '#757575' };
    }
  };

  const { message, color } = getMessageAndColor();

  return (
    <View style={[styles.container, { backgroundColor: color }]}>
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
});
