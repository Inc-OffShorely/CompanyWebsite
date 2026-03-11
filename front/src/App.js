// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import SessionTimeoutModal from './components/SessionTimeoutModal/SessionTimeoutModal';
import LeftSidebar from './components/LeftSidebar/LeftSidebar';
import Footer from './components/Footer';
import './styles/style.css'

// Импорт страниц
import AboutCompany from './pages/AboutCompany';
import MainPage from './pages/MainPage';
import ServiceRequest from './pages/ServiceRequest';

import Login from './pages/Login';
import RequireRole from './components/RequireRole';

import Lk from './pages/Lk';
import AdminUsers from './pages/AdminUsers';
import Booking from './pages/Booking';
import Calendar from './pages/Calendar';
import Documents from './pages/Documents';
import TechSupport from './pages/TechSupport';
import News from './pages/News';
import EditingNews from './pages/EditingNews';
import ServiceRequestWork from './pages/ServiceRequestWork';

const LkPage = ({ children }) => (
  <div className="dashboard-layout">
    <LeftSidebar />
    <div className="dashboard-content">
      {children}
    </div>
    <SessionTimeoutModal />
  </div>
);

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* ===== ПУБЛИЧНЫЕ СТРАНИЦЫ (с обычным хедером) ===== */}

          <Route path="/" element={
            <>
              <Header navType="default" />
              <MainPage />
              <Footer />
            </>
          } />

          <Route path="/mainpage" element={
            <>
              <Header navType="default" />
              <MainPage />
              <Footer />
            </>
          } />

          <Route path="/servicesrequest/:serviceId" element={
            <>
              <Header navType="default" />
              <ServiceRequest />
              <Footer />
            </>
          } />

          <Route path="/about" element={
            <>
              <Header navType="aboutcompany" />
              <AboutCompany />
              <Footer />
            </>
          } />

          <Route path="/login" element={
            <>
              <Login />
            </>
          } />

          {/* ===== ПРИВАТНЫЕ СТРАНИЦЫ ЛК (с LeftSidebar) ===== */}

          {/* Страницы доступные всем авторизованным */}
          <Route path="/lk" element={
            <RequireRole>
              <LkPage><Lk /></LkPage>
            </RequireRole>
          } />

          <Route path="/documents" element={
            <RequireRole>
              <LkPage><Documents /></LkPage>
            </RequireRole>
          } />

          <Route path="/calendar" element={
            <RequireRole>
              <LkPage><Calendar /></LkPage>
            </RequireRole>
          } />

          <Route path="/news" element={
            <RequireRole>
              <LkPage><News /></LkPage>
            </RequireRole>
          } />

          {/* Страницы для сотрудников, модераторов и админов */}
          <Route path="/booking" element={
            <RequireRole allowedRoles={['employee', 'moderator', 'admin']}>
              <LkPage><Booking /></LkPage>
            </RequireRole>
          } />

          <Route path="/servicerequestwork" element={
            <RequireRole allowedRoles={['employee', 'moderator', 'admin']}>
              <LkPage><ServiceRequestWork /></LkPage>
            </RequireRole>
          } />

          <Route path="/techsupport" element={
            <RequireRole allowedRoles={['employee', 'moderator', 'admin']}>
              <LkPage><TechSupport /></LkPage>
            </RequireRole>
          } />

          {/* Страницы для модераторов и админов */}
          <Route path="/editingnews" element={
            <RequireRole allowedRoles={['moderator', 'admin']}>
              <LkPage><EditingNews /></LkPage>
            </RequireRole>
          } />
          <Route
            path="/editingnews/:id"
            element={
              <RequireRole allowedRoles={['moderator', 'admin']}>
                <LkPage><EditingNews /></LkPage>
              </RequireRole>
            }
          />
          <Route path="/adminusers" element={
            <RequireRole minRole="admin">
              <LkPage><AdminUsers /></LkPage>
            </RequireRole>
          } />


        </Routes>
      </div>
    </Router>
  );
}

export default App;