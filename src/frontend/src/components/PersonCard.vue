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
    @dblclick="emit('edit')"
  >
    <div class="card-actions">
      <button class="action-btn edit" @click.stop="emit('edit')" title="Редактировать">
        ✎
      </button>
      <button class="action-btn delete" @click.stop="emit('delete', data.id)" title="Удалить">
        ✕
      </button>
    </div>

    <div class="avatar">
      <img v-if="data.photoUrl" :src="getPhotoUrl(data.photoUrl)!" :alt="data.name" />
      <span v-else class="initial">{{ getInitial(data.name) }}</span>
    </div>

    <div class="name">{{ data.name }}</div>
    <div v-if="data.birthDate" class="date">{{ data.birthDate }}</div>
  </div>
</template>

<style scoped>
.person-card {
  position: relative;
  padding: 14px 14px 12px;
  background: var(--bg-secondary);
  border: 2px solid var(--accent);
  border-radius: 12px;
  font-family: system-ui, sans-serif;
  min-width: 160px;
  text-align: center;
  box-shadow: var(--shadow-sm);
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.2s ease;
}
.person-card:hover {
  box-shadow: 0 6px 20px rgba(74, 144, 226, 0.35);
  transform: translateY(-2px);
  border-color: var(--accent-hover);
}

.person-card.highlighted {
  border-color: #f5a623;
  box-shadow: 0 0 0 4px rgba(245, 166, 35, 0.3), 0 8px 24px rgba(245, 166, 35, 0.5);
  animation: highlightPulse 1s ease-in-out infinite;
  z-index: 10;
}

@keyframes highlightPulse {
  0%, 100% {
    box-shadow: 0 0 0 4px rgba(245, 166, 35, 0.3), 0 8px 24px rgba(245, 166, 35, 0.5);
  }
  50% {
    box-shadow: 0 0 0 8px rgba(245, 166, 35, 0.15), 0 12px 32px rgba(245, 166, 35, 0.7);
  }
}

.card-actions {
  position: absolute;
  top: 6px;
  right: 6px;
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s;
}
.person-card:hover .card-actions {
  opacity: 1;
}

.action-btn {
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  padding: 0;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s, color 0.15s;
}
.action-btn.edit {
  background: var(--accent-light);
  color: var(--accent);
}
.action-btn.edit:hover {
  background: var(--accent);
  color: white;
}
.action-btn.delete {
  background: var(--danger-bg);
  color: var(--danger);
}
.action-btn.delete:hover {
  background: var(--danger);
  color: white;
}

.avatar {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  margin: 0 auto 8px;
  overflow: hidden;
  background: linear-gradient(135deg, var(--accent) 0%, var(--accent-hover) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 3px solid var(--bg-secondary);
  box-shadow: 0 2px 8px rgba(74, 144, 226, 0.3);
}
.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.initial {
  color: white;
  font-size: 26px;
  font-weight: 600;
}
.name {
  font-weight: 600;
  font-size: 14px;
  color: var(--text-primary);
  margin-bottom: 2px;
}
.date {
  font-size: 12px;
  color: var(--text-muted);
}
</style>