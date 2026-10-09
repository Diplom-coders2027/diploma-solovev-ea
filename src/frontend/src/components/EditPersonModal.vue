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
}>();

const name = ref('');
const birthDate = ref('');
const parentId = ref<number | null>(null);
const parent2Id = ref<number | null>(null);

watch(
  () => props.person,
  (p) => {
    if (p) {
      name.value = p.name;
      birthDate.value = p.birthDate ?? '';
      parentId.value = p.parentId;
      parent2Id.value = p.parent2Id;
    }
  },
  { immediate: true }
);

function availableParents(): Person[] {
  if (!props.person) return [];
  return props.allPersons.filter((p) => p.id !== props.person!.id);
}

function onSave() {
  if (!props.person || !name.value.trim()) return;
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

        <div class="buttons">
          <button type="button" @click="emit('close')">Отмена</button>
          <button type="submit" class="primary">Сохранить</button>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.modal {
  background: white;
  padding: 24px;
  border-radius: 12px;
  min-width: 400px;
  max-width: 500px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  font-family: system-ui, sans-serif;
}
h2 {
  margin: 0 0 20px;
  color: #000;
}
label {
  display: block;
  margin-bottom: 14px;
  font-size: 14px;
  color: #333;
}
input,
select {
  display: block;
  width: 100%;
  margin-top: 4px;
  padding: 8px;
  font-size: 14px;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-sizing: border-box;
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
  border: 1px solid #ccc;
  background: white;
  cursor: pointer;
}
button.primary {
  background: #4a90e2;
  color: white;
  border-color: #4a90e2;
}
button.primary:hover {
  background: #3a7bc8;
}
</style>