import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar, Image, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/colors';

interface PoolHeaderProps {
  title: string;
  subtitle?: string;
  showLogout?: boolean;
  onLogout?: () => void;
  showBack?: boolean;
  onBack?: () => void;
  rightButton?: {
    icon: keyof typeof Ionicons.glyphMap;
    onPress: () => void;
  };
}

export default function PoolHeader({ 
  title, 
  subtitle, 
  showLogout = false, 
  onLogout,
  showBack = false,
  onBack,
  rightButton
}: PoolHeaderProps) {
  const insets = useSafeAreaInsets();
  
  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.neutral.white} />
      <View style={[styles.header, { paddingTop: Math.max(insets.top + 10, 50) }]}>
        <View style={styles.headerContent}>
          {showBack ? (
            <TouchableOpacity style={styles.backButton} onPress={onBack}>
              <Ionicons name="arrow-back" size={24} color={Colors.neutral.darkGray} />
            </TouchableOpacity>
          ) : (
            <View style={styles.logoContainer}>
              <Image 
                source={require('../../assets/images/AQPLogoBlack.png')} 
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
          )}

          <View style={styles.titleContainer}>
            <Text style={styles.title}>{title}</Text>
            {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
          </View>

          {showLogout ? (
            <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
              <Ionicons name="log-out-outline" size={22} color={Colors.primary.blue} />
            </TouchableOpacity>
          ) : rightButton ? (
            <TouchableOpacity style={styles.logoutButton} onPress={rightButton.onPress}>
              <Ionicons name={rightButton.icon} size={22} color={Colors.primary.blue} />
            </TouchableOpacity>
          ) : (
            <View style={styles.spacer} />
          )}
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    position: 'relative',
    paddingBottom: 20,
    backgroundColor: Colors.neutral.white,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 2,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    height: 50,
    width: 140,
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.neutral.darkGray,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    marginTop: 2,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EBF5FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  spacer: {
    width: 40,
  },
});