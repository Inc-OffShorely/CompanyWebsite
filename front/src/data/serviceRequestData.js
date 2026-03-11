// src/data/serviceRequestData.js

// Типы услуг (id совпадают с mm.service_type.service_type_id)
export const serviceTypes = [
  { id: 1, name: 'Оптовая продажа' },
  { id: 2, name: 'Разработка корпоративного мерча' },
  { id: 3, name: 'Индивидуальный пошив' },
  { id: 4, name: 'Консультация по стилю' }
];

// Статусы заявок
export const statuses = {
  NEW:        { id: 'new',         name: 'Новая',      color: '#3498db' },
  IN_PROGRESS:{ id: 'in_progress', name: 'В работе',   color: '#9b59b6' },
  COMPLETED:  { id: 'completed',   name: 'Завершена',  color: '#27ae60' },
  CANCELLED:  { id: 'cancelled',   name: 'Отменена',   color: '#e74c3c' }
};

// Имитация сотрудников компании (fallback, если API вдруг упал)
export const employees = [
  { id: 1, name: 'Иванов Иван Иванович',     role: 'employee',  department: 'Производство' },
  { id: 2, name: 'Петрова Анна Сергеевна',   role: 'employee',  department: 'Дизайн' },
  { id: 3, name: 'Сидоров Петр Константинович', role: 'employee', department: 'Производство' },
  { id: 4, name: 'Козлова Мария Владимировна', role: 'employee', department: 'Клиентский сервис' },
  { id: 5, name: 'Николаев Алексей Дмитриевич', role: 'employee', department: 'Логистика' },
  { id: 6, name: 'Смирнова Ольга Петровна',  role: 'moderator', department: 'Управление' },
  { id: 7, name: 'Васнецов Дмитрий Игоревич',role: 'moderator', department: 'Управление' },
  { id: 8, name: 'Кузнецов Александр Михайлович', role: 'admin', department: 'Администрация' }
];

// Имитация заявок на услуги (сейчас в реальной работе они тебе уже почти не нужны,
// но оставим для отладки / заглушки)
export const initialServiceRequests = [
  {
    id: 'req1',
    requestCode: 'ИП-20-12-2024-1001',
    customerName: 'Ковалева Екатерина Викторовна',
    phone: '+7 (999) 123-45-67',
    email: 'ekaterina@example.com',
    serviceType: 3, // Индивидуальный пошив
    serviceName: 'Индивидуальный пошив',
    description: 'Пошив вечернего платья по индивидуальным меркам',
    size: '48',
    status: statuses.NEW.id,
    createdAt: '2024-12-20T09:30:00',
    assignedTo: null,
    comments: [],
    priority: 'medium'
  },
  {
    id: 'req2',
    requestCode: 'ОП-19-12-2024-1002',
    customerName: 'ООО "Стиль и Комфорт"',
    phone: '+7 (495) 987-65-43',
    email: 'order@style-comfort.ru',
    serviceType: 1, // Оптовая продажа
    serviceName: 'Оптовая продажа',
    description: 'Закупка партии домашних костюмов для корпоративных подарков (50 шт)',
    size: null,
    // 🔴 здесь было statuses.ASSIGNED.id — заменяем:
    status: statuses.IN_PROGRESS.id,
    assignedTo: 1,
    createdAt: '2024-12-19T14:15:00',
    comments: [
      {
        id: 'c1',
        author: 'Смирнова Ольга Петровна',
        text: 'Назначила на Иванова И.И.',
        date: '2024-12-19T15:00:00'
      }
    ],
    priority: 'high'
  },
  // Остальные оставь/подправь по желанию
];
