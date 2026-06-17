import FilterIcon from '@components/Icons/FilterIcon';
import React, { cloneElement, useState } from 'react';
import {
    Modal,
    View,
    Text,
    Pressable,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
} from 'react-native';
import LocationFilter from './LocationFilter';

const isFilterValueActive = value => {
    if (value == null) {
        return false;
    }

    if (Array.isArray(value)) {
        return value.length > 0;
    }

    if (typeof value === 'string') {
        return value.trim().length > 0;
    }

    return true;
};

export const getActiveFilterCount = (filters = [], values = {}) => {
    return filters.reduce((count, filter) => {
        if (filter.type === 'location') {
            return isFilterValueActive(values.locationId) || isFilterValueActive(values.locationName)
                ? count + 1
                : count;
        }

        return isFilterValueActive(values[filter.type]) ? count + 1 : count;
    }, 0);
};

const FilterSheet = ({
    children,
    filters = [],
    initialValues = {},
    onApply,
}) => {
    const [visible, setVisible] = useState(false);
    const [values, setValues] = useState(initialValues);

    const openSheet = () => setVisible(true);

    const closeSheet = () => setVisible(false);

    const updateValue = (key, value) => {
        setValues(prev => ({
            ...prev,
            [key]: value,
        }));
    };

    const handleApply = () => {
        onApply?.(values);
        closeSheet();
    };

    const handleReset = () => {
        setValues({});
    };

    const activeFilterCount = getActiveFilterCount(filters, values);

    const trigger = children ? (
        cloneElement(children, {
            onPress: openSheet,
        })
    ) : (
        <FilterIcon onPress={openSheet} activeFilterCount={activeFilterCount} />
    );

    const renderOptionFilter = filter => {
        return (
            <View key={filter.type} style={styles.section}>
                <Text style={styles.sectionTitle}>
                    {filter.title}
                </Text>

                <View style={styles.optionsContainer}>
                    {filter.options?.map(option => {
                        const selected =
                            values[filter.type] === option.value;

                        return (
                            <TouchableOpacity
                                key={`${filter.type}-${option.label}`}
                                style={[
                                    styles.chip,
                                    selected && styles.selectedChip,
                                ]}
                                onPress={() =>
                                    updateValue(filter.type, option.value)
                                }
                            >
                                <Text
                                    style={[
                                        styles.chipText,
                                        selected && styles.selectedChipText,
                                    ]}
                                >
                                    {option.label}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </View>
        );
    };

    const renderFilter = filter => {
        switch (filter.type) {
            case 'location':
                return (
                    <View key={filter.type} style={styles.section}>
                        <Text style={styles.sectionTitle}>
                            {filter.title}
                        </Text>

                        <LocationFilter
                            value={values.locationId}
                            selectedName={values.locationName}
                            onChange={location => {
                                updateValue('locationId', location.id);
                                updateValue('locationName', location.name);
                            }}
                        />
                    </View>
                );

            default:
                return renderOptionFilter(filter);
        }
    };

    return (
        <>
            {trigger}

            <Modal
                visible={visible}
                transparent
                animationType="slide"
                onRequestClose={closeSheet}
            >
                <Pressable
                    style={styles.overlay}
                    onPress={closeSheet}
                >
                    <Pressable
                        style={styles.sheet}
                        onPress={() => { }}
                    >
                        <View style={styles.handle} />

                        <Text style={styles.title}>
                            Filters
                        </Text>

                        <ScrollView
                            showsVerticalScrollIndicator={false}
                            keyboardShouldPersistTaps="handled"
                            contentContainerStyle={styles.scrollContent}
                        >
                            {filters.map(renderFilter)}
                        </ScrollView>

                        <View style={styles.footer}>
                            <TouchableOpacity
                                style={styles.resetButton}
                                onPress={handleReset}
                            >
                                <Text style={styles.resetText}>
                                    Reset
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.applyButton}
                                onPress={handleApply}
                            >
                                <Text style={styles.applyText}>
                                    Apply Filters
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </Pressable>
                </Pressable>
            </Modal>
        </>
    );
};

export default FilterSheet;

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.35)',
    },

    sheet: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingHorizontal: 20,
        paddingTop: 12,
        paddingBottom: 30,
        maxHeight: '85%',
    },

    handle: {
        width: 50,
        height: 5,
        borderRadius: 10,
        backgroundColor: '#D1D5DB',
        alignSelf: 'center',
        marginBottom: 16,
    },

    title: {
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 20,
    },

    section: {
        marginBottom: 24,
    },

    sectionTitle: {
        fontSize: 15,
        fontWeight: '600',
        marginBottom: 12,
        color: '#374151',
    },

    optionsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },

    chip: {
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 20,
        backgroundColor: '#F3F4F6',
    },

    selectedChip: {
        backgroundColor: '#2563EB',
    },

    chipText: {
        color: '#374151',
        fontWeight: '500',
    },

    selectedChipText: {
        color: '#FFFFFF',
    },

    placeholderText: {
        color: '#9CA3AF',
    },

    footer: {
        flexDirection: 'row',
        marginTop: 10,
    },

    resetButton: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 14,
    },

    resetText: {
        fontWeight: '600',
        color: '#6B7280',
    },

    applyButton: {
        flex: 2,
        backgroundColor: '#2563EB',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 14,
    },

    applyText: {
        color: '#FFFFFF',
        fontWeight: '700',
    },

    scrollContent: {
        paddingBottom: 200,
    },
});