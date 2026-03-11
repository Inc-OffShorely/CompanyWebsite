// src/components/Header.jsx
import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Header.css';

function Header({ navType = 'default' }) {
  const location = useLocation();

  const headerClassName = `header header-${navType}`;

  // Общий обработчик для якорных ссылок
  const handleAnchorClick = (e, anchorId, pagePath) => {
    const currentPath = location.pathname;

    // Если мы уже на нужной странице
    if (currentPath === pagePath || currentPath === `${pagePath}/`) {
      e.preventDefault();
      const element = document.getElementById(anchorId);
      if (element) {
        element.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    }
    // Если нет - React Router обработает переход
  };

  const renderNav = () => {
    switch (navType) {
      case 'aboutcompany':
        return (
          <nav className="nav">
            <div className="aboutlink">
              <Link
                to="/about#aboutcompany_id"
                onClick={(e) => handleAnchorClick(e, 'aboutcompany_id', '/about')}
              >
                О компании
              </Link>
            </div>
            <div className="historylink">
              <Link
                to="/about#history_id"
                onClick={(e) => handleAnchorClick(e, 'history_id', '/about')}
              >
                Наша история
              </Link>
            </div>
            <div className="whyuslink">
              <Link
                to="/about#whyus_id"
                onClick={(e) => handleAnchorClick(e, 'whyus_id', '/about')}
              >
                Почему выбирают нас
              </Link>
            </div>
            <div className="processlink">
              <Link
                to="/about#process_id"
                onClick={(e) => handleAnchorClick(e, 'process_id', '/about')}
              >
                Как мы собираем ваш образ
              </Link>
            </div>
          </nav>
        );
      default:
        return (
          <nav className="nav">
            <div className="serviceslink">
              <Link
                to="/mainpage#services_id"
                onClick={(e) => handleAnchorClick(e, 'services_id', '/mainpage')}
              >
                Услуги
              </Link>
            </div>
            <div className="track_orderlink">
              <Link
                to="/mainpage#track_order_id"
                onClick={(e) => handleAnchorClick(e, 'track_order_id', '/mainpage')}
              >
                Отследить заказ
              </Link>
            </div>
            <div className="feedbacklink">
              <Link
                to="/mainpage#feedback_id"
                onClick={(e) => handleAnchorClick(e, 'feedback_id', '/mainpage')}
              >
                Обратная связь
              </Link>
            </div>
          </nav>
        );
    }
  };

  useEffect(() => {
    document.title = 'MeowMeow';
  }, []);

  // Если это страница ЛК, не рендерим обычный хедер
  if (navType === 'lk') {
    return null; // Или можно возвращать минимальный хедер
  }

  return (
    <header className={headerClassName}>
      <div className="header-content">
        <Link to="/mainpage#mainpage_id" className={`company-name ${navType}-company-name`}>MeowMeow</Link>
        {renderNav()}
      </div>
    </header>
  );
}

export default Header;