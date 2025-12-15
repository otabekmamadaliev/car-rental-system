import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import SafeContainer from '../components/SafeContainer';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendCode = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    if (!email.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setLoading(true);

    try {
      // Check if email is registered
      const registeredUsersData = await AsyncStorage.getItem('registeredUsers');
      const registeredUsers = registeredUsersData ? JSON.parse(registeredUsersData) : [];
      
      const emailExists = registeredUsers.some(u => u.email.toLowerCase() === email.toLowerCase());
      
      if (!emailExists) {
        Alert.alert('Error', 'This email is not registered. Please sign up first.');
        setLoading(false);
        return;
      }

      // Simulate sending verification code
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Generate random 6-digit code
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      
      Alert.alert(
        'Verification Code Sent!',
        `We've sent a 6-digit code to ${email}\n\nDemo Code: ${verificationCode}`,
        [
          { 
            text: 'OK', 
            onPress: () => navigation.navigate('ResetPassword', { email, verificationCode })
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to send verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeContainer>
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton} 
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color="#000" />
            </TouchableOpacity>
          </View>

          {/* Icon */}
          <View style={styles.iconContainer}>
            <View style={styles.iconCircle}>
              <Ionicons name="lock-closed" size={50} color="#FF6B35" />
            </View>
          </View>

          {/* Title */}
          <Text style={styles.title}>Forgot Password?</Text>
          <Text style={styles.subtitle}>
            Don't worry! Enter your email address and we'll send you a verification code to reset your password.
          </Text>

          {/* Email Input */}
          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email Address"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
          </View>

          {/* Send Code Button */}
          <TouchableOpacity 
            style={[styles.sendButton, loading && styles.sendButtonDisabled]} 
            onPress={handleSendCode}
            disabled={loading}
          >
            <Text style={styles.sendButtonText}>
              {loading ? 'Sending Code...' : 'Send Verification Code'}
            </Text>
          </TouchableOpacity>

          {/* Back to Login */}
          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Remember your password? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  content: { flex: 1, paddingHorizontal: 25, paddingTop: 20 },
  
  // Header
  header: { marginBottom: 20 },
  backButton: { 
    width: 45,
    height: 45,
    backgroundColor: '#fff',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2
  },

  // Icon
  iconContainer: { alignItems: 'center', marginVertical: 30 },
  iconCircle: { 
    width: 120, 
    height: 120, 
    borderRadius: 60, 
    backgroundColor: 'rgba(0, 217, 255, 0.1)', 
    justifyContent: 'center', 
    alignItems: 'center'
  },

  // Title
  title: { fontSize: 28, fontWeight: 'bold', color: '#000', marginBottom: 12, textAlign: 'center' },
  subtitle: { fontSize: 15, color: '#666', marginBottom: 40, textAlign: 'center', lineHeight: 22 },

  // Input
  inputContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#fff', 
    borderRadius: 12, 
    paddingHorizontal: 15,
    paddingVertical: 15,
    marginBottom: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2
  },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, fontSize: 16, color: '#000' },

  // Send Button
  sendButton: { 
    backgroundColor: '#FF6B35', 
    paddingVertical: 18, 
    borderRadius: 12, 
    alignItems: 'center',
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    marginBottom: 20
  },
  sendButtonDisabled: { opacity: 0.6 },
  sendButtonText: { color: '#fff', fontSize: 17, fontWeight: 'bold' },

  // Login Link
  loginContainer: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  loginText: { fontSize: 15, color: '#666' },
  loginLink: { fontSize: 15, color: '#FF6B35', fontWeight: 'bold' }
});
