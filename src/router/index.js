import AppLayout from '@/layout/AppLayout.vue';
import { createRouter, createWebHistory } from 'vue-router';
import { authGuard } from './guard/auth.guard';

const router = createRouter({
    history: createWebHistory(),
    routes: [
        {
            path: '/auth/login',
            name: 'login',
            component: () => import('@/views/pages/auth/Login.vue')
        },
        {
            path: '/',
            component: AppLayout,
            children: [
                {
                    path: '/',
                    name: 'dashboard',
                    meta:{
                        requiresAuth: true,
                    },
                    component: () => import('@/views/Dashboard.vue')
                },
                {
                    path: '/participants',
                    name : 'participants',
                    meta:{
                        requiresAuth: true,
                    },
                    component: () => import('@/views/Participants.vue')
                },
                {
                    path: '/events',
                    name : 'events',
                    meta:{
                        requiresAuth: true,
                    },
                    component: () => import('@/views/Events.vue')
                },
                {
                    path: '/categories',
                    name : 'categories',
                    meta:{
                        requiresAuth: true,
                    },
                    component: () => import('@/views/Categories.vue')
                },
                {
                    path: '/heats',
                    name : 'heats',
                    meta:{
                        requiresAuth: true,
                    },
                    component: () => import('@/views/Heats.vue')
                },
                {
                    path: '/Results',
                    name : 'results',
                    meta:{
                        requiresAuth: true,
                    },
                    component: () => import('@/views/Results.vue')
                },
                {
                    path: '/leaderboard',
                    name : 'leaderboard',
                    meta:{
                        requiresAuth: true,
                    },
                    component: () => import('@/views/Leaderboard.vue')
                }

                
        ]
        },
    
    ]
});


router.beforeEach(authGuard);
export default router;
