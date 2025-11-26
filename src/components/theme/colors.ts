// 💕 Romantic Dating App Color Palette
// A warm, inviting palette designed for connection and romance

export const colors = {
  // Primary - Romantic Rose/Coral gradient base
  primary: '#FF6B8A', // Warm rose pink
  primaryDark: '#E8547A', // Deeper rose
  primaryLight: '#FF8FA3', // Soft blush
  
  // Secondary - Passion Purple
  secondary: '#9B5DE5', // Vibrant purple
  secondaryDark: '#7B4BC2', // Deep purple
  secondaryLight: '#B88AE8', // Lavender
  
  // Accent - Golden Warmth
  accent: '#FFB347', // Warm amber
  accentGold: '#FFD700', // Bright gold for premium/special
  
  // Backgrounds - Soft & Inviting
  background: '#FDF8F8', // Warm off-white with pink tint
  backgroundDark: '#1A1625', // Dark mode: deep purple-black
  surface: '#FFFFFF',
  surfaceElevated: '#FFFAFA', // Snow white with warmth
  
  // Text
  text: '#2D2438', // Deep purple-gray
  textSecondary: '#7A6B8A', // Muted purple-gray
  textLight: '#B8A9C9', // Light purple-gray
  textOnPrimary: '#FFFFFF',
  
  // Borders
  border: '#F0E6ED', // Soft pink-gray
  borderLight: '#FAF4F7', // Very light pink
  
  // Status Colors
  success: '#4ECDC4', // Teal success
  warning: '#FFB347', // Amber warning
  error: '#FF6B6B', // Coral red
  
  // Swipe Action Colors - Emotional & Clear
  like: '#FF6B8A', // Rose pink - Love/Like
  likeShadow: 'rgba(255, 107, 138, 0.4)',
  pass: '#A8A3B3', // Muted gray - Pass
  passShadow: 'rgba(168, 163, 179, 0.4)',
  superlike: '#9B5DE5', // Purple - Super special
  superlikeShadow: 'rgba(155, 93, 229, 0.4)',
  
  // Match Celebration
  matchPink: '#FF6B8A',
  matchPurple: '#9B5DE5',
  matchGold: '#FFD700',
  
  // Gradients (as string arrays for LinearGradient)
  gradientPrimary: ['#FF6B8A', '#FF8FA3', '#FFB3C1'],
  gradientRomantic: ['#FF6B8A', '#9B5DE5'],
  gradientSunset: ['#FF6B8A', '#FFB347'],
  gradientPremium: ['#FFD700', '#FFA500', '#FF6B8A'],
  gradientDark: ['#2D2438', '#1A1625'],
  
  // Overlay
  overlay: 'rgba(26, 22, 37, 0.85)',
  overlayLight: 'rgba(255, 255, 255, 0.95)',
  
  // Special Effects
  glow: 'rgba(255, 107, 138, 0.3)',
  sparkle: '#FFD700',
};

// Animation timing presets
export const timing = {
  fast: 150,
  normal: 300,
  slow: 500,
  bounce: 600,
};

// Shadow presets
export const shadows = {
  small: {
    shadowColor: '#2D2438',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  medium: {
    shadowColor: '#2D2438',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
  },
  large: {
    shadowColor: '#2D2438',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
  },
  glow: {
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
};
