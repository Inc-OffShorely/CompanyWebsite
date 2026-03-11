// src/pages/TechSupport.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import '../styles/style.css';
import {
    techCategories,
    statuses,
} from '../data/techSupportData';
import { API_BASE_URL } from '../config';

function TechSupport() {
    const { user, token: authToken, loading: authLoading } = useAuth();
    const effectiveToken = authToken || user?.token || user?.accessToken || user?.jwt || null;

    const [tickets, setTickets] = useState([]);
    const [filteredTickets, setFilteredTickets] = useState([]);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [showTicketModal, setShowTicketModal] = useState(false);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showResolveModal, setShowResolveModal] = useState(false); // <-- НОВАЯ МОДАЛКА
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [selectedSpecialist, setSelectedSpecialist] = useState(null);
    const [newComment, setNewComment] = useState('');
    const [techSpecialists, setTechSpecialists] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [deleteModal, setDeleteModal] = useState(null);

    // НОВОЕ СОСТОЯНИЕ ДЛЯ РЕШЕНИЯ ЗАЯВКИ
    const [resolveSolution, setResolveSolution] = useState('');

    // ID текущего сотрудника
    const currentEmployeeId = user?.employeeId || user?.employee_id || user?.id || null;

    // Форма создания заявки
    const [ticketForm, setTicketForm] = useState({
        title: '',
        category: '',
        description: ''
    });

    // Форма редактирования заявки
    const [editForm, setEditForm] = useState({
        title: '',
        category: '',
        description: '',
        status: '',
        assigneeId: null
    });

    // Фильтры
    const [filters, setFilters] = useState({
        status: '',
        category: '',
        createdByMe: false,
        assignedToMe: false,
        search: '',
    });

    // ===== Преобразование данных из бэкенда =====
    const mapTicketFromDto = (t) => {
        // ... (существующий код mapTicketFromDto остается без изменений)
        const rawComment = t.comment || t.comment_text || '';

        let comments = [];
        if (rawComment && typeof rawComment === 'string') {
            comments = rawComment
                .split(/\n\s*\n/)
                .filter(block => block.trim().length > 0)
                .map((block, idx) => {
                    const match = block.match(/^\[(.+?)\]\s+([^:]+):\s*(.*)$/);
                    if (match) {
                        const [, ts, author, text] = match;
                        return {
                            id: `${t.id || t.ticket_id || 'ticket'}-${idx}`,
                            author: author.trim(),
                            authorRole: 'Сотрудник',
                            createdAt: ts,
                            text,
                        };
                    }
                    return {
                        id: `${t.id || t.ticket_id || 'ticket'}-${idx}`,
                        author: 'Комментарий',
                        authorRole: '',
                        createdAt: null,
                        text: block,
                    };
                });
        }

        const creatorIdRaw =
            t.createdById ??
            t.created_by_id ??
            t.creatorId ??
            t.creator_id ??
            t.employeeId ??
            t.employee_id ??
            t.createdBy?.id ??
            t.creator?.id ??
            null;

        const createdById =
            creatorIdRaw === 0 || creatorIdRaw === '0'
                ? null
                : creatorIdRaw != null
                    ? Number(creatorIdRaw)
                    : null;

        const createdByName =
            t.createdBy ||
            t.creatorName ||
            t.employeeFullName ||
            t.employee_full_name ||
            t.fullName ||
            t.full_name ||
            'Неизвестный сотрудник';

        const assigneeIdRaw =
            t.assigneeId ??
            t.assignee_id ??
            t.assignee?.id ??
            t.assignee?.employeeId ??
            t.assignee?.employee_id ??
            null;

        const assigneeId =
            assigneeIdRaw === 0 || assigneeIdRaw === '0'
                ? null
                : assigneeIdRaw != null
                    ? Number(assigneeIdRaw)
                    : null;

        const assigneeName =
            t.assigneeFullName ??
            t.assignee_full_name ??
            t.assigneeName ??
            t.assignee_name ??
            t.assignee?.fullName ??
            t.assignee?.full_name ??
            t.assignee?.name ??
            null;

        const solutionValue =
            t.solution || t.solutionText || t.resolution || t.resolutionText || null;

        return {
            id: t.id || t.ticketId || t.ticket_id,
            ticketNumber:
                t.ticketNumber || `ТП-${String(t.id || t.ticket_id || 0).padStart(3, '0')}`,
            title: t.subject || t.title || '',
            description: t.description || '',
            category: t.category || 'other',
            status: t.status || 'new',
            createdBy: createdByName,
            createdById,
            createdByDepartment:
                t.createdByDepartment || t.creatorDepartment || t.departmentName || 'Не указан',
            createdAt: t.createdAt || t.created_at || null,
            assignedTo: assigneeId,
            assignedToName: assigneeName,
            comments,
            solution: solutionValue,
            resolvedAt: t.resolvedAt || t.closedAt || t.closed_at || null,
        };
    };

    // ===== Загрузка заявок =====
    const loadTickets = useCallback(async () => {
        // ... (существующий код loadTickets без изменений)
        try {
            setLoading(true);
            setError(null);

            const headers = effectiveToken
                ? { Authorization: `Bearer ${effectiveToken}` }
                : {};

            const res = await fetch(`${API_BASE_URL}/support-tickets`, {
                method: 'GET',
                headers,
                credentials: 'include',
            });

            if (!res.ok) {
                console.error('Ошибка загрузки заявок:', res.status);
                setError('Не удалось загрузить заявки');
                return;
            }

            const data = await res.json();
            const mapped = data.map(mapTicketFromDto);

            setTickets(mapped);
            setFilteredTickets(mapped);
        } catch (e) {
            console.error('Ошибка при загрузке заявок:', e);
            setError('Ошибка подключения к серверу');
        } finally {
            setLoading(false);
        }
    }, [effectiveToken]);

    // ===== Загрузка данных сотрудников техподдержки =====
    const loadEmployees = useCallback(async () => {
        // ... (существующий код loadEmployees без изменений)
        try {
            const headers = effectiveToken ? { Authorization: `Bearer ${effectiveToken}` } : {};

            const res = await fetch(`${API_BASE_URL}/employees/support`, {
                method: 'GET',
                headers,
                credentials: 'include'
            });

            if (!res.ok) {
                console.error('Ошибка загрузки сотрудников, статус:', res.status);
                return;
            }

            const data = await res.json();

            const mapped = data.map((d) => {
                const rawId =
                    d.id ??
                    d.employeeId ??
                    d.employee_id ??
                    d.empId ??
                    d.emp_id ??
                    null;

                const numericId = rawId != null ? Number(rawId) : null;

                return {
                    id: numericId,
                    name:
                        d.fullName ||
                        d.full_name ||
                        d.name ||
                        `${d.lastName || ''} ${d.firstName || ''}`.trim() ||
                        'Без имени',
                    position:
                        d.position ||
                        d.positionTitle ||
                        d.position_title ||
                        d.jobTitle ||
                        'Без должности',
                    department: d.departmentName || d.department || null,
                    role: String(d.role || d.employeeRole || d.employee_role || 'employee').toLowerCase(),
                };
            });

            setTechSpecialists(mapped);
        } catch (e) {
            console.error('Ошибка загрузки сотрудников', e);
        }
    }, [effectiveToken]);

    // ===== Инициализация =====
    useEffect(() => {
        if (authLoading) return;
        loadTickets();
        loadEmployees();
    }, [authLoading, loadTickets, loadEmployees]);

    useEffect(() => {
        document.title = 'Техподдержка | MeowMeow';
        applyFilters();
    }, [filters, tickets]);

    // ===== Фильтрация =====
    const applyFilters = () => {
        // ... (существующий код applyFilters без изменений)
        let filtered = [...tickets];

        if (filters.status) {
            filtered = filtered.filter(ticket => ticket.status === filters.status);
        }

        if (filters.category) {
            filtered = filtered.filter(ticket => ticket.category === filters.category);
        }

        if (filters.createdByMe && currentEmployeeId) {
            filtered = filtered.filter(ticket =>
                ticket.createdById != null
                    ? String(ticket.createdById) === String(currentEmployeeId)
                    : false
            );
        }

        if (filters.assignedToMe && currentEmployeeId) {
            filtered = filtered.filter(ticket =>
                String(ticket.assignedTo) === String(currentEmployeeId)
            );
        }

        if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            filtered = filtered.filter(ticket =>
                ticket.ticketNumber.toLowerCase().includes(searchLower) ||
                ticket.title.toLowerCase().includes(searchLower) ||
                ticket.description.toLowerCase().includes(searchLower)
            );
        }

        setFilteredTickets(filtered);
    };

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
            category: '',
            createdByMe: false,
            assignedToMe: false,
            search: ''
        });
    };

    const showMyInProgress = () => {
        if (!currentEmployeeId) return;

        setFilters(prev => ({
            ...prev,
            assignedToMe: true,
        }));
    };

    // ===== Создание заявки =====
    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setTicketForm(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleCreateTicket = async (e) => {
        // ... (существующий код handleCreateTicket без изменений)
        e.preventDefault();

        if (!effectiveToken) {
            setError('Сессия истекла. Перезайдите в систему.');
            return;
        }

        if (!ticketForm.title || !ticketForm.category || !ticketForm.description) {
            alert('Пожалуйста, заполните все обязательные поля');
            return;
        }

        try {
            const headers = {
                'Content-Type': 'application/json;charset=UTF-8',
                ...(effectiveToken ? { Authorization: `Bearer ${effectiveToken}` } : {})
            };

            const body = JSON.stringify({
                title: ticketForm.title,
                description: ticketForm.description,
                category: ticketForm.category,
            });

            const res = await fetch(`${API_BASE_URL}/support-tickets`, {
                method: 'POST',
                headers,
                body,
                credentials: 'include'
            });

            if (!res.ok) {
                const errorText = await res.text();
                console.error('Ошибка создания заявки:', res.status, errorText);
                alert('Не удалось создать заявку');
                return;
            }

            await loadTickets();
            setTicketForm({
                title: '',
                category: '',
                description: ''
            });
            setShowCreateForm(false);
        } catch (err) {
            console.error(err);
            alert('Ошибка при создании заявки');
        }
    };

    // ===== Взять заявку в работу =====
    const handleTakeTicket = async (ticketId) => {
        // ... (существующий код handleTakeTicket без изменений)
        if (!currentEmployeeId) {
            alert('Ваш профиль сотрудника не найден');
            return;
        }

        try {
            const headers = effectiveToken ? { Authorization: `Bearer ${effectiveToken}` } : {};

            const res = await fetch(
                `${API_BASE_URL}/support-tickets/${ticketId}/take?assigneeId=${currentEmployeeId}`,
                {
                    method: 'PUT',
                    headers,
                    credentials: 'include',
                }
            );

            if (!res.ok) {
                const text = await res.text();
                console.error('Не удалось взять заявку в работу:', res.status, text);
                alert('Не удалось взять заявку в работу');
                return;
            }

            await loadTickets();
        } catch (e) {
            console.error(e);
            alert('Ошибка при взятии заявки в работу');
        }
    };

    // ===== РЕШИТЬ ЗАЯВКУ (ОБНОВЛЕННАЯ ФУНКЦИЯ) =====
    const handleResolveClick = (ticket) => {
        setSelectedTicket(ticket);
        setResolveSolution(ticket.solution || ''); // Предзаполняем, если уже есть решение
        setShowResolveModal(true);
    };

    const handleResolveTicket = async () => {
        if (!selectedTicket || !resolveSolution.trim()) {
            alert('Пожалуйста, введите решение проблемы');
            return;
        }

        if (!effectiveToken) {
            setError('Сессия истекла. Перезайдите в систему.');
            return;
        }

        try {
            const headers = effectiveToken ? { Authorization: `Bearer ${effectiveToken}` } : {};

            const res = await fetch(
                `${API_BASE_URL}/support-tickets/${selectedTicket.id}/resolve`,
                {
                    method: 'PUT',
                    headers: {
                        ...headers,
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include',
                    body: JSON.stringify({ solution: resolveSolution.trim() }),
                }
            );

            if (!res.ok) {
                console.error('Ошибка решения заявки:', res.status);
                alert('Не удалось закрыть заявку');
                return;
            }

            await loadTickets();
            setShowResolveModal(false);
            setResolveSolution('');
            setSelectedTicket(null);
        } catch (e) {
            console.error(e);
            alert('Ошибка при закрытии заявки');
        }
    };

    // ===== Назначение специалиста =====
    const handleAssignClick = (ticket) => {
        setSelectedTicket(ticket);
        setShowAssignModal(true);
        setSelectedSpecialist(null);
    };

    const handleSpecialistSelect = (specialistId) => {
        setSelectedSpecialist(specialistId);
    };

    const confirmAssignment = async () => {
        // ... (существующий код confirmAssignment без изменений)
        if (!selectedTicket || !selectedSpecialist) return;

        try {
            const headersAuth = effectiveToken ? { Authorization: `Bearer ${effectiveToken}` } : {};
            const assignee = Number(selectedSpecialist);

            const resAssign = await fetch(
                `${API_BASE_URL}/support-tickets/${selectedTicket.id}/assign?assigneeId=${assignee}&assignee_id=${assignee}`,
                { method: 'PUT', headers: headersAuth, credentials: 'include' }
            );

            if (!resAssign.ok) {
                const text = await resAssign.text();
                console.error('Ошибка назначения:', resAssign.status, text);
                alert('Не удалось назначить специалиста');
                return;
            }

            const resUpdate = await fetch(`${API_BASE_URL}/support-tickets/${selectedTicket.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', ...headersAuth },
                credentials: 'include',
                body: JSON.stringify({
                    title: selectedTicket.title,
                    description: selectedTicket.description,
                    category: selectedTicket.category,
                    status: 'in_progress',
                    assigneeId: assignee,
                    assignee_id: assignee,
                }),
            });

            if (!resUpdate.ok) {
                const t = await resUpdate.text();
                console.error('Не удалось обновить тикет после assign:', resUpdate.status, t);
            }

            await loadTickets();
            setShowAssignModal(false);
            setSelectedTicket(null);
            setSelectedSpecialist(null);
        } catch (e) {
            console.error(e);
            alert('Ошибка при назначении специалиста');
        }
    };

    // ===== Редактирование заявки =====
    const handleEditClick = (ticket) => {
        setSelectedTicket(ticket);
        setEditForm({
            title: ticket.title,
            category: ticket.category,
            description: ticket.description,
            status: ticket.status,
            assigneeId: ticket.assignedTo ?? ''
        });
        setShowEditModal(true);
    };

    const handleEditFormChange = (e) => {
        const { name, value } = e.target;
        setEditForm(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSaveEdit = async (e) => {
        // ... (существующий код handleSaveEdit без изменений)
        e.preventDefault();
        if (!selectedTicket) return;

        if (!editForm.title || !editForm.category || !editForm.description) {
            alert('Пожалуйста, заполните все обязательные поля');
            return;
        }

        try {
            const headersAuth = effectiveToken ? { Authorization: `Bearer ${effectiveToken}` } : {};

            const newAssignee =
                editForm.assigneeId === '' || editForm.assigneeId == null
                    ? null
                    : Number(editForm.assigneeId);

            const isResolved = editForm.status === 'resolved' || editForm.status === 'closed';
            const computedStatus = isResolved ? editForm.status : (newAssignee ? 'in_progress' : 'new');

            const payload = {
                title: editForm.title,
                description: editForm.description,
                category: editForm.category,
                status: computedStatus,
                assigneeId: newAssignee,
                assignee_id: newAssignee,
            };

            const resUpdate = await fetch(`${API_BASE_URL}/support-tickets/${selectedTicket.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...headersAuth,
                },
                credentials: 'include',
                body: JSON.stringify(payload),
            });

            if (!resUpdate.ok) {
                const t = await resUpdate.text();
                console.error('Ошибка обновления заявки:', resUpdate.status, t);
                alert('Не удалось сохранить изменения');
                return;
            }

            await loadTickets();
            setShowEditModal(false);
            setSelectedTicket(null);
        } catch (e2) {
            console.error(e2);
            alert('Ошибка при сохранении изменений');
        }
    };

    // ===== Удаление заявки =====
    const openDeleteModal = (ticket) => {
        setDeleteModal({
            ticket: ticket,
            title: 'Подтвердите удаление',
            message: `Вы уверены, что хотите удалить заявку ${ticket.ticketNumber} (${ticket.title})? Это действие нельзя отменить.`
        });
    };

    const handleDeleteTicketConfirm = async () => {
        // ... (существующий код handleDeleteTicketConfirm без изменений)
        if (!deleteModal || !deleteModal.ticket || !effectiveToken) return;

        try {
            const ticketId = deleteModal.ticket.id;
            const headers = effectiveToken ? { Authorization: `Bearer ${effectiveToken}` } : {};

            const res = await fetch(`${API_BASE_URL}/support-tickets/${ticketId}`, {
                method: 'DELETE',
                headers,
                credentials: 'include',
            });

            if (!res.ok && res.status !== 204) {
                setError('Не удалось удалить заявку');
                setDeleteModal(null);
                return;
            }

            setTickets(prev => prev.filter(t => t.id !== ticketId));
            setFilteredTickets(prev => prev.filter(t => t.id !== ticketId));

            setDeleteModal(null);
            setError(`Заявка ${deleteModal.ticket.ticketNumber} успешно удалена`);

            setTimeout(() => {
                setError('');
            }, 3000);

        } catch (e) {
            console.error(e);
            setError('Ошибка при удалении заявки');
            setDeleteModal(null);
        }
    };

    // ===== Просмотр заявки и комментарии =====
    const handleViewTicket = (ticket) => {
        setSelectedTicket(ticket);
        setShowTicketModal(true);
    };

    const handleAddComment = async (e) => {
        // ... (существующий код handleAddComment без изменений)
        e.preventDefault();
        if (!newComment.trim() || !selectedTicket) return;

        try {
            const res = await fetch(
                `${API_BASE_URL}/support-tickets/${selectedTicket.id}/comment`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(effectiveToken ? { Authorization: `Bearer ${effectiveToken}` } : {})
                    },
                    body: JSON.stringify({ comment: newComment.trim() }),
                    credentials: 'include',
                }
            );

            if (!res.ok) {
                alert('Не удалось сохранить комментарий');
                return;
            }

            const updatedTicketDto = await res.json();
            const updated = mapTicketFromDto(updatedTicketDto);

            setTickets(prev => prev.map(ticket => ticket.id === updated.id ? updated : ticket));
            setSelectedTicket(updated);
            setNewComment('');
        } catch (err) {
            console.error(err);
            alert('Ошибка при сохранении комментария');
        }
    };

    // ===== Вспомогательные функции =====
    const getStatusName = (statusId) => {
        return Object.values(statuses).find(s => s.id === statusId)?.name || statusId;
    };

    const getStatusColor = (statusId) => {
        return Object.values(statuses).find(s => s.id === statusId)?.color || '#95a5a6';
    };

    const getCategoryName = (categoryId) => {
        return techCategories.find(c => c.id === categoryId)?.name || categoryId;
    };

    const getSpecialistName = (ticket) => {
        if (!ticket) return '—';

        if (ticket.assignedToName) {
            return ticket.assignedToName;
        }

        if (ticket.assignedTo == null) {
            return 'Не назначен';
        }

        const sp = techSpecialists.find(
            s => String(s.id) === String(ticket.assignedTo)
        );

        if (sp?.name) return sp.name;

        return 'Не назначен';
    };

    // ===== Проверка прав =====
    const isEmployee = user?.role === 'employee';
    const isTechSupportUser = user?.role === 'tech_support';
    const isModerator = user?.role === 'moderator';
    const isAdmin = user?.role === 'admin';
    const canWorkWithTickets = isEmployee || isTechSupportUser;
    const canAssign = isModerator || isAdmin;
    const canEditDelete = isModerator || isAdmin;

    // ===== Статистика =====
    const stats = {
        total: tickets.length,
        new: tickets.filter(t => t.status === 'new').length,
        inProgress: tickets.filter(t => t.status === 'in_progress').length,
        resolved: tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length
    };

    return (
        <div className="dashboard-container">
            <section className="dashboard-hero">
                <h2>Техническая поддержка</h2>
                <p>Создание и управление заявками в техническую поддержку</p>
            </section>

            {/* Индикаторы загрузки и ошибки */}
            {loading && (
                <div className="loading-message">
                    <p>Загрузка заявок...</p>
                </div>
            )}

            {error && (
                <div className="error-message">
                    <p>Ошибка: {error}</p>
                </div>
            )}

            {/* Форма создания заявки */}
            <div className="create-ticket-section">
                <div className="create-ticket-header">
                    <h2>Создать новую заявку</h2>
                    <button
                        className="toggle-form-btn"
                        onClick={() => setShowCreateForm(!showCreateForm)}
                        disabled={loading}
                    >
                        {showCreateForm ? 'Скрыть форму' : 'Создать заявку'}
                    </button>
                </div>

                {showCreateForm && (
                    <form onSubmit={handleCreateTicket} className="ticket-form">
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">
                                    Заголовок заявки <span className="required">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="title"
                                    value={ticketForm.title}
                                    onChange={handleFormChange}
                                    placeholder="Краткое описание проблемы"
                                    className="form-input"
                                    required
                                    disabled={loading}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">
                                    Категория <span className="required">*</span>
                                </label>
                                <select
                                    name="category"
                                    value={ticketForm.category}
                                    onChange={handleFormChange}
                                    className="form-select"
                                    required
                                    disabled={loading}
                                >
                                    <option value="">Выберите категорию</option>
                                    {techCategories.map(category => (
                                        <option key={category.id} value={category.id}>
                                            {category.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">
                                Описание проблемы <span className="required">*</span>
                            </label>
                            <textarea
                                name="description"
                                value={ticketForm.description}
                                onChange={handleFormChange}
                                placeholder="Подробно опишите проблему, шаги воспроизведения и ожидаемый результат"
                                className="form-textarea"
                                required
                                disabled={loading}
                            />
                        </div>

                        <div className="form-actions">
                            <button type="submit" className="toggle-form-btn" disabled={loading}>
                                Создать заявку
                            </button>
                            <button
                                type="button"
                                className="cancel-btn"
                                onClick={() => setShowCreateForm(false)}
                                disabled={loading}
                            >
                                Отмена
                            </button>
                        </div>
                    </form>
                )}
            </div>

            {/* Фильтры */}
            <section className="filters-section">
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
                        <label className="filter-label">Категория</label>
                        <select
                            name="category"
                            value={filters.category}
                            onChange={handleFilterChange}
                            className="filter-select"
                            disabled={loading}
                        >
                            <option value="">Все категории</option>
                            {techCategories.map(category => (
                                <option key={category.id} value={category.id}>{category.name}</option>
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
                            placeholder="По номеру или названию"
                            className="filter-select"
                            disabled={loading}
                        />
                    </div>
                </div>
                <div className="filter-actions">
                    <button className="search-btn" onClick={applyFilters} disabled={loading}>
                        Применить фильтры
                    </button>
                    <button
                        type="button"
                        className={`in-process-btn ${filters.assignedToMe ? 'clicked' : ''}`}
                        onClick={() => setFilters(prev => ({
                            ...prev,
                            assignedToMe: !prev.assignedToMe
                        }))}
                        title="Показать заявки, которые вы взяли в работу"
                    >
                        Мои рабочие заявки
                    </button>
                    <button
                        type="button"
                        className={`in-process-btn ${filters.createdByMe ? 'clicked' : ''}`}
                        onClick={() => setFilters(prev => ({
                            ...prev,
                            createdByMe: !prev.createdByMe
                        }))}
                        disabled={loading}
                        title="Показать заявки, которые вы отправили"
                    >
                        Мои заявки
                    </button>
                    <button className="reset-btn" onClick={resetFilters} disabled={loading}>
                        Сбросить фильтры
                    </button>
                </div>
            </section>

            {/* Список заявок */}
            <div className="tickets-container">
                <div className="tickets-header">
                    <h2>Список заявок</h2>
                    <div className="tickets-count">
                        Показано: {filteredTickets.length} из {tickets.length}
                    </div>
                </div>

                <div className="tickets-list">
                    {filteredTickets.length === 0 ? (
                        <div className="no-data">
                            <p>{loading ? 'Загрузка...' : 'Заявки по выбранным фильтрам не найдены'}</p>
                        </div>
                    ) : (
                        filteredTickets.map(ticket => {
                            const isAssignedToMe =
                                currentEmployeeId != null &&
                                ticket.assignedTo != null &&
                                String(ticket.assignedTo) === String(currentEmployeeId);

                            const canTake =
                                canWorkWithTickets &&
                                !ticket.assignedTo &&
                                ticket.status === 'new';

                            const isResolved = ticket.status === 'resolved' || ticket.status === 'closed';

                            const canResolve =
                                !isResolved &&
                                (
                                    (canWorkWithTickets && isAssignedToMe && ticket.status === 'in_progress') ||
                                    canEditDelete
                                );
                            return (
                                <div key={ticket.id} className="ticket-card">
                                    <div className="ticket-card-header">
                                        <div className="ticket-info">
                                            <div className="ticket-number">{ticket.ticketNumber}</div>
                                            <div className="ticket-title">{ticket.title}</div>
                                            <div className="ticket-description">
                                                {ticket.description.length > 150
                                                    ? `${ticket.description.substring(0, 150)}...`
                                                    : ticket.description}
                                            </div>

                                            <div className="ticket-meta">
                                                <div className="meta-item">
                                                    <span className="meta-label">Статус</span>
                                                    <span
                                                        className="status-badge"
                                                        style={{
                                                            backgroundColor: getStatusColor(ticket.status) + '20',
                                                            color: getStatusColor(ticket.status)
                                                        }}
                                                    >
                                                        {getStatusName(ticket.status)}
                                                    </span>
                                                </div>

                                                <div className="meta-item">
                                                    <span className="meta-label">Категория</span>
                                                    <span className="meta-value">{getCategoryName(ticket.category)}</span>
                                                </div>

                                                <div className="meta-item">
                                                    <span className="meta-label">Создал</span>
                                                    <span className="meta-value">{ticket.createdBy}</span>
                                                </div>

                                                <div className="meta-item">
                                                    <span className="meta-label">Назначен</span>
                                                    <span className="meta-value">{getSpecialistName(ticket)}</span>
                                                </div>

                                                <div className="meta-item">
                                                    <span className="meta-label">Создана</span>
                                                    <span className="meta-value">
                                                        {ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString('ru-RU') : '—'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="ticket-actions">
                                        <button
                                            className="action-btn view-btn"
                                            onClick={() => handleViewTicket(ticket)}
                                            disabled={loading}
                                        >
                                            Просмотр
                                        </button>

                                        {canTake && (
                                            <button
                                                className="action-btn take-btn"
                                                onClick={() => handleTakeTicket(ticket.id)}
                                                disabled={loading}
                                            >
                                                Взять в работу
                                            </button>
                                        )}

                                        {canResolve && (
                                            <button
                                                className="action-btn resolve-btn"
                                                onClick={() => handleResolveClick(ticket)} // <-- ИЗМЕНЕНО
                                                disabled={loading}
                                            >
                                                Решить
                                            </button>
                                        )}

                                        {canAssign && ticket.status === 'new' && ticket.assignedTo == null && (
                                            <button
                                                className="action-btn assign-btn"
                                                onClick={() => handleAssignClick(ticket)}
                                                disabled={loading}
                                            >
                                                Назначить
                                            </button>
                                        )}

                                        {canEditDelete && (
                                            <>
                                                <button
                                                    className="action-btn edit-btn"
                                                    onClick={() => handleEditClick(ticket)}
                                                    disabled={loading}
                                                >
                                                    Редактировать
                                                </button>

                                                <button
                                                    className="action-btn delete-btn"
                                                    onClick={() => openDeleteModal(ticket)}
                                                    disabled={loading}
                                                >
                                                    Удалить
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Статистика */}
            <div className="stats-section">
                <div className="stat-card">
                    <div className="stat-title">Новых</div>
                    <div className="stat-value">
                        {stats.new}
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-title">В работе</div>
                    <div className="stat-value">
                        {stats.inProgress}
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-title">Решено</div>
                    <div className="stat-value">
                        {stats.resolved}
                    </div>
                </div>
            </div>

            {/* Модальное окно просмотра заявки */}
            {showTicketModal && selectedTicket && (
                <section className="form-overlay">
                    <section className="form">
                        <section className="form-header">
                            <h2>Просмотр заявки</h2>
                            <button className="close-btn" onClick={() => setShowTicketModal(false)}>×</button>
                        </section>
                        <p>Номер заявки: {selectedTicket.ticketNumber}</p>

                        <div className="modal-status-badges">
                            <span
                                className="status-badge"
                                style={{
                                    backgroundColor: getStatusColor(selectedTicket.status) + '20',
                                    color: getStatusColor(selectedTicket.status)
                                }}
                            >
                                {getStatusName(selectedTicket.status)}
                            </span>
                        </div>

                        <section className="ticket-details">
                            <h3 className="ticket-details-title">{selectedTicket.title}</h3>
                            <p className="ticket-details-description">{selectedTicket.description}</p>
                        </section>

                        <section className="ticket-meta-grid">
                            <div className="meta-item">
                                <span className="meta-label">Категория</span>
                                <span className="meta-value">{getCategoryName(selectedTicket.category)}</span>
                            </div>
                            <div className="meta-item">
                                <span className="meta-label">Создал</span>
                                <span className="meta-value">{selectedTicket.createdBy}</span>
                            </div>
                            <div className="meta-item">
                                <span className="meta-label">Отдел</span>
                                <span className="meta-value">{selectedTicket.createdByDepartment}</span>
                            </div>
                            <div className="meta-item">
                                <span className="meta-label">Назначен</span>
                                <span className="meta-value">{getSpecialistName(selectedTicket)}</span>
                            </div>
                            <div className="meta-item">
                                <span className="meta-label">Создана</span>
                                <span className="meta-value">
                                    {selectedTicket.createdAt ? new Date(selectedTicket.createdAt).toLocaleString('ru-RU') : '—'}
                                </span>
                            </div>
                        </section>

                        {selectedTicket.solution && (
                            <div className="solution-section">
                                <h4 className="solution-title">Решение:</h4>
                                <p className="solution-text">{selectedTicket.solution}</p>
                                {selectedTicket.resolvedAt && (
                                    <small className="solution-date">
                                        Решено: {new Date(selectedTicket.resolvedAt).toLocaleString('ru-RU')}
                                    </small>
                                )}
                            </div>
                        )}

                        {/* Комментарии */}
                        <section className="comments-section">
                            <h2 className="comments-title-section">Комментарии</h2>

                            <div className="comments-list">
                                {selectedTicket.comments.length > 0 ? (
                                    selectedTicket.comments.map(comment => (
                                        <div key={comment.id} className="comment-item-support">
                                            <div className="comment-header">
                                                <div className="comment-author-info">
                                                    <span className="comment-author-support">{comment.author}</span>
                                                    <span className="comment-role">{comment.authorRole}</span>
                                                </div>
                                                <span className="comment-date-support">
                                                    {comment.createdAt ? new Date(comment.createdAt).toLocaleString('ru-RU') : ''}
                                                </span>
                                            </div>
                                            <div className="comment-text">{comment.text}</div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="no-comments">Комментариев пока нет</p>
                                )}
                            </div>

                            {/* Форма добавления комментария */}
                            <form onSubmit={handleAddComment} className="add-comment-form">
                                <textarea
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    placeholder="Добавить комментарий..."
                                    className="form-textarea-description"
                                    rows="3"
                                />
                                <div className="form-actions">
                                    <button type="submit" className="confirm-btn" disabled={loading}>
                                        Добавить комментарий
                                    </button>
                                    <button
                                        type="button"
                                        className="cancel-btn"
                                        onClick={() => { setNewComment(''); setShowTicketModal(false); }}
                                        disabled={loading}
                                    >
                                        Отмена
                                    </button>
                                </div>
                            </form>
                        </section>
                    </section>
                </section>
            )}

            {/* НОВОЕ МОДАЛЬНОЕ ОКНО ДЛЯ РЕШЕНИЯ ЗАЯВКИ */}
            {showResolveModal && selectedTicket && (
                <div className="form-overlay">
                    <div className="form">
                        <div className="form-header">
                            <h2>Решение заявки</h2>
                            <button className="close-btn" onClick={() => {
                                setShowResolveModal(false);
                                setResolveSolution('');
                            }}>×</button>
                        </div>

                        <div className="ticket-info-summary">
                            <p><strong>Номер заявки:</strong> {selectedTicket.ticketNumber}</p>
                            <p><strong>Заголовок:</strong> {selectedTicket.title}</p>
                            <p><strong>Категория:</strong> {getCategoryName(selectedTicket.category)}</p>
                            <p><strong>Статус:</strong> {getStatusName(selectedTicket.status)}</p>
                        </div>

                        <div className="form-group">
                            <label className="form-label">
                                Описание решения <span className="required">*</span>
                            </label>
                            <textarea
                                value={resolveSolution}
                                onChange={(e) => setResolveSolution(e.target.value)}
                                placeholder="Опишите, как была решена проблема..."
                                className="form-textarea"
                                rows="6"
                                required
                                disabled={loading}
                            />
                            <small className="form-hint">
                                После сохранения заявка будет переведена в статус "Решено"
                            </small>
                        </div>

                        <div className="modal-actions">
                            <button
                                className="cancel-btn"
                                onClick={() => {
                                    setShowResolveModal(false);
                                    setResolveSolution('');
                                }}
                                disabled={loading}
                            >
                                Отмена
                            </button>
                            <button
                                className="confirm-btn"
                                onClick={handleResolveTicket}
                                disabled={!resolveSolution.trim() || loading}
                            >
                                {loading ? 'Сохранение...' : 'Сохранить решение'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Модальное окно назначения специалиста */}
            {showAssignModal && selectedTicket && (
                <div className="form-overlay">
                    <div className="form">
                        <div className="form-header">
                            <h2>Назначить специалиста</h2>
                            <button className="close-btn" onClick={() => setShowAssignModal(false)}>×</button>
                        </div>
                        <div>
                            <div>
                                <p>Номер заявки: {selectedTicket.ticketNumber}</p>
                            </div>
                            <div>
                                <p>Заголовок: {selectedTicket.title}</p>
                            </div>
                            <div>
                                <p>Категория: {getCategoryName(selectedTicket.category)}</p>
                            </div>
                        </div>

                        <h3 className="specialist-select-title">Выберите специалиста:</h3>

                        <div className="employee-list">
                            {techSpecialists.length > 0 ? (
                                techSpecialists.map(specialist => (
                                    <div
                                        key={specialist.id}
                                        className={`employee-item ${selectedSpecialist === specialist.id ? 'selected' : ''}`}
                                        onClick={() => handleSpecialistSelect(specialist.id)}
                                    >
                                        <div className="employee-name">{specialist.name}</div>
                                        <div className="employee-details">
                                            <div>Должность: {specialist.position || '—'}</div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p>Загрузка специалистов...</p>
                            )}
                        </div>

                        <div className="modal-actions">
                            <button className="cancel-btn" onClick={() => setShowAssignModal(false)} disabled={loading}>
                                Отмена
                            </button>
                            <button
                                className="confirm-btn"
                                onClick={confirmAssignment}
                                disabled={!selectedSpecialist || loading || techSpecialists.length === 0}
                            >
                                Назначить специалиста
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Модальное окно редактирования заявки */}
            {showEditModal && selectedTicket && (
                <div className="form-overlay">
                    <div className="form">
                        <div className="form-header">
                            <h2>Редактирование заявки</h2>
                            <button className="close-btn" onClick={() => setShowEditModal(false)}>×</button>
                        </div>
                        <div className="form-header">
                            <h2>{selectedTicket.ticketNumber}</h2>
                        </div>

                        <form onSubmit={handleSaveEdit} className="ticket-form">
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">
                                        Заголовок заявки
                                    </label>
                                    <input
                                        type="text"
                                        name="title"
                                        value={editForm.title}
                                        onChange={handleEditFormChange}
                                        placeholder="Краткое описание проблемы"
                                        required
                                        disabled={loading}
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">
                                        Категория
                                    </label>
                                    <select
                                        name="category"
                                        value={editForm.category}
                                        onChange={handleEditFormChange}
                                        className="form-select-type"
                                        required
                                        disabled={loading}
                                    >
                                        <option value="">Выберите категорию</option>
                                        {techCategories.map(category => (
                                            <option key={category.id} value={category.id}>
                                                {category.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">
                                        Статус
                                    </label>
                                    <select
                                        name="status"
                                        value={editForm.status}
                                        onChange={handleEditFormChange}
                                        className="form-select-type"
                                        disabled={loading}
                                    >
                                        {Object.values(statuses).map(status => (
                                            <option key={status.id} value={status.id}>
                                                {status.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {canAssign && (
                                <div className="form-group">
                                    <label className="form-label">
                                        Назначен исполнитель
                                    </label>
                                    <select
                                        name="assigneeId"
                                        value={editForm.assigneeId ?? ''}
                                        onChange={handleEditFormChange}
                                        className="form-select-type"
                                        disabled={loading}
                                    >
                                        <option value="">Не назначен</option>
                                        {techSpecialists.map(s => (
                                            <option key={s.id} value={s.id}>
                                                {s.name} ({s.position})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div className="form-group">
                                <label className="form-label">
                                    Описание проблемы
                                </label>
                                <textarea
                                    name="description"
                                    value={editForm.description}
                                    onChange={handleEditFormChange}
                                    placeholder="Подробно опишите проблему, шаги воспроизведения и ожидаемый результат"
                                    className="form-textarea-description"
                                    required
                                    disabled={loading}
                                />
                            </div>

                            <div className="form-actions">
                                <button type="submit" className="confirm-btn" disabled={loading}>
                                    Сохранить изменения
                                </button>
                                <button
                                    type="button"
                                    className="cancel-btn"
                                    onClick={() => setShowEditModal(false)}
                                    disabled={loading}
                                >
                                    Отмена
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Модальное окно удаления заявки */}
            {deleteModal && (
                <div className="modal">
                    <div className="modal-content">
                        <span className="close" onClick={() => setDeleteModal(null)}>&times;</span>
                        <h3>{deleteModal.title}</h3>
                        <p>{deleteModal.message}</p>
                        <div className="modal-actions">
                            <button
                                className="btn-primary"
                                onClick={handleDeleteTicketConfirm}
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
        </div>
    );
}

export default TechSupport;