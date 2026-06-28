// components/BottomNav.ts
import { auth } from '../firebase';
import { getInitials, getAvatarColor } from './ProfileDrawer';

export function BottomNav(): string {
  const user = auth?.currentUser;
  const email = user?.email || localStorage.getItem('email') || null;
  const initials = getInitials(email);
  const color = getAvatarColor(email);

  return `
    <!-- Bottom Nav - cuma muncul di mobile -->
    <nav id="app-bottom-nav" class="fixed bottom-0 left-0 w-full z-40 lg:hidden border-t border-outline-variant shadow-[0_-2px_10px_rgba(0,0,0,0.05)] flex justify-around items-center px-2 py-2 bg-surface pb-safe transition-all duration-300">
      <a href="/dashboard" class="mobile-nav-item flex flex-col items-center justify-center text-on-surface-variant hover:bg-surface-container-highest transition-colors duration-200 p-2 rounded-lg min-w-[60px]" data-path="/dashboard">
        <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 0;">dashboard</span>
        <span class="font-label-sm text-[10px] mt-1">Home</span>
      </a>
      <a href="/review" class="mobile-nav-item flex flex-col items-center justify-center text-on-surface-variant hover:bg-surface-container-highest transition-colors duration-200 p-2 rounded-lg min-w-[60px]" data-path="/review">
        <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 0;">event_repeat</span>
        <span class="font-label-sm text-[10px] mt-1">Review</span>
      </a>
      <a href="/library" class="mobile-nav-item flex flex-col items-center justify-center text-on-surface-variant hover:bg-surface-container-highest transition-colors duration-200 p-2 rounded-lg min-w-[60px]" data-path="/library">
        <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 0;">library_books</span>
        <span class="font-label-sm text-[10px] mt-1">Library</span>
      </a>
      <a href="/ai" class="mobile-nav-item flex flex-col items-center justify-center text-on-surface-variant hover:bg-surface-container-highest transition-colors duration-200 p-2 rounded-lg min-w-[60px]" data-path="/ai">
        <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 0;">smart_toy</span>
        <span class="font-label-sm text-[10px] mt-1">AI</span>
      </a>
      <button data-profile-trigger class="open-profile-btn mobile-nav-item flex flex-col items-center justify-center text-on-surface-variant hover:bg-surface-container-highest transition-colors duration-200 p-2 rounded-lg min-w-[60px]">
        <div class="avatar-circle w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-lg transition-all duration-300 hover:scale-110" 
             style="background-color: ${color}">
          ${initials}
        </div>
        <span class="font-label-sm text-[10px] mt-0.5">Profile</span>
      </button>
    </nav>
  `;
}

export function updateActiveBottomNav(hash: string) {
  document.querySelectorAll('.mobile-nav-item').forEach(el => {
    if (el.classList.contains('open-profile-btn')) return;

    el.className = "mobile-nav-item flex flex-col items-center justify-center text-on-surface-variant hover:bg-surface-container-highest transition-colors duration-200 p-2 rounded-lg min-w-[60px]";
    const icon = el.querySelector('.material-symbols-outlined') as HTMLElement;
    if (icon) icon.style.fontVariationSettings = "'FILL' 0";
    
    if (el.getAttribute('data-path') === hash) {
      el.className = "mobile-nav-item flex flex-col items-center justify-center bg-rupiahku-brown text-white rounded-xl px-3 py-1 hover:bg-surface-container-highest transition-transform scale-90 active:scale-90 duration-200 min-w-[60px]";
      if (icon) icon.style.fontVariationSettings = "'FILL' 1";
    }
  });
}