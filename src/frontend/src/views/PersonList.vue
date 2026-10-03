
<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import axios from 'axios';
import { VueFlow } from '@vue-flow/core';
import PersonCard from '../components/PersonCard.vue';

import '@vue-flow/core/dist/style.css';
import '@vue-flow/core/dist/theme-default.css';

interface Person {
  id: number;
  name: string;
  birthDate: string | null;
  parentId: number | null;
  photoUrl: string | null;
  children: Person[];
}

const API = 'http://localhost:3000';

const treeData = ref<Person[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);

const newName = ref('');
const newBirthDate = ref('');
const newParentId = ref<number | null>(null);
const flatPersons = ref<Person[]>([]);
const selectedFile = ref<File | null>(null);

// Преобразуем иерархию в формат Vue Flow
const elements = computed(() => {
  const nodes: any[] = [];
  const edges: any[] = [];

  const traverse = (
    persons: Person[],
    x = 0,
    y = 0,
    gapX = 220,
    gapY = 140
  ) => {
    persons.forEach((p, i) => {
      nodes.push({
        id: String(p.id),
        position: { x: x + i * gapX, y },
        data: p,
        type: 'custom',
      });

      if (p.children && p.children.length > 0) {
        p.children.forEach((child) => {
          edges.push({
            id: `e${p.id}-${child.id}`,
            source: String(p.id),
            target: String(child.id),
          });
        });
        traverse(p.children, x, y + gapY, gapX / 1.5);
      }
    });
  };

  traverse(treeData.value);
  return { nodes, edges };
});

async function loadTree() {
  loading.value = true;
  error.value = null;
  try {
    const res = await axios.get<Person[]>(`${API}/persons/tree`);
    treeData.value = res.data;

    const flatRes = await axios.get<Person[]>(`${API}/persons`);
    flatPersons.value = flatRes.data;
  } catch (e) {
    error.value = 'Не удалось загрузить данные';
    console.error(e);
  } finally {
    loading.value = false;
  }
}

function onFileSelect(event: Event) {
  const input = event.target as HTMLInputElement;
  if (input.files && input.files[0]) {
    selectedFile.value = input.files[0];
  }
}

async function uploadPhoto(personId: number) {
  if (!selectedFile.value) return;
  const formData = new FormData();
  formData.append('photo', selectedFile.value);
  await axios.post(`${API}/persons/${personId}/photo`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}

async function addPerson() {
  if (!newName.value.trim()) return;
  try {
    const res = await axios.post<Person>(`${API}/persons`, {
      name: newName.value.trim(),
      birthDate: newBirthDate.value || null,
      parentId: newParentId.value ?? null,
    });

    if (selectedFile.value) {
      await uploadPhoto(res.data.id);
    }

    newName.value = '';
    newBirthDate.value = '';
    newParentId.value = null;
    selectedFile.value = null;

    await loadTree();
  } catch (e) {
    error.value = 'Не удалось добавить';
    console.error(e);
  }
}

async function deletePerson(id: number) {
  if (!confirm('Удалить этого человека?')) return;
  try {
    await axios.delete(`${API}/persons/${id}`);
    await loadTree();
  } catch (e) {
    alert('Не удалось удалить. Возможно, у человека есть дети.');
    console.error(e);
  }
}

onMounted(loadTree);
</script>

<template>
  <div class="person-list">
    <h1>Семейный архив</h1>

    <form class="add-form" @submit.prevent="addPerson">
      <input v-model="newName" type="text" placeholder="Имя" required />
      <input v-model="newBirthDate" type="date" />
      <select v-model="newParentId">
        <option :value="null">— Без родителя —</option>
        <option v-for="p in flatPersons" :key="p.id" :value="p.id">
          {{ p.name }}
        </option>
      </select>
      <input type="file" accept="image/*" @change="onFileSelect" />
      <button type="submit">Добавить</button>
    </form>

    <p v-if="loading">Загрузка...</p>
    <p v-else-if="error" class="error">{{ error }}</p>
    <div v-else class="flow-container">
      <VueFlow :nodes="elements.nodes" :edges="elements.edges">
        <template #node-custom="nodeProps">
          <PersonCard v-bind="nodeProps" @delete="deletePerson" />
        </template>
      </VueFlow>
    </div>
  </div>
</template>

<style scoped>
.person-list {
  max-width: 1200px;
  margin: 40px auto;
  padding: 20px;
  font-family: system-ui, sans-serif;
}
h1 {
  margin-bottom: 24px;
}
.add-form {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  flex-wrap: wrap;
  align-items: center;
}
.add-form input,
.add-form select {
  padding: 8px;
  font-size: 14px;
  border: 1px solid #ccc;
  border-radius: 4px;
}
.add-form input[type="text"] {
  min-width: 140px;
}
.add-form button {
  padding: 8px 16px;
  font-size: 14px;
  cursor: pointer;
}
.flow-container {
  width: 100%;
  height: 600px;
  border: 1px solid #eee;
  border-radius: 8px;
}
.error {
  color: red;
}
</style>
