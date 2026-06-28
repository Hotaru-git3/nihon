import { analyzeText, saveFromAI } from '../services/api';
import { showToast } from '../components/Toast';

export function renderAIBreakdown(container: HTMLElement) {
  container.innerHTML = `
    <header class="mb-stack_lg">
      <h1 class="text-3xl font-display font-bold text-on-surface mb-2">AI Text Analyzer</h1>
      <p class="font-body-md text-on-surface-variant">Uraikan teks bahasa Jepang menjadi kosakata, kanji, dan tata bahasa.</p>
    </header>

    <div class="flex flex-col lg:flex-row gap-gutter min-h-[calc(100vh-200px)] lg:h-[calc(100vh-200px)]">
      <!-- Left Panel -->
      <div class="w-full lg:w-1/2 flex flex-col gap-4">
        <textarea id="ai-input" class="w-full h-[250px] sm:h-[350px] lg:flex-1 resize-none bg-surface border border-outline-variant rounded-xl p-4 font-japanese-text text-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" placeholder="Tempel teks Jepang di sini... (Contoh: 今日は学校に行きます。)"></textarea>
        <button id="btn-analyze" class="w-full bg-primary text-on-primary font-headline-md text-body-lg font-bold py-4 rounded-xl shadow-md hover:shadow-lg hover:bg-primary/90 transition-all duration-200 flex items-center justify-center gap-2">
          <span class="material-symbols-outlined">smart_toy</span> BONGKAR DENGAN AI
        </button>
        <p class="text-center font-label-sm text-[12px] text-on-surface-variant flex justify-center items-center gap-1">
          <span class="material-symbols-outlined text-[16px]">info</span> Maksimal 500 karakter per analisis.
        </p>
      </div>

      <!-- Right Panel -->
      <div id="ai-result-panel" class="w-full lg:w-1/2 bg-surface rounded-xl border border-outline-variant shadow-sm overflow-y-auto p-4 sm:p-stack_lg flex flex-col min-h-[300px]">
        <!-- Empty State -->
        <div class="flex flex-col items-center justify-center h-full opacity-50 m-auto">
          <div class="w-20 h-20 rounded-full bg-primary-container/20 flex items-center justify-center mb-4">
            <span class="material-symbols-outlined text-[40px] text-primary">analytics</span>
          </div>
          <h3 class="font-headline-md text-headline-md text-on-background text-center">Panel Analisis</h3>
          <p class="font-body-md text-center text-on-surface-variant max-w-[280px] mt-2">Masukkan teks Jepang di panel kiri dan klik tombol untuk melihat rincian.</p>
        </div>
      </div>
    </div>
  `;

  document.getElementById('btn-analyze')?.addEventListener('click', handleAnalyze);
}

async function handleAnalyze() {
  const input = document.getElementById('ai-input') as HTMLTextAreaElement;
  const text = input.value.trim();
  const panel = document.getElementById('ai-result-panel');
  const btn = document.getElementById('btn-analyze') as HTMLButtonElement;

  if (!text || !panel) return;

  // Loading State
  btn.disabled = true;
  btn.classList.add('opacity-80');
  btn.innerHTML = `<span class="material-symbols-outlined animate-spin">autorenew</span> MEMPROSES...`;

  panel.innerHTML = `
    <div class="flex items-center justify-center gap-2 mb-6 text-primary">
      <span class="material-symbols-outlined animate-spin">autorenew</span>
      <span class="font-headline-md">AI Sedang Memproses...</span>
    </div>
    <div class="space-y-6">
      <div class="h-20 bg-surface-container-high animate-pulse rounded-lg"></div>
      <div class="h-32 bg-surface-container-high animate-pulse rounded-lg"></div>
      <div class="h-24 bg-surface-container-high animate-pulse rounded-lg"></div>
    </div>
  `;

  try {
    const result = await analyzeText(text);
    renderResults(panel, result);
  } catch (error) {
    panel.innerHTML = `
      <div class="p-6 bg-error-container text-on-error-container rounded-xl flex flex-col items-center justify-center h-full m-auto text-center">
        <span class="material-symbols-outlined text-[48px] mb-2">error</span>
        <p class="font-headline-md">Gagal menganalisis teks.</p>
        <p class="font-body-md opacity-80 mt-2">${(error as Error).message}</p>
      </div>
    `;
  } finally {
    btn.disabled = false;
    btn.classList.remove('opacity-80');
    btn.innerHTML = `<span class="material-symbols-outlined">smart_toy</span> BONGKAR DENGAN AI`;
  }
}

function renderResults(panel: HTMLElement, data: any) {
  let html = '';

  // Translation
  if (data.translation) {
    html += `
      <div class="mb-8 bg-surface-bright p-6 rounded-xl border-l-4 border-primary shadow-sm">
        <span class="font-label-sm text-primary font-bold uppercase tracking-widest block mb-2">Terjemahan</span>
        <p class="font-body-lg text-on-surface italic">${data.translation}</p>
      </div>
    `;
  }

  // Vocab
  if (data.vocabulary && data.vocabulary.length > 0) {
    html += `<h3 class="font-headline-md text-on-background mb-4 border-b border-outline-variant pb-2">Kosakata</h3><div class="space-y-3 mb-8">`;
    data.vocabulary.forEach((v: any) => {
      const vStr = encodeURIComponent(JSON.stringify(v));
      const wordText = v.word || v.reading || '-';
      html += `
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-surface-container-lowest p-4 rounded-lg border border-outline-variant/50 hover:shadow-md transition-shadow gap-3">
          <div class="w-full">
            <div class="font-japanese-text text-xl font-bold text-on-background">${wordText}</div>
            <div class="font-body-md text-sm text-on-surface-variant mb-1">${v.reading && v.reading !== wordText ? v.reading : ''}</div>
            <div class="font-body-md text-sm text-on-surface"><span class="text-on-surface-variant opacity-70 font-label-sm text-[11px] uppercase mr-1">Arti:</span>${v.meaning || '-'}</div>
          </div>
          <button class="text-secondary border border-secondary px-3 py-1 rounded-md text-sm font-semibold hover:bg-secondary hover:text-white transition-colors shrink-0" onclick="window.saveAiItem('vocabulary', '${vStr}', this)">+ Simpan</button>
        </div>
      `;
    });
    html += `</div>`;
  }

  // Kanji
  if (data.kanji && data.kanji.length > 0) {
    html += `<h3 class="font-headline-md text-on-background mb-4 border-b border-outline-variant pb-2">Kanji</h3><div class="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">`;
    data.kanji.forEach((k: any) => {
      const kStr = encodeURIComponent(JSON.stringify(k));
      const charText = k.character || '-';
      html += `
        <div class="bg-surface-container-lowest p-4 rounded-lg border border-outline-variant/50 text-center relative group hover:shadow-md transition-shadow flex flex-col items-center">
          <button class="absolute top-2 right-2 text-on-surface-variant opacity-0 group-hover:opacity-100 hover:text-primary transition-all" onclick="window.saveAiItem('kanji', '${kStr}', this)">
            <span class="material-symbols-outlined text-[20px]">bookmark_add</span>
          </button>
          <div class="font-japanese-text text-3xl font-bold text-primary mb-2">${charText}</div>
          <div class="font-label-sm text-[10px] text-on-surface-variant uppercase mb-2">${k.onyomi || k.kunyomi || '-'}</div>
          <div class="font-body-md text-xs sm:text-sm text-on-surface w-full bg-surface-container-low py-1 rounded border border-outline-variant/20"><span class="text-on-surface-variant opacity-70 text-[9px] uppercase block mb-1">Arti:</span>${k.meaning || '-'}</div>
        </div>
      `;
    });
    html += `</div>`;
  }

  // Grammar
  if (data.grammar && data.grammar.length > 0) {
    html += `<h3 class="font-headline-md text-on-background mb-4 border-b border-outline-variant pb-2">Tata Bahasa</h3><div class="space-y-3 mb-8">`;
    data.grammar.forEach((g: any, i: number) => {
      const gStr = encodeURIComponent(JSON.stringify(g));
      const patternText = g.pattern || '-';
      html += `
        <div class="bg-surface-container-lowest p-4 rounded-lg border border-outline-variant/50 hover:shadow-md transition-shadow">
          <div class="flex justify-between items-start mb-2 gap-3">
            <div class="font-japanese-text text-lg font-bold text-on-background"><span class="text-primary mr-2">${i+1}.</span>${patternText}</div>
            <button class="text-secondary border border-secondary px-3 py-1 rounded-md text-sm font-semibold hover:bg-secondary hover:text-white transition-colors shrink-0" onclick="window.saveAiItem('grammar', '${gStr}', this)">+ Simpan</button>
          </div>
          <p class="font-body-md text-on-surface"><span class="text-on-surface-variant opacity-70 font-label-sm text-[11px] uppercase mr-1">Arti:</span>${g.meaning || '-'}</p>
        </div>
      `;
    });
    html += `</div>`;
  }

  panel.innerHTML = html;
}

(window as any).saveAiItem = async (type: string, dataStr: string, btn: HTMLButtonElement) => {
  try {
    btn.disabled = true;
    btn.innerHTML = `<span class="material-symbols-outlined text-[16px] animate-spin">sync</span>`;
    const data = JSON.parse(decodeURIComponent(dataStr));
    await saveFromAI(data, type);
    showToast('Berhasil disimpan!', 'success');
    btn.className = "text-on-primary bg-primary border border-primary px-3 py-1 rounded-md text-sm font-semibold transition-colors";
    btn.innerHTML = `✅ Tersimpan`;
  } catch (err) {
    showToast('Gagal menyimpan', 'error');
    btn.disabled = false;
    btn.innerHTML = `+ Simpan`;
  }
};
