import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import SearchIcon from '@components/Icons/SearchIcon';
import styles from './SearchInput.styles';

export default function SearchInput({
  placeholder = 'Search...',
  debounceMs = 300,
  onSearch,
  ...textInputProps
}) {
  const [value, setValue] = useState('');
  const searchTimer = useRef(null);

  useEffect(() => {
    return () => {
      if (searchTimer.current) {
        clearTimeout(searchTimer.current);
      }
    };
  }, []);

  const scheduleSearch = useCallback((text) => {
    if (searchTimer.current) {
      clearTimeout(searchTimer.current);
    }

    searchTimer.current = setTimeout(() => {
      onSearch?.(text);
    }, debounceMs);
  }, [debounceMs, onSearch]);

  const handleChangeText = useCallback((text) => {
    setValue(text);
    scheduleSearch(text);
  }, [scheduleSearch]);

  const handleClear = useCallback(() => {
    setValue('');
    scheduleSearch('');
  }, [scheduleSearch]);

  return (
    <View style={styles.container}>
      <SearchIcon size={18} color="#8A94A6" />
      <TextInput
        {...textInputProps}
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor="#999"
        value={value}
        onChangeText={handleChangeText}
        returnKeyType="search"
        autoCorrect={false}
      />
      {value ? (
        <TouchableOpacity
          style={styles.clearButton}
          onPress={handleClear}
          accessibilityRole="button"
          accessibilityLabel="Clear search"
        >
          <Text style={styles.clearButtonText}>Clear</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}
