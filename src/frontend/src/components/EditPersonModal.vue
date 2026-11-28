<script setup lang="ts">
import { ref, watch, nextTick } from 'vue';

interface Person {
  id: number;
  name: string;
  birthDate: string | null;
  parentId: number | null;
  parent2Id: number | null;
  photoUrl: string | null;
}

const props = defineProps<{
  person: Person | null;
  allPersons: Person[];
}>();

const emit = defineEmits<{
  (e: 'save', data: {
    id: number;
    name: string;
    birthDate: string | null;
    parentId: number | null;
    parent2Id: number | null;
  }): void;
  (e: 'close'): void;
  (e: 'photo', data: { id: number; file: File }): void;
}>();

const name = ref('');
const birthDate = ref('');
const parentId = ref<number | null>(null);
const parent2Id = ref<number | null>(null);
const newPhoto = ref<File | null>(null);

// Ссылка на поле ввода имени
const nameInputRef = ref<HTMLInputElement | null>(null);
// Запоминаем элемент, с которого открылось окно
let previouslyFocusedElement: HTMLElement | null = null;

watch(
  () => props.person,
  (p) => {
    if (p) {
      name.value = p.name;
      birthDate.value = p.birthDate ?? '';
      parentId.value = p.parentId;
      parent2Id.value = p.parent2Id;
      newPhoto.value = null;

      // Запоминаем активный элемент до открытия модалки
      previouslyFocusedElement = document.activeElement as HTMLElement;
      
      // Переводим фокус на поле "Имя" после отрисовки
      nextTick(() => {
        nameInputRef.value?.focus();
      });
    } else {
      // Возвращаем фокус обратно после закрытия
      if (previouslyFocusedElement) {
        previouslyFocusedElement.focus();
        previouslyFocusedElement = null;
      }
    }
  },
  { immediate: true }
);

function availableParents(): Person[] {
  if (!props.person) return [];
  return props.allPersons.filter((p) => p.id !== props.person!.id);
}

function onPhotoSelect(event: Event) {
  const input = event.target as HTMLInputElement;
  if (input.files && input.files[0]) {
    newPhoto.value = input.files[0];
  }
}

function onSave() {
  if (!props.person || !name.value.trim()) return;

  if (newPhoto.value) {
    emit('photo', { id: props.person.id, file: newPhoto.value });
  }

  emit('save', {
    id: props.person.id,
    name: name.value.trim(),
    birthDate: birthDate.value || null,
    parentId: parentId.value,
    parent2Id: parent2Id.value,
  });
}
</script>

<template>
  <Transition name="modal-fade">
    <div v-if="person" class="modal-overlay" @click.self="emit('close')">
      <div class="modal" role="dialog" aria-modal="true" aria-labelledby="edit-title">
        <h2 id="edit-title">Редактировать</h2>

        <form @submit.prevent="onSave">
          <label>
            Имя
            <!-- Добавили ref="nameInputRef" -->
            <input 
              ref="nameInputRef" 
              v-model="name" 
              type="text" 
              required 
            />
          </label>

          <label>
            Дата рождения
            <input v-model="birthDate" type="date" />
          </label>

          <label>
            Родитель 1
            <select v-model="parentId">
              <option :value="null">Не указан</option>
              <option v-for="p in availableParents()" :key="p.id" :value="p.id">
                {{ p.name }}
              </option>
            </select>
          </label>

          <label>
            Родитель 2
            <select v-model="parent2Id">
              <option :value="null">Не указан</option>
              <option v-for="p in availableParents()" :key="p.id" :value="p.id">
                {{ p.name }}
              </option>
            </select>
          </label>

          <label>
            Фото
            <input type="file" accept="image/*" @change="onPhotoSelect" />
          </label>

          <div class="buttons">
            <button type="button" @click="emit('close')">Отмена</button>
            <button type="submit" class="primary">Сохранить</button>
          </div>
        </form>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
/* ... (стили полностью совпадают с вашим исходным кодом) ... */
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
  padding: 28px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  max-width: 480px;
  width: 100%;
  max-height: calc(100vh - 40px);
  overflow-y: auto;
  box-shadow: var(--shadow-lg);
  color: var(--text-primary);
  animation: modalIn 0.3s var(--ease);
}
@keyframes modalIn {
  from { opacity: 0; transform: translateY(14px) scale(0.95); }
  to { opacity: 1; transform: none; }
}
h2 {
  margin: 0 0 22px;
  font-size: 24px;
  line-height: 1.2;
  color: var(--text-primary);
}
label {
  display: block;
  margin-bottom: 16px;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary);
}
input,
select {
  display: block;
  width: 100%;
  margin-top: 6px;
  padding: 10px 12px;
  font-size: 15px;
  font-weight: 400;
  border: 1px solid var(--border-input);
  border-radius: var(--radius-sm);
  background: var(--bg-input);
  color: var(--text-primary);
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
}
input:focus,
select:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-ring);
}
input[type="file"] {
  padding: 8px;
  font-size: 14px;
}
.buttons {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 24px;
}
button {
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
}
button:hover {
  background: var(--bg-hover);
  transform: translateY(-2px);
}
button:active {
  transform: scale(0.97);
}
button.primary {
  background: var(--accent);
  color: var(--on-accent);
  border-color: var(--accent);
}
button.primary:hover {
  background: var(--accent-hover);
  border-color: var(--accent-hover);
  box-shadow: 0 8px 20px var(--accent-ring);
}
button.primary::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(110deg, transparent 30%, rgba(255, 255, 255, 0.3) 50%, transparent 70%);
  transform: translateX(-120%);
}
button.primary:hover::after {
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