import React, { useState } from 'react';
import { Box, Input, Button, VStack, Text } from 'native-base';
import { createPost } from '../src/api';

export default function CreateScreen({ navigation }) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  async function onCreate() {
    const res = await createPost({ title, body, userId: 1 });
    navigation.navigate('Details', { item: res });
  }

  return (
    <Box safeArea p={4}>
      <VStack space={3}>
        <Text>Title</Text>
        <Input value={title} onChangeText={setTitle} placeholder="Title" />
        <Text>Body</Text>
        <Input value={body} onChangeText={setBody} placeholder="Body" />
        <Button onPress={onCreate}>Create (POST)</Button>
      </VStack>
    </Box>
  );
}
