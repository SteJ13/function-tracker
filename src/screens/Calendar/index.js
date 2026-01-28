import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, FlatList, TouchableOpacity } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { getFunctions } from '@screens/Functions/api';

export default function CalendarScreen({ navigation }) {
  // Initialize with today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getCurrentMonth = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  };

  const [selectedDate, setSelectedDate] = useState(getTodayDate());
  const [currentMonth, setCurrentMonth] = useState(getCurrentMonth());
  const [monthFunctions, setMonthFunctions] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch functions when month changes
  useEffect(() => {
    fetchMonthFunctions(currentMonth);
  }, [currentMonth]);

  const fetchMonthFunctions = async (monthString) => {
    try {
      setLoading(true);
      
      // Parse month string (YYYY-MM)
      const [year, month] = monthString.split('-').map(Number);
      
      // Calculate first day of month
      const firstDay = new Date(year, month - 1, 1);
      const firstDayStr = `${year}-${String(month).padStart(2, '0')}-01`;
      
      // Calculate last day of month
      const lastDay = new Date(year, month, 0);
      const lastDayStr = `${year}-${String(month).padStart(2, '0')}-${String(lastDay.getDate()).padStart(2, '0')}`;
      
      // Fetch functions for this month
      const result = await getFunctions({
        page: 1,
        limit: 1000, // Get all functions for the month
        filters: {
          from_date: firstDayStr,
          to_date: lastDayStr,
        },
      });
      
      setMonthFunctions(result.data || []);
    } catch (error) {
      console.error('[Calendar] Failed to fetch functions:', error);
      setMonthFunctions([]);
    } finally {
      setLoading(false);
    }
  };

  // Build marked dates object with color-coded status dots
  const buildMarkedDates = () => {
    const marked = {};
    
    // Helper to get dot color based on status
    const getStatusDotColor = (status) => {
      switch (status) {
        case 'upcoming':
          return '#4CAF50'; // green
        case 'completed':
          return '#2196F3'; // blue
        case 'cancelled':
          return '#F44336'; // red
        default:
          return '#666'; // gray
      }
    };
    
    // Group functions by date and collect unique statuses
    const dateStatusMap = {};
    monthFunctions.forEach(fn => {
      const dateKey = fn.function_date;
      if (dateKey) {
        if (!dateStatusMap[dateKey]) {
          dateStatusMap[dateKey] = new Set();
        }
        dateStatusMap[dateKey].add(fn.status);
      }
    });
    
    // Build dots for each date
    Object.keys(dateStatusMap).forEach(dateKey => {
      const statuses = Array.from(dateStatusMap[dateKey]);
      const dots = statuses.map(status => ({
        color: getStatusDotColor(status),
      }));
      
      marked[dateKey] = {
        dots: dots,
      };
    });
    
    // Highlight selected date
    if (selectedDate) {
      marked[selectedDate] = {
        ...marked[selectedDate],
        selected: true,
        selectedColor: '#007AFF',
        selectedTextColor: '#fff',
      };
    }
    
    return marked;
  };

  const handleDayPress = (day) => {
    setSelectedDate(day.dateString);
  };

  const handleMonthChange = (month) => {
    // month object: { year: 2026, month: 1, dateString: "2026-01-01", timestamp: ... }
    const monthString = `${month.year}-${String(month.month).padStart(2, '0')}`;
    setCurrentMonth(monthString);
  };

  const markedDates = buildMarkedDates();

  // Filter functions for selected date
  const selectedDateFunctions = monthFunctions.filter(
    fn => fn.function_date === selectedDate
  );

  const renderFunctionItem = ({ item }) => {
    // Format time from "HH:mm:ss" to "HH:mm"
    const displayTime = item.function_time ? item.function_time.substring(0, 5) : '';
    
    // Get status color for left border indicator
    const getStatusBorderColor = (status) => {
      switch (status) {
        case 'upcoming':
          return '#4CAF50'; // green
        case 'completed':
          return '#2196F3'; // blue
        case 'cancelled':
          return '#F44336'; // red
        default:
          return '#666'; // gray
      }
    };
    
    return (
      <TouchableOpacity 
        style={[
          styles.functionItem,
          { borderLeftColor: getStatusBorderColor(item.status) }
        ]}
        onPress={() => navigation.navigate('FunctionDetail', { functionId: item.id })}
        activeOpacity={0.7}
      >
        <View style={styles.functionContent}>
          <Text style={styles.functionTitle} numberOfLines={1}>{item.title}</Text>
          {displayTime && (
            <Text style={styles.functionTime}>🕐 {displayTime}</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };



  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>📅</Text>
      <Text style={styles.emptyText}>No functions scheduled</Text>
      <Text style={styles.emptySubtext}>Tap a date to see functions</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Calendar
        onDayPress={handleDayPress}
        onMonthChange={handleMonthChange}
        markedDates={markedDates}
        markingType="multi-dot"
        theme={{
          selectedDayBackgroundColor: '#007AFF',
          selectedDayTextColor: '#fff',
          todayTextColor: '#007AFF',
          todayBackgroundColor: 'transparent',
          arrowColor: '#007AFF',
          monthTextColor: '#000',
          textDisabledColor: '#d9d9d9',
          dotColor: '#007AFF',
          selectedDotColor: '#fff',
        }}
      />

      {/* Legend for status colors */}
      <View style={styles.legendContainer}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#4CAF50' }]} />
          <Text style={styles.legendText}>Upcoming</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#2196F3' }]} />
          <Text style={styles.legendText}>Completed</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#F44336' }]} />
          <Text style={styles.legendText}>Cancelled</Text>
        </View>
      </View>

      <View style={styles.agendaContainer}>
        <Text style={styles.agendaTitle}>
          {selectedDate === getTodayDate() ? 'Today' : selectedDate}
        </Text>
        
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
          </View>
        ) : (
          <FlatList
            data={selectedDateFunctions}
            renderItem={renderFunctionItem}
            keyExtractor={(item) => item.id}
            ListEmptyComponent={renderEmptyState}
            contentContainerStyle={selectedDateFunctions.length === 0 && styles.emptyListContent}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F9F9F9',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    gap: 20,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 12,
    color: '#666',
  },
  agendaContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  agendaTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#000',
  },
  functionItem: {
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 8,
    marginBottom: 10,
    borderLeftWidth: 4,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  functionContent: {
    flex: 1,
  },
  functionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  functionTime: {
    fontSize: 13,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    textAlign: 'center',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  emptyListContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
});
