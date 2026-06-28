// main.ts
import './style.css';
import { router, setAuthState } from './router';
import { Sidebar } from './components/Sidebar';
import { BottomNav } from './components/BottomNav';
import { ToastContainer } from './components/Toast';
import { ModalContainer } from './components/Modal';
import { ProfileModal, initProfileListeners, updateAllAvatars } from './components/ProfileDrawer';
import { initFirebase, auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';

function initTheme() {
  const theme = localStorage.getItem('theme') || 'light';
  if (theme === 'dark') {
    document.documentElement.classList.remove('light');
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
    document.documentElement.classList.add('light');
  }
}

async function initApp() {
  initTheme();
  
  const app = document.getElementById('app');
  if (!app) return;

  // 🔥 Init Firebase dulu
  const initialized = await initFirebase();
  if (!initialized) {
    app.innerHTML = `<div class="p-8 text-center text-error">Failed to initialize Firebase. Please check your configuration.</div>`;
    return;
  }

  // 🔥 Render app dengan sidebar, bottom nav, dll
  app.innerHTML = `
    ${Sidebar()}
    ${BottomNav()}
    <main id="main-content" class="flex-1 lg:ml-[260px] p-4 md:p-main_padding pb-24 lg:pb-main_padding min-h-screen bg-background min-w-0 overflow-x-hidden"></main>
    ${ToastContainer()}
    ${ModalContainer()}
    ${ProfileModal()}
  `;

  // 🔥 Setup auth listener SETELAH Firebase siap
  if (auth) {
    onAuthStateChanged(auth, (user) => {
      // 🔥 Update auth state di router
      setAuthState(user);
      
      // 🔥 UPDATE AVATAR DI SIDEBAR, BOTTOM NAV, DAN PROFILE
      const email = user?.email || localStorage.getItem('email') || null;
      updateAllAvatars(email);
    });
  }

  // Listen to history changes
  window.addEventListener('popstate', router);
  
  // Intercept link clicks
  document.body.addEventListener('click', e => {
    if (e.target instanceof HTMLElement) {
      const link = e.target.closest('a');
      if (link && link.getAttribute('href')?.startsWith('/')) {
        e.preventDefault();
        import('./router').then(({ navigateTo }) => {
          navigateTo(link.getAttribute('href')!);
        });
      }
    }
  });

  // Initial load
  router();
  initProfileListeners();
}

document.addEventListener('DOMContentLoaded', initApp);