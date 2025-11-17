import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ApiService from '../services/api';
import { 
  CLOUDFLARE_TUNNEL_URL, 
  USE_CLOUDFLARE_TUNNEL 
} from '@env';

interface ServerConfigProps {
  visible: boolean;
  onClose: () => void;
}

const ServerConfig: React.FC<ServerConfigProps> = ({ visible, onClose }) => {
  const [cloudflareUrl, setCloudflareUrl] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('');

  useEffect(() => {
    loadSavedConfig();
  }, []);

  const loadSavedConfig = async () => {
    try {
      const savedCloudflareUrl = await AsyncStorage.getItem('cloudflare_url');
      
      setCloudflareUrl(savedCloudflareUrl || CLOUDFLARE_TUNNEL_URL || '');
    } catch (error) {
      console.error('Error cargando configuración:', error);
      setCloudflareUrl(CLOUDFLARE_TUNNEL_URL || '');
    }
  };

  const saveConfig = async () => {
    try {
      await AsyncStorage.setItem('cloudflare_url', cloudflareUrl);
      
      Alert.alert(
        'Configuración Guardada',
        'La configuración del tunnel ha sido guardada. Reinicia la app para aplicar los cambios.',
        [{ text: 'OK', onPress: onClose }]
      );
    } catch (error) {
      Alert.alert('Error', 'No se pudo guardar la configuración');
    }
  };

  const testConnection = async () => {
    if (!cloudflareUrl.trim()) {
      Alert.alert('Error', 'Por favor configura la URL del Cloudflare Tunnel');
      return;
    }

    const testUrl = `${cloudflareUrl}/api/health`;
    setIsConnecting(true);
    setConnectionStatus('Probando conexión...');

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(testUrl, { 
        method: 'GET',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        setConnectionStatus('✅ Conexión exitosa (Cloudflare Tunnel)');
        Alert.alert(
          'Conexión Exitosa',
          'El servidor está disponible a través de Cloudflare Tunnel',
          [
            { text: 'Guardar y Usar', onPress: saveConfig },
            { text: 'Solo Probar', style: 'cancel' }
          ]
        );
      } else {
        setConnectionStatus('❌ Servidor no disponible');
        Alert.alert('Error', 'El servidor no está disponible');
      }
    } catch (error) {
      setConnectionStatus('❌ Error de conexión');
      Alert.alert(
        'Error de Conexión', 
        'No se pudo conectar al Cloudflare Tunnel. Verifica que esté activo y la URL sea correcta.'
      );
    } finally {
      setIsConnecting(false);
    }
  };

  const getCurrentConfig = () => {
    return {
      currentUrl: ApiService.apiUrl,
      cloudflareUrl: cloudflareUrl || 'No configurada'
    };
  };

  if (!visible) return null;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Configuración del Servidor</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>URL de Cloudflare Tunnel:</Text>
        <TextInput
          style={styles.input}
          value={cloudflareUrl}
          onChangeText={setCloudflareUrl}
          placeholder="https://neutral-workers-appraisal-selective.trycloudflare.com"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <TouchableOpacity 
          style={[styles.button, isConnecting && styles.buttonDisabled]} 
          onPress={testConnection}
          disabled={isConnecting}
        >
          <Text style={styles.buttonText}>
            {isConnecting ? 'Probando...' : 'Probar Conexión'}
          </Text>
        </TouchableOpacity>

        {connectionStatus ? (
          <Text style={styles.status}>{connectionStatus}</Text>
        ) : null}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Configuración Actual:</Text>
        <Text style={styles.configText}>URL Activa: {getCurrentConfig().currentUrl}</Text>
        <Text style={styles.configText}>Cloudflare URL: {getCurrentConfig().cloudflareUrl}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Instrucciones:</Text>
        <Text style={styles.instructionText}>
          🌐 CLOUDFLARE TUNNEL:{'\n'}
          1. Asegúrate que tu tunnel esté activo{'\n'}
          2. Verifica la URL del tunnel{'\n'}
          3. Prueba la conexión{'\n'}
          4. Guarda si funciona correctamente
        </Text>
      </View>

      <TouchableOpacity style={styles.saveButton} onPress={saveConfig}>
        <Text style={styles.saveButtonText}>Guardar Configuración</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  closeButton: {
    padding: 10,
  },
  closeText: {
    fontSize: 24,
    color: '#666',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 15,
    backgroundColor: '#f9f9f9',
  },
  button: {
    backgroundColor: '#2196F3',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  status: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 10,
  },
  configText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
    fontFamily: 'monospace',
  },
  instructionText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
    paddingVertical: 10,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  switch: {
    backgroundColor: '#ddd',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 60,
    alignItems: 'center',
  },
  switchActive: {
    backgroundColor: '#4CAF50',
  },
  switchText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  switchTextActive: {
    color: '#fff',
  },
});

export default ServerConfig;