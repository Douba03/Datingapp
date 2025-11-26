// Theme colors for light and dark modes

export const lightTheme = {
  primary: '#6366F1', // Modern indigo/purple
  secondary: '#F97316', // Vibrant coral/orange
  accent: '#10B981', // Fresh emerald green
  background: '#FAFBFC', // Soft warm white
  surface: '#FFFFFF',
  text: '#1F2937', // Darker, more readable
  textSecondary: '#6B7280', // Softer gray
  border: '#E5E7EB', // Lighter border
  success: '#10B981', // Emerald green
  warning: '#F59E0B', // Amber
  error: '#EF4444', // Modern red
  like: '#EC4899', // Pink for likes
  pass: '#9CA3AF', // Neutral gray
  superlike: '#8B5CF6', // Purple for superlike
  card: '#FFFFFF',
  shadow: 'rgba(0, 0, 0, 0.08)',
};

export const darkTheme = {
  primary: '#818CF8', // Lighter indigo for dark mode
  secondary: '#FB923C', // Lighter coral for dark mode
  accent: '#34D399', // Lighter emerald for dark mode
  background: '#111827', // Dark blue-gray
  surface: '#1F2937', // Darker surface
  text: '#F9FAFB', // Almost white
  textSecondary: '#D1D5DB', // Light gray
  border: '#374151', // Dark border
  success: '#34D399', // Lighter emerald
  warning: '#FBBF24', // Lighter amber
  error: '#F87171', // Lighter red
  like: '#F472B6', // Lighter pink
  pass: '#6B7280', // Medium gray
  superlike: '#A78BFA', // Lighter purple
  card: '#1F2937',
  shadow: 'rgba(0, 0, 0, 0.5)',
};

export type Theme = typeof lightTheme;

