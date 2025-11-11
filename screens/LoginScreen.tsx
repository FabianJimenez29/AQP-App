import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { loginStart, loginSuccess, loginFailure } from '../store/authSlice';
import ApiService from '../services/api';

type NavigationProp = StackNavigationProp<any>;

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('checking');
  const [serverIP, setServerIP] = useState('');
  const dispatch = useDispatch();
  const navigation = useNavigation<NavigationProp>();

  // Verificar conexión al servidor al cargar la pantalla
  useEffect(() => {
    checkServerConnection();
  }, []);

  const checkServerConnection = async () => {
    setConnectionStatus('checking');
    try {
      const health = await ApiService.checkServerHealth();
      if (health.success) {
        setConnectionStatus('connected');
        // Extraer información de la URL del Cloudflare Tunnel
        const currentUrl = ApiService.apiUrl;
        const tunnelMatch = currentUrl.match(/https:\/\/(.*?)\.trycloudflare\.com/);
        setServerIP(tunnelMatch ? `Cloudflare: ${tunnelMatch[1]}` : 'Cloudflare Tunnel');
      } else {
        setConnectionStatus('disconnected');
      }
    } catch (error) {
      setConnectionStatus('disconnected');
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Por favor ingresa email y contraseña');
      return;
    }

    setIsLoading(true);
    dispatch(loginStart());

    try {
      const response = await ApiService.login({ email, password });
      
      // Validar que la respuesta tenga los datos necesarios
      if (!response || !response.user || !response.token) {
        throw new Error('Respuesta del servidor inválida');
      }

      // Si el login es exitoso, continúa al dashboard
      dispatch(loginSuccess(response));
      navigation.replace('Dashboard');
      
    } catch (error: any) {
      dispatch(loginFailure());
      
      // Manejar diferentes tipos de errores
      let errorTitle = 'Error de Autenticación';
      let errorMessage = 'No se pudo iniciar sesión';
      let errorCode = 'UNKNOWN_ERROR';

      if (error.message) {
        if (error.message.includes('HTTP error! status:')) {
          const statusCode = error.message.match(/status: (\d+)/)?.[1];
          errorCode = `HTTP_${statusCode}`;
          
          switch (statusCode) {
            case '401':
              errorMessage = 'Credenciales incorrectas. Verifica tu email y contraseña.';
              break;
            case '403':
              errorMessage = 'Tu cuenta no tiene permisos para acceder al sistema.';
              break;
            case '404':
              errorTitle = 'Servidor No Encontrado';
              errorMessage = 'No se pudo conectar al servidor. Verifica que el backend esté ejecutándose.';
              break;
            case '500':
              errorTitle = 'Error del Servidor';
              errorMessage = 'Error interno del servidor. Inténtalo más tarde.';
              break;
            case '503':
              errorTitle = 'Servicio No Disponible';
              errorMessage = 'El servidor está en mantenimiento. Inténtalo más tarde.';
              break;
            default:
              errorMessage = `Error del servidor (${statusCode}). Contacta al administrador.`;
          }
        } else if (error.message.includes('Failed to fetch') || error.message.includes('Network request failed')) {
          errorTitle = 'Error de Conexión';
          errorMessage = 'No se puede conectar al servidor. Verifica:\n• Que el backend esté ejecutándose\n• Tu conexión a internet\n• La URL del servidor';
          errorCode = 'NETWORK_ERROR';
        } else if (error.message.includes('Invalid credentials')) {
          errorMessage = 'Email o contraseña incorrectos.';
          errorCode = 'INVALID_CREDENTIALS';
        } else if (error.message.includes('Respuesta del servidor inválida')) {
          errorTitle = 'Error del Servidor';
          errorMessage = 'El servidor devolvió una respuesta inválida.';
          errorCode = 'INVALID_RESPONSE';
        } else {
          errorMessage = error.message;
          errorCode = 'CUSTOM_ERROR';
        }
      }

      Alert.alert(
        errorTitle,
        `${errorMessage}\n\nCódigo de Error: ${errorCode}\nURL del Servidor: ${ApiService.apiUrl}`,
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.logoContainer}>
        <Text style={styles.logoText}>AQUAPOOL</Text>
        <Text style={styles.subtitle}>Sistema de Reportes</Text>
      </View>

      {/* Indicador de conexión */}
      <View style={styles.connectionContainer}>
        <View style={[styles.connectionIndicator, 
          connectionStatus === 'connected' ? styles.connected : 
          connectionStatus === 'checking' ? styles.checking : styles.disconnected
        ]}>
          <Text style={styles.connectionText}>
            {connectionStatus === 'connected' && '🟢 Conectado'}
            {connectionStatus === 'checking' && '🟡 Verificando...'}
            {connectionStatus === 'disconnected' && '🔴 Sin conexión'}
          </Text>
          {connectionStatus === 'connected' && (
            <Text style={styles.serverIPText}>Servidor: {serverIP}</Text>
          )}
          {connectionStatus === 'disconnected' && (
            <TouchableOpacity style={styles.reconnectButton} onPress={checkServerConnection}>
              <Text style={styles.reconnectButtonText}>Reconectar</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.formContainer}>
        <View style={styles.demoCredentials}>
          <Text style={styles.demoTitle}>🧪 Credenciales de Prueba</Text>
          <Text style={styles.demoText}>
            <Text style={styles.demoBold}>Técnico:</Text> demo@aquapool.com / demo123
          </Text>
          <Text style={styles.demoText}>
            <Text style={styles.demoBold}>Admin:</Text> admin@aquapool.com / admin123
          </Text>
        </View>

        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholderTextColor="#666"
        />

        <TextInput
          style={styles.input}
          placeholder="Contraseña"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholderTextColor="#666"
        />

        <TouchableOpacity
          style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
          onPress={handleLogin}
          disabled={isLoading}
        >
          <Text style={styles.loginButtonText}>
            {isLoading ? 'Ingresando...' : 'Iniciar Sesión'}
          </Text>
        </TouchableOpacity>

        <View style={styles.quickLoginContainer}>
          <Text style={styles.quickLoginTitle}>Acceso Rápido:</Text>
          <View style={styles.quickLoginButtons}>
            <TouchableOpacity 
              style={styles.quickLoginButton}
              onPress={() => {
                setEmail('tech@aquapool.com');
                setPassword('tech123');
              }}
            >
              <Text style={styles.quickLoginButtonText}>Técnico Demo</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.quickLoginButton, styles.adminButton]}
              onPress={() => {
                setEmail('admin@aquapool.com');
                setPassword('admin123');
              }}
            >
              <Text style={styles.quickLoginButtonText}>Admin Demo</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 50,
  },
  logoText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  formContainer: {
    backgroundColor: 'white',
    padding: 30,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  demoCredentials: {
    backgroundColor: '#e3f2fd',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  demoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1976d2',
    marginBottom: 8,
    textAlign: 'center',
  },
  demoText: {
    fontSize: 12,
    color: '#1976d2',
    marginBottom: 4,
    textAlign: 'center',
  },
  demoBold: {
    fontWeight: 'bold',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  loginButton: {
    backgroundColor: '#2196F3',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  loginButtonDisabled: {
    backgroundColor: '#ccc',
  },
  loginButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  quickLoginContainer: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  quickLoginTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    textAlign: 'center',
    marginBottom: 10,
  },
  quickLoginButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickLoginButton: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 15,
    flex: 1,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  adminButton: {
    backgroundColor: '#fff3e0',
  },
  quickLoginButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  // Estilos para el indicador de conexión
  connectionContainer: {
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  connectionIndicator: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 2,
  },
  connected: {
    backgroundColor: '#e8f5e8',
    borderColor: '#4caf50',
  },
  checking: {
    backgroundColor: '#fff8e1',
    borderColor: '#ff9800',
  },
  disconnected: {
    backgroundColor: '#ffebee',
    borderColor: '#f44336',
  },
  connectionText: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  serverIPText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  reconnectButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 15,
    marginTop: 4,
  },
  reconnectButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
});