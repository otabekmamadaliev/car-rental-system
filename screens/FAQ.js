import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import SafeContainer from '../components/SafeContainer';

export default function FAQ({ navigation }) {
  const [expandedIndex, setExpandedIndex] = useState(null);

  const faqs = [
    {
      question: 'How do I book a car?',
      answer: 'Browse available vehicles, select your preferred car, choose your rental dates, and complete the booking process. You\'ll receive instant confirmation via email.'
    },
    {
      question: 'What documents do I need to rent a car?',
      answer: 'You\'ll need a valid driver\'s license, a credit card in your name, and proof of insurance. International renters may also need a passport and international driving permit.'
    },
    {
      question: 'Can I modify or cancel my booking?',
      answer: 'Yes, you can modify or cancel your booking up to 24 hours before the pickup time without any fees. Go to "My Bookings" to make changes.'
    },
    {
      question: 'What is your fuel policy?',
      answer: 'All our vehicles come with a full tank of fuel. Please return the car with a full tank to avoid additional charges.'
    },
    {
      question: 'Is insurance included in the rental price?',
      answer: 'Basic insurance is included. You can purchase additional coverage options during the booking process for extra protection.'
    },
    {
      question: 'What happens if I return the car late?',
      answer: 'A grace period of 30 minutes is provided. Beyond that, you\'ll be charged for an additional day. Please contact us if you need to extend your rental.'
    },
    {
      question: 'Can someone else drive the rental car?',
      answer: 'Additional drivers can be added during booking for a small fee. All drivers must meet age requirements and present valid licenses.'
    },
    {
      question: 'How do I contact customer support?',
      answer: 'You can reach us via phone at +1 (555) 123-4567, email at support@rentcars.com, or through the Contact Support section in the app.'
    },
    {
      question: 'What payment methods do you accept?',
      answer: 'We accept all major credit cards (Visa, MasterCard, American Express), debit cards, and digital payment methods.'
    },
    {
      question: 'Is there a minimum rental period?',
      answer: 'The minimum rental period is 24 hours. For shorter rentals, hourly rates may be available for select vehicles.'
    }
  ];

  const toggleExpand = (index) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <SafeContainer>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>FAQ</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.intro}>
          <Ionicons name="help-circle-outline" size={50} color="#FF6B35" />
          <Text style={styles.introTitle}>Frequently Asked Questions</Text>
          <Text style={styles.introText}>
            Find answers to common questions about our car rental service
          </Text>
        </View>

        <View style={styles.faqList}>
          {faqs.map((faq, index) => (
            <TouchableOpacity
              key={index}
              style={styles.faqItem}
              onPress={() => toggleExpand(index)}
              activeOpacity={0.7}
            >
              <View style={styles.faqHeader}>
                <Text style={styles.faqQuestion}>{faq.question}</Text>
                <Ionicons
                  name={expandedIndex === index ? "chevron-up" : "chevron-down"}
                  size={20}
                  color="#666"
                />
              </View>
              {expandedIndex === index && (
                <Text style={styles.faqAnswer}>{faq.answer}</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.contactCard}>
          <Text style={styles.contactTitle}>Still have questions?</Text>
          <Text style={styles.contactText}>
            Our support team is here to help
          </Text>
          <TouchableOpacity
            style={styles.contactButton}
            onPress={() => navigation.navigate('ContactSupport')}
          >
            <Ionicons name="chatbubble-outline" size={20} color="#fff" />
            <Text style={styles.contactButtonText}>Contact Support</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
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
  intro: {
    alignItems: 'center',
    padding: 30,
    backgroundColor: '#fff',
    marginBottom: 10
  },
  introTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000',
    marginTop: 15,
    marginBottom: 10
  },
  introText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20
  },
  faqList: { paddingHorizontal: 20 },
  faqItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  faqQuestion: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
    flex: 1,
    paddingRight: 10
  },
  faqAnswer: {
    fontSize: 14,
    color: '#666',
    marginTop: 12,
    lineHeight: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0'
  },
  contactCard: {
    backgroundColor: '#FF6B35',
    borderRadius: 16,
    padding: 25,
    margin: 20,
    alignItems: 'center'
  },
  contactTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8
  },
  contactText: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
    marginBottom: 20
  },
  contactButton: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center'
  },
  contactButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FF6B35',
    marginLeft: 8
  }
});
