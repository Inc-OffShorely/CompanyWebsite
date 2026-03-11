// src/pages/ServiceRequestWork.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import '../styles/style.css';
import { statuses, serviceTypes } from '../data/serviceRequestData';
import { API_BASE_URL } from '../config';

function ServiceRequestWork() {
    const { user } = useAuth();
    const [requests, setRequests] = useState([]);
    const [filteredRequests, setFilteredRequests] = useState([]);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [employeesFromApi, setEmployeesFromApi] = useState([]);
    const [deleteModal, setDeleteModal] = useState(null);

    // Фильтры
    const [filters, setFilters] = useState({
        status: '',
        serviceType: '',
        search: '',
        assignedToMe: false,
    });

    // Загрузка
    const [loading, setLoading] = useState(false);
    const [loadError, setLoadError] = useState('');

    // Токен авторизации
    const authToken = user?.token || user?.accessToken || user?.jwt || null;
    const currentEmployeeId = user?.id || user?.employeeId || user?.employee_id || null;

    // Маппинг статусов фронтенд ←→ бэкенд
    const mapBackendStatusToUi = (status) => {
        if (!status) return '';

        const s = status.toLowerCase();
        switch (s) {
            case 'accepted':
                return statuses.NEW.id;
            case 'in_progress':
                return statuses.IN_PROGRESS.id;
            case 'completed':
                return statuses.COMPLETED.id;
            case 'rejected':
                return statuses.CANCELLED?.id || 'canceled';
            default:
                return status;
        }
    };

    // ✅ Хелпер: достаёт поле даже если оно null (и поддерживает assigneeId/assignee_id)
    const pick = (obj, ...keys) => {
        if (!obj) return undefined;
        for (const k of keys) {
            if (Object.prototype.hasOwnProperty.call(obj, k)) return obj[k];
        }
        return undefined;
    };

    const mapUiStatusToBackend = (uiStatusId) => {
        if (!uiStatusId) return null;

        switch (uiStatusId) {
            case statuses.NEW.id:
                return 'accepted';
            case statuses.IN_PROGRESS.id:
                return 'in_progress';
            case statuses.COMPLETED.id:
                return 'completed';
            case statuses.CANCELLED?.id:
                return 'rejected';
            default:
                return null;
        }
    };

    // Загрузка заявок с бэкенда
    useEffect(() => {
        if (!authToken) return; // <-- ВАЖНО

        const fetchRequests = async () => {
            try {
                setLoading(true);
                setLoadError('');

                const headers = { Authorization: `Bearer ${authToken}` };

                const res = await fetch(`${API_BASE_URL}/service-requests`, {
                    method: 'GET',
                    credentials: 'include',
                    headers,
                });

                if (!res.ok) throw new Error(`Не удалось загрузить заявки (код ${res.status})`);

                const data = await res.json();

                const mapped = data.map(item => ({
                    id: item.id || item.requestId || item.request_id,
                    requestCode: item.requestCode || item.request_code,
                    customerName: item.customerName || item.customer_name || '',
                    phone: item.phone || item.clientPhone || item.client_phone || '',
                    email: item.email || item.clientEmail || item.client_email || '',
                    serviceType: item.serviceTypeId || item.service_type_id || null,
                    serviceName: item.serviceName || item.service_name || '',
                    description: item.comment || '',
                    size: item.size || null,
                    status: mapBackendStatusToUi(item.status),
                    assignedTo: item.assigneeId || item.assignee_id || null,
                    assigneeName: item.assigneeName || item.assignee_name || null,
                    createdAt: item.createdAt || item.created_at || null,
                    completedAt: item.completedAt || item.completed_at || null,
                    comments: [],
                }));

                setRequests(mapped);
            } catch (err) {
                console.error(err);
                setLoadError(err.message || 'Ошибка при загрузке заявок');
            } finally {
                setLoading(false);
            }
        };

        fetchRequests();
    }, [authToken]);

    // Загрузка сотрудников с бэкенда
    useEffect(() => {
        if (!authToken) return; // <-- ВАЖНО

        const fetchEmployees = async () => {
            try {
                const headers = { Authorization: `Bearer ${authToken}` };

                const res = await fetch(`${API_BASE_URL}/employees`, {
                    method: 'GET',
                    credentials: 'include',
                    headers,
                });

                if (!res.ok) return;

                const data = await res.json();
                setEmployeesFromApi((Array.isArray(data) ? data : [])
                    .filter(Boolean)
                    .map(e => ({
                        id: e.id || e.employeeId || e.employee_id,
                        name: e.name || e.fullName || e.full_name || 'Без имени',
                        role: e.role || 'employee',
                        department: e.department || '',
                        email: e.email || '',
                    }))
                    .filter(emp => emp.id != null)
                );
            } catch (err) {
                console.error('Ошибка при загрузке сотрудников:', err);
            }
        };

        fetchEmployees();
    }, [authToken]);

    // Фильтрация заявок
    const applyFilters = () => {
        let filtered = [...requests];

        if (filters.status) {
            filtered = filtered.filter(req => req.status === filters.status);
        }
        if (filters.serviceType) {
            filtered = filtered.filter(req => req.serviceType === Number(filters.serviceType));
        }
        if (filters.assignedToMe && currentEmployeeId) {
            filtered = filtered.filter(req => String(req.assignedTo) === String(currentEmployeeId));
        }
        if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            filtered = filtered.filter(req =>
                (req.requestCode || '').toLowerCase().includes(searchLower) ||
                (req.customerName || '').toLowerCase().includes(searchLower) ||
                (req.serviceName || '').toLowerCase().includes(searchLower)
            );
        }

        setFilteredRequests(filtered);
    };

    useEffect(() => {
        document.title = 'Заявки на услуги | MeowMeow';
        applyFilters();
    }, [filters, requests]);

    const handleFilterChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFilters(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const resetFilters = () => {
        setFilters({
            status: '',
            serviceType: '',
            search: '',
            assignedToMe: false,
        });
    };

    // Функция "Взять в работу" - УБРАН ALERT
    const handleTakeRequest = async (requestId) => {
        if (!user || user.role !== 'employee') {
            alert('Ошибка: Эта функция доступна только сотрудникам');
            return;
        }

        if (!currentEmployeeId) {
            alert('Ошибка: Ваш профиль сотрудника не найден');
            return;
        }

        // Оптимистичное обновление UI
        setRequests(prev => prev.map(req =>
            req.id === requestId
                ? {
                    ...req,
                    status: statuses.IN_PROGRESS.id,
                    assignedTo: currentEmployeeId,
                    assigneeName: user.fullName || user.name || req.assigneeName,
                    comments: [
                        ...req.comments,
                        {
                            id: `comment-${Date.now()}`,
                            author: user.name,
                            text: 'Взял заявку в работу',
                            date: new Date().toISOString()
                        }
                    ]
                }
                : req
        ));

        // Отправка на бэкенд
        try {
            const headers = {
                'Content-Type': 'application/json',
                ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
            };

            const res = await fetch(`${API_BASE_URL}/service-requests/${requestId}/take`, {
                method: 'PUT',
                credentials: 'include',
                headers,
            });

            if (!res.ok) {
                console.error('Ошибка при взятии заявки:', res.status);
                // В реальном приложении здесь нужно откатить изменения
            }
        } catch (err) {
            console.error('Ошибка при запросе взятия заявки:', err);
        }
        // УБРАН ALERT
    };

    // Завершение заявки - УБРАН ALERT
    const handleCompleteRequest = async (requestId) => {
        if (!user || user.role !== 'employee') return;

        // Оптимистичное обновление UI
        setRequests(prev => prev.map(req =>
            req.id === requestId
                ? {
                    ...req,
                    status: statuses.COMPLETED.id,
                    completedAt: new Date().toISOString(),
                    comments: [
                        ...req.comments,
                        {
                            id: `comment-${Date.now()}`,
                            author: user.name,
                            text: 'Завершил выполнение заявки',
                            date: new Date().toISOString()
                        }
                    ]
                }
                : req
        ));

        // Отправка на бэкенд
        try {
            const headers = {
                'Content-Type': 'application/json',
                ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
            };

            const res = await fetch(`${API_BASE_URL}/service-requests/${requestId}/complete`, {
                method: 'PUT',
                credentials: 'include',
                headers,
            });

            if (!res.ok) {
                console.error('Ошибка при завершении заявки:', res.status);
            }
        } catch (err) {
            console.error('Ошибка при запросе завершения заявки:', err);
        }
        // УБРАН ALERT
    };

    // Редактирование заявки - УБРАНЫ ALERT
    const handleEditClick = (request) => {
        const fresh = requests.find(r => String(r.id) === String(request.id)) || request;

        setSelectedRequest({
            ...fresh,
            serviceType: String(fresh.serviceType || '')
        });
        setShowEditModal(true);
    };

    // ✅ Сохранение изменений (редактирование)
    const saveEditedRequest = async () => {
        if (!selectedRequest) return;

        const newAssignee =
            selectedRequest.assignedTo === '' || selectedRequest.assignedTo == null
                ? null
                : Number(selectedRequest.assignedTo);

        // статус: если есть исполнитель -> in_progress, иначе accepted
        const computedStatus = newAssignee ? 'in_progress' : 'accepted';

        const payload = {
            customerName: selectedRequest.customerName?.trim() || null,
            phone: selectedRequest.phone?.trim() || null,
            email: selectedRequest.email?.trim() || null,
            serviceTypeId: selectedRequest.serviceType ? Number(selectedRequest.serviceType) : null,
            assigneeId: newAssignee,
            assignee_id: newAssignee, // ✅ на случай если бэк ждёт snake_case
            status: computedStatus,           // автоматически меняется от назначения
            comment: selectedRequest.description?.trim() || null,
            size: selectedRequest.size?.trim() || null,
        };

        try {
            const res = await fetch(`${API_BASE_URL}/service-requests/${selectedRequest.id}`, {
                method: 'PUT',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
                },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const text = await res.text();
                console.error('Ошибка обновления заявки:', res.status, text);
                alert('Ошибка при сохранении изменений');
                return;
            }

            const updated = await res.json();

            const updatedAssigneeId = pick(updated, 'assigneeId', 'assignee_id');
            const updatedAssigneeName = pick(updated, 'assigneeName', 'assignee_name');

            setRequests(prev =>
                prev.map(req =>
                    req.id === selectedRequest.id
                        ? {
                            ...req,
                            customerName: updated.customerName ?? req.customerName,
                            phone: updated.phone ?? req.phone,
                            email: updated.email ?? req.email,
                            serviceType: (pick(updated, 'serviceTypeId', 'service_type_id') ?? req.serviceType),
                            serviceName: updated.serviceName ?? updated.service_name ?? req.serviceName,
                            status: mapBackendStatusToUi(updated.status ?? req.status),

                            // ✅ КЛЮЧЕВОЕ: теперь null не "съедается" и поддерживается assignee_id
                            assignedTo: (updatedAssigneeId !== undefined ? updatedAssigneeId : req.assignedTo),
                            assigneeName:
                                (updatedAssigneeId === null)
                                    ? null
                                    : (updatedAssigneeName !== undefined ? updatedAssigneeName : req.assigneeName),

                            description: updated.comment ?? req.description,
                            size: updated.size ?? req.size,
                        }
                        : req
                )
            );
            setShowEditModal(false);
        } catch (err) {
            console.error('Ошибка сохранения изменений:', err);
            alert('Ошибка при сохранении изменений');
        }
    };

    // Назначение сотрудника (для модератора/админа) - УБРАН ALERT
    const handleAssignClick = (request) => {
        setSelectedRequest(request);
        setShowAssignModal(true);
    };

    const handleEmployeeSelect = (employeeId) => {
        setSelectedEmployee(employeeId);
    };

    const confirmAssignment = async () => {
        if (!selectedRequest || !selectedEmployee) return;

        const employee = employeesFromApi.find(emp => String(emp.id) === String(selectedEmployee));

        // Оптимистичное обновление UI
        setRequests(prev =>
            prev.map(req =>
                req.id === selectedRequest.id
                    ? {
                        ...req,
                        status: statuses.IN_PROGRESS.id, // ✅ В РАБОТЕ
                        assignedTo: selectedEmployee,
                        assigneeName: employee?.name || req.assigneeName,
                        comments: [
                            ...req.comments,
                            {
                                id: `comment-${Date.now()}`,
                                author: user.name,
                                text: `Назначил на ${employee?.name || selectedEmployee}`,
                                date: new Date().toISOString(),
                            },
                        ],
                    }
                    : req
            )
        );

        // Отправка на бэкенд
        try {
            const payload = { assigneeId: Number(selectedEmployee), status: 'in_progress' };

            const res = await fetch(`${API_BASE_URL}/service-requests/${selectedRequest.id}`, {
                method: 'PUT',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
                },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const text = await res.text();
                console.error('Ошибка назначения сотрудника:', res.status, text);
                return;
            }

            const updated = await res.json();

            setRequests(prev =>
                prev.map(req =>
                    req.id === selectedRequest.id
                        ? {
                            ...req,
                            status: mapBackendStatusToUi(updated.status ?? req.status),
                            assignedTo:
                                updated.assigneeId !== undefined
                                    ? updated.assigneeId
                                    : req.assignedTo,

                            assigneeName:
                                updated.assigneeId === null
                                    ? null
                                    : (updated.assigneeName !== undefined
                                        ? updated.assigneeName
                                        : req.assigneeName),
                        }
                        : req
                )
            );
        } catch (err) {
            console.error('Ошибка при запросе назначения:', err);
        }

        setShowAssignModal(false);
        setSelectedRequest(null);
        setSelectedEmployee(null);
        // УБРАН ALERT
    };

    // Просмотр заявки
    const handleViewClick = (request) => {
        const fresh = requests.find(r => String(r.id) === String(request.id)) || request;
        setSelectedRequest(fresh);
        setShowViewModal(true);
    };


    // Вспомогательные функции
    const getEmployeeName = (req) => {
        // 1) если исполнителя нет — сразу "Не назначен"
        if (!req?.assignedTo) return 'Не назначен';

        // 2) если есть имя от бэка — используем
        if (req?.assigneeName) return req.assigneeName;

        // 3) ищем в списке сотрудников
        const employee = employeesFromApi.find(emp => String(emp.id) === String(req.assignedTo));
        if (employee?.name) return employee.name;

        return `Сотрудник #${req.assignedTo}`;
    };

    const getStatusColor = (status) => {
        return Object.values(statuses).find(s => s.id === status)?.color || '#95a5a6';
    };
    // Удаление заявки
    const openDeleteModal = (request) => {
        setDeleteModal({
            request: request,
            title: 'Подтвердите удаление',
            message: `Вы уверены, что хотите удалить заявку ${request.requestCode} (${request.customerName})? Это действие нельзя отменить.`
        });
    };

    const handleDeleteRequestConfirm = async () => {
        if (!deleteModal || !deleteModal.request || !authToken) return;

        try {
            const requestId = deleteModal.request.id;
            const headers = {
                ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
            };

            const res = await fetch(`${API_BASE_URL}/service-requests/${requestId}`, {
                method: 'DELETE',
                credentials: 'include',
                headers,
            });

            if (!res.ok) {
                const text = await res.text();
                console.error('Ошибка удаления заявки:', res.status, text);
                setLoadError('Не удалось удалить заявку');
                setDeleteModal(null);
                return;
            }

            // Удаляем из локального состояния
            setRequests(prev => prev.filter(req => req.id !== requestId));
            setDeleteModal(null);

            // Показываем сообщение об успехе
            setLoadError(`Заявка ${deleteModal.request.requestCode} успешно удалена`);

            // Очищаем сообщение через 3 секунды
            setTimeout(() => {
                setLoadError('');
            }, 3000);

        } catch (err) {
            console.error('Ошибка при запросе удаления:', err);
            setLoadError('Ошибка при удалении заявки');
            setDeleteModal(null);
        }
    };

    // Проверка прав
    const isEmployee = user?.role === 'employee';
    const isModerator = user?.role === 'moderator';
    const isAdmin = user?.role === 'admin';
    const isManager = isModerator || isAdmin;

    const canAssign = isManager;
    const canEdit = isManager;
    const canDelete = isManager;
    const canViewAll = isManager;

    return (
        <main className="dashboard-container">
            <section className="dashboard-hero">
                <h2>Работа с заявками на услуги</h2>
                <p>Управление заявками клиентов на услуги компании</p>
            </section>

            {/* Загрузка и ошибки */}
            {loading && (
                <div className="loading-message">
                    <p>Загрузка заявок...</p>
                </div>
            )}

            {loadError && requests.length === 0 && (
                <div className="error-message">
                    <p>Ошибка: {loadError}</p>
                </div>
            )}

            {/* Фильтры */}
            <div className="filters-section">
                <div className="filters-grid">
                    <div className="filter-group">
                        <label className="filter-label">Статус</label>
                        <select
                            name="status"
                            value={filters.status}
                            onChange={handleFilterChange}
                            className="filter-select"
                            disabled={loading}
                        >
                            <option value="">Все статусы</option>
                            {Object.values(statuses).map(status => (
                                <option key={status.id} value={status.id}>{status.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="filter-group">
                        <label className="filter-label">Тип услуги</label>
                        <select
                            name="serviceType"
                            value={filters.serviceType}
                            onChange={handleFilterChange}
                            className="filter-select"
                            disabled={loading}
                        >
                            <option value="">Все услуги</option>
                            {serviceTypes.map(type => (
                                <option key={type.id} value={String(type.id)}>{type.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="filter-group">
                        <label className="filter-label">Поиск</label>
                        <input
                            type="text"
                            name="search"
                            value={filters.search}
                            onChange={handleFilterChange}
                            placeholder="По номеру, клиенту или услуге"
                            className="filter-input"
                            disabled={loading}
                        />
                    </div>
                </div>

                <div className="search-actions">
                    <button className="search-btn" onClick={applyFilters} disabled={loading}>
                        Применить фильтры
                    </button>
                    {currentEmployeeId && (
                        <button
                            type="button"
                            className={`in-process-btn ${filters.assignedToMe ? 'clicked' : ''}`}
                            onClick={() => setFilters(prev => ({
                                ...prev,
                                assignedToMe: !prev.assignedToMe
                            }))}
                            disabled={loading}
                        >
                            Мои рабочие заявки
                        </button>
                    )}
                    <button className="reset-btn" onClick={resetFilters} disabled={loading}>
                        Сбросить фильтры
                    </button>
                </div>
            </div>

            {/* Таблица заявок */}
            <div className="requests-table-container">
                {filteredRequests.length === 0 ? (
                    <div className="no-data">
                        <p>{loading ? 'Загрузка...' : 'Заявки по выбранным фильтрам не найдены'}</p>
                    </div>
                ) : (

                    <table className="requests-table">
                        <thead>
                            <tr>
                                <th>№ заявки</th>
                                <th>Клиент</th>
                                <th>Услуга</th>
                                <th>Статус</th>
                                <th>Исполнитель</th>
                                <th>Дата создания</th>
                                <th>Действия</th>
                                <th>Комментарии</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredRequests.map(request => {
                                const isAssignedToMe = currentEmployeeId &&
                                    String(request.assignedTo) === String(currentEmployeeId);

                                const canTake = isEmployee &&
                                    !request.assignedTo &&
                                    request.status === statuses.NEW.id;

                                const canComplete = isEmployee &&
                                    isAssignedToMe &&
                                    request.status === statuses.IN_PROGRESS.id;

                                return (
                                    <tr key={request.id}>
                                        <td><strong>{request.requestCode}</strong></td>
                                        <td>
                                            <div>{request.customerName}</div>
                                            <small style={{ color: '#7f8c8d' }}>{request.phone}</small>
                                        </td>
                                        <td>{request.serviceName}</td>
                                        <td>
                                            <span className={`status-badge status-${request.status}`}>
                                                {Object.values(statuses).find(s => s.id === request.status)?.name || request.status}
                                            </span>
                                        </td>
                                        <td>{getEmployeeName(request)}</td>
                                        <td>
                                            {request.createdAt ? new Date(request.createdAt).toLocaleDateString('ru-RU') : '—'}
                                            <br />
                                            <small style={{ color: '#7f8c8d' }}>
                                                {request.createdAt ? new Date(request.createdAt).toLocaleTimeString('ru-RU', {
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                }) : ''}
                                            </small>
                                        </td>
                                        <td className="actions-column">
                                            <div className="action-buttons">
                                                {/* Просмотр */}
                                                <button
                                                    className="action-btn view-btn"
                                                    onClick={() => handleViewClick(request)}
                                                    disabled={loading}
                                                >
                                                    Просмотр
                                                </button>

                                                {/* Взять в работу */}
                                                {canTake && (
                                                    <button
                                                        className="action-btn take-btn"
                                                        onClick={() => handleTakeRequest(request.id)}
                                                        disabled={loading}
                                                    >
                                                        Взять в работу
                                                    </button>
                                                )}

                                                {/* Завершить */}
                                                {canComplete && (
                                                    <button
                                                        className="action-btn complete-btn"
                                                        onClick={() => handleCompleteRequest(request.id)}
                                                        disabled={loading}
                                                    >
                                                        Завершить
                                                    </button>
                                                )}

                                                {/* Назначить */}
                                                {canAssign && request.status === statuses.NEW.id && (
                                                    <button
                                                        className="action-btn assign-btn"
                                                        onClick={() => handleAssignClick(request)}
                                                        disabled={loading}
                                                    >
                                                        Назначить
                                                    </button>
                                                )}

                                                {/* Редактировать */}
                                                {canEdit && (
                                                    <button
                                                        className="action-btn edit-btn"
                                                        onClick={() => handleEditClick(request)}
                                                        disabled={loading}
                                                    >
                                                        Редактировать
                                                    </button>
                                                )}

                                                {/* Удалить */}
                                                {canDelete && (
                                                    <button
                                                        className="action-btn delete-btn"
                                                        onClick={() => openDeleteModal(request)} // ИЗМЕНЕНО: заменили на openDeleteModal
                                                        disabled={loading}
                                                    >
                                                        Удалить
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                        <td>
                                            {request.comments && request.comments.length > 0 && (
                                                <div className="comments-section">
                                                    {request.comments.slice(-2).map(comment => (
                                                        <div key={comment.id} className="comment-item">
                                                            <span className="comment-author">{comment.author}</span>
                                                            <span className="comment-date">
                                                                {new Date(comment.date).toLocaleDateString('ru-RU')}
                                                            </span>
                                                            <div className="comment-text">{comment.text}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Модальное окно назначения сотрудника */}
            {showAssignModal && selectedRequest && (
                <div className="form-overlay">
                    <div className="form">
                        <div className="form-header">
                            <h2>Назначить исполнителя</h2>
                            <button className="close-btn" onClick={() => setShowAssignModal(false)}>×</button>
                        </div>

                        <p>Заявка: <strong>{selectedRequest.requestCode}</strong></p>
                        <p>Услуга: <strong>{selectedRequest.serviceName}</strong></p>

                        <h3>Выберите сотрудника:</h3>
                        <div className="employee-list">
                            {employeesFromApi
                                .filter(emp => emp && emp.id && emp.role === 'employee')
                                .map(employee => (
                                    <div key={employee.id}
                                        className={`employee-item ${selectedEmployee === employee.id ? 'selected' : ''}`}
                                        onClick={() => handleEmployeeSelect(employee.id)}
                                    >
                                        <div className="employee-name">{employee.name}</div>
                                        <div className="employee-details">
                                            {employee.department && `Отдел: ${employee.department}`}
                                        </div>
                                    </div>
                                ))}
                        </div>

                        <div className="modal-actions">
                            <button className="reset-btn" onClick={() => setShowAssignModal(false)}>
                                Отмена
                            </button>
                            <button
                                className="confirm-btn"
                                onClick={confirmAssignment}
                                disabled={!selectedEmployee}
                            >
                                Назначить
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Модальное окно редактирования заявки */}
            {showEditModal && selectedRequest && (
                <div className="form-overlay">
                    <div className="form">
                        <div className="form-header">
                            <h2>Редактировать заявку</h2>
                            <button className="close-btn" onClick={() => setShowEditModal(false)}>×</button>
                        </div>

                        <form className="ticket-form" onSubmit={(e) => { e.preventDefault(); saveEditedRequest(); }}>
                            <div className="form-row">
                                <div className="form-group form-group-edit">
                                    <label className="form-label">Имя клиента</label>
                                    <input
                                        type="text"
                                        value={selectedRequest.customerName || ''}
                                        onChange={(e) => setSelectedRequest({
                                            ...selectedRequest,
                                            customerName: e.target.value
                                        })}
                                        required
                                    />
                                </div>
                                <div className="form-group form-group-edit">
                                    <label className="form-label">Телефон</label>
                                    <input
                                        type="tel"
                                        value={selectedRequest.phone || ''}
                                        onChange={(e) => setSelectedRequest({
                                            ...selectedRequest,
                                            phone: e.target.value
                                        })}
                                    />
                                </div>
                            </div>

                            <div className="form-group form-group-edit">
                                <label className="form-label">Email</label>
                                <input
                                    type="email"
                                    value={selectedRequest.email || ''}
                                    onChange={(e) => setSelectedRequest({
                                        ...selectedRequest,
                                        email: e.target.value
                                    })}
                                />
                            </div>

                            <div className="form-group form-group-edit">
                                <label className="form-label">Исполнитель</label>
                                <select
                                    value={selectedRequest.assignedTo || ''}
                                    onChange={(e) => setSelectedRequest({
                                        ...selectedRequest,
                                        assignedTo: e.target.value
                                    })}
                                    className="form-select-type"
                                >
                                    <option value="">Не назначен</option>
                                    {employeesFromApi
                                        .filter(emp => emp && emp.id && emp.role === 'employee')
                                        .map(employee => (
                                            <option key={employee.id} value={employee.id}>
                                                {employee.name} {employee.department && `(${employee.department})`}
                                            </option>
                                        ))}
                                </select>
                            </div>

                            <div className="form-row">
                                <div className="form-group form-group-edit">
                                    <label className="form-label">Статус</label>
                                    <select
                                        value={selectedRequest.status}
                                        onChange={(e) => setSelectedRequest({
                                            ...selectedRequest,
                                            status: e.target.value
                                        })}
                                        className="form-select-type"
                                        required
                                    >
                                        {Object.values(statuses).map(status => (
                                            <option key={status.id} value={status.id}>
                                                {status.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group form-group-edit">
                                    <label className="form-label">Тип услуги</label>
                                    <select
                                        value={selectedRequest.serviceType || ''}
                                        onChange={(e) => setSelectedRequest({
                                            ...selectedRequest,
                                            serviceType: e.target.value
                                        })}
                                        className="form-select-type"
                                        required
                                    >
                                        <option value="">Выберите тип</option>
                                        {serviceTypes.map(type => (
                                            <option key={type.id} value={String(type.id)}>
                                                {type.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="form-group form-group-edit">
                                <label className="form-label">Описание</label>
                                <textarea
                                    value={selectedRequest.description || ''}
                                    onChange={(e) => setSelectedRequest({
                                        ...selectedRequest,
                                        description: e.target.value
                                    })}
                                    className="form-textarea-description"
                                    placeholder="Дополнительные детали..."
                                />
                            </div>

                            <div className="form-group form-group-edit">
                                <label className="form-label">Размер</label>
                                <input
                                    type="text"
                                    value={selectedRequest.size || ''}
                                    onChange={(e) => setSelectedRequest({
                                        ...selectedRequest,
                                        size: e.target.value
                                    })}
                                    placeholder="Размер (если применимо)"
                                />
                            </div>

                            <div className="form-actions">
                                <button
                                    type="button"
                                    className="reset-btn"
                                    onClick={() => setShowEditModal(false)}
                                >
                                    Отмена
                                </button>
                                <button
                                    type="submit"
                                    className="confirm-btn"
                                >
                                    Сохранить изменения
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Модальное окно просмотра заявки */}
            {showViewModal && selectedRequest && (
                <div className="form-overlay">
                    <div className="form">
                        <div className="form-header">
                            <h2>Просмотр заявки</h2>
                            <button className="close-btn" onClick={() => setShowViewModal(false)}>×</button>
                        </div>

                        <div className="view-request-details">
                            <div className="detail-row">
                                <strong>Номер заявки:</strong>
                                <span>{selectedRequest.requestCode}</span>
                            </div>
                            <div className="detail-row">
                                <strong>Клиент:</strong>
                                <span>{selectedRequest.customerName}</span>
                            </div>
                            <div className="detail-row">
                                <strong>Телефон:</strong>
                                <span>{selectedRequest.phone || '—'}</span>
                            </div>
                            <div className="detail-row">
                                <strong>Email:</strong>
                                <span>{selectedRequest.email || '—'}</span>
                            </div>
                            <div className="detail-row">
                                <strong>Тип услуги:</strong>
                                <span>
                                    {serviceTypes.find(t => t.id === selectedRequest.serviceType)?.name || '—'}
                                </span>
                            </div>
                            <div className="detail-row">
                                <strong>Статус:</strong>
                                <span>
                                    {Object.values(statuses).find(s => s.id === selectedRequest.status)?.name || selectedRequest.status}
                                </span>
                            </div>
                            <div className="detail-row">
                                <strong>Исполнитель:</strong>
                                <span>{getEmployeeName(selectedRequest)}</span>
                            </div>
                            <div className="detail-row">
                                <strong>Описание:</strong>
                                <span>{selectedRequest.description || '—'}</span>
                            </div>
                            <div className="detail-row">
                                <strong>Размер:</strong>
                                <span>{selectedRequest.size || '—'}</span>
                            </div>
                            <div className="detail-row">
                                <strong>Дата создания:</strong>
                                <span>
                                    {selectedRequest.createdAt ?
                                        new Date(selectedRequest.createdAt).toLocaleString('ru-RU') :
                                        '—'
                                    }
                                </span>
                            </div>
                            <div className="detail-row">
                                <strong>Дата завершения:</strong>
                                <span>
                                    {selectedRequest.completedAt ?
                                        new Date(selectedRequest.completedAt).toLocaleString('ru-RU') :
                                        '—'
                                    }
                                </span>
                            </div>
                        </div>

                        <div className="modal-actions">
                            <button
                                className="confirm-btn"
                                onClick={() => setShowViewModal(false)}
                            >
                                Закрыть
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Статистика */}
            <div className="stats-section">
                <div className="stat-card">
                    <div className="stat-title">Новых заявок</div>
                    <div className="stat-value">
                        {requests.filter(req => req.status === statuses.NEW.id).length}
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-title">В работе</div>
                    <div className="stat-value">
                        {requests.filter(req => req.status === statuses.IN_PROGRESS.id).length}
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-title">Завершено</div>
                    <div className="stat-value">
                        {requests.filter(req => req.status === statuses.COMPLETED.id).length}
                    </div>
                </div>
            </div>
            {/* Модальное окно удаления */}
            {deleteModal && (
                <div className="modal">
                    <div className="modal-content">
                        <span className="close" onClick={() => setDeleteModal(null)}>&times;</span>
                        <h3>{deleteModal.title}</h3>
                        <p>{deleteModal.message}</p>
                        <div className="modal-actions">
                            <button
                                className="btn-primary"
                                onClick={handleDeleteRequestConfirm}
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

export default ServiceRequestWork;