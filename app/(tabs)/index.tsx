import { useEffect } from 'react';
import { router } from 'expo-router';
import { View, Text } from 'react-native';
import { useAppSelector } from '../../store/hooks';

export default function HomeScreen() {
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('dashboard' as any);
    } else {
      router.replace('login' as any);
    }
  }, [isAuthenticated]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Cargando...</Text>
    </View>
  );
}
