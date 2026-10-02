import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';
import { systemPrefersDark, useUiStore } from '../state/uiStore';
import { IconButton } from './ui/IconButton';

function useIsDark(): boolean {
  const theme = useUiStore((s) => s.theme);
  const [systemDark, setSystemDark] = useState(systemPrefersDark);
  useEffect(() => {
    const query = window.matchMedia('(prefers-color-scheme: dark)');
    const update = () => setSystemDark(query.matches);
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  return theme === 'dark' || (theme === 'system' && systemDark);
}

export function ThemeToggle({ size = 'md' }: { size?: 'sm' | 'md' }) {
  const toggleTheme = useUiStore((s) => s.toggleTheme);
  const dark = useIsDark();
  return (
    <IconButton label={dark ? 'Switch to light theme' : 'Switch to dark theme'} size={size} onClick={toggleTheme}>
      {dark ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}
    </IconButton>
  );
}
