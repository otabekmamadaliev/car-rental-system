import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import SafeContainer from '../components/SafeContainer';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function EmailVerificationScreen({ route, navigation }) {
  const { userData, verificationCode } = route.params;
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);

  useEffect(() => {
    const timer = setInterval(() => {
      setResendTimer(prev => prev > 0 ? prev - 1 : 0);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleVerify = async () => {
    if (!code.trim()) {
      Alert.alert('Error', 'Please enter the verification code');
      return;
    }

    if (code !== verificationCode) {
      Alert.alert('Error', 'Invalid verification code. Please try again.');
      return;
    }

    setLoading(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Add user to registered users list
      const registeredUsersData = await AsyncStorage.getItem('registeredUsers');
      const registeredUsers = registeredUsersData ? JSON.parse(registeredUsersData) : [];
      registeredUsers.push(userData);
      await AsyncStorage.setItem('registeredUsers', JSON.stringify(registeredUsers));

      // Save current user session (without password)
      const { password: _, ...userWithoutPassword } = userData;
      await AsyncStorage.setItem('user', JSON.stringify(userWithoutPassword));
      await AsyncStorage.setItem('isLoggedIn', 'true');

      Alert.alert(
        'Success!',
        'Your email has been verified successfully.',
        [
          { 
            text: 'OK', 
            onPress: () => navigation.replace('Home')
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = () => {
    if (resendTimer > 0) return;

    // Generate new code
    const newCode = Math.floor(100000 + Math.random() * 900000).toString();
    setResendTimer(60);

    Alert.alert(
      'Code Resent!',
      `A new verification code has been sent to ${userData.email}\n\nDemo Code: ${newCode}`
    );
  };

  return (
    <SafeContainer>
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.content}>
          {/* Icon */}
          <View style={styles.iconContainer}>
            <View style={styles.iconCircle}>
              <Ionicons name="mail" size={60} color="#00D9FF" />
            </View>
          </View>

          {/* Title */}
          <Text style={styles.title}>Verify Your Email</Text>
          <Text style={styles.subtitle}>
            We've sent a 6-digit verification code to{'\n'}
            <Text style={styles.email}>{userData.email}</Text>
          </Text>

          {/* Code Input */}
          <View style={styles.codeInputContainer}>
            <TextInput
              style={styles.codeInput}
              placeholder="Enter 6-digit code"
              value={code}
              onChangeText={setCode}
              keyboardType="number-pad"
              maxLength={6}
              textAlign="center"
            />
          </View>

          {/* Verify Button */}
          <TouchableOpacity 
            style={[styles.verifyButton, loading && styles.verifyButtonDisabled]} 
            onPress={handleVerify}
            disabled={loading}
          >
            <Text style={styles.verifyButtonText}>
              {loading ? 'Verifying...' : 'Verify Email'}
            </Text>
          </TouchableOpacity>

          {/* Resend Code */}
          <View style={styles.resendContainer}>
            <Text style={styles.resendText}>Didn't receive the code? </Text>
            <TouchableOpacity 
              onPress={handleResendCode}
              disabled={resendTimer > 0}
            >
              <Text style={[styles.resendLink, resendTimer > 0 && styles.resendLinkDisabled]}>
                {resendTimer > 0 ? `Resend (${resendTimer}s)` : 'Resend'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Change Email */}
          <TouchableOpacity 
            style={styles.changeEmailButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="pencil" size={16} color="#FF6B35" />
            <Text style={styles.changeEmailText}>Change Email Address</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: 25 },
  
  // Icon
  iconContainer: { alignItems: 'center', marginBottom: 30 },
  iconCircle: { 
    width: 140, 
    height: 140, 
    borderRadius: 70, 
    backgroundColor: 'rgba(0, 217, 255, 0.1)', 
    justifyContent: 'center', 
    alignItems: 'center'
  },

  // Title
  title: { fontSize: 28, fontWeight: 'bold', color: '#000', marginBottom: 12, textAlign: 'center' },
  subtitle: { fontSize: 15, color: '#666', marginBottom: 40, textAlign: 'center', lineHeight: 22 },
  email: { color: '#FF6B35', fontWeight: '600' },

  // Code Input
  codeInputContainer: { marginBottom: 25 },
  codeInput: { 
    backgroundColor: '#fff', 
    borderRadius: 12, 
    paddingVertical: 20,
    paddingHorizontal: 20,
    fontSize: 32,
    fontWeight: 'bold',
    letterSpacing: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    color: '#000'
  },

  // Verify Button
  verifyButton: { 
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
  verifyButtonDisabled: { opacity: 0.6 },
  verifyButtonText: { color: '#fff', fontSize: 17, fontWeight: 'bold' },

  // Resend
  resendContainer: { flexDirection: 'row', justifyContent: 'center', marginBottom: 25 },
  resendText: { fontSize: 15, color: '#666' },
  resendLink: { fontSize: 15, color: '#FF6B35', fontWeight: 'bold' },
  resendLinkDisabled: { color: '#999' },

  // Change Email
  changeEmailButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center',
    padding: 12
  },
  changeEmailText: { fontSize: 15, color: '#FF6B35', fontWeight: '600', marginLeft: 6 }
});
