import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useForm } from 'react-hook-form';
import Toast from 'react-native-toast-message';

import Input from '@components/FormInputs/Input';
import { useLanguage } from '@context/LanguageContext';
import { addCategory, updateCategory } from './api';

export default function FunctionCategoryForm({ navigation, route }) {

    const { translations } = useLanguage();


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
    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, data);
      } else {
        await addCategory(data);
      }

      navigation.navigate('FunctionCategories', {
        refreshKey: Date.now(),
      });

      Toast.show({
        type: 'success',
        text1: editingCategory ? 'Category updated' : 'Category added',
      });
    } catch (e) {
      Toast.show({
        type: 'error',
        text1: 'Something went wrong',
      });
    }
  };

  return (
    <View style={styles.container}>
      <Input
        name="name"
        label={translations.name}
        control={control}
        required
        rules={{ required: 'Name is required' }}
        placeholder="Enter category name"
      />

      <Input
        name="tamilName"
        label={translations.tamilName}
        control={control}
        required
        rules={{ required: 'Tamil name is required' }}
        placeholder="தமிழ் பெயர்"
      />

      <Input
        name="description"
        label={translations.description}
        control={control}
        placeholder="Description"
        multiline
      />

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.button, styles.cancel]}
          onPress={() => navigation.goBack()}
          disabled={isSubmitting}
        >
          <Text style={styles.btnText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.save]}
          onPress={handleSubmit(onSubmit)}
          disabled={isSubmitting}
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
