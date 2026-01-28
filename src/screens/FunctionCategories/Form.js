import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useForm } from 'react-hook-form';
import Toast from 'react-native-toast-message';

import Input from '@components/FormInputs/Input';
import { useLanguage } from '@context/LanguageContext';
import { useAuth } from '@context/AuthContext';
import { useNetwork } from '@context/NetworkContext';
import { addCategory, updateCategory } from './api';

export default function FunctionCategoryForm({ navigation, route }) {

    const { translations } = useLanguage();
    const { user } = useAuth();
    const { isOnline } = useNetwork();


  const editingCategory = route?.params?.category;

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm({
    defaultValues: {
      name: editingCategory?.name || '',
      tamilName: editingCategory?.tamilName || '',
      description: editingCategory?.description || '',
    },
  });

  const onSubmit = async data => {
    if (!isOnline) {
      Toast.show({
        type: 'info',
        text1: 'Add, Edit and Delete are disabled while offline.',
      });
      return;
    }

    try {
      const categoryId = editingCategory?.id;
      
      if (editingCategory) {
        await updateCategory(categoryId, data, user?.id);
      } else {
        await addCategory(data, user?.id);
      }

      navigation.goBack();

      Toast.show({
        type: 'success',
        text1: editingCategory ? 'Category updated' : 'Category added',
      });
    } catch (e) {
      console.log('e ====== : ', e);
      Toast.show({
        type: 'error',
        text1: 'Something went wrong',
      });
    }
  };

  return (
    <View style={styles.container}>
      {!isOnline && (
        <View style={styles.offlineWarning}>
          <Text style={styles.offlineWarningText}>
            📡 Offline Mode: Add, Edit and Delete are disabled
          </Text>
        </View>
      )}

      <Input
        name="name"
        label={translations.name}
        control={control}
        required
        rules={{ required: 'Name is required' }}
        placeholder="Enter category name"
        editable={isOnline}
      />

      <Input
        name="tamilName"
        label={translations.tamilName}
        control={control}
        required
        rules={{ required: 'Tamil name is required' }}
        placeholder="தமிழ் பெயர்"
        editable={isOnline}
      />

      <Input
        name="description"
        label={translations.description}
        control={control}
        placeholder="Description"
        multiline
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
          <Text style={styles.btnText}>
            {isSubmitting ? 'Saving...' : translations.save}
          </Text>
        </TouchableOpacity>
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
});

