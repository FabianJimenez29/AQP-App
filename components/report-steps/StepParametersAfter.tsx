import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { updateCurrentReport } from '../../store/reportSlice';
import { Parameters } from '../../types';

export default function StepParametersAfter() {
  const [parameters, setParameters] = useState<Parameters>({
    cl: 0,
    ph: 0,
    alk: 0,
    stabilizer: 0,
    hardness: 0,
    salt: 0,
    temperature: 0,
  });

  const { currentReport } = useAppSelector((state) => state.report);
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (currentReport?.parametersAfter) {
      setParameters(currentReport.parametersAfter);
    }
  }, [currentReport]);

  const updateParameter = (key: keyof Parameters, value: string) => {
    const numValue = parseFloat(value) || 0;
    const newParameters = { ...parameters, [key]: numValue };
    setParameters(newParameters);
    dispatch(updateCurrentReport({ parametersAfter: newParameters }));
  };

  const parameterConfigs = [
    { key: 'cl' as keyof Parameters, label: 'Cloro (CL)', unit: 'ppm' },
    { key: 'ph' as keyof Parameters, label: 'Potencial de Hidrógeno (PH)', unit: '' },
    { key: 'alk' as keyof Parameters, label: 'Alcalinidad (ALK)', unit: 'ppm' },
    { key: 'stabilizer' as keyof Parameters, label: 'Estabilizador', unit: 'ppm' },
    { key: 'hardness' as keyof Parameters, label: 'Dureza', unit: 'ppm' },
    { key: 'salt' as keyof Parameters, label: 'Sal', unit: 'ppm' },
    { key: 'temperature' as keyof Parameters, label: 'Temperatura', unit: '°C' },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Parámetros Después del Mantenimiento</Text>
      <Text style={styles.subtitle}>
        Ingresa los valores medidos después de realizar el mantenimiento
      </Text>

      <View style={styles.parametersContainer}>
        {parameterConfigs.map((config) => (
          <View key={config.key} style={styles.parameterItem}>
            <Text style={styles.parameterLabel}>
              {config.label}
              {config.unit && <Text style={styles.unit}> ({config.unit})</Text>}
            </Text>
            <TextInput
              style={styles.parameterInput}
              value={parameters[config.key].toString()}
              onChangeText={(value) => updateParameter(config.key, value)}
              keyboardType="numeric"
              placeholder="0.0"
              placeholderTextColor="#999"
            />
          </View>
        ))}
      </View>

      <View style={styles.comparisonBox}>
        <Text style={styles.comparisonTitle}>📊 Comparación</Text>
        {currentReport?.parametersBefore && (
          <View>
            {parameterConfigs.map((config) => {
              const before = currentReport.parametersBefore?.[config.key] || 0;
              const after = parameters[config.key];
              const difference = after - before;
              const isImproved = 
                (config.key === 'cl' && after >= 1.0 && after <= 3.0) ||
                (config.key === 'ph' && after >= 7.2 && after <= 7.6) ||
                (config.key === 'alk' && after >= 80 && after <= 120);
              
              return (
                <View key={config.key} style={styles.comparisonRow}>
                  <Text style={styles.comparisonLabel}>{config.label}:</Text>
                  <Text style={styles.comparisonValue}>
                    {before} → {after} 
                    <Text style={[
                      styles.comparisonDiff,
                      { color: difference > 0 ? '#4CAF50' : difference < 0 ? '#f44336' : '#666' }
                    ]}>
                      {difference !== 0 && ` (${difference > 0 ? '+' : ''}${difference.toFixed(1)})`}
                    </Text>
                  </Text>
                </View>
              );
            })}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
  parametersContainer: {
    marginBottom: 30,
  },
  parameterItem: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  parameterLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  unit: {
    fontSize: 14,
    fontWeight: '400',
    color: '#666',
  },
  parameterInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
    textAlign: 'center',
  },
  comparisonBox: {
    backgroundColor: '#f3e5f5',
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
  },
  comparisonTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#7b1fa2',
  },
  comparisonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  comparisonLabel: {
    fontSize: 14,
    color: '#7b1fa2',
    flex: 1,
  },
  comparisonValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    textAlign: 'right',
  },
  comparisonDiff: {
    fontSize: 12,
    fontWeight: '400',
  },
});