<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
import SettingsMenu from '../components/SettingsMenu.vue';

const router = useRouter();
const API = 'http://localhost:3000';

const importing = ref(false);
const importMessage = ref<string | null>(null);
const importError = ref<string | null>(null);

function exportGedcom() {
  window.location.href = `${API}/persons/export/gedcom`;
}

function goToApp() {
  router.push('/app');
}

async function onGedcomSelect(event: Event) {
  const input = event.target as HTMLInputElement;
  if (!input.files || !input.files[0]) return;

  const file = input.files[0];
  const formData = new FormData();
  formData.append('gedcom', file);

  importing.value = true;
  importMessage.value = null;
  importError.value = null;

  try {
    const res = await axios.post(`${API}/persons/import/gedcom`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    importMessage.value = `Импортировано: ${res.data.imported} человек`;
    setTimeout(() => router.push('/app'), 1500);
  } catch (e) {
    importError.value = 'Не удалось импортировать файл';
    console.error(e);
  } finally {
    importing.value = false;
    input.value = '';
  }
}
</script>

<template>
  <div class="welcome">
    <div class="top-right">
      <SettingsMenu />
    </div>

    <div class="welcome-content">
      <div class="logo">🌳</div>
      <h1>Семейный архив</h1>
      <p class="subtitle">
        Сохраните историю своей семьи: дерево, фотографии и голоса близких — в одном месте.
      </p>

      <div class="buttons">
        <button class="export-btn" @click="exportGedcom">
          Экспорт GEDCOM
        </button>
        <button class="enter-btn" @click="goToApp">
          Войти в архив →
        </button>

        <label class="import-btn" :class="{ disabled: importing }">
          <input
            type="file"
            accept=".ged,.gedcom"
            @change="onGedcomSelect"
            :disabled="importing"
          />
          <span v-if="!importing">Импортировать GEDCOM</span>
          <span v-else>Импортирую...</span>
        </label>
      </div>

      <p v-if="importMessage" class="import-message success">{{ importMessage }}</p>
      <p v-if="importError" class="import-message error">{{ importError }}</p>

      <p class="hint">
        Поддерживаются файлы из MyHeritage, Ancestry, «Древа Жизни» и других генеалогических программ.
      </p>

      <div class="features">
        <div class="feature">
          <div class="feature-icon">👨‍👩‍👧‍👦</div>
          <div class="feature-title">Семейное дерево</div>
          <div class="feature-text">Связи между поколениями с двумя родителями</div>
        </div>
        <div class="feature">
          <div class="feature-icon">📷</div>
          <div class="feature-title">Фотографии</div>
          <div class="feature-text">Личные фото для каждого члена семьи</div>
        </div>
        <div class="feature">
          <div class="feature-icon">🎤</div>
          <div class="feature-title">Голоса</div>
          <div class="feature-text">Запишите и сохраните голос близких</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.welcome {
  position: relative;
  width: 100vw;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background:
    radial-gradient(circle at 20% 30%, rgba(74, 144, 226, 0.15) 0%, transparent 50%),
    radial-gradient(circle at 80% 70%, rgba(74, 144, 226, 0.1) 0%, transparent 50%),
    var(--bg-primary);
  font-family: system-ui, sans-serif;
  padding: 40px 20px;
  box-sizing: border-box;
  transition: background 0.2s;
}
.welcome-content {
  max-width: 800px;
  text-align: center;
}
.logo {
  font-size: 80px;
  line-height: 1;
  margin-bottom: 16px;
  animation: float 3s ease-in-out infinite;
}
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}
h1 {
  font-size: 48px;
  color: var(--text-primary);
  margin: 0 0 16px;
  font-weight: 700;
  letter-spacing: -1px;
}
.subtitle {
  font-size: 18px;
  color: var(--text-secondary);
  line-height: 1.6;
  margin: 0 0 40px;
  max-width: 560px;
  margin-left: auto;
  margin-right: auto;
}
.buttons {
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
  margin-bottom: 20px;
}
.enter-btn {
  padding: 16px 40px;
  font-size: 17px;
  font-weight: 600;
  color: white;
  background: linear-gradient(135deg, var(--accent) 0%, var(--accent-hover) 100%);
  border: none;
  border-radius: 12px;
  cursor: pointer;
  box-shadow: 0 8px 24px rgba(74, 144, 226, 0.35);
  transition: all 0.2s;
}
.enter-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 32px rgba(74, 144, 226, 0.45);
}
.enter-btn:active {
  transform: translateY(0);
}
.import-btn {
  position: relative;
  overflow: hidden;
  display: inline-block;
}
.import-btn input[type="file"] {
  position: absolute;
  left: -9999px;
}
.import-btn span {
  display: inline-block;
  padding: 16px 32px;
  font-size: 16px;
  font-weight: 500;
  color: var(--accent);
  background: var(--bg-secondary);
  border: 2px solid var(--accent);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
}
.import-btn span:hover {
  background: var(--accent-light);
}
.import-btn.disabled span {
  opacity: 0.5;
  cursor: not-allowed;
}
.import-message {
  font-size: 14px;
  padding: 8px 16px;
  border-radius: 8px;
  margin-bottom: 16px;
  display: inline-block;
}
.import-message.success {
  color: #2e7d32;
  background: #e8f5e9;
}
.import-message.error {
  color: var(--danger);
  background: var(--danger-bg);
}
.hint {
  font-size: 13px;
  color: var(--text-muted);
  margin-bottom: 40px;
}
.features {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-top: 60px;
}
.feature {
  padding: 24px 16px;
  background: var(--bg-secondary);
  border-radius: 16px;
  box-shadow: var(--shadow-sm);
  transition: transform 0.2s, box-shadow 0.2s;
}
.feature:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-md);
}
.feature-icon {
  font-size: 36px;
  margin-bottom: 12px;
}
.feature-title {
  font-weight: 600;
  font-size: 16px;
  color: var(--text-primary);
  margin-bottom: 6px;
}
.feature-text {
  font-size: 13px;
  color: var(--text-muted);
  line-height: 1.5;
}
.top-right {
  position: absolute;
  top: 20px;
  right: 20px;
}
.export-btn {
  padding: 16px 32px;
  font-size: 16px;
  font-weight: 500;
  color: var(--text-primary);
  background: var(--bg-secondary);
  border: 2px solid var(--border-color);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
}
.export-btn:hover {
  border-color: var(--accent);
  color: var(--accent);
}
@media (max-width: 700px) {
  h1 { font-size: 36px; }
  .subtitle { font-size: 16px; }
  .features { grid-template-columns: 1fr; }
}
</style>