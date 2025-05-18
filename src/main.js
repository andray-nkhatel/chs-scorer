import Aura from '@primeuix/themes/aura';
import PrimeVue from 'primevue/config';
import ConfirmationService from 'primevue/confirmationservice';
import ToastService from 'primevue/toastservice';
import { createApp } from 'vue';
import App from './App.vue';
import RbacDirectives from './directives/rbac';
import router from './router';
import store from './store';

import '@/assets/styles.scss';



const app = createApp(App);

// Setup store and interceptors on app start
store.dispatch('auth/setupInterceptors');

// Register RBAC directives
app.use(RbacDirectives);

app.use(router);
app.use(PrimeVue, {
    theme: {
        preset: Aura,
        options: {
            darkModeSelector: '.app-dark'
        }
    }
});
app.use(ToastService);
app.use(ConfirmationService);
//                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  
app.use(store).use(router).mount('#app');
// app.mount('#app');
