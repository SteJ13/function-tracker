import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Platform } from 'react-native';
import { Controller } from 'react-hook-form';
import DateTimePicker from '@react-native-community/datetimepicker';

/**
 * RHF DatePicker component using native DateTimePicker
 * Stores dates as YYYY-MM-DD strings (backend-ready)
 */
export default function DatePicker({
  name,
  control,
  label,
  placeholder = 'Select Date',
  rules = {},
  disabled = false,
}) {
  const [showPicker, setShowPicker] = useState(false);

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

  return (
    <Controller
      control={control}
      name={name}
      rules={rules}
      render={({ field: { value, onChange }, fieldState: { error } }) => {
        const currentDate = value ? stringToDate(value) : new Date();

        const handleDateChange = (event, selectedDate) => {
          if (Platform.OS === 'android') {
            setShowPicker(false);
          }

          if (event.type === 'set' && selectedDate) {
            const formattedDate = dateToString(selectedDate);
            onChange(formattedDate);
            
            if (Platform.OS === 'ios') {
              setShowPicker(false);
            }
          } else if (event.type === 'dismissed') {
            setShowPicker(false);
          }
        };

        return (
          <View style={styles.container}>
            {label ? <Text style={styles.label}>{label}</Text> : null}

            <Pressable
              onPress={() => !disabled && setShowPicker(true)}
              disabled={disabled}
            >
              <TextInput
                style={[styles.input, disabled && styles.disabled]}
                value={value || ''}
                placeholder={placeholder}
                placeholderTextColor="#888"
                editable={false}
                pointerEvents="none"
              />
            </Pressable>

            {showPicker && (
              <DateTimePicker
                value={currentDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleDateChange}
              />
            )}

            {error && <Text style={styles.error}>{error.message}</Text>}
          </View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 6,
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  input: {
    minHeight: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    paddingHorizontal: 12,
    fontSize: 15,
    color: '#000',
    backgroundColor: '#fff',
  },
  disabled: {
    backgroundColor: '#f5f5f5',
    borderColor: '#e0e0e0',
    color: '#999',
  },
  error: {
    marginTop: 4,
    color: '#d32f2f',
    fontSize: 12,
  },
});
