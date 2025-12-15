import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import SafeContainer from '../components/SafeContainer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { Camera } from 'expo-camera';
import { saveDriverLicense, listenToDriverLicense } from '../services/firestore';
import * as FileSystem from 'expo-file-system/legacy';

export default function DriverLicense({ navigation }) {
  const [userId, setUserId] = useState(null);
  const [licenseData, setLicenseData] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    initializeScreen();
  }, []);

  const initializeScreen = async () => {
    try {
      // Get user ID
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        setUserId(user.id);

        // Set up real-time listener for driver license changes
        const unsubscribe = listenToDriverLicense(user.id, (license) => {
          setLicenseData(license);
          // Also update AsyncStorage for offline access
          updateLocalStorage(user.id, license);
        });

        // Request permissions
        requestPermissions();

        // Cleanup listener on unmount
        return () => {
          if (unsubscribe) unsubscribe();
        };
      }
    } catch (error) {
      console.error('Error initializing screen:', error);
      Alert.alert('Error', 'Failed to load license data. Please try again.');
    }
  };

  const updateLocalStorage = async (uid, license) => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        user.driverLicense = license;
        await AsyncStorage.setItem('user', JSON.stringify(user));
      }
    } catch (error) {
      console.error('Error updating local storage:', error);
    }
  };

  const requestPermissions = async () => {
    try {
      const { status: cameraStatus } = await Camera.requestCameraPermissionsAsync();
      const { status: galleryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (cameraStatus !== 'granted' || galleryStatus !== 'granted') {
        Alert.alert(
          'Permissions Required',
          'Camera and gallery permissions are needed to upload your driver license.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error requesting permissions:', error);
    }
  };

  const analyzeImageWithOCR = async (uri) => {
    try {
      // Convert image to base64
      const base64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });

      // Call OCR.space API
      const formData = new FormData();
      formData.append('base64Image', `data:image/jpeg;base64,${base64}`);
      formData.append('isOverlayRequired', 'false');
      formData.append('detectOrientation', 'true');
      formData.append('scale', 'true');
      formData.append('OCREngine', '2');

      const response = await fetch('https://api.ocr.space/parse/image', {
        method: 'POST',
        headers: {
          'apikey': 'K87899142388957',
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`OCR API error: ${response.status}`);
      }

      const result = await response.json();

      if (result.IsErroredOnProcessing) {
        console.error('OCR Error:', result.ErrorMessage);
        return {
          isLicense: 'uncertain',
          reason: 'Could not read text from image. Please ensure the photo is clear and well-lit.',
          fallback: true
        };
      }

      // Extract detected text (keep original case for better matching)
      const detectedText = result.ParsedResults?.[0]?.ParsedText || '';
      const upperText = detectedText.toUpperCase();
      console.log('Detected text:', detectedText.substring(0, 200));

      // Multilingual driver license keywords (covers most countries)
      const licenseKeywords = [
        // English
        'DRIVING LICENCE', 'DRIVER LICENSE', 'DRIVERS LICENSE', 'DRIVING LICENSE',
        // Spanish/Portuguese
        'LICENCIA DE CONDUCIR', 'LICENCIA CONDUCIR', 'CARTEIRA DE MOTORISTA', 'CARTEIRA DE HABILITAÇÃO',
        // French
        'PERMIS DE CONDUIRE',
        // German
        'FÜHRERSCHEIN', 'FUHRERSCHEIN', 'FAHRERLAUBNIS',
        // Italian
        'PATENTE DI GUIDA',
        // Dutch/Flemish
        'RIJBEWIJS',
        // Polish
        'PRAWO JAZDY',
        // Czech/Slovak
        'ŘIDIČSKÝ PRŮKAZ', 'RIDICSKY PRUKAZ',
        // Hungarian
        'JOGOSÍTVÁNY',
        // Romanian
        'PERMIS DE CONDUCERE',
        // Swedish/Norwegian/Danish
        'KÖRKORT', 'FØRERKORT', 'KØREKORT',
        // Finnish
        'AJOKORTTI',
        // Greek
        'ΆΔΕΙΑ ΟΔΉΓΗΣΗΣ', 'ADEIA ODIGISIS',
        // Russian/Bulgarian/Serbian (Cyrillic)
        'ВОДИТЕЛЬСКОЕ УДОСТОВЕРЕНИЕ', 'VOZACKA DOZVOLA',
        // Turkish
        'SÜRÜCÜ BELGESI', 'SÜRÜCÜ EHLIYETI',
        // Croatian/Slovenian/Bosnian
        'VOZAČKA DOZVOLA', 'VOZNIŠKO DOVOLJENJE',
        // Lithuanian/Latvian/Estonian
        'VAIRUOTOJO PAŽYMĖJIMAS', 'VADĪTĀJA APLIECĪBA', 'JUHILUBA',
        // Albanian
        'PATENTË SHOFERI',
        // EU Standard text
        'DRIVING LICENCE', 'FÜHRERSCHEIN', 'PERMIS DE CONDUIRE'
      ];

      // Date-related keywords (common across all licenses)
      const dateKeywords = [
        'DOB', 'BORN', 'BIRTH', 'EXPIRES', 'EXPIRY', 'VALID', 'ISSUED',
        'FECHA', 'NASCIMENTO', 'SCADENZA', 'GÜLTIG', 'ВАЛИДНОСТЬ',
        'تاريخ', 'الميلاد', 'يصدر', '出生', '有效', '発行', '만료'
      ];

      // Passport-specific keywords (reject these)
      const passportKeywords = [
        'PASSPORT', 'PASSEPORT', 'PASSAPORTO', 'REISEPASS', 'PASAPORTE',
        'P<', 'NATIONALITY', 'NACIONALIDAD', 'NATIONALITÉ', 'جواز',
        'パスポート', '护照', '여권'
      ];

      // National ID keywords (reject these)
      const idCardKeywords = [
        'IDENTIFICATION CARD', 'ID CARD', 'NATIONAL ID', 'IDENTITY CARD',
        'CEDULA', 'IDENTIDAD', 'CARTA D\'IDENTITÀ', 'PERSONALAUSWEIS',
        'بطاقة', 'هوية', '身份证', 'マイナンバー', '주민등록'
      ];

      // Check if it's a passport (reject)
      const isPassport = passportKeywords.some(keyword => 
        upperText.includes(keyword) || detectedText.includes(keyword)
      );
      if (isPassport) {
        return {
          isLicense: false,
          reason: 'This appears to be a passport. Please upload your driver\'s license instead.'
        };
      }

      // Check if it's an ID card (reject)
      const isIdCard = idCardKeywords.some(keyword => 
        upperText.includes(keyword) || detectedText.includes(keyword)
      );
      if (isIdCard) {
        return {
          isLicense: false,
          reason: 'This appears to be an ID card. Please upload your driver\'s license.'
        };
      }

      // Count license-specific keywords
      const foundLicenseKeywords = licenseKeywords.filter(keyword =>
        upperText.includes(keyword) || detectedText.includes(keyword)
      );

      // Count date-related keywords
      const foundDateKeywords = dateKeywords.filter(keyword =>
        upperText.includes(keyword) || detectedText.includes(keyword)
      );

      // Check for line 9 with vehicle categories (specific to driver licenses)
      // Format: "9. AM/B/C" or "9.AM" or "9. B" or "9 AM/B"
      const hasLine9Categories = /9\.?\s*[A-D][A-D0-9]*[\/\s,]*[A-D]*[A-D0-9]*/i.test(detectedText);

      console.log('Found license keywords:', foundLicenseKeywords);
      console.log('Found date keywords:', foundDateKeywords);
      console.log('Has line 9 categories:', hasLine9Categories);

      // Check for numbers (licenses always have ID numbers, dates, etc.)
      const hasNumbers = /\d{3,}/.test(detectedText);

      // Stricter verification - must have license-specific phrase OR line 9 categories
      // Option 1: Has full license phrase (PRAWO JAZDY, DRIVING LICENCE, etc.)
      if (foundLicenseKeywords.length >= 1) {
        return {
          isLicense: true,
          confidence: 'high',
          message: `Verified: Driver license detected (${foundLicenseKeywords[0]})`
        };
      }

      // Option 2: Has line 9 with vehicle categories (EU standard format)
      if (hasLine9Categories && foundDateKeywords.length >= 1) {
        return {
          isLicense: true,
          confidence: 'medium',
          message: `Verified: EU driver license detected (line 9 categories found)`
        };
      }

      // No license keywords and no line 9 = NOT a license
      if (foundLicenseKeywords.length === 0 && !hasLine9Categories) {
        return {
          isLicense: false,
          reason: 'This doesn\'t appear to be a driver\'s license. Please upload a document with "DRIVER LICENSE", "PRAWO JAZDY", "PERMIS DE CONDUIRE" or similar text clearly visible.'
        };
      }

      // Very little or no text detected
      if (detectedText.length < 20) {
        return {
          isLicense: false,
          reason: 'Could not read enough text. Please take a clearer, well-lit photo of your driver\'s license.'
        };
      }

      // Text detected but doesn't match any pattern
      return {
        isLicense: 'uncertain',
        confidence: 'low',
        reason: 'Document detected but type unclear. If this is your driver\'s license, you can proceed manually.'
      };

    } catch (error) {
      console.error('OCR Error:', error);

      // Fallback to basic dimension check if OCR fails
      return new Promise((resolve) => {
        Image.getSize(
          uri,
          (width, height) => {
            const aspectRatio = width / height;
            const isLandscape = aspectRatio > 1.2 && aspectRatio < 2.0;

            if (isLandscape) {
              resolve({
                isLicense: 'uncertain',
                confidence: 'low',
                reason: 'OCR service temporarily unavailable. Document appears to be landscape format. Please confirm this is your driver\'s license.',
                fallback: true
              });
            } else {
              resolve({
                isLicense: false,
                reason: 'OCR service temporarily unavailable. Document doesn\'t match standard license format (should be landscape orientation).',
                fallback: true
              });
            }
          },
          () => {
            resolve({
              isLicense: 'uncertain',
              reason: 'Could not verify document. Please try again or ensure you have a stable internet connection.',
              fallback: true
            });
          }
        );
      });
    }
  };

  const processImage = async (uri) => {
    setAnalyzing(true);

    try {
      // Analyze the image with OCR
      const analysisResult = await analyzeImageWithOCR(uri);

      setAnalyzing(false);

      if (analysisResult.isLicense === false) {
        Alert.alert(
          'Invalid Document',
          analysisResult.reason || 'This doesn\'t appear to be a driver\'s license. Please upload a valid license photo.',
          [
            { text: 'Retry', onPress: () => handleUploadPhoto() },
            { text: 'Cancel', style: 'cancel' }
          ]
        );
        return;
      }

      if (analysisResult.isLicense === 'uncertain') {
        // Ask user to confirm
        const confirmMessage = analysisResult.fallback
          ? `${analysisResult.reason}\n\nIs this your driver's license?`
          : `${analysisResult.reason}\n\nWould you like to proceed anyway?`;

        Alert.alert(
          'Verify Document',
          confirmMessage,
          [
            {
              text: 'No, Retake',
              style: 'cancel',
              onPress: () => handleUploadPhoto()
            },
            {
              text: 'Yes, Continue',
              onPress: async () => {
                await saveAndConfirm(uri, analysisResult);
              }
            }
          ]
        );
        return;
      }

      // Valid license detected
      await saveAndConfirm(uri, analysisResult);

    } catch (error) {
      setAnalyzing(false);
      console.error('Error processing image:', error);
      Alert.alert(
        'Processing Error',
        'An error occurred while processing the image. Please try again.',
        [
          { text: 'Retry', onPress: () => handleUploadPhoto() },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    }
  };

  const saveAndConfirm = async (uri, analysisResult) => {
    setUploading(true);

    try {
      const licenseInfo = {
        imageUri: uri,
        verified: analysisResult.isLicense === true,
        confidence: analysisResult.confidence || 'low',
        uploadedAt: new Date().toISOString()
      };

      // Save to Firestore (real-time listener will update UI automatically)
      const result = await saveDriverLicense(userId, licenseInfo);

      setUploading(false);

      if (result.success) {
        const message = analysisResult.isLicense === true
          ? `${analysisResult.message}\n\n✓ Your driver's license has been uploaded successfully.`
          : 'Your driver\'s license has been uploaded.\n\n⚠️ Note: Manual verification may be required.';

        Alert.alert('Success!', message, [{ text: 'OK' }]);
      } else {
        throw new Error('Failed to save to database');
      }

    } catch (error) {
      setUploading(false);
      console.error('Error saving license:', error);
      Alert.alert(
        'Upload Failed',
        'Failed to save your license. Please check your internet connection and try again.',
        [
          { text: 'Retry', onPress: () => saveAndConfirm(uri, analysisResult) },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    }
  };

  const takePhoto = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [16, 10],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const uri = result.assets[0].uri;
        await processImage(uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Camera Error', 'Failed to capture photo. Please try again.');
    }
  };

  const pickFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [16, 10],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const uri = result.assets[0].uri;
        await processImage(uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Gallery Error', 'Failed to select image. Please try again.');
    }
  };

  const handleUploadPhoto = () => {
    Alert.alert(
      'Upload Driver License',
      'Choose upload method',
      [
        {
          text: 'Take Photo',
          onPress: takePhoto
        },
        {
          text: 'Choose from Gallery',
          onPress: pickFromGallery
        },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const handleRemoveLicense = () => {
    Alert.alert(
      'Remove License',
      'Are you sure you want to remove your driver license?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            setUploading(true);
            try {
              await saveDriverLicense(userId, null);
              setUploading(false);
              Alert.alert('Success', 'License removed successfully');
            } catch (error) {
              setUploading(false);
              console.error('Error removing license:', error);
              Alert.alert('Error', 'Failed to remove license. Please try again.');
            }
          }
        }
      ]
    );
  };

  const isVerified = licenseData?.verified === true;
  const hasLicense = licenseData !== null;

  return (
    <SafeContainer>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Driver License</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {(analyzing || uploading) && (
          <View style={styles.analyzingOverlay}>
            <View style={styles.analyzingBox}>
              <ActivityIndicator size="large" color="#FF6B35" />
              <Text style={styles.analyzingText}>
                {analyzing ? 'Analyzing document...' : 'Uploading...'}
              </Text>
              <Text style={styles.analyzingSubtext}>
                {analyzing ? 'Verifying this is a driver\'s license' : 'Please wait'}
              </Text>
            </View>
          </View>
        )}

        <View style={styles.statusCard}>
          <Ionicons
            name={isVerified ? "checkmark-circle" : hasLicense ? "alert-circle" : "close-circle"}
            size={60}
            color={isVerified ? "#28a745" : hasLicense ? "#ffc107" : "#dc3545"}
          />
          <Text style={styles.statusTitle}>
            {isVerified ? 'License Verified ✓' : hasLicense ? 'Pending Verification' : 'Not Verified'}
          </Text>
          <Text style={styles.statusSubtitle}>
            {isVerified
              ? 'Your driver license has been verified successfully'
              : hasLicense
              ? 'Your license is uploaded but may require manual verification'
              : 'Please upload your driver license to verify your account'}
          </Text>
          {licenseData?.confidence && (
            <View style={[styles.confidenceBadge, { 
              backgroundColor: licenseData.confidence === 'high' ? '#28a745' : 
                              licenseData.confidence === 'medium' ? '#ffc107' : '#6c757d'
            }]}>
              <Text style={styles.confidenceText}>
                {licenseData.confidence.toUpperCase()} CONFIDENCE
              </Text>
            </View>
          )}
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>Requirements:</Text>
          <View style={styles.infoItem}>
            <Ionicons name="checkmark-circle-outline" size={20} color="#00D9FF" />
            <Text style={styles.infoText}>Valid government-issued driver license</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="checkmark-circle-outline" size={20} color="#00D9FF" />
            <Text style={styles.infoText}>Clear, readable photo of the license</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="checkmark-circle-outline" size={20} color="#00D9FF" />
            <Text style={styles.infoText}>License must not be expired</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="checkmark-circle-outline" size={20} color="#00D9FF" />
            <Text style={styles.infoText}>All text should be clearly visible</Text>
          </View>
        </View>

        {licenseData?.imageUri && (
          <View style={styles.imagePreviewContainer}>
            <Text style={styles.previewTitle}>License Preview:</Text>
            <Image source={{ uri: licenseData.imageUri }} style={styles.licenseImage} />
            {licenseData.uploadedAt && (
              <Text style={styles.uploadDate}>
                Uploaded: {new Date(licenseData.uploadedAt).toLocaleDateString()} at{' '}
                {new Date(licenseData.uploadedAt).toLocaleTimeString()}
              </Text>
            )}
          </View>
        )}

        <TouchableOpacity style={styles.uploadButton} onPress={handleUploadPhoto}>
          <Ionicons name="cloud-upload-outline" size={24} color="#fff" />
          <Text style={styles.uploadButtonText}>
            {hasLicense ? 'Upload New License' : 'Upload License'}
          </Text>
        </TouchableOpacity>

        {hasLicense && (
          <TouchableOpacity style={styles.removeButton} onPress={handleRemoveLicense}>
            <Ionicons name="trash-outline" size={20} color="#dc3545" />
            <Text style={styles.removeButtonText}>Remove License</Text>
          </TouchableOpacity>
        )}

        <View style={styles.helpSection}>
          <Ionicons name="information-circle-outline" size={20} color="#666" />
          <Text style={styles.helpText}>
            Your license is verified using OCR technology. Changes sync automatically across all your devices.
          </Text>
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
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000'
  },
  content: {
    flex: 1,
    backgroundColor: '#f8f9fa'
  },
  statusCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    margin: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3
  },
  statusTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginTop: 15,
    marginBottom: 10
  },
  statusSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20
  },
  confidenceBadge: {
    marginTop: 15,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12
  },
  confidenceText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 0.5
  },
  infoSection: {
    backgroundColor: 'rgba(0, 217, 255, 0.1)',
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 20
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 15
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12
  },
  infoText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 10,
    flex: 1
  },
  uploadButton: {
    flexDirection: 'row',
    backgroundColor: '#FF6B35',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    marginBottom: 15
  },
  uploadButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 10
  },
  removeButton: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#dc3545'
  },
  removeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#dc3545',
    marginLeft: 8
  },
  imagePreviewContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginHorizontal: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  previewTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10
  },
  licenseImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    resizeMode: 'cover',
    backgroundColor: '#f0f0f0'
  },
  uploadDate: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    textAlign: 'center'
  },
  analyzingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000
  },
  analyzingBox: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    minWidth: 250
  },
  analyzingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginTop: 15,
    marginBottom: 5
  },
  analyzingSubtext: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center'
  },
  helpSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginHorizontal: 20,
    marginBottom: 30
  },
  helpText: {
    fontSize: 13,
    color: '#666',
    marginLeft: 10,
    flex: 1,
    lineHeight: 18
  }
});
