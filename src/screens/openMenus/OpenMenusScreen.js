import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const menuItems = [
  {
    id: 'area-calculator',
    title: 'Area Calculator',
    subtitle: 'Calculate square feet and cents from side measurements.',
    route: 'AreaCalculator',
    icon: '📏',
  },
  {
    id: 'hidden-video',
    title: 'Hidden Video',
    subtitle: 'Open stealth video recording workflow.',
    route: 'HiddenVideo',
    icon: '🎥',
  },
];

export default function OpenMenusScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Open Menus</Text>
      <Text style={styles.description}>These tools can be opened without logging in.</Text>

      <View style={styles.list}>
        {menuItems.map(item => (
          <TouchableOpacity
            key={item.id}
            style={styles.card}
            activeOpacity={0.85}
            onPress={() => navigation.navigate(item.route)}
          >
            <Text style={styles.icon}>{item.icon}</Text>
            <View style={styles.content}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F8FA',
    padding: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#17212B',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#5B6672',
    marginBottom: 20,
  },
  list: {
    gap: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  icon: {
    fontSize: 28,
    marginRight: 14,
  },
  content: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#17212B',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#5B6672',
    lineHeight: 18,
  },
});