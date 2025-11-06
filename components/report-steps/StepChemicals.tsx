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
import { Chemicals } from '../../types';

export default function StepChemicals() {
  const [chemicals, setChemicals] = useState<Chemicals>({
    tricloro: 0,
    tabletas: 0,
    acido: 0,
    soda: 0,
    bicarbonato: 0,
    sal: 0,
    alguicida: 0,
    clarificador: 0,
    cloro_liquido: 0,
  });

  const dispatch = useAppDispatch();

  const updateChemical = (key: keyof Chemicals, value: string) => {
    const numValue = parseFloat(value) || 0;
    const newChemicals = { ...chemicals, [key]: numValue };
    setChemicals(newChemicals);
    dispatch(updateCurrentReport({ chemicals: newChemicals }));
  };

  const chemicalConfigs = [
    { key: 'tricloro' as keyof Chemicals, label: 'Tricloro', unit: 'kg' },
    { key: 'tabletas' as keyof Chemicals, label: 'Tabletas de Cloro', unit: 'unidades' },
    { key: 'acido' as keyof Chemicals, label: 'Ácido', unit: 'L' },
    { key: 'soda' as keyof Chemicals, label: 'Soda', unit: 'kg' },
    { key: 'bicarbonato' as keyof Chemicals, label: 'Bicarbonato', unit: 'kg' },
    { key: 'sal' as keyof Chemicals, label: 'Sal', unit: 'kg' },
    { key: 'alguicida' as keyof Chemicals, label: 'Alguicida', unit: 'L' },
    { key: 'clarificador' as keyof Chemicals, label: 'Clarificador', unit: 'L' },
    { key: 'cloro_liquido' as keyof Chemicals, label: 'Cloro Líquido', unit: 'L' },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Químicos Utilizados</Text>
      <Text style={styles.subtitle}>
        Registra la cantidad de químicos utilizados durante el mantenimiento
      </Text>

      <View style={styles.chemicalsContainer}>
        {chemicalConfigs.map((config) => (
          <View key={config.key} style={styles.chemicalItem}>
            <Text style={styles.chemicalLabel}>
              {config.label}
              <Text style={styles.unit}> ({config.unit})</Text>
            </Text>
            <TextInput
              style={styles.chemicalInput}
              value={(chemicals[config.key] || 0).toString()}
              onChangeText={(value) => updateChemical(config.key, value)}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor="#999"
            />
          </View>
        ))}
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
  chemicalsContainer: {
    marginBottom: 30,
  },
  chemicalItem: {
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
  chemicalLabel: {
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
  chemicalInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
    textAlign: 'center',
  },
});