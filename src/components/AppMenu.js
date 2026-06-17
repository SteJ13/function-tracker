import React from 'react';
import {
    Modal,
    TouchableOpacity,
    View,
    Text,
    StyleSheet,
} from 'react-native';

export default function AppMenu({
    visible,
    onClose,
    items = [],
    top = 50,
    right = 10,
    width = 220,
}) {
    return (
        <Modal
            transparent
            visible={visible}
            animationType="fade"
            onRequestClose={onClose}
        >
            <TouchableOpacity
                activeOpacity={1}
                style={styles.overlay}
                onPress={onClose}
            >
                <View
                    style={[
                        styles.menu,
                        {
                            top,
                            right,
                            width,
                        },
                    ]}
                >
                    {items.map((item, index) => (
                        <React.Fragment key={`${item.label}-${index}`}>
                            <TouchableOpacity
                                style={styles.menuItem}
                                activeOpacity={0.7}
                                onPress={() => {
                                    onClose();
                                    item.onPress?.();
                                }}
                            >
                                <View style={styles.menuContent}>
                                    {!!item.icon && (
                                        <Text style={styles.menuIcon}>
                                            {item.icon}
                                        </Text>
                                    )}

                                    <Text
                                        style={[
                                            styles.menuText,
                                            item.danger && styles.dangerText,
                                        ]}
                                    >
                                        {item.label}
                                    </Text>
                                </View>
                            </TouchableOpacity>

                            {index < items.length - 1 && (
                                <View style={styles.divider} />
                            )}
                        </React.Fragment>
                    ))}
                </View>
            </TouchableOpacity>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.08)',
    },

    menu: {
        position: 'absolute',
        backgroundColor: '#FFFFFF',
        borderRadius: 18,

        shadowColor: '#000',
        shadowOpacity: 0.12,
        shadowRadius: 12,
        shadowOffset: {
            width: 0,
            height: 4,
        },

        elevation: 8,
        overflow: 'hidden',
    },

    menuItem: {
        minHeight: 56,
        justifyContent: 'center',
        paddingHorizontal: 18,
    },

    menuContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    menuIcon: {
        fontSize: 18,
        marginRight: 12,
    },

    menuText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#222',
    },

    dangerText: {
        color: '#E53935',
        fontWeight: '600',
    },

    divider: {
        height: 1,
        backgroundColor: '#F0F0F0',
        marginLeft: 46,
    },
});