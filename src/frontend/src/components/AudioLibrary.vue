<script setup lang="ts">
import { ref, onMounted } from 'vue';
import axios from 'axios';

interface Person {
  id: number;
  name: string;
  photoUrl: string | null;
}

interface AudioItem {
  id: number;
  personId: number;
  url: string;
  title: string | null;
  createdAt: string;
}

const API = 'http://localhost:3000';

const persons = ref<Person[]>([]);
const audiosByPerson = ref<Record<number, AudioItem[]>>({});
const loading = ref(true);
const error = ref<string | null>(null);

async function loadAll() {
  loading.value = true;
  error.value = null;
  try {
    const res = await axios.get<Person[]>(`${API}/persons`);
    persons.value = res.data;

    const audios: Record<number, AudioItem[]> = {};
    await Promise.all(
      persons.value.map(async (p) => {
        const audioRes = await axios.get<AudioItem[]>(`${API}/persons/${p.id}/audios`);
        audios[p.id] = audioRes.data;
      })
    );
    audiosByPerson.value = audios;
  } catch (e) {
    error.value = 'Не удалось загрузить данные';
    console.error(e);
  } finally {
    loading.value = false;
  }
}

async function uploadAudio(personId: number, event: Event) {
  const input = event.target as HTMLInputElement;
  if (!input.files || !input.files[0]) return;

  const file = input.files[0];
  const formData = new FormData();
  formData.append('audio', file);

  try {
    await axios.post(`${API}/persons/${personId}/audio`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    input.value = '';
    await loadAll();
  } catch (e) {
    alert('Не удалось загрузить аудио');
    console.error(e);
  }
}

async function deleteAudio(personId: number, audioId: number) {
  if (!confirm('Удалить эту запись?')) return;
  try {
    await axios.delete(`${API}/persons/${personId}/audios/${audioId}`);
    await loadAll();
  } catch (e) {
    alert('Не удалось удалить');
    console.error(e);
  }
}

function getPhotoUrl(url: string | null): string | null {
  if (!url) return null;
  return `${API}${url}`;
}

function getInitial(name: string): string {
  return name.charAt(0).toUpperCase();
}

onMounted(loadAll);
</script>

<template>
  <div class="audio-library">
    <p v-if="loading">Загрузка...</p>
    <p v-else-if="error" class="error">{{ error }}</p>
    <div v-else class="persons-grid">
      <div v-for="person in persons" :key="person.id" class="person-audio-card">
        <div class="person-header">
          <div class="avatar">
            <img v-if="person.photoUrl" :src="getPhotoUrl(person.photoUrl)!" :alt="person.name" />
            <span v-else class="initial">{{ getInitial(person.name) }}</span>
          </div>
          <div class="person-name">{{ person.name }}</div>
        </div>

        <div class="audios">
          <div
            v-for="audio in audiosByPerson[person.id] || []"
            :key="audio.id"
            class="audio-item"
          >
            <audio controls :src="`${API}${audio.url}`"></audio>
            <button class="del-audio" @click="deleteAudio(person.id, audio.id)" title="Удалить">
              ✕
            </button>
          </div>

          <p v-if="!audiosByPerson[person.id]?.length" class="empty">
            Нет записей
          </p>
        </div>

        <label class="upload-btn">
          <input
            type="file"
            accept="audio/*"
            @change="(e) => uploadAudio(person.id, e)"
          />
          <span>📁 Загрузить аудио</span>
        </label>
      </div>
    </div>
  </div>
</template>

<style scoped>
.audio-library {
  font-family: system-ui, sans-serif;
}
.persons-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
}
.person-audio-card {
  background: white;
  border: 1px solid #e1e8f0;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: box-shadow 0.2s;
}
.person-audio-card:hover {
  box-shadow: 0 4px 16px rgba(74, 144, 226, 0.15);
}
.person-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f3f7;
}
.avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  overflow: hidden;
  background: linear-gradient(135deg, #4a90e2 0%, #357abd 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.initial {
  color: white;
  font-size: 20px;
  font-weight: 600;
}
.person-name {
  font-weight: 600;
  font-size: 16px;
  color: #1a1a1a;
}
.audios {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
}
.audio-item {
  display: flex;
  align-items: center;
  gap: 8px;
}
.audio-item audio {
  flex: 1;
  height: 36px;
}
.del-audio {
  width: 28px;
  height: 28px;
  border: none;
  background: #fdecec;
  color: #c00;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  padding: 0;
  transition: all 0.15s;
}
.del-audio:hover {
  background: #c00;
  color: white;
}
.empty {
  margin: 0;
  font-size: 13px;
  color: #999;
  font-style: italic;
}
.upload-btn {
  display: block;
  position: relative;
  overflow: hidden;
}
.upload-btn input[type="file"] {
  position: absolute;
  left: -9999px;
}
.upload-btn span {
  display: block;
  text-align: center;
  padding: 8px 12px;
  font-size: 13px;
  color: #4a90e2;
  background: #eaf2fb;
  border: 1px dashed #4a90e2;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s;
}
.upload-btn span:hover {
  background: #4a90e2;
  color: white;
}
.error {
  color: #c00;
}
</style>