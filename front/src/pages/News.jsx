// src/pages/News.jsx
import React, { useEffect, useState } from 'react';
import '../styles/style.css';
import { API_BASE_URL } from '../config';
import { useAuth } from '../hooks/useAuth';

function formatDateRu(date) {
    if (!date) return '';
    return date.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });
}

function makeExcerpt(html) {
    if (!html) return '';
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    const text = tmp.textContent || tmp.innerText || '';
    return text.length > 160 ? text.slice(0, 157) + '…' : text;
}

function News() {
    const { user, token: authToken, loading } = useAuth();
    const effectiveToken =
        authToken ??
        user?.token ??
        user?.accessToken ??
        user?.jwt ??
        null;

    const [news, setNews] = useState([]);
    const [expandedNews, setExpandedNews] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        document.title = 'Новости | MeowMeow';
    }, []);

    // загрузка новостей из бэка
    useEffect(() => {
        if (loading) return;

        const loadNews = async () => {
            try {
                const headers = {
                    Accept: 'application/json',
                };

                // ВАЖНО: передаём JWT как на других страницах
                if (effectiveToken) {
                    headers.Authorization = `Bearer ${effectiveToken}`;
                }

                const res = await fetch(`${API_BASE_URL}/news`, {
                    method: 'GET',
                    headers,
                    credentials: 'include',
                });

                if (!res.ok) {
                    console.error('Failed to load news', res.status, await res.text());
                    setError('Не удалось загрузить новости');
                    return;
                }

                const data = await res.json();

                const mapped = data
                    .map((n) => {
                        const publishedRaw = n.publishedAt ?? n.published_at;
                        const dateObj = publishedRaw ? new Date(publishedRaw) : null;

                        return {
                            id: n.id ?? n.news_id,
                            title: n.title,
                            content: n.content,
                            isoDate: publishedRaw,
                            date: dateObj ? formatDateRu(dateObj) : '',
                            excerpt: makeExcerpt(n.content),
                        };
                    })
                    // по убыванию даты публикации
                    .sort((a, b) => {
                        const da = a.isoDate ? new Date(a.isoDate) : 0;
                        const db = b.isoDate ? new Date(b.isoDate) : 0;
                        return db - da;
                    });

                setNews(mapped);
            } catch (e) {
                console.error('Error while loading news', e);
                setError('Не удалось загрузить новости');
            }
        };

        loadNews();
    }, [loading, effectiveToken]);

    const toggleNews = (id) => {
        setExpandedNews((prev) => (prev === id ? null : id));
    };

    return (
        <section className="news">
            <section className="dashboard-hero">
                <h2>Новости</h2>
                <p>Следите за всеми новостями от компании «MeowMeow».</p>
            </section>

            <section className="news-list">
                {error && (
                    <p style={{ marginTop: '16px' }}>{error}</p>
                )}

                {!error && news.length === 0 && (
                    <p style={{ marginTop: '16px' }}>Пока нет новостей</p>
                )}

                {news.map((item) => (
                    <article key={item.id} className="news-item">
                        <div className="news-header">
                            <h3>
                                <button
                                    className="news-title-btn"
                                    onClick={() => toggleNews(item.id)}
                                    aria-expanded={expandedNews === item.id}
                                >
                                    {item.title}
                                    <span className="news-toggle-icon">
                                        {expandedNews === item.id ? '−' : '+'}
                                    </span>
                                </button>
                            </h3>
                            <time dateTime={item.isoDate}>{item.date}</time>
                        </div>

                        <p className="news-excerpt">{item.excerpt}</p>

                        {expandedNews === item.id && (
                            <div className="news-full-content">
                                <div
                                    className="news-content"
                                    dangerouslySetInnerHTML={{ __html: item.content }}
                                />
                                <button
                                    className="news-hide-btn"
                                    onClick={() => setExpandedNews(null)}
                                >
                                    Скрыть подробности
                                </button>
                            </div>
                        )}
                    </article>
                ))}
            </section>
        </section>
    );
}

export default News;
