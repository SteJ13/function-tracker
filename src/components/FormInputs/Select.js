import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Controller } from 'react-hook-form';
import ModalSelector from 'react-native-modal-selector';

/**
 * RHF-select component (modal dropdown) built to mirror the existing Input styling
 */
export default function Select({
  name,
  control,
  label,
  options = [],
  placeholder = 'Select',
  rules = {},
  disabled = false,
}) {
  const modalData = useMemo(() => {
    return options.map(opt => ({
      key: opt.value,
      label: opt.label,
    }));
  }, [options]);

  const optionMap = useMemo(() => {
    const map = new Map();
    options.forEach(opt => map.set(opt.value, opt.label));
    return map;
  }, [options]);

  return (
    <Controller
      control={control}
      name={name}
      rules={rules}
      render={({ field: { value, onChange }, fieldState: { error } }) => {
        const selectedLabel = optionMap.get(value);

        return (
          <View style={styles.container}>
            {label ? <Text style={styles.label}>{label}</Text> : null}

            <ModalSelector
              data={modalData}
              initValue={placeholder}
              onChange={option => onChange(option.key)}
              disabled={disabled}
              cancelText="Cancel"
              animationType="fade"
              overlayStyle={styles.overlay}
              optionContainerStyle={styles.optionContainer}
              optionTextStyle={styles.optionText}
              cancelStyle={styles.cancelButton}
              cancelTextStyle={styles.cancelText}
            >
              <View style={[styles.selectBox, disabled && styles.disabled]}>
                <Text style={[styles.valueText, !selectedLabel && styles.placeholderText]}>
                  {selectedLabel || placeholder}
                </Text>
              </View>
            </ModalSelector>

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
  selectBox: {
    minHeight: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    paddingHorizontal: 12,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  valueText: {
    fontSize: 15,
    color: '#000',
  },
  placeholderText: {
    color: '#888',
  },
  error: {
    marginTop: 4,
    color: '#d32f2f',
    fontSize: 12,
  },
  disabled: {
    backgroundColor: '#f5f5f5',
    borderColor: '#e0e0e0',
  },
  overlay: {
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  optionContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 20,
    maxHeight: 400,
  },
  optionText: {
    fontSize: 16,
    color: '#333',
    paddingVertical: 12,
  },
  cancelButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 20,
    marginTop: 10,
  },
  cancelText: {
    fontSize: 16,
    color: '#2196F3',
    fontWeight: '600',
  },
});
