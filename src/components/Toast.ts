export function ToastContainer(): string {
  return `<div id="toast-container" class="fixed bottom-20 lg:bottom-6 right-6 z-[100] flex flex-col gap-2 pointer-events-none"></div>`;
}

export function showToast(message: string, type: 'success' | 'error' = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  const borderColor = type === 'success' ? 'border-primary' : 'border-error';
  const icon = type === 'success' ? 'check_circle' : 'error';
  const iconColor = type === 'success' ? 'text-primary' : 'text-error';

  toast.className = `bg-surface border-l-4 ${borderColor} shadow-lg rounded p-4 flex items-center gap-3 transition-all duration-300 transform translate-x-full opacity-0 pointer-events-auto`;
  toast.innerHTML = `
    <span class="material-symbols-outlined ${iconColor}">${icon}</span>
    <span class="font-body-md text-on-surface">${message}</span>
  `;

  container.appendChild(toast);

  // Animate in
  requestAnimationFrame(() => {
    toast.classList.remove('translate-x-full', 'opacity-0');
  });

  // Auto hide
  setTimeout(() => {
    toast.classList.add('translate-x-full', 'opacity-0');
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 3000);
}
