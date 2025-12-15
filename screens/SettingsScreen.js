import React from 'react';
import { Box, VStack, Text, Button } from 'native-base';

export default function SettingsScreen({ navigation }) {
  return (
    <Box safeArea p={4}>
      <VStack space={3}>
        <Text bold>Settings</Text>
        <Button onPress={() => navigation.navigate('Sensors')}>Open Sensors</Button>
      </VStack>
    </Box>
  );
}
