<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import axios from 'axios';
import ErrorState from './ErrorState.vue';

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
    error.value =
      axios.isAxiosError(e) && !e.response
        ? 'Нет связи с сервером'
        : 'Не удалось загрузить данные';
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
    <p v-if="loading" class="status">Загрузка…</p>
    <ErrorState v-else-if="error" :message="error" @retry="loadAll" />
    <div v-else class="persons-grid">
      <div
        v-for="(person, i) in persons"
        :key="person.id"
        class="person-audio-card"
        :style="{ '--n': i }"
      >
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
            <button
              class="del-audio"
              @click="deleteAudio(person.id, audio.id)"
              title="Удалить запись"
              aria-label="Удалить запись"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
            </button>
          </div>

          <p v-if="!audiosByPerson[person.id]?.length" class="empty">
            Записей пока нет. Запишите голос или загрузите файл.
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
            <span class="stop-icon" aria-hidden="true"></span>Стоп, {{ formatTime(recordingSeconds) }}
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
.persons-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
}
.person-audio-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-top: 3px solid var(--accent);
  border-radius: var(--radius-sm);
  padding: 16px;
  box-shadow: var(--shadow-sm);
}
.person-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--border-color);
}
.avatar {
  width: 40px;
  height: 50px;
  padding: 2px;
  background: var(--bg-elevated);
  border: 1px solid var(--border-color);
  border-radius: 2px;
  display: flex;
  flex-shrink: 0;
}
.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.initial {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--accent-light);
  color: var(--accent);
  font-family: var(--font-display);
  font-size: 20px;
  font-weight: 600;
}
.person-name {
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 17px;
  line-height: 1.25;
  color: var(--text-primary);
}
.audios {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 14px;
}
.audio-item {
  display: flex;
  align-items: center;
  gap: 8px;
}
.audio-item audio {
  flex: 1;
  min-width: 0;
  height: 36px;
}
.del-audio {
  width: 28px;
  height: 28px;
  border: 1px solid var(--border-color);
  background: transparent;
  color: var(--text-secondary);
  border-radius: var(--radius-sm);
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.15s, color 0.15s, border-color 0.15s;
}
.del-audio svg {
  width: 14px;
  height: 14px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
}
.del-audio:hover {
  background: var(--danger-solid);
  border-color: var(--danger-solid);
  color: #fff;
}
.empty {
  margin: 0;
  font-size: 14px;
  color: var(--text-muted);
}
.actions {
  display: flex;
  gap: 8px;
}
.action-btn {
  flex: 1;
  padding: 9px 12px;
  font-size: 14px;
  font-weight: 500;
  border-radius: var(--radius-md);
  transition: background-color 0.15s, color 0.15s, border-color 0.15s;
  border: 1px solid var(--accent);
  background: transparent;
  color: var(--accent);
  text-align: center;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}
.action-btn:hover:not(:disabled) {
  background: var(--accent-light);
}
.action-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.action-btn.record {
  border-color: var(--danger-solid);
  color: var(--danger);
}
.action-btn.record:hover:not(:disabled) {
  background: var(--danger-bg);
}
.action-btn.stop {
  border-color: var(--danger-solid);
  background: var(--danger-solid);
  color: #fff;
}
.stop-icon {
  width: 10px;
  height: 10px;
  background: currentColor;
  border-radius: 1px;
  animation: pulse 1.4s ease-in-out infinite;
}
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.35; }
}
.action-btn.upload {
  position: relative;
  overflow: hidden;
  cursor: pointer;
}
.action-btn.upload input[type="file"] {
  position: absolute;
  opacity: 0;
  width: 1px;
  height: 1px;
}
.action-btn.upload:focus-within {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}
.status {
  color: var(--text-muted);
}
.error {
  color: var(--danger);
}

/* ---------- Мягкие формы и движение ---------- */
.person-audio-card {
  border-radius: var(--radius-lg);
  border-top-width: 1px;
  animation: rise 0.6s var(--ease) both;
  animation-delay: calc(var(--n, 0) * 60ms);
  transition: transform 0.3s var(--ease), box-shadow 0.3s var(--ease);
}
.person-audio-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-md);
}
.avatar {
  width: 48px;
  height: 48px;
  padding: 2px;
  border: none;
  border-radius: 50%;
  background: conic-gradient(from 0deg, var(--highlight), var(--highlight-soft), var(--highlight));
}
.avatar img,
.avatar .initial {
  border-radius: 50%;
  border: 2px solid var(--bg-secondary);
}
.avatar img { box-sizing: border-box; }
.avatar .initial {
  box-sizing: border-box;
  font-style: italic;
  background: linear-gradient(145deg, var(--bg-elevated), var(--bg-tertiary));
  color: var(--accent);
}
.del-audio { border-radius: 50%; }
.action-btn { border-radius: 999px; }
.audio-item audio { border-radius: 999px; }

/* ---------- Анимации кнопок ---------- */
.action-btn {
  transition: background-color 0.15s, color 0.15s, border-color 0.15s, transform 0.25s var(--ease), box-shadow 0.25s;
}
.action-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px var(--accent-ring);
}
.action-btn.record:hover:not(:disabled) {
  box-shadow: 0 6px 16px var(--danger-bg);
}
.del-audio {
  transition: background-color 0.15s, color 0.15s, border-color 0.15s, transform 0.25s var(--ease);
}
.del-audio:hover {
  transform: rotate(90deg);
}
</style>
