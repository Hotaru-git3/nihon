// src/components/ProfileDrawer.ts
import { auth } from '../firebase';
import { showToast } from './Toast';
import { fetchDashboardStats } from '../services/api';

// 🔥 Fungsi ambil inisial dari email
export function getInitials(email: string | null): string {
  if (!email) return '?';
  
  const username = email.split('@')[0];
  const clean = username.replace(/[^a-zA-Z]/g, '');
  
  if (clean.length >= 2) {
    return clean.substring(0, 2).toUpperCase();
  } else if (clean.length === 1) {
    return clean.toUpperCase();
  }
  
  return username.charAt(0).toUpperCase() || '?';
}

// 🔥 Fungsi generate warna dari email
export function getAvatarColor(email: string | null): string {
  if (!email) return '#6B7280';
  
  const colors = [
    '#C7756B', '#7DB9A8', '#6FA8DC', '#E5A065',
    '#914A41', '#2C685A', '#026952', '#8A7570',
  ];
  
  let hash = 0;
  for (let i = 0; i < email.length; i++) {
    hash = email.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colors[Math.abs(hash) % colors.length];
}

// 🔥 Update semua avatar di app
export function updateAllAvatars(email: string | null) {
  const initials = getInitials(email);
  const color = getAvatarColor(email);
  const displayName = email?.split('@')[0] || 'Guest';
  
  // Sidebar avatar
  const sidebarAvatar = document.querySelector('#app-sidebar .avatar-circle');
  if (sidebarAvatar) {
    sidebarAvatar.textContent = initials;
    (sidebarAvatar as HTMLElement).style.backgroundColor = color;
  }
  
  // Bottom nav avatar
  const bottomAvatar = document.querySelector('#app-bottom-nav .avatar-circle');
  if (bottomAvatar) {
    bottomAvatar.textContent = initials;
    (bottomAvatar as HTMLElement).style.backgroundColor = color;
  }
  
  // Profile drawer avatar
  const drawerAvatar = document.querySelector('#profile-drawer .avatar-circle');
  if (drawerAvatar) {
    drawerAvatar.textContent = initials;
    (drawerAvatar as HTMLElement).style.backgroundColor = color;
  }
  
  // Profile name
  const nameEls = document.querySelectorAll('.profile-name');
  nameEls.forEach(el => {
    el.textContent = displayName;
  });
  
  const emailEls = document.querySelectorAll('.profile-email');
  emailEls.forEach(el => {
    el.textContent = email || 'Not signed in';
  });
}

export function ProfileModal(): string {
  // 🔥 FIX: Pake optional chaining
  const user = auth?.currentUser || null;
  const email = user?.email || localStorage.getItem('email') || null;
  const initials = getInitials(email);
  const color = getAvatarColor(email);
  const displayName = email?.split('@')[0] || 'Guest';

  return `
    <!-- Profile Backdrop -->
    <div id="profile-backdrop" class="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998] hidden opacity-0 transition-opacity duration-300"></div>

    <!-- Profile Drawer/Modal -->
    <div id="profile-drawer" class="fixed top-0 right-0 h-full w-full max-w-[400px] bg-surface shadow-2xl z-[9999] transform translate-x-full transition-transform duration-300 ease-in-out flex flex-col">
      <!-- Header -->
      <div class="p-6 border-b border-outline-variant flex items-center justify-between bg-surface-container-low">
        <h2 class="font-headline-sm font-bold text-on-surface">Profil Saya</h2>
        <button id="close-profile-btn" class="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container-high transition-colors text-on-surface-variant">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>
      
      <!-- Content -->
      <div class="flex-1 overflow-y-auto p-6 flex flex-col space-y-8">
        <!-- Avatar Section -->
        <div class="flex flex-col items-center">
          <div class="relative mb-4">
            <div class="avatar-circle w-24 h-24 rounded-full border-4 border-surface shadow-lg text-white flex items-center justify-center text-4xl font-bold transition-all duration-300 hover:scale-105" 
                 style="background-color: ${color}">
              ${initials}
            </div>
            <button class="absolute bottom-0 right-0 w-8 h-8 bg-rupiahku-brown text-white rounded-full flex items-center justify-center shadow-lg hover:bg-rupiahku-brown/90 transition-colors">
              <span class="material-symbols-outlined text-[18px]">edit</span>
            </button>
          </div>
          <h3 class="profile-name font-headline-md font-bold text-on-surface">${displayName}</h3>
          <p class="profile-email text-sm text-on-surface-variant">${email || 'Not signed in'}</p>
          <div class="mt-4 inline-flex items-center space-x-2 bg-brand-c7756b/10 text-brand-c7756b px-4 py-2 rounded-full">
            <span class="font-bold">Pelajar Nihongo</span>
            <span class="material-symbols-outlined text-[18px]">workspace_premium</span>
          </div>
        </div>

        <!-- Stats Section -->
        <div>
          <h4 class="font-title-md font-bold text-on-surface mb-4">Statistik Belajar</h4>
          <div class="grid grid-cols-2 gap-4">
            <div class="bg-surface-container-low p-4 rounded-xl flex flex-col items-center animate-fade-in">
              <span class="material-symbols-outlined text-brand-c7756b text-3xl mb-2">local_fire_department</span>
              <span class="font-bold text-2xl text-on-surface" id="profile-streak">-</span>
              <span class="text-sm text-on-surface-variant">Hari Beruntun</span>
            </div>
            <div class="bg-surface-container-low p-4 rounded-xl flex flex-col items-center animate-fade-in [animation-delay:100ms]">
              <span class="material-symbols-outlined text-rupiahku-brown text-3xl mb-2">school</span>
              <span class="font-bold text-2xl text-on-surface" id="profile-words">-</span>
              <span class="text-sm text-on-surface-variant">Kartu Dikuasai</span>
            </div>
          </div>
        </div>

        <!-- Preferences Section -->
        <div>
          <h4 class="font-title-md font-bold text-on-surface mb-4">Pengaturan Akun</h4>
          <div class="space-y-2">
            <a href="/settings" class="w-full flex items-center justify-between p-4 bg-surface-container-low hover:bg-surface-container rounded-xl transition-colors text-left close-profile-link">
              <div class="flex items-center space-x-3">
                <span class="material-symbols-outlined text-on-surface-variant">settings</span>
                <span class="font-body-md text-on-surface">Pengaturan (Settings)</span>
              </div>
              <span class="material-symbols-outlined text-on-surface-variant">chevron_right</span>
            </a>
          </div>
        </div>
      </div>
      
      <!-- Footer -->
      <div class="p-6 border-t border-outline-variant">
        <button id="profile-logout-btn" class="w-full py-3 px-4 bg-error/10 text-error hover:bg-error/20 rounded-xl font-bold transition-colors flex items-center justify-center space-x-2">
          <span class="material-symbols-outlined">logout</span>
          <span>Keluar</span>
        </button>
      </div>
    </div>
  `;
}

export async function openProfile() {
  // 🔥 FIX: Pake optional chaining
  if (!auth?.currentUser) {
    console.log('User not logged in, cannot open profile');
    showToast('Silakan login terlebih dahulu', 'error');
    window.location.href = '/login';
    return;
  }
  
  const backdrop = document.getElementById('profile-backdrop');
  const drawer = document.getElementById('profile-drawer');
  
  if (backdrop && drawer) {
    backdrop.classList.remove('hidden');
    setTimeout(() => {
      backdrop.classList.remove('opacity-0');
      backdrop.classList.add('opacity-100');
      drawer.classList.remove('translate-x-full');
      drawer.classList.add('translate-x-0');
    }, 10);
  }

  try {
    const stats = await fetchDashboardStats();
    const streakEl = document.getElementById('profile-streak');
    const wordsEl = document.getElementById('profile-words');
    
    if (streakEl) streakEl.textContent = stats.streak?.toString() || '0';
    if (wordsEl) {
      const totalMastered = (stats.progress?.mastered_vocab || 0) + (stats.progress?.mastered_kanji || 0) + (stats.progress?.mastered_grammar || 0);
      wordsEl.textContent = totalMastered.toString();
    }
  } catch(e) {
    console.error("Failed to fetch stats for profile", e);
  }
}

export function closeProfile() {
  const backdrop = document.getElementById('profile-backdrop');
  const drawer = document.getElementById('profile-drawer');
  
  if (backdrop && drawer) {
    backdrop.classList.remove('opacity-100');
    backdrop.classList.add('opacity-0');
    drawer.classList.remove('translate-x-0');
    drawer.classList.add('translate-x-full');
    
    setTimeout(() => {
      backdrop.classList.add('hidden');
    }, 300);
  }
}

export function initProfileListeners() {
  document.body.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    
    // 🔥 Open profile
    if (target.closest('.open-profile-btn')) {
      e.preventDefault();
      openProfile();
    }
    
    // 🔥 Close profile
    if (target.closest('#close-profile-btn') || target.id === 'profile-backdrop' || target.closest('.close-profile-link')) {
      closeProfile();
    }
    
    // 🔥 Logout - pake import dynamic
    if (target.closest('#profile-logout-btn')) {
      closeProfile();
      import('../services/api').then(({ logoutUser }) => {
        logoutUser();
      });
    }
  });
}