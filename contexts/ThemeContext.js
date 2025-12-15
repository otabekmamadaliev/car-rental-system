import React, { createContext, useContext } from 'react';

const ThemeContext = createContext();

// ═══════════════════════════════════════════════════════════════
// PROFESSIONAL CAR RENTAL DESIGN SYSTEM
// Premium, Modern, Trustworthy
// Designer: Senior UX/UI - Luxury Automotive Theme
// ═══════════════════════════════════════════════════════════════

export const theme = {
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // CORE BRAND COLORS - Luxury Automotive
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  primary: '#1A1A2E',           // Deep Navy - Trust, Sophistication
  primaryLight: '#2D2D44',
  primaryDark: '#0F0F1D',
  primaryForeground: '#FFFFFF',
  
  secondary: '#FF6B35',         // Vibrant Orange - Energy, Action
  secondaryLight: '#FF8C5A',
  secondaryDark: '#E85A2A',
  secondaryForeground: '#FFFFFF',
  
  accent: '#00D9FF',            // Electric Cyan - Modern, Tech
  accentLight: '#33E3FF',
  accentDark: '#00B8DB',
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // NEUTRAL PALETTE - Clean & Minimal
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  background: '#FAFBFC',        // Ultra light gray
  backgroundAlt: '#F5F6F8',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  surfaceGlass: 'rgba(255, 255, 255, 0.92)',
  
  border: '#E8EAED',
  borderLight: '#F0F1F3',
  borderDark: '#D1D5DB',
  divider: '#E8EAED',
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // TEXT HIERARCHY - Perfect Readability
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  text: '#1A1A2E',
  textPrimary: '#1A1A2E',       // Deep Navy
  textSecondary: '#6B7280',     // Medium Gray
  textTertiary: '#9CA3AF',      // Light Gray
  textHover: '#FF6B35',         // Orange hover
  textPress: '#E85A2A',
  textDisabled: 'rgba(107, 114, 128, 0.4)',
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // ICON COLORS - Clear Visual Hierarchy
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  iconDefault: '#6B7280',
  iconActive: '#FF6B35',
  iconInactive: '#D1D5DB',
  iconHover: '#FF8C5A',
  iconPress: '#E85A2A',
  iconDisabled: 'rgba(107, 114, 128, 0.3)',
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // STATUS COLORS - Clear Communication
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  success: '#10B981',
  successLight: '#34D399',
  successDark: '#059669',
  successForeground: '#FFFFFF',
  
  warning: '#F59E0B',
  warningLight: '#FBBF24',
  warningDark: '#D97706',
  warningForeground: '#FFFFFF',
  
  error: '#EF4444',
  errorLight: '#F87171',
  errorDark: '#DC2626',
  errorForeground: '#FFFFFF',
  
  info: '#00D9FF',
  infoLight: '#33E3FF',
  infoDark: '#00B8DB',
  infoForeground: '#1A1A2E',
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // COMPONENT SPECIFIC - Pixel Perfect
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  // Cards - Premium Feel
  cardBackground: '#FFFFFF',
  cardBorder: '#E8EAED',
  cardShadow: 'rgba(26, 26, 46, 0.06)',
  cardHover: '#FAFBFC',
  
  // Search - Clean & Modern
  searchBackground: '#F5F6F8',
  searchBorder: '#E8EAED',
  searchBorderFocus: '#00D9FF',
  searchIcon: '#6B7280',
  searchPlaceholder: '#9CA3AF',
  
  // Input Fields - Clear States
  inputBackground: '#FFFFFF',
  inputBorder: '#E8EAED',
  inputFocusBorder: '#00D9FF',
  inputErrorBorder: '#EF4444',
  inputText: '#1A1A2E',
  inputPlaceholder: '#9CA3AF',
  
  // Buttons - Clear Hierarchy
  buttonPrimary: '#FF6B35',
  buttonPrimaryHover: '#FF8C5A',
  buttonPrimaryPressed: '#E85A2A',
  buttonPrimaryText: '#FFFFFF',
  buttonPrimaryDisabled: 'rgba(255, 107, 53, 0.4)',
  
  buttonSecondary: '#1A1A2E',
  buttonSecondaryHover: '#2D2D44',
  buttonSecondaryPressed: '#0F0F1D',
  buttonSecondaryText: '#FFFFFF',
  buttonSecondaryDisabled: 'rgba(26, 26, 46, 0.4)',
  
  buttonOutline: 'transparent',
  buttonOutlineBorder: '#E8EAED',
  buttonOutlineHover: '#F5F6F8',
  buttonOutlineText: '#1A1A2E',
  
  // Chips & Tags - Subtle & Clean
  chipBackground: '#F5F6F8',
  chipText: '#1A1A2E',
  chipBorder: '#E8EAED',
  chipHover: '#E8EAED',
  chipActive: '#FF6B35',
  chipActiveText: '#FFFFFF',
  
  // Categories - Clear Selection
  categoryBackground: '#F5F6F8',
  categoryActiveBackground: '#FF6B35',
  categoryText: '#6B7280',
  categoryActiveText: '#FFFFFF',
  categoryBorder: 'transparent',
  categoryActiveBorder: '#FF6B35',
  
  // Navigation - Premium Glass Effect
  navBackground: '#FFFFFF',
  navBackgroundGlass: 'rgba(255, 255, 255, 0.92)',
  navActive: '#FF6B35',
  navInactive: '#9CA3AF',
  navBorder: 'rgba(232, 234, 237, 0.8)',
  navShadow: 'rgba(26, 26, 46, 0.04)',
  
  // Menu - Smooth Interactions
  menuBackground: '#FFFFFF',
  menuBorder: '#E8EAED',
  menuItemHover: '#FAFBFC',
  menuItemActive: '#FFF5F2',
  
  // Disabled States - Clear Feedback
  disabledBackground: '#F5F6F8',
  disabledBorder: '#E8EAED',
  disabledText: 'rgba(26, 26, 46, 0.4)',
  
  // Shadows - Subtle Depth
  shadowColor: '#1A1A2E',
  shadowLight: 'rgba(26, 26, 46, 0.04)',
  shadowMedium: 'rgba(26, 26, 46, 0.08)',
  shadowStrong: 'rgba(26, 26, 46, 0.12)',
  
  // Favorites - Eye-Catching
  favoriteActive: '#FF1744',
  favoriteInactive: '#D1D5DB',
  
  // Modal & Dialog - Clear Overlay
  modalOverlay: 'rgba(26, 26, 46, 0.6)',
  modalBackground: 'rgba(255, 255, 255, 0.96)',
  modalSurface: '#FFFFFF',
  dialogPrimary: '#FF6B35',
  dialogSecondary: '#1A1A2E',
  
  // Toasts - Clear Notifications
  toastInfo: '#00D9FF',
  toastSuccess: '#10B981',
  toastWarning: '#F59E0B',
  toastError: '#EF4444',
  
  // Premium Effects
  glassBackground: 'rgba(255, 255, 255, 0.92)',
  glassBorder: 'rgba(232, 234, 237, 0.5)',
  neonGlow: 'rgba(255, 107, 53, 0.25)',
  focusRing: '#00D9FF',
  gradient: 'linear-gradient(135deg, #FF6B35 0%, #FF8C5A 100%)',
};

export const ThemeProvider = ({ children }) => {
  return (
    <ThemeContext.Provider value={{ theme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
