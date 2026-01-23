import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

/**
 * Date range filter component
 * Provides two date inputs: from_date and to_date
 */
export default function DateRangeFilter({
  fromDate,
  toDate,
  onChange,
}) {
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);

  /**
   * Convert YYYY-MM-DD string to Date object
   */
  const stringToDate = (dateString) => {
    if (!dateString) return new Date();
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  /**
   * Convert Date object to YYYY-MM-DD string
   */
  const dateToString = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleFromDateChange = (event, selectedDate) => {
    if (Platform.OS === 'android') {
      setShowFromPicker(false);
    }
    if (selectedDate) {
      const dateString = dateToString(selectedDate);
      onChange?.(dateString, toDate);
    }
  };

  const handleToDateChange = (event, selectedDate) => {
    if (Platform.OS === 'android') {
      setShowToPicker(false);
    }
    if (selectedDate) {
      const dateString = dateToString(selectedDate);
      onChange?.(fromDate, dateString);
    }
  };

  const handleClearFromDate = () => {
    onChange?.(undefined, toDate);
  };

  const handleClearToDate = () => {
    onChange?.(fromDate, undefined);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Date Range</Text>

      <View style={styles.dateInputsContainer}>
        {/* From Date */}
        <View style={styles.dateInputWrapper}>
          <Text style={styles.dateLabel}>From</Text>
          <Pressable
            style={styles.dateInput}
            onPress={() => setShowFromPicker(true)}
          >
            <TextInput
              style={styles.dateText}
              value={fromDate || ''}
              placeholder="YYYY-MM-DD"
              editable={false}
              placeholderTextColor="#999"
            />
          </Pressable>
          {fromDate && (
            <Pressable style={styles.clearButton} onPress={handleClearFromDate}>
              <Text style={styles.clearButtonText}>✕</Text>
            </Pressable>
          )}
        </View>

        {/* To Date */}
        <View style={styles.dateInputWrapper}>
          <Text style={styles.dateLabel}>To</Text>
          <Pressable
            style={styles.dateInput}
            onPress={() => setShowToPicker(true)}
          >
            <TextInput
              style={styles.dateText}
              value={toDate || ''}
              placeholder="YYYY-MM-DD"
              editable={false}
              placeholderTextColor="#999"
            />
          </Pressable>
          {toDate && (
            <Pressable style={styles.clearButton} onPress={handleClearToDate}>
              <Text style={styles.clearButtonText}>✕</Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* From Date Picker */}
      {showFromPicker && (
        <DateTimePicker
          value={stringToDate(fromDate)}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleFromDateChange}
        />
      )}

      {/* iOS From Date Picker Footer */}
      {showFromPicker && Platform.OS === 'ios' && (
        <View style={styles.iosPickerFooter}>
          <Pressable onPress={() => setShowFromPicker(false)}>
            <Text style={styles.iosPickerButton}>Done</Text>
          </Pressable>
        </View>
      )}

      {/* To Date Picker */}
      {showToPicker && (
        <DateTimePicker
          value={stringToDate(toDate)}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleToDateChange}
        />
      )}

      {/* iOS To Date Picker Footer */}
      {showToPicker && Platform.OS === 'ios' && (
        <View style={styles.iosPickerFooter}>
          <Pressable onPress={() => setShowToPicker(false)}>
            <Text style={styles.iosPickerButton}>Done</Text>
          </Pressable>
        </View>
      )}
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
  dateInputsContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  dateInputWrapper: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d0d0d0',
    borderRadius: 6,
    paddingHorizontal: 10,
    height: 40,
    backgroundColor: '#fff',
  },
  dateText: {
    flex: 1,
    fontSize: 13,
    color: '#333',
  },
  clearButton: {
    position: 'absolute',
    right: 8,
    top: 28,
    padding: 4,
  },
  clearButtonText: {
    fontSize: 16,
    color: '#999',
  },
  iosPickerFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  iosPickerButton: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
    paddingHorizontal: 16,
  },
});
