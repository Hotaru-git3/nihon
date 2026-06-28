// components/Sidebar.ts
import { auth } from '../firebase';
import { getInitials, getAvatarColor } from './ProfileDrawer';
import { fetchDashboardStats } from '../services/api';

export function Sidebar(): string {
  const user = auth?.currentUser;
  const email = user?.email || localStorage.getItem('email') || null;
  const initials = getInitials(email);
  const color = getAvatarColor(email);
  const displayName = email?.split('@')[0] || 'Guest';

  return `
    <!-- Desktop Sidebar - hidden di mobile -->
    <aside id="app-sidebar" class="fixed left-0 top-0 h-full w-[260px] hidden lg:flex flex-col bg-surface z-40 border-r border-outline-variant/50 transition-all duration-300">
      <div class="flex flex-col p-6 space-y-6 h-full">
        <!-- Brand -->
        <div class="flex items-center pl-2">
          <h1 class="font-serif text-[28px] font-bold text-rupiahku-brown tracking-tight">Nihongo.</h1>
        </div>
        
        <!-- Profile -->
        <button data-profile-trigger class="open-profile-btn w-full flex items-center space-x-3 px-3 py-3 rounded-xl hover:bg-surface-container-high transition-all duration-200 group">
          <div class="avatar-circle w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-lg transition-all duration-300 group-hover:scale-105" 
               style="background-color: ${color}">
            ${initials}
          </div>
          <div class="flex-1 text-left min-w-0">
            <p class="profile-name text-sm font-medium text-on-surface truncate">${displayName}</p>
            <p class="profile-email text-xs text-on-surface-variant truncate">${email || 'Not signed in'}</p>
          </div>
          <span class="material-symbols-outlined text-on-surface-variant group-hover:text-rupiahku-brown transition-colors text-xl">chevron_right</span>
        </button>
        
        <!-- Nav -->
        <nav class="flex-1 space-y-1 mt-4">
          <a href="/dashboard" class="nav-item flex items-center space-x-3 px-4 py-2.5 rounded-xl text-on-surface-variant hover:bg-surface-container-high transition-all duration-200 font-medium text-[15px]" data-path="/dashboard">
            <span class="material-symbols-outlined text-xl">dashboard</span>
            <span>Dashboard</span>
          </a>
          <a href="/review" class="nav-item flex items-center space-x-3 px-4 py-2.5 rounded-xl text-on-surface-variant hover:bg-surface-container-high transition-all duration-200 font-medium text-[15px]" data-path="/review">
            <span class="material-symbols-outlined text-xl">event_repeat</span>
            <span>Review</span>
          </a>
          <a href="/library" class="nav-item flex items-center space-x-3 px-4 py-2.5 rounded-xl text-on-surface-variant hover:bg-surface-container-high transition-all duration-200 font-medium text-[15px]" data-path="/library">
            <span class="material-symbols-outlined text-xl">library_books</span>
            <span>Library</span>
          </a>
          <a href="/ai" class="nav-item flex items-center space-x-3 px-4 py-2.5 rounded-xl text-on-surface-variant hover:bg-surface-container-high transition-all duration-200 font-medium text-[15px]" data-path="/ai">
            <span class="material-symbols-outlined text-xl">smart_toy</span>
            <span>AI Assist</span>
          </a>
          <a href="/settings" class="nav-item flex items-center space-x-3 px-4 py-2.5 rounded-xl text-on-surface-variant hover:bg-surface-container-high transition-all duration-200 font-medium text-[15px]" data-path="/settings">
            <span class="material-symbols-outlined text-xl">settings</span>
            <span>Settings</span>
          </a>
        </nav>
        
        <!-- Stats -->
        <div class="mt-auto border border-outline-variant/40 rounded-2xl p-5 bg-surface-container-low shadow-sm">
          <p class="font-label-sm text-[11px] font-bold text-on-surface-variant/70 uppercase tracking-wider mb-2">TARGET HARIAN</p>
          <p class="font-serif text-xl font-bold text-rupiahku-brown"><span id="sidebar-goal">${localStorage.getItem('daily_goal') || '20'}</span> Item</p>
          <div class="mt-3 flex items-center gap-1 text-sm text-rupiahku-brown/80 font-medium">
            <span class="material-symbols-outlined text-[16px] text-brand-c7756b">local_fire_department</span> 
            <span id="sidebar-streak">0</span> Hari Streak
          </div>
        </div>
      </div>
    </aside>
  `;
}

export function updateActiveSidebarNav(hash: string) {
  document.querySelectorAll('.nav-item').forEach(el => {
    el.className = "nav-item flex items-center space-x-3 px-4 py-2.5 rounded-xl text-on-surface-variant hover:bg-surface-container-high transition-all duration-200 font-medium text-[15px]";
    
    if (el.getAttribute('data-path') === hash) {
      el.className = "nav-item flex items-center space-x-3 px-4 py-2.5 rounded-xl bg-rupiahku-brown text-white font-medium text-[15px] shadow-md transition-all duration-200";
    }
  });
}

export async function loadSidebarData() {
  try {
    if (!auth?.currentUser) {
      console.log('User not logged in, skipping sidebar data load');
      return;
    }
    
    const stats = await fetchDashboardStats();
    const streakEl = document.getElementById('sidebar-streak');
    if (streakEl) streakEl.textContent = stats.streak?.toString() || '0';
  } catch (e) {
    console.error("Failed to load sidebar stats", e);
  }
}