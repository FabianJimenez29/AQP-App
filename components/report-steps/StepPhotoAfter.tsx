import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { updateCurrentReport } from '../../store/reportSlice';

export default function StepPhotoAfter() {
  const [photo, setPhoto] = useState<string | null>(null);
  const { currentReport } = useAppSelector((state) => state.report);
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (currentReport?.afterPhoto) {
      setPhoto(currentReport.afterPhoto);
    }
  }, [currentReport]);

  const takePhoto = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const photoUri = result.assets[0].uri;
        setPhoto(photoUri);
        dispatch(updateCurrentReport({ afterPhoto: photoUri }));
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo tomar la foto');
    }
  };



  const retakePhoto = () => {
    setPhoto(null);
    dispatch(updateCurrentReport({ afterPhoto: '' }));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Foto Después del Mantenimiento</Text>
      <Text style={styles.subtitle}>
        Toma una foto del estado final de la piscina después del mantenimiento
      </Text>

      {/* Mostrar foto antes */}
      {currentReport?.beforePhoto && (
        <View style={styles.beforePhotoContainer}>
          <Text style={styles.beforePhotoTitle}>Foto Antes:</Text>
          <Image source={{ uri: currentReport.beforePhoto }} style={styles.beforePhoto} />
        </View>
      )}

      {photo ? (
        <View style={styles.photoContainer}>
          <Text style={styles.afterPhotoTitle}>Foto Después:</Text>
          <Image source={{ uri: photo }} style={styles.photo} />
          <View style={styles.photoActions}>
            <TouchableOpacity style={styles.retakeButton} onPress={retakePhoto}>
              <Text style={styles.retakeButtonText}>Tomar Otra Foto</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.cameraContainer}>
          <View style={styles.placeholderCamera}>
            <Text style={styles.placeholderText}>📷</Text>
            <Text style={styles.placeholderSubtext}>Presiona para tomar foto final</Text>
          </View>
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.cameraButton} onPress={takePhoto}>
              <Text style={styles.cameraButtonText}>Tomar Foto</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  beforePhotoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  beforePhotoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#666',
  },
  beforePhoto: {
    width: 200,
    height: 150,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#ddd',
  },
  afterPhotoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#4CAF50',
    textAlign: 'center',
  },
  cameraContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderCamera: {
    width: 300,
    height: 225,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    borderWidth: 2,
    borderColor: '#4CAF50',
    borderStyle: 'dashed',
  },
  placeholderText: {
    fontSize: 48,
    marginBottom: 10,
  },
  placeholderSubtext: {
    fontSize: 16,
    color: '#666',
  },
  buttonContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  cameraButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    minWidth: 120,
    alignItems: 'center',
  },
  cameraButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  galleryButton: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    minWidth: 120,
    alignItems: 'center',
  },
  galleryButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
  photoContainer: {
    flex: 1,
    alignItems: 'center',
  },
  photo: {
    width: 300,
    height: 225,
    borderRadius: 10,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  photoActions: {
    flexDirection: 'row',
  },
  retakeButton: {
    backgroundColor: '#FF9800',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  retakeButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
});