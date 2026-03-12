import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, ScrollView } from 'react-native';
import { useForm } from 'react-hook-form';
import Slider from '@react-native-community/slider';
import Input from '@components/FormInputs/Input';

const SIDE_KEYS = ['north', 'south', 'east', 'west'];

const SIDE_LABELS = {
  north: 'North',
  south: 'South',
  east: 'East',
  west: 'West',
};

const DEFAULT_WEIGHTS = {
  north: 0,
  south: 0,
  east: 0,
  west: 0,
};

function distributeEvenly(selectedSides) {
  if (!selectedSides.length) {
    return { ...DEFAULT_WEIGHTS };
  }

  const each = 100 / selectedSides.length;
  const next = { ...DEFAULT_WEIGHTS };
  selectedSides.forEach(side => {
    next[side] = each;
  });
  return next;
}

function normalizeWeights(weights, selectedSides) {
  const next = { ...DEFAULT_WEIGHTS, ...weights };
  selectedSides.forEach(side => {
    if (!isFinite(next[side]) || next[side] < 0) {
      next[side] = 0;
    }
  });

  const total = selectedSides.reduce((sum, side) => sum + next[side], 0);
  if (total <= 0) {
    return distributeEvenly(selectedSides);
  }

  selectedSides.forEach(side => {
    next[side] = (next[side] / total) * 100;
  });

  return next;
}

export default function AreaCalculatorScreen() {
  const {
    control,
    reset,
    watch,
  } = useForm({
    mode: 'onChange',
    defaultValues: {
      north: '',
      south: '',
      east: '',
      west: '',
      targetCents: '',
    },
  });
  const [selectedSides, setSelectedSides] = useState([]);
  const [sideWeights, setSideWeights] = useState({ ...DEFAULT_WEIGHTS });

  const values = watch();

  const allFilled = ['north', 'south', 'east', 'west'].every(key => {
    const value = values[key];
    return value !== '' && !isNaN(Number(value)) && Number(value) > 0;
  });

  let result = null;
  let avgLength = 0;
  let avgWidth = 0;
  let areaSqM = 0;

  if (allFilled) {
    const north = parseFloat(values.north);
    const south = parseFloat(values.south);
    const east = parseFloat(values.east);
    const west = parseFloat(values.west);
    avgLength = (north + south) / 2;
    avgWidth = (east + west) / 2;
    areaSqM = avgLength * avgWidth;
    const areaSqFt = areaSqM * 10.7639;
    const areaCents = areaSqFt / 435.6;
    result = {
      sqFt: areaSqFt,
      cents: areaCents,
    };
  }

  const targetCents = Number(values.targetCents);
  const hasValidTarget = values.targetCents !== '' && !isNaN(targetCents) && targetCents > 0;

  const toggleSide = side => {
    const isSelected = selectedSides.includes(side);
    const nextSelected = isSelected
      ? selectedSides.filter(item => item !== side)
      : [...selectedSides, side];

    setSelectedSides(nextSelected);
    setSideWeights(distributeEvenly(nextSelected));
  };

  const updateSideWeight = (side, value) => {
    if (!selectedSides.includes(side)) return;
    if (selectedSides.length <= 1) {
      setSideWeights({ ...DEFAULT_WEIGHTS, [side]: 100 });
      return;
    }

    const min = 1;
    const max = 100 - min * (selectedSides.length - 1);
    const desired = Math.min(max, Math.max(min, value));

    const others = selectedSides.filter(item => item !== side);
    const remaining = 100 - desired;
    const othersCurrent = others.reduce((sum, item) => sum + sideWeights[item], 0);

    const nextWeights = { ...DEFAULT_WEIGHTS };
    nextWeights[side] = desired;

    if (othersCurrent <= 0) {
      const each = remaining / others.length;
      others.forEach(item => {
        nextWeights[item] = each;
      });
    } else {
      others.forEach(item => {
        nextWeights[item] = (sideWeights[item] / othersCurrent) * remaining;
      });
    }

    setSideWeights(normalizeWeights(nextWeights, selectedSides));
  };

  let adjustmentResult = null;
  if (allFilled && hasValidTarget) {
    if (!selectedSides.length) {
      adjustmentResult = {
        kind: 'info',
        message: 'Select at least one side to adjust.',
      };
    } else if (targetCents <= result.cents) {
      adjustmentResult = {
        kind: 'info',
        message: 'Expected cents must be greater than current cents to calculate increase.',
      };
    } else {
      const normalizedWeights = normalizeWeights(sideWeights, selectedSides);
      const targetAreaSqM = (targetCents * 435.6) / 10.7639;

      const lengthShare = ((normalizedWeights.north || 0) + (normalizedWeights.south || 0)) / 100;
      const widthShare = ((normalizedWeights.east || 0) + (normalizedWeights.west || 0)) / 100;

      const lengthFactor = 0.5 * lengthShare;
      const widthFactor = 0.5 * widthShare;

      const currentAreaSqM = avgLength * avgWidth;
      const c = currentAreaSqM - targetAreaSqM;
      const b = (avgLength * widthFactor) + (avgWidth * lengthFactor);
      const a = lengthFactor * widthFactor;

      let increaseScale = NaN;

      if (Math.abs(a) < 1e-9) {
        if (Math.abs(b) > 1e-9) {
          increaseScale = -c / b;
        }
      } else {
        const d = (b * b) - (4 * a * c);
        if (d >= 0) {
          const sqrtD = Math.sqrt(d);
          const r1 = (-b + sqrtD) / (2 * a);
          const r2 = (-b - sqrtD) / (2 * a);
          increaseScale = Math.max(r1, r2);
        }
      }

      if (!isFinite(increaseScale) || increaseScale <= 0) {
        adjustmentResult = {
          kind: 'info',
          message: 'Unable to compute a valid increase for the selected sides and slider values.',
        };
      } else {
        const perSideIncrease = {
          north: (normalizedWeights.north / 100) * increaseScale,
          south: (normalizedWeights.south / 100) * increaseScale,
          east: (normalizedWeights.east / 100) * increaseScale,
          west: (normalizedWeights.west / 100) * increaseScale,
        };

        const updatedLength = avgLength + 0.5 * (perSideIncrease.north + perSideIncrease.south);
        const updatedWidth = avgWidth + 0.5 * (perSideIncrease.east + perSideIncrease.west);
        const updatedAreaSqM = updatedLength * updatedWidth;
        const updatedAreaSqFt = updatedAreaSqM * 10.7639;

        adjustmentResult = {
          kind: 'result',
          targetCents,
          updatedAreaSqFt,
          perSideIncrease,
        };
      }
    }
  }

  const onClear = () => {
    reset();
    setSelectedSides([]);
    setSideWeights({ ...DEFAULT_WEIGHTS });
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
                label="North (m) *"
                type="number"
                required
                rules={{
                  required: 'Required',
                  validate: value => !isNaN(Number(value)) && Number(value) > 0 || 'Must be a number > 0',
                }}
              />
            </View>
            <View style={styles.gridItem}>
              <Input
                control={control}
                name="south"
                label="South (m) *"
                type="number"
                required
                rules={{
                  required: 'Required',
                  validate: value => !isNaN(Number(value)) && Number(value) > 0 || 'Must be a number > 0',
                }}
              />
            </View>
          </View>
          <View style={styles.gridRow}>
            <View style={styles.gridItem}>
              <Input
                control={control}
                name="east"
                label="East (m) *"
                type="number"
                required
                rules={{
                  required: 'Required',
                  validate: value => !isNaN(Number(value)) && Number(value) > 0 || 'Must be a number > 0',
                }}
              />
            </View>
            <View style={styles.gridItem}>
              <Input
                control={control}
                name="west"
                label="West (m) *"
                type="number"
                required
                rules={{
                  required: 'Required',
                  pattern: {
                    value: /^\d*\.?\d+$/,
                    message: 'Enter a valid number',
                  },
                  validate: value => parseFloat(value) > 0 || 'Must be > 0',
                }}
              />
            </View>
          </View>
          <View style={styles.buttonRow}>
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

        <View style={styles.resultCard}>
          <Text style={styles.resultTitle}>Area Adjust</Text>

          <Input
            control={control}
            name="targetCents"
            label="Expected Cents *"
            type="number"
            required
            rules={{
              required: 'Required',
              validate: value => !isNaN(Number(value)) && Number(value) > 0 || 'Must be a number > 0',
            }}
          />

          <Text style={styles.adjustLabel}>Side(s) to increase (multi-select)</Text>
          <View style={styles.adjustModeWrap}>
            {SIDE_KEYS.map(side => (
              <TouchableOpacity
                key={side}
                onPress={() => toggleSide(side)}
                style={[
                  styles.adjustModeChip,
                  selectedSides.includes(side) && styles.adjustModeChipActive,
                ]}
              >
                <Text
                  style={[
                    styles.adjustModeChipText,
                    selectedSides.includes(side) && styles.adjustModeChipTextActive,
                  ]}
                >
                  {SIDE_LABELS[side]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {!!selectedSides.length && (
            <View style={styles.slidersWrap}>
              <Text style={styles.sliderHelpText}>Use sliders to split adjustment across selected sides. Total stays 100%.</Text>
              {selectedSides.map(side => (
                <View key={side} style={styles.sliderRow}>
                  <View style={styles.sliderHeaderRow}>
                    <Text style={styles.sliderLabel}>{SIDE_LABELS[side]}</Text>
                    <Text style={styles.sliderValueText}>
                      {(sideWeights[side] || 0).toFixed(1)}%
                    </Text>
                  </View>
                  <Slider
                    value={sideWeights[side] || 0}
                    minimumValue={selectedSides.length > 1 ? 1 : 100}
                    maximumValue={selectedSides.length > 1 ? 100 - (selectedSides.length - 1) : 100}
                    step={0.5}
                    minimumTrackTintColor="#1976D2"
                    maximumTrackTintColor="#D7E6FA"
                    thumbTintColor="#1976D2"
                    onValueChange={value => updateSideWeight(side, value)}
                  />
                </View>
              ))}
            </View>
          )}

          {!allFilled && (
            <Text style={styles.helperText}>Fill all four sides above to get adjustment output.</Text>
          )}

          {allFilled && !hasValidTarget && (
            <Text style={styles.helperText}>Enter expected cents to calculate required side increase.</Text>
          )}

          {adjustmentResult?.kind === 'info' && (
            <Text style={styles.helperText}>{adjustmentResult.message}</Text>
          )}

          {adjustmentResult?.kind === 'result' && (
            <View style={styles.adjustResultBox}>
              <Text style={styles.adjustResultText}>Required increase per selected side:</Text>

              {selectedSides.map(side => (
                <Text key={side} style={styles.adjustBreakdownText}>
                  • {SIDE_LABELS[side]}: {adjustmentResult.perSideIncrease[side].toLocaleString(undefined, {
                    maximumFractionDigits: 3,
                    minimumFractionDigits: 3,
                  })} m
                </Text>
              ))}

              <Text style={styles.adjustSubText}>
                New area: {adjustmentResult.updatedAreaSqFt.toLocaleString(undefined, {
                  maximumFractionDigits: 2,
                  minimumFractionDigits: 2,
                })} sq.ft ({adjustmentResult.targetCents.toLocaleString(undefined, {
                  maximumFractionDigits: 3,
                  minimumFractionDigits: 3,
                })} cents)
              </Text>
            </View>
          )}
        </View>
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
    justifyContent: 'flex-end',
    marginTop: 18,
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
  adjustLabel: {
    marginTop: 8,
    marginBottom: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  adjustModeWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  adjustModeChip: {
    borderWidth: 1,
    borderColor: '#1976D2',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
  },
  adjustModeChipActive: {
    backgroundColor: '#1976D2',
  },
  adjustModeChipText: {
    color: '#1976D2',
    fontSize: 13,
    fontWeight: '600',
  },
  adjustModeChipTextActive: {
    color: '#fff',
  },
  helperText: {
    fontSize: 13,
    color: '#5f6b76',
    marginTop: 4,
  },
  adjustResultBox: {
    marginTop: 10,
    backgroundColor: '#E9F2FF',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#B9D8FF',
  },
  adjustResultText: {
    fontSize: 14,
    color: '#12345A',
    fontWeight: '700',
    marginBottom: 6,
  },
  adjustSubText: {
    fontSize: 13,
    color: '#2B4E78',
  },
  slidersWrap: {
    marginTop: 8,
    marginBottom: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#D7E6FA',
    borderRadius: 10,
    backgroundColor: '#F8FBFF',
  },
  sliderHelpText: {
    fontSize: 12,
    color: '#5f6b76',
    marginBottom: 8,
  },
  sliderRow: {
    marginBottom: 10,
  },
  sliderHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  sliderLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2B4E78',
  },
  sliderValueText: {
    fontSize: 12,
    color: '#2B4E78',
  },
  adjustBreakdownText: {
    fontSize: 13,
    color: '#12345A',
    marginBottom: 4,
  },
});