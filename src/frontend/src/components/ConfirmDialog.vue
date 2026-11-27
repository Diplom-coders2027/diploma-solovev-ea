<script setup lang="ts">
defineProps<{
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
</script>

<template>
  <Transition name="modal-fade">
    <div v-if="show" class="modal-overlay" @click.self="emit('cancel')">
      <div class="modal" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title">
        <h3 id="confirm-title">{{ title }}</h3>
        <p>{{ message }}</p>

        <div class="buttons">
          <button class="btn cancel" @click="emit('cancel')">
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

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(10, 10, 12, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 20px;
}

.modal {
  background: var(--bg-elevated);
  padding: 28px 28px 22px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  max-width: 440px;
  width: 100%;
  box-shadow: var(--shadow-lg);
  color: var(--text-primary);
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
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 500;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-input);
  background: transparent;
  color: var(--text-primary);
  transition: background-color 0.15s, border-color 0.15s;
  min-width: 96px;
}
.btn:hover {
  background: var(--bg-hover);
}

.btn.confirm {
  background: var(--accent);
  color: var(--on-accent);
  border-color: var(--accent);
}
.btn.confirm:hover {
  background: var(--accent-hover);
  border-color: var(--accent-hover);
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

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.15s;
}
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

/* ---------- Мягкие формы и движение ---------- */
.modal-overlay {
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
}
.modal {
  border-radius: var(--radius-lg);
  animation: modalIn 0.3s var(--ease);
}
@keyframes modalIn {
  from { opacity: 0; transform: translateY(14px) scale(0.95); }
  to { opacity: 1; transform: none; }
}
.btn,
button {
  border-radius: 999px;
}

/* ---------- Анимации кнопок ---------- */
.btn {
  position: relative;
  overflow: hidden;
  transition: background-color 0.15s, border-color 0.15s, transform 0.25s var(--ease), box-shadow 0.25s;
}
.btn:hover {
  transform: translateY(-2px);
}
.btn:active {
  transform: scale(0.97);
}
.btn.confirm:hover {
  box-shadow: 0 8px 20px var(--accent-ring);
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
</style>
