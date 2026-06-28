import { fetchVocabulary, fetchKanji, fetchGrammar, createVocabulary, createKanji, createGrammar, deleteVocabulary, deleteKanji, deleteGrammar } from '../services/api';
import { showToast } from '../components/Toast';
import { openModal, closeModal } from '../components/Modal';

let currentTab = 'Semua';
let currentPage = 1;
let currentSearch = '';
let currentJlpt = '';
let searchTimeout: any;

export async function renderLibrary(container: HTMLElement) {
  container.innerHTML = `
    <header class="mb-stack_lg">
      <h1 class="text-3xl font-display font-bold text-on-surface mb-4">Library</h1>
      <div class="flex border-b border-outline-variant gap-6 overflow-x-auto" id="lib-tabs">
        ${['Semua', 'Kosakata', 'Kanji', 'Tata Bahasa'].map(tab => `
          <button class="lib-tab pb-3 px-2 font-body-md ${tab === currentTab ? 'font-semibold text-primary border-b-2 border-primary' : 'text-on-surface-variant hover:text-primary transition-colors'}" data-tab="${tab}">${tab}</button>
        `).join('')}
      </div>
    </header>

    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
      <div class="flex flex-1 gap-4 w-full md:w-auto">
        <div class="relative flex-1 max-w-md">
          <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
          <input id="search-input" value="${currentSearch}" class="w-full pl-10 pr-4 py-2 bg-surface border border-outline-variant rounded-[20px] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-body-md text-on-background" placeholder="Cari..." type="text"/>
        </div>
        <div class="relative">
          <select id="jlpt-filter" class="appearance-none bg-surface border border-outline-variant rounded-lg px-4 py-2 pr-10 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 font-body-md text-on-background cursor-pointer">
            <option value="">Semua JLPT</option>
            ${['N5','N4','N3','N2','N1'].map(n => `<option value="${n}" ${n === currentJlpt ? 'selected' : ''}>${n}</option>`).join('')}
          </select>
          <span class="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant">arrow_drop_down</span>
        </div>
      </div>
      <button id="btn-add" class="w-full md:w-auto bg-primary text-on-primary px-6 py-2 rounded-lg font-body-md font-semibold hover:bg-primary/90 transition-colors shadow-sm flex items-center justify-center gap-2">
        <span class="material-symbols-outlined text-[20px]">add</span>
        + Tambah Manual
      </button>
    </div>

    <div class="bg-surface rounded-xl border border-outline-variant shadow-sm overflow-hidden" id="table-container">
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-surface-container border-b border-outline-variant">
              <th class="p-4"><div class="h-4 w-24 skeleton-box"></div></th>
              <th class="p-4"><div class="h-4 w-24 skeleton-box"></div></th>
              <th class="p-4 w-24"><div class="h-4 w-12 skeleton-box"></div></th>
              <th class="p-4 w-32"><div class="h-4 w-20 skeleton-box"></div></th>
              <th class="p-4 w-24"><div class="h-4 w-12 skeleton-box mx-auto"></div></th>
            </tr>
          </thead>
          <tbody>
            ${Array.from({ length: 5 }).map((_, idx) => `
              <tr class="${idx % 2 === 0 ? '' : 'bg-surface-container-low'} border-b border-outline-variant/50">
                <td class="p-4"><div class="h-6 w-32 skeleton-box"></div></td>
                <td class="p-4">
                  <div class="h-4 w-24 skeleton-box mb-2"></div>
                  <div class="h-4 w-48 skeleton-box"></div>
                </td>
                <td class="p-4"><div class="h-6 w-12 skeleton-box"></div></td>
                <td class="p-4"><div class="h-4 w-20 skeleton-box"></div></td>
                <td class="p-4"><div class="h-8 w-8 skeleton-box rounded-full mx-auto"></div></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      <div class="p-4 border-t border-outline-variant flex justify-between items-center bg-surface-container-low">
        <div class="h-4 w-32 skeleton-box"></div>
        <div class="flex gap-2">
          <div class="h-8 w-16 skeleton-box rounded"></div>
          <div class="h-8 w-8 skeleton-box rounded"></div>
          <div class="h-8 w-16 skeleton-box rounded"></div>
        </div>
      </div>
    </div>
  `;

  attachEvents(container);
  await loadData();
}

function attachEvents(container: HTMLElement) {
  container.querySelectorAll('.lib-tab').forEach(tab => {
    tab.addEventListener('click', (e) => {
      currentTab = (e.target as HTMLElement).getAttribute('data-tab') || 'Semua';
      currentPage = 1;
      renderLibrary(container);
    });
  });

  const searchInput = document.getElementById('search-input') as HTMLInputElement;
  searchInput?.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      currentSearch = (e.target as HTMLInputElement).value;
      currentPage = 1;
      loadData();
    }, 300);
  });

  document.getElementById('jlpt-filter')?.addEventListener('change', (e) => {
    currentJlpt = (e.target as HTMLSelectElement).value;
    currentPage = 1;
    loadData();
  });

  document.getElementById('btn-add')?.addEventListener('click', () => {
    openAddModal();
  });
}

async function loadData() {
  const tableCont = document.getElementById('table-container');
  if (!tableCont) return;

  // Show skeleton loading state
  tableCont.innerHTML = `
    <div class="overflow-x-auto">
      <table class="w-full text-left border-collapse">
        <thead>
          <tr class="bg-surface-container border-b border-outline-variant">
            <th class="p-4"><div class="h-4 w-24 skeleton-box"></div></th>
            <th class="p-4"><div class="h-4 w-24 skeleton-box"></div></th>
            <th class="p-4 w-24"><div class="h-4 w-12 skeleton-box"></div></th>
            <th class="p-4 w-32"><div class="h-4 w-20 skeleton-box"></div></th>
            <th class="p-4 w-24"><div class="h-4 w-12 skeleton-box mx-auto"></div></th>
          </tr>
        </thead>
        <tbody>
          ${Array.from({ length: 5 }).map((_, idx) => `
            <tr class="${idx % 2 === 0 ? '' : 'bg-surface-container-low'} border-b border-outline-variant/50">
              <td class="p-4"><div class="h-6 w-32 skeleton-box"></div></td>
              <td class="p-4">
                <div class="h-4 w-24 skeleton-box mb-2"></div>
                <div class="h-4 w-48 skeleton-box"></div>
              </td>
              <td class="p-4"><div class="h-6 w-12 skeleton-box"></div></td>
              <td class="p-4"><div class="h-4 w-20 skeleton-box"></div></td>
              <td class="p-4"><div class="h-8 w-8 skeleton-box rounded-full mx-auto"></div></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
    <div class="p-4 border-t border-outline-variant flex justify-between items-center bg-surface-container-low">
      <div class="h-4 w-32 skeleton-box"></div>
      <div class="flex gap-2">
        <div class="h-8 w-16 skeleton-box rounded"></div>
        <div class="h-8 w-8 skeleton-box rounded"></div>
        <div class="h-8 w-16 skeleton-box rounded"></div>
      </div>
    </div>
  `;

  try {
    let items: any[] = [];
    let total = 0;
    
    if (currentTab === 'Kosakata' || currentTab === 'Semua') {
      const res = await fetchVocabulary(currentPage, currentSearch, currentJlpt);
      items = items.concat(res.data.map((d: any) => ({...d, type: 'vocabulary'})));
      total += res.total;
    }
    if (currentTab === 'Kanji' || currentTab === 'Semua') {
      const res = await fetchKanji(currentPage, currentSearch, currentJlpt);
      items = items.concat(res.data.map((d: any) => ({...d, type: 'kanji'})));
      total += res.total;
    }
    if (currentTab === 'Tata Bahasa' || currentTab === 'Semua') {
      const res = await fetchGrammar(currentPage, currentSearch, currentJlpt);
      items = items.concat(res.data.map((d: any) => ({...d, type: 'grammar'})));
      total += res.total;
    }

    if (currentTab === 'Semua') {
      // Sort mixed by date
      items.sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime());
      items = items.slice(0, 10); // simple limit for mixed
    }

    renderTable(items, total);
  } catch (err) {
    tableCont.innerHTML = `<div class="p-4 text-error">Failed to load data</div>`;
  }
}

function renderTable(items: any[], total: number) {
  const tableCont = document.getElementById('table-container');
  if (!tableCont) return;

  if (items.length === 0) {
    tableCont.innerHTML = `<div class="p-8 text-center text-on-surface-variant font-body-md">Tidak ada data.</div>`;
    return;
  }

  const rowsHtml = items.map((item, idx) => {
    const isEven = idx % 2 === 0;
    const bgClass = isEven ? '' : 'bg-surface-container-low';
    
    let front = item.word || item.character || item.pattern || '-';
    let reading = item.reading || (item.onyomi ? `${item.onyomi} / ${item.kunyomi}` : item.structure) || '-';
    let jlptClass = 'bg-primary/10 text-primary border-primary/20'; // default N5
    if(item.jlpt_level === 'N4') jlptClass = 'bg-secondary-container text-on-secondary-container border-secondary/20';
    if(item.jlpt_level === 'N3') jlptClass = 'bg-tertiary-container/10 text-tertiary-container border-tertiary-container/20';

    return `
      <tr class="${bgClass} border-b border-outline-variant/50 hover:bg-primary/5 transition-colors group">
        <td class="p-4"><span class="font-japanese-text text-xl font-bold">${front}</span></td>
        <td class="p-4">
          <div class="text-sm text-on-surface-variant mb-1">${reading}</div>
          <div>${item.meaning}</div>
        </td>
        <td class="p-4"><span class="px-2 py-1 rounded-md text-xs font-semibold ${jlptClass} border">${item.jlpt_level || '-'}</span></td>
        <td class="p-4 text-on-surface-variant text-sm">${new Date(item.created_at).toLocaleDateString('id-ID')}</td>
        <td class="p-4 text-center">
          <div class="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button class="p-1 text-on-surface-variant hover:text-error transition-colors" onclick="window.deleteItem('${item.type}', ${item.id})">
              <span class="material-symbols-outlined text-[20px]">delete</span>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  tableCont.innerHTML = `
    <div class="overflow-x-auto">
      <table class="w-full text-left border-collapse">
        <thead>
          <tr class="bg-surface-container border-b border-outline-variant">
            <th class="p-4 font-label-sm text-on-surface-variant uppercase">Kata/Kanji/Pola</th>
            <th class="p-4 font-label-sm text-on-surface-variant uppercase">Cara Baca/Arti</th>
            <th class="p-4 font-label-sm text-on-surface-variant uppercase w-24">Level</th>
            <th class="p-4 font-label-sm text-on-surface-variant uppercase w-32">Tanggal</th>
            <th class="p-4 font-label-sm text-on-surface-variant uppercase w-24 text-center">Aksi</th>
          </tr>
        </thead>
        <tbody class="font-body-md">${rowsHtml}</tbody>
      </table>
    </div>
    <div class="p-4 border-t border-outline-variant flex justify-between items-center text-sm text-on-surface-variant bg-surface-container-low">
      <span>Total: ${total} data</span>
      <div class="flex gap-2">
        <button class="px-3 py-1 border border-outline-variant rounded hover:bg-surface-container-high transition-colors disabled:opacity-50" ${currentPage === 1 ? 'disabled' : ''} onclick="window.changePage(-1)">Prev</button>
        <span class="px-3 py-1 border border-outline-variant rounded bg-primary text-on-primary">${currentPage}</span>
        <button class="px-3 py-1 border border-outline-variant rounded hover:bg-surface-container-high transition-colors" onclick="window.changePage(1)">Next</button>
      </div>
    </div>
  `;
}

function openAddModal() {
  const content = `
    <div class="space-y-4">
      <div>
        <label class="block font-label-sm text-on-surface-variant mb-1">Tipe</label>
        <div class="flex gap-4">
          <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="add-type" value="vocabulary" checked class="text-primary focus:ring-primary"/> Kosakata</label>
          <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="add-type" value="kanji" class="text-primary focus:ring-primary"/> Kanji</label>
          <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="add-type" value="grammar" class="text-primary focus:ring-primary"/> Tata Bahasa</label>
        </div>
      </div>
      <div>
        <label class="block font-label-sm text-on-surface-variant mb-1">Kata / Kanji / Pola</label>
        <input id="add-front" type="text" class="w-full bg-surface border border-outline-variant rounded-[12px] px-4 py-2 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 font-japanese-text text-on-background transition-all"/>
      </div>
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block font-label-sm text-on-surface-variant mb-1">Cara Baca</label>
          <input id="add-reading" type="text" class="w-full bg-surface border border-outline-variant rounded-[12px] px-4 py-2 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 font-japanese-text text-on-background transition-all"/>
        </div>
        <div>
          <label class="block font-label-sm text-on-surface-variant mb-1">Level JLPT</label>
          <select id="add-jlpt" class="w-full bg-surface border border-outline-variant rounded-[12px] px-4 py-2 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 font-body-md text-on-background transition-all cursor-pointer">
            <option value="N5">N5</option>
            <option value="N4">N4</option>
            <option value="N3">N3</option>
            <option value="N2">N2</option>
            <option value="N1">N1</option>
          </select>
        </div>
      </div>
      <div>
        <label class="block font-label-sm text-on-surface-variant mb-1">Arti</label>
        <input id="add-meaning" type="text" class="w-full bg-surface border border-outline-variant rounded-[12px] px-4 py-2 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 font-body-md text-on-background transition-all"/>
      </div>
      <div>
        <label class="block font-label-sm text-on-surface-variant mb-1">Contoh Kalimat / Kosakata Terkait (Opsional)</label>
        <textarea id="add-example" rows="2" class="w-full bg-surface border border-outline-variant rounded-[12px] px-4 py-2 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 font-japanese-text text-on-background transition-all"></textarea>
      </div>
      <div class="flex justify-end gap-3 pt-4 border-t border-outline-variant">
        <button onclick="closeModal()" class="px-5 py-2 rounded-lg font-body-md font-semibold text-primary hover:bg-primary/10 transition-colors">Batal</button>
        <button onclick="window.submitAdd()" class="bg-primary text-on-primary px-5 py-2 rounded-lg font-body-md font-semibold hover:bg-primary/90 transition-colors shadow-sm">Simpan</button>
      </div>
    </div>
  `;
  openModal('Tambah Item', content);
}

// Global handlers for inline HTML
(window as any).changePage = (delta: number) => {
  currentPage += delta;
  loadData();
};

(window as any).deleteItem = async (type: string, id: number) => {
  try {
    if(type === 'vocabulary') await deleteVocabulary(id);
    if(type === 'kanji') await deleteKanji(id);
    if(type === 'grammar') await deleteGrammar(id);
    showToast('Item berhasil dihapus', 'success');
    loadData();
  } catch (err) {
    showToast('Gagal menghapus', 'error');
  }
};

(window as any).submitAdd = async () => {
  const type = (document.querySelector('input[name="add-type"]:checked') as HTMLInputElement).value;
  const front = (document.getElementById('add-front') as HTMLInputElement).value;
  const reading = (document.getElementById('add-reading') as HTMLInputElement).value;
  const jlpt = (document.getElementById('add-jlpt') as HTMLSelectElement).value;
  const meaning = (document.getElementById('add-meaning') as HTMLInputElement).value;
  const example = (document.getElementById('add-example') as HTMLTextAreaElement).value;

  try {
    if(type === 'vocabulary') {
      await createVocabulary({word: front, reading, jlpt_level: jlpt, meaning, example_sentence: example});
    } else if(type === 'kanji') {
      await createKanji({character: front, onyomi: reading, jlpt_level: jlpt, meaning, example_words: example});
    } else if(type === 'grammar') {
      await createGrammar({pattern: front, structure: reading, jlpt_level: jlpt, meaning, example_sentence: example});
    }
    showToast('Berhasil disimpan!', 'success');
    closeModal();
    loadData();
  } catch (err) {
    showToast('Gagal menyimpan', 'error');
  }
};
