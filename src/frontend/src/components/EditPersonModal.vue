<script setup lang="ts">
import { ref, watch } from 'vue';

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

watch(
  () => props.person,
  (p) => {
    if (p) {
      name.value = p.name;
      birthDate.value = p.birthDate ?? '';
      parentId.value = p.parentId;
      parent2Id.value = p.parent2Id;
      newPhoto.value = null;
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
      <div class="modal">
        <h2>Редактировать</h2>

        <form @submit.prevent="onSave">
          <label>
            Имя
            <input v-model="name" type="text" required />
          </label>

          <label>
            Дата рождения
            <input v-model="birthDate" type="date" />
          </label>

          <label>
            Родитель 1
            <select v-model="parentId">
              <option :value="null">— Нет —</option>
              <option v-for="p in availableParents()" :key="p.id" :value="p.id">
                {{ p.name }}
              </option>
            </select>
          </label>

          <label>
            Родитель 2
            <select v-model="parent2Id">
              <option :value="null">— Нет —</option>
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
  padding: 24px;
  border-radius: 12px;
  min-width: 400px;
  max-width: 500px;
  width: 100%;
  box-shadow: var(--shadow-lg);
  font-family: system-ui, sans-serif;
  animation: modalIn 0.2s ease-out;
  color: var(--text-primary);
  transition: background 0.2s, color 0.2s;
}
@keyframes modalIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
h2 {
  margin: 0 0 20px;
  color: var(--text-primary);
}
label {
  display: block;
  margin-bottom: 14px;
  font-size: 14px;
  color: var(--text-secondary);
}
input,
select {
  display: block;
  width: 100%;
  margin-top: 4px;
  padding: 8px;
  font-size: 14px;
  border: 1px solid var(--border-input);
  border-radius: 4px;
  box-sizing: border-box;
  background: var(--bg-input);
  color: var(--text-primary);
  outline: none;
  transition: border-color 0.15s, background 0.2s, color 0.2s;
}
input:focus,
select:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgba(74, 144, 226, 0.15);
}
.buttons {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 20px;
}
button {
  padding: 8px 16px;
  font-size: 14px;
  border-radius: 4px;
  border: 1px solid var(--border-input);
  background: var(--bg-secondary);
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.15s;
}
button:hover {
  background: var(--bg-hover);
}
button.primary {
  background: var(--accent);
  color: white;
  border-color: var(--accent);
}
button.primary:hover {
  background: var(--accent-hover);
  border-color: var(--accent-hover);
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.2s;
}
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
</style>