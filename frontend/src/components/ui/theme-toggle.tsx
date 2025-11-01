import * as React from 'react';
import { Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ThemeToggle: React.FC = () => {
  const [isDark, setIsDark] = React.useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('theme');
      if (stored) return stored === 'dark';
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch (e) {
      return false;
    }
  });

  React.useEffect(() => {
    try {
      const root = document.documentElement;
      if (isDark) root.classList.add('dark');
      else root.classList.remove('dark');
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
    } catch (e) {
      /* ignore */
    }
  }, [isDark]);

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setIsDark((v) => !v)}
      aria-pressed={isDark}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {/* Icon animates slightly on toggle for visual feedback */}
      {isDark ? (
        <Sun className={`h-4 w-4 transition-transform duration-200 transform ${isDark ? 'rotate-0 scale-100' : '-rotate-12 scale-95'}`} />
      ) : (
        <Moon className={`h-4 w-4 transition-transform duration-200 transform ${isDark ? 'rotate-0 scale-100' : '-rotate-12 scale-95'}`} />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
};

export default ThemeToggle;
