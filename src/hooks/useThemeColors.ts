import { useTheme } from '../contexts/ThemeContext';
import { lightTheme, darkTheme, Theme } from '../components/theme/themes';

export function useThemeColors(): Theme {
  const { isDark } = useTheme();
  return isDark ? darkTheme : lightTheme;
}

