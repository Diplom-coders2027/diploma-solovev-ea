<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
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

// Состояние записи
const recordingPersonId = ref<number | null>(null);
const mediaRecorder = ref<MediaRecorder | null>(null);
const recordedChunks = ref<Blob[]>([]);
const recordingSeconds = ref(0);
let timerInterval: ReturnType<typeof setInterval> | null = null;

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

// ---------- Запись с микрофона ----------

async function startRecording(personId: number) {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    const options: MediaRecorderOptions = {};
    if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
      options.mimeType = 'audio/webm;codecs=opus';
    } else if (MediaRecorder.isTypeSupported('audio/webm')) {
      options.mimeType = 'audio/webm';
    } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
      options.mimeType = 'audio/mp4';
    }

    const recorder = new MediaRecorder(stream, options);
    recordedChunks.value = [];

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordedChunks.value.push(event.data);
      }
    };

    recorder.onstop = async () => {
      // Останавливаем дорожки микрофона
      stream.getTracks().forEach((track) => track.stop());

      if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
      }

      // Сохраняем запись
      await saveRecording(personId);

      recordingPersonId.value = null;
      mediaRecorder.value = null;
      recordingSeconds.value = 0;
    };

    recorder.start();
    mediaRecorder.value = recorder;
    recordingPersonId.value = personId;
    recordingSeconds.value = 0;

    // Таймер записи
    timerInterval = setInterval(() => {
      recordingSeconds.value++;
    }, 1000);
  } catch (e) {
    alert('Не удалось получить доступ к микрофону. Проверьте разрешения браузера.');
    console.error(e);
  }
}

function stopRecording() {
  if (mediaRecorder.value && mediaRecorder.value.state !== 'inactive') {
    mediaRecorder.value.stop();
  }
}

async function saveRecording(personId: number) {
  if (recordedChunks.value.length === 0) return;

  const mimeType = mediaRecorder.value?.mimeType || 'audio/webm';
  const extension = mimeType.includes('mp4') ? 'mp4' : 'webm';
  const blob = new Blob(recordedChunks.value, { type: mimeType });

  const formData = new FormData();
  formData.append('audio', blob, `recording-${Date.now()}.${extension}`);

  try {
    await axios.post(`${API}/persons/${personId}/audio`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    await loadAll();
  } catch (e) {
    alert('Не удалось сохранить запись');
    console.error(e);
  }
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

// ---------- Загрузка файла ----------

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

onUnmounted(() => {
  if (timerInterval) clearInterval(timerInterval);
  if (mediaRecorder.value && mediaRecorder.value.state !== 'inactive') {
    mediaRecorder.value.stop();
  }
});
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

        <div class="actions">
          <button
            v-if="recordingPersonId !== person.id"
            class="action-btn record"
            @click="startRecording(person.id)"
            :disabled="recordingPersonId !== null"
          >
            Записать
          </button>

          <button
            v-else
            class="action-btn stop"
            @click="stopRecording"
          >
            ⏹ Стоп ({{ formatTime(recordingSeconds) }})
          </button>

          <label class="action-btn upload">
            <input
              type="file"
              accept="audio/*"
              @change="(e) => uploadAudio(person.id, e)"
              :disabled="recordingPersonId !== null"
            />
            <span>Загрузить</span>
          </label>
        </div>
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
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 16px;
  box-shadow: var(--shadow-sm);
  transition: box-shadow 0.2s, background 0.2s, border-color 0.2s;
}
.person-audio-card:hover {
  box-shadow: var(--shadow-md);
}
.person-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border-color);
}
.avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  overflow: hidden;
  background: linear-gradient(135deg, var(--accent) 0%, var(--accent-hover) 100%);
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
  color: var(--text-primary);
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
  background: var(--danger-bg);
  color: var(--danger);
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  padding: 0;
  transition: all 0.15s;
}
.del-audio:hover {
  background: var(--danger);
  color: white;
}
.empty {
  margin: 0;
  font-size: 13px;
  color: var(--text-muted);
  font-style: italic;
}
.actions {
  display: flex;
  gap: 8px;
}
.action-btn {
  flex: 1;
  padding: 8px 12px;
  font-size: 13px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s;
  border: 1px dashed var(--accent);
  background: var(--accent-light);
  color: var(--accent);
  text-align: center;
}
.action-btn:hover:not(:disabled) {
  background: var(--accent);
  color: white;
}
.action-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.action-btn.record {
  border-style: solid;
  border-color: #e74c3c;
  background: var(--danger-bg);
  color: var(--danger);
}
.action-btn.record:hover:not(:disabled) {
  background: #e74c3c;
  color: white;
}
.action-btn.stop {
  border-style: solid;
  border-color: #e74c3c;
  background: #e74c3c;
  color: white;
  animation: pulse 1.5s infinite;
}
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}
.action-btn.upload {
  position: relative;
  overflow: hidden;
  display: block;
}
.action-btn.upload input[type="file"] {
  position: absolute;
  left: -9999px;
}
.error {
  color: var(--danger);
}
</style>