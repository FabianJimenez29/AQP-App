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

export default function StepMaterialsAndObservations() {
  const [materials, setMaterials] = useState('');
  const [observations, setObservations] = useState('');
  const [receivedBy, setReceivedBy] = useState('');

  const { currentReport } = useAppSelector((state) => state.report);
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (currentReport) {
      setMaterials(currentReport.materialsDelivered || '');
      setObservations(currentReport.observations || '');
      setReceivedBy(currentReport.receivedBy || '');
    }
  }, [currentReport]);

  const updateField = (field: string, value: string) => {
    switch (field) {
      case 'materials':
        setMaterials(value);
        dispatch(updateCurrentReport({ materialsDelivered: value }));
        break;
      case 'observations':
        setObservations(value);
        dispatch(updateCurrentReport({ observations: value }));
        break;
      case 'receivedBy':
        setReceivedBy(value);
        dispatch(updateCurrentReport({ receivedBy: value }));
        break;
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Materiales y Observaciones</Text>
      <Text style={styles.subtitle}>
        Registra los materiales entregados y observaciones adicionales
      </Text>

      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Materiales Entregados</Text>
        <TextInput
          style={styles.textArea}
          value={materials}
          onChangeText={(value) => updateField('materials', value)}
          placeholder="Describe los materiales entregados al cliente..."
          placeholderTextColor="#999"
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
      </View>

      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Observaciones</Text>
        <TextInput
          style={styles.textArea}
          value={observations}
          onChangeText={(value) => updateField('observations', value)}
          placeholder="Notas adicionales sobre el mantenimiento realizado..."
          placeholderTextColor="#999"
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
      </View>

      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Recibido Por</Text>
        <TextInput
          style={styles.input}
          value={receivedBy}
          onChangeText={(value) => updateField('receivedBy', value)}
          placeholder="Nombre de quien recibe el servicio"
          placeholderTextColor="#999"
        />
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>ℹ️ Información</Text>
        <Text style={styles.infoText}>
          • Los materiales entregados serán facturados por separado
        </Text>
        <Text style={styles.infoText}>
          • Las observaciones ayudan a mantener un historial detallado
        </Text>
        <Text style={styles.infoText}>
          • El campo "Recibido por" es requerido para finalizar el reporte
        </Text>
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
  fieldContainer: {
    marginBottom: 25,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  textArea: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    minHeight: 100,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  infoBox: {
    backgroundColor: '#fff3e0',
    padding: 20,
    borderRadius: 10,
    marginTop: 20,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#f57c00',
  },
  infoText: {
    fontSize: 14,
    color: '#f57c00',
    marginBottom: 5,
  },
});