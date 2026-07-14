import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

import SearchInput from '@components/SearchInput';
import FilterSheet from '@components/Filters/FilterSheet';
import { getRelationshipLedger } from './api';

export default function RelationshipLedgerScreen() {
    const navigation = useNavigation();

    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({});

    const loadData = useCallback(async () => {
        try {
            setLoading(true);

            const result = await getRelationshipLedger({
                searchQuery: searchTerm,
                filters,
            });

            setData(result || []);
        } catch (error) {
            console.log(error?.message || 'Failed to load relationships');
        } finally {
            setLoading(false);
        }
    }, [searchTerm, filters]);

    const handleFilterApply = useCallback((appliedFilters) => {
        setFilters(appliedFilters);
    }, []);

    useEffect(() => {
        navigation.setOptions({
            title: 'Relationship Ledger',
            headerRight: () => (
                <FilterSheet
                    filters={[
                        { type: 'location', title: 'Location' },
                        { type: 'familyName', title: 'Family Name', placeholder: 'Search family name' },
                    ]}
                    onApply={handleFilterApply}
                />
            ),
        });
    }, [navigation, handleFilterApply]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const renderItem = ({ item }) => {
        const balance = item.cashBalance || 0;

        const balanceColor =
            balance > 0
                ? '#16a34a'
                : balance < 0
                    ? '#dc2626'
                    : '#6b7280';

        return (
            <TouchableOpacity
                activeOpacity={0.8}
                style={styles.card}
                onPress={() => {
                    console.log('Relationship:', item);

                    navigation.navigate('PersonLedger', {
                        personName: item.person_name,
                        familyName: item.family_name,
                        placeId: item.place_id,
                        location: item.location,
                    });
                }}
            >
                <Text style={styles.personName}>
                    {item.person_name}
                </Text>

                {!!item.spouse_name && (
                    <Text style={styles.spouseName}>
                        Spouse: {item.spouse_name}
                    </Text>
                )}

                {!!item.family_name && (
                    <Text style={styles.familyName}>
                        {item.family_name}
                    </Text>
                )}

                <Text style={styles.location}>
                    {item.location?.name || 'Unknown Location'}
                    {item.location?.tamil_name ? ` · ${item.location.tamil_name}` : ''}
                </Text>

                <View style={styles.divider} />



                <View style={styles.balanceContainer}>
                    <Text style={styles.balanceLabel}>
                        Balance
                    </Text>

                    <Text
                        style={[
                            styles.balanceAmount,
                            { color: balanceColor },
                        ]}
                    >
                        ₹{Math.abs(balance).toLocaleString()}
                    </Text>
                </View>

                {balance > 0 && (
                    <Text style={styles.balanceHint}>
                        They owe you
                    </Text>
                )}

                {balance < 0 && (
                    <Text style={styles.balanceHint}>
                        You owe them
                    </Text>
                )}

                {balance === 0 && (
                    <Text style={styles.balanceHint}>
                        Settled
                    </Text>
                )}
            </TouchableOpacity>
        );
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    if (!data.length) {
        return (
            <View style={styles.center}>
                <Text style={styles.emptyText}>
                    No relationships found
                </Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <SearchInput
                placeholder="Search person, family, spouse or location"
                onSearch={setSearchTerm}
            />
            <FlatList
                data={data}
                keyExtractor={(item) =>
                    `${item.person_name}-${item.family_name || ''}-${item.spouse_name || ''}-${item.place_id}`
                }
                renderItem={renderItem}
                contentContainerStyle={styles.listContent}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f6f8',
    },

    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },

    emptyText: {
        fontSize: 16,
        color: '#6b7280',
    },

    listContent: {
        padding: 16,
    },

    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        elevation: 2,
    },

    personName: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
    },

    spouseName: {
        marginTop: 4,
        fontSize: 14,
        color: '#6b7280',
    },

    familyName: {
        marginTop: 4,
        fontSize: 14,
        color: '#6b7280',
    },

    location: {
        marginTop: 6,
        fontSize: 14,
        color: '#6b7280',
    },

    divider: {
        height: 1,
        backgroundColor: '#e5e7eb',
        marginVertical: 12,
    },

    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },

    metric: {
        flex: 1,
    },

    metricLabel: {
        fontSize: 13,
        color: '#6b7280',
    },

    receivedAmount: {
        marginTop: 4,
        fontSize: 18,
        fontWeight: '700',
        color: '#16a34a',
    },

    givenAmount: {
        marginTop: 4,
        fontSize: 18,
        fontWeight: '700',
        color: '#ea580c',
    },

    balanceContainer: {
        marginTop: 16,
    },

    balanceLabel: {
        fontSize: 13,
        color: '#6b7280',
    },

    balanceAmount: {
        marginTop: 4,
        fontSize: 24,
        fontWeight: '700',
    },

    balanceHint: {
        marginTop: 4,
        fontSize: 13,
        color: '#6b7280',
    },
});