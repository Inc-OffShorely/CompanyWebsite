// src/pages/Calendar.jsx
import React, { useEffect, useMemo, useState } from 'react';
import '../styles/style.css';
import { useAuth } from '../hooks/useAuth';
import { API_BASE_URL } from '../config';

function Calendar() {
    useEffect(() => {
        document.title = 'Календарь | MeowMeow';
    }, []);

    const { user } = useAuth();

    // Токен авторизации (как у вас в других страницах)
    const authToken = user?.token || user?.accessToken || user?.jwt || null;
    const currentEmployeeId = user?.id || user?.employeeId || user?.employee_id || null;
    const isAdmin = (user?.role || '').toLowerCase() === 'admin';

    // Если на бэке другой base path — поправь здесь
    const CALENDAR_BASE = `${API_BASE_URL}/calendar`;

    // Состояния календаря
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(null); // 'YYYY-MM-DD'

    // События: { 'YYYY-MM-DD': [event, event...] }
    const [eventsByDate, setEventsByDate] = useState({});

    // События выбранного дня для модалки
    const [selectedDayEvents, setSelectedDayEvents] = useState([]);

    // Модалка + форма
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newEvent, setNewEvent] = useState({ title: '', description: '' });

    // Загрузка/ошибки
    const [loadingMonth, setLoadingMonth] = useState(false);
    const [loadingDay, setLoadingDay] = useState(false);
    const [saving, setSaving] = useState(false);
    const [loadError, setLoadError] = useState('');

    // === Модальное окно удаления события ===
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null); // объект события для удаления
    const [deleting, setDeleting] = useState(false);

    // Хелпер безопасного чтения полей (как у тебя в примере)
    const pick = (obj, ...keys) => {
        if (!obj) return undefined;
        for (const k of keys) {
            if (Object.prototype.hasOwnProperty.call(obj, k)) return obj[k];
        }
        return undefined;
    };

    // Формат YYYY-MM-DD
    const formatDateKey = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0'); // месяцы с 0
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    // Диапазон текущего месяца
    const monthRange = useMemo(() => {
        const y = currentDate.getFullYear();
        const m = currentDate.getMonth();
        const from = new Date(y, m, 1);
        const to = new Date(y, m + 1, 0);
        return {
            fromKey: formatDateKey(from),
            toKey: formatDateKey(to),
        };
    }, [currentDate]);

    // Навигация по месяцу
    const prevMonth = () =>
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    const nextMonth = () =>
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

    // Получение дней месяца (с понедельника)
    const getCalendarDays = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0).getDate();

        // Пн=0..Вс=6
        const startDay = firstDay.getDay(); // Вс=0 ... Сб=6
        const startOffset = startDay === 0 ? 6 : startDay - 1;

        const days = [];
        for (let i = 0; i < startOffset; i++) days.push(null);
        for (let day = 1; day <= lastDay; day++) days.push(new Date(year, month, day));
        while (days.length < 42) days.push(null);

        return days;
    };

    const today = new Date();
    const isToday = (date) =>
        date &&
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear();

    // ===== API: загрузка событий месяца =====
    useEffect(() => {
        if (!authToken) return;

        const fetchMonthEvents = async () => {
            try {
                setLoadingMonth(true);
                setLoadError('');

                const headers = { Authorization: `Bearer ${authToken}` };

                const res = await fetch(
                    `${CALENDAR_BASE}/events?from=${monthRange.fromKey}&to=${monthRange.toKey}`,
                    {
                        method: 'GET',
                        credentials: 'include',
                        headers,
                    }
                );

                if (!res.ok) throw new Error(`Не удалось загрузить события (код ${res.status})`);

                const data = await res.json();
                const arr = Array.isArray(data) ? data : [];

                // Нормализуем + группируем по date
                const grouped = {};
                arr.forEach((item) => {
                    const date = pick(item, 'date', 'eventDate', 'event_date');
                    if (!date) return;

                    const normalized = {
                        id: pick(item, 'id', 'eventId', 'event_id'),
                        date,
                        title: pick(item, 'title') || '',
                        description: pick(item, 'description') || '',
                        createdAt: pick(item, 'createdAt', 'created_at') || null,
                        createdById: pick(item, 'createdById', 'created_by_id', 'createdByEmployeeId') || null,
                        createdByName: pick(item, 'createdByName', 'created_by_name') || null,
                    };

                    if (!grouped[date]) grouped[date] = [];
                    grouped[date].push(normalized);
                });

                setEventsByDate(grouped);
            } catch (err) {
                console.error(err);
                setLoadError(err.message || 'Ошибка при загрузке событий');
                setEventsByDate({});
            } finally {
                setLoadingMonth(false);
            }
        };

        fetchMonthEvents();
    }, [authToken, monthRange.fromKey, monthRange.toKey]);

    // ===== API: загрузка событий дня (для модалки) =====
    const fetchDayEvents = async (dateKey) => {
        if (!authToken) return;

        try {
            setLoadingDay(true);
            setLoadError('');

            const headers = { Authorization: `Bearer ${authToken}` };

            const res = await fetch(`${CALENDAR_BASE}/events/${dateKey}`, {
                method: 'GET',
                credentials: 'include',
                headers,
            });

            if (!res.ok) throw new Error(`Не удалось загрузить события дня (код ${res.status})`);

            const data = await res.json();
            const arr = Array.isArray(data) ? data : [];

            const normalized = arr.map((item) => ({
                id: pick(item, 'id', 'eventId', 'event_id'),
                date: pick(item, 'date', 'eventDate', 'event_date') || dateKey,
                title: pick(item, 'title') || '',
                description: pick(item, 'description') || '',
                createdAt: pick(item, 'createdAt', 'created_at') || null,
                createdById: pick(item, 'createdById', 'created_by_id', 'createdByEmployeeId') || null,
                createdByName: pick(item, 'createdByName', 'created_by_name') || null,
            }));

            setSelectedDayEvents(normalized);
        } catch (err) {
            console.error(err);
            setSelectedDayEvents([]);
            setLoadError(err.message || 'Ошибка при загрузке событий дня');
        } finally {
            setLoadingDay(false);
        }
    };

    // Открыть модалку по клику на дату
    const handleDayClick = (dateObj) => {
        if (!dateObj) return;

        const key = formatDateKey(dateObj);
        setSelectedDate(key);
        setNewEvent({ title: '', description: '' });
        setIsModalOpen(true);

        fetchDayEvents(key);
    };

    // === ОТКРЫТИЕ МОДАЛЬНОГО ОКНА УДАЛЕНИЯ ===
    const openDeleteModal = (eventObj) => {
        if (!eventObj?.id) return;
        setDeleteTarget(eventObj);
        setIsDeleteModalOpen(true);
    };

    // === ПОДТВЕРЖДЕННОЕ УДАЛЕНИЕ СОБЫТИЯ ===
    const confirmDelete = async () => {
        if (!deleteTarget || !authToken) return;

        try {
            setDeleting(true);
            setLoadError('');

            const res = await fetch(`${CALENDAR_BASE}/events/${deleteTarget.id}`, {
                method: 'DELETE',
                credentials: 'include',
                headers: { Authorization: `Bearer ${authToken}` },
            });

            if (!res.ok) {
                const text = await res.text().catch(() => '');
                throw new Error(`Не удалось удалить событие (код ${res.status}) ${text}`);
            }

            // 1) убрать из списка в модалке
            setSelectedDayEvents(prev => prev.filter(x => String(x.id) !== String(deleteTarget.id)));

            // 2) убрать из календаря под датой
            setEventsByDate(prev => {
                const copy = { ...prev };
                const d = deleteTarget.date || selectedDate;
                if (!d || !copy[d]) return copy;

                copy[d] = copy[d].filter(x => String(x.id) !== String(deleteTarget.id));
                if (copy[d].length === 0) delete copy[d];
                return copy;
            });

            // Закрываем модальное окно
            setIsDeleteModalOpen(false);
            setDeleteTarget(null);
            setDeleting(false);
        } catch (err) {
            console.error(err);
            setLoadError(err.message || 'Ошибка при удалении события');
            setIsDeleteModalOpen(false);
            setDeleteTarget(null);
            setDeleting(false);
        }
    };

    // ===== API: создание события =====
    const handleAddEvent = async () => {
        if (!authToken) {
            setLoadError('Вы не авторизованы');
            return;
        }
        if (!selectedDate) return;
        if (!newEvent.title.trim()) return;

        try {
            setSaving(true);
            setLoadError('');

            const headers = {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${authToken}`,
            };

            const payload = {
                date: selectedDate,
                title: newEvent.title.trim(),
                description: newEvent.description || '',
            };

            const res = await fetch(`${CALENDAR_BASE}/events`, {
                method: 'POST',
                credentials: 'include',
                headers,
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const text = await res.text().catch(() => '');
                throw new Error(`Не удалось создать событие (код ${res.status}) ${text}`);
            }

            const created = await res.json();

            const normalized = {
                id: pick(created, 'id', 'eventId', 'event_id'),
                date: pick(created, 'date', 'eventDate', 'event_date') || selectedDate,
                title: pick(created, 'title') || payload.title,
                description: pick(created, 'description') || payload.description,
                createdAt: pick(created, 'createdAt', 'created_at') || null,
                createdById: pick(created, 'createdById', 'created_by_id', 'createdByEmployeeId') || null,
                createdByName: pick(created, 'createdByName', 'created_by_name') || null,
            };

            // Обновляем модалку
            setSelectedDayEvents((prev) => [...prev, normalized]);

            // Обновляем календарный список под датой
            setEventsByDate((prev) => {
                const copy = { ...prev };
                if (!copy[normalized.date]) copy[normalized.date] = [];
                copy[normalized.date] = [...copy[normalized.date], normalized];
                return copy;
            });

            // Очищаем форму
            setNewEvent({ title: '', description: '' });
        } catch (err) {
            console.error(err);
            setLoadError(err.message || 'Ошибка при создании события');
        } finally {
            setSaving(false);
        }
    };

    // Рендер ячейки дня
    const renderDayCell = (dateObj) => {
        if (!dateObj) return <div className="calendar-day calendar-day-disabled"></div>;

        const dayKey = formatDateKey(dateObj);
        const dayEvents = eventsByDate[dayKey] || [];
        const dayClass = `calendar-day ${isToday(dateObj) ? 'calendar-day-today' : ''}`;

        return (
            <div className={dayClass} onClick={() => handleDayClick(dateObj)}>
                <span className="calendar-day-number">{dateObj.getDate()}</span>

                {dayEvents.length > 0 && (
                    <div className="calendar-day-events">
                        {dayEvents.slice(0, 2).map((e, i) => (
                            <div key={e.id || i}>{e.title}</div>
                        ))}
                        {dayEvents.length > 2 && <div>+ ещё {dayEvents.length - 2}</div>}
                    </div>
                )}
            </div>
        );
    };

    const weekdays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

    const formatCreatedAt = (iso) => {
        if (!iso) return '—';
        const d = new Date(iso);
        if (Number.isNaN(d.getTime())) return iso;
        return d.toLocaleString('ru-RU');
    };

    return (
        <main className="dashboard-container">
            <section className="dashboard-hero">
                <h2>Календарь событий</h2>
                <p>Планируйте и отслеживайте корпоративные события и встречи.</p>
            </section>

            {/* Загрузка/ошибки */}
            {loadingMonth && (
                <div className="loading-message">
                    <p>Загрузка событий...</p>
                </div>
            )}

            {loadError && (
                <div className="error-message">
                    <p>Ошибка: {loadError}</p>
                </div>
            )}

            <div className="calendar-container">
                <div className="calendar-header">
                    <button className="calendar-nav-btn" onClick={prevMonth} disabled={loadingMonth}>
                        &larr;
                    </button>

                    <h3 className="calendar-title">
                        {new Intl.DateTimeFormat('ru-RU', { month: 'long', year: 'numeric' }).format(currentDate)}
                    </h3>

                    <button className="calendar-nav-btn" onClick={nextMonth} disabled={loadingMonth}>
                        &rarr;
                    </button>
                </div>

                <div className="calendar-weekdays">
                    {weekdays.map((day) => (
                        <div key={day}>{day}</div>
                    ))}
                </div>

                <div className="calendar-days">
                    {getCalendarDays().map((dateObj, idx) => (
                        <React.Fragment key={idx}>{renderDayCell(dateObj)}</React.Fragment>
                    ))}
                </div>
            </div>

            {/* Модалка: список событий + форма */}
            {isModalOpen && (
                <div className="calendar-modal">
                    <div className="calendar-modal-content">
                        <span
                            className="calendar-close"
                            onClick={() => {
                                setIsModalOpen(false);
                                setSelectedDayEvents([]);
                                setSelectedDate(null);
                            }}
                        >
                            &times;
                        </span>

                        <h3>События на дату</h3>
                        <p>Дата: {selectedDate}</p>

                        {/* Список существующих */}
                        {loadingDay ? (
                            <div className="loading-message">
                                <p>Загрузка событий дня...</p>
                            </div>
                        ) : selectedDayEvents.length === 0 ? (
                            <div className="no-data">
                                <p>На эту дату событий пока нет.</p>
                            </div>
                        ) : (
                            <>
                                <div className="calendar-events-list">
                                    {selectedDayEvents.map((e) => {
                                        const canDelete =
                                            isAdmin ||
                                            (currentEmployeeId && String(e.createdById) === String(currentEmployeeId));

                                        return (
                                            <div key={e.id} className="calendar-event-item">
                                                <div
                                                    style={{
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        gap: '12px',
                                                        alignItems: 'center',
                                                    }}
                                                >
                                                    <strong>{e.title}</strong>

                                                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                                                        <small style={{ color: '#7f8c8d' }}>{formatCreatedAt(e.createdAt)}</small>

                                                        {canDelete && (
                                                            <button
                                                                className="btn-danger"
                                                                onClick={() => openDeleteModal(e)}
                                                                disabled={saving}
                                                            >
                                                                Удалить
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>

                                                {e.description ? <div style={{ marginTop: 6 }}>{e.description}</div> : null}

                                                <small style={{ color: '#7f8c8d' }}>
                                                    Добавил: {e.createdByName || (e.createdById ? `Сотрудник #${e.createdById}` : '—')}
                                                </small>
                                            </div>
                                        );
                                    })}
                                </div>

                                <hr style={{ margin: '16px 0' }} />
                            </>
                        )}

                        {/* Форма добавления */}
                        <h3>Добавить событие</h3>

                        <input
                            type="text"
                            placeholder="Название события"
                            value={newEvent.title}
                            onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                            disabled={saving}
                        />

                        <textarea
                            placeholder="Описание (необязательно)"
                            value={newEvent.description}
                            onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                            disabled={saving}
                        />

                        <div className="calendar-modal-actions">
                            <button className="btn-primary" onClick={handleAddEvent} disabled={saving}>
                                {saving ? 'Сохранение...' : 'Сохранить'}
                            </button>
                            <button
                                className="btn-secondary"
                                onClick={() => setIsModalOpen(false)}
                                disabled={saving}
                            >
                                Отмена
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* === Модальное окно подтверждения удаления события === */}
            {isDeleteModalOpen && (
                <div className="modal">
                    <div className="modal-content">
                        <span
                            className="close"
                            onClick={() => {
                                setIsDeleteModalOpen(false);
                                setDeleteTarget(null);
                            }}
                        >
                            &times;
                        </span>
                        <h3>Подтвердите действие</h3>
                        <p>
                            Вы действительно хотите удалить событие
                            <strong> "{deleteTarget?.title}" </strong>
                            на <strong>{deleteTarget?.date}</strong>?
                            {deleteTarget?.createdByName && (
                                <><br />Событие создано: <strong>{deleteTarget.createdByName}</strong></>
                            )}
                        </p>
                        <div className="modal-actions">
                            <button
                                className="btn-primary"
                                onClick={confirmDelete}
                                disabled={deleting}
                                style={{ flex: 1 }}
                            >
                                {deleting ? 'Удаление...' : 'Удалить'}
                            </button>
                            <button
                                className="cancel-btn"
                                onClick={() => {
                                    setIsDeleteModalOpen(false);
                                    setDeleteTarget(null);
                                }}
                                disabled={deleting}
                                style={{ flex: 1 }}
                            >
                                Отмена
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}

export default Calendar;