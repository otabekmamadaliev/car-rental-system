import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function Sensors() {
  const sensors = [
    {
      id: 1,
      name: 'GPS Location',
      icon: 'location',
      color: '#34C759',
      description: 'Provides geographic positioning for location-based features in the app.',
      usedFor: 'Used for potential car pickup location tracking and distance calculations.',
    },
    {
      id: 2,
      name: 'Camera',
      icon: 'camera',
      color: '#FF6B35',
      description: 'Accesses device camera to capture photos and documents.',
      usedFor: 'Used in Driver License verification to capture and upload license documents for validation.',
    },
    {
      id: 3,
      name: 'Accelerometer',
      icon: 'phone-portrait',
      color: '#00D9FF',
      description: 'Detects device motion and acceleration forces in three axes (X, Y, Z).',
      usedFor: 'Enables shake gesture detection - shake your phone on the Home screen to quickly open Favorites!',
    },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Ionicons name="hardware-chip" size={40} color="#FF6B35" />
          <Text style={styles.headerTitle}>Device Sensors</Text>
          <Text style={styles.headerSubtitle}>Sensors used in this application</Text>
        </View>

        {/* Sensor Cards */}
        {sensors.map((sensor) => (
          <View key={sensor.id} style={styles.sensorCard}>
            <View style={styles.sensorHeader}>
              <View style={[styles.iconContainer, { backgroundColor: sensor.color + '20' }]}>
                <Ionicons name={sensor.icon} size={32} color={sensor.color} />
              </View>
              <Text style={styles.sensorName}>{sensor.name}</Text>
            </View>

            <View style={styles.infoSection}>
              <View style={styles.infoRow}>
                <Ionicons name="information-circle" size={20} color="#666" />
                <Text style={styles.infoLabel}>Description</Text>
              </View>
              <Text style={styles.infoText}>{sensor.description}</Text>
            </View>

            <View style={styles.infoSection}>
              <View style={styles.infoRow}>
                <Ionicons name="bulb" size={20} color={sensor.color} />
                <Text style={styles.infoLabel}>Used For</Text>
              </View>
              <Text style={[styles.infoText, styles.usageText]}>{sensor.usedFor}</Text>
            </View>
          </View>
        ))}

        <View style={{ height: 40 }} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    padding: 20,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 12,
  },
  headerSubtitle: {
    fontSize: 15,
    color: '#666',
    marginTop: 6,
  },
  sensorCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  sensorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sensorName: {
    flex: 1,
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  infoSection: {
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoText: {
    fontSize: 15,
    color: '#555',
    lineHeight: 22,
    paddingLeft: 28,
  },
  usageText: {
    color: '#333',
    fontWeight: '500',
  },
});
