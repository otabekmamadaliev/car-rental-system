# Car Rental System - Mobile Application

A full-featured car rental mobile application built with React Native and Expo, demonstrating modern mobile development practices and integration with Firebase services. This project was developed as part of a university course in Mobile Application Development.

## Development Team

- **Ruzimuhammad Alinazarov** - [alinazarovrozimuhammad9@gmail.com](mailto:alinazarovrozimuhammad9@gmail.com)
- **Otabek Mamadaliev** - [otabekmamadaliyev09@gmail.com](mailto:otabekmamadaliyev09@gmail.com)

## Project Overview

This mobile application provides a complete car rental experience with user authentication, car browsing, booking management, and real-time data synchronization. The app showcases best practices in React Native development, including state management, navigation, Firebase integration, and device sensor utilization.

## Key Features

### Authentication & User Management
- **Firebase Authentication** with email/password
- Complete authentication flow (Login, Signup, Email Verification)
- Password reset and account recovery
- Persistent session management with AsyncStorage
- Real-time profile synchronization

### Car Browsing & Search
- Browse 25+ car models across multiple categories (SUV, Sedan, Sports, Luxury, Electric)
- Advanced filtering system:
  - Filter by car type, transmission, and price range
  - Date range availability filtering
  - Multi-criteria sorting (name, price, year)
- Real-time search functionality
- Favorites system with Firebase sync
- Car detail views with comprehensive specifications

### Booking Management
- Create, edit, and manage bookings
- Date range validation with availability checking
- Booking conflict detection
- Real-time booking updates via Firestore
- Booking history and status tracking

### User Profile & Settings
- Comprehensive user profile management
- Driver license verification with camera integration
- Profile photo upload and management
- Theme customization (Light/Dark mode ready)
- FAQ and support contact features

### Device Sensors Integration
- **Camera**: Driver license document capture and verification
- **Accelerometer**: Shake gesture detection to quickly access favorites
- **Location**: GPS integration for location-based features

### UI/UX Design
- Professional, luxury-themed design system
- Smooth animations and transitions
- Responsive layouts optimized for various screen sizes
- Modern color palette with accessibility considerations
- Glass-morphism and elevation effects

## Technology Stack

### Core Technologies
- **React Native** 0.81.5 - Cross-platform mobile framework
- **Expo** ~54.0.0 - Development platform and build system
- **React Navigation** 6.x - Navigation library (Stack & Bottom Tabs)
- **Firebase** 12.6.0 - Backend services

### Firebase Services
- **Firebase Authentication** - User authentication and management
- **Cloud Firestore** - Real-time NoSQL database
- **Firebase Storage** - Document and image storage (configured)

### Key Dependencies
- `@react-native-async-storage/async-storage` - Local data persistence
- `expo-camera` - Camera functionality for document capture
- `expo-sensors` - Accelerometer and device sensors
- `expo-location` - GPS and location services
- `expo-image-picker` - Image selection and manipulation
- `@react-native-community/datetimepicker` - Date and time selection
- `react-native-heroicons` - Icon library
- `react-native-svg` - SVG rendering support

## Application Screens

The application consists of 20+ screens organized as follows:

### Authentication Flow
- LoginScreen
- SignupScreen
- EmailVerificationScreen
- ForgotPasswordScreen
- ResetPasswordScreen

### Main Application
- HomeScreen - Dashboard with featured cars and quick actions
- BrowseCars - Advanced search and filtering
- CarDetails - Comprehensive car information
- CreateBooking - New booking creation
- EditBooking - Booking modifications
- MyBookings - User's booking history

### User Management
- Profile - User profile overview
- EditProfile - Profile editing
- DriverLicense - License verification
- Settings - App preferences

### Additional Features
- Sensors - Device sensor information and demos
- CameraUpload - Document upload interface
- ContactSupport - Customer support
- FAQ - Frequently asked questions

## Screenshots

The following screenshots illustrate the primary application flows:

- Popular Cars Section: [01-popular-cars.jpg](docs/screenshots/01-popular-cars.jpg)
- Sign Up: [02-sign-up.jpg](docs/screenshots/02-sign-up.jpg)
- Home Dashboard: [03-home.jpg](docs/screenshots/03-home.jpg)
- Top Left Menu: [04-top-left-menu.jpg](docs/screenshots/04-top-left-menu.jpg)
- User Profile: [05-profile.jpg](docs/screenshots/05-profile.jpg)
- Driver License Verification: [06-driver-license.jpg](docs/screenshots/06-driver-license.jpg)
- Browse Cars: [07-browse.jpg](docs/screenshots/07-browse.jpg)
- Car Details: [08-car-details.jpg](docs/screenshots/08-car-details.jpg)
- My Bookings: [09-my-bookings.jpg](docs/screenshots/09-my-bookings.jpg)
- Login: [10-login.jpg](docs/screenshots/10-login.jpg)

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn package manager
- Expo CLI (optional, but recommended)
- iOS Simulator (for Mac) or Android Emulator
- Physical device with Expo Go app (recommended for testing)

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd "MA project"
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up Firebase**
   - The project includes Firebase configuration in `config/firebase.js`
   - For production, replace with your own Firebase project credentials
   - Ensure Firestore and Authentication are enabled in your Firebase Console

4. **Start the development server**
```bash
npm start
# or
expo start
```

5. **Run on device/emulator**
   - Scan QR code with Expo Go app (iOS/Android)
   - Press `i` for iOS simulator
   - Press `a` for Android emulator

## Project Structure

```
car-rental-system/
├── assets/               # Static assets
│   ├── cars/            # Car images (25 models)
│   └── icons/           # App icons
├── components/          # Reusable components
│   ├── SafeContainer.js
│   └── FreepikIcon.js
├── config/              # Configuration files
│   └── firebase.js      # Firebase initialization
├── contexts/            # React Context providers
│   └── ThemeContext.js  # Theme configuration
├── screens/             # Application screens (20+)
├── services/            # Business logic and API services
│   └── firestore.js     # Firestore operations
├── src/                 # Core utilities
│   ├── api.js          # API integration
│   ├── store.js        # State management
│   └── theme.js        # Theme definitions
├── scripts/             # Utility scripts
│   └── create_commits.ps1  # Git commit helper
├── App.js               # Application entry point
├── app.json             # Expo configuration
├── package.json         # Dependencies
└── README.md            # Project documentation
```

## Firebase Data Structure

### Firestore Collections
- `users/` - User profiles and settings
- `bookings/` - Booking records
- `favorites/` - User favorite cars
- `cars/` - Car inventory (optional, using local data)

### Security Rules
Ensure appropriate Firestore security rules are configured for production use.

## Features Demonstration

### Real-time Data Synchronization
The app uses Firestore's real-time listeners to ensure all users see updated information immediately:
- Favorite changes sync across devices
- Profile updates reflect instantly
- Booking status updates in real-time

### Advanced Filtering Algorithm
The browse screen implements a sophisticated multi-criteria filtering system that:
- Handles multiple simultaneous filters
- Checks car availability against booking dates
- Performs efficient sorting operations
- Updates UI reactively

### Sensor Integration Use Cases
1. **Camera Sensor**: Captures driver's license for identity verification
2. **Accelerometer**: Shake gesture (threshold: 2.5g) navigates to favorites
3. **GPS Location**: Prepared for distance calculations and pickup locations

## Testing

To test the application:

1. **Authentication Flow**: Create a test account and verify email flow
2. **Car Browsing**: Test filters, search, and sorting
3. **Booking System**: Create bookings and verify date validation
4. **Sensor Features**: Test camera upload and shake gesture
5. **Real-time Sync**: Test with multiple devices/simulators

## Building for Production

### Using EAS Build (Recommended)

```bash
# Install EAS CLI
npm install -g eas-cli

# Configure EAS
eas build:configure

# Build for Android
eas build --platform android

# Build for iOS
eas build --platform ios
```

### Configuration
- EAS Project ID: `9eb10984-184b-462c-97eb-417860ffa934`
- Bundle Identifier (iOS): `com.maproject.app`
- Package Name (Android): `com.maproject.app`

## Security Considerations

- Firebase credentials are included for demonstration purposes
- For production deployment, use environment variables
- Implement proper Firestore security rules
- Enable app check and authentication guards
- Sanitize user inputs and validate data

## Academic Context

This project was developed as part of a Mobile Application Development course, demonstrating:
- Mobile UI/UX design principles
- State management in React Native
- Firebase integration and real-time databases
- Device sensor utilization
- Navigation patterns and routing
- Authentication and authorization flows
- Data persistence strategies

## Contributing

This is an academic project. For any questions or suggestions:
- Ruzimuhammad Alinazarov: alinazarovrozimuhammad9@gmail.com
- Otabek Mamadaliev: otabekmamadaliyev09@gmail.com

## License

This project is licensed under the **Creative Commons Attribution-NonCommercial-NoDerivatives 4.0 International License (CC BY-NC-ND 4.0)**.

**What this means:**
- **Attribution Required**: You must give appropriate credit to the original authors (Ruzimuhammad Alinazarov and Otabek Mamadaliev)
- **Non-Commercial Use Only**: You may not use this project or any portion of it for commercial purposes or monetary gain
- **No Derivatives**: You may not distribute modified versions of this project without explicit permission from the authors
- **Educational Use**: This project may be referenced or studied for educational purposes with proper attribution

For the full license text, see the [LICENSE](LICENSE) file or visit: https://creativecommons.org/licenses/by-nc-nd/4.0/

**Copyright © 2025 Ruzimuhammad Alinazarov and Otabek Mamadaliev. All rights reserved.**

For permission requests beyond this license, please contact the authors.

## Acknowledgments

- University course instructors and teaching assistants
- Expo and React Native communities
- Firebase documentation and examples
- Open-source contributors

---

**Version:** 1.0.0  
**Last Updated:** December 2025  
**Developed with:** React Native, Expo, Firebase


System.Collections.Hashtable.Name commit 1

System.Collections.Hashtable.Name commit 2

System.Collections.Hashtable.Name commit 3

System.Collections.Hashtable.Name commit 4

System.Collections.Hashtable.Name commit 5

System.Collections.Hashtable.Name commit 1

System.Collections.Hashtable.Name commit 2

System.Collections.Hashtable.Name commit 3

System.Collections.Hashtable.Name commit 4

System.Collections.Hashtable.Name commit 5
