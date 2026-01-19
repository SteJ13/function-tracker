import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useLanguage } from '@context/LanguageContext';
import { translations } from '@utils/i18n';
import { getAllFunctions } from '@utils/functionStorage';

const { width } = Dimensions.get('window');
const PADDING = 16;
const GAP = 12;

// EXACT width for 3 columns
const CARD_SIZE = (width - PADDING * 2 - GAP * 2) / 3;

export default function HomeScreen({ navigation }) {

  const { translations } = useLanguage();
  const [stats, setStats] = useState({
    total: 0,
    upcoming: 0,
    today: 0,
    completed: 0,
  });

  // Load statistics whenever screen is focused
  useFocusEffect(
    React.useCallback(() => {
      loadStatistics();
    }, [])
  );

  const loadStatistics = async () => {
    try {
      const allFunctions = await getAllFunctions();

      if (!allFunctions || allFunctions.length === 0) {
        setStats({
          total: 0,
          upcoming: 0,
          today: 0,
          completed: 0,
        });
        return;
      }

      const today = new Date().toISOString().split('T')[0];

      const upcoming = allFunctions.filter(f => f.status === 'upcoming').length;
      const completed = allFunctions.filter(f => f.status === 'completed').length;
      const todayFunctions = allFunctions.filter(f => f.date === today).length;

      setStats({
        total: allFunctions.length,
        upcoming,
        today: todayFunctions,
        completed,
      });
    } catch (error) {
      console.error('Failed to load statistics:', error);
      setStats({
        total: 0,
        upcoming: 0,
        today: 0,
        completed: 0,
      });
    }
  };

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
      onPress: () => navigation.navigate('Functions'),
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
      {/* Statistics Section */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.upcoming}</Text>
          <Text style={styles.statLabel}>Upcoming</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.today}</Text>
          <Text style={styles.statLabel}>Today</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.completed}</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
      </View>

      {/* Navigation Grid */}
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
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: PADDING,
    marginBottom: 24,
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1976D2',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#999',
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: PADDING,
    rowGap: GAP,
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
    color: '#333',
  },
});
