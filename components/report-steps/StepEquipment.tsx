import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { updateCurrentReport } from '../../store/reportSlice';
import { EquipmentCheck } from '../../types';

export default function StepEquipment() {
  const [equipment, setEquipment] = useState<EquipmentCheck>({
    bomba_filtro: false,
    bomba_reposadero: false,
    bomba_espejo: false,
    bomba_jets: false,
    blower: false,
    luces_piscina: false,
    luces_spa: false,
    luces_espejo: false,
    filtro_piscina: false,
    filtro_spa: false,
    filtro_espejo: false,
    clorinador_piscina: false,
    clorinador_spa: false,
    clorinador_espejo: false,
  });

  const dispatch = useAppDispatch();

  const toggleEquipment = (key: keyof EquipmentCheck) => {
    const newEquipment = { ...equipment, [key]: !equipment[key] };
    setEquipment(newEquipment);
    dispatch(updateCurrentReport({ equipmentCheck: newEquipment }));
  };

  const equipmentSections = [
    {
      title: 'Bombas',
      items: [
        { key: 'bomba_filtro' as keyof EquipmentCheck, label: 'Bomba Filtro' },
        { key: 'bomba_reposadero' as keyof EquipmentCheck, label: 'Bomba Reposadero' },
        { key: 'bomba_espejo' as keyof EquipmentCheck, label: 'Bomba Espejo' },
        { key: 'bomba_jets' as keyof EquipmentCheck, label: 'Bomba Jets' },
        { key: 'blower' as keyof EquipmentCheck, label: 'Blower' },
      ]
    },
    {
      title: 'Luces',
      items: [
        { key: 'luces_piscina' as keyof EquipmentCheck, label: 'Luces Piscina' },
        { key: 'luces_spa' as keyof EquipmentCheck, label: 'Luces SPA' },
        { key: 'luces_espejo' as keyof EquipmentCheck, label: 'Luces Espejo' },
      ]
    },
    {
      title: 'Filtros',
      items: [
        { key: 'filtro_piscina' as keyof EquipmentCheck, label: 'Filtro Piscina' },
        { key: 'filtro_spa' as keyof EquipmentCheck, label: 'Filtro SPA' },
        { key: 'filtro_espejo' as keyof EquipmentCheck, label: 'Filtro Espejo' },
      ]
    },
    {
      title: 'Clorinadores',
      items: [
        { key: 'clorinador_piscina' as keyof EquipmentCheck, label: 'Clorinador Piscina' },
        { key: 'clorinador_spa' as keyof EquipmentCheck, label: 'Clorinador SPA' },
        { key: 'clorinador_espejo' as keyof EquipmentCheck, label: 'Clorinador Espejo' },
      ]
    }
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Revisión de Equipos</Text>
      <Text style={styles.subtitle}>
        Marca los equipos que fueron revisados y están funcionando correctamente
      </Text>

      {equipmentSections.map((section) => (
        <View key={section.title} style={styles.section}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          {section.items.map((item) => (
            <TouchableOpacity
              key={item.key}
              style={[
                styles.equipmentItem,
                equipment[item.key] && styles.equipmentItemChecked
              ]}
              onPress={() => toggleEquipment(item.key)}
            >
              <Text style={[
                styles.equipmentLabel,
                equipment[item.key] && styles.equipmentLabelChecked
              ]}>
                {item.label}
              </Text>
              <View style={[
                styles.checkbox,
                equipment[item.key] && styles.checkboxChecked
              ]}>
                {equipment[item.key] && <Text style={styles.checkmark}>✓</Text>}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      ))}
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
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#2196F3',
  },
  equipmentItem: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  equipmentItemChecked: {
    backgroundColor: '#e8f5e8',
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  equipmentLabel: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  equipmentLabelChecked: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  checkmark: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});