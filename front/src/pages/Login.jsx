// src/pages/Login.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, NavLink, Link } from 'react-router-dom';
import '../App.css';

function Login() {

    useEffect(() => {
        document.title = 'Вход | MeowMeow';
    }, []);

    const [login, setLogin] = useState('');
    const [password, setPassword] = useState('');
    const [modal, setModal] = useState({ show: false, message: '' });
    const [inFlight, setInFlight] = useState(false);

    const navigate = useNavigate();

    const API_BASE = 'http://127.0.0.1:9090';

    // === Модалка ===
    const showModal = useCallback((message) => {
        setModal({ show: true, message });
    }, [setModal]);

    const closeModal = () => {
        setModal({ show: false, message: '' });
        // Очищаем поля при закрытии модального окна
        setLogin('');
        setPassword('');
    };

    // === Основная функция входа ===
    const doLogin = useCallback(async () => {
        if (inFlight) return;

        const trimmedLogin = login.trim();
        const trimmedPassword = password.trim();

        if (trimmedLogin.length !== 8 || trimmedPassword.length !== 8) {
            return;
        }

        setInFlight(true);

        try {
            const response = await fetch(`${API_BASE}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ login: trimmedLogin, password: trimmedPassword }),
            });

            const result = await response.json().catch(() => null);

            if (response.ok) {
                sessionStorage.setItem('user', JSON.stringify(result));
                showModal('Вы успешно вошли в аккаунт!');
                setTimeout(() => {
                    navigate('/lk');
                }, 800);
            } else {
                const msg = (result?.message || result?.error) || 'Неверный логин или пароль.';
                showModal(msg);
            }
        } catch (err) {
            console.error('Ошибка подключения:', err);
            showModal('Не удалось подключиться к серверу.');
        } finally {
            setInFlight(false);
        }
    }, [login, password, inFlight, navigate, API_BASE, showModal]);

    // === Эффект: автовход при 8+8 символах ===
    useEffect(() => {
        if (login.trim().length === 8 && password.trim().length === 8) {
            const timer = setTimeout(doLogin, 0);
            return () => clearTimeout(timer);
        }
    }, [login, password, doLogin]); // Зависимости: перезапуск при изменении полей

    // === Обработчики ввода ===
    const handleLoginChange = (e) => setLogin(e.target.value);
    const handlePasswordChange = (e) => setPassword(e.target.value);

    // === Отправка формы (на Enter или кнопку) ===
    const handleSubmit = (e) => {
        e.preventDefault();
        doLogin();
    };

    return (
        <div>
            <main className="containerlogin">
                <section className="hero_login">
                    <Link to="/mainpage#mainpage_id" className="hero_login_name"><h2>MeowMeow</h2></Link>
                    <h2>Вход в личный кабинет</h2>
                </section>

                <section className="login-form-section">
                    <form onSubmit={handleSubmit} noValidate className="login-form">
                        <div className="form-group-login">
                            <label htmlFor="login">Логин</label>
                            <input
                                type="text"
                                id="login"
                                value={login}
                                onChange={handleLoginChange}
                                maxLength={8}
                                disabled={inFlight}
                                required
                            />
                        </div>

                        <div className="form-group-login">
                            <label htmlFor="password">Пароль</label>
                            <input
                                type="password"
                                id="password"
                                value={password}
                                onChange={handlePasswordChange}
                                maxLength={8}
                                disabled={inFlight}
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className="btn-primary"
                            disabled={inFlight}
                        >
                            {inFlight ? 'Вход...' : 'Войти'}
                        </button>
                    </form>
                </section>
            </main>

            {/* Кастомная модалка */}
            {modal.show && (
                <div className="modal" onClick={closeModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <span className="close" onClick={closeModal}>&times;</span>
                        <p>{modal.message}</p>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Login;