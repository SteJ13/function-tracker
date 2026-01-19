import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { mockNotifications } from '@utils/mockNotifications';

export default function NotificationsScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <FlatList
        data={mockNotifications}
        keyExtractor={item => item.id}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() =>
              navigation.navigate('NotificationDetail', { notification: item })
            }
          >
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.desc} numberOfLines={2}>
              {item.description}
            </Text>
            <Text style={styles.time}>{item.createdAt}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 15 },
  card: {
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 8,
  },
  title: { fontSize: 16, fontWeight: 'bold' },
  desc: { marginTop: 5, color: '#555' },
  time: { marginTop: 8, fontSize: 12, color: '#999' },
  separator: { height: 10 },
});
