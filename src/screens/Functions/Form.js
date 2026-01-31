import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useForm } from 'react-hook-form';
import Toast from 'react-native-toast-message';

import { Input, Select, DatePicker, TimePicker, StatusSelector, RHFLocationInput } from '@components/FormInputs';
import { getFunctionById } from './api';
import useFunctionActions from './useFunctionActions';
import { getCategories } from '@screens/FunctionCategories/api';
import { useNetwork } from '@context/NetworkContext';

const STATUS_OPTIONS = [
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const REMINDER_OPTIONS = [
  { value: 10, label: '10 minutes before' },
  { value: 30, label: '30 minutes before' },
  { value: 60, label: '1 hour before' },
  { value: 1440, label: '1 day before' },
];

export default function FunctionFormScreen({ navigation, route }) {
  const functionId = route?.params?.functionId;
  const initialFunctionType = route?.params?.function_type || 'MY_FUNCTION';
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const { isOnline } = useNetwork();
  const { createFunction, updateFunction } = useFunctionActions();

  // Fetch categories on mount
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const result = await getCategories({ page: 1, limit: 100 });
        setCategories(result.data || []);
      } catch (error) {
        Toast.show({
          type: 'error',
          text1: 'Failed to load categories',
          text2: error?.message,
        });
      } finally {
        setCategoriesLoading(false);
      }
    };

    loadCategories();
  }, []);

  const [loading, setLoading] = useState(!!functionId);

  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm({
    defaultValues: {
      title: '',
      categoryId: '',
      date: '',
      time: '',
      location_id: null,
      notes: '',
      status: 'upcoming',
      reminder_minutes: 1440,
      function_type: initialFunctionType,
    },
  });

  // Load existing function data when editing
  useEffect(() => {
    const loadData = async () => {
      try {
        const existing = await getFunctionById(functionId);

        if (!existing) {
          Toast.show({ type: 'error', text1: 'Function not found' });
          navigation.goBack();
          return;
        }

        reset({
          title: existing.title || '',
          categoryId: existing.category_id || '',
          date: existing.function_date || '',
          time: existing.function_time || existing.time || '',
          location_id: existing.location?.id || null,
          notes: existing.notes || '',
          status: existing.status || 'upcoming',
          reminder_minutes: existing.reminder_minutes || 1440,
          function_type: existing.function_type || initialFunctionType,
        });
      } catch (error) {
        Toast.show({ type: 'error', text1: 'Failed to load function' });
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    };

    if (functionId) {
      loadData();
    }
  }, [functionId, navigation, reset]);

  const onSubmit = useCallback(
    async values => {
      if (!isOnline) {
        Toast.show({
          type: 'info',
          text1: 'Add, Edit and Delete are disabled while offline.',
        });
        return;
      }

      try {
        if (functionId) {
          await updateFunction(functionId, {
            title: values.title.trim(),
            category_id: values.categoryId,
            function_date: values.date,
            function_time: values.time,
            location_id: values.location_id || null,
            notes: values.notes?.trim() || '',
            status: values.status,
            reminder_minutes: values.reminder_minutes,
            function_type: values.function_type || initialFunctionType,
          });

          Toast.show({ type: 'success', text1: 'Function updated' });
          navigation.goBack();
        } else {
          const createdFunction = await createFunction({
            title: values.title.trim(),
            category_id: values.categoryId,
            function_date: values.date,
            function_time: values.time,
            location_id: values.location_id || null,
            notes: values.notes?.trim() || '',
            status: values.status,
            reminder_minutes: values.reminder_minutes,
            function_type: values.function_type || initialFunctionType,
          });

          Toast.show({ type: 'success', text1: 'Function added' });

          // Auto-navigate to add contribution if this is an INVITATION
          if (values.function_type === 'INVITATION' && createdFunction?.id) {
            navigation.navigate('AddContribution', {
              functionId: createdFunction.id,
              functionTitle: values.title.trim(),
              source: 'INVITATION',
            });
          } else {
            navigation.goBack();
          }
        }
      } catch (error) {
        console.log('error: ', error);
        Toast.show({
          type: 'error',
          text1: functionId ? 'Failed to update function' : 'Failed to save function',
        });
      }
    },
    [functionId, navigation, isOnline, createFunction, updateFunction]
  );

  if (loading || categoriesLoading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#1976D2" />
        <Text style={styles.loaderText}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      {!isOnline && (
        <View style={styles.offlineWarning}>
          <Text style={styles.offlineWarningText}>
            📡 Offline Mode: Add, Edit and Delete are disabled
          </Text>
        </View>
      )}

      {!functionId && initialFunctionType === 'INVITATION' && (
        <View style={styles.helperSection}>
          <Text style={styles.helperTitle}>👤 Recording an Invitation</Text>
          <Text style={styles.helperText}>
            An invitation represents a function you attended as a guest. You'll record one contribution for it. After saving, you can immediately add your contribution details.
          </Text>
        </View>
      )}

      {!functionId && initialFunctionType === 'MY_FUNCTION' && (
        <View style={styles.helperSection}>
          <Text style={styles.helperTitle}>📋 Creating Your Function</Text>
          <Text style={styles.helperText}>
            This is a function you're organizing or will organize. You can track contributions from multiple guests.
          </Text>
        </View>
      )}

      <Input
        name="title"
        label="Title"
        control={control}
        required
        rules={{ required: 'Title is required' }}
        placeholder="Enter title"
        editable={isOnline}
      />

      <Select
        name="categoryId"
        label="Category"
        control={control}
        required
        options={categories.map(cat => ({ label: cat.name, value: cat.id }))}
        rules={{ required: 'Category is required' }}
        placeholder="Select category"
        editable={isOnline}
      />

      <DatePicker
        name="date"
        label="Date"
        control={control}
        required
        rules={{ required: 'Date is required' }}
        placeholder="YYYY-MM-DD"
        editable={isOnline}
      />

      <TimePicker
        name="time"
        label="Time"
        control={control}
        required
        rules={{ required: 'Time is required' }}
        placeholder="HH:mm"
        editable={isOnline}
      />

      <RHFLocationInput
        name="location_id"
        label="Location"
        control={control}
        placeholder="Search or add location"
        editable={isOnline}
      />

      <Input
        name="notes"
        label="Notes"
        control={control}
        placeholder="Notes (voice supported)"
        editable={isOnline}
      />

      <StatusSelector
        name="status"
        label="Status"
        control={control}
        options={STATUS_OPTIONS}
        editable={isOnline}
      />

      <Select
        name="reminder_minutes"
        label="Reminder"
        control={control}
        options={REMINDER_OPTIONS}
        placeholder="Select reminder time"
        editable={isOnline}
      />

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.button, styles.cancel]}
          onPress={() => navigation.pop()}
          disabled={isSubmitting}
        >
          <Text style={styles.btnText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.save, !isOnline && styles.buttonDisabled]}
          onPress={handleSubmit(onSubmit)}
          disabled={isSubmitting || !isOnline}
        >
          <Text style={styles.btnText}>{isSubmitting ? 'Saving...' : 'Save'}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F8FA',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  offlineWarning: {
    backgroundColor: '#FF9800',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 16,
  },
  offlineWarningText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  helperSection: {
    backgroundColor: '#F0F7FF',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#1976D2',
  },
  helperTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1976D2',
    marginBottom: 6,
  },
  helperText: {
    fontSize: 13,
    color: '#555',
    lineHeight: 18,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 24,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginLeft: 12,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  cancel: {
    backgroundColor: '#9E9E9E',
  },
  save: {
    backgroundColor: '#1976D2',
  },
  btnText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F6F8FA',
  },
  loaderText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
});
