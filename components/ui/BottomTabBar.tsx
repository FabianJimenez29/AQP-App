import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import Colors from '../../constants/colors';

type NavigationProp = StackNavigationProp<any>;

interface TabItem {
  key: string;
  label: string;
  icon: string;
  iconFamily: 'Ionicons' | 'MaterialIcons';
  route: string;
}

interface BottomTabBarProps {
  activeTab?: 'home' | 'new-report' | 'products' | 'profile';
}

const tabs: TabItem[] = [
  {
    key: 'home',
    label: 'Inicio',
    icon: 'home-outline',
    iconFamily: 'Ionicons',
    route: 'Dashboard'
  },
  {
    key: 'new-report',
    label: 'Nuevo Reporte',
    icon: 'document-text-outline',
    iconFamily: 'Ionicons',
    route: 'UnifiedNewReport'
  },
  {
    key: 'products',
    label: 'Productos',
    icon: 'inventory',
    iconFamily: 'MaterialIcons',
    route: 'Products'
  },
  {
    key: 'profile',
    label: 'Perfil',
    icon: 'person-outline',
    iconFamily: 'Ionicons',
    route: 'Profile'
  }
];

export default function BottomTabBar({ activeTab = 'home' }: BottomTabBarProps) {
  const navigation = useNavigation<NavigationProp>();
  
  const renderIcon = (tab: TabItem, isActive: boolean) => {
    const iconColor = isActive ? Colors.primary.blue : Colors.neutral.gray;
    const iconSize = 22;

    if (tab.iconFamily === 'MaterialIcons') {
      return <MaterialIcons name={tab.icon as any} size={iconSize} color={iconColor} />;
    }
    return <Ionicons name={tab.icon as any} size={iconSize} color={iconColor} />;
  };

  const handleTabPress = (tab: TabItem) => {
    try {
      navigation.navigate(tab.route);
    } catch (error) {
      console.error('Navigation error:', error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.shadowContainer}>
        <View style={styles.tabBar}>
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            
            return (
              <TouchableOpacity
                key={tab.key}
                style={[
                  styles.tabItem,
                  isActive && styles.activeTab,
                ]}
                onPress={() => handleTabPress(tab)}
                activeOpacity={0.7}
              >
                <View style={[
                  styles.iconContainer,
                  isActive && styles.activeIconContainer,
                ]}>
                  {renderIcon(tab, isActive)}
                </View>
                <Text
                  style={[
                    styles.tabLabel,
                    isActive && styles.activeLabel,
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
  },
  shadowContainer: {
    backgroundColor: Colors.neutral.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 25,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 8,
  },
  activeTab: {
    backgroundColor: Colors.primary.lightBlue + '15',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  iconContainer: {
    marginBottom: 4,
  },
  activeIconContainer: {
    marginBottom: 4,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.neutral.gray,
    textAlign: 'center',
  },
  activeLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.primary.blue,
    textAlign: 'center',
  },
});