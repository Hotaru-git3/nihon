// pages/Dashboard.ts
import { auth } from '../firebase';
import { fetchDashboardStats } from '../services/api';

// @ts-ignore - Chart.js will be loaded dynamically
let Chart: any;

export async function renderDashboard(container: HTMLElement) {
  // 🔥 Ambil email dari Firebase Auth atau localStorage
  const user = auth?.currentUser;
  const email = user?.email || localStorage.getItem('email') || 'Guest';
  const displayName = email.split('@')[0] || 'Guest';
  const alias = displayName.substring(0, 2).toUpperCase() || 'G';

  // Initial loading state
  container.innerHTML = `
    <header class="mb-stack_lg">
      <div class="h-10 w-48 skeleton-box mb-2"></div>
      <div class="h-6 w-64 skeleton-box"></div>
    </header>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
      <!-- Left Column -->
      <div class="lg:col-span-2 space-y-gutter">
        <div class="bg-surface rounded-xl border border-outline-variant p-stack_lg shadow-level1 flex items-center space-x-6">
          <div class="w-20 h-20 skeleton-box rounded-full shrink-0"></div>
          <div class="flex-1 space-y-3">
            <div class="h-8 w-1/2 skeleton-box"></div>
            <div class="h-6 w-1/3 skeleton-box"></div>
          </div>
        </div>

        <div class="bg-surface rounded-xl border border-outline-variant p-stack_lg shadow-level1">
          <div class="h-6 w-32 skeleton-box mb-stack_md"></div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-stack_md">
            <div class="bg-surface-container-low rounded-lg p-stack_md border border-outline-variant/50 flex flex-col items-center">
              <div class="h-12 w-16 skeleton-box mb-2"></div>
              <div class="h-4 w-24 skeleton-box"></div>
            </div>
            <div class="bg-surface-container-low rounded-lg p-stack_md border border-outline-variant/50 flex flex-col items-center">
              <div class="h-12 w-16 skeleton-box mb-2"></div>
              <div class="h-4 w-32 skeleton-box"></div>
            </div>
          </div>
        </div>

        <div class="w-full h-16 skeleton-box rounded-xl"></div>
      </div>

      <!-- Right Column -->
      <div class="space-y-gutter">
        <div class="bg-surface rounded-xl border border-outline-variant p-stack_md shadow-level1">
          <div class="h-6 w-32 skeleton-box mb-4"></div>
          <ul class="space-y-3">
            <li class="flex items-center space-x-3 p-2">
              <div class="h-8 w-8 skeleton-box rounded-full"></div>
              <div class="h-6 w-24 skeleton-box"></div>
            </li>
            <li class="flex items-center space-x-3 p-2">
              <div class="h-8 w-8 skeleton-box rounded-full"></div>
              <div class="h-6 w-24 skeleton-box"></div>
            </li>
            <li class="flex items-center space-x-3 p-2">
              <div class="h-8 w-8 skeleton-box rounded-full"></div>
              <div class="h-6 w-32 skeleton-box"></div>
            </li>
          </ul>
        </div>

        <div class="bg-surface rounded-xl border border-outline-variant p-stack_md shadow-level1">
          <div class="h-6 w-32 skeleton-box mb-4"></div>
          <div class="h-32 w-full skeleton-box"></div>
        </div>
        
        <div class="bg-surface rounded-xl border border-outline-variant p-stack_md shadow-level1">
          <div class="h-6 w-32 skeleton-box mb-4"></div>
          <ul class="space-y-2">
            <li class="h-12 w-full skeleton-box"></li>
            <li class="h-12 w-full skeleton-box"></li>
            <li class="h-12 w-full skeleton-box"></li>
            <li class="h-12 w-full skeleton-box"></li>
          </ul>
        </div>
      </div>
    </div>
  `;

  try {
    const stats = await fetchDashboardStats();
    
    container.innerHTML = `
      <header class="flex justify-between items-start mb-10 mt-4 sm:mt-0">
        <div>
          <h2 class="font-serif text-[32px] sm:text-[40px] text-rupiahku-brown leading-tight tracking-tight">Halo, <span class="font-bold">${displayName}</span>.</h2>
          <p class="font-body-md text-on-surface-variant/80 text-[15px] mt-1">Gimana progress belajarmu hari ini?</p>
        </div>
        <button class="open-profile-btn flex items-center justify-center w-12 h-12 rounded-full bg-rupiahku-brown text-white font-medium text-lg hover:shadow-md transition-shadow shrink-0 ml-4">
          ${alias}
        </button>
      </header>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
        <!-- Left Column -->
        <div class="lg:col-span-2 space-y-gutter">
          <!-- Streak Card -->
          <div class="bg-surface rounded-xl border border-outline-variant p-stack_lg shadow-level1 flex items-center space-x-6 hover:shadow-md transition-shadow duration-300">
            <div class="w-20 h-20 bg-surface-container flex items-center justify-center rounded-full shrink-0">
              <span class="text-5xl pulse-animation">🔥</span>
            </div>
            <div>
              <h3 class="font-headline-md text-headline-md text-on-background">${stats.streak || 0} Hari Berturut-turut</h3>
              <p class="font-body-md text-body-md text-on-surface-variant mt-1">Belajar setiap hari minggu ini!</p>
            </div>
          </div>

          <!-- Today's Summary Card -->
          <div class="bg-surface rounded-xl border border-outline-variant p-stack_lg shadow-level1">
            <h3 class="font-headline-md text-body-lg font-semibold text-on-background mb-stack_md border-b border-outline-variant pb-2">Today's Summary</h3>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-stack_md">
              <div class="bg-surface-container-low rounded-lg p-stack_md text-center border border-outline-variant/50">
                <span class="block font-headline-lg text-[48px] font-bold text-primary leading-none mb-2">${stats.due_today || 0}</span>
                <span class="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Kartu Menunggu</span>
              </div>
              <div class="bg-surface-container-low rounded-lg p-stack_md text-center border border-outline-variant/50">
                <span class="block font-headline-lg text-[48px] font-bold text-secondary leading-none mb-2">${stats.added_today || 0}</span>
                <span class="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Kata Baru Ditambahkan</span>
              </div>
            </div>
          </div>

          <!-- Start Review Button -->
          <a href="/review" class="w-full bg-rupiahku-brown text-white font-headline-md text-headline-md py-4 px-6 rounded-xl shadow-md hover:shadow-lg hover:bg-rupiahku-brown/90 transition-all duration-200 flex items-center justify-center space-x-2">
            <span class="material-symbols-outlined">play_arrow</span>
            <span>MULAI REVIEW</span>
          </a>

          <!-- Progres Materi -->
          <div class="bg-surface rounded-xl border border-outline-variant p-stack_md shadow-level1 mt-gutter">
            <h3 class="font-headline-md text-body-lg font-semibold text-on-background mb-4 border-b border-outline-variant pb-2">Progres Materi (Mastered)</h3>
            <div class="space-y-4">
              <div class="space-y-1">
                <div class="flex justify-between text-label-sm"><span class="text-on-surface-variant">Kosakata</span><span class="text-rupiahku-brown font-bold">${stats.total_vocab > 0 ? Math.round((stats.progress?.mastered_vocab || 0) / stats.total_vocab * 100) : 0}%</span></div>
                <div class="w-full bg-surface-container-highest h-2 rounded-full overflow-hidden">
                  <div class="bg-rupiahku-brown h-full rounded-full" style="width: ${stats.total_vocab > 0 ? Math.round((stats.progress?.mastered_vocab || 0) / stats.total_vocab * 100) : 0}%"></div>
                </div>
              </div>
              <div class="space-y-1">
                <div class="flex justify-between text-label-sm"><span class="text-on-surface-variant">Kanji</span><span class="text-rupiahku-brown font-bold">${stats.total_kanji > 0 ? Math.round((stats.progress?.mastered_kanji || 0) / stats.total_kanji * 100) : 0}%</span></div>
                <div class="w-full bg-surface-container-highest h-2 rounded-full overflow-hidden">
                  <div class="bg-rupiahku-brown h-full rounded-full" style="width: ${stats.total_kanji > 0 ? Math.round((stats.progress?.mastered_kanji || 0) / stats.total_kanji * 100) : 0}%"></div>
                </div>
              </div>
              <div class="space-y-1">
                <div class="flex justify-between text-label-sm"><span class="text-on-surface-variant">Tata Bahasa</span><span class="text-rupiahku-brown font-bold">${stats.total_grammar > 0 ? Math.round((stats.progress?.mastered_grammar || 0) / stats.total_grammar * 100) : 0}%</span></div>
                <div class="w-full bg-surface-container-highest h-2 rounded-full overflow-hidden">
                  <div class="bg-rupiahku-brown h-full rounded-full" style="width: ${stats.total_grammar > 0 ? Math.round((stats.progress?.mastered_grammar || 0) / stats.total_grammar * 100) : 0}%"></div>
                </div>
              </div>
            </div>
          </div>

          <!-- Pencapaian -->
          <div class="bg-surface rounded-xl border border-outline-variant p-stack_md shadow-sm mt-gutter">
            <h3 class="font-headline-md text-body-lg font-semibold text-on-background mb-4 border-b border-outline-variant pb-2">Pencapaian</h3>
            <div class="flex flex-wrap justify-center gap-4 py-2">
              <div class="flex flex-col items-center space-y-1">
                <div class="w-12 h-12 rounded-full bg-surface-container-highest text-on-surface-variant flex items-center justify-center opacity-40 grayscale">
                  <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">wb_sunny</span>
                </div>
                <span class="text-[10px] font-medium text-on-surface-variant text-center">Early Bird</span>
              </div>
              <div class="flex flex-col items-center space-y-1">
                <div class="w-12 h-12 rounded-full bg-surface-container-highest text-on-surface-variant flex items-center justify-center opacity-40 grayscale">
                  <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">bedtime</span>
                </div>
                <span class="text-[10px] font-medium text-on-surface-variant text-center">Night Owl</span>
              </div>
              <div class="flex flex-col items-center space-y-1">
                <div class="w-12 h-12 rounded-full bg-rupiahku-brown/20 text-rupiahku-brown flex items-center justify-center">
                  <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">menu_book</span>
                </div>
                <span class="text-[10px] font-medium text-on-surface-variant text-center">Vocab Master</span>
              </div>
              <div class="flex flex-col items-center space-y-1">
                <div class="w-12 h-12 rounded-full bg-rupiahku-brown/20 text-rupiahku-brown flex items-center justify-center">
                  <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">school</span>
                </div>
                <span class="text-[10px] font-medium text-on-surface-variant text-center">Kanji Master</span>
              </div>
              <div class="flex flex-col items-center space-y-1">
                <div class="w-12 h-12 rounded-full bg-rupiahku-brown/20 text-rupiahku-brown flex items-center justify-center">
                  <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">psychology</span>
                </div>
                <span class="text-[10px] font-medium text-on-surface-variant text-center">Grammar Pro</span>
              </div>
              <div class="flex flex-col items-center space-y-1">
                <div class="w-12 h-12 rounded-full bg-surface-container-highest text-on-surface-variant flex items-center justify-center opacity-40 grayscale">
                  <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">local_fire_department</span>
                </div>
                <span class="text-[10px] font-medium text-on-surface-variant text-center">7 Day Streak</span>
              </div>
              <div class="flex flex-col items-center space-y-1">
                <div class="w-12 h-12 rounded-full bg-surface-container-highest text-on-surface-variant flex items-center justify-center opacity-40 grayscale">
                  <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">hotel_class</span>
                </div>
                <span class="text-[10px] font-medium text-on-surface-variant text-center">30 Day Streak</span>
              </div>
              <div class="flex flex-col items-center space-y-1">
                <div class="w-12 h-12 rounded-full bg-surface-container-highest text-on-surface-variant flex items-center justify-center opacity-40 grayscale">
                  <span class="material-symbols-outlined">smart_toy</span>
                </div>
                <span class="text-[10px] font-medium text-on-surface-variant text-center">AI Fan</span>
              </div>
              <div class="flex flex-col items-center space-y-1">
                <div class="w-12 h-12 rounded-full bg-surface-container-highest text-on-surface-variant flex items-center justify-center opacity-40 grayscale">
                  <span class="material-symbols-outlined">military_tech</span>
                </div>
                <span class="text-[10px] font-medium text-on-surface-variant text-center">N1 Hero</span>
              </div>
            </div>
          </div>

          <!-- Rekomendasi Hari Ini -->
          <section class="space-y-stack_md">
            <div class="flex items-center space-x-2">
              <span class="material-symbols-outlined text-rupiahku-brown">lightbulb</span>
              <h3 class="font-headline-md text-body-lg font-semibold text-on-background">Rekomendasi Hari Ini</h3>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-stack_md">
              <div class="bg-surface rounded-lg border border-outline-variant p-4 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                <div>
                  <span class="block font-japanese-text text-japanese-text text-rupiahku-brown font-bold mb-1">勉強</span>
                  <span class="block font-label-sm text-label-sm text-on-surface-variant uppercase mb-2">Kanji ${localStorage.getItem('jlpt_target') || 'N5'}</span>
                  <p class="font-body-md text-body-md text-on-surface mb-4">Belajar</p>
                </div>
                <a href="/library" class="w-full block text-center py-2 px-3 bg-rupiahku-brown text-white text-label-sm font-medium rounded-lg hover:bg-rupiahku-brown/90 transition-colors">Pelajari Sekarang</a>
              </div>
              <div class="bg-surface rounded-lg border border-outline-variant p-4 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                <div>
                  <span class="block font-japanese-text text-japanese-text text-rupiahku-brown font-bold mb-1">〜ほうがいい</span>
                  <span class="block font-label-sm text-label-sm text-on-surface-variant uppercase mb-2">Grammar</span>
                  <p class="font-body-md text-body-md text-on-surface mb-4">Lebih baik...</p>
                </div>
                <a href="/library" class="w-full block text-center py-2 px-3 bg-rupiahku-brown text-white text-label-sm font-medium rounded-lg hover:bg-rupiahku-brown/90 transition-colors">Pelajari Sekarang</a>
              </div>
              <div class="bg-surface rounded-lg border border-outline-variant p-4 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                <div>
                  <span class="block font-japanese-text text-japanese-text text-rupiahku-brown font-bold mb-1">経済</span>
                  <span class="block font-label-sm text-label-sm text-on-surface-variant uppercase mb-2">Kosakata</span>
                  <p class="font-body-md text-body-md text-on-surface mb-4">Ekonomi</p>
                </div>
                <a href="/library" class="w-full block text-center py-2 px-3 bg-rupiahku-brown text-white text-label-sm font-medium rounded-lg hover:bg-rupiahku-brown/90 transition-colors">Pelajari Sekarang</a>
              </div>
            </div>
          </section>
        </div>

        <!-- Right Column -->
        <div class="space-y-gutter">
          <!-- Library Stats Card -->
          <div class="bg-surface rounded-xl border border-outline-variant p-stack_md shadow-level1">
            <h3 class="font-headline-md text-body-lg font-semibold text-on-background mb-4 border-b border-outline-variant pb-2">Library</h3>
            <ul class="space-y-3">
              <li class="flex items-center space-x-3 p-2 hover:bg-surface-container-low rounded-lg transition-colors">
                <span class="text-2xl">📖</span>
                <span class="font-body-md text-body-md text-on-surface font-medium">${stats.total_vocab || 0} Kosakata</span>
              </li>
              <li class="flex items-center space-x-3 p-2 hover:bg-surface-container-low rounded-lg transition-colors">
                <span class="text-2xl">🀄</span>
                <span class="font-body-md text-body-md text-on-surface font-medium">${stats.total_kanji || 0} Kanji</span>
              </li>
              <li class="flex items-center space-x-3 p-2 hover:bg-surface-container-low rounded-lg transition-colors">
                <span class="text-2xl">📐</span>
                <span class="font-body-md text-body-md text-on-surface font-medium">${stats.total_grammar || 0} Tata Bahasa</span>
              </li>
            </ul>
          </div>

          <!-- Weekly Activity Card -->
          <div class="bg-surface rounded-xl border border-outline-variant p-stack_md shadow-level1">
            <h3 class="font-headline-md text-body-lg font-semibold text-on-background mb-4 border-b border-outline-variant pb-2">Minggu ini: <span class="text-rupiahku-brown">${stats.reviewed_today || 0}</span> review</h3>
            <div class="h-32 pt-4">
              <canvas id="weeklyChart"></canvas>
            </div>
          </div>

          <!-- Recently Added -->
          <div class="bg-surface rounded-xl border border-outline-variant p-stack_md shadow-level1">
            <h3 class="font-headline-md text-body-lg font-semibold text-on-background mb-4 border-b border-outline-variant pb-2">Recently Added</h3>
            <ul class="space-y-2">
              <li class="text-on-surface-variant text-center py-4">Belum ada item ditambahkan.</li>
            </ul>
          </div>

          <!-- Target Belajar -->
          <div class="bg-surface rounded-xl border border-outline-variant p-stack_md shadow-level1">
            <h3 class="font-headline-md text-body-lg font-semibold text-on-background mb-4 border-b border-outline-variant pb-2">Target Belajar</h3>
            <ul class="space-y-2">
              <li class="flex items-center space-x-3 p-2 hover:bg-surface-container-low rounded-lg transition-colors">
                <span class="material-symbols-outlined text-on-surface-variant">radio_button_unchecked</span>
                <span class="font-body-md text-body-md text-on-surface">Review ${localStorage.getItem('daily_goal') || '20'} cards (0/${localStorage.getItem('daily_goal') || '20'})</span>
              </li>
              <li class="flex items-center space-x-3 p-2 hover:bg-surface-container-low rounded-lg transition-colors">
                <span class="material-symbols-outlined text-on-surface-variant">radio_button_unchecked</span>
                <span class="font-body-md text-body-md text-on-surface">Add 5 new items (0/5)</span>
              </li>
              <li class="flex items-center space-x-3 p-2 hover:bg-surface-container-low rounded-lg transition-colors">
                <span class="material-symbols-outlined text-on-surface-variant">radio_button_unchecked</span>
                <span class="font-body-md text-body-md text-on-surface">Complete 1 AI Analysis (0/1)</span>
              </li>
            </ul>
          </div>

          <!-- Rekomendasi AI -->
          <div class="bg-surface rounded-xl border border-outline-variant p-stack_md shadow-level1">
            <h3 class="font-headline-md text-body-lg font-semibold text-on-background mb-4 border-b border-outline-variant pb-2">Rekomendasi AI</h3>
            <div class="space-y-3">
              <div class="flex items-start space-x-3">
                <span class="material-symbols-outlined text-rupiahku-brown shrink-0">auto_awesome</span>
                <p class="text-body-md text-on-surface-variant">Fokus pada ${localStorage.getItem('jlpt_target') || 'JLPT N5'} hari ini untuk mempertahankan progres Anda yang konsisten.</p>
              </div>
              <a href="/ai" class="w-full block text-center py-2 px-3 bg-rupiahku-brown/10 text-rupiahku-brown text-label-sm font-semibold rounded-lg hover:bg-rupiahku-brown/20 transition-colors">Coba AI Analyzer</a>
            </div>
          </div>
        </div>
      </div>
    `;

    // 🔥 Load Chart.js dynamically
    try {
      const chartModule = await import('chart.js/auto');
      Chart = chartModule.default;
      
      const ctx = document.getElementById('weeklyChart') as HTMLCanvasElement;
      if (ctx) {
        const weeklyData = stats.weekly_activity || [];
        const labels = weeklyData.length > 0 
          ? weeklyData.map((d: any) => new Date(d.date).toLocaleDateString('id-ID', { weekday: 'short' }))
          : ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
        const data = weeklyData.length > 0 
          ? weeklyData.map((d: any) => d.count)
          : [0, 0, 0, 0, 0, 0, 0];
        
        new Chart(ctx, {
          type: 'bar',
          data: {
            labels: labels,
            datasets: [{
              label: 'Reviews',
              data: data,
              backgroundColor: data.map((val: number) => val > 0 ? '#382924' : 'rgba(56, 41, 36, 0.15)'),
              borderRadius: 4
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: { display: false, beginAtZero: true },
              x: { 
                grid: { display: false },
                border: { display: false },
                ticks: { font: { family: 'Inter', size: 10 } }
              }
            },
            plugins: {
              legend: { display: false },
              tooltip: {
                backgroundColor: '#382924',
                titleFont: { family: 'Inter' },
                bodyFont: { family: 'Inter' }
              }
            }
          }
        });
      }
    } catch (chartError) {
      console.log('Chart.js not loaded:', chartError);
    }
    
  } catch (error) {
    container.innerHTML = `
      <div class="p-4 bg-error-container text-on-error-container rounded-lg">
        Gagal memuat dashboard: ${(error as Error).message}
      </div>
    `;
  }
}