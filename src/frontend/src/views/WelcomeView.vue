<script setup lang="ts">
import { useRouter } from 'vue-router';
import SettingsMenu from '../components/SettingsMenu.vue';

const router = useRouter();

function goToApp() {
  router.push('/app');
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

      <button class="enter-btn" @click="goToApp">
        Войти в архив →
      </button>

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

<style>
/* Не scoped — нужно применить ко всему документу */
html,
body {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  overflow-x: hidden;
}
#app {
  width: 100%;
  min-height: 100vh;
}
</style>

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
@media (max-width: 700px) {
  h1 { font-size: 36px; }
  .subtitle { font-size: 16px; }
  .features { grid-template-columns: 1fr; }
}</style>