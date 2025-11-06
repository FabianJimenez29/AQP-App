import { useEffect } from 'react';
import { router } from 'expo-router';
import { View, Text } from 'react-native';
import { useAppSelector } from '../store/hooks';

export default function IndexScreen() {
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  useEffect(() => {
    // Pequeño delay para asegurar que el layout esté montado
    const timer = setTimeout(() => {
      if (isAuthenticated) {
        router.replace('dashboard' as any);
      } else {
        router.replace('login' as any);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [isAuthenticated]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#2196F3' }}>
      <Text style={{ color: 'white', fontSize: 32, fontWeight: 'bold', marginBottom: 10 }}>AQUAPOOL</Text>
      <Text style={{ color: 'white', fontSize: 16 }}>Cargando...</Text>
    </View>
  );
}