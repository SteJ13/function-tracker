import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    ActivityIndicator,
} from 'react-native';

import { getPersonLedger } from './api';

export default function PersonLedgerScreen({ route }) {
    const {
        personName,
        familyName,
        placeId,
        location,
    } = route.params;

    const [loading, setLoading] = useState(true);
    const [data, setData] = useState([]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);

            const result = await getPersonLedger({
                personName,
                familyName,
                placeId,
            });

            setData(result);
        } catch (error) {
            console.log(error);
        } finally {
            setLoading(false);
        }
    };

    const renderItem = ({ item }) => {
        const isGiven =
            item.direction === 'I_GAVE';

        return (
            <View style={styles.card}>
                <View style={styles.row}>
                    <Text style={styles.functionTitle}>
                        {item.functions?.title}
                    </Text>

                    <Text
                        style={[
                            styles.amount,
                            isGiven
                                ? styles.givenAmount
                                : styles.receivedAmount,
                        ]}
                    >
                        {isGiven ? '-' : '+'}₹{item.amount}
                    </Text>
                </View>

                <Text style={styles.date}>
                    {item.functions?.function_date}
                </Text>

                <Text style={styles.direction}>
                    {isGiven
                        ? 'You contributed'
                        : 'They contributed'}
                </Text>
            </View>
        );
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.headerCard}>
                <Text style={styles.personName}>
                    {personName}
                </Text>

                {!!familyName && (
                    <Text style={styles.familyName}>
                        {familyName}
                    </Text>
                )}

                <Text style={styles.location}>
                    {location?.name}
                </Text>
            </View>

            <FlatList
                data={data}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                contentContainerStyle={styles.list}
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

    headerCard: {
        backgroundColor: '#fff',
        padding: 16,
        margin: 16,
        borderRadius: 12,
    },

    personName: {
        fontSize: 22,
        fontWeight: '700',
    },

    familyName: {
        marginTop: 4,
        color: '#666',
    },

    location: {
        marginTop: 4,
        color: '#666',
    },

    list: {
        paddingHorizontal: 16,
        paddingBottom: 20,
    },

    card: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        marginBottom: 10,
    },

    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },

    functionTitle: {
        flex: 1,
        fontWeight: '600',
    },

    amount: {
        fontWeight: '700',
    },

    receivedAmount: {
        color: 'green',
    },

    givenAmount: {
        color: 'red',
    },

    date: {
        marginTop: 6,
        color: '#666',
    },

    direction: {
        marginTop: 4,
        fontSize: 12,
        color: '#888',
    },
});