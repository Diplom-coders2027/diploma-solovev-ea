<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import axios from 'axios';
import { VueFlow, MarkerType, useVueFlow } from '@vue-flow/core';
import dagre from '@dagrejs/dagre';
import PersonCard from '../components/PersonCard.vue';
import EditPersonModal from '../components/EditPersonModal.vue';
import AudioLibrary from '../components/AudioLibrary.vue';
import ConfirmDialog from '../components/ConfirmDialog.vue';
import SettingsMenu from '../components/SettingsMenu.vue';
import { RouterLink } from 'vue-router';

import '@vue-flow/core/dist/style.css';
import '@vue-flow/core/dist/theme-default.css';

interface Person {
  id: number;
  name: string;
  birthDate: string | null;
  parentId: number | null;
  parent2Id: number | null;
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
const newParent2Id = ref<number | null>(null);
const flatPersons = ref<Person[]>([]);
const selectedFile = ref<File | null>(null);

const editingPerson = ref<Person | null>(null);

const activeTab = ref<'tree' | 'audio'>('tree');

// Поиск
const { setCenter } = useVueFlow();
const searchQuery = ref('');
const highlightedId = ref<number | null>(null);
let highlightTimer: ReturnType<typeof setTimeout> | null = null;

const searchResults = computed(() => {
  if (!searchQuery.value.trim()) return [];
  const q = searchQuery.value.toLowerCase().trim();
  return flatPersons.value.filter((p) =>
    p.name.toLowerCase().includes(q)
  );
});

// Подтверждение
const confirmDialog = ref<{
  show: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
}>({
  show: false,
  title: '',
  message: '',
  onConfirm: () => {},
});

function askConfirm(title: string, message: string, onConfirm: () => void) {
  confirmDialog.value = { show: true, title, message, onConfirm };
}

function closeConfirm() {
  confirmDialog.value.show = false;
}

// Дерево
const elements = computed(() => {
  const nodes: any[] = [];
  const edges: any[] = [];
  const seenIds = new Set<string>();

  const traverse = (persons: Person[]) => {
    persons.forEach((p) => {
      const nodeId = String(p.id);

      if (!seenIds.has(nodeId)) {
        seenIds.add(nodeId);
        nodes.push({
          id: nodeId,
          position: { x: 0, y: 0 },
          data: p,
          type: 'custom',
        });
      }

      if (p.parentId) {
        edges.push({
          id: `e${p.parentId}-${p.id}`,
          source: String(p.parentId),
          target: nodeId,
          type: 'smoothstep',
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 20,
            height: 20,
            color: '#4a90e2',
          },
          style: { stroke: '#4a90e2', strokeWidth: 2 },
        });
      }

      if (p.parent2Id) {
        edges.push({
          id: `e${p.parent2Id}-${p.id}`,
          source: String(p.parent2Id),
          target: nodeId,
          type: 'smoothstep',
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 20,
            height: 20,
            color: '#4a90e2',
          },
          style: { stroke: '#4a90e2', strokeWidth: 2 },
        });
      }

      if (p.children) {
        traverse(p.children);
      }
    });
  };

  traverse(treeData.value);

  const g = new dagre.graphlib.Graph();
  g.setGraph({ rankdir: 'TB', nodesep: 80, ranksep: 120 });
  g.setDefaultEdgeLabel(() => ({}));

  nodes.forEach((node) => {
    g.setNode(node.id, { width: 160, height: 100 });
  });

  edges.forEach((edge) => {
    g.setEdge(edge.source, edge.target);
  });

  dagre.layout(g);

  const layoutedNodes = nodes.map((node) => {
    const pos = g.node(node.id);
    return {
      ...node,
      position: { x: pos.x - 80, y: pos.y - 50 },
    };
  });

  return { nodes: layoutedNodes, edges };
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

function focusPerson(personId: number) {
  const node = elements.value.nodes.find((n: any) => n.id === String(personId));
  if (node) {
    setCenter(node.position.x + 80, node.position.y + 50, {
      zoom: 1.2,
      duration: 600,
    });

    highlightedId.value = personId;
    if (highlightTimer) clearTimeout(highlightTimer);
    highlightTimer = setTimeout(() => {
      highlightedId.value = null;
    }, 3000);
  }
}

function onSearchEnter() {
  const first = searchResults.value[0];
  if (first) {
    focusPerson(first.id);
  }
}

function clearSearch() {
  searchQuery.value = '';
  highlightedId.value = null;
  if (highlightTimer) clearTimeout(highlightTimer);
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

async function savePhotoFromModal(data: { id: number; file: File }) {
  const formData = new FormData();
  formData.append('photo', data.file);
  await axios.post(`${API}/persons/${data.id}/photo`, formData, {
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
      parent2Id: newParent2Id.value ?? null,
    });

    if (selectedFile.value) {
      await uploadPhoto(res.data.id);
    }

    newName.value = '';
    newBirthDate.value = '';
    newParentId.value = null;
    newParent2Id.value = null;
    selectedFile.value = null;

    await loadTree();
  } catch (e) {
    error.value = 'Не удалось добавить';
    console.error(e);
  }
}

async function savePerson(data: {
  id: number;
  name: string;
  birthDate: string | null;
  parentId: number | null;
  parent2Id: number | null;
}) {
  try {
    await axios.put(`${API}/persons/${data.id}`, {
      name: data.name,
      birthDate: data.birthDate,
      parentId: data.parentId,
      parent2Id: data.parent2Id,
    });
    editingPerson.value = null;
    await loadTree();
  } catch (e) {
    alert('Не удалось сохранить изменения');
    console.error(e);
  }
}

async function deletePerson(id: number) {
  const person = flatPersons.value.find((p) => p.id === id);
  const name = person?.name || 'этого человека';

  askConfirm(
    'Удалить?',
    `Вы уверены, что хотите удалить «${name}»? Это действие нельзя отменить.`,
    async () => {
      closeConfirm();
      try {
        await axios.delete(`${API}/persons/${id}`);
        await loadTree();
      } catch (e) {
        alert('Не удалось удалить. Возможно, у человека есть дети.');
        console.error(e);
      }
    }
  );
}

onMounted(() => {
  loadTree();
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      clearSearch();
    }
  });
});
</script>

<template>
  <div class="person-list">
    <div class="top-bar">
      <RouterLink to="/" class="home-link">← На главную</RouterLink>
      <SettingsMenu />
    </div>

    <div class="tabs">
      <button
        :class="['tab', { active: activeTab === 'tree' }]"
        @click="activeTab = 'tree'"
      >
        Дерево
      </button>
      <button
        :class="['tab', { active: activeTab === 'audio' }]"
        @click="activeTab = 'audio'"
      >
        Аудио
      </button>
    </div>

    <template v-if="activeTab === 'tree'">
      <div class="search-bar">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Поиск по имени..."
          @keydown.enter="onSearchEnter"
          @keydown.esc="clearSearch"
        />
        <button v-if="searchQuery" class="clear-btn" @click="clearSearch">✕</button>
        <div v-if="searchResults.length > 0" class="search-results">
          <div
            v-for="person in searchResults.slice(0, 5)"
            :key="person.id"
            class="search-result"
            @click="focusPerson(person.id)"
          >
            <span class="result-name">{{ person.name }}</span>
            <span v-if="person.birthDate" class="result-date">{{ person.birthDate }}</span>
          </div>
        </div>
        <p v-else-if="searchQuery && searchResults.length === 0" class="no-results">
          Ничего не найдено
        </p>
      </div>

      <form class="add-form" @submit.prevent="addPerson">
        <div class="form-row">
          <input v-model="newName" type="text" placeholder="Имя" required />
          <input v-model="newBirthDate" type="date" />
          <select v-model="newParentId">
            <option :value="null">— Родитель 1 —</option>
            <option v-for="p in flatPersons" :key="p.id" :value="p.id">
              {{ p.name }}
            </option>
          </select>
          <select v-model="newParent2Id">
            <option :value="null">— Родитель 2 —</option>
            <option v-for="p in flatPersons" :key="p.id" :value="p.id">
              {{ p.name }}
            </option>
          </select>
        </div>
        <div class="form-row">
          <label class="file-input">
            <input type="file" accept="image/*" @change="onFileSelect" />
            <span class="file-label">
              {{ selectedFile ? selectedFile.name : 'Выбрать фото' }}
            </span>
          </label>
          <button type="submit">+ Добавить</button>
        </div>
      </form>

      <p v-if="loading">Загрузка...</p>
      <p v-else-if="error" class="error">{{ error }}</p>
      <div v-else class="flow-container">
        <VueFlow :nodes="elements.nodes" :edges="elements.edges">
          <template #node-custom="nodeProps">
            <PersonCard
              v-bind="nodeProps"
              :highlighted="highlightedId === nodeProps.data.id"
              @delete="deletePerson"
              @edit="editingPerson = nodeProps.data"
            />
          </template>
        </VueFlow>
      </div>
    </template>

    <AudioLibrary v-else />

    <EditPersonModal
      :person="editingPerson"
      :all-persons="flatPersons"
      @save="savePerson"
      @photo="savePhotoFromModal"
      @close="editingPerson = null"
    />

    <ConfirmDialog
      :show="confirmDialog.show"
      :title="confirmDialog.title"
      :message="confirmDialog.message"
      confirm-text="Удалить"
      cancel-text="Отмена"
      :danger="true"
      @confirm="confirmDialog.onConfirm()"
      @cancel="closeConfirm"
    />
  </div>
</template>

<style scoped>
.person-list {
  max-width: 100%;
  margin: 0;
  padding: 16px 24px;
  font-family: system-ui, sans-serif;
  background: var(--bg-primary);
  min-height: 100vh;
  transition: background 0.2s;
}

.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.home-link {
  display: inline-block;
  padding: 6px 14px;
  font-size: 14px;
  color: var(--text-secondary);
  text-decoration: none;
  border-radius: 8px;
  transition: all 0.15s;
}
.home-link:hover {
  color: var(--accent);
  background: var(--accent-light);
}

.tabs {
  display: flex;
  gap: 4px;
  margin-bottom: 20px;
  background: var(--bg-tertiary);
  padding: 4px;
  border-radius: 10px;
  width: fit-content;
  transition: background 0.2s;
}
.tab {
  padding: 8px 20px;
  font-size: 14px;
  font-weight: 500;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s;
}
.tab:hover {
  color: var(--accent);
}
.tab.active {
  background: var(--bg-secondary);
  color: var(--accent);
  box-shadow: var(--shadow-sm);
}

.search-bar {
  position: relative;
  margin-bottom: 16px;
  max-width: 400px;
}
.search-bar input {
  width: 100%;
  padding: 10px 36px 10px 14px;
  font-size: 14px;
  border: 1px solid var(--border-input);
  border-radius: 10px;
  background: var(--bg-input);
  color: var(--text-primary);
  outline: none;
  transition: all 0.15s;
  box-sizing: border-box;
}
.search-bar input:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgba(74, 144, 226, 0.15);
}
.clear-btn {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  width: 22px;
  height: 22px;
  border: none;
  background: var(--bg-tertiary);
  color: var(--text-secondary);
  border-radius: 50%;
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  transition: all 0.15s;
}
.clear-btn:hover {
  background: var(--danger-bg);
  color: var(--danger);
}
.search-results {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 6px;
  background: var(--bg-elevated);
  border: 1px solid var(--border-color);
  border-radius: 10px;
  box-shadow: var(--shadow-lg);
  overflow: hidden;
  z-index: 100;
}
.search-result {
  padding: 10px 14px;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: background 0.15s;
}
.search-result:hover {
  background: var(--bg-hover);
}
.result-name {
  font-weight: 500;
  color: var(--text-primary);
}
.result-date {
  font-size: 12px;
  color: var(--text-muted);
}
.no-results {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 6px;
  padding: 12px 14px;
  font-size: 13px;
  color: var(--text-muted);
  background: var(--bg-elevated);
  border: 1px solid var(--border-color);
  border-radius: 10px;
  font-style: italic;
}

.add-form {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 24px;
  padding: 16px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  transition: background 0.2s, border-color 0.2s;
}
.form-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: center;
}
.add-form input,
.add-form select {
  padding: 10px 12px;
  font-size: 14px;
  border: 1px solid var(--border-input);
  border-radius: 8px;
  background: var(--bg-input);
  color: var(--text-primary);
  outline: none;
  transition: border-color 0.15s, background 0.2s, color 0.2s;
}
.add-form input:focus,
.add-form select:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgba(74, 144, 226, 0.15);
}
.add-form input[type="text"] {
  min-width: 160px;
  flex: 1;
}
.add-form select {
  min-width: 150px;
}
.add-form button {
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 500;
  color: white;
  background: var(--accent);
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.15s;
}
.add-form button:hover {
  background: var(--accent-hover);
}

.file-input {
  position: relative;
  overflow: hidden;
  display: inline-block;
}
.file-input input[type="file"] {
  position: absolute;
  left: -9999px;
}
.file-label {
  display: inline-block;
  padding: 10px 16px;
  font-size: 14px;
  background: var(--bg-input);
  border: 1px dashed var(--accent);
  border-radius: 8px;
  color: var(--accent);
  cursor: pointer;
  transition: all 0.15s;
  max-width: 220px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.file-label:hover {
  background: var(--accent-light);
}

.flow-container {
  width: 100%;
  height: calc(100vh - 300px);
  min-height: 500px;
  border: 1px solid var(--border-color);
  border-radius: 12px;
  background:
    radial-gradient(circle at 1px 1px, var(--graph-bg-dot) 1px, transparent 0) 0 0 / 20px 20px,
    var(--bg-primary);
  transition: background 0.2s, border-color 0.2s;
}

.error {
  color: var(--danger);
}
</style>