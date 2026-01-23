import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import StatusFilter from './StatusFilter';
import DateRangeFilter from './DateRangeFilter';

/**
 * Reusable filter panel component for Functions list
 * Manages filter state and passes to child components
 */
export default function FunctionFilters({
  filters = {},
  categoryOptions = [],
  locationOptions = [],
  onChange,
  onApply,
  onClear,
}) {
  const [localFilters, setLocalFilters] = useState(filters);

  const handleStatusChange = (statuses) => {
    const updated = { ...localFilters, status: statuses };
    setLocalFilters(updated);
    onChange?.(updated);
  };

  const handleCategoryChange = (categoryId) => {
    const updated = {
      ...localFilters,
      category_id: categoryId || undefined,
    };
    setLocalFilters(updated);
    onChange?.(updated);
  };

  const handleLocationChange = (locationId) => {
    const updated = {
      ...localFilters,
      location_id: locationId || undefined,
    };
    setLocalFilters(updated);
    onChange?.(updated);
  };

  const handleDateRangeChange = (fromDate, toDate) => {
    const updated = {
      ...localFilters,
      from_date: fromDate || undefined,
      to_date: toDate || undefined,
    };
    setLocalFilters(updated);
    onChange?.(updated);
  };

  const handleApply = () => {
    onApply?.(localFilters);
  };

  const handleClear = () => {
    const clearedFilters = {
      status: undefined,
      category_id: undefined,
      location_id: undefined,
      from_date: undefined,
      to_date: undefined,
    };
    setLocalFilters(clearedFilters);
    onChange?.(clearedFilters);
    onClear?.();
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Filters</Text>

      {/* Status Filter */}
      <StatusFilter
        selectedStatuses={localFilters.status || []}
        onChange={handleStatusChange}
      />

      {/* Category Filter */}
      {categoryOptions.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Category</Text>
          <View style={styles.optionsContainer}>
            {categoryOptions.map(option => (
              <Pressable
                key={option.value}
                style={[
                  styles.optionButton,
                  localFilters.category_id === option.value && styles.optionButtonActive,
                ]}
                onPress={() => handleCategoryChange(
                  localFilters.category_id === option.value ? undefined : option.value
                )}
              >
                <Text
                  style={[
                    styles.optionText,
                    localFilters.category_id === option.value && styles.optionTextActive,
                  ]}
                >
                  {option.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      {/* Location Filter */}
      {locationOptions.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Location</Text>
          <View style={styles.optionsContainer}>
            {locationOptions.map(option => (
              <Pressable
                key={option.value}
                style={[
                  styles.optionButton,
                  localFilters.location_id === option.value && styles.optionButtonActive,
                ]}
                onPress={() => handleLocationChange(
                  localFilters.location_id === option.value ? undefined : option.value
                )}
              >
                <Text
                  style={[
                    styles.optionText,
                    localFilters.location_id === option.value && styles.optionTextActive,
                  ]}
                >
                  {option.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      {/* Date Range Filter */}
      <DateRangeFilter
        fromDate={localFilters.from_date}
        toDate={localFilters.to_date}
        onChange={handleDateRangeChange}
      />

      {/* Action Buttons */}
      <View style={styles.actions}>
        <Pressable
          style={[styles.button, styles.buttonSecondary]}
          onPress={handleClear}
        >
          <Text style={styles.buttonTextSecondary}>Clear</Text>
        </Pressable>
        <Pressable
          style={[styles.button, styles.buttonPrimary]}
          onPress={handleApply}
        >
          <Text style={styles.buttonTextPrimary}>Apply</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#000',
  },
  section: {
    marginBottom: 20,
  },
  sectionLabel: {
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
  optionButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#d0d0d0',
    backgroundColor: '#fff',
  },
  optionButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  optionText: {
    fontSize: 13,
    color: '#333',
  },
  optionTextActive: {
    color: '#fff',
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
    marginBottom: 16,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPrimary: {
    backgroundColor: '#007AFF',
  },
  buttonSecondary: {
    backgroundColor: '#f0f0f0',
  },
  buttonTextPrimary: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  buttonTextSecondary: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
});
