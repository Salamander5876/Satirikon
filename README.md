# Satira Chat - WebSocket Chat System

Консольный чат с WebSocket, системой аутентификации и мини-игрой взлома в стиле Fallout.

## Особенности

- **WebSocket чат** - реалтайм общение между пользователем и администратором
- **Fallout-стиль хакинг** - мини-игра для входа без пароля (5 уровней)
- **Админ-панель** - управление чатами с функциями троллинга:
  - Показ изображений
  - Воспроизведение звуков
  - Эффект тряски экрана
  - Глитч-эффекты
  - Мигание экрана
- **Загрузка медиа** - админ может загружать свои картинки и звуки
- **Консольный дизайн** - терминальный интерфейс в стиле Anonymous

## Требования

- Node.js (v14 или выше)
- npm или yarn
- PM2 (для продакшена на VPS)

## Установка на VPS

### 1. Клонирование репозитория

```bash
git clone https://github.com/ваш-username/satira-chat.git
cd satira-chat
```

### 2. Установка зависимостей

```bash
npm install
```

### 3. Установка PM2 (если не установлен)

```bash
npm install -g pm2
```

### 4. Запуск приложения

```bash
# Запуск через PM2
pm2 start server.js --name "satira-chat"

# Сохранить для автозапуска
pm2 save

# Настроить автозапуск при перезагрузке
pm2 startup systemd
```

### 5. Настройка Nginx (опционально)

Создайте конфиг `/etc/nginx/sites-available/satira-chat`:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Активируйте конфиг:
```bash
sudo ln -s /etc/nginx/sites-available/satira-chat /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 6. Настройка файрвола

```bash
# Разрешить порт 3000 (если не используете Nginx)
sudo ufw allow 3000

# Или разрешить Nginx
sudo ufw allow 'Nginx Full'
```

## Локальная разработка

```bash
# Установка зависимостей
npm install

# Запуск в режиме разработки
npm start

# Приложение будет доступно на http://localhost:3000
```

## Учетные данные по умолчанию

### Администратор
- **Логин:** `TheWorldV`
- **Пароль:** `qwerty`

### Пользователь
- **Логин:** `satirikon`
- **Пароль:** `venom`

### Взлом (альтернативный вход)
- Нажмите кнопку `[ ВЗЛОМ ]` на странице входа
- Пройдите 5 уровней мини-игры в стиле Fallout
- После успешного взлома получите доступ как пользователь `satirikon`

## Управление PM2

```bash
# Список процессов
pm2 list

# Логи
pm2 logs satira-chat

# Перезапуск
pm2 restart satira-chat

# Остановка
pm2 stop satira-chat

# Удаление
pm2 delete satira-chat

# Мониторинг
pm2 monit
```

## Структура проекта

```
satira-chat/
├── server.js                 # Основной сервер (Express + WebSocket)
├── package.json              # Зависимости
├── public/                   # Статические файлы
│   ├── login.html           # Страница входа
│   ├── chat.html            # Чат пользователя
│   ├── admin.html           # Админ-панель
│   ├── hack.html            # Мини-игра взлома
│   ├── style.css            # Стили
│   ├── chat.js              # Логика чата пользователя
│   ├── admin.js             # Логика админ-панели
│   ├── hack.js              # Логика мини-игры
│   └── media/               # Медиа-файлы
│       ├── images/          # Картинки (SVG)
│       └── sounds/          # Звуки (WAV)
└── README.md                # Этот файл
```

## API Endpoints

### Аутентификация
- `POST /api/login` - Вход в систему
  ```json
  {
    "username": "satirikon",
    "password": "venom"
  }
  ```

### Взлом
- `POST /api/hack/start` - Начать игру взлома
  ```json
  {
    "username": "satirikon",
    "sessionId": "unique-session-id"
  }
  ```

- `POST /api/hack/check` - Проверить слово
  ```json
  {
    "sessionId": "unique-session-id",
    "word": "APPLE",
    "correctWord": "ADMIN",
    "level": 1
  }
  ```

### Загрузка медиа (только для админа)
- `POST /api/upload` - Загрузить файл (изображение или звук)
- `GET /api/media/list` - Получить список всех медиа-файлов

## WebSocket сообщения

### Аутентификация
```json
{
  "type": "auth",
  "username": "satirikon",
  "password": "venom"
}
```

### Отправка сообщения
```json
{
  "type": "message",
  "to": "TheWorldV",
  "text": "Привет!"
}
```

### Троллинг (только админ)
```json
{
  "type": "troll_action",
  "action": "show_image",
  "targetUser": "satirikon",
  "data": {
    "url": "/media/images/hacker.svg"
  }
}
```

## Троллинг функции

Доступны для администратора:

- **show_image** - Показать изображение пользователю
- **play_sound** - Воспроизвести звук
- **shake_screen** - Потрясти экран
- **glitch_effect** - Глитч-эффект
- **blink_screen** - Мигание экрана

## Изменение порта

```bash
# Через переменную окружения
PORT=8080 npm start

# Или через PM2
PORT=8080 pm2 start server.js --name "satira-chat"
```

## Изменение учетных данных

Отредактируйте `server.js`:

```javascript
const users = {
  'ваш_логин': { password: 'ваш_пароль', role: 'user' },
  'админ_логин': { password: 'админ_пароль', role: 'admin' }
};
```

## Безопасность

⚠️ **Важно для продакшена:**

1. Измените учетные данные по умолчанию
2. Используйте HTTPS (настройте SSL через Nginx или Let's Encrypt)
3. Настройте файрвол (ufw/iptables)
4. Используйте переменные окружения для паролей
5. Ограничьте доступ к админ-панели по IP (через Nginx)

## Troubleshooting

### Порт уже занят
```bash
# Найти процесс на порту 3000
lsof -i :3000
# Или на Windows
netstat -ano | findstr :3000

# Убить процесс
kill -9 PID
```

### PM2 не запускается
```bash
# Проверить логи
pm2 logs satira-chat

# Перезапустить PM2
pm2 restart satira-chat
```

### WebSocket не подключается
- Проверьте, что файрвол разрешает WebSocket-соединения
- Убедитесь, что Nginx правильно проксирует WebSocket (см. конфиг выше)

## Лицензия

MIT

## Автор

Satira Chat System
