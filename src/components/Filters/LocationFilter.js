import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View,
    TextInput,
    TouchableOpacity,
    Text,
    ActivityIndicator,
    StyleSheet,
    Keyboard
} from 'react-native';

import { supabase } from '@services/supabaseClient';
import { useNetwork } from '@context/NetworkContext';
import {
    saveLocationsCache,
    loadLocationsCache,
} from '@services/locationCache';

export default function LocationFilter({
    value,
    selectedName,
    onChange,
    placeholder = 'Search location...',
}) {
    const { isOnline } = useNetwork();

    const [inputText, setInputText] = useState('');
    const [allLocations, setAllLocations] = useState([]);
    const [suggestions, setSuggestions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);

    const debounceTimer = useRef(null);

    useEffect(() => {
        if (selectedName) {
            setInputText(selectedName);
            return;
        }

        if (!value) {
            setInputText('');
        }
    }, [selectedName, value]);

    useEffect(() => {
        loadAllLocations();
    }, [isOnline]);

    const loadAllLocations = useCallback(async () => {
        if (!isOnline) {
            const cached = await loadLocationsCache();

            if (cached) {
                setAllLocations(cached);
            }

            return;
        }

        const { data, error } = await supabase
            .from('locations')
            .select('id, name, tamil_name')
            .order('name');

        if (!error && data) {
            setAllLocations(data);
            saveLocationsCache(data);
        }
    }, [isOnline]);

    const searchLocations = useCallback(
        async text => {
            if (!text?.trim()) {
                setSuggestions([]);
                setLoading(false);
                return;
            }

            const searchTerm = text.trim().toLowerCase();

            if (!isOnline) {
                const filtered = allLocations
                    .filter(loc =>
                        loc.name.toLowerCase().includes(searchTerm),
                    )
                    .slice(0, 10);

                setSuggestions(filtered);
                setLoading(false);
                return;
            }

            try {
                const { data, error } = await supabase
                    .from('locations')
                    .select('id, name, tamil_name')
                    .or(
                        `name.ilike.%${searchTerm}%,tamil_name.ilike.%${searchTerm}%`,
                    )
                    .limit(10);

                if (!error) {
                    setSuggestions(data || []);
                }
            } finally {
                setLoading(false);
            }
        },
        [allLocations, isOnline],
    );

    const handleTextChange = text => {
        setInputText(text);
        setShowSuggestions(true);
        setLoading(true);

        onChange?.({
            id: null,
            name: '',
        });

        if (debounceTimer.current) {
            clearTimeout(debounceTimer.current);
        }

        debounceTimer.current = setTimeout(() => {
            searchLocations(text);
        }, 300);
    };

    const handleSelect = location => {
        Keyboard.dismiss();

        setInputText(location.name);

        onChange?.({
            id: location.id,
            name: location.name,
        });

        setShowSuggestions(false);
        setSuggestions([]);
    };


    return (
        <View style={styles.container}>
            <TextInput
                value={inputText}
                placeholder={placeholder}
                style={styles.input}
                onFocus={() => setShowSuggestions(true)}
                // onBlur={() => {
                //     setTimeout(() => {
                //         setShowSuggestions(false);
                //     }, 200);
                // }}
                onChangeText={handleTextChange}
            />

            {showSuggestions && (
                <View style={styles.dropdown}>
                    {loading ? (
                        <View style={styles.loading}>
                            <ActivityIndicator />
                        </View>
                    ) : (
                        suggestions.map(location => (
                            <TouchableOpacity
                                key={location.id}
                                style={styles.item}
                                onPress={() => handleSelect(location)}
                            >
                                <Text style={styles.locationName}>
                                    {location.name}
                                </Text>

                                {!!location.tamil_name && (
                                    <Text style={styles.locationTamil}>
                                        {location.tamil_name}
                                    </Text>
                                )}
                            </TouchableOpacity>
                        ))
                    )}

                    {!loading &&
                        inputText.length > 0 &&
                        suggestions.length === 0 && (
                            <View style={styles.empty}>
                                <Text>No locations found</Text>
                            </View>
                        )}
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'relative',
        zIndex: 9999,
    },

    input: {
        height: 48,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 10,
        paddingHorizontal: 12,
        backgroundColor: '#FFF',
    },

    dropdown: {
        position: 'absolute',
        top: 54,
        left: 0,
        right: 0,

        backgroundColor: '#FFF',

        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 10,

        maxHeight: 220,

        elevation: 12,
        zIndex: 9999,

        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.15,
        shadowRadius: 8,
    },

    item: {
        paddingHorizontal: 12,
        paddingVertical: 12,

        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },

    locationName: {
        fontWeight: '600',
    },

    locationTamil: {
        marginTop: 2,
        color: '#6B7280',
        fontSize: 12,
    },

    loading: {
        padding: 16,
        alignItems: 'center',
    },

    empty: {
        padding: 16,
        alignItems: 'center',
    },
});