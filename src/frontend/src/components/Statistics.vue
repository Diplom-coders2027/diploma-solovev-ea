<script setup lang="ts">
import { ref, onMounted } from 'vue';
import axios from 'axios';

const API = `http://${window.location.hostname}:3000`;

interface Stats {
  total: number;
  generations: number;
  avgAge: number;
  oldest: { name: string; age: number; birthDate: string } | null;
  youngest: { name: string; age: number; birthDate: string } | null;
  birthdaysThisMonth: { name: string; birthDate: string }[];
  topSurnames: { surname: string; count: number }[];
}

const stats = ref<Stats | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);

async function loadStats() {
  loading.value = true;
  error.value = null;
  try {
    const res = await axios.get<Stats>(`${API}/stats`);
    stats.value = res.data;
  } catch (e) {
    error.value = 'Не удалось загрузить статистику';
    console.error(e);
  } finally {
    loading.value = false;
  }
}

onMounted(loadStats);
</script>

<template>
  <div class="stats">
    <p v-if="loading">Загрузка...</p>
    <p v-else-if="error" class="error">{{ error }}</p>

    <div v-else-if="stats" class="stats-grid">
      <div class="stat-card big">
        <div class="stat-icon">👥</div>
        <div class="stat-value">{{ stats.total }}</div>
        <div class="stat-label">Человек в дереве</div>
      </div>

      <div class="stat-card big">
        <div class="stat-icon">📏</div>
        <div class="stat-value">{{ stats.generations }}</div>
        <div class="stat-label">Поколений</div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">📅</div>
        <div class="stat-value">{{ stats.avgAge }}</div>
        <div class="stat-label">Средний возраст</div>
      </div>

      <div v-if="stats.oldest" class="stat-card">
        <div class="stat-icon">👴</div>
        <div class="stat-value">{{ stats.oldest.name }}</div>
        <div class="stat-label">Самый старший ({{ stats.oldest.age }} лет)</div>
      </div>

      <div v-if="stats.youngest" class="stat-card">
        <div class="stat-icon">👶</div>
        <div class="stat-value">{{ stats.youngest.name }}</div>
        <div class="stat-label">Самый младший ({{ stats.youngest.age }} лет)</div>
      </div>

      <div v-if="stats.birthdaysThisMonth.length > 0" class="stat-card wide">
        <div class="stat-icon">🎂</div>
        <div class="stat-title">Дни рождения в этом месяце</div>
        <ul class="birthday-list">
          <li v-for="(b, i) in stats.birthdaysThisMonth" :key="i">
            <span class="bday-name">{{ b.name }}</span>
            <span class="bday-date">{{ b.birthDate }}</span>
          </li>
        </ul>
      </div>

      <div v-if="stats.topSurnames.length > 0" class="stat-card wide">
        <div class="stat-icon">📛</div>
        <div class="stat-title">Топ фамилий</div>
        <ul class="surname-list">
          <li v-for="(s, i) in stats.topSurnames" :key="i">
            <span class="surname-name">{{ s.surname }}</span>
            <span class="surname-count">{{ s.count }} чел.</span>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<style scoped>
.stats {
  font-family: system-ui, sans-serif;
}
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
}
.stat-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 20px;
  box-shadow: var(--shadow-sm);
  transition: box-shadow 0.2s, transform 0.2s;
}
.stat-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}
.stat-card.big {
  padding: 24px 20px;
}
.stat-card.wide {
  grid-column: span 2;
}
.stat-icon {
  font-size: 32px;
  margin-bottom: 8px;
}
.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: var(--accent);
  margin-bottom: 4px;
  word-break: break-word;
}
.stat-label {
  font-size: 13px;
  color: var(--text-muted);
}
.stat-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 12px;
}
.birthday-list,
.surname-list {
  list-style: none;
  padding: 0;
  margin: 0;
}
.birthday-list li,
.surname-list li {
  display: flex;
  justify-content: space-between;
  padding: 6px 0;
  border-bottom: 1px solid var(--border-color);
  font-size: 14px;
}
.birthday-list li:last-child,
.surname-list li:last-child {
  border-bottom: none;
}
.bday-name,
.surname-name {
  color: var(--text-primary);
  font-weight: 500;
}
.bday-date,
.surname-count {
  color: var(--text-muted);
  font-size: 13px;
}
.error {
  color: var(--danger);
}
@media (max-width: 600px) {
  .stat-card.wide {
    grid-column: span 1;
  }
}
</style>