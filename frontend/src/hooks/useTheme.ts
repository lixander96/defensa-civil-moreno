import { useState, useEffect, useCallback } from 'react';

type Theme = 'dark' | 'light';

export function useTheme() {
  const [theme, setTheme] = useState<Theme>('dark'); // Modo oscuro por defecto

  // Initialize theme from localStorage once
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('theme') as Theme;
      if (savedTheme && (savedTheme === 'dark' || savedTheme === 'light')) {
        setTheme(savedTheme);
      }
    } catch (error) {
      console.warn('Failed to load theme from localStorage:', error);
    }
  }, []);

  // Apply theme changes to DOM and localStorage
  useEffect(() => {
    try {
      const root = document.documentElement;
      
      // Only modify DOM if necessary
      if (theme === 'dark' && !root.classList.contains('dark')) {
        root.classList.add('dark');
      } else if (theme === 'light' && root.classList.contains('dark')) {
        root.classList.remove('dark');
      }
      
      // Save to localStorage
      localStorage.setItem('theme', theme);
    } catch (error) {
      console.warn('Failed to apply theme:', error);
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  }, []);

  const setThemeValue = useCallback((newTheme: Theme) => {
    setTheme(newTheme);
  }, []);

  return {
    theme,
    setTheme: setThemeValue,
    toggleTheme
  };
}