import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { startNewReport } from '../../store/reportSlice';

export default function StepBasicInfo() {
  const [clientName, setClientName] = useState('');
  const [location, setLocation] = useState('');
  const { user } = useAppSelector((state) => state.auth);
  const { currentReport } = useAppSelector((state) => state.report);
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (currentReport) {
      setClientName(currentReport.clientName || '');
      setLocation(currentReport.location || '');
    }
  }, [currentReport]);

  const handleStartReport = () => {
    if (clientName && location && user) {
      dispatch(startNewReport({
        clientName,
        location,
        technician: user.name,
      }));
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Información del Cliente</Text>
      
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Nombre del Cliente *</Text>
        <TextInput
          style={styles.input}
          value={clientName}
          onChangeText={setClientName}
          placeholder="Ingresa el nombre del cliente"
          placeholderTextColor="#999"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Ubicación *</Text>
        <TextInput
          style={styles.input}
          value={location}
          onChangeText={setLocation}
          placeholder="Ingresa la ubicación"
          placeholderTextColor="#999"
        />
      </View>

      {currentReport && (
        <View style={styles.reportInfo}>
          <Text style={styles.reportInfoTitle}>Información del Reporte</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Número de Reporte:</Text>
            <Text style={styles.infoValue}>{currentReport.reportNumber}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Técnico:</Text>
            <Text style={styles.infoValue}>{currentReport.technician}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Hora de Entrada:</Text>
            <Text style={styles.infoValue}>
              {currentReport.entryTime ? new Date(currentReport.entryTime).toLocaleTimeString() : 'No registrada'}
            </Text>
          </View>
        </View>
      )}

      {!currentReport && clientName && location && (
        <TouchableOpacity style={styles.startButton} onPress={handleStartReport}>
          <Text style={styles.startButtonText}>Iniciar Reporte</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    color: '#333',
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    backgroundColor: 'white',
  },
  reportInfo: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  reportInfoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#2196F3',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: 'bold',
  },
  startButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  startButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});