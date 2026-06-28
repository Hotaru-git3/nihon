// pages/Login.ts
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { showToast } from '../components/Toast';
import { navigateTo } from '../router';

export function renderLogin(container: HTMLElement) {
  // 🔥 Tambah class login-page ke body
  document.body.classList.add('login-page');
  
  let isLogin = true;

  const renderForm = () => {
    container.innerHTML = `
      <div class="relative flex items-center justify-center min-h-screen bg-background w-full overflow-hidden p-4">
        
        <div class="absolute top-[-10%] left-[-10%] w-96 h-96 bg-brand-c7756b/10 rounded-full mix-blend-multiply filter blur-3xl opacity-50"></div>
        <div class="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-brand-7db9a8/10 rounded-full mix-blend-multiply filter blur-3xl opacity-50"></div>

        <div class="relative w-full max-w-md p-8 sm:p-10 space-y-8 bg-surface/90 backdrop-blur-xl rounded-[2rem] shadow-2xl border border-outline-variant/50 z-10 transition-all duration-300 animate-fade-in">
          
          <div class="text-center">
            <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-c7756b/10 text-brand-c7756b mb-6 shadow-inner">
              <span class="text-4xl">🌸</span>
            </div>
            <h1 class="text-3xl font-extrabold text-on-surface tracking-tight transition-all duration-300">
              ${isLogin ? 'Okaeri!' : 'Hajimemashite!'}
            </h1>
            <p class="mt-3 text-sm text-on-surface-variant leading-relaxed">
              ${isLogin ? 'Selamat datang kembali di Nihongo Note. Yuk lanjut belajarnya!' : 'Mulai perjalanan belajar bahasa Jepang lo hari ini.'}
            </p>
          </div>
          
          <form id="auth-form" class="space-y-5">
            <div>
              <label class="block text-sm font-semibold text-on-surface mb-2">Email</label>
              <div class="relative">
                <div class="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-on-surface-variant">
                  <span class="material-symbols-outlined">mail</span>
                </div>
                <input type="email" id="email" required placeholder="email@contoh.com" class="w-full pl-12 pr-4 py-3.5 border rounded-xl bg-surface-container-low text-on-surface border-outline-variant focus:ring-2 focus:ring-brand-c7756b/50 focus:border-brand-c7756b focus:bg-surface outline-none transition-all duration-300">
              </div>
            </div>

            <div>
              <label class="block text-sm font-semibold text-on-surface mb-2">Password</label>
              <div class="relative">
                <div class="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-on-surface-variant">
                  <span class="material-symbols-outlined">lock</span>
                </div>
                <input type="password" id="password" required placeholder="••••••••" class="w-full pl-12 pr-4 py-3.5 border rounded-xl bg-surface-container-low text-on-surface border-outline-variant focus:ring-2 focus:ring-brand-c7756b/50 focus:border-brand-c7756b focus:bg-surface outline-none transition-all duration-300">
              </div>
            </div>

            <button type="submit" class="w-full px-4 py-4 mt-4 font-bold text-white bg-rupiahku-brown rounded-xl shadow-lg shadow-rupiahku-brown/30 hover:bg-rupiahku-brown/90 hover:-translate-y-1 hover:shadow-rupiahku-brown/50 focus:ring-4 focus:ring-rupiahku-brown/50 outline-none transition-all duration-300">
              ${isLogin ? 'Masuk Sekarang' : 'Buat Akun'}
            </button>
          </form>

          <div class="pt-6 text-center text-sm text-on-surface-variant border-t border-outline-variant/50">
            ${isLogin ? 'Belum punya akun?' : 'Udah punya akun?'} 
            <button id="toggle-auth" class="text-brand-c7756b hover:text-brand-c7756b/80 hover:underline font-bold transition-colors ml-1 outline-none focus:ring-2 focus:ring-brand-c7756b/50 rounded">
              ${isLogin ? 'Daftar di sini' : 'Login dong'}
            </button>
          </div>
        </div>
      </div>
    `;

    // 🔥 Toggle login/register
    document.getElementById('toggle-auth')?.addEventListener('click', () => {
      isLogin = !isLogin;
      renderForm();
    });

    // 🔥 Submit form
    document.getElementById('auth-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = (document.getElementById('email') as HTMLInputElement).value;
      const password = (document.getElementById('password') as HTMLInputElement).value;
      
      const submitBtn = document.querySelector('#auth-form button[type="submit"]') as HTMLButtonElement;
      submitBtn.disabled = true;
      submitBtn.textContent = 'Loading...';
      
      try {
        if (isLogin) {
          const userCredential = await signInWithEmailAndPassword(auth!, email, password);
          console.log('✅ Login success:', userCredential.user.email);
          
          localStorage.setItem('email', email);
          localStorage.setItem('user_display_name', email.split('@')[0]);
          
          showToast('Login berhasil! Yok belajar.', 'success');
          navigateTo('/dashboard');
        } else {
          const userCredential = await createUserWithEmailAndPassword(auth!, email, password);
          console.log('✅ Register success:', userCredential.user.email);
          
          localStorage.setItem('email', email);
          localStorage.setItem('user_display_name', email.split('@')[0]);
          
          showToast('Daftar sukses! Yok belajar.', 'success');
          navigateTo('/dashboard');
        }
      } catch (error: any) {
        console.error('❌ Auth error:', error);
        
        let message = 'Terjadi kesalahan. Coba lagi.';
        if (error.code === 'auth/user-not-found') message = 'Email tidak ditemukan.';
        else if (error.code === 'auth/wrong-password') message = 'Password salah. Coba lagi.';
        else if (error.code === 'auth/email-already-in-use') message = 'Email sudah terdaftar.';
        else if (error.code === 'auth/weak-password') message = 'Password minimal 6 karakter.';
        else if (error.code === 'auth/invalid-email') message = 'Format email tidak valid.';
        else if (error.code === 'auth/invalid-credential') message = 'Email atau password salah.';
        else message = error.message || 'Terjadi kesalahan.';
        
        showToast(message, 'error');
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = isLogin ? 'Masuk Sekarang' : 'Buat Akun';
      }
    });
  };

  renderForm();
}