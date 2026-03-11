// src/data/OrdersData.js
export const OrdersData = [
  {
    id: 'ИП-04-12-2025-5880',
    serviceType: 'Индивидуальный пошив',
    
    customerName: 'Иванова Анна Сергеевна',
    orderDate: '2024-01-15',
    status: 'completed',
    statusText: 'Выполнен'
  },
  {
    id: 'MM-2024-002',
    serviceType: 'Оптовая продажа',
    customerName: 'Петров Алексей Владимирович',
    orderDate: '2024-01-18',
    status: 'in_progress',
    statusText: 'В работе'
  },
  {
    id: 'MM-2024-003',
    serviceType: 'Корпоративный мерч',
    customerName: 'ООО "Компания"',
    orderDate: '2024-01-20',
    status: 'pending',
    statusText: 'Ожидает обработки'
  },
  {
    id: 'MM-2024-004',
    serviceType: 'Консультация по стилю',
    customerName: 'Сидорова Мария Петровна',
    orderDate: '2024-01-22',
    status: 'shipped',
    statusText: 'Отправлен'
  }
];