<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';
import AppMenuItem from './AppMenuItem.vue';

// Get access to the store and router
const store = useStore();
const router = useRouter();

// Logout function
const logout = async () => {
  try {
    await store.dispatch('auth/logout');
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    router.push('/auth/login');
  }
};


// Define all menu items with their role requirements
const allMenuItems = [
  {
    label: 'Menu',
    items: [{ label: 'Dashboard', icon: 'pi pi-fw pi-home', to: '/' }],
    roles: ['Admin']
  },
  {
    items: [{ label: 'Participants', icon: 'pi pi-fw pi-user', to: '/participants/' }],
    roles: ['Admin', 'Official']
  },
  {
    items: [{ label: 'Events', icon: 'pi pi-fw pi-clipboard', to: '/events/' }],
    roles: ['Admin']
  },
  {
    items: [{ label: 'Categories', icon: 'pi pi-fw pi-users', to: '/categories/' }],
    roles: ['Admin']
  },
  {
    items: [{ label: 'Results', icon: 'pi pi-fw pi-pen-to-square', to: '/results/' }],
    roles: ['Admin', 'Official']
  },
  {
    items: [{ label: 'Leaderboard', icon: 'pi pi-fw pi-trophy', to: '/leaderboard/' }],
    // No roles specified - visible to all authenticated users
  },
];

// Check if user is authenticated
const isAuthenticated = computed(() => store.getters['auth/isAuthenticated']);

// Create a computed property that filters menu items based on user's roles and permissions
const model = computed(() => {
  // If not authenticated, show minimal menu or login option
  if (!isAuthenticated.value) {
    return [
      {
        label: 'Menu',
        items: [
          { label: 'Login', icon: 'pi pi-fw pi-sign-in', to: '/auth/login' }
        ]
      }
    ];
  }

  // Create a copy of the menu items for authenticated users
  let authenticatedMenuItems = [...allMenuItems];
  
  // Add logout item for all authenticated users
  authenticatedMenuItems.push({
    items: [{ 
      label: 'Logout', 
      icon: 'pi pi-fw pi-sign-out', 
      command: logout
    }]
  });

  // Filter menu items based on roles and permissions
  return authenticatedMenuItems.filter(item => {
    // If no roles or permissions specified, show to all authenticated users
    if (!item.roles && !item.permissions) return true;
    
    // Check roles if specified
    if (item.roles) {
      return store.getters['auth/hasAnyRole'](item.roles);
    }
    
    // Check permissions if specified
    if (item.permissions) {
      return store.getters['auth/hasAnyPermission'](item.permissions);
    }
    
    return false;
  });
});

// Get current user roles for display (optional)
const userRoles = computed(() => store.getters['auth/userRoles']);
</script>

<template>
  <div>
    <!-- Optional: Role info display for debugging -->
    <div v-if="isAuthenticated" class="user-role-info" style="margin-bottom: 10px; font-size: 0.8rem; color: #6c757d;">
      <span>Roles: {{ userRoles.join(', ') }}</span>
    </div>
    
    <ul class="layout-menu">
      <template v-for="(item, i) in model" :key="i">
        <app-menu-item v-if="!item.separator" :item="item" :index="i"></app-menu-item>
        <li v-if="item.separator" class="menu-separator"></li>
      </template>
    </ul>
  </div>
</template>

<style lang="scss" scoped>
.user-role-info {
  padding: 8px;
  background-color: #f8f9fa;
  border-radius: 4px;
  margin-top: 5px;
}
</style>