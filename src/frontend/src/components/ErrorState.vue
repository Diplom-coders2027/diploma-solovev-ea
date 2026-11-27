<script setup lang="ts">
withDefaults(
  defineProps<{
    message?: string;
    hint?: string;
  }>(),
  {
    message: 'Не удаётся подключиться к серверу',
    hint: 'Похоже, лиса перегрызла провод. Проверьте, что сервер запущен, и повторите попытку.',
  },
);

const emit = defineEmits<{ (e: 'retry'): void }>();
</script>

<template>
  <div class="error-state" role="alert">
    <svg class="scene" viewBox="0 0 240 204" aria-hidden="true">
      <!-- розетка и вилка слева -->
      <rect class="socket" x="2" y="94" width="12" height="36" rx="3" />
      <rect class="hole" x="5" y="104" width="6" height="3" rx="1.5" />
      <rect class="hole" x="5" y="116" width="6" height="3" rx="1.5" />
      <path class="prong" d="M14 108 H22 M14 116 H22" />
      <rect class="plug" x="22" y="102" width="22" height="20" rx="4" />

      <!-- хвост -->
      <path class="tail" d="M166 184 C204 186 214 150 194 128" />
      <path class="tail-tip" d="M200 140 C206 148 206 156 200 164" />

      <!-- уши -->
      <path class="fur round" d="M76 60 L66 20 L106 42 Z" />
      <path class="fur round" d="M164 60 L174 20 L134 42 Z" />
      <path class="ear-in" d="M78 52 L73 29 L96 43 Z" />
      <path class="ear-in" d="M162 52 L167 29 L144 43 Z" />

      <!-- тело -->
      <path
        class="fur"
        d="M72 178 C66 142 86 122 120 122 C154 122 174 142 168 178 C168 192 150 198 120 198 C90 198 72 192 72 178 Z"
      />
      <ellipse class="light" cx="120" cy="162" rx="23" ry="27" />

      <!-- голова -->
      <ellipse class="fur" cx="120" cy="82" rx="55" ry="44" />
      <!-- щёчки -->
      <path class="fur round" d="M68 92 L58 100 L74 104 Z" />
      <path class="fur round" d="M172 92 L182 100 L166 104 Z" />

      <!-- лицо: прищуренные счастливые глаза, носик, светлая мордочка -->
      <path class="eye" d="M90 80 Q102 68 114 80" />
      <path class="eye" d="M126 80 Q138 68 150 80" />
      <ellipse class="light" cx="120" cy="101" rx="17" ry="11" />
      <ellipse class="nose" cx="120" cy="94" rx="6" ry="4" />
      <path class="smile" d="M113 102 Q120 108 127 102" />

      <!-- лапы и ноги -->
      <ellipse class="fur outline" cx="80" cy="160" rx="10" ry="24" transform="rotate(10 80 160)" />
      <ellipse class="fur outline" cx="160" cy="160" rx="10" ry="24" transform="rotate(-10 160 160)" />
      <ellipse class="fur outline" cx="98" cy="198" rx="15" ry="7" />
      <ellipse class="fur outline" cx="142" cy="198" rx="15" ry="7" />

      <!-- провод: идёт к мордочке, правая вилка валяется -->
      <path class="cable" d="M44 112 C70 124 92 100 120 108 C148 116 172 128 196 112" />
      <path class="prong" d="M218 108 H228 M218 116 H228" />
      <rect class="plug" x="196" y="102" width="22" height="20" rx="4" />

      <!-- зубки, искра и кусочки изоляции -->
      <rect class="tooth" x="114" y="105" width="5.5" height="8" rx="1.5" />
      <rect class="tooth" x="120.5" y="105" width="5.5" height="8" rx="1.5" />
      <path class="spark" d="M96 96 L101 88 L100 94 L107 87" />
      <path class="spark" d="M142 96 L147 89 L146 95 L152 90" />
      <circle class="chip" cx="88" cy="104" r="2" />
      <circle class="chip" cx="154" cy="102" r="1.7" />
    </svg>

    <h3>{{ message }}</h3>
    <p>{{ hint }}</p>
    <button class="retry" @click="emit('retry')">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M20 12a8 8 0 1 1-2.6-5.9M20 4v5h-5" />
      </svg>
      Повторить
    </button>
  </div>
</template>

<style scoped>
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 40px 20px;
  animation: rise 0.6s var(--ease) both;
}

.scene {
  width: 240px;
  height: auto;
  margin-bottom: 18px;
  overflow: visible;
}

/* Цвета лисы: инверсия под тему — тёмная лиса на светлой, светлая на тёмной */
.fur {
  fill: var(--text-primary);
}
.fur.round {
  stroke: var(--text-primary);
  stroke-width: 6;
  stroke-linejoin: round;
}
.fur.outline {
  stroke: var(--bg-primary);
  stroke-width: 2;
}
.light {
  fill: var(--bg-secondary);
}
.ear-in {
  fill: var(--text-muted);
}
.tail {
  fill: none;
  stroke: var(--text-primary);
  stroke-width: 16;
  stroke-linecap: round;
}
.tail-tip {
  fill: none;
  stroke: var(--bg-secondary);
  stroke-width: 8;
  stroke-linecap: round;
}
.eye {
  fill: none;
  stroke: var(--bg-primary);
  stroke-width: 4;
  stroke-linecap: round;
}
.nose {
  fill: var(--text-primary);
}
.smile {
  fill: none;
  stroke: var(--text-primary);
  stroke-width: 2;
  stroke-linecap: round;
}

/* Провод, вилка, розетка */
.cable {
  fill: none;
  stroke: var(--text-muted);
  stroke-width: 7;
  stroke-linecap: round;
}
.plug {
  fill: var(--text-secondary);
}
.prong {
  fill: none;
  stroke: var(--text-secondary);
  stroke-width: 3;
  stroke-linecap: round;
}
.socket {
  fill: var(--bg-tertiary);
  stroke: var(--border-strong);
  stroke-width: 1.5;
}
.hole {
  fill: var(--text-muted);
}
.tooth {
  fill: var(--bg-primary);
  stroke: var(--text-primary);
  stroke-width: 1.4;
}
.spark {
  fill: none;
  stroke: var(--text-primary);
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.chip {
  fill: var(--text-muted);
}

h3 {
  font-size: 22px;
  color: var(--text-primary);
  margin-bottom: 8px;
  animation: rise 0.6s var(--ease) 0.15s both;
}
p {
  max-width: 28em;
  font-size: 15px;
  line-height: 1.55;
  color: var(--text-secondary);
  margin-bottom: 24px;
  animation: rise 0.6s var(--ease) 0.25s both;
}

.retry {
  position: relative;
  overflow: hidden;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 11px 24px;
  font-size: 15px;
  font-weight: 500;
  color: var(--on-accent);
  background: var(--accent);
  border: 1px solid var(--accent);
  border-radius: 999px;
  animation: rise 0.6s var(--ease) 0.35s both;
  transition: background-color 0.15s, transform 0.25s var(--ease), box-shadow 0.25s;
}
.retry:hover {
  background: var(--accent-hover);
  transform: translateY(-2px);
  box-shadow: 0 8px 20px var(--accent-ring);
}
.retry:active {
  transform: scale(0.97);
}
.retry svg {
  width: 18px;
  height: 18px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
  transition: transform 0.5s var(--ease);
}
.retry:hover svg {
  transform: rotate(180deg);
}
</style>
