<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed, watch } from 'vue';
import axios from 'axios';
import { toPng } from 'html-to-image';
import { VueFlow, MarkerType, useVueFlow } from '@vue-flow/core';
import dagre from '@dagrejs/dagre';
import PersonCard from '../components/PersonCard.vue';
import EditPersonModal from '../components/EditPersonModal.vue';
import AudioLibrary from '../components/AudioLibrary.vue';
import ConfirmDialog from '../components/ConfirmDialog.vue';
import SettingsMenu from '../components/SettingsMenu.vue';
import Statistics from '../components/Statistics.vue';
import ErrorState from '../components/ErrorState.vue';
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

const API = `http://${window.location.hostname}:3000`;

// Цвет связей: средний тон, читается и на светлой, и на тёмной теме
const EDGE_COLOR = '#777777';

// Размер карточки в схеме дерева
const NODE_W = 168;
const NODE_H = 184;

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

const activeTab = ref<'tree' | 'audio' | 'stats'>('tree');

// Поиск
const { setCenter, fitView, viewport } = useVueFlow();
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
          type: 'default',
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 20,
            height: 20,
            color: EDGE_COLOR,
          },
          style: { stroke: EDGE_COLOR, strokeWidth: 2 },
        });
      }

      if (p.parent2Id) {
        edges.push({
          id: `e${p.parent2Id}-${p.id}`,
          source: String(p.parent2Id),
          target: nodeId,
          type: 'default',
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 20,
            height: 20,
            color: EDGE_COLOR,
          },
          style: { stroke: EDGE_COLOR, strokeWidth: 2 },
        });
      }

      if (p.children) {
        traverse(p.children);
      }
    });
  };

  traverse(treeData.value);

  const g = new dagre.graphlib.Graph();
  g.setGraph({ rankdir: 'TB', nodesep: 40, ranksep: 72 });
  g.setDefaultEdgeLabel(() => ({}));

  nodes.forEach((node) => {
    g.setNode(node.id, { width: NODE_W, height: NODE_H });
  });

  edges.forEach((edge) => {
    g.setEdge(edge.source, edge.target);
  });

  dagre.layout(g);

  const layoutedNodes = nodes.map((node) => {
    const pos = g.node(node.id);
    return {
      ...node,
      position: { x: pos.x - NODE_W / 2, y: pos.y - NODE_H / 2 },
    };
  });

  return { nodes: layoutedNodes, edges };
});

// ---------- Экспорт в PNG ----------
const exporting = ref(false);

async function exportToPng() {
  if (!flowEl.value || exporting.value) return;

  try {
    exporting.value = true; // прячет анимированную сетку на время снимка

    // Сбрасываем подсветку перед скриншотом (чтобы не попала в PNG)
    highlightedId.value = null;
    if (highlightTimer) clearTimeout(highlightTimer);

    // Вписываем всё дерево в экран, чтобы ничего не обрезалось
    await fitView({ padding: 0.1, duration: 300 });
    // Даём Vue Flow время на отрисовку
    await new Promise((r) => setTimeout(r, 400));

    const dataUrl = await toPng(flowEl.value, {
      backgroundColor: getComputedStyle(document.body).backgroundColor,
      quality: 1,
      pixelRatio: 2,
    });

    const link = document.createElement('a');
    link.download = `family-tree-${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
  } catch (e) {
    alert('Не удалось создать PNG');
    console.error(e);
  } finally {
    exporting.value = false;
  }
}

async function loadTree() {
  loading.value = true;
  error.value = null;
  try {
    const res = await axios.get<Person[]>(`${API}/persons/tree`);
    treeData.value = res.data;

    const flatRes = await axios.get<Person[]>(`${API}/persons`);
    flatPersons.value = flatRes.data;
  } catch (e) {
    error.value =
      axios.isAxiosError(e) && !e.response
        ? 'Нет связи с сервером'
        : 'Не удалось загрузить данные';
    console.error(e);
  } finally {
    loading.value = false;
  }
}

function focusPerson(personId: number) {
  const node = elements.value.nodes.find((n: any) => n.id === String(personId));
  if (node) {
    setCenter(node.position.x + NODE_W / 2, node.position.y + NODE_H / 2, {
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

// ---------- Сетка точек: следует за курсором и двигается вместе с деревом ----------
const flowEl = ref<HTMLElement | null>(null);

// Слушаем окно (в фазе захвата): во время перетаскивания дерева события мыши
// до самого поля не доходят, и эффект «застывал» на месте.
function onWindowMove(e: MouseEvent) {
  const el = flowEl.value;
  if (!el) return;
  const r = el.getBoundingClientRect();
  const x = e.clientX - r.left;
  const y = e.clientY - r.top;
  const inside = x >= 0 && y >= 0 && x <= r.width && y <= r.height;
  el.style.setProperty('--mx', `${x}px`);
  el.style.setProperty('--my', `${y}px`);
  el.style.setProperty('--glow', inside ? '1' : '0');
}
function hideCursorEffect() {
  flowEl.value?.style.setProperty('--glow', '0');
}
function applyViewport() {
  const el = flowEl.value;
  if (!el) return;
  const v = viewport.value;
  el.style.setProperty('--vx', `${v.x}px`);
  el.style.setProperty('--vy', `${v.y}px`);
  el.style.setProperty('--vz', String(v.zoom));
}
watch([viewport, flowEl], applyViewport, { deep: true, immediate: true, flush: 'post' });

onMounted(() => {
  window.addEventListener('mousemove', onWindowMove, { capture: true, passive: true });
  window.addEventListener('pointermove', onWindowMove, { capture: true, passive: true });
  window.addEventListener('blur', hideCursorEffect);
  document.addEventListener('mouseleave', hideCursorEffect);
});
onBeforeUnmount(() => {
  window.removeEventListener('mousemove', onWindowMove, { capture: true });
  window.removeEventListener('pointermove', onWindowMove, { capture: true });
  window.removeEventListener('blur', hideCursorEffect);
  document.removeEventListener('mouseleave', hideCursorEffect);
});

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
    <header class="top-bar">
      <RouterLink to="/" class="brand" title="На главную">
        <svg class="brand-mark" viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="5" r="2.6" />
          <circle cx="5" cy="19" r="2.6" />
          <circle cx="19" cy="19" r="2.6" />
          <path d="M12 7.6V12M12 12H5V16.4M12 12H19V16.4" />
        </svg>
        <span>Семейный архив</span>
      </RouterLink>
      <SettingsMenu />
    </header>

    <div class="tabs" role="tablist">
      <button
        :class="['tab', { active: activeTab === 'tree' }]"
        role="tab"
        :aria-selected="activeTab === 'tree'"
        @click="activeTab = 'tree'"
      >
        <svg class="tab-icon" viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="5" r="2.4" />
          <circle cx="5.5" cy="19" r="2.4" />
          <circle cx="18.5" cy="19" r="2.4" />
          <path d="M12 7.4V12M12 12H5.5v4.6M12 12h6.5v4.6" />
        </svg>
        Дерево
      </button>
      <button
        :class="['tab', { active: activeTab === 'audio' }]"
        role="tab"
        :aria-selected="activeTab === 'audio'"
        @click="activeTab = 'audio'"
      >
        <svg class="tab-icon" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M5 10v4M9 6v12M13 9v6M17 4v16M21 11v2" />
        </svg>
        Аудио
      </button>
      <button
        :class="['tab', { active: activeTab === 'stats' }]"
        role="tab"
        :aria-selected="activeTab === 'stats'"
        @click="activeTab = 'stats'"
      >
        <svg class="tab-icon" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M5 20v-8M12 20V5M19 20v-5" />
        </svg>
        Статистика
      </button>

      <button
        v-if="activeTab === 'tree'"
        class="tab export-tab"
        :disabled="exporting"
        @click="exportToPng"
        title="Скачать дерево как PNG"
      >
        <svg class="tab-icon" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 4v11M7.5 10.5L12 15l4.5-4.5M5 19h14" />
        </svg>
        {{ exporting ? 'Готовлю PNG…' : 'Скачать PNG' }}
      </button>
    </div>

    <template v-if="activeTab === 'tree'">
      <div class="search-bar">
        <svg class="search-icon" viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="11" cy="11" r="6.5" />
          <path d="M16 16l4.5 4.5" />
        </svg>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Поиск по имени"
          aria-label="Поиск по имени"
          @keydown.enter="onSearchEnter"
          @keydown.esc="clearSearch"
        />
        <button v-if="searchQuery" class="clear-btn" @click="clearSearch" aria-label="Очистить поиск">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
        </button>
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
          Никого с таким именем нет
        </p>
      </div>

      <form class="add-form" @submit.prevent="addPerson">
        <div class="form-row">
          <input v-model="newName" type="text" placeholder="Имя" aria-label="Имя" required />
          <input v-model="newBirthDate" type="date" aria-label="Дата рождения" />
          <select v-model="newParentId" aria-label="Родитель 1">
            <option :value="null">Родитель 1</option>
            <option v-for="p in flatPersons" :key="p.id" :value="p.id">
              {{ p.name }}
            </option>
          </select>
          <select v-model="newParent2Id" aria-label="Родитель 2">
            <option :value="null">Родитель 2</option>
            <option v-for="p in flatPersons" :key="p.id" :value="p.id">
              {{ p.name }}
            </option>
          </select>
          <label class="file-input">
            <input type="file" accept="image/*" @change="onFileSelect" />
            <span class="file-label">
              {{ selectedFile ? selectedFile.name : 'Выбрать фото' }}
            </span>
          </label>
          <button type="submit">Добавить человека</button>
        </div>
      </form>

      <p v-if="loading" class="status">Загрузка…</p>
      <ErrorState v-else-if="error" :message="error" @retry="loadTree" />
      <div
        v-else
        class="flow-container"
        :class="{ exporting }"
        ref="flowEl"
      >
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

    <AudioLibrary v-else-if="activeTab === 'audio'" />
    <Statistics v-else-if="activeTab === 'stats'" />

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
  padding: 16px 28px 28px;
  background: var(--bg-primary);
  min-height: 100vh;
  transition: background-color 0.2s;
}

.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
.brand {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-family: var(--font-ui);
  font-size: 17px;
  font-weight: 500;
  letter-spacing: -0.01em;
  color: var(--text-primary);
}
.brand:hover {
  color: var(--accent);
}
.brand-mark {
  width: 26px;
  height: 26px;
  fill: none;
  stroke: var(--accent);
  stroke-width: 1.7;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.tabs {
  display: flex;
  gap: 24px;
  margin-bottom: 20px;
  border-bottom: 1px solid var(--border-color);
}
.tab {
  padding: 8px 2px 10px;
  margin-bottom: -1px;
  font-size: 15px;
  font-weight: 500;
  border: none;
  border-bottom: 2px solid transparent;
  background: transparent;
  color: var(--text-secondary);
  transition: color 0.15s, border-color 0.15s;
}
.tab:hover {
  color: var(--text-primary);
}
.tab.active {
  color: var(--accent);
  border-bottom-color: var(--accent);
}

.search-bar {
  position: relative;
  margin-bottom: 14px;
  max-width: 420px;
}
.search-icon {
  position: absolute;
  left: 12px;
  top: 11px;
  width: 18px;
  height: 18px;
  fill: none;
  stroke: var(--text-muted);
  stroke-width: 1.8;
  stroke-linecap: round;
  pointer-events: none;
}
.search-bar input {
  width: 100%;
  padding: 10px 38px 10px 38px;
  font-size: 15px;
  border: 1px solid var(--border-input);
  border-radius: var(--radius-md);
  background: var(--bg-input);
  color: var(--text-primary);
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.search-bar input:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-ring);
}
.clear-btn {
  position: absolute;
  right: 8px;
  top: 8px;
  width: 26px;
  height: 26px;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  transition: background-color 0.15s, color 0.15s;
}
.clear-btn svg {
  width: 14px;
  height: 14px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
}
.clear-btn:hover {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}
.search-results {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 6px;
  background: var(--bg-elevated);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  overflow: hidden;
  z-index: 100;
}
.search-result {
  padding: 10px 14px;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 12px;
  transition: background-color 0.15s;
}
.search-result:hover {
  background: var(--bg-hover);
}
.result-name {
  font-weight: 500;
  color: var(--text-primary);
}
.result-date {
  font-size: 13px;
  color: var(--text-muted);
  font-variant-numeric: tabular-nums;
}
.no-results {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 6px;
  padding: 12px 14px;
  font-size: 14px;
  color: var(--text-muted);
  background: var(--bg-elevated);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  z-index: 100;
}

.add-form {
  margin-bottom: 20px;
  padding: 12px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
}
.form-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: center;
}
.add-form input:not([type="file"]),
.add-form select {
  padding: 9px 12px;
  font-size: 14px;
  border: 1px solid var(--border-input);
  border-radius: var(--radius-sm);
  background: var(--bg-input);
  color: var(--text-primary);
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.add-form input:focus,
.add-form select:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-ring);
}
.add-form input[type="text"] {
  min-width: 160px;
  flex: 1;
}
.add-form select {
  min-width: 140px;
}
.add-form button {
  padding: 9px 18px;
  font-size: 14px;
  font-weight: 500;
  color: var(--on-accent);
  background: var(--accent);
  border: 1px solid var(--accent);
  border-radius: var(--radius-sm);
  transition: background-color 0.15s, border-color 0.15s;
}
.add-form button:hover {
  background: var(--accent-hover);
  border-color: var(--accent-hover);
}

.file-input {
  position: relative;
  display: inline-block;
}
.file-input input[type="file"] {
  position: absolute;
  opacity: 0;
  width: 1px;
  height: 1px;
}
.file-label {
  display: inline-block;
  padding: 9px 14px;
  font-size: 14px;
  background: transparent;
  border: 1px dashed var(--border-strong);
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  cursor: pointer;
  transition: background-color 0.15s, color 0.15s, border-color 0.15s;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  vertical-align: middle;
}
.file-label:hover {
  background: var(--accent-light);
  border-color: var(--accent);
  color: var(--accent);
}
.file-input input:focus-visible + .file-label {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

/* Поле дерева — чистая стена */
.flow-container {
  width: 100%;
  height: calc(100vh - 290px);
  min-height: 520px;
  border: 1px solid var(--border-color);
  border-radius: 2px;
  overflow: hidden;
  background: var(--bg-primary);
  transition: background-color 0.2s, border-color 0.2s;
}

.status {
  color: var(--text-muted);
}
.error {
  color: var(--danger);
}

@media (max-width: 700px) {
  .person-list { padding: 12px 16px 20px; }
  .add-form input[type="text"],
  .add-form select { flex: 1 1 100%; }
}

/* ---------- Мягкие формы и движение ---------- */
.top-bar { animation: rise 0.6s var(--ease) both; }
.tabs { animation: rise 0.6s var(--ease) 0.08s both; }
.tab { position: relative; }
.tab.active { border-bottom-color: transparent; }
.tab::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: -1px;
  height: 2px;
  border-radius: 2px;
  background: var(--accent);
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 0.35s var(--ease);
}
.tab.active::after { transform: scaleX(1); }

.search-bar input { border-radius: 999px; }
.search-results,
.no-results {
  border-radius: var(--radius-md);
  animation: dropIn 0.2s var(--ease);
}
@keyframes dropIn {
  from { opacity: 0; transform: translateY(-6px); }
  to { opacity: 1; transform: none; }
}
.clear-btn { border-radius: 50%; }

.add-form {
  border-radius: var(--radius-lg);
  animation: rise 0.6s var(--ease) 0.15s both;
}
.add-form button { border-radius: 999px; padding-left: 22px; padding-right: 22px; }
.add-form button:hover { transform: translateY(-1px); }
.file-label { border-radius: 999px; }

/* Поле дерева: точечная сетка и мягкие края */
.flow-container {
  border-radius: var(--radius-lg);
  background:
    radial-gradient(circle at 1px 1px, var(--graph-bg-dot) 1.3px, transparent 0) 0 0 / 22px 22px,
    var(--bg-primary);
  animation: rise 0.7s var(--ease) 0.25s both;
}

/* ---------- Слои: меню настроек и поиск всегда поверх панелей ---------- */
.top-bar {
  position: relative;
  z-index: 50;
}
.search-bar {
  z-index: 40;
}

/* ---------- Поле дерева: живая сетка из точек ---------- */
/* Сетка двигается и масштабируется вместе с деревом (--vx/--vy/--vz из Vue Flow),
   подсветки-пятна нет: точки у курсора просто крупнее и «дышат». */
.flow-container {
  position: relative;
  --mx: -999px;
  --my: -999px;
  --glow: 0;
  --vx: 0px;
  --vy: 0px;
  --vz: 1;
  --tile: max(11px, calc(22px * var(--vz)));
  background:
    radial-gradient(circle at center, var(--graph-bg-dot) 1.2px, transparent 1.7px)
      var(--vx) var(--vy) / var(--tile) var(--tile),
    var(--bg-primary);
  transition: --glow 0.5s var(--ease), background-color 0.2s, border-color 0.2s;
}
.flow-container :deep(.vue-flow) {
  position: relative;
  z-index: 1;
}

/* Фоновая волна: по сетке медленно пробегает полоса увеличенных точек */
.flow-container::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background: radial-gradient(
      circle at center,
      color-mix(in srgb, var(--highlight) 75%, transparent) 2px,
      transparent 2.7px
    ) var(--vx) var(--vy) / var(--tile) var(--tile);
  -webkit-mask-image: linear-gradient(115deg, transparent 42%, #000 50%, transparent 58%);
  mask-image: linear-gradient(115deg, transparent 42%, #000 50%, transparent 58%);
  -webkit-mask-size: 300% 100%;
  mask-size: 300% 100%;
  -webkit-mask-repeat: no-repeat;
  mask-repeat: no-repeat;
  opacity: 0.6;
  animation: dotWave 9s linear infinite;
}
@keyframes dotWave {
  from { -webkit-mask-position: 100% 0; mask-position: 100% 0; }
  to { -webkit-mask-position: 0% 0; mask-position: 0% 0; }
}

/* Точки у курсора: крупнее, ярче и «дышат» */
.flow-container::after {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background: radial-gradient(
      circle at center,
      var(--highlight) 2.7px,
      transparent 3.4px
    ) var(--vx) var(--vy) / var(--tile) var(--tile);
  -webkit-mask-image: radial-gradient(circle calc(90px + var(--pulse) * 28px) at var(--mx) var(--my), #000 0%, transparent 100%);
  mask-image: radial-gradient(circle calc(90px + var(--pulse) * 28px) at var(--mx) var(--my), #000 0%, transparent 100%);
  opacity: var(--glow);
  animation: dotBreath 2.2s ease-in-out infinite alternate;
}
@keyframes dotBreath {
  from { --pulse: 0; }
  to { --pulse: 1; }
}

/* ---------- Анимации кнопок ---------- */
.tab {
  transition: color 0.15s, transform 0.25s var(--ease);
}
.tab:hover {
  transform: translateY(-2px);
}
.add-form button {
  position: relative;
  overflow: hidden;
  transition: background-color 0.15s, border-color 0.15s, transform 0.25s var(--ease), box-shadow 0.25s;
}
.add-form button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px var(--accent-ring);
}
.add-form button:active {
  transform: scale(0.97);
}
.add-form button::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(110deg, transparent 30%, color-mix(in srgb, var(--highlight) 50%, transparent) 50%, transparent 70%);
  transform: translateX(-120%);
}
.add-form button:hover::after {
  transform: translateX(120%);
  transition: transform 0.75s var(--ease);
}
.file-label {
  transition: background-color 0.15s, color 0.15s, border-color 0.15s, transform 0.25s var(--ease);
}
.file-label:hover {
  transform: translateY(-2px);
}
.search-result {
  transition: background-color 0.15s, padding-left 0.25s var(--ease);
}
.search-result:hover {
  padding-left: 20px;
}
.clear-btn {
  transition: background-color 0.15s, color 0.15s, transform 0.25s var(--ease);
}
.clear-btn:hover {
  transform: rotate(90deg);
}

/* ---------- Вкладки с иконками, кнопка PNG ---------- */
.tab {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.tab-icon {
  width: 18px;
  height: 18px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
  transition: transform 0.35s var(--ease);
}
.tab:hover .tab-icon {
  transform: translateY(-1px) scale(1.12);
}
.export-tab {
  margin-left: auto;
  color: var(--accent);
}
.export-tab::after {
  display: none;
}
.export-tab:hover:not(:disabled) {
  color: var(--accent-hover);
}
.export-tab:hover:not(:disabled) .tab-icon {
  transform: translateY(2px);
}
.export-tab:disabled {
  opacity: 0.6;
  cursor: progress;
}

/* На время экспорта в PNG прячем анимированную сетку */
.flow-container.exporting {
  background: var(--bg-primary);
  animation: none;
}
.flow-container.exporting::before,
.flow-container.exporting::after {
  display: none;
}
</style>
