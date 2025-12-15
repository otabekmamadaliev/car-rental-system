import React, { useState, useEffect } from 'react';
import { Image, View, ActivityIndicator } from 'react-native';
import { SvgUri } from 'react-native-svg';

const FREEPIK_API_KEY = 'FPSX75d355b79d04e97ea16a172f9660fe1e';
const FREEPIK_API_URL = 'https://api.freepik.com/v1/icons';

export default function FreepikIcon({ iconName, size = 24, color = '#000', style }) {
  const [iconUrl, setIconUrl] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchIcon();
  }, [iconName]);

  const fetchIcon = async () => {
    try {
      const response = await fetch(`${FREEPIK_API_URL}?term=${iconName}&limit=1&order=latest`, {
        headers: {
          'Accept': 'application/json',
          'x-freepik-api-key': FREEPIK_API_KEY
        }
      });
      
      const data = await response.json();
      
      if (data && data.data && data.data.length > 0) {
        // Get the SVG URL from the first result
        const icon = data.data[0];
        setIconUrl(icon.image);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching Freepik icon:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }, style]}>
        <ActivityIndicator size="small" color={color} />
      </View>
    );
  }

  if (!iconUrl) {
    return <View style={[{ width: size, height: size }, style]} />;
  }

  return (
    <Image 
      source={{ uri: iconUrl }}
      style={[{ width: size, height: size, tintColor: color }, style]}
      resizeMode="contain"
    />
  );
}
