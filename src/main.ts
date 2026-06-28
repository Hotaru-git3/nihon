// src/main.ts
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

  // 🔥 Init Firebase
  const initialized = await initFirebase();
  if (!initialized) {
    app.innerHTML = `
      <div class="flex items-center justify-center min-h-screen p-4">
        <div class="bg-error/10 text-error p-6 rounded-xl max-w-md text-center">
          <h2 class="text-xl font-bold mb-2">Failed to Initialize Firebase</h2>
          <p class="text-sm">Please check your configuration.</p>
        </div>
      </div>
    `;
    return;
  }

  // 🔥 Setup auth listener
  if (auth) {
    onAuthStateChanged(auth, (user) => {
      setAuthState(user);
      const email = user?.email || localStorage.getItem('email') || null;
      updateAllAvatars(email);
    });
  }

  // 🔥 Render app
  app.innerHTML = `
    ${Sidebar()}
    ${BottomNav()}
    <main id="main-content" class="flex-1 lg:ml-[260px] p-4 md:p-main_padding pb-24 lg:pb-main_padding min-h-screen bg-background min-w-0 overflow-x-hidden"></main>
    ${ToastContainer()}
    ${ModalContainer()}
    ${ProfileModal()}
  `;

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