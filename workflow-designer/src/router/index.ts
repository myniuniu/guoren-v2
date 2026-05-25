import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: '/process-list',
    },
    {
      path: '/process-list',
      name: 'ProcessList',
      component: () => import('../views/ProcessList.vue'),
    },
    {
      path: '/designer',
      name: 'Designer',
      component: () => import('../views/FormDesigner.vue'),
    },
    {
      path: '/embedded',
      name: 'EmbeddedDesigner',
      component: () => import('../views/DesignerView.vue'),
    },
    {
      path: '/form-list',
      name: 'FormList',
      component: () => import('../views/FormList.vue'),
    },
    {
      path: '/form-designer',
      name: 'FormDesigner',
      component: () => import('../views/FormDesigner.vue'),
    },
  ],
})

export default router
