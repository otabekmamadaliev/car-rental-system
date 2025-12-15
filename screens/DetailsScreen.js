import React from 'react';
import { Box, Text, Button, VStack } from 'native-base';

export default function DetailsScreen({ route, navigation }) {
  const item = route?.params?.item || {};

  return (
    <Box safeArea p={4}>
      <VStack space={3}>
        <Text bold fontSize="lg">{item.title}</Text>
        <Text>{item.body}</Text>
        <Button onPress={() => navigation.navigate('Update', { item })}>Edit</Button>
      </VStack>
    </Box>
  );
}
