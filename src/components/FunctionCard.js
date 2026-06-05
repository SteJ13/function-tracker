import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
} from 'react-native';

export default function FunctionCard({
    item,
    status,
    displayDate,
    displayTime,
    onPress,

    showContributionsButton = false,
    onViewContributions,

    showEditDeleteButtons = false,
    onEdit,
    onDelete,
}) {
    return (
        <TouchableOpacity
            style={styles.card}
            onPress={() => onPress?.(item)}
            activeOpacity={0.7}
        >
            <View style={styles.cardHeader}>
                <Text style={styles.title} numberOfLines={2}>
                    {item.title}
                </Text>

                <View
                    style={[
                        styles.badge,
                        { backgroundColor: status?.color || '#1976D2' },
                    ]}
                >
                    <Text style={styles.badgeText}>
                        {status?.label || 'Unknown'}
                    </Text>
                </View>
            </View>

            <View style={styles.cardBody}>
                <Text style={styles.date}>
                    📅 {displayDate}
                    {displayTime ? ` at ${displayTime}` : ''}
                </Text>

                {item.location?.name ? (
                    <Text style={styles.location} numberOfLines={1}>
                        📍 {item.location.name}
                    </Text>
                ) : null}
            </View>

            {showContributionsButton && (
                <TouchableOpacity
                    style={styles.contributionsButton}
                    onPress={() => onViewContributions?.(item)}
                >
                    <Text style={styles.contributionsButtonText}>
                        View Contributions
                    </Text>
                </TouchableOpacity>
            )}

            {showEditDeleteButtons && (
                <View style={styles.actions}>
                    <TouchableOpacity
                        style={[styles.actionBtn, styles.edit]}
                        onPress={() => onEdit?.(item)}
                    >
                        <Text style={styles.actionText}>Edit</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionBtn, styles.delete]}
                        onPress={() => onDelete?.(item)}
                    >
                        <Text style={styles.actionText}>Remove</Text>
                    </TouchableOpacity>
                </View>
            )}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#FFF',
        marginHorizontal: 16,
        marginVertical: 8,
        borderRadius: 12,
        padding: 16,
        elevation: 2,
    },

    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },

    title: {
        flex: 1,
        fontSize: 16,
        fontWeight: '600',
        color: '#000',
        marginRight: 8,
    },

    badge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },

    badgeText: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: '600',
    },

    cardBody: {
        marginBottom: 12,
    },

    date: {
        fontSize: 13,
        color: '#555',
        marginBottom: 4,
    },

    location: {
        fontSize: 13,
        color: '#555',
    },

    contributionsButton: {
        backgroundColor: '#1976D2',
        borderRadius: 8,
        paddingVertical: 10,
        alignItems: 'center',
    },

    contributionsButtonText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '600',
    },

    actions: {
        flexDirection: 'row',
        gap: 8,
    },

    actionBtn: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 8,
        alignItems: 'center',
    },

    edit: {
        backgroundColor: '#E3F2FD',
    },

    delete: {
        backgroundColor: '#FFEBEE',
    },

    actionText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#000',
    },
});