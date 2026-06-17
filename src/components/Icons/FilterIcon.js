import React from 'react';
import { Pressable, View, Text, StyleSheet } from 'react-native';
import { Svg, Path } from 'react-native-svg';

// Simple funnel filter icon matching existing style
export default function FilterIcon({ size = 24, color = '#555', onPress, activeFilterCount = 0 }) {
  return (
    <Pressable onPress={onPress} hitSlop={8} style={styles.iconButton}>
      <View>
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M3 4h18v2l-7 7v5l-4 2v-7L3 6V4z"
            fill={color}
          />
        </Svg>

        {activeFilterCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{activeFilterCount}</Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  iconButton: {
    alignSelf: 'center',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
});
