import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { startNewReport, updateCurrentReport, finishReport, setLoading, setError } from '../store/reportSlice';
import ApiService from '../services/api';
import PoolHeader from '../components/ui/PoolHeader';
import Colors from '../constants/colors';

type NavigationProp = StackNavigationProp<any>;

import StepBasicInfo from '../components/report-steps/StepBasicInfo';
import StepPhotoBefore from '../components/report-steps/StepPhotoBefore';
import StepParametersBefore from '../components/report-steps/StepParametersBefore';
import StepParametersAfter from '../components/report-steps/StepParametersAfter';
import StepChemicals from '../components/report-steps/StepChemicals';
import StepEquipment from '../components/report-steps/StepEquipment';
import StepMaterialsAndObservations from '../components/report-steps/StepMaterialsAndObservations';
import StepPhotoAfter from '../components/report-steps/StepPhotoAfter';
import StepSignature from '../components/report-steps/StepSignature';

type NewReportScreenProps = {
  navigation: any;
};

const STEPS = [
  'Información Básica',
  'Foto Inicial',
  'Parámetros Antes',
  'Parámetros Después',
  'Químicos',
  'Equipos',
  'Materiales y Observaciones',
  'Foto Final',
  'Firma',
];

export default function NewReportScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [currentStep, setCurrentStep] = useState(0);
  const { currentReport } = useAppSelector((state) => state.report);
  const { user, token } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleFinishReport();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFinishReport = async () => {
    if (!currentReport) {
      Alert.alert('Error', 'No hay datos del reporte para guardar');
      return;
    }

    Alert.alert(
      'Finalizar Reporte',
      '¿Estás seguro que deseas finalizar este reporte? Se guardará en la base de datos.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Finalizar',
          onPress: async () => {
            try {
              dispatch(setLoading(true));
              dispatch(setError(null));

              const reportToSend = {
                ...currentReport,
                userId: user?.id || 'unknown',
                exitTime: new Date().toISOString(),
                parametersBefore: currentReport.parametersBefore || {
                  cl: 0, ph: 0, alk: 0, stabilizer: 0, hardness: 0, salt: 0, temperature: 0
                },
                parametersAfter: currentReport.parametersAfter || {
                  cl: 0, ph: 0, alk: 0, stabilizer: 0, hardness: 0, salt: 0, temperature: 0
                },
                chemicals: currentReport.chemicals || {
                  tricloro: 0, tabletas: 0, acido: 0, soda: 0, bicarbonato: 0, 
                  sal: 0, alguicida: 0, clarificador: 0, cloro_liquido: 0
                },
                equipmentCheck: currentReport.equipmentCheck || {
                  bomba_filtro: false, bomba_reposadero: false, bomba_espejo: false,
                  bomba_jets: false, blower: false, luces_piscina: false, luces_spa: false,
                  luces_espejo: false, filtro_piscina: false, filtro_spa: false,
                  filtro_espejo: false, clorinador_piscina: false, clorinador_spa: false,
                  clorinador_espejo: false
                },
                beforePhoto: currentReport.beforePhoto || '',
                materialsDelivered: currentReport.materialsDelivered || '',
                observations: currentReport.observations || '',
                receivedBy: currentReport.receivedBy || '',
                technician: currentReport.technician || user?.name || 'Técnico',
              };

              const savedReport = await ApiService.createReport(
                reportToSend as any,
                token || ''
              );
              
              dispatch(finishReport());
              dispatch(setLoading(false));
              
              // Mostrar alerta de éxito temporal
              Alert.alert(
                '✅ Reporte Guardado',
                'El reporte se guardó exitosamente en la base de datos',
                [
                  {
                    text: 'OK',
                    onPress: () => {
                      // Navegar a la vista previa con los datos del reporte
                      navigation.navigate('ReportPreview', {
                        reportData: reportToSend
                      });
                    }
                  }
                ]
              );
              
            } catch (error: any) {
              console.error('Error al guardar reporte:', error);
              dispatch(setError(error.message || 'Error al guardar reporte'));
              dispatch(setLoading(false));
              
              Alert.alert(
                'Error', 
                `No se pudo guardar el reporte: ${error.message}. ¿Deseas intentar nuevamente?`,
                [
                  { text: 'Cancelar', style: 'cancel' },
                  { text: 'Reintentar', onPress: () => handleFinishReport() }
                ]
              );
            } finally {
              dispatch(setLoading(false));
            }
          },
        },
      ]
    );
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <StepBasicInfo />;
      case 1:
        return <StepPhotoBefore />;
      case 2:
        return <StepParametersBefore />;
      case 3:
        return <StepParametersAfter />;
      case 4:
        return <StepChemicals />;
      case 5:
        return <StepEquipment />;
      case 6:
        return <StepMaterialsAndObservations />;
      case 7:
        return <StepPhotoAfter />;
      case 8:
        return <StepSignature />;
      default:
        return <StepBasicInfo />;
    }
  };

  return (
    <View style={styles.container}>
      <PoolHeader 
        title="Nuevo Reporte"
        subtitle={`Paso ${currentStep + 1} de ${STEPS.length}: ${STEPS[currentStep]}`}
        showBack={true}
        onBack={() => navigation.goBack()}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${((currentStep + 1) / STEPS.length) * 100}%` },
              ]}
            />
          </View>
        </View>

        {renderStep()}
      </ScrollView>

      <View style={styles.navigationButtons}>
        {currentStep > 0 && (
          <TouchableOpacity style={styles.previousButton} onPress={handlePrevious}>
            <Text style={styles.previousButtonText}>Anterior</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.nextButton, currentStep === 0 && styles.nextButtonFull]}
          onPress={handleNext}
        >
          <Text style={styles.nextButtonText}>
            {currentStep === STEPS.length - 1 ? 'Finalizar' : 'Siguiente'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
  },
  progressContainer: {
    backgroundColor: 'white',
    padding: 15,
    marginHorizontal: 15,
    marginTop: 15,
    marginBottom: 10,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2196F3',
    borderRadius: 3,
  },
  navigationButtons: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  previousButton: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 10,
  },
  previousButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  nextButton: {
    flex: 1,
    backgroundColor: '#2196F3',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  nextButtonFull: {
    marginLeft: 0,
  },
  nextButtonText: {
    fontSize: 16,
    color: 'white',
    fontWeight: 'bold',
  },
});