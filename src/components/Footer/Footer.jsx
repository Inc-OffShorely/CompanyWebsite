// src/pages/MainPage.jsx
import React, { useEffect } from 'react';
import { NavLink, Link } from 'react-router-dom';
import './Footer.css';

function Footer() {

  useEffect(() => {
    document.title = 'MeowMeow';
  }, []);

  return (
    <footer>
      <div className="footer-ul">
        <Link to="/about" className="footer-aboutcompany"><p className="ul-name">О компании</p></Link>
        <ul>
          <li>Наша история</li>
          <li>Почему выбирают нас</li>
          <li>Как мы собираем ваш образ</li>
        </ul>
      </div>
      <div className="footer-login">
        {/* <p>&copy; 2025 MeowMeow. Все права защищены.</p> */}
        <Link to="/login" className="footer-login-button">Вход для сотрудников</Link>
      </div>
      <div className="footer-ul">
        <p className="ul-name">Контакты</p>
        <ul>
          <li>Телефон: +7 999 999 99 99</li>
          <li>Эл. почта: meowmeow@gmail.com</li>
          <li>Телеграмм: @MeowMeow_For_You</li>
        </ul>
      </div>
    </footer>
  );
}

export default Footer;