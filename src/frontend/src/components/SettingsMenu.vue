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
    <button class="settings-btn" @click="toggle" title="Настройки">
      ⚙️
    </button>

    <div v-if="isOpen" class="menu">
      <div class="menu-title">Тема оформления</div>

      <button
        :class="['menu-item', { active: currentTheme === 'light' }]"
        @click="selectTheme('light')"
      >
        <span class="icon">🌞</span>
        <span>Светлая</span>
        <span v-if="currentTheme === 'light'" class="check">✓</span>
      </button>

      <button
        :class="['menu-item', { active: currentTheme === 'dark' }]"
        @click="selectTheme('dark')"
      >
        <span class="icon">🌙</span>
        <span>Тёмная</span>
        <span v-if="currentTheme === 'dark'" class="check">✓</span>
      </button>

      <button
        :class="['menu-item', { active: currentTheme === 'system' }]"
        @click="selectTheme('system')"
      >
        <span class="icon">💻</span>
        <span>Системная</span>
        <span v-if="currentTheme === 'system'" class="check">✓</span>
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
  font-size: 20px;
  border: 1px solid var(--border-color);
  background: var(--bg-secondary);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.15s;
  display: flex;
  align-items: center;
  justify-content: center;
}
.settings-btn:hover {
  background: var(--bg-hover);
  border-color: var(--accent);
}
.menu {
  position: absolute;
  top: 48px;
  right: 0;
  background: var(--bg-elevated);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  box-shadow: var(--shadow-lg);
  padding: 8px;
  min-width: 200px;
  z-index: 1000;
  animation: fadeIn 0.15s ease-out;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-4px); }
  to { opacity: 1; transform: translateY(0); }
}
.menu-title {
  font-size: 12px;
  color: var(--text-muted);
  padding: 8px 12px 4px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.menu-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px 12px;
  font-size: 14px;
  color: var(--text-primary);
  background: transparent;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.15s;
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
  font-size: 16px;
}
.menu-item .check {
  margin-left: auto;
  color: var(--accent);
}
</style>