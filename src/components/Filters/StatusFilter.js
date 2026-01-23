import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';

const STATUS_OPTIONS = [
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

/**
 * Multi-select status filter component
 * Returns array of selected status values
 */
export default function StatusFilter({
  selectedStatuses = [],
  onChange,
}) {
  const handleToggle = (statusValue) => {
    const isSelected = selectedStatuses.includes(statusValue);
    const updated = isSelected
      ? selectedStatuses.filter(s => s !== statusValue)
      : [...selectedStatuses, statusValue];
    onChange?.(updated);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Status</Text>
      <View style={styles.optionsContainer}>
        {STATUS_OPTIONS.map(option => (
          <Pressable
            key={option.value}
            style={[
              styles.chip,
              selectedStatuses.includes(option.value) && styles.chipActive,
            ]}
            onPress={() => handleToggle(option.value)}
          >
            <Text
              style={[
                styles.chipText,
                selectedStatuses.includes(option.value) && styles.chipTextActive,
              ]}
            >
              {option.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#d0d0d0',
    backgroundColor: '#fff',
  },
  chipActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  chipText: {
    fontSize: 13,
    color: '#333',
  },
  chipTextActive: {
    color: '#fff',
    fontWeight: '500',
  },
});
