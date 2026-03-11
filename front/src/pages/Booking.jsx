// src/pages/Booking.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import '../styles/style.css';
import { meetingRooms } from '../data/meetingRooms';
import { API_BASE_URL } from '../config';

function Booking() {
    const { user, token } = useAuth();

    const currentFullName = user?.fullName || user?.full_name || '';
    const currentUserId = user?.id || user?.userId || user?.employeeId || null;
    const isAdmin = (user?.role || '').toLowerCase() === 'admin';

    const [selectedRoom, setSelectedRoom] = useState(null);
    const [showBookingForm, setShowBookingForm] = useState(false);
    const [bookings, setBookings] = useState({}); // теперь храним реальные брони из бэка
    const [deleteModal, setDeleteModal] = useState(null);

    // Состояние для формы
    const [bookingData, setBookingData] = useState({
        date: '',
        startHour: '09',
        startMinute: '00',
        endHour: '10',
        endMinute: '00',
    });

    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        document.title = 'Бронирование переговорных | MeowMeow';
    }, []);

    // Загрузка бронирований для выбранной комнаты и даты из БД
    useEffect(() => {
        if (!selectedRoom || !bookingData.date) return;
        if (!token) return;

        const fetchBookings = async () => {
            try {
                const params = new URLSearchParams({
                    roomId: selectedRoom.id,   // как в старом варианте
                    date: bookingData.date,    // YYYY-MM-DD
                });

                const res = await fetch(
                    `${API_BASE_URL}/room-bookings?${params.toString()}`,
                    {
                        method: 'GET',
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                if (!res.ok) {
                    console.error('Ошибка при загрузке бронирований', res.status);
                    return;
                }

                const data = await res.json();
                // Нормализуем данные бронирования
                const normalizedData = data.map(booking => ({
  ...booking,
  bookedById:
    booking.bookedById ?? booking.createdById ?? booking.userId ?? booking.employeeId ?? null,
  bookedBy:
    booking.bookedBy ?? booking.createdBy ?? booking.userName ?? 'Неизвестный',
}));

                setBookings(prev => ({
                    ...prev,
                    [selectedRoom.id]: normalizedData,
                }));
            } catch (err) {
                console.error('Не удалось загрузить бронирования', err);
            }
        };

        fetchBookings();
    }, [selectedRoom, bookingData.date, token]);

    const handleRoomSelect = (room) => {
        setSelectedRoom(room);
        setShowBookingForm(true);
        setError('');
        setSuccess('');

        // Сбрасываем дату на завтрашний день
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const formattedDate = tomorrow.toISOString().split('T')[0];

        setBookingData({
            date: formattedDate,
            startHour: '09',
            startMinute: '00',
            endHour: '10',
            endMinute: '00',
        });
    };

    const handleCloseForm = () => {
        setShowBookingForm(false);
        setSelectedRoom(null);
        setError('');
        setSuccess('');
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setBookingData(prev => ({
            ...prev,
            [name]: value,
        }));
        setError('');
    };

    const validateBooking = () => {
        // Проверка даты
        if (!bookingData.date) {
            setError('Пожалуйста, выберите дату');
            return false;
        }

        // Дата не в прошлом
        const selectedDate = new Date(bookingData.date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (selectedDate < today) {
            setError('Нельзя бронировать комнату на прошедшую дату');
            return false;
        }

        // Время
        const startTime = `${bookingData.startHour}:${bookingData.startMinute}`;
        const endTime = `${bookingData.endHour}:${bookingData.endMinute}`;

        const startMinutes =
            parseInt(bookingData.startHour, 10) * 60 +
            parseInt(bookingData.startMinute, 10);
        const endMinutes =
            parseInt(bookingData.endHour, 10) * 60 +
            parseInt(bookingData.endMinute, 10);

        if (endMinutes <= startMinutes) {
            setError('Время окончания должно быть позже времени начала');
            return false;
        }

        // Минимум 30 минут
        if (endMinutes - startMinutes < 30) {
            setError('Минимальное время бронирования - 30 минут');
            return false;
        }

        // Максимум 10 часов
        if (endMinutes - startMinutes > 600) {
            setError('Максимальное время бронирования - 10 часов');
            return false;
        }

        // Рабочие часы 8:00–18:00
        if (startMinutes < 480 || endMinutes > 1080) {
            setError('Бронирование возможно только с 8:00 до 18:00');
            return false;
        }

        // Пересечение с существующими бронированиями
        const roomBookings = bookings[selectedRoom?.id] || [];
        const hasConflict = roomBookings.some((booking) => {
            if (booking.date !== bookingData.date) return false;

            const [esH, esM] = booking.startTime.split(':').map(Number);
            const [eeH, eeM] = booking.endTime.split(':').map(Number);

            const existingStartMinutes = esH * 60 + esM;
            const existingEndMinutes = eeH * 60 + eeM;

            // конфликт, если интервалы пересекаются
            return !(
                endMinutes <= existingStartMinutes ||
                startMinutes >= existingEndMinutes
            );
        });

        if (hasConflict) {
            setError('Выбранное время пересекается с уже существующей бронью');
            return false;
        }

        return true;
    };

    const openDeleteModal = (booking) => {
        setDeleteModal({
            booking: booking,
            title: 'Подтвердите удаление',
            message: `Вы уверены, что хотите удалить бронирование ${booking.startTime}-${booking.endTime} от ${booking.bookedBy}? Это действие нельзя отменить.`
        });
    };

    const handleDeleteBookingConfirm = async () => {
        if (!deleteModal || !deleteModal.booking || !token) return;

        try {
            const bookingId = deleteModal.booking.id;

            const res = await fetch(`${API_BASE_URL}/room-bookings/${bookingId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!res.ok) {
                const text = await res.text().catch(() => '');
                throw new Error(`Не удалось удалить бронирование (код ${res.status}) ${text}`);
            }

            // обновляем список броней в текущей комнате
            setBookings((prev) => {
                const roomId = selectedRoom?.id;
                if (!roomId) return prev;

                const nextRoomBookings = (prev[roomId] || []).filter(
                    (b) => String(b.id) !== String(bookingId)
                );

                return { ...prev, [roomId]: nextRoomBookings };
            });

            // Закрываем модалку
            setDeleteModal(null);

            // Показываем сообщение об успехе
            setSuccess('Бронирование удалено');
            setTimeout(() => setSuccess(''), 2000);

        } catch (e) {
            console.error(e);
            setError(e.message || 'Ошибка при удалении бронирования');
            setDeleteModal(null);
        }
    };

    const handleSubmitBooking = async (e) => {
        e.preventDefault();

        if (!validateBooking()) return;

        if (!selectedRoom) {
            setError('Пожалуйста, выберите переговорную комнату');
            return;
        }

        if (!token) {
            setError('Не удалось определить пользователя. Попробуйте войти заново.');
            return;
        }

        const payload = {
            roomId: selectedRoom.id,
            date: bookingData.date,
            startHour: bookingData.startHour,
            startMinute: bookingData.startMinute,
            endHour: bookingData.endHour,
            endMinute: bookingData.endMinute,
        };

        try {
            setError('');
            setSuccess('');

            const res = await fetch(`${API_BASE_URL}/room-bookings`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                let message = 'Ошибка при создании бронирования';

                try {
                    const text = await res.text();
                    console.error('Ошибка бронирования:', res.status, text);

                    let data;
                    try {
                        data = JSON.parse(text);
                    } catch {
                        data = null;
                    }

                    if (data && data.message) {
                        message = data.message;
                    } else if (data && data.error) {
                        message = data.error;
                    }
                } catch (parseErr) {
                    console.error('Не удалось разобрать ответ при ошибке бронирования', parseErr);
                }

                setError(message);
                return;
            }

            const data = await res.json();
            // Нормализуем ответ
            const newBooking = {
                id: data.id,
                date: data.date,
                startTime: data.startTime,
                endTime: data.endTime,
                bookedBy: data.bookedBy || currentFullName,
                bookedById: data.bookedById || currentUserId,
            };

            setBookings(prev => ({
                ...prev,
                [selectedRoom.id]: [...(prev[selectedRoom.id] || []), newBooking],
            }));

            setSuccess(
                `Комната успешно забронирована на ${newBooking.date} с ${newBooking.startTime} до ${newBooking.endTime}`
            );

            // Закрываем форму через 3 секунды
            setTimeout(() => {
                setSuccess('');
                handleCloseForm();
            }, 3000);
        } catch (err) {
            console.error(err);
            setError('Не удалось подключиться к серверу');
        }
    };

    // Получение забронированных слотов для выбранной комнаты
    const getRoomBookings = () => {
        if (!selectedRoom) return [];
        return bookings[selectedRoom.id] || [];
    };

    // Фильтрация бронирований по дате
    const getFilteredBookings = () => {
        const roomBookings = getRoomBookings();
        if (!bookingData.date) return roomBookings;
        return roomBookings.filter((booking) => booking.date === bookingData.date);
    };

    // Функция проверки, может ли пользователь удалить бронирование
    const canUserDeleteBooking = (booking) => {
        // Админ может удалять любые бронирования
        if (isAdmin) return true;

        // Проверяем по ID создателя (самый надежный способ)
        if (booking.bookedById && currentUserId) {
            return String(booking.bookedById) === String(currentUserId);
        }

        // Если ID нет, проверяем по имени (менее надежно)
        const normalizedBookingName = (booking.bookedBy || '').trim().toLowerCase();
        const normalizedUserName = currentFullName.trim().toLowerCase();

        return normalizedBookingName === normalizedUserName;
    };

    // Часы 8–18
    const hours = Array.from(
        { length: 11 },
        (_, i) => (i + 8).toString().padStart(2, '0')
    );

    // Минуты
    const minutes = ['00', '15', '30', '45'];

    return (
        <main className="dashboard-container">
            <section className="dashboard-hero">
                <h2>Бронирование переговорных комнат</h2>
                <p>Выберите переговорную комнату и удобное время для вашей встречи</p>
            </section>

            <div className="rooms-grid">
                {meetingRooms.map((room) => (
                    <div
                        key={room.id}
                        className={`room-card ${selectedRoom?.id === room.id ? 'selected' : ''}`}
                        onClick={() => handleRoomSelect(room)}
                    >
                        <div className="room-header">
                            <div>
                                <h3 className="room-name">{room.name}</h3>
                                <span className="room-capacity">{room.capacity}</span>
                            </div>
                        </div>

                        <p className="room-description">{room.description}</p>

                        <div className="room-features">
                            <h4 className="features-title">Оснащение:</h4>
                            <ul className="features-list">
                                {room.features.map((feature, index) => (
                                    <li key={index} className="feature-item">
                                        <span className="feature-icon">✓</span>
                                        {feature}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                ))}
            </div>

            {/* Модальное окно бронирования */}
            {showBookingForm && selectedRoom && (
                <div className="form-overlay">
                    <div className="form">
                        <div className="form-header">
                            <h2>Бронирование: {selectedRoom.name}</h2>
                            <button className="close-btn" onClick={handleCloseForm}>
                                ×
                            </button>
                        </div>

                        <form onSubmit={handleSubmitBooking}>
                            {/* Дата */}
                            <div className="form-section">
                                <h3>Дата бронирования</h3>
                                <input
                                    type="date"
                                    name="date"
                                    value={bookingData.date}
                                    onChange={handleInputChange}
                                    className="date-input"
                                    min={new Date().toISOString().split('T')[0]}
                                />
                            </div>

                            {/* Время начала */}
                            <div className="form-section">
                                <h3>Время начала</h3>
                                <div className="time-selection">
                                    <div className="time-group">
                                        <div>
                                            <label className="time-label">Часы</label>
                                            <select
                                                name="startHour"
                                                value={bookingData.startHour}
                                                onChange={handleInputChange}
                                                className="time-select"
                                            >
                                                {hours.map((hour) => (
                                                    <option key={hour} value={hour}>
                                                        {hour}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="time-label">Минуты</label>
                                            <select
                                                name="startMinute"
                                                value={bookingData.startMinute}
                                                onChange={handleInputChange}
                                                className="time-select"
                                            >
                                                {minutes.map((minute) => (
                                                    <option key={minute} value={minute}>
                                                        {minute}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Время окончания */}
                            <div className="form-section">
                                <h3>Время окончания</h3>
                                <div className="time-selection">
                                    <div className="time-group">
                                        <div>
                                            <label className="time-label">Часы</label>
                                            <select
                                                name="endHour"
                                                value={bookingData.endHour}
                                                onChange={handleInputChange}
                                                className="time-select"
                                            >
                                                {hours.map((hour) => (
                                                    <option key={hour} value={hour}>
                                                        {hour}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="time-label">Минуты</label>
                                            <select
                                                name="endMinute"
                                                value={bookingData.endMinute}
                                                onChange={handleInputChange}
                                                className="time-select"
                                            >
                                                {minutes.map((minute) => (
                                                    <option key={minute} value={minute}>
                                                        {minute}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Уже забронировано */}
                            <div className="form-section">
                                <h3>Уже забронировано</h3>
                                <div className="bookings-list">
                                    <h4 className="bookings-title">
                                        На выбранную дату ({bookingData.date || 'все даты'}):
                                    </h4>
                                    {getFilteredBookings().length > 0 ? (
                                        getFilteredBookings().map((booking) => {
                                            const canDelete = canUserDeleteBooking(booking);

                                            return (
                                                <div key={booking.id} className="booking-item" style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
                                                    <div>
                                                        <div className="booking-time">
                                                            {booking.startTime} - {booking.endTime}
                                                        </div>
                                                        <div className="booking-bookedby">
                                                            {booking.bookedBy}
                                                        </div>
                                                    </div>

                                                    {canDelete && (
                                                        <button
                                                            type="button"
                                                            className="btn-danger"
                                                            onClick={() => openDeleteModal(booking)}
                                                        >
                                                            Удалить
                                                        </button>
                                                    )}
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div className="no-bookings">
                                            На выбранную дату бронирований нет
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Сообщения */}
                            {error && <div className="error-message">{error}</div>}
                            {success && <div className="success-message">{success}</div>}

                            {/* Кнопки */}
                            <div className="form-actions">
                                <button
                                    type="button"
                                    className="cancel-btn"
                                    onClick={handleCloseForm}
                                >
                                    Отмена
                                </button>
                                <button type="submit" className="submit-btn-booking">
                                    Забронировать
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {deleteModal && (
                <div className="modal">
                    <div className="modal-content">
                        <span className="close" onClick={() => setDeleteModal(null)}>&times;</span>
                        <h3>{deleteModal.title}</h3>
                        <p>{deleteModal.message}</p>
                        <div className="modal-actions">
                            <button
                                className="btn-primary"
                                onClick={handleDeleteBookingConfirm}
                                style={{ flex: 1 }}
                            >
                                Удалить
                            </button>
                            <button
                                className="cancel-btn"
                                onClick={() => setDeleteModal(null)}
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

export default Booking;