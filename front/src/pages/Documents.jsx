// src/pages/Documents.jsx

import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import '../styles/style.css';
import { API_BASE_URL } from '../config';

function Documents() {
   useEffect(() => {
      document.title = 'Документы | MeowMeow';
   }, []);

   const { token, user, loading } = useAuth();
   const [docs, setDocs] = useState([]);
   const [loadingDocs, setLoadingDocs] = useState(false);
   const [error, setError] = useState(null);
   const [uploadFile, setUploadFile] = useState(null);
   const [uploading, setUploading] = useState(false);

   // === Модальное окно удаления ===
   const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
   const [deleteTarget, setDeleteTarget] = useState(null); // имя файла для удаления

   // Возвращаем проверку прав из documentswithauth.jsx
   const canEdit =
      user &&
      (user.role === 'admin' ||
         user.role === 'moderator' ||
         user.can_manage_documents === true);

   // загрузка списка документов с проверкой авторизации
   useEffect(() => {
      if (!token) return; // Возвращаем проверку токена

      const load = async () => {
         setLoadingDocs(true);
         setError(null);
         try {
            const resp = await fetch(`${API_BASE_URL}/documents`, {
               headers: {
                  Authorization: `Bearer ${token}`,
               },
            });

            if (!resp.ok) {
               throw new Error(`Ошибка сервера: ${resp.status}`);
            }

            const json = await resp.json();
            setDocs(json);
         } catch (e) {
            console.error('Ошибка загрузки документов:', e);
            setError('Не удалось загрузить список документов.');
         } finally {
            setLoadingDocs(false);
         }
      };

      load();
   }, [token]);

   const formatSize = (bytes) => {
      if (bytes == null) return '';
      if (bytes < 1024) return `${bytes} Б`;
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} КБ`;
      return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`;
   };

   const handleView = async (name) => {
      if (!token) return; // Добавляем проверку токена

      const lower = name.toLowerCase();

      if (lower.endsWith('.docx')) {
         await handleDownload(name);
         return;
      }

      if (lower.endsWith('.pdf')) {
         try {
            const resp = await fetch(
               `${API_BASE_URL}/documents/${encodeURIComponent(name)}?download=false`,
               {
                  headers: {
                     Authorization: `Bearer ${token}`,
                  },
               }
            );

            if (!resp.ok) {
               console.error('Ошибка просмотра документа:', resp.status);
               alert(`Не удалось открыть документ (код ${resp.status}).`);
               return;
            }

            const blob = await resp.blob();
            const url = window.URL.createObjectURL(blob);
            window.open(url, '_blank');
            setTimeout(() => window.URL.revokeObjectURL(url), 60_000);
         } catch (e) {
            console.error('Ошибка просмотра документа:', e);
            alert('Не удалось открыть документ.');
         }
         return;
      }

      await handleDownload(name);
   };

   const handleDownload = async (name) => {
      if (!token) return; // Добавляем проверку токена
      try {
         const resp = await fetch(
            `${API_BASE_URL}/documents/${encodeURIComponent(name)}?download=true`,
            {
               headers: {
                  Authorization: `Bearer ${token}`,
               },
            }
         );

         if (!resp.ok) {
            console.error('Ошибка скачивания документа:', resp.status);
            alert(`Не удалось скачать документ (код ${resp.status}).`);
            return;
         }

         const blob = await resp.blob();
         const url = window.URL.createObjectURL(blob);

         const a = document.createElement('a');
         a.href = url;
         a.download = name;
         document.body.appendChild(a);
         a.click();
         a.remove();
         window.URL.revokeObjectURL(url);
      } catch (e) {
         console.error('Ошибка скачивания документа:', e);
         alert('Не удалось скачать документ.');
      }
   };

   // --- НОВАЯ ФУНКЦИЯ: открывает модалку ---
   const openDeleteModal = (name) => {
      if (!canEdit || !token) return;
      setDeleteTarget(name);
      setIsDeleteModalOpen(true);
   };

   // --- ФУНКЦИЯ УДАЛЕНИЯ ПОСЛЕ ПОДТВЕРЖДЕНИЯ ---
   const confirmDelete = async () => {
      if (!deleteTarget || !canEdit || !token) return;

      try {
         const resp = await fetch(
            `${API_BASE_URL}/documents/${encodeURIComponent(deleteTarget)}`,
            {
               method: 'DELETE',
               headers: {
                  Authorization: `Bearer ${token}`,
               },
            }
         );

         if (!resp.ok && resp.status !== 204) {
            throw new Error(`Ошибка сервера: ${resp.status}`);
         }

         setDocs((prev) => prev.filter((d) => d.name !== deleteTarget));
         setIsDeleteModalOpen(false);
         setDeleteTarget(null);
      } catch (e) {
         console.error('Ошибка удаления документа:', e);
         alert('Не удалось удалить документ.');
         setIsDeleteModalOpen(false);
         setDeleteTarget(null);
      }
   };

   const handleUploadChange = (e) => {
      if (!canEdit) return; // Возвращаем проверку прав
      const file = e.target.files?.[0] || null;
      setUploadFile(file);
   };

   // Функция для клика по кнопке выбора файла
   const handleFileButtonClick = () => {
      const fileInput = document.getElementById('file-upload-input');
      if (fileInput && !uploading) {
         fileInput.click();
      }
   };

   const handleUpload = async (e) => {
      e.preventDefault();
      if (!canEdit || !token || !uploadFile) return; // Возвращаем проверку прав и токена

      setUploading(true);
      try {
         const formData = new FormData();
         formData.append('file', uploadFile);

         const resp = await fetch(`${API_BASE_URL}/documents/upload`, {
            method: 'POST',
            headers: {
               Authorization: `Bearer ${token}`,
            },
            body: formData,
         });

         if (!resp.ok && resp.status !== 201) {
            throw new Error(`Ошибка сервера: ${resp.status}`);
         }

         // после успешной загрузки перезагружаем список
         const listResp = await fetch(`${API_BASE_URL}/documents`, {
            headers: {
               Authorization: `Bearer ${token}`,
            },
         });
         if (listResp.ok) {
            const json = await listResp.json();
            setDocs(json);
         }

         setUploadFile(null);
         // Сброс значения input
         const fileInput = document.getElementById('file-upload-input');
         if (fileInput) fileInput.value = '';
      } catch (e) {
         console.error('Ошибка загрузки документа:', e);
         alert('Не удалось загрузить документ.');
      } finally {
         setUploading(false);
      }
   };

   return (
      <main className="dashboard-container">
         <section className="dashboard-hero">
            <h2>Документы компании</h2>
         </section>

         {/* Сообщение о необходимости авторизации */}
         {!token && !loading && (
            <div className="message error">Для просмотра документов необходимо войти в систему.</div>
         )}

         {token && (
            <>
               {/* Сообщения об ошибках и загрузке */}
               {error && <div className="message error">{error}</div>}
               {loadingDocs && <div className="message loading">Загрузка документов...</div>}

               {/* Форма загрузки только для пользователей с правами */}
               {canEdit && (
                  <section className="filters-section">
                     <section className="dashboard-hero">
                        <h3>Загрузить новый документ</h3>
                     </section>
                     <form className="upload-form" onSubmit={handleUpload}>
                        <div className="file-input-wrapper">
                           <input
                              type="file"
                              onChange={handleUploadChange}
                              disabled={uploading}
                              className="file-input-hidden"
                              id="file-upload-input"
                           />
                           <div className="file-input-custom">
                              <span className="file-name">
                                 {uploadFile ? uploadFile.name : 'Файл не выбран'}
                              </span>
                              <button
                                 type="button"
                                 className="file-button"
                                 onClick={handleFileButtonClick}
                                 disabled={uploading}
                              >
                                 {uploadFile ? 'Изменить файл' : 'Выбрать файл'}
                              </button>
                           </div>
                        </div>
                        <button
                           type="submit"
                           className="upload-btn"
                           disabled={uploading || !uploadFile}
                           style={{ marginTop: '10px' }}
                        >
                           {uploading ? 'Загрузка...' : 'Загрузить документ'}
                        </button>
                        {uploadFile && (
                           <section className="dashboard-hero">
                              <p>
                                 Выбран файл: <strong>{uploadFile.name}</strong> ({(uploadFile.size / 1024).toFixed(1)} КБ)
                              </p>
                           </section>
                        )}
                     </form>
                  </section>
               )}

               {/* Таблица документов */}
               <section className="dashboard-section">
                  <section className="dashboard-hero">
                     <h3>Доступные документы</h3>
                  </section>

                  {docs.length === 0 && !loadingDocs ? (
                     <p className="message empty">Документы отсутствуют.</p>
                  ) : (
                     <table className="dashboard-table">
                        <thead>
                           <tr>
                              <th>Имя файла</th>
                              <th>Размер</th>
                              <th>Действия</th>
                           </tr>
                        </thead>
                        <tbody>
                           {docs.map((doc) => (
                              <tr key={doc.name}>
                                 <td>{doc.name}</td>
                                 <td>{formatSize(doc.size)}</td>
                                 <td className="actions">
                                    <button
                                       type="button"
                                       className="table-btn view"
                                       onClick={() => handleView(doc.name)}
                                    >
                                       Открыть
                                    </button>
                                    <button
                                       type="button"
                                       className="table-btn download"
                                       onClick={() => handleDownload(doc.name)}
                                    >
                                       Скачать
                                    </button>
                                    {canEdit && (
                                       <button
                                          type="button"
                                          className="table-btn delete"
                                          onClick={() => openDeleteModal(doc.name)}
                                       >
                                          Удалить
                                       </button>
                                    )}
                                 </td>
                              </tr>
                           ))}
                        </tbody>
                     </table>
                  )}
               </section>
            </>
         )}

         {/* === Модальное окно подтверждения удаления === */}
         {isDeleteModalOpen && (
            <div className="modal">
               <div className="modal-content">
                  <span
                     className="close"
                     onClick={() => {
                        setIsDeleteModalOpen(false);
                        setDeleteTarget(null);
                     }}
                  >
                     &times;
                  </span>
                  <h3>Подтвердите действие</h3>
                  <p>Вы действительно хотите удалить документ <strong>{deleteTarget}</strong>?</p>
                  <div className="modal-actions">
                     <button
                        className="btn-primary"
                        onClick={confirmDelete}
                        style={{ flex: 1 }}
                     >
                        Удалить
                     </button>
                     <button
                        className="cancel-btn"
                        onClick={() => {
                           setIsDeleteModalOpen(false);
                           setDeleteTarget(null);
                        }}
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

export default Documents;