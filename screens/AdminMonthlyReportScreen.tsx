import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import ApiService from '../services/api';
import { showError, showConfirm, ErrorMessages } from '../components/ui/CustomAlert';

export default function AdminMonthlyReportScreen() {
  const navigation = useNavigation();
  const token = useSelector((state: RootState) => state.auth.token);

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [generating, setGenerating] = useState(false);

  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  const handleGenerateReport = async () => {
    setGenerating(true);
    try {
      const response = await ApiService.get<{ pdfUrl: string }>(
        `/reports/monthly/${selectedYear}/${selectedMonth + 1}`,
        token!
      );

      if (response.pdfUrl) {
        showConfirm(
          '✅ Reporte Generado\n\n¿Deseas abrir el reporte ahora?',
          async () => {
            const supported = await Linking.canOpenURL(response.pdfUrl);
            if (supported) {
              await Linking.openURL(response.pdfUrl);
            } else {
              showError(ErrorMessages.PDF_DOWNLOAD_FAILED);
            }
          }
        );
      }
    } catch (error: any) {
      showError(ErrorMessages.PDF_DOWNLOAD_FAILED);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Reporte Mensual</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.card}>
          <View style={styles.iconContainer}>
            <Ionicons name="calendar" size={48} color="#EF4444" />
          </View>
          
          <Text style={styles.title}>Generar Reporte Mensual</Text>
          <Text style={styles.description}>
            Selecciona el mes y año para generar un reporte consolidado de todas las
            actividades, reportes y órdenes del período.
          </Text>

          {/* Month Selector */}
          <View style={styles.selectorSection}>
            <Text style={styles.selectorLabel}>Mes</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.monthSelector}
            >
              {months.map((month, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.monthButton,
                    selectedMonth === index && styles.monthButtonActive,
                  ]}
                  onPress={() => setSelectedMonth(index)}
                >
                  <Text
                    style={[
                      styles.monthButtonText,
                      selectedMonth === index && styles.monthButtonTextActive,
                    ]}
                  >
                    {month}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Year Selector */}
          <View style={styles.selectorSection}>
            <Text style={styles.selectorLabel}>Año</Text>
            <View style={styles.yearSelector}>
              {years.map((year) => (
                <TouchableOpacity
                  key={year}
                  style={[
                    styles.yearButton,
                    selectedYear === year && styles.yearButtonActive,
                  ]}
                  onPress={() => setSelectedYear(year)}
                >
                  <Text
                    style={[
                      styles.yearButtonText,
                      selectedYear === year && styles.yearButtonTextActive,
                    ]}
                  >
                    {year}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Selected Period */}
          <View style={styles.selectedPeriod}>
            <Ionicons name="calendar-outline" size={20} color="#0284C7" />
            <Text style={styles.selectedPeriodText}>
              {months[selectedMonth]} {selectedYear}
            </Text>
          </View>

          {/* Generate Button */}
          <TouchableOpacity
            style={[styles.generateButton, generating && styles.generateButtonDisabled]}
            onPress={handleGenerateReport}
            disabled={generating}
          >
            {generating ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="document-text" size={20} color="#FFFFFF" />
                <Text style={styles.generateButtonText}>Generar Reporte PDF</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Info Box */}
          <View style={styles.infoBox}>
            <Ionicons name="information-circle" size={20} color="#0284C7" />
            <Text style={styles.infoText}>
              El reporte incluirá todos los datos del mes seleccionado: reportes de
              servicio, órdenes de productos, estadísticas de técnicos y resumen
              financiero.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 32,
  },
  selectorSection: {
    marginBottom: 24,
  },
  selectorLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 12,
  },
  monthSelector: {
    gap: 8,
    paddingBottom: 4,
  },
  monthButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  monthButtonActive: {
    borderColor: '#EF4444',
    backgroundColor: '#FEE2E2',
  },
  monthButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  monthButtonTextActive: {
    color: '#EF4444',
  },
  yearSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  yearButton: {
    flex: 1,
    minWidth: '30%',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
  },
  yearButtonActive: {
    borderColor: '#EF4444',
    backgroundColor: '#FEE2E2',
  },
  yearButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
  },
  yearButtonTextActive: {
    color: '#EF4444',
  },
  selectedPeriod: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    marginBottom: 24,
  },
  selectedPeriodText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0284C7',
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#EF4444',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  generateButtonDisabled: {
    opacity: 0.5,
  },
  generateButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  infoBox: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#1E40AF',
    lineHeight: 18,
  },
});
