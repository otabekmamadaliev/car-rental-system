import React, { useRef } from 'react';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';

export default function CameraUpload() {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef(null);

  if (!permission) return <View style={styles.container}><Text>Loading camera...</Text></View>;
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>Camera permission required</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  async function takePhoto() {
    if (cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync();
      alert('Captured: ' + photo.uri);
    }
  }

  return (
    <View style={styles.fullScreen}>
      <CameraView style={styles.camera} ref={cameraRef} />
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={takePhoto}>
          <Text style={styles.buttonText}>Capture Driver License</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fullScreen: { flex: 1 },
  camera: { flex: 1 },
  container: { flex: 1, padding: 20, justifyContent: 'center', alignItems: 'center' },
  permissionText: { fontSize: 16, marginBottom: 15, textAlign: 'center' },
  buttonContainer: { position: 'absolute', bottom: 30, left: 0, right: 0, alignItems: 'center' },
  button: { backgroundColor: '#FF6B35', paddingHorizontal: 30, paddingVertical: 15, borderRadius: 8 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' }
});
