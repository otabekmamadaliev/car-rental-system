import React, { useEffect, useState } from 'react';
import { Box, FlatList, Text, Pressable } from 'native-base';
import { getPosts } from '../src/api';

export default function ListScreen({ navigation }) {
  const [items, setItems] = useState([]);

  useEffect(() => {
    (async () => {
      const data = await getPosts();
      setItems(data.slice(0, 20));
    })();
  }, []);

  return (
    <Box safeArea flex={1} p={2}>
      <FlatList
        data={items}
        keyExtractor={(i) => String(i.id)}
        renderItem={({ item }) => (
          <Pressable onPress={() => navigation.navigate('Details', { item })}>
            <Box p={3} borderBottomWidth={1} borderColor="coolGray.200">
              <Text bold>{item.title}</Text>
            </Box>
          </Pressable>
        )}
      />
    </Box>
  );
}
