<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
import SettingsMenu from '../components/SettingsMenu.vue';

const router = useRouter();
const API = 'http://localhost:3000';

// Графика на главной: поколения «по орбитам» вокруг одного человека.
// Углы в градусах, радиус — расстояние от центра в системе viewBox 420×340.
const orbits = [
  { id: 'o1', r: 92, scale: 0.9, angles: [30, 150, 270] },
  { id: 'o2', r: 146, scale: 0.68, angles: [0, 72, 144, 216, 288] },
];

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
    <div class="bg-decor" aria-hidden="true">
      <span class="blob blob-a"></span>
      <span class="blob blob-b"></span>
      <svg class="rings" viewBox="0 0 600 600">
        <circle cx="300" cy="300" r="110" />
        <circle cx="300" cy="300" r="175" class="dash" />
        <circle cx="300" cy="300" r="240" />
        <circle cx="300" cy="300" r="290" class="dash" />
      </svg>
    </div>

    <div class="top-right">
      <SettingsMenu />
    </div>

    <main class="welcome-content">
      <section class="hero">
        <div class="hero-text">
          <h1>Семейный архив</h1>
          <p class="subtitle">
            Сохраните историю своей семьи: дерево, фотографии и голоса близких — в одном месте.
          </p>

          <div class="buttons">
            <button class="enter-btn" @click="goToApp">
              <span>Войти в архив</span>
              <svg class="arrow" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
            </button>

            <label class="import-btn" :class="{ disabled: importing }">
              <input
                type="file"
                accept=".ged,.gedcom"
                @change="onGedcomSelect"
                :disabled="importing"
              />
              <span v-if="!importing">Импортировать GEDCOM</span>
              <span v-else>Импортирую…</span>
            </label>

            <button class="export-btn" @click="exportGedcom">Экспорт GEDCOM</button>
          </div>

          <p v-if="importMessage" class="import-message success" role="status">{{ importMessage }}</p>
          <p v-if="importError" class="import-message error" role="alert">{{ importError }}</p>

          <p class="hint">
            Поддерживаются файлы из MyHeritage, Ancestry, «Древа Жизни» и других генеалогических программ.
          </p>
        </div>

        <svg
          class="tree-art"
          viewBox="0 0 420 340"
          role="img"
          aria-label="Графика: поколения семьи по орбитам вокруг одного человека"
        >
          <defs>
            <clipPath id="avatarClip"><circle r="22" /></clipPath>
          </defs>

          <g transform="translate(210 170)">
            <!-- орбиты -->
            <circle v-for="o in orbits" :key="'l' + o.id" :r="o.r" class="orbit-line" />

            <!-- люди на орбитах: орбита вращается, силуэты остаются прямо -->
            <g v-for="(o, oi) in orbits" :key="o.id" :class="['orbit', o.id]">
              <g
                v-for="(a, k) in o.angles"
                :key="a"
                :transform="`rotate(${a}) translate(${o.r} 0)`"
              >
                <g :transform="`rotate(${-a})`">
                  <g class="pop" :style="{ '--i': oi * 3 + k + 1 }">
                    <g :class="['counter', o.id]">
                      <g :transform="`scale(${o.scale})`">
                        <circle r="26" class="ring" />
                        <circle r="22" class="node-bg" />
                        <g clip-path="url(#avatarClip)">
                          <circle cy="-5" r="8" class="node-fig" />
                          <ellipse cy="24" rx="18" ry="14" class="node-fig" />
                        </g>
                      </g>
                    </g>
                  </g>
                </g>
              </g>
            </g>

            <!-- центральный человек -->
            <g class="pop is-found" style="--i: 0">
              <g transform="scale(1.9)">
                <circle r="26" class="ring" />
                <circle r="22" class="node-bg" />
                <g clip-path="url(#avatarClip)">
                  <circle cy="-5" r="8" class="node-fig" />
                  <ellipse cy="24" rx="18" ry="14" class="node-fig" />
                </g>
              </g>
              <circle r="62" class="halo pulse" />
            </g>
          </g>
        </svg>
      </section>

      <ul class="features">
        <li class="feature">
          <svg class="feature-icon" viewBox="0 0 32 32" aria-hidden="true">
            <circle cx="16" cy="6" r="3.5" />
            <circle cx="7" cy="25" r="3.5" />
            <circle cx="25" cy="25" r="3.5" />
            <path d="M16 9.5 V15 M16 15 H7 V21.5 M16 15 H25 V21.5" />
          </svg>
          <h2 class="feature-title">Семейное дерево</h2>
          <p class="feature-text">Связи между поколениями, у каждого человека до двух родителей.</p>
        </li>
        <li class="feature">
          <svg class="feature-icon" viewBox="0 0 32 32" aria-hidden="true">
            <rect x="5" y="4" width="22" height="24" rx="2" />
            <circle cx="16" cy="14" r="4" />
            <path d="M9 24 C9 20 12 19 16 19 C20 19 23 20 23 24" />
          </svg>
          <h2 class="feature-title">Фотографии</h2>
          <p class="feature-text">Личный портрет для каждого члена семьи.</p>
        </li>
        <li class="feature">
          <svg class="feature-icon" viewBox="0 0 32 32" aria-hidden="true">
            <rect x="12" y="3" width="8" height="15" rx="4" />
            <path d="M7 15 C7 21 11 24 16 24 C21 24 25 21 25 15 M16 24 V29 M11 29 H21" />
          </svg>
          <h2 class="feature-title">Голоса</h2>
          <p class="feature-text">Запишите и сохраните голос близких, пока он рядом.</p>
        </li>
      </ul>
    </main>
  </div>
</template>

<style scoped>
.welcome {
  position: relative;
  min-height: 100vh;
  display: flex;
  justify-content: center;
  padding: 72px 32px 56px;
  background: var(--bg-primary);
  transition: background-color 0.2s;
}
.top-right {
  position: absolute;
  top: 20px;
  right: 24px;
}
.welcome-content {
  width: 100%;
  max-width: 1080px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 72px;
}

/* ---------- Первый экран ---------- */
.hero {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(280px, 420px);
  align-items: center;
  gap: 56px;
}
h1 {
  font-family: var(--font-ui);
  font-weight: 500;
  font-size: clamp(40px, 6vw, 72px);
  line-height: 1.02;
  letter-spacing: -0.035em;
  color: var(--text-primary);
  margin-bottom: 20px;
}
.subtitle {
  font-size: 18px;
  line-height: 1.6;
  color: var(--text-secondary);
  max-width: 30em;
  margin-bottom: 36px;
}
.buttons {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}
.enter-btn,
.import-btn span {
  display: inline-block;
  padding: 14px 26px;
  font-size: 16px;
  font-weight: 500;
  border-radius: 999px;
  line-height: 1.2;
  transition: background-color 0.15s, border-color 0.15s, color 0.15s;
}
.enter-btn {
  color: var(--on-accent);
  background: var(--accent);
  border: 1px solid var(--accent);
}
.enter-btn:hover {
  background: var(--accent-hover);
  border-color: var(--accent-hover);
}
.import-btn {
  position: relative;
  display: inline-block;
}
.import-btn input[type="file"] {
  position: absolute;
  opacity: 0;
  width: 1px;
  height: 1px;
}
.import-btn span {
  color: var(--accent);
  background: transparent;
  border: 1px solid var(--accent);
  cursor: pointer;
}
.import-btn span:hover {
  background: var(--accent-light);
}
.import-btn input:focus-visible + span {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}
.import-btn.disabled span {
  opacity: 0.5;
  cursor: not-allowed;
}
.export-btn {
  padding: 14px 10px;
  font-size: 15px;
  color: var(--text-secondary);
  background: transparent;
  border: none;
  text-decoration: underline;
  text-underline-offset: 4px;
  text-decoration-color: var(--border-strong);
}
.export-btn:hover {
  color: var(--accent);
  text-decoration-color: currentColor;
}
.import-message {
  display: inline-block;
  font-size: 14px;
  padding: 8px 14px;
  border-radius: var(--radius-md);
  margin-bottom: 16px;
}
.import-message.success {
  color: var(--success);
  background: var(--success-bg);
}
.import-message.error {
  color: var(--danger);
  background: var(--danger-bg);
}
.hint {
  font-size: 13px;
  line-height: 1.5;
  color: var(--text-muted);
  max-width: 34em;
}

/* ---------- Схема дерева ---------- */
.tree-art {
  width: 100%;
  height: auto;
  overflow: visible;
  animation: float 8s ease-in-out 2.5s infinite;
}
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}
.tree-art .lines path {
  stroke: color-mix(in srgb, var(--highlight) 38%, var(--border-strong));
  stroke-width: 1.5;
  stroke-linecap: round;
  stroke-dasharray: 1;
  stroke-dashoffset: 1;
  animation: draw 0.7s ease-out forwards;
  animation-delay: calc(var(--i) * 0.35s + 0.2s);
}
.tree-art .ring {
  fill: var(--bg-primary);
  stroke: color-mix(in srgb, var(--highlight) 50%, var(--bg-primary));
  stroke-width: 1.5;
}
.tree-art .node-bg {
  fill: color-mix(in srgb, var(--highlight) 14%, var(--bg-primary));
}
.tree-art .node-fig {
  fill: color-mix(in srgb, var(--highlight) 58%, var(--bg-primary));
}
.tree-art .is-found .ring {
  stroke: var(--highlight);
  stroke-width: 2.5;
}
.tree-art .is-found .node-bg {
  fill: color-mix(in srgb, var(--highlight) 28%, var(--bg-primary));
}
.tree-art .is-found .node-fig {
  fill: var(--highlight);
}
.tree-art .pop {
  opacity: 0;
  animation: popIn 0.55s var(--ease) forwards;
  animation-delay: calc(var(--i) * 0.35s);
}
.tree-art .halo {
  fill: none;
  stroke: var(--highlight);
  stroke-width: 1.5;
}
.tree-art .pulse {
  animation: pulseRing 2.4s ease-out 2s infinite;
}
@keyframes pulseRing {
  from { transform: scale(1); opacity: 0.7; }
  to { transform: scale(1.5); opacity: 0; }
}
@keyframes draw {
  to { stroke-dashoffset: 0; }
}
@keyframes appear {
  to { opacity: 1; }
}

/* ---------- Возможности ---------- */
.features {
  list-style: none;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  border-top: 1px solid var(--border-strong);
}
.feature {
  padding: 28px 28px 0 0;
}
.feature + .feature {
  padding-left: 28px;
  border-left: 1px solid var(--border-color);
}
.feature-icon {
  width: 32px;
  height: 32px;
  margin-bottom: 14px;
  fill: none;
  stroke: var(--accent);
  stroke-width: 1.6;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.feature-title {
  font-weight: 500;
  font-size: 19px;
  margin-bottom: 6px;
  color: var(--text-primary);
}
.feature-text {
  font-size: 14px;
  line-height: 1.55;
  color: var(--text-secondary);
  max-width: 24em;
}

@media (max-width: 860px) {
  .welcome { padding: 72px 20px 40px; }
  .hero { grid-template-columns: 1fr; gap: 40px; }
  .tree-art { max-width: 360px; }
  .features { grid-template-columns: 1fr; }
  .feature,
  .feature + .feature { padding: 24px 0; border-left: none; }
  .feature + .feature { border-top: 1px solid var(--border-color); }
}

/* ---------- Графика фона ---------- */
.welcome {
  overflow: hidden;
}
.bg-decor {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}
.blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
}
.blob-a {
  width: 440px;
  height: 440px;
  top: -140px;
  right: -90px;
  background: var(--highlight);
  opacity: 0.17;
  animation: drift 16s ease-in-out infinite alternate;
}
.blob-b {
  width: 380px;
  height: 380px;
  bottom: -160px;
  left: -110px;
  background: var(--highlight-soft);
  opacity: 0.12;
  animation: drift 20s ease-in-out infinite alternate-reverse;
}
@keyframes drift {
  from { transform: translate(0, 0) scale(1); }
  to { transform: translate(-40px, 50px) scale(1.15); }
}
.rings {
  position: absolute;
  width: 680px;
  right: -200px;
  bottom: -240px;
  fill: none;
  stroke: var(--border-strong);
  stroke-width: 1;
  opacity: 0.55;
  animation: spin 120s linear infinite;
}
.rings .dash {
  stroke-dasharray: 2 9;
  stroke-linecap: round;
}
.welcome-content,
.top-right {
  position: relative;
  z-index: 1;
}
.top-right {
  position: absolute;
  z-index: 2;
}

/* ---------- Появление ---------- */
.hero-text h1 { animation: rise 0.8s var(--ease) 0.05s both; }
.hero-text .subtitle { animation: rise 0.8s var(--ease) 0.18s both; }
.hero-text .buttons { animation: rise 0.8s var(--ease) 0.3s both; }
.hero-text .hint { animation: rise 0.8s var(--ease) 0.42s both; }
.feature { animation: rise 0.8s var(--ease) both; }
.feature:nth-child(1) { animation-delay: 0.55s; }
.feature:nth-child(2) { animation-delay: 0.7s; }
.feature:nth-child(3) { animation-delay: 0.85s; }
.feature-icon {
  transition: transform 0.35s var(--ease);
}
.feature:hover .feature-icon {
  transform: translateY(-4px) rotate(-6deg) scale(1.08);
}
.enter-btn {
  transition: background-color 0.15s, border-color 0.15s, transform 0.25s var(--ease), box-shadow 0.25s;
}
.enter-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 22px var(--accent-ring);
}
.enter-btn:active {
  transform: scale(0.97);
}

/* ---------- Анимации кнопок ---------- */
.enter-btn {
  position: relative;
  overflow: hidden;
  display: inline-flex;
  align-items: center;
  gap: 10px;
}
.enter-btn .arrow {
  width: 18px;
  height: 18px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
  transition: transform 0.35s var(--ease);
}
.enter-btn:hover .arrow {
  transform: translateX(5px);
}
.enter-btn::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(110deg, transparent 30%, color-mix(in srgb, var(--highlight) 50%, transparent) 50%, transparent 70%);
  transform: translateX(-120%);
}
.enter-btn:hover::after {
  transform: translateX(120%);
  transition: transform 0.75s var(--ease);
}

/* «Импорт»: заливка выезжает слева */
.import-btn span {
  background-color: transparent;
  background-image: linear-gradient(var(--accent-light), var(--accent-light));
  background-repeat: no-repeat;
  background-position: left center;
  background-size: 0% 100%;
  transition: background-size 0.45s var(--ease), transform 0.25s var(--ease), color 0.15s;
}
.import-btn span:hover {
  background-color: transparent;
  background-size: 100% 100%;
  transform: translateY(-2px);
}
.import-btn:active span {
  transform: scale(0.97);
}

/* «Экспорт»: подчёркивание растёт от края */
.export-btn {
  text-decoration: none;
  background-image: linear-gradient(currentColor, currentColor), linear-gradient(var(--border-strong), var(--border-strong));
  background-repeat: no-repeat;
  background-position: 10px calc(100% - 11px);
  background-size: 0 1px, calc(100% - 20px) 1px;
  transition: background-size 0.4s var(--ease), color 0.15s, transform 0.25s var(--ease);
}
.export-btn:hover {
  background-size: calc(100% - 20px) 1px, calc(100% - 20px) 1px;
  transform: translateY(-1px);
}

/* ---------- Орбиты ---------- */
.tree-art {
  animation: none;
}
.tree-art .ring {
  vector-effect: non-scaling-stroke;
}
.tree-art .pop {
  animation-delay: calc(var(--i) * 0.12s + 0.15s);
}
.tree-art .orbit-line {
  fill: none;
  stroke: color-mix(in srgb, var(--highlight) 32%, var(--border-strong));
  stroke-width: 1;
  stroke-dasharray: 2 7;
  stroke-linecap: round;
  animation: fadeIn 1s ease-out both;
}
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
.tree-art .orbit.o1 { animation: spin 48s linear infinite; }
.tree-art .counter.o1 { animation: spin 48s linear infinite reverse; }
.tree-art .orbit.o2 { animation: spin 80s linear infinite reverse; }
.tree-art .counter.o2 { animation: spin 80s linear infinite; }
</style>
