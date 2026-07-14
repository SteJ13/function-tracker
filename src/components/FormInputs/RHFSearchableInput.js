import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
} from 'react-native';
import { Controller } from 'react-hook-form';

import { searchContributionField } from '@services/commonApis';

export default function RHFSearchableInput({
    name,
    searchField,
    control,
    label,
    placeholder = 'Enter text',
    rules = {},
    required = false,
}) {
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const debounceRef = useRef(null);

    const handleSearch = useCallback(
        async (text) => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }

            debounceRef.current = setTimeout(async () => {
                const trimmedText = text?.trim();

                if (!trimmedText || trimmedText.length < 2) {
                    setSuggestions([]);
                    return;
                }

                try {
                    const results = await searchContributionField(searchField, text);
                    setSuggestions(results);
                } catch (error) {
                    setSuggestions([]);
                }
            }, 300);
        },
        [searchField]
    );

    useEffect(() => {
        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
        };
    }, []);

    return (
        <Controller
            control={control}
            name={name}
            rules={rules}
            render={({ field: { value, onChange }, fieldState: { error } }) => (
                <View style={styles.container}>
                    {label && (
                        <Text style={styles.label}>
                            {label}
                            {required && <Text style={styles.required}> *</Text>}
                        </Text>
                    )}

                    <TextInput
                        value={value || ''}
                        placeholder={placeholder}
                        style={styles.input}
                        onFocus={() => setShowSuggestions(true)}
                        onBlur={() => {
                            setTimeout(() => setShowSuggestions(false), 200);
                        }}
                        onChangeText={(text) => {
                            onChange(text);
                            handleSearch(text);
                        }}
                    />

                    {error && (
                        <Text style={styles.error}>{error.message}</Text>
                    )}

                    {showSuggestions && suggestions.length > 0 && (
                        <View style={styles.dropdown}>
                            {suggestions.map((item) => (
                                <TouchableOpacity
                                    key={item}
                                    style={styles.option}
                                    onPress={() => {
                                        onChange(item);
                                        setShowSuggestions(false);
                                    }}
                                >
                                    <Text style={styles.optionText}>{item}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                </View>
            )}
        />
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 16,
        position: 'relative',
        zIndex: 1,
    },

    label: {
        marginBottom: 6,
        fontSize: 14,
        fontWeight: '500',
        color: '#333',
    },

    required: {
        color: '#D32F2F',
    },

    input: {
        borderWidth: 1,
        borderColor: '#DDD',
        borderRadius: 8,
        backgroundColor: '#FFF',
        paddingHorizontal: 12,
        height: 44,
        color: '#000',
    },

    error: {
        marginTop: 4,
        color: '#D32F2F',
        fontSize: 12,
    },

    dropdown: {
        position: 'absolute',
        top: 70,
        left: 0,
        right: 0,
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: '#DDD',
        borderRadius: 8,
        maxHeight: 200,
        zIndex: 9999,
        elevation: 20,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.15,
        shadowRadius: 4,
    },

    option: {
        paddingHorizontal: 12,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },

    optionText: {
        color: '#333',
        fontSize: 15,
    },
});
