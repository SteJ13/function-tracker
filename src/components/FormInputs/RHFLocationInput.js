import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Keyboard,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { Controller } from 'react-hook-form';
import { supabase } from '@services/supabaseClient';
import { useNetwork } from '@context/NetworkContext';
import { saveLocationsCache, loadLocationsCache } from '@services/locationCache';

export default function RHFLocationInput({
  name,
  control,
  label,
  placeholder = 'Search or add location',
  rules = {},
  disabled = false,
  required = false,
}) {
  const { isOnline } = useNetwork();
  const [inputText, setInputText] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [allLocations, setAllLocations] = useState([]);
  const debounceTimer = useRef(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newLocationName, setNewLocationName] = useState('');
  const [newLocationTamilName, setNewLocationTamilName] = useState('');
  const [addingLocation, setAddingLocation] = useState(false);
  const pendingOnChangeRef = useRef(null);

  // Load all locations on mount for offline caching
  useEffect(() => {
    loadAllLocations();
  }, [isOnline]);

  const loadAllLocations = useCallback(async () => {
    if (!isOnline) {
      // Load from cache when offline
      const cachedLocations = await loadLocationsCache();
      if (cachedLocations) {
        setAllLocations(cachedLocations);
      }
      return;
    }

    // Fetch from API when online
    try {
      const { data, error } = await supabase
        .from('locations')
        .select('id, name, tamil_name')
        .order('name', { ascending: true });

      if (error) {
        console.error('Failed to load locations:', error);
        return;
      }

      if (data) {
        setAllLocations(data);
        // Cache for offline use
        await saveLocationsCache(data);
      }
    } catch (err) {
      console.error('Load locations exception:', err);
    }
  }, [isOnline]);

  const searchLocations = useCallback(async (query) => {
    if (!query || query.trim().length === 0) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    const searchTerm = query.trim().toLowerCase();

    if (!isOnline) {
      // Search in cached locations when offline
      const filtered = allLocations
        .filter(loc => loc.name.toLowerCase().includes(searchTerm))
        .slice(0, 10);
      setSuggestions(filtered);
      setLoading(false);
      return;
    }

    // Fetch from API when online
    try {
      const { data, error } = await supabase
        .from('locations')
        .select('id, name, tamil_name')
        .ilike('name', `%${searchTerm}%`)
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
  }, [isOnline, allLocations]);

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
      if (!isOnline) return; // Block when offline

      // Open modal instead of directly adding
      setNewLocationName(text.trim());
      setNewLocationTamilName('');
      pendingOnChangeRef.current = onChange;
      setShowAddModal(true);
      setShowSuggestions(false);
    },
    [isOnline]
  );

  const handleConfirmAddLocation = useCallback(async () => {
    if (!newLocationName.trim()) return;
    
    setAddingLocation(true);
    try {
      const { data, error } = await supabase
        .from('locations')
        .insert({ 
          name: newLocationName.trim(),
          tamil_name: newLocationTamilName.trim() || null
        })
        .select('id, name, tamil_name')
        .single();

      if (error) {
        console.error('Failed to add location:', error);
        return;
      }

      if (data && pendingOnChangeRef.current) {
        setInputText(data.name);
        pendingOnChangeRef.current(data.id);
        Keyboard.dismiss();
        // Reload all locations to update cache
        loadAllLocations();
        // Close modal and reset
        setShowAddModal(false);
        setNewLocationName('');
        setNewLocationTamilName('');
        pendingOnChangeRef.current = null;
      }
    } catch (err) {
      console.error('Add location exception:', err);
    } finally {
      setAddingLocation(false);
    }
  }, [newLocationName, newLocationTamilName, loadAllLocations]);

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

    // Try to find in cached locations first
    const cachedLocation = allLocations.find(loc => loc.id === locationId);
    if (cachedLocation) {
      setInputText(cachedLocation.name);
      return;
    }

    // If not in cache and online, fetch from API
    if (!isOnline) {
      return;
    }

    try {
      const { data, error } = await supabase
        .from('locations')
        .select('name, tamil_name')
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
  }, [allLocations, isOnline]);

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
        const showAddOption = inputText.trim().length > 0 && !hasResults && !loading && isOnline;

        return (
          <View style={styles.container}>
            {label && (
              <Text style={styles.label}>
                {label}
                {required && <Text style={styles.asterisk}> *</Text>}
              </Text>
            )}

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

            <AddLocationModal
              visible={showAddModal}
              onClose={() => setShowAddModal(false)}
              name={newLocationName}
              tamilName={newLocationTamilName}
              onNameChange={setNewLocationName}
              onTamilNameChange={setNewLocationTamilName}
              onAdd={handleConfirmAddLocation}
              adding={addingLocation}
            />

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

const AddLocationModal = ({ visible, onClose, name, tamilName, onNameChange, onTamilNameChange, onAdd, adding }) => (
  <Modal
    visible={visible}
    transparent
    animationType="fade"
    onRequestClose={onClose}
  >
    <TouchableOpacity 
      style={styles.modalOverlay} 
      activeOpacity={1} 
      onPress={onClose}
    >
      <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Add New Location</Text>
          
          <Text style={styles.modalLabel}>Name (English)</Text>
          <TextInput
            style={styles.modalInput}
            value={name}
            onChangeText={onNameChange}
            placeholder="Enter location name"
            autoFocus
          />
          
          <Text style={styles.modalLabel}>தமிழ் பெயர் (Tamil Name)</Text>
          <TextInput
            style={styles.modalInput}
            value={tamilName}
            onChangeText={onTamilNameChange}
            placeholder="Enter Tamil name"
          />
          
          <View style={styles.modalActions}>
            <TouchableOpacity 
              style={[styles.modalButton, styles.cancelButton]} 
              onPress={onClose}
              disabled={adding}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.modalButton, styles.addButton]} 
              onPress={onAdd}
              disabled={adding || !name.trim()}
            >
              <Text style={styles.addButtonText}>
                {adding ? 'Adding...' : 'Add'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </TouchableOpacity>
  </Modal>
);

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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    width: '85%',
    maxWidth: 400,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 20,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 6,
    marginTop: 12,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#000',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 24,
    gap: 12,
  },
  modalButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 15,
    fontWeight: '500',
  },
  addButton: {
    backgroundColor: '#1976D2',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
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
  asterisk: {
    color: '#d32f2f',
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
