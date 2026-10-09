<script setup lang="ts">
interface Person {
  id: number;
  name: string;
  birthDate: string | null;
  photoUrl: string | null;
}

defineProps<{ data: Person }>();
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
  <div class="person-card" @dblclick="emit('edit')">
    <button class="delete-btn" @click.stop="emit('delete', data.id)">✕</button>
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
  padding: 10px 28px 10px 14px;
  background: white;
  border: 2px solid #4a90e2;
  border-radius: 8px;
  font-family: system-ui, sans-serif;
  min-width: 140px;
  text-align: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  color: #000;
  cursor: pointer;
  transition: box-shadow 0.15s;
}
.person-card:hover {
  box-shadow: 0 4px 12px rgba(74, 144, 226, 0.3);
}
.avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  margin: 0 auto 6px;
  overflow: hidden;
  background: #4a90e2;
  display: flex;
  align-items: center;
  justify-content: center;
}
.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.initial {
  color: white;
  font-size: 24px;
  font-weight: 600;
}
.name {
  font-weight: 600;
  font-size: 14px;
}
.date {
  font-size: 12px;
  color: #666;
  margin-top: 2px;
}
.delete-btn {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 20px;
  height: 20px;
  border: none;
  background: transparent;
  color: #c00;
  font-size: 14px;
  cursor: pointer;
  border-radius: 4px;
  padding: 0;
  line-height: 1;
}
.delete-btn:hover {
  background: #fee;
}
</style>