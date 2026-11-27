<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useTheme } from '../composables/useTheme';

const { currentTheme, setTheme } = useTheme();

const isOpen = ref(false);
const menuRef = ref<HTMLElement | null>(null);

function toggle() {
  isOpen.value = !isOpen.value;
}

function selectTheme(theme: 'light' | 'dark' | 'system') {
  setTheme(theme);
  isOpen.value = false;
}

function onClickOutside(event: MouseEvent) {
  if (menuRef.value && !menuRef.value.contains(event.target as Node)) {
    isOpen.value = false;
  }
}

onMounted(() => {
  document.addEventListener('mousedown', onClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('mousedown', onClickOutside);
});
</script>

<template>
  <div class="settings" ref="menuRef">
    <button
      class="settings-btn"
      @click="toggle"
      title="Настройки"
      aria-label="Настройки"
      aria-haspopup="true"
      :aria-expanded="isOpen"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="3.2" />
        <path d="M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21M5.6 5.6l1.8 1.8M16.6 16.6l1.8 1.8M5.6 18.4l1.8-1.8M16.6 7.4l1.8-1.8" />
      </svg>
    </button>

    <div v-if="isOpen" class="menu" role="menu">
      <div class="menu-title">Тема оформления</div>

      <button
        :class="['menu-item', { active: currentTheme === 'light' }]"
        role="menuitemradio"
        :aria-checked="currentTheme === 'light'"
        @click="selectTheme('light')"
      >
        <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4L7 17M17 7l1.4-1.4" />
        </svg>
        <span>Светлая</span>
        <svg v-if="currentTheme === 'light'" class="check" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
      </button>

      <button
        :class="['menu-item', { active: currentTheme === 'dark' }]"
        role="menuitemradio"
        :aria-checked="currentTheme === 'dark'"
        @click="selectTheme('dark')"
      >
        <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z" />
        </svg>
        <span>Тёмная</span>
        <svg v-if="currentTheme === 'dark'" class="check" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
      </button>

      <button
        :class="['menu-item', { active: currentTheme === 'system' }]"
        role="menuitemradio"
        :aria-checked="currentTheme === 'system'"
        @click="selectTheme('system')"
      >
        <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
          <rect x="3" y="4" width="18" height="12" rx="1.5" />
          <path d="M9 20h6M12 16v4" />
        </svg>
        <span>Как в системе</span>
        <svg v-if="currentTheme === 'system'" class="check" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
      </button>
    </div>
  </div>
</template>

<style scoped>
.settings {
  position: relative;
}
.settings-btn {
  width: 40px;
  height: 40px;
  border: 1px solid var(--border-color);
  background: var(--bg-secondary);
  color: var(--text-secondary);
  border-radius: var(--radius-md);
  transition: background-color 0.15s, border-color 0.15s, color 0.15s;
  display: flex;
  align-items: center;
  justify-content: center;
}
.settings-btn:hover {
  background: var(--bg-hover);
  border-color: var(--border-strong);
  color: var(--accent);
}
svg {
  fill: none;
  stroke: currentColor;
  stroke-width: 1.7;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.settings-btn svg {
  width: 22px;
  height: 22px;
}
.menu {
  position: absolute;
  top: 48px;
  right: 0;
  background: var(--bg-elevated);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  padding: 6px;
  min-width: 210px;
  z-index: 1000;
}
.menu-title {
  font-size: 13px;
  color: var(--text-muted);
  padding: 8px 10px 6px;
}
.menu-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 9px 10px;
  font-size: 14px;
  color: var(--text-primary);
  background: transparent;
  border: none;
  border-radius: var(--radius-sm);
  transition: background-color 0.15s;
  text-align: left;
}
.menu-item:hover {
  background: var(--bg-hover);
}
.menu-item.active {
  color: var(--accent);
  font-weight: 500;
}
.menu-item .icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}
.menu-item .check {
  width: 16px;
  height: 16px;
  margin-left: auto;
  stroke-width: 2.2;
}

/* ---------- Мягкие формы и движение ---------- */
.settings-btn { border-radius: 50%; }
.settings-btn svg { transition: transform 0.5s var(--ease); }
.settings-btn:hover svg { transform: rotate(75deg); }
.menu {
  border-radius: var(--radius-md);
  transform-origin: top right;
  animation: menuIn 0.22s var(--ease);
}
@keyframes menuIn {
  from { opacity: 0; transform: scale(0.92) translateY(-6px); }
  to { opacity: 1; transform: none; }
}
.menu-item { border-radius: var(--radius-sm); }

/* ---------- Анимации кнопок ---------- */
.settings-btn {
  transition: background-color 0.15s, border-color 0.15s, color 0.15s, transform 0.25s var(--ease);
}
.settings-btn:hover {
  transform: scale(1.08);
}
.menu-item {
  transition: background-color 0.15s, padding-left 0.25s var(--ease);
}
.menu-item:hover {
  padding-left: 14px;
}
.menu-item .icon {
  transition: transform 0.3s var(--ease);
}
.menu-item:hover .icon {
  transform: scale(1.18) rotate(-10deg);
}
.menu-item .check {
  animation: popIn 0.3s var(--ease);
}
</style>
