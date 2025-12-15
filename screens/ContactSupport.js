import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, Alert, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import SafeContainer from '../components/SafeContainer';

export default function ContactSupport({ navigation }) {
  const [formData, setFormData] = useState({
    subject: '',
    message: ''
  });

  const handleSubmit = () => {
    if (!formData.subject.trim() || !formData.message.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    Alert.alert(
      'Message Sent!',
      'We\'ve received your message and will get back to you within 24 hours.',
      [{ text: 'OK', onPress: () => navigation.goBack() }]
    );
  };

  const contactMethods = [
    {
      icon: 'call-outline',
      title: 'Phone',
      value: '+1 (555) 123-4567',
      action: () => Linking.openURL('tel:+15551234567')
    },
    {
      icon: 'mail-outline',
      title: 'Email',
      value: 'support@rentcars.com',
      action: () => Linking.openURL('mailto:support@rentcars.com')
    },
    {
      icon: 'chatbubbles-outline',
      title: 'Live Chat',
      value: 'Available 24/7',
      action: () => Alert.alert('Live Chat', 'Live chat feature coming soon!')
    },
    {
      icon: 'location-outline',
      title: 'Office',
      value: '123 Main St, City, ST 12345',
      action: () => Alert.alert('Location', '123 Main St, City, ST 12345')
    }
  ];

  return (
    <SafeContainer>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Contact Support</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.sectionTitle}>Get in Touch</Text>
        
        <View style={styles.contactMethods}>
          {contactMethods.map((method, index) => (
            <TouchableOpacity
              key={index}
              style={styles.contactCard}
              onPress={method.action}
            >
              <View style={styles.contactIcon}>
                <Ionicons name={method.icon} size={24} color="#00D9FF" />
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactTitle}>{method.title}</Text>
                <Text style={styles.contactValue}>{method.value}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Send us a Message</Text>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Subject</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={formData.subject}
                onChangeText={(text) => setFormData({ ...formData, subject: text })}
                placeholder="What is this about?"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Message</Text>
            <View style={[styles.inputContainer, styles.textAreaContainer]}>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.message}
                onChangeText={(text) => setFormData({ ...formData, message: text })}
                placeholder="Tell us more about your issue..."
                multiline
                numberOfLines={6}
                textAlignVertical="top"
              />
            </View>
          </View>

          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Ionicons name="send-outline" size={20} color="#fff" />
            <Text style={styles.submitButtonText}>Send Message</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fff'
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#000' },
  content: { flex: 1, backgroundColor: '#f8f9fa' },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    padding: 20,
    paddingBottom: 15
  },
  contactMethods: { paddingHorizontal: 20, marginBottom: 10 },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2
  },
  contactIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 217, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15
  },
  contactInfo: { flex: 1 },
  contactTitle: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 4 },
  contactValue: { fontSize: 13, color: '#666' },
  form: { padding: 20 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 8 },
  inputContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0'
  },
  textAreaContainer: { minHeight: 120 },
  input: { fontSize: 16, color: '#000' },
  textArea: { minHeight: 100 },
  submitButton: {
    flexDirection: 'row',
    backgroundColor: '#FF6B35',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10
  },
  submitButtonText: { fontSize: 16, fontWeight: '600', color: '#fff', marginLeft: 8 }
});
