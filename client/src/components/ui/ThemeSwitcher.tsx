import React from 'react';
import { useTheme } from 'next-themes';
import { Switch } from './switch';

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm">🌞</span>
      <Switch
        checked={theme === 'dark'}
        onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
        aria-label="Toggle dark mode"
      />
      <span className="text-sm">🌚</span>
    </div>
  );
} 