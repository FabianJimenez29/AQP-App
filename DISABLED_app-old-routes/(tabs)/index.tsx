import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useAppSelector } from '../../store/hooks';

type NavigationProp = StackNavigationProp<any>;

export default function HomeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (isAuthenticated) {
      navigation.replace('Dashboard');
    } else {
      navigation.replace('Login');
    }
  }, [isAuthenticated]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Cargando...</Text>
    </View>
  );
}
