import React, { useState, useEffect } from 'react';
import '../styles/style.css';
import { API_BASE_URL } from '../config';
import { useAuth } from '../hooks/useAuth';

const EditingNews = () => {
    const { user, token: authToken } = useAuth();
    const effectiveToken = authToken || user?.token || null;

    // Состояния
    const [news, setNews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Режимы работы: 'list' (список), 'create' (создание), 'edit' (редактирование), 'delete' (удаление)
    const [mode, setMode] = useState('list');

    // Данные для формы
    const [formData, setFormData] = useState({
        id: '',
        title: '',
        date: '',
        content: ''
    });

    // Для подтверждения удаления
    const [newsToDelete, setNewsToDelete] = useState(null);

    // Загрузка новостей
    useEffect(() => {
  if (mode !== 'list') return;

  // Ждём, пока токен реально появится
  if (!effectiveToken) {
    setLoading(false);
    return;
  }

  loadNews();
}, [mode, effectiveToken]);


    const loadNews = async () => {
  if (!effectiveToken) return;

  setLoading(true);
  setError('');

  try {
    const res = await fetch(`${API_BASE_URL}/news`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${effectiveToken}`,
      },
      credentials: 'include',
    });

    if (res.status === 401 || res.status === 403) {
      throw new Error('Сессия недействительна. Перезайдите в аккаунт.');
    }

    if (!res.ok) throw new Error('Не удалось загрузить новости');

    const data = await res.json();
    setNews(data);
  } catch (err) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
};

    // Обработчики для переключения режимов
    const switchToCreate = () => {
        const today = new Date().toISOString().split('T')[0];
        setFormData({
            id: '',
            title: '',
            date: today,
            content: ''
        });
        setError('');
        setMode('create');
    };

    const switchToEdit = (newsItem) => {
        const publishedDate = newsItem.publishedAt || newsItem.published_at;
        setFormData({
            id: newsItem.id || newsItem.news_id,
            title: newsItem.title || '',
            date: publishedDate ? publishedDate.substring(0, 10) : '',
            content: newsItem.content || ''
        });
        setError('');
        setMode('edit');
    };

    const switchToDelete = (newsItem) => {
        setNewsToDelete(newsItem);
        setMode('delete');
    };

    const switchToList = () => {
        setMode('list');
        setError('');
        setNewsToDelete(null);
    };

    // Обработка изменений в форме
    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (error) setError('');
    };

    // Сохранение новости (создание или редактирование)
    const handleSave = async (e) => {
        if (e) e.preventDefault();

        const { title, date, content } = formData;
        if (!title.trim() || !date || !content.trim()) {
            setError('Все поля обязательны для заполнения.');
            return;
        }

        try {
            const headers = {
                'Content-Type': 'application/json',
                Accept: 'application/json',
            };

            if (effectiveToken) {
                headers.Authorization = `Bearer ${effectiveToken}`;
            }

            let url = `${API_BASE_URL}/news`;
            let method = 'POST';

            if (formData.id) {
                // Редактирование существующей новости
                url = `${API_BASE_URL}/news/${formData.id}`;
                method = 'PUT';
            }

            const response = await fetch(url, {
                method,
                headers,
                credentials: 'include',
                body: JSON.stringify({
                    title: formData.title,
                    content: formData.content,
                    publishedAt: formData.date,
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Ошибка сохранения: ${errorText}`);
            }

            // Возвращаемся к списку и обновляем его
            await loadNews();
            setMode('list');
        } catch (err) {
            setError(err.message);
        }
    };

    // Удаление новости
    const handleDeleteConfirm = async () => {
        if (!newsToDelete) return;

        try {
            const headers = {
                Accept: 'application/json',
            };

            if (effectiveToken) {
                headers.Authorization = `Bearer ${effectiveToken}`;
            }

            const newsId = newsToDelete.id || newsToDelete.news_id;
            const response = await fetch(`${API_BASE_URL}/news/${newsId}`, {
                method: 'DELETE',
                headers,
                credentials: 'include',
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Ошибка удаления: ${errorText}`);
            }

            // Возвращаемся к списку и обновляем его
            await loadNews();
            setMode('list');
        } catch (err) {
            setError(err.message);
        }
    };

    // Форматирование даты
    const formatDate = (isoString) => {
        if (!isoString) return '—';
        try {
            const date = new Date(isoString);
            return date.toLocaleDateString('ru-RU', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
            });
        } catch {
            return '—';
        }
    };

    // Создание краткого описания
    const makeExcerpt = (html) => {
        if (!html) return '';
        const tmp = document.createElement('div');
        tmp.innerHTML = html;
        const text = tmp.textContent || tmp.innerText || '';
        return text.length > 100 ? text.slice(0, 97) + '…' : text;
    };

    // ===== РЕНДЕРИНГ РАЗНЫХ РЕЖИМОВ =====

    // Режим: Список новостей
    if (mode === 'list') {
        return (
            <main className="dashboard-container">
                <section className="dashboard-hero">
                    <h2>Управление новостями</h2>
                    <p>Создание, редактирование и удаление новостей компании.</p>
                </section>

                <div className="news-management-actions">
                    <button
                        className="btn-primary"
                        onClick={switchToCreate}
                    >
                        + Создать новую новость
                    </button>
                </div>

                {error && <div className="message error">{error}</div>}

                {loading ? (
                    <div className="message loading">Загрузка новостей...</div>
                ) : news.length === 0 ? (
                    <div className="message empty">Нет новостей для отображения</div>
                ) : (
                    <div className="news-management-list">
                        {news.map((item) => {
                            const newsId = item.id || item.news_id;
                            const publishedDate = item.publishedAt || item.published_at;

                            return (
                                <div key={newsId} className="news-management-item">
                                    <div className="news-management-header">
                                        <h3>{item.title}</h3>
                                        <time dateTime={publishedDate}>{formatDate(publishedDate)}</time>
                                    </div>

                                    <p className="news-management-excerpt">{makeExcerpt(item.content)}</p>

                                    <div className="news-management-buttons">
                                        <button
                                            className="action-btn edit-btn"
                                            onClick={() => switchToEdit(item)}
                                        >
                                            Редактировать
                                        </button>
                                        <button
                                            className="action-btn delete-btn"
                                            onClick={() => switchToDelete(item)}
                                        >
                                            Удалить
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>
        );
    }

    // Режим: Создание новости
    if (mode === 'create') {
        return (
            <main className="dashboard-container">
                <section className="dashboard-hero">
                    <h2>Создание новости</h2>
                    <p>Заполните форму для публикации новой новости.</p>
                </section>

                <section className="form-section">
                    <form className="login-form" onSubmit={handleSave}>
                        {error && <div className="message error">{error}</div>}

                        <div className="form-group-login">
                            <label htmlFor="title">Заголовок *</label>
                            <input
                                type="text"
                                id="title"
                                value={formData.title}
                                onChange={(e) => handleChange('title', e.target.value)}
                                placeholder="Введите заголовок новости"
                                required
                            />
                        </div>

                        <div className="form-group-login">
                            <label htmlFor="date">Дата публикации *</label>
                            <input
                                type="date"
                                id="date"
                                value={formData.date}
                                onChange={(e) => handleChange('date', e.target.value)}
                                required
                            />
                        </div>

                        <div className="form-group-login">
                            <label htmlFor="content">Текст новости *</label>
                            <textarea
                                id="content"
                                value={formData.content}
                                onChange={(e) => handleChange('content', e.target.value)}
                                placeholder="Основной текст новости..."
                                rows="10"
                                className="form-textarea-description"
                                required
                            />
                        </div>

                        <div className="form-actions">
                            <button
                                type="submit"
                                className="btn-primary"
                            >
                                Опубликовать
                            </button>
                            <button
                                type="button"
                                className="btn-secondary"
                                onClick={switchToList}
                            >
                                Отмена
                            </button>
                        </div>
                    </form>
                </section>
            </main>
        );
    }

    // Режим: Редактирование новости
    if (mode === 'edit') {
        return (
            <main className="dashboard-container">
                <section className="dashboard-hero">
                    <h2>Редактирование новости</h2>
                    <p>Внесите изменения в существующую новость.</p>
                </section>

                <section className="form-section">
                    <form className="login-form" onSubmit={handleSave}>
                        {error && <div className="message error">{error}</div>}

                        <div className="form-group-login">
                            <label htmlFor="title">Заголовок *</label>
                            <input
                                type="text"
                                id="title"
                                value={formData.title}
                                onChange={(e) => handleChange('title', e.target.value)}
                                placeholder="Введите заголовок новости"
                                required
                            />
                        </div>

                        <div className="form-group-login">
                            <label htmlFor="date">Дата публикации *</label>
                            <input
                                type="date"
                                id="date"
                                value={formData.date}
                                onChange={(e) => handleChange('date', e.target.value)}
                                required
                            />
                        </div>

                        <div className="form-group-login">
                            <label htmlFor="content">Текст новости *</label>
                            <textarea
                                id="content"
                                value={formData.content}
                                onChange={(e) => handleChange('content', e.target.value)}
                                placeholder="Основной текст новости..."
                                rows="10"
                                className="form-textarea-description"
                                required
                            />
                        </div>

                        <div className="form-actions">
                            <button
                                type="submit"
                                className="btn-primary"
                            >
                                Сохранить изменения
                            </button>
                            <button
                                type="button"
                                className="btn-secondary"
                                onClick={switchToList}
                            >
                                Отмена
                            </button>
                        </div>
                    </form>
                </section>
            </main>
        );
    }

    // Режим: Подтверждение удаления
    if (mode === 'delete' && newsToDelete) {
        return (
            <main className="dashboard-container">
                <section className="dashboard-hero">
                    <h2>Удаление новости</h2>
                    <p>Вы уверены, что хотите удалить эту новость?</p>
                </section>

                <section className="form-section">
                    <div className="news-management-preview">
                        <h3>{newsToDelete.title}</h3>
                        <p className="news-management-date">
                            <strong>Дата публикации:</strong> {formatDate(newsToDelete.publishedAt || newsToDelete.published_at)}
                        </p>
                        <div
                            className="news-management-content"
                            dangerouslySetInnerHTML={{ __html: newsToDelete.content }}
                        />
                    </div>

                    {error && <div className="message error">{error}</div>}

                    <div className="form-actions">
                        <button
                            type="button"
                            className="btn-primary delete-confirm-btn"
                            onClick={handleDeleteConfirm}
                        >
                            Удалить
                        </button>
                        <button
                            type="button"
                            className="btn-secondary"
                            onClick={switchToList}
                        >
                            Отмена
                        </button>
                    </div>
                </section>
            </main>
        );
    }

    // Запасной вариант
    return (
        <main className="dashboard-container">
            <section className="dashboard-hero">
                <h2>Управление новостями</h2>
                <p>Загрузка...</p>
            </section>
        </main>
    );
};

export default EditingNews;