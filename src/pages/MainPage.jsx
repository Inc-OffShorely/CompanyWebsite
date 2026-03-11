// src/pages/MainPage.jsx
import React, { useEffect, useState, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { NewsData } from '../data/NewsData';
import '../styles/style.css';
import { API_BASE_URL } from '../config';

function MainPage() {
  const [expandedNews, setExpandedNews] = useState(null);

  // === Состояния трекинга заявки ===
  const [orderNumber, setOrderNumber] = useState('');
  const [trackedOrder, setTrackedOrder] = useState(null);
  const [trackError, setTrackError] = useState('');
  const [trackLoading, setTrackLoading] = useState(false);

  const serviceCardRefs = useRef([]);

  const location = useLocation();

  // Состояния для формы обратной связи
  const [feedback, setFeedback] = useState({
    phone: '',
    email: '',
    fullname: '',
    question: ''
  });
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [feedbackError, setFeedbackError] = useState('');
  const mapStatus = (status) => {
    if (!status) return '—';
    switch (status.toLowerCase()) {
      case 'accepted':
        return 'Принята';
      case 'in_progress':
        return 'В работе';
      case 'completed':
        return 'Выполнена';
      case 'rejected':
        return 'Отклонена';
      default:
        return status;
    }
  };

  useEffect(() => {
    document.title = 'MeowMeow';

    // Обработка якорных ссылок при загрузке страницы
    if (location.hash) {
      const id = location.hash.replace('#', '');
      const element = document.getElementById(id);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }, 100);
      }
    }
  }, [location]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const tooltip = entry.target.querySelector('.service-tooltip');
            if (tooltip && !tooltip.classList.contains('revealed')) {
              tooltip.classList.add('revealed');
            }
            // Опционально: отключить наблюдение после появления
            // observer.unobserve(entry.target);
          }
        });
      },
      {
        rootMargin: '-50% 0px -50% 0px' // срабатывает, когда карточка попадает в центр экрана
      }
    );

    const cards = document.querySelectorAll('.service-card, .service-card-right');
    cards.forEach((card) => observer.observe(card));

    return () => {
      cards.forEach((card) => observer.unobserve(card));
    };
  }, []);

  const toggleNews = (id) => {
    if (expandedNews === id) {
      setExpandedNews(null);
    } else {
      setExpandedNews(id);
    }
  };

  // === НОВАЯ логика трекинга: запрос на бэк ===
  const handleTrackOrder = async (e) => {
    e.preventDefault();
    setTrackError('');
    setTrackedOrder(null);

    const code = orderNumber.trim();
    if (!code) {
      setTrackError('Пожалуйста, введите номер заказа');
      return;
    }

    setTrackLoading(true);
    try {
      const res = await fetch(
        `${API_BASE_URL}/public/service-requests/${encodeURIComponent(code)}`, {
        method: 'GET',
        credentials: 'include',
      }
      );

      if (res.status === 404) {
        setTrackError('Заказ с таким номером не найден');
        return;
      }

      if (!res.ok) {
        setTrackError('Ошибка при запросе статуса заявки');
        return;
      }

      const data = await res.json();
      // data = ServiceRequestResponseDto с бэка
      setTrackedOrder(data);
    } catch (err) {
      console.error(err);
      setTrackError('Не удалось подключиться к серверу');
    } finally {
      setTrackLoading(false);
    }
  };

  const resetTracking = () => {
    setOrderNumber('');
    setTrackedOrder(null);
    setTrackError('');
  };

  // Обработчики для формы обратной связи
  const handleFeedbackChange = (e) => {
    const { name, value } = e.target;
    setFeedback((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFeedbackSubmit = (e) => {
    e.preventDefault();
    setFeedbackError('');

    // Валидация формы
    if (!feedback.phone.trim()) {
      setFeedbackError('Пожалуйста, укажите телефон');
      return;
    }
    if (!feedback.email.trim()) {
      setFeedbackError('Пожалуйста, укажите email');
      return;
    }

    if (!feedback.fullname.trim()) {
      setFeedbackError('Пожалуйста, укажите ФИО');
      return;
    }

    if (!feedback.question.trim()) {
      setFeedbackError('Пожалуйста, опишите ваш вопрос');
      return;
    }

    if (
      feedback.phone.trim() &&
      !/^[\+]?[78][-(]?\d{3}\)?-?\d{3}-?\d{2}-?\d{2}$/.test(
        feedback.phone.replace(/\s/g, '')
      )
    ) {
      setFeedbackError('Пожалуйста, введите корректный номер телефона');
      return;
    }

    if (
      feedback.email.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(feedback.email)
    ) {
      setFeedbackError('Пожалуйста, введите корректный email');
      return;
    }

    // Здесь будет отправка данных на сервер
    console.log('Данные обратной связи:', feedback);

    // Имитация успешной отправки
    setFeedbackSent(true);
    setFeedback({
      phone: '',
      email: '',
      fullname: '',
      question: ''
    });

    // Сбрасываем сообщение об успехе через 5 секунд
    setTimeout(() => {
      setFeedbackSent(false);
    }, 5000);
  };

  const resetFeedback = () => {
    setFeedback({
      phone: '',
      email: '',
      fullname: '',
      question: ''
    });
    setFeedbackSent(false);
    setFeedbackError('');
  };

  return (
    <main className="container">
      <section className="news" id="mainpage_id">
        <section className="hero">
          <h2>События нашего бренда</h2>
        </section>

        <section className="news-list-img">
          <div className="news-overlay">
            <h2 className="news-overlay-title">Коллаборация MoewMoew x Nike</h2>
            <p className="news-overlay-description-img">
              Теперь при заполнении заявки на услугу вы можете написать про желание получить одежду и акссесуары из коллаборации с Nike! Также при получении заказа вы получите подарок!
            </p>
          </div>
        </section>
      </section>

      <section className="services">
        <section className="hero">
          <h2 id="services_id">Наши услуги</h2>
          <p>
            В «MeowMeow» мы не просто шьём одежду — мы создаём уют, который
            можно носить. Наши услуги разработаны с любовью к комфорту и
            индивидуальности каждого клиента.
          </p>
        </section>

        <section className="services-list">
          {/* Услуга 1 — Индивидуальный пошив */}
          <div className="service-card custom">
            <h3>Индивидуальный пошив</h3>
            <div className="service-tooltip">
              <p>Создание одежды по вашим меркам и пожеланиям: от выбора ткани и фасона до мелких деталей. Идеально для тех, кто ценит комфорт и эксклюзивность.</p>
            </div>
            <Link to="/servicesrequest/individual" className="service-btn">
              Заказать
            </Link>
          </div>

          {/* Услуга 2 — Оптовая продажа */}
          <div className="service-card-right wholesale">
            <h3>Оптовая продажа</h3>
            <div className="service-tooltip">
              <p>Поставка нашей фирменной одежды оптом для магазинов, бутиков и онлайн-ритейлеров. Гибкие условия, стабильное качество и сезонные коллекции.</p>
            </div>
            <Link to="/servicesrequest/wholesale" className="service-btn">
              Заказать
            </Link>
          </div>

          {/* Услуга 3 — Корпоративный мерч */}
          <div className="service-card merch">
            <h3>Разработка корпоративного мерча</h3>
            <div className="service-tooltip">
              <p>Уникальная одежда с логотипом вашей компании: футболки, худи, рубашки и аксессуары для сотрудников, мероприятий или клиентов. Укрепляем корпоративную идентичность с теплом и стилем.</p>
            </div>
            <Link to="/servicesrequest/corporate" className="service-btn">
              Заказать
            </Link>
          </div>

          {/* Услуга 4 — Консультация по стилю */}
          <div className="service-card-right consultation">
            <h3>Консультация по стилю</h3>
            <div className="service-tooltip">
              <p>Персональная очная или дистанционная встреча с нашим стилистом, чтобы подобрать одежду, которая подчеркнёт вашу индивидуальность, фигуру и образ жизни. Включает рекомендации по цвету, покрою и комплектации образа.</p>
            </div>
            <Link to="/servicesrequest/style" className="service-btn">
              Заказать
            </Link>
          </div>
        </section>
      </section>

      {/* Секция трекера заказа */}
      <section className="track_order" id="track_order_id">
        <h2>Отслеживание заказа</h2>
        <p>Введите номер вашего заказа, чтобы узнать его текущий статус</p>

        <form onSubmit={handleTrackOrder} className="track-order-form">
          <div className="form-group">
            <input
              type="text"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              placeholder="Например: ИП-04-12-2025-5880"
              className="order-input"
            />
            <button type="submit" className="track-btn" disabled={trackLoading}>
              {trackLoading ? 'Поиск...' : 'Отследить'}
            </button>
          </div>
        </form>

        {trackError && <div className="track-error">{trackError}</div>}

        {trackedOrder && (
          <div className="order-info">
            <h3>Информация о заказе</h3>
            <div className="order-details">
              <div className="order-row">
                <span className="order-label">Номер заказа:</span>
                <span className="order-value">{trackedOrder.requestCode}</span>
              </div>
              <div className="order-row">
                <span className="order-label">Тип услуги:</span>
                <span className="order-value">{trackedOrder.serviceName}</span>
              </div>
              <div className="order-row">
                <span className="order-label">ФИО заказчика:</span>
                <span className="order-value">{trackedOrder.customerName}</span>
              </div>
              <div className="order-row">
                <span className="order-label">Телефон:</span>
                <span className="order-value">{trackedOrder.phone}</span>
              </div>
              <div className="order-row">
                <span className="order-label">Email:</span>
                <span className="order-value">{trackedOrder.email}</span>
              </div>

              {/* НОВОЕ: Размер */}
              <div className="order-row">
                <span className="order-label">Размер:</span>
                <span className="order-value">{trackedOrder.size || '—'}</span>
              </div>

              <div className="order-row">
                <span className="order-label">Дата заказа:</span>
                <span className="order-value">
                  {trackedOrder.createdAt
                    ? new Date(trackedOrder.createdAt).toLocaleDateString('ru-RU')
                    : '—'}
                </span>
              </div>
              <div className="order-row">
                <span className="order-label">Статус:</span>
                <span
                  className={`order-status order-status-${trackedOrder.status?.toLowerCase?.()}`}
                >
                  {mapStatus(trackedOrder.status)}
                </span>
              </div>
            </div>
            <button onClick={resetTracking} className="track-new-btn">
              Отследить другой заказ
            </button>
          </div>
        )}

      </section>

      {/* Секция обратной связи */}
      <section className="feedback" id="feedback_id">
        <h2>Обратная связь</h2>
        <p>
          Возникли вопросы при использовании сайта? Напишите нам, и мы
          обязательно поможем!
        </p>

        {feedbackSent ? (
          <div className="feedback-success">
            <h3>Спасибо за ваше сообщение!</h3>
            <p>Мы получили ваш вопрос и свяжемся с вами в ближайшее время.</p>
            <button onClick={resetFeedback} className="new-feedback-btn">
              Отправить новый вопрос
            </button>
          </div>
        ) : (
          <form onSubmit={handleFeedbackSubmit} className="feedback-form">
            <div className="form-group">
              <label htmlFor="fullname">ФИО</label>
              <input
                type="fullname"
                id="fullname"
                name="fullname"
                value={feedback.fullname}
                onChange={handleFeedbackChange}
                className="form-input"
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="phone">Телефон</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={feedback.phone}
                  onChange={handleFeedbackChange}
                  placeholder="+7 (XXX) XXX-XX-XX"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={feedback.email}
                  onChange={handleFeedbackChange}
                  placeholder="your@email.com"
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-group form-group-textarea">
              <label htmlFor="question">Ваш вопрос</label>
              <textarea
                id="question"
                name="question"
                value={feedback.question}
                onChange={handleFeedbackChange}
                placeholder="Опишите ваш вопрос или проблему, с которой столкнулись..."
                rows="5"
                className="form-textarea"
              ></textarea>
            </div>

            <div className="form-note">
              <p>
                ⚠️ Пожалуйста, укажите хотя бы один способ связи: телефон или
                email
              </p>
            </div>

            {feedbackError && (
              <div className="feedback-error">{feedbackError}</div>
            )}

            <div className="form-actions">
              <button type="submit" className="submit-btn">
                Отправить вопрос
              </button>
            </div>
          </form>
        )}
      </section>
    </main>
  );
}

export default MainPage;