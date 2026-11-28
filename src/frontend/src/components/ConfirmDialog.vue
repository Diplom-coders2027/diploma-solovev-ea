<script setup lang="ts">
import { ref, watch, nextTick } from 'vue';

const props = defineProps<{
  show: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
}>();

const emit = defineEmits<{
  (e: 'confirm'): void;
  (e: 'cancel'): void;
}>();

// Ссылка на кнопку "Отмена"
const cancelBtnRef = ref<HTMLButtonElement | null>(null);
// Запоминаем, какой элемент был в фокусе до открытия
let previouslyFocusedElement: HTMLElement | null = null;

watch(
  () => props.show,
  (isOpen) => {
    if (isOpen) {
      // Запоминаем активный элемент перед открытием
      previouslyFocusedElement = document.activeElement as HTMLElement;
      
      // Переводим фокус на кнопку "Отмена" после отрисовки
      nextTick(() => {
        cancelBtnRef.value?.focus();
      });
    } else {
      // Возвращаем фокус обратно после закрытия
      if (previouslyFocusedElement) {
        previouslyFocusedElement.focus();
        previouslyFocusedElement = null;
      }
    }
  }
);
</script>

<template>
  <Transition name="modal-fade">
    <div v-if="show" class="modal-overlay" @click.self="emit('cancel')">
      <div class="modal" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title">
        <h3 id="confirm-title">{{ title }}</h3>
        <p>{{ message }}</p>

        <div class="buttons">
          <!-- Добавили ref="cancelBtnRef" -->
          <button 
            ref="cancelBtnRef"
            class="btn cancel" 
            @click="emit('cancel')"
          >
            {{ cancelText || 'Отмена' }}
          </button>
          <button
            class="btn confirm"
            :class="{ danger }"
            @click="emit('confirm')"
          >
            {{ confirmText || 'OK' }}
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<!-- Стили оставляем без изменений -->
<style scoped>
/* ... весь ваш блок стилей остаётся как был ... */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(10, 10, 12, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 20px;
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
}

.modal {
  background: var(--bg-elevated);
  padding: 28px 28px 22px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  max-width: 440px;
  width: 100%;
  box-shadow: var(--shadow-lg);
  color: var(--text-primary);
  animation: modalIn 0.3s var(--ease);
}

@keyframes modalIn {
  from { opacity: 0; transform: translateY(14px) scale(0.95); }
  to { opacity: 1; transform: none; }
}

h3 {
  margin: 0 0 10px;
  font-size: 22px;
  line-height: 1.2;
  color: var(--text-primary);
}

p {
  margin: 0 0 26px;
  font-size: 15px;
  color: var(--text-secondary);
  line-height: 1.55;
}

.buttons {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.btn {
  position: relative;
  overflow: hidden;
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 500;
  border-radius: 999px;
  border: 1px solid var(--border-input);
  background: transparent;
  color: var(--text-primary);
  transition: background-color 0.15s, border-color 0.15s, transform 0.25s var(--ease), box-shadow 0.25s;
  min-width: 96px;
}
.btn:hover {
  background: var(--bg-hover);
  transform: translateY(-2px);
}
.btn:active {
  transform: scale(0.97);
}

.btn.confirm {
  background: var(--accent);
  color: var(--on-accent);
  border-color: var(--accent);
}
.btn.confirm:hover {
  background: var(--accent-hover);
  border-color: var(--accent-hover);
  box-shadow: 0 8px 20px var(--accent-ring);
}

.btn.confirm.danger {
  background: var(--danger-solid);
  border-color: var(--danger-solid);
  color: #fff;
}
.btn.confirm.danger:hover {
  background: var(--danger-solid-hover);
  border-color: var(--danger-solid-hover);
}

.btn.confirm::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(110deg, transparent 30%, rgba(255, 255, 255, 0.3) 50%, transparent 70%);
  transform: translateX(-120%);
}
.btn.confirm:hover::after {
  transform: translateX(120%);
  transition: transform 0.75s var(--ease);
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.15s;
}
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
</style>