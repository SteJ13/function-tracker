import React from 'react';
import { View, Text, Image, ScrollView, StyleSheet } from 'react-native';

export default function NotificationDetailScreen({ route }) {
  const { notification } = route.params;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{notification.title}</Text>
      <Text style={styles.time}>{notification.createdAt}</Text>
      <Text style={styles.desc}>{notification.description}</Text>

      {notification.attachments?.map((att, index) => {
        if (att.type === 'image') {
          return (
            <Image
              key={index}
              source={{ uri: att.url }}
              style={styles.image}
            />
          );
        }
        return null;
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  title: { fontSize: 20, fontWeight: 'bold' },
  time: { marginVertical: 10, color: '#888' },
  desc: { fontSize: 16, marginBottom: 20 },
  image: { width: '100%', height: 200, borderRadius: 8 },
});
