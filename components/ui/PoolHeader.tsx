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
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary.blue} />
      <View style={[styles.header, { paddingTop: Math.max(insets.top + 5, 50) }]}>
        <View style={styles.headerContent}>
          {showBack ? (
            <TouchableOpacity style={styles.backButton} onPress={onBack}>
              <Ionicons name="arrow-back" size={24} color={Colors.neutral.white} />
            </TouchableOpacity>
          ) : (
            <View style={styles.logoContainer}>
              <Image 
                source={require('../../assets/images/AQPL.png')} 
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
              <Ionicons name="log-out-outline" size={22} color={Colors.neutral.white} />
            </TouchableOpacity>
          ) : rightButton ? (
            <TouchableOpacity style={styles.logoutButton} onPress={rightButton.onPress}>
              <Ionicons name={rightButton.icon} size={22} color={Colors.neutral.white} />
            </TouchableOpacity>
          ) : (
            <View style={styles.spacer} />
          )}
        </View>

        {/* Onda decorativa más sutil */}
        <View style={styles.waveContainer}>
          <View style={styles.wave} />
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    position: 'relative',
    paddingBottom: 15,
    backgroundColor: Colors.primary.blue,
    overflow: 'hidden',
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
    height: 60,
    width: 180,
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.neutral.white,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginTop: 2,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  spacer: {
    width: 36,
  },
  waveContainer: {
    position: 'absolute',
    bottom: -5,
    left: 0,
    right: 0,
    height: 15,
    zIndex: 1,
  },
  wave: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderTopLeftRadius: 50,
    borderTopRightRadius: 50,
  },
});