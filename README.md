# Корпоративный портал

Внутренний портал компании и публичный сайт для клиентов: сотрудники читают новости, бронируют переговорки, ведут календарь, обрабатывают заявки клиентов и обращения в техподдержку, работают с документами. Доступ к разделам зависит от роли сотрудника.

Командный проект. **Моя часть: проектирование базы данных PostgreSQL и бэкенд на Spring Boot**, участвовал во фронтенде.

## Возможности

- **Публичный сайт:** клиент оставляет заявку на услугу и по коду заявки отслеживает ее статус без регистрации.
- **Заявки клиентов:** сотрудник берет заявку в работу, модератор или админ назначает исполнителя, сотрудник закрывает.
- **Техподдержка:** обращения сотрудников с категориями, назначением исполнителя, комментариями с историей и решением.
- **Переговорки:** бронирование комнат по времени с участниками встречи.
- **Календарь** событий компании.
- **Новости:** читают все сотрудники, публикуют и редактируют админ и модератор (сохраняется, кто и когда редактировал).
- **Документы:** загрузка и скачивание файлов по категориям, право на управление документами выдается отдельно.
- **Сотрудники (админ):** создание, роли, сброс пароля.
- **Безопасность:** вход по логину и паролю (BCrypt), JWT без серверных сессий, проверка ролей на каждом эндпоинте. Неактивная сессия завершается через 5 минут: фронтенд спрашивает «вы еще здесь?», а фоновая задача на бэкенде гасит забытые сессии.

## Роли

| Роль | Что может |
|---|---|
| `EMPLOYEE` | новости, календарь, переговорки, техподдержка; берет и закрывает заявки клиентов |
| `MODERATOR` | все, что сотрудник, плюс назначение и изменение заявок, публикация новостей |
| `ADMIN` | все, что модератор, плюс управление сотрудниками и их ролями |

## Стек

- **Бэкенд:** Java 17, Spring Boot 3.3, Spring Web, Spring Data JPA (Hibernate), Spring Security, JWT (jjwt), Bean Validation, Lombok, Maven
- **База данных:** PostgreSQL (схема `mm`, `jsonb` для контактов)
- **Фронтенд:** React 19, React Router 7

## Схема базы данных

```mermaid
erDiagram
    employee ||--o{ employee_role : has
    role ||--o{ employee_role : grants
    employee ||--o{ news : "author / editor"
    employee ||--o{ calendar_event : creates
    employee ||--o{ document : uploads
    document_category ||--o{ document : groups
    room ||--o{ room_booking : "booked in"
    employee ||--o{ room_booking : organizes
    room_booking ||--o{ meeting_participation : includes
    employee ||--o{ meeting_participation : attends
    client ||--o{ service_request : submits
    service_type ||--o{ service_request : "type of"
    employee ||--o{ service_request : "assignee"
    employee ||--o{ support_ticket : "creator / assignee"

    employee {
        bigint employee_id PK
        varchar login
        varchar full_name
        varchar email
        varchar password_hash
        jsonb contacts
        bool has_active_session
        timestamptz last_activity_at
        bool can_manage_documents
    }
    role {
        smallint role_id PK
        varchar code
        varchar name
    }
    room_booking {
        bigint booking_id PK
        smallint room_id FK
        bigint organizer_id FK
        timestamptz start_at
        timestamptz end_at
        varchar status
    }
    service_request {
        bigint request_id PK
        bigint client_id FK
        bigint assignee_id FK
        smallint service_type_id FK
        varchar request_code
        varchar status
        timestamptz created_at
        timestamptz completed_at
    }
    support_ticket {
        bigint ticket_id PK
        bigint employee_id FK
        bigint assignee_id FK
        text subject
        varchar category
        varchar status
        text solution
    }
```

## Структура

```text
back/   Spring Boot API (порт 9090)
  config/      безопасность, CORS, расписание фоновых задач
  security/    выпуск и проверка JWT
  Controller/  REST-эндпоинты /api/...
  service/     бизнес-логика, очистка неактивных сессий
  Repository/  Spring Data JPA
  Entity/      сущности JPA
  api/dto/     DTO запросов и ответов
front/  React-приложение (порт 3000)
```

## Запуск

Нужны Java 17+, Maven (или `mvnw` из проекта), Node.js 18+ и PostgreSQL 14+.

**1. База данных.** Создайте базу `corporate_portal`, пользователя и схему `mm`, затем таблицы из `db/schema.sql`:

```bash
psql -U postgres -c "CREATE DATABASE corporate_portal"
psql -U postgres -d corporate_portal -f db/schema.sql
```

**2. Настройки бэкенда.** Секреты не хранятся в репозитории. Скопируйте `back/.env.example` в `back/.env` и заполните:

```dotenv
DB_PASSWORD=пароль_пользователя_базы
JWT_SECRET=случайная_строка_от_32_символов
```

`JWT_SECRET` можно сгенерировать командой `openssl rand -base64 48`. Остальные параметры (адрес базы, пользователь, папка документов) тоже переопределяются переменными окружения, см. `back/src/main/resources/application.properties`.

**3. Бэкенд:**

```bash
cd back
./mvnw spring-boot:run
```

**4. Фронтенд:**

```bash
cd front
npm install
npm start
```

Портал откроется на http://localhost:3000.

## Лицензия

MIT, см. [LICENSE](LICENSE).
