import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, ScrollView } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import Input from '@components/FormInputs/Input';

export default function AreaCalculatorScreen() {
  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isValid },
  } = useForm({
    mode: 'onChange',
    defaultValues: {
      north: '',
      south: '',
      east: '',
      west: '',
    },
  });

  const values = watch();

  // Calculation logic
  const allFilled = ['north', 'south', 'east', 'west'].every(
    key => {
      const v = values[key];
      return v !== '' && !isNaN(Number(v)) && Number(v) > 0;
    }
  );

  let result = null;
  if (allFilled) {
    const north = parseFloat(values.north);
    const south = parseFloat(values.south);
    const east = parseFloat(values.east);
    const west = parseFloat(values.west);
    const avgLength = (north + south) / 2;
    const avgWidth = (east + west) / 2;
    const areaSqM = avgLength * avgWidth;
    const areaSqFt = areaSqM * 10.7639;
    const areaCents = areaSqFt / 435.6;
    result = {
      sqFt: areaSqFt,
      cents: areaCents,
    };
  }

  const onClear = () => {
    reset();
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <View style={styles.gridRow}>
            <View style={styles.gridItem}>
              <Input
                control={control}
                name="north"
                label={"North (m) *"}
                type="number"
                required
                rules={{
                  required: 'Required',
                  validate: v => !isNaN(Number(v)) && Number(v) > 0 || 'Must be a number > 0',
                }}
              />
            </View>
            <View style={styles.gridItem}>
              <Input
                control={control}
                name="south"
                label={"South (m) *"}
                type="number"
                required
                rules={{
                  required: 'Required',
                  validate: v => !isNaN(Number(v)) && Number(v) > 0 || 'Must be a number > 0',
                }}
              />
            </View>
          </View>
          <View style={styles.gridRow}>
            <View style={styles.gridItem}>
              <Input
                control={control}
                name="east"
                label={"East (m) *"}
                type="number"
                required
                rules={{
                  required: 'Required',
                  validate: v => !isNaN(Number(v)) && Number(v) > 0 || 'Must be a number > 0',
                }}
              />
            </View>
            <View style={styles.gridItem}>
              <Input
                control={control}
                name="west"
                label={"West (m) *"}
                type="number"
                required
                rules={{
                  required: 'Required',
                  pattern: {
                    value: /^\d*\.?\d+$/,
                    message: 'Enter a valid number',
                  },
                  validate: v => parseFloat(v) > 0 || 'Must be > 0',
                }}
              />
            </View>
          </View>
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, !allFilled && styles.buttonDisabled]}
              disabled={!allFilled}
              onPress={() => {}}
            >
              <Text style={styles.buttonText}>Calculate</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.clearButton} onPress={onClear}>
              <Text style={styles.clearButtonText}>Clear</Text>
            </TouchableOpacity>
          </View>
        </View>
        {result && (
          <View style={styles.resultCard}>
            <Text style={styles.resultTitle}>Area:</Text>
            <Text style={styles.resultValue}>
              • {result.sqFt.toLocaleString(undefined, { maximumFractionDigits: 2, minimumFractionDigits: 2 })} sq.ft
            </Text>
            <Text style={styles.resultValue}>
              • {result.cents.toLocaleString(undefined, { maximumFractionDigits: 3, minimumFractionDigits: 3 })} cents
            </Text>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#F6F8FA',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 18,
    alignSelf: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 18,
    marginBottom: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  gridItem: {
    flex: 1,
    marginHorizontal: 4,
  },
  required: {
    color: '#E53935',
    fontWeight: 'bold',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 18,
  },
  button: {
    backgroundColor: '#1976D2',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    minWidth: 120,
  },
  buttonDisabled: {
    backgroundColor: '#90CAF9',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  clearButton: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1976D2',
    minWidth: 100,
  },
  clearButtonText: {
    color: '#1976D2',
    fontWeight: '600',
    fontSize: 16,
  },
  resultCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 18,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    marginBottom: 24,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1976D2',
    marginBottom: 8,
  },
  resultValue: {
    fontSize: 16,
    color: '#222',
    marginBottom: 4,
  },
});
