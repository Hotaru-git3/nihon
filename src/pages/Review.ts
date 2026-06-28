import { fetchTodayReview, fetchRandomReview, submitRating } from '../services/api';
import { ReviewItem } from '../types';

let cards: ReviewItem[] = [];
let currentIndex = 0;
let isFlipped = false;

export async function renderReview(container: HTMLElement, mode: 'today' | 'random' = 'today') {
  container.innerHTML = `
    <div class="flex items-center justify-center h-full">
      <div class="animate-pulse text-primary"><span class="material-symbols-outlined text-4xl">hourglass_empty</span></div>
    </div>
  `;

  try {
    if (mode === 'today') {
      cards = await fetchTodayReview();
    } else {
      cards = await fetchRandomReview();
    }
    currentIndex = 0;
    isFlipped = false;
    
    if (cards.length === 0) {
      container.innerHTML = `
        <div class="flex flex-col items-center justify-center h-full text-center space-y-4">
          <span class="text-6xl">🎉</span>
          <h2 class="font-headline-lg text-on-surface">Tidak ada kartu untuk direview ${mode === 'today' ? 'hari ini' : ''}!</h2>
          <div class="flex gap-4 mt-4">
            <a href="/dashboard" class="px-6 py-2 bg-surface-container-high text-on-surface rounded-lg hover:bg-surface-container-highest transition-colors">Kembali ke Dashboard</a>
            <button id="btn-review-acak" class="px-6 py-2 bg-primary text-on-primary rounded-lg shadow hover:bg-primary/90 transition-colors">Review Ulang Acak</button>
          </div>
        </div>
      `;
      document.getElementById('btn-review-acak')?.addEventListener('click', () => {
        renderReview(container, 'random');
      });
      return;
    }
    
    renderCurrentCard(container);
    
  } catch (error) {
    container.innerHTML = `
      <div class="p-4 bg-error-container text-on-error-container rounded-lg">
        Gagal memuat review: ${(error as Error).message}
      </div>
    `;
  }
}

function renderCurrentCard(container: HTMLElement) {
  if (currentIndex >= cards.length) {
    container.innerHTML = `
      <div class="flex flex-col items-center justify-center h-full text-center space-y-4 fade-in-slide-up">
        <span class="text-6xl">🎊</span>
        <h2 class="font-headline-lg text-on-surface">Review Selesai!</h2>
        <p class="font-body-md text-on-surface-variant">Kerja bagus menyelesaikan sesi hari ini.</p>
        <div class="flex gap-4 mt-4">
          <a href="/dashboard" class="px-6 py-2 bg-surface-container-high text-on-surface rounded-lg hover:bg-surface-container-highest transition-colors">Kembali ke Dashboard</a>
          <button id="btn-review-acak-end" class="px-6 py-2 bg-primary text-on-primary rounded-lg shadow hover:bg-primary/90 transition-colors">Review Ulang Acak</button>
        </div>
      </div>
    `;
    document.getElementById('btn-review-acak-end')?.addEventListener('click', () => {
      renderReview(container, 'random');
    });
    return;
  }

  const card = cards[currentIndex];
  const progress = Math.round((currentIndex / cards.length) * 100);
  
  let itemInfo = '';
  if (card.item_type === 'vocabulary') itemInfo = 'Kosakata';
  if (card.item_type === 'kanji') itemInfo = 'Kanji';
  if (card.item_type === 'grammar') itemInfo = 'Tata Bahasa';

  container.innerHTML = `
    <header class="w-full px-main_padding pt-10 pb-6 flex flex-col items-center justify-center">
      <div class="w-full max-w-2xl text-center">
        <p class="font-label-sm text-label-sm text-on-surface-variant mb-3 tracking-widest uppercase">Sesi Review</p>
        <div class="flex justify-between items-end mb-2">
          <h2 class="font-headline-md text-headline-md text-on-surface font-semibold">Kartu ${currentIndex + 1} dari ${cards.length}</h2>
          <span class="font-label-sm text-label-sm text-brand-c7756b font-semibold">${progress}%</span>
        </div>
        <div class="w-full h-1 bg-surface-container-highest rounded-full overflow-hidden">
          <div class="h-full bg-brand-c7756b rounded-full transition-all duration-500 ease-out" style="width: ${progress}%;"></div>
        </div>
      </div>
    </header>

    <section class="flex-1 flex flex-col items-center justify-start px-4 sm:px-main_padding pt-4 pb-12 relative w-full">
      <div class="w-full max-w-[420px] aspect-[4/5] sm:aspect-[420/300] perspective-1000 cursor-pointer group" id="flashcard-container">
        <div class="flashcard-inner transform-style-3d shadow-ambient rounded-flashcard bg-white border border-outline-variant/30" id="flashcard-inner">
          
          <!-- Front -->
          <div class="flashcard-front backface-hidden flex flex-col items-center justify-center p-6 sm:p-8 bg-white rounded-flashcard h-full w-full absolute top-0 left-0 overflow-y-auto">
            <div class="text-center space-y-2 w-full flex flex-col items-center justify-center m-auto">
              <h3 class="font-display-jp text-on-surface font-bold leading-tight break-words w-full text-balance ${card.front.length > 8 ? 'text-2xl sm:text-[28px]' : 'text-3xl sm:text-[48px]'}">${card.front}</h3>
            </div>
          </div>
          
          <!-- Back -->
          <div class="flashcard-back backface-hidden rotate-y-180 flex flex-col items-center justify-center p-6 sm:p-8 bg-white rounded-flashcard h-full w-full absolute top-0 left-0 border border-outline-variant/30 overflow-y-auto">
            <div class="w-full flex flex-col h-full items-center justify-center space-y-4">
              
              <!-- Center section: Reading, Meaning, Type -->
              <div class="text-center w-full flex flex-col items-center justify-center mb-4">
                ${card.reading ? `<span class="block font-japanese-text text-base sm:text-lg text-on-surface-variant tracking-wider opacity-80 break-words w-full text-balance mb-2">${card.reading}</span>` : ''}
                <h3 class="font-headline-lg text-xl sm:text-[28px] text-on-surface font-bold leading-tight break-words text-balance mb-3">${card.back}</h3>
                <div class="inline-block px-3 py-1 rounded-md bg-surface-container-low border border-outline-variant/30 font-label-sm text-xs sm:text-sm text-on-surface-variant">
                    ${itemInfo}
                </div>
              </div>
              
              <!-- Bottom section: Examples -->
              ${(card.example_sentence || card.example || card.example_words) ? `
              <div class="w-full mt-auto pt-4 border-t border-outline-variant/30 text-center space-y-3">
                ${card.example_sentence ? `
                  <div class="w-full">
                    <p class="font-label-sm text-[10px] text-on-surface-variant uppercase tracking-wider mb-1">Contoh Kalimat</p>
                    <p class="font-japanese-text text-sm sm:text-md text-on-surface leading-snug">${card.example_sentence}</p>
                  </div>
                ` : ''}

                ${card.example ? `
                  <div class="w-full">
                    <p class="font-label-sm text-[10px] text-on-surface-variant uppercase tracking-wider mb-1">${card.item_type === 'kanji' ? 'Mnemonic / Info' : 'Contoh Tambahan'}</p>
                    <p class="font-japanese-text text-sm sm:text-md text-on-surface leading-snug">${card.example}</p>
                  </div>
                ` : ''}

                ${card.example_words ? `
                  <div class="w-full bg-surface-container-low p-3 rounded-lg border border-outline-variant/20">
                    <p class="font-label-sm text-[10px] text-on-surface-variant uppercase tracking-wider mb-1">Kosakata Terkait</p>
                    <p class="font-japanese-text text-xs sm:text-sm text-on-surface-variant leading-snug break-words whitespace-pre-wrap">${card.example_words}</p>
                  </div>
                ` : ''}
              </div>
              ` : ''}
              
            </div>
          </div>
        </div>
      </div>

      <!-- Pre-Flip -->
      <div class="mt-8 sm:mt-12 transition-opacity duration-300 w-full max-w-[420px] flex justify-center px-4 sm:px-0" id="pre-flip-actions">
        <button id="btn-flip" class="px-8 py-3 rounded-xl border-2 border-brand-c7756b text-brand-c7756b font-label-sm text-sm font-semibold tracking-wider hover:bg-brand-c7756b hover:text-white transition-all duration-300 w-full sm:w-auto shadow-sm hover:shadow-md">
            BALIK KARTU
        </button>
      </div>

      <!-- Post-Flip Rating -->
      <div class="mt-8 sm:mt-10 hidden w-full max-w-2xl flex-col items-center fade-in-slide-up px-2 sm:px-0" id="post-flip-actions">
        <p class="font-body-md text-sm sm:text-base text-on-surface-variant mb-4 sm:mb-6 text-center">Seberapa baik kamu ingat materi ini?</p>
        <div class="flex flex-wrap justify-center gap-2 sm:gap-3 w-full">
          ${[
            { label: 'Lupa', color: 'bg-rating-lupa', q: 1 },
            { label: 'Susah', color: 'bg-rating-susah', q: 2 },
            { label: 'Hampir', color: 'bg-rating-hampir', q: 3 },
            { label: 'Mudah', color: 'bg-rating-mudah', q: 4 },
            { label: 'Sangat<br>Mudah', color: 'bg-rating-sangat-mudah', q: 5 }
          ].map(btn => `
            <button class="rating-btn flex-1 min-w-[60px] sm:min-w-[100px] flex flex-col items-center py-3 sm:py-4 px-1 sm:px-2 rounded-xl border border-outline-variant/30 bg-white hover:border-primary group transition-all" data-q="${btn.q}">
              <div class="w-3 h-3 rounded-full ${btn.color} mb-1 sm:mb-2 group-hover:scale-125 transition-transform"></div>
              <span class="font-label-sm text-[10px] sm:text-[12px] font-medium text-on-surface-variant text-center leading-tight">${btn.label}</span>
            </button>
          `).join('')}
        </div>
      </div>
    </section>
  `;

  // Attach events
  document.getElementById('flashcard-container')?.addEventListener('click', flip);
  document.getElementById('btn-flip')?.addEventListener('click', flip);
  
  document.querySelectorAll('.rating-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const q = parseInt((e.currentTarget as HTMLElement).getAttribute('data-q') || '0');
      await handleRating(q, container);
    });
  });
}

function flip() {
  if (isFlipped) return;
  const inner = document.getElementById('flashcard-inner');
  const pre = document.getElementById('pre-flip-actions');
  const post = document.getElementById('post-flip-actions');
  
  if (inner && pre && post) {
    inner.classList.add('rotate-y-180');
    pre.style.opacity = '0';
    setTimeout(() => {
      pre.classList.add('hidden');
      post.classList.remove('hidden');
    }, 300);
    isFlipped = true;
  }
}

async function handleRating(quality: number, container: HTMLElement) {
  const card = cards[currentIndex];
  
  // Optimistically go next
  currentIndex++;
  isFlipped = false;
  
  // Submit rating in background
  submitRating(card.log_id, quality).catch(err => console.error("Rating failed", err));
  
  // Animate out
  const cardCont = document.getElementById('flashcard-container');
  if (cardCont) {
    cardCont.style.opacity = '0';
    setTimeout(() => {
      renderCurrentCard(container);
    }, 300);
  } else {
    renderCurrentCard(container);
  }
}
