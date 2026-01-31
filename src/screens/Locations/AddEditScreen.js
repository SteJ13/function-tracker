import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useForm } from 'react-hook-form';
import Toast from 'react-native-toast-message';

import { Input } from '@components/FormInputs';
import { addLocation, updateLocation } from './api';

export default function LocationAddEditScreen({ navigation, route }) {
  const location = route?.params?.location;
  const isEdit = !!location;
  const [submitting, setSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm({
    defaultValues: {
      name: location?.name || '',
      tamil_name: location?.tamil_name || '',
    },
  });

  const onSubmit = useCallback(
    async (values) => {
      try {
        setSubmitting(true);

        if (isEdit) {
          const result = await updateLocation(location.id, {
            name: values.name,
            tamil_name: values.tamil_name,
          });
          if (result.success) {
            Toast.show({
              type: 'success',
              text1: 'Location updated',
            });
            navigation.goBack();
            // Optionally trigger refresh here, e.g. via params or context
            if (route?.params?.onRefresh) {
              route.params.onRefresh();
            }
          } else {
            throw result.error;
          }
        } else {
          await addLocation({
            name: values.name,
            tamil_name: values.tamil_name,
          });
          Toast.show({
            type: 'success',
            text1: 'Location added',
          });
          navigation.goBack();
          if (route?.params?.onRefresh) {
            route.params.onRefresh();
          }
        }
      } catch (error) {
        console.error('[Location Save] Error:', error);
        Toast.show({
          type: 'error',
          text1: isEdit ? 'Failed to update location' : 'Failed to add location',
          text2: error?.message,
        });
      } finally {
        setSubmitting(false);
      }
    },
    [isEdit, location, navigation, route]
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      

      <View style={styles.formCard}>
        <Input
          name="name"
          label="Location Name (English)"
          control={control}
          rules={{ required: 'Location name is required' }}
          placeholder="Enter location name"
        />

        <Input
          name="tamil_name"
          label="Location Name (Tamil)"
          control={control}
          placeholder="Enter Tamil name (optional)"
        />
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.button, styles.cancelButton]}
          onPress={() => navigation.goBack()}
          disabled={isSubmitting || submitting}
        >
          <Text style={styles.buttonText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.saveButton]}
          onPress={handleSubmit(onSubmit)}
          disabled={isSubmitting || submitting}
        >
          <Text style={styles.buttonText}>
            {isSubmitting || submitting ? 'Saving...' : 'Save'}
          </Text>
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 24,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#9E9E9E',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
