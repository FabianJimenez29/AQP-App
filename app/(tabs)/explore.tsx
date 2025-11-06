import { ScrollView, StyleSheet, View, Text } from 'react-native';

export default function TabTwoScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Explorar</Text>
        <Text style={styles.description}>
          Aquí puedes encontrar información adicional sobre AquaPool.
        </Text>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Características</Text>
          <Text style={styles.sectionText}>• Sistema de reportes completo</Text>
          <Text style={styles.sectionText}>• Gestión de parámetros de agua</Text>
          <Text style={styles.sectionText}>• Control de químicos utilizados</Text>
          <Text style={styles.sectionText}>• Revisión de equipos</Text>
          <Text style={styles.sectionText}>• Firma digital</Text>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Soporte</Text>
          <Text style={styles.sectionText}>
            Para soporte técnico, contacta con el administrador del sistema.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#2196F3',
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  section: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  sectionText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
    lineHeight: 24,
  },
});
