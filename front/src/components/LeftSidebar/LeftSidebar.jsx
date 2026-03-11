// src/components/LeftSidebar/LeftSidebar.jsx
import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import './LeftSidebar.css';
import { API_BASE_URL } from '../../config'; // ✅ добавили, ничего не убираем

function LeftSidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  // Получаем текущего пользователя из sessionStorage
  const getUser = () => {
    try {
      const userStr = sessionStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : {};
    } catch {
      return {};
    }
  };

  const user = getUser();

  // Берём "сырое" имя из разных возможных полей
  const rawName =
    (user &&
      (user.fullName || user.full_name || user.name || user.login)) ||
    '';

  // Формируем инициалы
  const getInitials = () => {
    if (!rawName) return 'U';
    const parts = rawName.trim().split(/\s+/);
    const first = parts[0]?.[0] ?? '';
    const second = parts[1]?.[0] ?? '';
    const initials = (first + second).toUpperCase();
    return initials || 'U';
  };

  const initials = getInitials();

  // ФИО
  const displayName = rawName || 'Пользователь';

  // Роль
  const displayRole = (() => {
    switch (user?.role) {
      case 'admin':
        return 'Администратор';
      case 'moderator':
        return 'Модератор';
      default:
        return 'Сотрудник';
    }
  })();

  // Должность
  const displayPosition =
    user?.positionTitle || user?.position_title || 'Должность не указана';

  // ✅ Логаут: сперва уведомляем бэк, потом чистим sessionStorage
  const handleLogout = async () => {
    const token =
      user?.token || user?.accessToken || user?.jwt || user?.userToken || null;

    try {
      if (token) {
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: 'POST',
          credentials: 'include',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }
    } catch (e) {
      // даже если запрос упал — всё равно выходим локально
      console.error('Logout request failed:', e);
    } finally {
      sessionStorage.removeItem('user');
      sessionStorage.removeItem('isAuthenticated');
      navigate('/');
    }
  };

  // Проверяем активный пункт меню
  const isActive = (path) => location.pathname.startsWith(path);

  return (
    <aside className="left-sidebar">
      <div className="sidebar-header">
        <Link to="/lk" className="logo">
          <span className="logo-text">MeowMeow</span>
        </Link>

        <div className="user-info">
          <div className="user-avatar">
            <span>{initials}</span>
          </div>

          <div className="user-meta">
            <div className="user-name">{displayName}</div>
            <div className="user-role">{displayRole}</div>
            <div className="user-position">{displayPosition}</div>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <ul className="nav-list">
          {/* Новости */}
          <li className={`nav-item ${isActive('/news') ? 'active' : ''}`}>
            <Link to="/news" className="nav-link">
              <span className="nav-text">Новости</span>
            </Link>
          </li>

          {/* Календарь событий */}
          <li className={`nav-item ${isActive('/calendar') ? 'active' : ''}`}>
            <Link to="/calendar" className="nav-link">
              <span className="nav-text">Календарь</span>
            </Link>
          </li>

          {/* Бронирование */}
          <li className={`nav-item ${isActive('/booking') ? 'active' : ''}`}>
            <Link to="/booking" className="nav-link">
              <span className="nav-text">Бронирование</span>
            </Link>
          </li>

          {/* Заявки на услуги */}
          <li
            className={`nav-item ${
              isActive('/servicerequestwork') ? 'active' : ''
            }`}
          >
            <Link to="/servicerequestwork" className="nav-link">
              <span className="nav-text">Заявки на услуги</span>
            </Link>
          </li>

          {/* Заявки в ТП */}
          <li className={`nav-item ${isActive('/techsupport') ? 'active' : ''}`}>
            <Link to="/techsupport" className="nav-link">
              <span className="nav-text">Заявки в ТП</span>
            </Link>
          </li>

          {/* Документы */}
          <li className={`nav-item ${isActive('/documents') ? 'active' : ''}`}>
            <Link to="/documents" className="nav-link">
              <span className="nav-text">Документы</span>
            </Link>
          </li>

          {/* Редактирование новостей (модератор+) */}
          {(user.role === 'moderator' || user.role === 'admin') && (
            <li
              className={`nav-item ${
                isActive('/editingnews') ? 'active' : ''
              }`}
            >
              <Link to="/editingnews" className="nav-link">
                <span className="nav-text">Редактирование новостей</span>
              </Link>
            </li>
          )}

          {/* Администрирование (только админ) */}
          {user.role === 'admin' && (
            <li className={`nav-item ${isActive('/adminusers') ? 'active' : ''}`}>
              <Link to="/adminusers" className="nav-link">
                <span className="nav-text">Администрирование</span>
              </Link>
            </li>
          )}
        </ul>
      </nav>

      <div className="sidebar-footer">
        <button onClick={handleLogout} className="logout-btn">
          <span className="logout-text">Выйти</span>
        </button>
      </div>
    </aside>
  );
}

export default LeftSidebar;