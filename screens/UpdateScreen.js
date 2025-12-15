import React, { useState } from 'react';
import { Box, Input, Button, VStack, Text } from 'native-base';
import { updatePost } from '../src/api';

export default function UpdateScreen({ route, navigation }) {
  const item = route?.params?.item || { id: 1, title: '', body: '' };
  const [title, setTitle] = useState(item.title);
  const [body, setBody] = useState(item.body);

  async function onUpdate() {
    const res = await updatePost(item.id, { title, body, userId: 1 });
    navigation.navigate('Details', { item: res });
  }

  return (
    <Box safeArea p={4}>
      <VStack space={3}>
        <Text>Update Title</Text>
        <Input value={title} onChangeText={setTitle} placeholder="Title" />
        <Text>Update Body</Text>
        <Input value={body} onChangeText={setBody} placeholder="Body" />
        <Button onPress={onUpdate}>Update (PUT)</Button>
      </VStack>
    </Box>
  );
}
