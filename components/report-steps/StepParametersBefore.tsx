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

export default function StepParametersBefore() {
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
    if (currentReport?.parametersBefore) {
      setParameters(currentReport.parametersBefore);
    }
  }, [currentReport]);

  const updateParameter = (key: keyof Parameters, value: string) => {
    const numValue = parseFloat(value) || 0;
    const newParameters = { ...parameters, [key]: numValue };
    setParameters(newParameters);
    dispatch(updateCurrentReport({ parametersBefore: newParameters }));
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
      <Text style={styles.title}>Parámetros Antes del Mantenimiento</Text>
      <Text style={styles.subtitle}>
        Ingresa los valores medidos antes de realizar el mantenimiento
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

      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>💡 Valores Recomendados</Text>
        <Text style={styles.infoText}>• Cloro: 1.0 - 3.0 ppm</Text>
        <Text style={styles.infoText}>• PH: 7.2 - 7.6</Text>
        <Text style={styles.infoText}>• Alcalinidad: 80 - 120 ppm</Text>
        <Text style={styles.infoText}>• Estabilizador: 30 - 50 ppm</Text>
        <Text style={styles.infoText}>• Dureza: 150 - 300 ppm</Text>
        <Text style={styles.infoText}>• Temperatura: 26 - 28 °C</Text>
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
  infoBox: {
    backgroundColor: '#e3f2fd',
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#1976d2',
  },
  infoText: {
    fontSize: 14,
    color: '#1976d2',
    marginBottom: 5,
  },
});