import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Dimensions,
} from 'react-native';
import SignatureCanvas from 'react-native-signature-canvas';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { updateCurrentReport } from '../../store/reportSlice';

const { width } = Dimensions.get('window');

export default function StepSignature() {
  const [signature, setSignature] = useState<string | null>(null);
  const { currentReport } = useAppSelector((state) => state.report);
  const dispatch = useAppDispatch();
  const signatureRef = useRef<any>(null);

  const handleSignature = (sig: string) => {
    setSignature(sig);
    dispatch(updateCurrentReport({ signature: sig }));
  };

  const handleClear = () => {
    signatureRef.current?.clearSignature();
    setSignature(null);
    dispatch(updateCurrentReport({ signature: '' }));
  };

  const handleConfirm = () => {
    if (!signature) {
      Alert.alert('Error', 'Por favor firma antes de continuar');
      return;
    }
    
    Alert.alert(
      'Confirmar Firma',
      '¿Estás seguro de que deseas confirmar esta firma?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Confirmar', onPress: () => {} }
      ]
    );
  };

  const style = `
    .m-signature-pad {
      position: relative;
      font-size: 10px;
      width: 100%;
      height: 300px;
      border: 1px solid #e8e8e8;
      background-color: white;
      border-radius: 8px;
    }
    .m-signature-pad--body {
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
      height: 100%;
    }
    .m-signature-pad--body canvas {
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
      height: 100%;
      border-radius: 8px;
    }
  `;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Firma de Conformidad</Text>
      <Text style={styles.subtitle}>
        El cliente debe firmar para confirmar que está conforme con el servicio realizado
      </Text>

      <View style={styles.reportSummary}>
        <Text style={styles.summaryTitle}>Resumen del Servicio</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Cliente:</Text>
          <Text style={styles.summaryValue}>{currentReport?.clientName || 'N/A'}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Ubicación:</Text>
          <Text style={styles.summaryValue}>{currentReport?.location || 'N/A'}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Técnico:</Text>
          <Text style={styles.summaryValue}>{currentReport?.technician || 'N/A'}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Recibido por:</Text>
          <Text style={styles.summaryValue}>{currentReport?.receivedBy || 'N/A'}</Text>
        </View>
      </View>

      <View style={styles.signatureContainer}>
        <Text style={styles.signatureLabel}>Firma del Cliente:</Text>
        <View style={styles.signatureBox}>
          <SignatureCanvas
            ref={signatureRef}
            onOK={handleSignature}
            onEmpty={() => setSignature(null)}
            webStyle={style}
            autoClear={false}
            imageType="image/png"
          />
        </View>
        
        <View style={styles.signatureActions}>
          <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
            <Text style={styles.clearButtonText}>Limpiar</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.confirmButton, !signature && styles.confirmButtonDisabled]} 
            onPress={handleConfirm}
            disabled={!signature}
          >
            <Text style={styles.confirmButtonText}>Confirmar</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.disclaimer}>
        <Text style={styles.disclaimerText}>
          Al firmar, confirmo que el servicio se ha realizado satisfactoriamente y 
          estoy conforme con el trabajo realizado.
        </Text>
      </View>
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
    marginBottom: 10,
    color: '#333',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  reportSummary: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#2196F3',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'right',
  },
  signatureContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  signatureLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  signatureBox: {
    height: 200,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 15,
  },
  signatureActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  clearButton: {
    backgroundColor: '#f44336',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    flex: 1,
    marginRight: 10,
    alignItems: 'center',
  },
  clearButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  confirmButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    flex: 1,
    marginLeft: 10,
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    backgroundColor: '#ccc',
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  disclaimer: {
    backgroundColor: '#fff3e0',
    padding: 15,
    borderRadius: 8,
  },
  disclaimerText: {
    fontSize: 12,
    color: '#f57c00',
    textAlign: 'center',
    lineHeight: 16,
  },
});