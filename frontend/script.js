function main() {
  const modal         = document.getElementById('customModal');
  const modalMessage  = document.getElementById('modalMessage');
  const closeModalBtn = document.querySelector('.close');
  const loginForm     = document.getElementById('loginForm');
  const loginInput    = document.getElementById('login');
  const passInput     = document.getElementById('password');

  if (!modal || !modalMessage || !closeModalBtn || !loginForm || !loginInput || !passInput) {
    return;
  }

  const API_BASE = 'http://127.0.0.1:9090';

  function showModal(message) {
    modalMessage.textContent = message;
    modal.style.display = 'flex';
  }
  closeModalBtn.addEventListener('click', () => modal.style.display = 'none');
  window.addEventListener('click', (e) => { if (e.target === modal) modal.style.display = 'none'; });

  let inFlight = false;

  async function doLogin() {
    if (inFlight) return;

    const login = (loginInput.value || '').trim();
    const password = (passInput.value || '').trim();

    if (login.length !== 8 || password.length !== 8) {
      return;
    }

    inFlight = true;
    loginInput.disabled = true;
    passInput.disabled  = true;

    try {
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login, password })
      });

      const result = await response.json().catch(() => null);

      if (response.ok) {
        sessionStorage.setItem('user', JSON.stringify(result));
        showModal('Вы успешно вошли в аккаунт!');
        setTimeout(() => { window.location.href = 'lk.html'; }, 800);
      } else {
        const msg = (result && (result.message || result.error)) || 'Неверный логин или пароль.';
        showModal(msg);
      }
    } catch (err) {
      console.error('Ошибка подключения:', err);
      showModal('Не удалось подключиться к серверу.');
    } finally {
      inFlight = false;
      loginInput.disabled = false;
      passInput.disabled  = false;
    }
  }

  const onInput = () => {
    if (loginInput.value.trim().length === 8 && passInput.value.trim().length === 8) {
      setTimeout(doLogin, 0);
    }
  };
  loginInput.addEventListener('input', onInput);
  passInput.addEventListener('input', onInput);

  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    doLogin();
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', main);
} else {
  main();
}
