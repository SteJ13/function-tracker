import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useLanguage } from '@context/LanguageContext';
import { translations } from '@utils/i18n';

const { width } = Dimensions.get('window');
const PADDING = 16;
const GAP = 12;

// EXACT width for 3 columns
const CARD_SIZE = (width - PADDING * 2 - GAP * 2) / 3;

export default function HomeScreen({ navigation }) {

  const { translations } = useLanguage();

  const items = [
    {
      id: 'categories',
      label: translations.functionCategories,
      icon: '📂',
      onPress: () => navigation.navigate('FunctionCategories'),
    },
    {
      id: 'view',
      label: translations.viewFunctions,
      icon: '📋',
      onPress: () => {},
    },
    {
      id: 'notifications',
      label: translations.notifications,
      icon: '🔔',
      onPress: () => navigation.navigate('Notifications'),
    },
    {
      id: 'more',
      label: translations.more,
      icon: '➕',
      onPress: () => {},
    },
  ];
  


  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        {items.map(item => (
          <TouchableOpacity
            key={item.id}
            style={styles.card}
            onPress={item.onPress}
            activeOpacity={0.8}
          >
            <Text style={styles.icon}>{item.icon}</Text>
            <Text style={styles.label}>{item.label}</Text>
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
    paddingTop: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: PADDING,
    rowGap: GAP, // vertical spacing
  },
  card: {
    width: CARD_SIZE,
    height: CARD_SIZE,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
  },
  icon: {
    fontSize: 26,
    marginBottom: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
});
