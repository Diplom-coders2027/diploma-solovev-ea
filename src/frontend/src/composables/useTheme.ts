import { ref, watch } from 'vue';

type Theme = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'family-archive-theme';

const currentTheme = ref<Theme>(
  (localStorage.getItem(STORAGE_KEY) as Theme) || 'system'
);

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

  let effective: 'light' | 'dark';
  if (theme === 'system') {
    effective = systemDark ? 'dark' : 'light';
  } else {
    effective = theme;
  }

  root.setAttribute('data-theme', effective);
}

function setTheme(theme: Theme) {
  currentTheme.value = theme;
  localStorage.setItem(STORAGE_KEY, theme);
  applyTheme(theme);
}

// Следим за системной темой
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
  if (currentTheme.value === 'system') {
    applyTheme('system');
  }
});

// Применяем тему при загрузке
applyTheme(currentTheme.value);

export function useTheme() {
  return {
    currentTheme,
    setTheme,
  };
}