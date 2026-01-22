import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Keyboard,
  ActivityIndicator,
} from 'react-native';
import { Controller } from 'react-hook-form';
import { supabase } from '@services/supabaseClient';

export default function RHFLocationInput({
  name,
  control,
  label,
  placeholder = 'Search or add location',
  rules = {},
  disabled = false,
}) {
  const [inputText, setInputText] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceTimer = useRef(null);

  const searchLocations = useCallback(async (query) => {
    if (!query || query.trim().length === 0) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('locations')
        .select('id, name')
        .ilike('name', `%${query.trim()}%`)
        .limit(10);

      if (error) {
        console.error('Location search error:', error);
        setSuggestions([]);
      } else {
        setSuggestions(data || []);
      }
    } catch (err) {
      console.error('Location search exception:', err);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleTextChange = useCallback(
    (text, onChange) => {
      setInputText(text);
      setShowSuggestions(true);
      setLoading(true);

      // Clear existing location_id when typing
      onChange(null);

      // Debounce search
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }

      debounceTimer.current = setTimeout(() => {
        searchLocations(text);
      }, 300);
    },
    [searchLocations]
  );

  const handleSelectLocation = useCallback(
    (location, onChange) => {
      setInputText(location.name);
      onChange(location.id);
      setShowSuggestions(false);
      setSuggestions([]);
      Keyboard.dismiss();
    },
    []
  );

  const handleAddNewLocation = useCallback(
    async (text, onChange) => {
      if (!text || text.trim().length === 0) return;

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('locations')
          .insert({ name: text.trim() })
          .select('id, name')
          .single();

        if (error) {
          console.error('Failed to add location:', error);
          return;
        }

        if (data) {
          setInputText(data.name);
          onChange(data.id);
          setShowSuggestions(false);
          setSuggestions([]);
          Keyboard.dismiss();
        }
      } catch (err) {
        console.error('Add location exception:', err);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const handleBlur = useCallback(() => {
    // Delay to allow suggestion press to register
    setTimeout(() => {
      setShowSuggestions(false);
    }, 200);
  }, []);

  const loadLocationName = useCallback(async (locationId) => {
    if (!locationId) {
      setInputText('');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('locations')
        .select('name')
        .eq('id', locationId)
        .single();

      if (error) {
        console.error('Failed to load location:', error);
        return;
      }

      if (data) {
        setInputText(data.name);
      }
    } catch (err) {
      console.error('Load location exception:', err);
    }
  }, []);

  return (
    <Controller
      control={control}
      name={name}
      rules={rules}
      render={({ field: { value, onChange }, fieldState: { error } }) => {
        // Load location name when value changes externally (e.g., form reset)
        useEffect(() => {
          if (value && !inputText) {
            loadLocationName(value);
          } else if (!value && inputText) {
            setInputText('');
          }
        }, [value]);

        const hasResults = suggestions.length > 0;
        const showAddOption = inputText.trim().length > 0 && !hasResults && !loading;

        return (
          <View style={styles.container}>
            {label && <Text style={styles.label}>{label}</Text>}

            <View style={styles.inputWrapper}>
              <TextInput
                value={inputText}
                onChangeText={(text) => handleTextChange(text, onChange)}
                onFocus={() => setShowSuggestions(true)}
                onBlur={handleBlur}
                style={styles.input}
                placeholder={placeholder}
                editable={!disabled}
              />
            </View>

            {error && <Text style={styles.error}>{error.message}</Text>}

            {/* Suggestions Overlay */}
            {showSuggestions && (inputText.trim().length > 0 || loading) && (
              <View style={styles.suggestionsOverlay}>
                {loading && (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color="#1976D2" />
                  </View>
                )}

                {!loading && hasResults && (
                  <>
                    {suggestions.map((location) => (
                      <TouchableOpacity
                        key={location.id}
                        style={styles.suggestionItem}
                        onPress={() => handleSelectLocation(location, onChange)}
                      >
                        <Text style={styles.suggestionText}>{location.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </>
                )}

                {!loading && showAddOption && (
                  <TouchableOpacity
                    style={[styles.suggestionItem, styles.addNewItem]}
                    onPress={() => handleAddNewLocation(inputText, onChange)}
                  >
                    <Text style={styles.addNewText}>
                      + Add "{inputText.trim()}"
                    </Text>
                  </TouchableOpacity>
                )}

                {!loading && !hasResults && !showAddOption && (
                  <View style={styles.noResultsContainer}>
                    <Text style={styles.noResultsText}>No results</Text>
                  </View>
                )}
              </View>
            )}
          </View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    zIndex: 1,
  },
  label: {
    marginBottom: 6,
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    paddingHorizontal: 12,
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    height: 44,
    fontSize: 15,
    color: '#000',
  },
  error: {
    marginTop: 4,
    color: '#d32f2f',
    fontSize: 12,
  },
  suggestionsOverlay: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    marginTop: 4,
    maxHeight: 200,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    zIndex: 1000,
  },
  suggestionItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  suggestionText: {
    fontSize: 15,
    color: '#333',
  },
  addNewItem: {
    backgroundColor: '#f5f5f5',
  },
  addNewText: {
    fontSize: 15,
    color: '#1976D2',
    fontWeight: '500',
  },
  loadingContainer: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  noResultsContainer: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: 14,
    color: '#999',
  },
});
