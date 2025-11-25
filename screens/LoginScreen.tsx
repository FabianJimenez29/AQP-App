import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
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
import { showError, ErrorMessages } from '../components/ui/CustomAlert';

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

  useEffect(() => {
    checkServerConnection();
  }, []);

  const checkServerConnection = async () => {
    setConnectionStatus('checking');
    try {
      const health = await ApiService.checkServerHealth();
      if (health.success) {
        setConnectionStatus('connected');
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
      showError(ErrorMessages.AUTH_FIELDS_REQUIRED);
      return;
    }

    setIsLoading(true);
    dispatch(loginStart());

    try {
      const response = await ApiService.login({ email, password });
      
      if (!response || !response.user || !response.token) {
        throw new Error('Respuesta del servidor inválida');
      }

      dispatch(loginSuccess(response));
      
      // Redirigir según el rol del usuario
      if (response.user.role === 'admin') {
        navigation.replace('AdminDashboard');
      } else {
        navigation.replace('Dashboard');
      }
      
    } catch (error: any) {
      dispatch(loginFailure());
      
      let errorMessage = ErrorMessages.AUTH_INVALID_CREDENTIALS;

      if (error.message) {
        if (error.message.includes('HTTP error! status:')) {
          const statusCode = error.message.match(/status: (\d+)/)?.[1];
          
          switch (statusCode) {
            case '401':
              errorMessage = '❌ Credenciales incorrectas.\n\nVerifica tu email y contraseña e intenta nuevamente.';
              break;
            case '403':
              errorMessage = '❌ Acceso Denegado\n\nTu cuenta no tiene permisos para acceder al sistema.';
              break;
            case '404':
              errorMessage = ErrorMessages.SERVER_ERROR + '\n\nNo se pudo conectar al servidor. Verifica que el backend esté ejecutándose.';
              break;
            case '500':
            case '503':
              errorMessage = ErrorMessages.SERVER_ERROR;
              break;
            default:
              errorMessage = `❌ Error del servidor (${statusCode}).\n\nContacta al administrador del sistema.`;
          }
        } else if (error.message.includes('Failed to fetch') || error.message.includes('Network request failed')) {
          errorMessage = ErrorMessages.NETWORK_ERROR;
        } else if (error.message.includes('Invalid credentials')) {
          errorMessage = ErrorMessages.AUTH_INVALID_CREDENTIALS;
        } else if (error.message.includes('Respuesta del servidor inválida')) {
          errorMessage = ErrorMessages.SERVER_ERROR + '\n\nEl servidor devolvió una respuesta inválida.';
        } else {
          errorMessage = `❌ ${error.message}`;
        }
      }

      showError(errorMessage);
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
        <View style={styles.header}>
          <View style={styles.logoBackgroundContainer}>
            <Image 
              source={require('../assets/images/AQPLogoBlack.png')} 
              style={styles.logoImage}
              resizeMode="contain"
            />
            
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

        <View style={styles.formContainer}>
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
        </View>
        
        <View style={styles.footer}>
          <Text style={styles.footerText}>AQUAPOOL © 2025</Text>
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