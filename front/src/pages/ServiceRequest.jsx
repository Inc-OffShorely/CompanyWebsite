// src/pages/ServiceRequest.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { servicesConfig } from '../servicesConfig';
import '../App.css';
import { API_BASE_URL } from '../config';

function ServiceRequest() {
    const { serviceId } = useParams();
    const navigate = useNavigate();

    const serviceConfig = servicesConfig[serviceId];

    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        size: '',
        message: '',
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [requestCode, setRequestCode] = useState('');
    const [countdown, setCountdown] = useState(10); // отсчет 10 секунд

    // редирект, если услуга не найдена
    useEffect(() => {
        if (!serviceConfig) {
            navigate('/services', { replace: true });
        }
    }, [serviceConfig, navigate]);

    // заголовок страницы
    useEffect(() => {
        if (serviceConfig) {
            document.title = `Заявка: ${serviceConfig.title} | MeowMeow`;
        }
    }, [serviceConfig]);

    // Таймер для автоматического редиректа
    useEffect(() => {
        let timer;
        if (isSuccess && countdown > 0) {
            timer = setTimeout(() => {
                setCountdown(prev => prev - 1);
            }, 1000);
        } else if (isSuccess && countdown === 0) {
            navigate('/'); // Перенаправление на главную через 10 секунд
        }
        return () => clearTimeout(timer);
    }, [isSuccess, countdown, navigate]);

    if (!serviceConfig) {
        return (
            <div
                className="container"
                style={{ padding: '60px 0', textAlign: 'center' }}
            >
                <h2>Услуга не найдена</h2>
                <p>Пожалуйста, вернитесь на страницу услуг.</p>
                <Link to="/services" className="btn-primary">
                    К услугам
                </Link>
            </div>
        );
    }

    const { title, description, needsSize } = serviceConfig;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isSubmitting) return;

        if (!formData.name || !formData.phone) {
            alert('Пожалуйста, заполните обязательные поля.');
            return;
        }

        if (needsSize && !formData.size) {
            alert('Пожалуйста, выберите размер одежды.');
            return;
        }

        setIsSubmitting(true);

        // комментарий + размер (если нужен) кладём в comment
        const comment =
            needsSize
                ? `Размер: ${formData.size || 'не указан'}\n${formData.message || ''}`
                : formData.message || '';

        // имена полей в snake_case — под SNAKE_CASE Jackson в бэке
        const payload = {
            service_name: serviceConfig.title,
            customer_name: formData.name,
            phone: formData.phone,
            email: formData.email,
            comment: comment,
            size: needsSize ? formData.size : null,
        };

        try {
            const response = await fetch(`${API_BASE_URL}/public/service-requests`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            console.log('SR response status:', response.status);

            if (!response.ok) {
                const errText = await response.text();
                console.log('SR error body:', errText);
                alert('Не удалось отправить заявку. Попробуйте ещё раз.');
                return;
            }

            // тут уже точно 2xx
            const data = await response.json();
            console.log('SR data:', data);

            // Сохраняем код заявки
            setRequestCode(data.requestCode);
            // Показываем успешное сообщение
            setIsSuccess(true);
            // Сохраняем в sessionStorage
            sessionStorage.setItem('lastServiceRequest', JSON.stringify(data));

            // Очищаем форму
            setFormData({
                name: '',
                phone: '',
                email: '',
                size: '',
                message: '',
            });

        } catch (err) {
            console.error('Ошибка при отправке заявки:', err);
            alert('Ошибка подключения к серверу. Попробуйте позже.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Функция для отмены таймера и ручного перехода
    const handleManualRedirect = (path = '/') => {
        navigate(path);
    };

    return (
        <main className="container">
            <section className="hero">
                <h2>Заявка на услугу</h2>
                <h3>{title}</h3>
                <p>{description}</p>
            </section>

            {isSuccess ? (
                <section className="success-section">
                    <div className="container" style={{ maxWidth: '600px', margin: '0 auto' }}>
                        <h2>Заявка успешно отправлена!</h2>

                        {requestCode && (
                            <div className="request-code-container">
                                <span className="request-code-label">Номер вашей заявки:</span>
                                <div className="request-code">{requestCode}</div>
                            </div>
                        )}

                        <p className="success-message-text">
                            Мы свяжемся с вами в ближайшее время для уточнения деталей.
                        </p>

                        <div className="countdown-container">
                            <span className="countdown-text">
                                Через {countdown} секунд вы будете автоматически перенаправлены на главную страницу.
                            </span>
                            <div className="countdown-progress-container">
                                <div
                                    className="countdown-progress-bar"
                                    style={{ width: `${(countdown / 10) * 100}%` }}
                                />
                            </div>
                            <span className="countdown-seconds">{countdown} сек</span>
                        </div>

                        <div className="success-actions">
                            <button
                                onClick={() => setIsSuccess(false)}
                                className="btn-secondary gray"
                            >
                                Отправить ещё одну заявку
                            </button>
                        </div>

                        <div className="contact-info">
                            <p>Если у вас есть вопросы, звоните: +7 (XXX) XXX-XX-XX</p>
                            <p>Email: support@meowmeow.ru</p>
                        </div>
                    </div>
                </section>
            ) : (
                <section className="request-form-section">
                    <form onSubmit={handleSubmit} className="request-form">
                        <div className="form-group-request">
                            <label htmlFor="name">Ваше имя *</label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-group-request">
                            <label htmlFor="phone">Номер телефона *</label>
                            <input
                                type="tel"
                                id="phone"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                placeholder="+7 (999) 999-99-99"
                                required
                            />
                        </div>

                        <div className="form-group-request">
                            <label htmlFor="email">Email</label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="example@meowmeow.ru"
                            />
                        </div>

                        {needsSize && (
                            <div className="form-group-request">
                                <label htmlFor="size">Размер одежды *</label>
                                <select
                                    id="size"
                                    name="size"
                                    value={formData.size}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="">Выберите размер</option>
                                    <option value="XS">XS</option>
                                    <option value="S">S</option>
                                    <option value="M">M</option>
                                    <option value="L">L</option>
                                    <option value="XL">XL</option>
                                    <option value="XXL">XXL</option>
                                    <option value="Другой">Указать в комментарии</option>
                                </select>
                            </div>
                        )}

                        <div className="form-group-request">
                            <label htmlFor="message">Комментарий</label>
                            <textarea
                                id="message"
                                name="message"
                                rows="4"
                                value={formData.message}
                                onChange={handleChange}
                                placeholder="Уточните детали: цвет, ткань, пожелания..."
                            ></textarea>
                        </div>

                        <button
                            type="submit"
                            className="btn-primary"
                            disabled={isSubmitting}
                            style={{ position: 'relative' }}
                        >
                            {isSubmitting ? (
                                <>
                                    <span>Отправка...</span>
                                    <span style={{
                                        marginLeft: '10px',
                                        display: 'inline-block',
                                        width: '16px',
                                        height: '16px',
                                        border: '2px solid rgba(255,255,255,0.3)',
                                        borderTop: '2px solid white',
                                        borderRadius: '50%',
                                        animation: 'spin 1s linear infinite'
                                    }}></span>
                                </>
                            ) : 'Отправить заявку'}
                        </button>
                    </form>
                </section>
            )}
        </main>
    );
}

export default ServiceRequest;