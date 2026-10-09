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
      <div class="modal">
        <div class="icon" :class="{ danger }">
          {{ danger ? '⚠️' : '❓' }}
        </div>
        <h3>{{ title }}</h3>
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
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 20px;
}

.modal {
  background: var(--bg-elevated);
  padding: 28px 24px 20px;
  border-radius: 16px;
  max-width: 420px;
  width: 100%;
  text-align: center;
  box-shadow: var(--shadow-lg);
  font-family: system-ui, sans-serif;
  color: var(--text-primary);
  animation: modalIn 0.2s ease-out;
}
@keyframes modalIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.icon {
  font-size: 44px;
  line-height: 1;
  margin-bottom: 12px;
}
.icon.danger {
  animation: shake 0.4s;
}
@keyframes shake {
  0%, 100% { transform: rotate(0); }
  25% { transform: rotate(-10deg); }
  75% { transform: rotate(10deg); }
}

h3 {
  margin: 0 0 8px;
  font-size: 20px;
  color: var(--text-primary);
}

p {
  margin: 0 0 24px;
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.5;
}

.buttons {
  display: flex;
  gap: 10px;
  justify-content: center;
}

.btn {
  padding: 10px 24px;
  font-size: 14px;
  font-weight: 500;
  border-radius: 10px;
  cursor: pointer;
  border: 1px solid var(--border-input);
  background: var(--bg-secondary);
  color: var(--text-primary);
  transition: all 0.15s;
  min-width: 100px;
}
.btn:hover {
  background: var(--bg-hover);
}

.btn.confirm {
  background: var(--accent);
  color: white;
  border-color: var(--accent);
}
.btn.confirm:hover {
  background: var(--accent-hover);
  border-color: var(--accent-hover);
}

.btn.confirm.danger {
  background: #e74c3c;
  border-color: #e74c3c;
}
.btn.confirm.danger:hover {
  background: #c0392b;
  border-color: #c0392b;
}

/* Плавное появление */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.2s;
}
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
</style>