// src/components/RequireRole.jsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const ROLE_LEVEL = {
    employee: 1,
    moderator: 2,
    admin: 3
};

// Вспомогательная функция
const hasAllowedRole = (userRole, allowedRoles) => {
    return allowedRoles?.includes(userRole);
};

export default function RequireRole({ children, minRole, allowedRoles }) {
    const { user, loading } = useAuth();

    // 🔁 Ждём, пока определится, авторизован ли пользователь
    if (loading) {
        return <div className="container" style={{ padding: '40px 0', textAlign: 'center' }}>Загрузка...</div>;
    }

    // 🔐 Не авторизован → редирект
    if (!user) {
        return <Navigate to="/login" replace />;
    }

    const userRole = user.role;
    const userLevel = ROLE_LEVEL[userRole] || 0;

    // 🔑 Сначала проверяем allowedRoles (если задан)
    if (allowedRoles) {
        if (!hasAllowedRole(userRole, allowedRoles)) {
            return (
                <div className="container" style={{ padding: '40px 0' }}>
                    <h2>Доступ запрещён</h2>
                    <p>У вас недостаточно прав.</p>
                </div>
            );
        }
        return children;
    }

    // 📏 Иначе — мин. уровень (minRole)
    const requiredLevel = ROLE_LEVEL[minRole] || 1;
    if (userLevel < requiredLevel) {
        return (
            <div className="container" style={{ padding: '40px 0' }}>
                <h2>Доступ запрещён</h2>
                <p>У вас недостаточно прав.</p>
            </div>
        );
    }

    return children;
}