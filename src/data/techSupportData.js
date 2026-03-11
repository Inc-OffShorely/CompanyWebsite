// src/data/techSupportData.js

// Категории заявок в ТП
export const techCategories = [
  { id: 'hardware', name: 'Оборудование' },
  { id: 'software', name: 'Программное обеспечение' },
  { id: 'network', name: 'Сеть и интернет' },
  { id: 'account', name: 'Учётные записи' },
  { id: 'other', name: 'Прочее' }
];

// Статусы заявок
export const statuses = {
  NEW: { id: 'new', name: 'Новая', color: '#3498db' },
  IN_PROGRESS: { id: 'in_progress', name: 'В работе', color: '#9b59b6' },
  RESOLVED: { id: 'resolved', name: 'Решена', color: '#27ae60' }
};

// Специалисты ТП
export const techSpecialists = [
  {
    id: 'tech1',
    name: 'Смирнов Алексей Петрович',
    role: 'tech_support',
    department: 'ИТ-отдел',
    specialties: ['hardware', 'software'],
    activeTickets: 3
  },
  {
    id: 'tech2',
    name: 'Иванова Мария Сергеевна',
    role: 'tech_support',
    department: 'ИТ-отдел',
    specialties: ['network', 'account'],
    activeTickets: 2
  },
  {
    id: 'tech3',
    name: 'Петров Дмитрий Владимирович',
    role: 'tech_support',
    department: 'ИТ-отдел',
    specialties: ['hardware', 'network'],
    activeTickets: 1
  },
  {
    id: 'tech4',
    name: 'Козлова Анна Игоревна',
    role: 'tech_support',
    department: 'ИТ-отдел',
    specialties: ['software', 'account'],
    activeTickets: 4
  }
];

// Примеры заявок
export const initialTickets = [
  {
    id: 'ticket-001',
    ticketNumber: 'ТП-2024-12-20-001',
    title: 'Не работает принтер в отделе маркетинга',
    description: 'Принтер HP LaserJet MFP не печатает, показывает ошибку "замятие бумаги", но бумаги нет.',
    category: 'hardware',
    status: 'in_progress',
    createdBy: 'Иванов Иван Иванович',
    createdByDepartment: 'Маркетинг',
    createdAt: '2024-12-20T09:15:00',
    assignedTo: 'tech1',
    comments: [
      {
        id: 'comment-1',
        author: 'Смирнов Алексей Петрович',
        authorRole: 'tech_support',
        text: 'Осмотрел принтер. Действительно, датчик замятия бумаги сломан. Заказана деталь.',
        createdAt: '2024-12-20T10:30:00',
        type: 'internal'
      },
      {
        id: 'comment-2',
        author: 'Иванов Иван Иванович',
        authorRole: 'employee',
        text: 'Спасибо! Когда примерно будет готова деталь?',
        createdAt: '2024-12-20T11:45:00',
        type: 'public'
      }
    ],
    solution: null,
    resolvedAt: null
  },
  {
    id: 'ticket-002',
    ticketNumber: 'ТП-2024-12-19-002',
    title: 'Не могу зайти в корпоративную почту',
    description: 'При входе в Outlook появляется ошибка "Неверный пароль". Пароль точно правильный, менял неделю назад.',
    category: 'account',
    status: 'in_progress',
    createdBy: 'Петрова Анна Сергеевна',
    createdByDepartment: 'Бухгалтерия',
    createdAt: '2024-12-19T14:20:00',
    assignedTo: 'tech4',
    comments: [
      {
        id: 'comment-3',
        author: 'Козлова Анна Игоревна',
        authorRole: 'tech_support',
        text: 'Нужно сбросить пароль. Отправил инструкцию на почту.',
        createdAt: '2024-12-19T15:10:00',
        type: 'internal'
      }
    ],
    solution: null,
    resolvedAt: null
  },
  {
    id: 'ticket-003',
    ticketNumber: 'ТП-2024-12-18-003',
    title: 'Медленная работа интернета',
    description: 'Скорость интернета упала до 10 Мбит/с, хотя должна быть 100 Мбит/с. Проблема наблюдается у всех в отделе.',
    category: 'network',
    status: 'resolved',
    createdBy: 'Сидоров Петр Константинович',
    createdByDepartment: 'Разработка',
    createdAt: '2024-12-18T11:05:00',
    assignedTo: 'tech2',
    comments: [
      {
        id: 'comment-4',
        author: 'Иванова Мария Сергеевна',
        authorRole: 'tech_support',
        text: 'Проверил скорость на маршрутизаторе - все нормально. Проблема в локальной сети.',
        createdAt: '2024-12-18T13:20:00',
        type: 'internal'
      },
      {
        id: 'comment-5',
        author: 'Иванова Мария Сергеевна',
        authorRole: 'tech_support',
        text: 'Нашел проблему - сбойный сетевой коммутатор. Заменил.',
        createdAt: '2024-12-18T16:45:00',
        type: 'public'
      }
    ],
    solution: 'Заменен сетевой коммутатор в комнате серверов. Скорость восстановлена.',
    resolvedAt: '2024-12-18T17:00:00'
  },
  {
    id: 'ticket-004',
    ticketNumber: 'ТП-2024-12-20-004',
    title: 'Установить новое ПО для дизайна',
    description: 'Нужно установить Adobe Creative Cloud на рабочий компьютер. Лицензия уже приобретена.',
    category: 'software',
    status: 'new',
    createdBy: 'Козлова Мария Владимировна',
    createdByDepartment: 'Дизайн',
    createdAt: '2024-12-20T10:00:00',
    assignedTo: null,
    comments: [],
    solution: null,
    resolvedAt: null
  },
  {
    id: 'ticket-005',
    ticketNumber: 'ТП-2024-12-17-005',
    title: 'Настроить VPN для удаленной работы',
    description: 'Нужно настроить VPN подключение для нового сотрудника.',
    category: 'network',
    status: 'closed',
    createdBy: 'Николаев Алексей Дмитриевич',
    createdByDepartment: 'Логистика',
    createdAt: '2024-12-17T09:30:00',
    assignedTo: 'tech3',
    comments: [
      {
        id: 'comment-6',
        author: 'Петров Дмитрий Владимирович',
        authorRole: 'tech_support',
        text: 'Настроил VPN, отправил инструкцию по подключению.',
        createdAt: '2024-12-17T11:15:00',
        type: 'public'
      }
    ],
    solution: 'Настроено VPN подключение с двухфакторной аутентификацией.',
    resolvedAt: '2024-12-17T11:30:00'
  }
];