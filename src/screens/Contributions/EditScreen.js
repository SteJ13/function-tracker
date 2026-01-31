import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useForm } from 'react-hook-form';
import Toast from 'react-native-toast-message';

import { Input, RHFLocationInput } from '@components/FormInputs';
import { useAuth } from '@context/AuthContext';
import { updateContribution } from './api';

const CONTRIBUTION_TYPES = [
  { value: 'cash', label: 'Cash' },
  { value: 'gold', label: 'Gold' },
];

export default function EditContributionScreen({ navigation, route }) {
  const { user } = useAuth();
  const contribution = route?.params?.contribution;

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { isSubmitting },
  } = useForm({
    defaultValues: {
      place_id: null,
      family_name: '',
      person_name: '',
      spouse_name: '',
      contribution_type: 'cash',
      amount: '',
      notes: '',
    },
  });

  useEffect(() => {
    if (!contribution) {
      Toast.show({ type: 'error', text1: 'Contribution not found' });
      navigation.goBack();
      return;
    }

    reset({
      place_id: contribution.place_id || contribution.location?.id || null,
      family_name: contribution.family_name || '',
      person_name: contribution.person_name || '',
      spouse_name: contribution.spouse_name || '',
      contribution_type: contribution.contribution_type || 'cash',
      amount: contribution.amount?.toString() || '',
      notes: contribution.notes || '',
    });
  }, [contribution, navigation, reset]);

  const contributionType = watch('contribution_type');

  const onSubmit = useCallback(async (values) => {
    try {
      if (!user?.id) {
        Toast.show({ type: 'error', text1: 'User not authenticated' });
        return;
      }

      const payload = {
        place_id: values.place_id,
        family_name: values.family_name?.trim() || null,
        person_name: values.person_name?.trim() || '',
        spouse_name: values.spouse_name?.trim() || null,
        contribution_type: values.contribution_type,
        amount: parseFloat(values.amount) || 0,
        notes: values.notes?.trim() || null,
      };

      await updateContribution(contribution.id, payload, user.id);

      Toast.show({ type: 'success', text1: 'Contribution updated' });
      navigation.goBack();
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Failed to update contribution',
        text2: error?.message,
      });
    }
  }, [contribution, navigation, user]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >

      <View style={styles.formCard}>
        <RHFLocationInput
          name="place_id"
          control={control}
          label="Location"
          placeholder="Search or select location"
          rules={{ required: 'Location is required' }}
        />

        <Input
          name="family_name"
          label="Family Name"
          control={control}
          placeholder="Optional"
          voice={false}
        />

        <Input
          name="person_name"
          label="Person Name"
          control={control}
          rules={{ required: 'Person name is required' }}
          placeholder="Required"
          voice={false}
        />

        <Input
          name="spouse_name"
          label="Spouse Name"
          control={control}
          placeholder="Optional"
          voice={false}
        />

        <Text style={styles.fieldLabel}>Contribution Type</Text>
        <View style={styles.typeToggle}>
          {CONTRIBUTION_TYPES.map(option => {
            const isActive = contributionType === option.value;
            return (
              <TouchableOpacity
                key={option.value}
                style={[styles.typeOption, isActive && styles.typeOptionActive]}
                onPress={() => setValue('contribution_type', option.value, { shouldValidate: true })}
              >
                <Text style={[styles.typeOptionText, isActive && styles.typeOptionTextActive]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Input
          name="amount"
          label="Amount"
          control={control}
          rules={{ required: 'Amount is required' }}
          placeholder="0.00"
          type="number"
          voice={false}
        />

        <Input
          name="notes"
          label="Notes"
          control={control}
          placeholder="Optional"
          voice={false}
        />
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.button, styles.cancelButton]}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.buttonText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.saveButton]}
          onPress={handleSubmit(onSubmit)}
          disabled={isSubmitting}
        >
          <Text style={styles.buttonText}>{isSubmitting ? 'Saving...' : 'Save'}</Text>
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
  fieldLabel: {
    marginBottom: 6,
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  typeToggle: {
    flexDirection: 'row',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    overflow: 'hidden',
    marginBottom: 16,
  },
  typeOption: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  typeOptionActive: {
    backgroundColor: '#1976D2',
  },
  typeOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  typeOptionTextActive: {
    color: '#fff',
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
  },
  cancelButton: {
    backgroundColor: '#9E9E9E',
  },
  saveButton: {
    backgroundColor: '#1976D2',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
