// router.ts
import { renderDashboard } from './pages/Dashboard';
import { renderReview } from './pages/Review';
import { renderLibrary } from './pages/Library';
import { renderAIBreakdown } from './pages/AIBreakdown';
import { renderSettings } from './pages/Settings';
import { renderLogin } from './pages/Login';
import { updateActiveSidebarNav, loadSidebarData } from './components/Sidebar';
import { updateActiveBottomNav } from './components/BottomNav';

// 🔥 State untuk auth (di-set dari main.ts)
export let currentUser: any = null;
export let isAuthReady = false;

// 🔥 Function untuk update auth state dari main.ts
export function setAuthState(user: any) {
  currentUser = user;
  isAuthReady = true;
  console.log('🔐 Auth state updated:', user ? '✅ Logged in' : '❌ Logged out');
  
  // 🔥 Redirect otomatis - pakai setTimeout biar ga race condition
  setTimeout(() => {
    const path = window.location.pathname;
    if (!user && path !== '/login') {
      console.log('🔴 No user, redirecting to login');
      window.history.replaceState(null, '', '/login');
      router();
    } else if (user && path === '/login') {
      console.log('🟢 User logged in, redirecting to dashboard');
      window.history.replaceState(null, '', '/dashboard');
      router();
    } else {
      router();
    }
  }, 50);
}

export function navigateTo(url: string) {
  window.history.pushState(null, '', url);
  router();
}

export function router(): void {
  let path = window.location.pathname;
  
  // 🔥 Pake currentUser dari state
  const user = currentUser;
  
  // Kalo auth belum ready, tunggu
  if (!isAuthReady) {
    console.log('⏳ Auth not ready, waiting...');
    return;
  }
  
  // 🔥 Redirect logic
  if (!user && path !== '/login') {
    console.log('🔴 No user, redirecting to login');
    window.history.replaceState(null, '', '/login');
    path = '/login';
  } else if (user && path === '/login') {
    console.log('🟢 User logged in, redirecting to dashboard');
    window.history.replaceState(null, '', '/dashboard');
    path = '/dashboard';
  } else if (path === '/') {
    window.history.replaceState(null, '', '/dashboard');
    path = '/dashboard';
  }
  
  const mainContent = document.getElementById('main-content');
  const sidebar = document.getElementById('app-sidebar');
  const bottomNav = document.getElementById('app-bottom-nav');
  
  if (!mainContent) {
    console.log('❌ mainContent not found!');
    return;
  }

  // 🔥 RESET mainContent
  mainContent.innerHTML = '';
  
  // 🔥 HIDE/SHOW berdasarkan path
  if (path === '/login') {
    console.log('🔐 Rendering login page');
    
    // 🔥 Tambah class login-page ke body
    document.body.classList.add('login-page');
    
    // 🔥 HIDE sidebar dan bottom nav
    if (sidebar) {
      sidebar.style.display = 'none';
      sidebar.classList.add('hidden');
    }
    if (bottomNav) {
      bottomNav.style.display = 'none';
      bottomNav.classList.add('hidden');
    }
    
    // 🔥 Reset mainContent class untuk login
    mainContent.classList.remove('lg:ml-[260px]');
    mainContent.classList.remove('p-4', 'md:p-main_padding', 'pb-24', 'lg:pb-main_padding');
    mainContent.classList.add('p-0');
    
    // 🔥 RENDER LOGIN
    renderLogin(mainContent);
    return;
  } else {
    console.log('📱 Rendering protected page:', path);
    
    // 🔥 Hapus class login-page dari body
    document.body.classList.remove('login-page');
    
    // 🔥 SHOW sidebar dan bottom nav
    if (sidebar) {
      sidebar.style.display = '';
      sidebar.classList.remove('hidden');
    }
    if (bottomNav) {
      bottomNav.style.display = '';
      bottomNav.classList.remove('hidden');
    }
    
    // 🔥 Set mainContent class untuk protected pages
    mainContent.classList.add('lg:ml-[260px]');
    mainContent.classList.add('p-4', 'md:p-main_padding', 'pb-24', 'lg:pb-main_padding');
    mainContent.classList.remove('p-0');
    
    // 🔥 Load sidebar data
    loadSidebarData();
  }
  
  // 🔥 Render page berdasarkan path
  switch(path) {
    case '/dashboard':
      renderDashboard(mainContent);
      break;
    case '/review':
      renderReview(mainContent);
      break;
    case '/library':
      renderLibrary(mainContent);
      break;
    case '/ai':
      renderAIBreakdown(mainContent);
      break;
    case '/settings':
      renderSettings(mainContent);
      break;
    default:
      mainContent.innerHTML = `<div class="p-8 text-center"><h2 class="text-2xl">404 Not Found</h2></div>`;
  }
  
  updateActiveSidebarNav(path);
  updateActiveBottomNav(path);
}