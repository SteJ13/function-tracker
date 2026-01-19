import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Platform } from 'react-native';
import { Controller } from 'react-hook-form';
import DateTimePicker from '@react-native-community/datetimepicker';

/**
 * RHF TimePicker component using native DateTimePicker
 * Stores time as HH:mm strings (backend-ready)
 */
export default function TimePicker({
  name,
  control,
  label,
  placeholder = 'Select Time',
  rules = {},
  disabled = false,
}) {
  const [showPicker, setShowPicker] = useState(false);

  /**
   * Convert HH:mm string to Date object
   */
  const stringToDate = (timeString) => {
    if (!timeString) return new Date();
    const [hours, minutes] = timeString.split(':').map(Number);
    const date = new Date();
    date.setHours(hours);
    date.setMinutes(minutes);
    return date;
  };

  /**
   * Convert Date object to HH:mm string
   */
  const dateToString = (date) => {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  return (
    <Controller
      control={control}
      name={name}
      rules={rules}
      render={({ field: { value, onChange }, fieldState: { error } }) => {
        const currentTime = value ? stringToDate(value) : new Date();

        const handleTimeChange = (event, selectedTime) => {
          if (Platform.OS === 'android') {
            setShowPicker(false);
          }

          if (event.type === 'set' && selectedTime) {
            const formattedTime = dateToString(selectedTime);
            onChange(formattedTime);
            
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
                value={currentTime}
                mode="time"
                is24Hour={true}
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleTimeChange}
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
