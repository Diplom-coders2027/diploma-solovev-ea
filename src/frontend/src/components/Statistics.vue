<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue';
import axios from 'axios';
import ErrorState from './ErrorState.vue';

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

// Числа «набегают» от нуля при появлении
const shown = reactive({ total: 0, generations: 0, avgAge: 0 });
const barsReady = ref(false);

const maxSurname = computed(() =>
  Math.max(1, ...(stats.value?.topSurnames.map((s) => s.count) ?? [1])),
);

function countUp(key: keyof typeof shown, target: number, duration = 900) {
  const start = performance.now();
  const step = (now: number) => {
    const t = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - t, 3);
    const v = target * eased;
    shown[key] = Number.isInteger(target) ? Math.round(v) : Math.round(v * 10) / 10;
    if (t < 1) requestAnimationFrame(step);
    else shown[key] = target;
  };
  requestAnimationFrame(step);
}

async function loadStats() {
  loading.value = true;
  error.value = null;
  barsReady.value = false;
  try {
    const res = await axios.get<Stats>(`${API}/stats`);
    stats.value = res.data;
    countUp('total', res.data.total);
    countUp('generations', res.data.generations);
    countUp('avgAge', res.data.avgAge);
    setTimeout(() => (barsReady.value = true), 150);
  } catch (e) {
    error.value =
      axios.isAxiosError(e) && !e.response
        ? 'Нет связи с сервером'
        : 'Не удалось загрузить статистику';
    console.error(e);
  } finally {
    loading.value = false;
  }
}

onMounted(loadStats);
</script>

<template>
  <div class="stats">
    <p v-if="loading" class="status">Загрузка…</p>
    <ErrorState v-else-if="error" :message="error" @retry="loadStats" />

    <div v-else-if="stats" class="stats-grid">
      <div class="stat-card big" style="--n: 0">
        <div class="stat-icon">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="9" cy="8" r="3.2" />
            <path d="M3 19c0-3.3 2.7-5.2 6-5.2s6 1.9 6 5.2" />
            <circle cx="17" cy="9" r="2.4" />
            <path d="M16.5 14c2.7 0 4.5 1.5 4.5 4" />
          </svg>
        </div>
        <div class="stat-value">{{ shown.total }}</div>
        <div class="stat-label">Человек в дереве</div>
      </div>

      <div class="stat-card big" style="--n: 1">
        <div class="stat-icon">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="5" r="2.4" />
            <circle cx="6" cy="19" r="2.4" />
            <circle cx="18" cy="19" r="2.4" />
            <path d="M12 7.4V12M12 12H6v4.6M12 12h6v4.6" />
          </svg>
        </div>
        <div class="stat-value">{{ shown.generations }}</div>
        <div class="stat-label">Поколений</div>
      </div>

      <div class="stat-card" style="--n: 2">
        <div class="stat-icon">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <rect x="4" y="5" width="16" height="15" rx="3" />
            <path d="M4 10h16M9 3v4M15 3v4" />
          </svg>
        </div>
        <div class="stat-value">{{ shown.avgAge }}</div>
        <div class="stat-label">Средний возраст</div>
      </div>

      <div v-if="stats.oldest" class="stat-card" style="--n: 3">
        <div class="stat-icon">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 20V8M12 8l-4 4M12 8l4 4M6 4h12" />
          </svg>
        </div>
        <div class="stat-value">{{ stats.oldest.name }}</div>
        <div class="stat-label">Самый старший ({{ stats.oldest.age }} лет)</div>
      </div>

      <div v-if="stats.youngest" class="stat-card" style="--n: 4">
        <div class="stat-icon">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 4v12M12 16l-4-4M12 16l4-4M6 20h12" />
          </svg>
        </div>
        <div class="stat-value">{{ stats.youngest.name }}</div>
        <div class="stat-label">Самый младший ({{ stats.youngest.age }} лет)</div>
      </div>

      <div v-if="stats.birthdaysThisMonth.length > 0" class="stat-card wide" style="--n: 5">
        <div class="stat-head">
          <div class="stat-icon">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <rect x="4" y="11" width="16" height="9" rx="2.5" />
              <path d="M4 15c2 1.6 4 1.6 6 0s4-1.6 6 0 3 1 4 0M12 11V8M12 8c-1.4 0-2-1-2-2 1.4 0 2 .8 2 2zM12 8c1.4 0 2-1 2-2-1.4 0-2 .8-2 2z" />
            </svg>
          </div>
          <div class="stat-title">Дни рождения в этом месяце</div>
        </div>
        <ul class="plain-list">
          <li v-for="(b, i) in stats.birthdaysThisMonth" :key="i">
            <span class="item-name">{{ b.name }}</span>
            <span class="item-meta">{{ b.birthDate }}</span>
          </li>
        </ul>
      </div>

      <div v-if="stats.topSurnames.length > 0" class="stat-card wide" style="--n: 6">
        <div class="stat-head">
          <div class="stat-icon">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M5 20V12M12 20V5M19 20v-5" />
            </svg>
          </div>
          <div class="stat-title">Топ фамилий</div>
        </div>
        <ul class="plain-list">
          <li v-for="(s, i) in stats.topSurnames" :key="i" class="surname-row">
            <div class="row-top">
              <span class="item-name">{{ s.surname }}</span>
              <span class="item-meta">{{ s.count }} чел.</span>
            </div>
            <div class="bar">
              <div
                class="bar-fill"
                :style="{ width: barsReady ? (s.count / maxSurname) * 100 + '%' : '0%', transitionDelay: i * 80 + 'ms' }"
              ></div>
            </div>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<style scoped>
.status {
  color: var(--text-muted);
}
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
}
.stat-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: 22px;
  animation: rise 0.6s var(--ease) both;
  animation-delay: calc(var(--n, 0) * 70ms);
  transition: transform 0.3s var(--ease), box-shadow 0.3s var(--ease), border-color 0.25s;
}
.stat-card:hover {
  transform: translateY(-4px);
  border-color: var(--border-strong);
  box-shadow: var(--shadow-md);
}
.stat-card.wide {
  grid-column: span 2;
}

.stat-icon {
  width: 42px;
  height: 42px;
  margin-bottom: 14px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--highlight);
  background: color-mix(in srgb, var(--highlight) 14%, var(--bg-secondary));
  transition: transform 0.35s var(--ease);
}
.stat-card:hover .stat-icon {
  transform: rotate(-8deg) scale(1.08);
}
.stat-icon svg {
  width: 22px;
  height: 22px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.stat-value {
  font-size: 30px;
  font-weight: 600;
  letter-spacing: -0.02em;
  line-height: 1.15;
  color: var(--text-primary);
  margin-bottom: 4px;
  word-break: break-word;
  font-variant-numeric: tabular-nums;
}
.stat-label {
  font-size: 13px;
  color: var(--text-muted);
}

.stat-head {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
}
.stat-head .stat-icon {
  margin-bottom: 0;
}
.stat-title {
  font-size: 16px;
  font-weight: 500;
  color: var(--text-primary);
}

.plain-list {
  list-style: none;
}
.plain-list li {
  padding: 9px 0;
  border-bottom: 1px solid var(--border-color);
  font-size: 14px;
}
.plain-list li:last-child {
  border-bottom: none;
}
.plain-list li:not(.surname-row) {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}
.item-name {
  color: var(--text-primary);
  font-weight: 500;
}
.item-meta {
  color: var(--text-muted);
  font-size: 13px;
  font-variant-numeric: tabular-nums;
}
.row-top {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 7px;
}
.bar {
  height: 6px;
  border-radius: 999px;
  background: var(--bg-tertiary);
  overflow: hidden;
}
.bar-fill {
  height: 100%;
  width: 0;
  border-radius: 999px;
  background: linear-gradient(90deg, var(--highlight), var(--highlight-soft));
  transition: width 0.9s var(--ease);
}

@media (max-width: 600px) {
  .stat-card.wide {
    grid-column: span 1;
  }
}
</style>
