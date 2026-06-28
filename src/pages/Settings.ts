// pages/Settings.ts
import { showToast } from '../components/Toast';
import { auth } from '../firebase';
import { getInitials, getAvatarColor } from '../components/ProfileDrawer';

export function renderSettings(container: HTMLElement) {
  const user = auth?.currentUser;
  const email = user?.email || localStorage.getItem('email') || null;
  const initials = getInitials(email);
  const color = getAvatarColor(email);
  const displayName = email?.split('@')[0] || 'Guest';
  
  const dailyGoal = localStorage.getItem('daily_goal') || '20';

  container.innerHTML = `
    <div class="max-w-2xl mx-auto space-y-gutter animate-fade-in">
      <header class="mb-stack_lg">
        <h1 class="text-3xl font-display font-bold text-on-surface">Settings</h1>
        <p class="text-on-surface-variant font-body">Manage your app preferences and goals.</p>
      </header>

      <!-- 🔥 Profile Card -->
      <div class="bg-surface rounded-xl border border-outline-variant p-stack_lg shadow-sm mb-6">
        <div class="flex items-center space-x-4">
          <div class="avatar-circle w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white shadow-lg transition-all duration-300 hover:scale-105" 
               style="background-color: ${color}">
            ${initials}
          </div>
          <div>
            <h3 class="font-bold text-lg text-on-surface">${displayName}</h3>
            <p class="text-sm text-on-surface-variant">${email || 'Not signed in'}</p>
          </div>
        </div>
      </div>

      <div class="bg-surface rounded-xl border border-outline-variant p-stack_lg shadow-sm space-y-6">
        
        <!-- Study Goals -->
        <div>
          <h2 class="text-xl font-display font-semibold mb-4 text-rupiahku-brown flex items-center gap-2">
            <span class="material-symbols-outlined">track_changes</span> Study Goals
          </h2>
          <div class="p-4 bg-surface-container-low rounded-lg border border-outline-variant/50 space-y-4">
            <div>
              <label class="block font-bold text-on-surface mb-1">Daily Review Goal</label>
              <p class="text-sm text-on-surface-variant mb-3">Number of items you want to review each day</p>
              <input type="number" id="daily-goal-input" value="${dailyGoal}" class="w-full md:w-48 bg-surface border border-outline-variant rounded-lg p-2 text-on-surface focus:outline-none focus:border-rupiahku-brown" min="1" max="500">
            </div>
            <div>
              <label class="block font-bold text-on-surface mb-1">Target JLPT Level</label>
              <p class="text-sm text-on-surface-variant mb-3">Your target JLPT level to focus your studies on</p>
              <select id="jlpt-target" class="w-full md:w-48 bg-surface border border-outline-variant rounded-lg p-2 text-on-surface focus:outline-none focus:border-rupiahku-brown">
                <option value="N5" ${localStorage.getItem('jlpt_target') === 'N5' ? 'selected' : ''}>JLPT N5</option>
                <option value="N4" ${localStorage.getItem('jlpt_target') === 'N4' ? 'selected' : ''}>JLPT N4</option>
                <option value="N3" ${localStorage.getItem('jlpt_target') === 'N3' ? 'selected' : ''}>JLPT N3</option>
                <option value="N2" ${localStorage.getItem('jlpt_target') === 'N2' ? 'selected' : ''}>JLPT N2</option>
                <option value="N1" ${localStorage.getItem('jlpt_target') === 'N1' ? 'selected' : ''}>JLPT N1</option>
              </select>
            </div>
            <button id="save-goal-btn" class="bg-rupiahku-brown text-white px-4 py-2 rounded-full font-bold hover:bg-rupiahku-brown/90 transition-colors">
              Save Goals
            </button>
          </div>
        </div>

        <!-- Data Management -->
        <div>
          <h2 class="text-xl font-display font-semibold mb-4 text-error flex items-center gap-2">
            <span class="material-symbols-outlined">database</span> Data Management
          </h2>
          <div class="space-y-4">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-surface-container-low rounded-lg border border-outline-variant/50">
              <div>
                <h3 class="font-bold text-on-surface">Export Data</h3>
                <p class="text-sm text-on-surface-variant">Download your learning history and vocabulary</p>
              </div>
              <button id="export-data-btn" class="w-full sm:w-auto whitespace-nowrap border border-outline-variant text-rupiahku-brown px-4 py-2 rounded-full font-bold hover:bg-surface-variant transition-colors">
                Export JSON
              </button>
            </div>

            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-error/10 rounded-lg border border-error/20">
              <div>
                <h3 class="font-bold text-error">Reset Preferences</h3>
                <p class="text-sm text-on-surface-variant">Clear all local settings (theme, goals)</p>
              </div>
              <button id="reset-prefs-btn" class="w-full sm:w-auto whitespace-nowrap border border-error text-error px-4 py-2 rounded-full font-bold hover:bg-error hover:text-white transition-colors">
                Reset All
              </button>
            </div>

            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-surface-container-low rounded-lg border border-outline-variant/50">
              <div>
                <h3 class="font-bold text-on-surface">Account Session</h3>
                <p class="text-sm text-on-surface-variant">Logged in as: <span class="text-rupiahku-brown font-bold">${email || 'Guest'}</span></p>
              </div>
              <button id="logout-btn" class="w-full sm:w-auto whitespace-nowrap border border-error text-error px-4 py-2 rounded-full font-bold hover:bg-error hover:text-white transition-colors">
                Logout
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  `;

  // Attach event listeners
  const logoutBtn = document.getElementById('logout-btn');
  logoutBtn?.addEventListener('click', () => {
    import('../services/api').then(({ logoutUser }) => {
      logoutUser();
    });
  });

  const saveGoalBtn = document.getElementById('save-goal-btn');
  saveGoalBtn?.addEventListener('click', () => {
    const input = document.getElementById('daily-goal-input') as HTMLInputElement;
    const jlptSelect = document.getElementById('jlpt-target') as HTMLSelectElement;
    
    const val = parseInt(input.value);
    if (val > 0) {
      localStorage.setItem('daily_goal', val.toString());
      localStorage.setItem('jlpt_target', jlptSelect.value);
      showToast('Goals updated successfully');
    } else {
      showToast('Please enter a valid number', 'error');
    }
  });

  const exportBtn = document.getElementById('export-data-btn');
  exportBtn?.addEventListener('click', async () => {
    try {
      showToast('Preparing export...');
      const data = {
        exportedAt: new Date().toISOString(),
        settings: {
          theme: localStorage.getItem('theme'),
          dailyGoal: localStorage.getItem('daily_goal'),
          jlptTarget: localStorage.getItem('jlpt_target')
        }
      };
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `japanese_learning_export_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('Export successful');
    } catch (err: any) {
      showToast('Export failed: ' + err.message, 'error');
    }
  });

  const resetPrefsBtn = document.getElementById('reset-prefs-btn');
  resetPrefsBtn?.addEventListener('click', () => {
    localStorage.removeItem('theme');
    localStorage.removeItem('daily_goal');
    localStorage.removeItem('jlpt_target');
    
    const html = document.documentElement;
    html.classList.remove('dark');
    html.classList.add('light');
    
    showToast('Preferences reset to default');
    setTimeout(() => renderSettings(container), 500);
  });
}