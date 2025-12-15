import React, { useState, useEffect } from 'react';
import { Box, Text, VStack, Button } from 'native-base';
import { Accelerometer } from 'expo-sensors';

export default function SensorScreen() {
  const [data, setData] = useState({ x: 0, y: 0, z: 0 });
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    return () => {
      Accelerometer.removeAllListeners();
    };
  }, []);

  function _subscribe() {
    Accelerometer.setUpdateInterval(300);
    Accelerometer.addListener(acc => setData(acc));
    setSubscribed(true);
  }

  function _unsubscribe() {
    Accelerometer.removeAllListeners();
    setSubscribed(false);
  }

  return (
    <Box safeArea p={4}>
      <VStack space={3}>
        <Text bold>Accelerometer</Text>
        <Text>x: {data.x.toFixed(3)}</Text>
        <Text>y: {data.y.toFixed(3)}</Text>
        <Text>z: {data.z.toFixed(3)}</Text>
        <Button onPress={subscribed ? _unsubscribe : _subscribe}>{subscribed ? 'Stop' : 'Start'}</Button>
      </VStack>
    </Box>
  );
}
