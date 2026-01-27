// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import ToursPage from '@/pages/ToursPage.vue'
import TourViewPage from '@/pages/TourViewPage.vue'
import TourEditPage from '@/pages/TourEditPage.vue'
import AuthPage from '@/pages/AuthPage.vue'
import store from '@/store'

const routes = [
    { path: '/', name: 'tours', component: ToursPage },
    { path: '/tour/:id', name: 'tour-view', component: TourViewPage },
    { path: '/tour/:id/edit', name: 'tour-edit', component: TourEditPage, meta: { requiresAuth: true } },
    { path: '/auth', name: 'auth', component: AuthPage },
    {
        path: '/manage',
        name: 'tour-manage',
        component: () => import('@/pages/TourManagePage.vue'),
        meta: { requiresAuth: true }
    },
    {
        path: '/tour/create',
        name: 'tour-create',
        component: () => import('@/pages/TourCreatePage.vue'),
        meta: { requiresAuth: true }
    },
    {
        path: '/tour/:id/scene/:sceneId',
        name: 'scene-edit',
        component: () => import('@/pages/SceneEditorPage.vue'),
        meta: { requiresAuth: true }
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

router.beforeEach(function(to, from, next) {
    if (to.meta.requiresAuth && !store.getters['auth/isAuthenticated']) {
        next({ name: 'auth' })
    } else {
        next()
    }
})

export default router