import { createRouter, createWebHistory } from 'vue-router';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'persons',
      component: () => import('../views/PersonList.vue'),
    },
  ],
});

export default router;