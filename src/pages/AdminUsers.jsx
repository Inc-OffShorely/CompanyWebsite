// src/pages/AdminUsers.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { API_BASE_URL } from '../config';
import { useAuth } from '../hooks/useAuth';

function AdminUsers() {
  useEffect(() => {
    document.title = 'Администрирование | MeowMeow';
  }, []);

  const { token } = useAuth();

  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [globalError, setGlobalError] = useState('');
  const [confirmModal, setConfirmModal] = useState(null);
  const [deleteModal, setDeleteModal] = useState(null); // Новая модалка для удаления

  const [passwords, setPasswords] = useState({});
  const [passwordErrors, setPasswordErrors] = useState({});

  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState(null);

  const [newEmployee, setNewEmployee] = useState({
    full_name: '',
    login: '',
    email: '',
    position_title: '',
    phone: '',
    telegram: '',
    passport_data: '',
    birth_date: '',
    hired_date: '',
    password: '',
    roleCode: 'employee',
    can_manage_documents: false
  });

  const [search, setSearch] = useState('');

  // ===== Загрузка списка сотрудников =====
  useEffect(() => {
    const fetchEmployees = async () => {
      setLoading(true);
      setGlobalError('');
      try {
        const res = await fetch(`${API_BASE_URL}/employees`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!res.ok) throw new Error(`Ошибка загрузки: ${res.status}`);
        const data = await res.json();
        data.sort((a, b) => (a.id || 0) - (b.id || 0));
        setEmployees(data);
      } catch (e) {
        console.error(e);
        setGlobalError('Не удалось загрузить сотрудников');
      } finally {
        setLoading(false);
      }
    };

    if (token) fetchEmployees();
    else setLoading(false);
  }, [token]);

  // ===== Утилиты =====
  const employeesFiltered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return employees;
    return employees.filter((e) => {
      const idStr = String(e.id ?? '').toLowerCase();
      const fullName = (e.full_name ?? '').toLowerCase();
      const login = (e.login ?? '').toLowerCase();
      const rolesRu = (e.roles ?? [])
        .map((r) => r.name ?? '')
        .join(', ')
        .toLowerCase();
      return idStr.includes(q) || fullName.includes(q) || login.includes(q) || rolesRu.includes(q);
    });
  }, [employees, search]);

  const formatLastActivity = (ts) => {
    if (!ts) return '—';
    try {
      const d = new Date(ts);
      return d.toLocaleString('ru-RU');
    } catch {
      return ts;
    }
  };

  const getPhone = (emp) => emp.contacts?.phone ?? '';
  const getTelegram = (emp) => emp.contacts?.telegram ?? '';
  const getPassport = (emp) => emp.passport_data ?? '—';
  const getRolesRu = (emp) => (emp.roles ?? []).map((r) => r.name).join(', ') || '—';
  const hasNewsRight = (emp) => {
    const codes = (emp.roles ?? []).map((r) => (r.code || '').toLowerCase());
    return codes.includes('admin') || codes.includes('moderator');
  };

  // ===== Удаление сотрудника =====
  const openDeleteModal = (emp) => {
    setDeleteModal({
      employee: emp,
      title: 'Подтверждение удаления',
      message: `Вы уверены, что хотите удалить сотрудника ${emp.full_name} (${emp.login})? Это действие нельзя отменить.`
    });
  };

  const handleDeleteEmployee = async () => {
    if (!deleteModal || !token) return;

    try {
      const { employee } = deleteModal;
      setGlobalError('');

      const res = await fetch(`${API_BASE_URL}/employees/${employee.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) {
        if (res.status === 404) {
          throw new Error('Сотрудник не найден');
        } else if (res.status === 403) {
          throw new Error('У вас нет прав для удаления сотрудников');
        } else if (res.status === 409) {
          throw new Error('Невозможно удалить сотрудника. Возможно, у него есть связанные данные.');
        } else {
          throw new Error(`Ошибка сервера: ${res.status}`);
        }
      }

      // Удаляем из локального состояния
      setEmployees(prev => prev.filter(e => e.id !== employee.id));
      setDeleteModal(null);

      // Показываем сообщение об успехе
      setGlobalError(`Сотрудник ${employee.full_name} успешно удалён`);

      // Очищаем сообщение через 3 секунды
      setTimeout(() => {
        setGlobalError('');
      }, 3000);

    } catch (e) {
      console.error(e);
      setGlobalError(e.message || 'Не удалось удалить сотрудника');
      setDeleteModal(null);
    }
  };

  // ===== Смена пароля =====
  const handlePasswordChange = (id, value) => {
    if (!/^\d{0,8}$/.test(value)) return;
    setPasswords((prev) => ({ ...prev, [id]: value }));
    setPasswordErrors((prev) => ({ ...prev, [id]: '' }));
  };

  const handleChangePassword = async (emp) => {
    const pwd = passwords[emp.id] ?? '';
    if (pwd.length !== 8) {
      setPasswordErrors((prev) => ({ ...prev, [emp.id]: 'Пароль должен быть ровно 8 цифр' }));
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/employees/${emp.id}/password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ newPassword: pwd })
      });

      if (!res.ok) {
        if (res.status === 400) {
          setPasswordErrors((prev) => ({ ...prev, [emp.id]: 'Некорректный пароль (ожидается 8 цифр)' }));
        } else if (res.status === 404) {
          setPasswordErrors((prev) => ({ ...prev, [emp.id]: 'Сотрудник не найден' }));
        } else {
          setPasswordErrors((prev) => ({ ...prev, [emp.id]: `Ошибка сервера: ${res.status}` }));
        }
        return;
      }

      setPasswords((prev) => ({ ...prev, [emp.id]: '' }));
      setPasswordErrors((prev) => ({ ...prev, [emp.id]: 'Пароль обновлён' }));
    } catch (e) {
      console.error(e);
      setPasswordErrors((prev) => ({ ...prev, [emp.id]: 'Не удалось связаться с сервером' }));
    }
  };

  // ===== Право на документы =====
  const handleToggleDocsPermission = async (emp) => {
    const newValue = !emp.can_manage_documents;
    try {
      const res = await fetch(`${API_BASE_URL}/employees/${emp.id}/document-permission`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ canManageDocuments: newValue })
      });

      if (!res.ok) throw new Error(`Ошибка: ${res.status}`);
      const updated = await res.json();
      setEmployees((prev) =>
        prev.map((e) => (e.id === emp.id ? updated : e)).sort((a, b) => (a.id || 0) - (b.id || 0))
      );
    } catch (e) {
      console.error(e);
      setGlobalError('Не удалось обновить право на документы');
    }
  };

  // ===== Редактирование =====
  const startEdit = (emp) => {
    setEditingId(emp.id);
    setEditData({
      full_name: emp.full_name ?? '',
      login: emp.login ?? '',
      email: emp.email ?? '',
      position_title: emp.position_title ?? '',
      phone: getPhone(emp),
      telegram: getTelegram(emp),
      passport_data: emp.passport_data ?? '',
      birth_date: emp.birth_date ?? '',
      hired_date: emp.hired_at ? emp.hired_at.substring(0, 10) : '',
      roleCode: (emp.roles && emp.roles[0] && emp.roles[0].code) || 'employee',
      can_manage_documents: !!emp.can_manage_documents
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditData(null);
  };

  const handleEditFieldChange = (field, value) => {
    setEditData((prev) => ({ ...prev, [field]: value }));
  };

  const saveEdit = async (empId) => {
    if (!editData) return;
    try {
      const payload = {
        full_name: editData.full_name,
        login: editData.login,
        email: editData.email,
        position_title: editData.position_title,
        contacts: { phone: editData.phone, telegram: editData.telegram },
        birth_date: editData.birth_date || null,
        hired_at: editData.hired_date ? `${editData.hired_date}T00:00:00` : null,
        passport_data: editData.passport_data || null
      };

      const resMain = await fetch(`${API_BASE_URL}/employees/${empId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });

      if (!resMain.ok) throw new Error(`Ошибка обновления сотрудника: ${resMain.status}`);
      let updated = await resMain.json();

      if (editData.roleCode) {
        const resRoles = await fetch(`${API_BASE_URL}/employees/${empId}/roles`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ roles: [editData.roleCode] })
        });
        if (!resRoles.ok) throw new Error(`Ошибка обновления роли: ${resRoles.status}`);
        updated = await resRoles.json();
      }

      if (
        typeof editData.can_manage_documents === 'boolean' &&
        editData.can_manage_documents !== updated.can_manage_documents
      ) {
        const resDocs = await fetch(`${API_BASE_URL}/employees/${empId}/document-permission`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ canManageDocuments: editData.can_manage_documents })
        });
        if (resDocs.ok) updated = await resDocs.json();
      }

      setEmployees((prev) =>
        prev.map((e) => (e.id === empId ? updated : e)).sort((a, b) => (a.id || 0) - (b.id || 0))
      );
      cancelEdit();
    } catch (e) {
      console.error(e);
      setGlobalError('Не удалось сохранить изменения сотрудника');
    }
  };

  // ===== Регистрация нового сотрудника =====
  const handleNewFieldChange = (field, value) => {
    setNewEmployee((prev) => ({ ...prev, [field]: value }));
  };

  const createEmployee = async () => {
    setGlobalError('');
    if (!newEmployee.login || newEmployee.login.length !== 8) {
      setGlobalError('Логин нового сотрудника должен быть из 8 символов');
      return;
    }
    if (!/^\d{8}$/.test(newEmployee.password)) {
      setGlobalError('Начальный пароль должен быть из 8 цифр');
      return;
    }

    try {
      const payload = {
        full_name: newEmployee.full_name,
        login: newEmployee.login,
        email: newEmployee.email,
        position_title: newEmployee.position_title,
        contacts: { phone: newEmployee.phone, telegram: newEmployee.telegram },
        birth_date: newEmployee.birth_date || null,
        hired_at: newEmployee.hired_date ? `${newEmployee.hired_date}T00:00:00` : null,
        passport_data: newEmployee.passport_data || null,
        password: newEmployee.password
      };

      const res = await fetch(`${API_BASE_URL}/employees`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        if (res.status === 409) {
          const text = await res.text();
          if (text === 'DUPLICATE_PASSPORT') {
            setGlobalError('Сотрудник с таким паспортом уже существует');
          } else {
            setGlobalError('Конфликт данных (409)');
          }
        } else if (res.status === 400) {
          setGlobalError('Некорректные данные нового сотрудника');
        } else {
          setGlobalError(`Ошибка создания сотрудника: ${res.status}`);
        }
        return;
      }

      let created = await res.json();

      if (newEmployee.roleCode) {
        const resRoles = await fetch(`${API_BASE_URL}/employees/${created.id}/roles`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ roles: [newEmployee.roleCode] })
        });
        if (resRoles.ok) created = await resRoles.json();
      }

      if (newEmployee.can_manage_documents) {
        const resDocs = await fetch(`${API_BASE_URL}/employees/${created.id}/document-permission`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ canManageDocuments: true })
        });
        if (resDocs.ok) created = await resDocs.json();
      }

      setEmployees((prev) => [...prev, created].sort((a, b) => (a.id || 0) - (b.id || 0)));
      setNewEmployee({
        full_name: '',
        login: '',
        email: '',
        position_title: '',
        phone: '',
        telegram: '',
        passport_data: '',
        birth_date: '',
        hired_date: '',
        password: '',
        roleCode: 'employee',
        can_manage_documents: false
      });
    } catch (e) {
      console.error(e);
      setGlobalError('Не удалось создать нового сотрудника');
    }
  };

  // ===== Подтверждение через модалку =====
  const handlePasswordChangeWithConfirm = (emp) => {
    setConfirmModal({
      title: 'Подтверждение смены пароля',
      message: `Вы уверены, что хотите сменить пароль для ${emp.full_name} (${emp.login})?`,
      onConfirm: () => handleChangePassword(emp)
    });
  };

  if (loading) {
    return (
      <div className="container">
        Загрузка сотрудников...
      </div>
    );
  }

  return (
    <div>
      <main className="dashboard-container">
        <section className="dashboard-hero">
          <h2>Сотрудники</h2>
          <p>Управление аккаунтами сотрудников.</p>
        </section>

        {globalError && <div className="admin-error">{globalError}</div>}

        {/* Поиск */}
        <div className="form-group">
          <label className="form-label">
            Поиск сотрудника
          </label>
          <input
            type="text"
            placeholder="Поиск по ID / ФИО / логину / роли"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="admin-search-input"
          />
        </div>

        {/* Форма нового сотрудника */}
        <section className="admin-new-employee-section hero">
          <h3>Регистрация нового сотрудника</h3>
          <div className="form-group">
            <label className="form-label">
              ФИО
            </label>
            <input
              type="text"
              placeholder="ФИО"
              value={newEmployee.full_name}
              onChange={(e) => handleNewFieldChange('full_name', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">
              Логин
            </label>
            <input
              type="text"
              placeholder="Логин (8 символов)"
              maxLength={8}
              value={newEmployee.login}
              onChange={(e) => handleNewFieldChange('login', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">
              E-mail
            </label>
            <input
              type="email"
              placeholder="E-mail"
              value={newEmployee.email}
              onChange={(e) => handleNewFieldChange('email', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">
              Должность
            </label>
            <input
              type="text"
              placeholder="Должность"
              value={newEmployee.position_title}
              onChange={(e) => handleNewFieldChange('position_title', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">
              Номер телефона
            </label>
            <input
              type="text"
              placeholder="Телефон"
              value={newEmployee.phone}
              onChange={(e) => handleNewFieldChange('phone', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">
              Аккаунт в Telegram
            </label>
            <input
              type="text"
              placeholder="Telegram"
              value={newEmployee.telegram}
              onChange={(e) => handleNewFieldChange('telegram', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">
              Паспортные данные
            </label>
            <input
              type="text"
              placeholder="Серия и номер паспорта"
              value={newEmployee.passport_data}
              onChange={(e) => handleNewFieldChange('passport_data', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">
              Пароль
            </label>
            <input
              type="password"
              placeholder="Начальный пароль (8 цифр)"
              maxLength={8}
              value={newEmployee.password}
              onChange={(e) => handleNewFieldChange('password', e.target.value)}
            />
          </div>

          {/* Блок дат и роли */}
          <div className="form-group">
            <label className="form-label">
              Дата рождения
            </label>
            <input
              type="date"
              value={newEmployee.birth_date}
              onChange={(e) => handleNewFieldChange('birth_date', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">
              Дата приёма на работу
            </label>
            <input
              type="date"
              value={newEmployee.hired_date}
              onChange={(e) => handleNewFieldChange('hired_date', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">
              Роль
            </label>
            <select
              value={newEmployee.roleCode}
              onChange={(e) => handleNewFieldChange('roleCode', e.target.value)}
              className="form-select"
            >
              <option value="employee">Сотрудник</option>
              <option value="moderator">Модератор</option>
              <option value="admin">Администратор</option>
            </select>
          </div>
          <label className="admin-permission-checkbox">
  <input
    type="checkbox"
    checked={newEmployee.can_manage_documents}
    onChange={(e) =>
      handleNewFieldChange('can_manage_documents', e.target.checked)
    }
  />
  <span className="form-label">Право на документы</span>
</label>
          <button type="button" className="btn-primary admin-register-btn" onClick={createEmployee}>
            Зарегистрировать
          </button>
        </section>

        {/* Таблица сотрудников */}
        <section className="admin-table-section">
<div className="admin-table-scroll">
          <table className="users-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>ФИО</th>
                <th>Логин</th>
                <th>E-mail</th>
                <th>Роль</th>
                <th>Должность</th>
                <th>Телефон</th>
                <th>Telegram</th>
                <th>Серия и номер паспорта</th>
                <th>Был в сети</th>
                <th>Нанят</th>
                <th>Право на новости</th>
                <th>Право на документы</th>
                <th>Новый пароль</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {employeesFiltered.map((emp) => {
                const isEditing = editingId === emp.id;
                const pwd = passwords[emp.id] ?? '';
                const pwdErr = passwordErrors[emp.id] ?? '';

                if (isEditing && editData) {
                  return (
                    <tr key={emp.id}>
                      <td>{emp.id}</td>
                      <td><input type="text" value={editData.full_name} onChange={(e) => handleEditFieldChange('full_name', e.target.value)} /></td>
                      <td><input type="text" value={editData.login} maxLength={8} onChange={(e) => handleEditFieldChange('login', e.target.value)} /></td>
                      <td><input type="email" value={editData.email} onChange={(e) => handleEditFieldChange('email', e.target.value)} /></td>
                      <td>
                        <select value={editData.roleCode} onChange={(e) => handleEditFieldChange('roleCode', e.target.value)}>
                          <option value="employee">Сотрудник</option>
                          <option value="moderator">Модератор</option>
                          <option value="admin">Администратор</option>
                        </select>
                      </td>
                      <td><input type="text" value={editData.position_title} onChange={(e) => handleEditFieldChange('position_title', e.target.value)} /></td>
                      <td><input type="text" value={editData.phone} onChange={(e) => handleEditFieldChange('phone', e.target.value)} /></td>
                      <td><input type="text" value={editData.telegram} onChange={(e) => handleEditFieldChange('telegram', e.target.value)} /></td>
                      <td><input type="text" value={editData.passport_data} onChange={(e) => handleEditFieldChange('passport_data', e.target.value)} /></td>
                      <td>{formatLastActivity(emp.last_activity_at)}</td>
                      <td><input type="date" value={editData.hired_date} onChange={(e) => handleEditFieldChange('hired_date', e.target.value)} /></td>
                      <td>{hasNewsRight(emp) ? 'Да' : 'Нет'}</td>
                      <td>
                        <label className="admin-checkbox-label-inline">
                          <input
                            type="checkbox"
                            checked={editData.can_manage_documents}
                            onChange={(e) => handleEditFieldChange('can_manage_documents', e.target.checked)}
                          />
                          <span>{editData.can_manage_documents ? 'может' : 'не может'}</span>
                        </label>
                      </td>
                      <td>—</td>
                      <td>
                        <button type="button" className="btn-primary" onClick={() => saveEdit(emp.id)} style={{ marginRight: '8px' }}>
                          Сохранить
                        </button>
                        <button type="button" onClick={cancelEdit} style={{ marginRight: '8px' }}>
                          Отмена
                        </button>
                      </td>
                    </tr>
                  );
                }

                return (
                  <tr key={emp.id}>
                    <td>{emp.id}</td>
                    <td>{emp.full_name}</td>
                    <td>{emp.login}</td>
                    <td>{emp.email}</td>
                    <td>{getRolesRu(emp)}</td>
                    <td>{emp.position_title}</td>
                    <td>{getPhone(emp)}</td>
                    <td>{getTelegram(emp)}</td>
                    <td>{getPassport(emp)}</td>
                    <td>{formatLastActivity(emp.last_activity_at)}</td>
                    <td>{emp.hired_at ? new Date(emp.hired_at).toLocaleDateString('ru-RU') : '—'}</td>
                    <td>{hasNewsRight(emp) ? 'Да' : 'Нет'}</td>
                    <td>
                      <label className="admin-checkbox-label-inline">
                        <input
                          type="checkbox"
                          checked={!!emp.can_manage_documents}
                          onChange={() => handleToggleDocsPermission(emp)}
                        />
                        <span>{emp.can_manage_documents ? 'может' : 'не может'}</span>
                      </label>
                    </td>
                    <td>
                      <input
                        type="password"
                        maxLength={8}
                        value={pwd}
                        onChange={(e) => handlePasswordChange(emp.id, e.target.value)}
                        placeholder="8 цифр"
                        className="admin-password-input"
                      />
                      {pwdErr && <div className="admin-password-error">{pwdErr}</div>}
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <button
                          type="button"
                          className="btn-primary"
                          onClick={() => handlePasswordChangeWithConfirm(emp)}
                          style={{ width: '100%' }}
                        >
                          Сменить пароль
                        </button>
                        <button
                          type="button"
                          onClick={() => startEdit(emp)}
                          className="admin-edit-btn"
                          style={{ width: '100%' }}
                        >
                          Изменить
                        </button>
                        <button
                          type="button"
                          onClick={() => openDeleteModal(emp)}
                          className="btn-danger"
                          style={{ width: '100%' }}
                        >
                          Удалить
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
</div>
        </section>
      </main>

      {/* Модальное окно подтверждения смены пароля */}
      {confirmModal && (
        <div className="modal">
          <div className="modal-content">
            <span className="close" onClick={() => setConfirmModal(null)}>&times;</span>
            <h3>{confirmModal.title}</h3>
            <p>{confirmModal.message}</p>
            <div className="admin-modal-buttons">
              <button className="btn-primary" onClick={() => {
                confirmModal.onConfirm();
                setConfirmModal(null);
              }}>
                Да
              </button>
              <button className="btn-secondary" onClick={() => setConfirmModal(null)}>
                Нет
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно подтверждения удаления */}
      {deleteModal && (
        <div className="modal">
          <div className="modal-content">
            <span className="close" onClick={() => setDeleteModal(null)}>&times;</span>
            <h3>{deleteModal.title}</h3>
            <p>{deleteModal.message}</p>
            <div className="admin-modal-buttons">
              <button
                className="btn-danger"
                onClick={handleDeleteEmployee}
                style={{ flex: 1 }}
              >
                Удалить
              </button>
              <button
                className="btn-secondary"
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

export default AdminUsers;