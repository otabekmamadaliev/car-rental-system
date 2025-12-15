import React, { useState, useEffect, useRef } from 'react';
import { Box, Button, Text } from 'native-base';
import { Camera } from 'expo-camera';
import { View } from 'react-native';

export default function CameraScreen() {
  const [hasPermission, setHasPermission] = useState(null);
  const [type] = useState(Camera.Constants.Type.back);
  const cameraRef = useRef(null);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  async function takePhoto() {
    if (cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync();
      console.log('Photo taken', photo.uri);
      alert('Photo taken: ' + photo.uri);
    }
  }

  if (hasPermission === null) return <Box p={4}><Text>Requesting camera permission...</Text></Box>;
  if (hasPermission === false) return <Box p={4}><Text>No camera access</Text></Box>;

  return (
    <View style={{ flex: 1 }}>
      <Camera style={{ flex: 1 }} type={type} ref={cameraRef} />
      <Box position="absolute" bottom={10} left={0} right={0} alignItems="center">
        <Button onPress={takePhoto}>Take Photo</Button>
      </Box>
    </View>
  );
}
