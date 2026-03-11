import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../config';
import { useAuth } from '../../hooks/useAuth';
import './SessionTimeoutModal.css';

const IDLE_TIMEOUT_MS = 60 * 1000;   // 1 минута неактивности
const WARNING_TIMEOUT_MS = 15 * 1000; // 15 секунд на подтверждение

const SessionTimeoutModal = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [showModal, setShowModal] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(WARNING_TIMEOUT_MS / 1000);
  const [processing, setProcessing] = useState(false);

  const idleTimerRef = useRef(null);
  const warningTimerRef = useRef(null);
  const countdownRef = useRef(null);

  const token = user?.token;

  // ===== Очистка всех таймеров =====
  const clearAllTimers = () => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
    idleTimerRef.current = null;
    warningTimerRef.current = null;
    countdownRef.current = null;
  };

  // ===== Принудительный выход =====
  const forceLogout = async () => {
    if (processing) return;
    setProcessing(true);

    try {
      if (token) {
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } catch {
      // Игнорируем ошибку — всё равно выходим
    } finally {
      clearAllTimers();
      logout();
      navigate('/login', {
        replace: true,
        state: {
          sessionExpired: true,
          message: 'Сессия завершена из-за неактивности',
        },
      });
    }
  };

  // ===== Продление сессии =====
  const stayLoggedIn = async () => {
    if (processing) return;
    setProcessing(true);

    try {
      if (token) {
        const res = await fetch(`${API_BASE_URL}/auth/ping`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Ping failed');
      }

      // Скрыть модалку и перезапустить таймер неактивности
      setShowModal(false);
      setSecondsLeft(WARNING_TIMEOUT_MS / 1000);
      clearAllTimers();
      restartIdleTimer();
    } catch {
      await forceLogout();
      return;
    } finally {
      setProcessing(false);
    }
  };

  // ===== Перезапуск таймера неактивности =====
  const restartIdleTimer = () => {
    clearAllTimers();

    idleTimerRef.current = setTimeout(() => {
      setShowModal(true);
      setSecondsLeft(WARNING_TIMEOUT_MS / 1000);

      // Обратный отсчёт 15 секунд
      countdownRef.current = setInterval(() => {
        setSecondsLeft(prev => {
          if (prev <= 1) {
            clearInterval(countdownRef.current);
            forceLogout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Резервный таймаут на случай сбоя интервала
      warningTimerRef.current = setTimeout(() => {
        forceLogout();
      }, WARNING_TIMEOUT_MS);
    }, IDLE_TIMEOUT_MS);
  };

  // ===== Обработка активности пользователя =====
  const handleUserActivity = () => {
    // Не сбрасываем таймер, если модалка уже открыта — пользователь должен явно подтвердить
    if (!showModal) {
      restartIdleTimer();
    }
  };

  // ===== Инициализация при монтировании =====
  useEffect(() => {
    if (!user || !token) {
      clearAllTimers();
      return;
    }

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click', 'mousemove'];

    events.forEach(event => {
      document.addEventListener(event, handleUserActivity);
    });

    restartIdleTimer();

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleUserActivity);
      });
      clearAllTimers();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, token]);

  // ===== Не рендерим для неавторизованных или если модалка скрыта =====
  if (!user || !showModal) return null;

  // ===== Форматирование времени =====
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="session-timeout-modal-overlay">
      <div className="session-timeout-modal">
        <div className="session-timeout-header">
          <h3>Вы всё ещё здесь?</h3>
          <div className="session-timeout-timer">
            <span className="timer-label">До выхода:</span>
            <span
              className={`timer-value ${secondsLeft <= 5 ? 'timer-warning' : ''}`}
            >
              {formatTime(secondsLeft)}
            </span>
          </div>
        </div>

        <div className="session-timeout-body">
          <p>Подтвердите вашу активность.</p>
          <div className="session-timeout-progress">
            <div
              className={`session-timeout-progress-bar ${secondsLeft <= 5 ? 'timer-warning' : ''}`}
              style={{
                width: `${(secondsLeft / (WARNING_TIMEOUT_MS / 1000)) * 100}%`,
              }}
            />
          </div>
        </div>

        <div className="session-timeout-actions">
          <button
            className="session-stay-btn"
            onClick={stayLoggedIn}
            disabled={processing}
          >
            {processing ? 'Продление...' : 'Продолжить работу'}
          </button>

          <button
            className="session-logout-btn"
            onClick={forceLogout}
            disabled={processing}
          >
            Выйти сейчас
          </button>
        </div>

        <div className="session-timeout-footer">
          <small>
            Без подтверждения, сессия будет завершена автоматически.
          </small>
        </div>
      </div>
    </div>
  );
};

export default SessionTimeoutModal;