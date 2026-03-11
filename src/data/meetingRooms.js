// src/data/meetingRooms.js
export const meetingRooms = [
  {
    id: 'room-1',
    name: 'Комната "Малая"',
    capacity: 'до 5 человек',
    description: 'Идеально для небольших совещаний и индивидуальных встреч',
    size: 'small',
    features: ['Проектор', 'Маркерная доска', 'Wi-Fi']
  },
  {
    id: 'room-2',
    name: 'Комната "Средняя"',
    capacity: 'до 10 человек',
    description: 'Подходит для отделов и рабочих групп',
    size: 'medium',
    features: ['Проектор', 'Конференц-система', 'Маркерная доска', 'Кофе-машина', 'Wi-Fi']
  },
  {
    id: 'room-3',
    name: 'Комната "Большая"',
    capacity: 'до 15 человек',
    description: 'Для крупных совещаний и презентаций',
    size: 'large',
    features: ['Проектор', 'Конференц-система', 'Звуковая система', 'Видеоконференцсвязь', 'Маркерная доска', 'Wi-Fi']
  }
];

// Имитация уже забронированных слотов
export const initialBookings = {
  'room-1': [
    { id: '1', date: '2024-12-20', startTime: '09:00', endTime: '10:30', bookedBy: 'Иванов И.И.' },
    { id: '2', date: '2024-12-20', startTime: '14:00', endTime: '15:00', bookedBy: 'Петрова А.С.' },
    { id: '3', date: '2024-12-21', startTime: '10:00', endTime: '12:00', bookedBy: 'Сидоров П.К.' }
  ],
  'room-2': [
    { id: '4', date: '2024-12-20', startTime: '11:00', endTime: '13:00', bookedBy: 'Маркетинг отдел' },
    { id: '5', date: '2024-12-21', startTime: '09:00', endTime: '11:00', bookedBy: 'Разработчики' }
  ],
  'room-3': [
    { id: '6', date: '2024-12-19', startTime: '16:00', endTime: '18:00', bookedBy: 'Руководство' }
  ]
};