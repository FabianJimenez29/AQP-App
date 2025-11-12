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
  ScrollView,
  Animated,
} from 'react-native';
import { useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { loginStart, loginSuccess, loginFailure } from '../store/authSlice';
import ApiService from '../services/api';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

type NavigationProp = StackNavigationProp<any>;

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('checking');
  const [serverIP, setServerIP] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
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
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header con gradiente visual */}
        <View style={styles.header}>
          <View style={styles.logoBackgroundContainer}>
            <Image 
              source={require('../assets/images/AQPLogoBlack.png')} 
              style={styles.logoImage}
              resizeMode="contain"
            />
            
            {/* Indicador de conexión integrado */}
            <View style={styles.connectionBadge}>
              <Ionicons 
                name={connectionStatus === 'connected' ? 'checkmark-circle' : connectionStatus === 'checking' ? 'time-outline' : 'alert-circle'} 
                size={16} 
                color={
                  connectionStatus === 'connected' ? '#4caf50' : 
                  connectionStatus === 'checking' ? '#ff9800' : '#f44336'
                }
              />
              <Text style={[styles.connectionBadgeText, {
                color: connectionStatus === 'connected' ? '#4caf50' : 
                       connectionStatus === 'checking' ? '#ff9800' : '#f44336'
              }]}>
                {connectionStatus === 'connected' ? 'Conectado' : 
                 connectionStatus === 'checking' ? 'Verificando...' : 'Sin conexión'}
              </Text>
            </View>
          </View>
          
          <Text style={styles.welcomeText}>Bienvenido</Text>
          <Text style={styles.subtitle}>Inicia sesión para continuar</Text>
        </View>

        {/* Formulario con diseño moderno */}
        <View style={styles.formContainer}>
          {/* Campo de Email */}
          <View style={styles.inputContainer}>
            <View style={styles.inputIconContainer}>
              <MaterialIcons name="email" size={20} color={emailFocused ? '#0066CC' : '#999'} />
            </View>
            <TextInput
              style={[styles.input, emailFocused && styles.inputFocused]}
              placeholder="Correo electrónico"
              value={email}
              onChangeText={setEmail}
              onFocus={() => setEmailFocused(true)}
              onBlur={() => setEmailFocused(false)}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor="#999"
            />
          </View>

          {/* Campo de Password */}
          <View style={styles.inputContainer}>
            <View style={styles.inputIconContainer}>
              <MaterialIcons name="lock" size={20} color={passwordFocused ? '#0066CC' : '#999'} />
            </View>
            <TextInput
              style={[styles.input, passwordFocused && styles.inputFocused]}
              placeholder="Contraseña"
              value={password}
              onChangeText={setPassword}
              onFocus={() => setPasswordFocused(true)}
              onBlur={() => setPasswordFocused(false)}
              secureTextEntry={!showPassword}
              placeholderTextColor="#999"
            />
            <TouchableOpacity 
              style={styles.eyeIcon}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Ionicons 
                name={showPassword ? 'eye-off' : 'eye'} 
                size={20} 
                color="#999" 
              />
            </TouchableOpacity>
          </View>

          {/* Botón de Login con gradiente simulado */}
          <TouchableOpacity
            style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <Ionicons name="reload" size={20} color="white" />
                <Text style={styles.loginButtonText}>Ingresando...</Text>
              </View>
            ) : (
              <View style={styles.buttonContent}>
                <Text style={styles.loginButtonText}>Iniciar Sesión</Text>
                <Ionicons name="arrow-forward" size={20} color="white" />
              </View>
            )}
          </TouchableOpacity>

          {/* Acceso Rápido con diseño mejorado */}
          <View style={styles.quickLoginContainer}>
            <View style={styles.dividerContainer}>
              <View style={styles.divider} />
              <Text style={styles.quickLoginTitle}>Acceso Rápido</Text>
              <View style={styles.divider} />
            </View>
            
            <View style={styles.quickLoginButtons}>
              <TouchableOpacity 
                style={styles.quickLoginButton}
                onPress={() => {
                  setEmail('tech@aquapool.com');
                  setPassword('tech123');
                }}
              >
                <Ionicons name="person" size={18} color="#0066CC" style={styles.quickLoginIcon} />
                <Text style={styles.quickLoginButtonText}>Técnico</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.quickLoginButton, styles.adminButton]}
                onPress={() => {
                  setEmail('admin@aquapool.com');
                  setPassword('admin123');
                }}
              >
                <Ionicons name="shield-checkmark" size={18} color="#FF6B00" style={styles.quickLoginIcon} />
                <Text style={[styles.quickLoginButtonText, styles.adminButtonText]}>Admin</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
        
        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>AQUAPOOL © 2024</Text>
          <Text style={styles.footerSubtext}>Sistema de Gestión de Mantenimiento</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  logoBackgroundContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoImage: {
    width: 300,
    height: 180,
  },
  connectionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  connectionBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  welcomeText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  formContainer: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    padding: 25,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  inputIconContainer: {
    paddingLeft: 15,
    paddingRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 15,
    paddingRight: 15,
    fontSize: 16,
    color: '#1a1a1a',
  },
  inputFocused: {
    borderColor: '#0066CC',
  },
  eyeIcon: {
    paddingHorizontal: 15,
  },
  loginButton: {
    backgroundColor: '#0066CC',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#0066CC',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  loginButtonDisabled: {
    backgroundColor: '#ccc',
    shadowOpacity: 0,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  quickLoginContainer: {
    marginTop: 25,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#e0e0e0',
  },
  quickLoginTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#999',
    paddingHorizontal: 10,
  },
  quickLoginButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  quickLoginButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EBF5FF',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#0066CC',
  },
  adminButton: {
    backgroundColor: '#FFF4E6',
    borderColor: '#FF6B00',
  },
  quickLoginIcon: {
    marginRight: 6,
  },
  quickLoginButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0066CC',
  },
  adminButtonText: {
    color: '#FF6B00',
  },
  footer: {
    alignItems: 'center',
    marginTop: 30,
    paddingBottom: 20,
  },
  footerText: {
    fontSize: 12,
    color: '#999',
    fontWeight: '600',
  },
  footerSubtext: {
    fontSize: 11,
    color: '#bbb',
    marginTop: 4,
  },
});