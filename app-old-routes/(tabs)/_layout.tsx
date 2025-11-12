import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';

const Tab = createBottomTabNavigator();

export default function TabLayout() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#2196F3',
        headerShown: false,
      }}>
      <Tab.Screen
        name="index"
        component={() => null}
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 24 }}>🏠</Text>,
        }}
      />
      <Tab.Screen
        name="explore"
        component={() => null}
        options={{
          title: 'Explorar',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 24 }}>🔍</Text>,
        }}
      />
    </Tab.Navigator>
  );
}
