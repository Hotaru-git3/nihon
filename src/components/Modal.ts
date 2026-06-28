export function ModalContainer(): string {
  return `
    <div id="modal-overlay" class="hidden fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-on-background/40 backdrop-blur-sm" onclick="closeModal()"></div>
      <div id="modal-content" class="relative bg-surface-container-lowest w-full max-w-lg rounded-xl shadow-[0px_8px_24px_rgba(0,0,0,0.08)] border border-outline-variant p-6 z-10 flex flex-col gap-6 max-h-[90vh] overflow-y-auto">
        <!-- Content injected here -->
      </div>
    </div>
  `;
}

export function openModal(title: string, contentHTML: string) {
  const overlay = document.getElementById('modal-overlay');
  const content = document.getElementById('modal-content');
  if (!overlay || !content) return;

  content.innerHTML = `
    <div class="flex justify-between items-center border-b border-outline-variant pb-4">
      <h3 class="font-headline-md text-headline-md text-on-background">${title}</h3>
      <button class="text-on-surface-variant hover:text-error transition-colors" onclick="closeModal()">
        <span class="material-symbols-outlined">close</span>
      </button>
    </div>
    ${contentHTML}
  `;
  
  overlay.classList.remove('hidden');
}

export function closeModal() {
  const overlay = document.getElementById('modal-overlay');
  if (overlay) overlay.classList.add('hidden');
}

// Make closeModal globally available for inline onclick attributes
(window as any).closeModal = closeModal;
