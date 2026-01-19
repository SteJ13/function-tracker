import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Controller } from 'react-hook-form';

/**
 * RHF StatusSelector - displays status options as interactive badge/pill buttons
 */
export default function StatusSelector({
  name,
  control,
  label,
  options = [],
  rules = {},
  disabled = false,
}) {
  return (
    <Controller
      control={control}
      name={name}
      rules={rules}
      render={({ field: { value, onChange }, fieldState: { error } }) => {
        return (
          <View style={styles.container}>
            {label ? <Text style={styles.label}>{label}</Text> : null}

            <View style={styles.badgeRow}>
              {options.map(option => (
                <Pressable
                  key={option.value}
                  style={[
                    styles.badge,
                    value === option.value && styles.badgeSelected,
                    value === option.value && getStatusBadgeStyle(option.value),
                    disabled && styles.disabled,
                  ]}
                  onPress={() => !disabled && onChange(option.value)}
                  disabled={disabled}
                >
                  <Text
                    style={[
                      styles.badgeText,
                      value === option.value && styles.badgeTextSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            {error && <Text style={styles.error}>{error.message}</Text>}
          </View>
        );
      }}
    />
  );
}

/**
 * Return background color based on status value
 */
function getStatusBadgeStyle(status) {
  const colors = {
    upcoming: styles.statusUpcoming,
    completed: styles.statusCompleted,
    cancelled: styles.statusCancelled,
  };
  return colors[status] || {};
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 8,
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  badge: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: '#e0e0e0',
    borderWidth: 1,
    borderColor: '#bdbdbd',
  },
  badgeSelected: {
    borderWidth: 2,
  },
  badgeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  badgeTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  statusUpcoming: {
    backgroundColor: '#2196F3',
    borderColor: '#1976D2',
  },
  statusCompleted: {
    backgroundColor: '#4CAF50',
    borderColor: '#388E3C',
  },
  statusCancelled: {
    backgroundColor: '#F44336',
    borderColor: '#D32F2F',
  },
  disabled: {
    opacity: 0.5,
  },
  error: {
    marginTop: 6,
    color: '#d32f2f',
    fontSize: 12,
  },
});
