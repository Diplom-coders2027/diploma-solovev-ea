<script setup lang="ts">
interface Person {
  id: number;
  name: string;
  birthDate: string | null;
  photoUrl: string | null;
}

defineProps<{
  data: Person;
  highlighted?: boolean;
}>();

const emit = defineEmits<{
  (e: 'delete', id: number): void;
  (e: 'edit'): void;
}>();

const API = 'http://localhost:3000';

function getPhotoUrl(url: string | null): string | null {
  if (!url) return null;
  return `${API}${url}`;
}

function getInitial(name: string): string {
  return name.charAt(0).toUpperCase();
}
</script>

<template>
  <div
    class="person-card"
    :class="{ highlighted }"
    :style="{ '--d': (data.id % 10) * 45 + 'ms' }"
    @dblclick="emit('edit')"
  >
    <div class="card-actions">
      <button
        class="action-btn edit"
        @click.stop="emit('edit')"
        title="Редактировать"
        :aria-label="`Редактировать: ${data.name}`"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16v4zM13.5 6.5l4 4" /></svg>
      </button>
      <button
        class="action-btn delete"
        @click.stop="emit('delete', data.id)"
        title="Удалить"
        :aria-label="`Удалить: ${data.name}`"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
      </button>
    </div>

    <div class="ring">
      <div class="photo">
        <img v-if="data.photoUrl" :src="getPhotoUrl(data.photoUrl)!" :alt="data.name" />
        <span v-else class="initial">{{ getInitial(data.name) }}</span>
      </div>
    </div>

    <div class="plate">
      <div class="name">{{ data.name }}</div>
      <div v-if="data.birthDate" class="date">{{ data.birthDate }}</div>
    </div>
  </div>
</template>

<style scoped>
.person-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 168px;
  height: 184px;
  padding: 14px 10px 10px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 22px;
  color: var(--text-primary);
  cursor: pointer;
  animation: popIn 0.5s var(--ease) both;
  animation-delay: var(--d, 0ms);
  transition: transform 0.3s var(--ease), border-color 0.25s, box-shadow 0.3s var(--ease);
}
.person-card:hover {
  transform: translateY(-4px);
  border-color: var(--border-strong);
  box-shadow: var(--shadow-md);
}

.person-card.highlighted {
  border-color: var(--highlight);
  box-shadow: 0 0 0 3px var(--highlight-ring), var(--shadow-md);
  animation: highlightPulse 1s ease-in-out 3;
  z-index: 10;
}
@keyframes highlightPulse {
  0%, 100% { box-shadow: 0 0 0 3px var(--highlight-ring), var(--shadow-md); }
  50% { box-shadow: 0 0 0 12px transparent, var(--shadow-md); }
}

.card-actions {
  position: absolute;
  top: 8px;
  right: 8px;
  display: flex;
  gap: 4px;
  opacity: 0;
  transform: translateY(-4px) scale(0.9);
  transition: opacity 0.2s, transform 0.25s var(--ease);
  z-index: 2;
}
.person-card:hover .card-actions,
.person-card:focus-within .card-actions {
  opacity: 1;
  transform: none;
}
.action-btn {
  width: 26px;
  height: 26px;
  border: 1px solid var(--border-strong);
  border-radius: 50%;
  padding: 0;
  background: var(--bg-elevated);
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.15s, color 0.15s, border-color 0.15s, transform 0.2s var(--ease);
}
.action-btn:hover {
  transform: scale(1.12);
}
.action-btn svg {
  width: 14px;
  height: 14px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.action-btn.edit:hover {
  background: var(--accent);
  border-color: var(--accent);
  color: var(--on-accent);
}
.action-btn.delete:hover {
  background: var(--danger-solid);
  border-color: var(--danger-solid);
  color: #fff;
}

/* Круглый портрет с градиентным кольцом; на наведении кольцо вращается */
.ring {
  position: relative;
  width: 84px;
  height: 84px;
  flex-shrink: 0;
  border-radius: 50%;
}
.ring::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: conic-gradient(from 0deg, var(--highlight), var(--highlight-soft), var(--highlight));
  opacity: 0.85;
}
.person-card:hover .ring::before {
  animation: spin 3s linear infinite;
}
.photo {
  position: absolute;
  inset: 3px;
  border-radius: 50%;
  overflow: hidden;
  border: 3px solid var(--bg-secondary);
  background: var(--bg-tertiary);
  display: flex;
}
.photo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.initial {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(145deg, var(--bg-elevated), var(--bg-tertiary));
  color: var(--highlight-soft);
  font-family: var(--font-display);
  font-style: italic;
  font-size: 30px;
  font-weight: 500;
}

/* Подпись */
.plate {
  margin-top: 9px;
  width: 100%;
  text-align: center;
  min-width: 0;
}
.name {
  font-family: var(--font-ui);
  font-weight: 500;
  font-size: 14px;
  line-height: 1.22;
  color: var(--text-primary);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.date {
  margin-top: 3px;
  font-size: 12px;
  color: var(--text-muted);
  font-variant-numeric: tabular-nums;
}
</style>
