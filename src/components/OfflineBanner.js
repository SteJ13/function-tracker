import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

/**
 * OfflineBanner - Simple offline indicator banner
 * 
 * Usage:
 * {!isOnline && <OfflineBanner />}
 * 
 * Or with conditional visibility:
 * <OfflineBanner visible={!isOnline} />
 */
export default function OfflineBanner({ visible = true }) {
  if (!visible) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.text}>📡 You're offline. Showing last saved data.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FF9800',
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
