const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const multer = require('multer');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Настройка multer для загрузки файлов
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const type = file.mimetype.startsWith('image/') ? 'images' : 'sounds';
    const uploadPath = path.join(__dirname, 'public', 'media', type);

    // Создать папку если не существует
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max
  },
  fileFilter: (req, file, cb) => {
    // Разрешить только изображения и аудио
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Only images and audio files are allowed!'), false);
    }
  }
});

// Простая база данных в памяти
const users = {
  'satirikon': { password: 'venom', role: 'user' },
  'TheWorldV': { password: 'qwerty', role: 'admin' }
};

// Прогресс взлома для каждого пользователя (сессия)
const hackingProgress = {}; // sessionId -> { completedLevels: number, username: string }

// Хранилище активных соединений
const connections = new Map(); // username -> {ws, role}
const chatHistory = new Map(); // username -> [{from, message, timestamp}]

app.use(express.static('public'));
app.use(express.json());

// Маршруты для статических страниц
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/hack.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'hack.html'));
});

app.get('/chat', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'chat.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// API для аутентификации
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;

  if (users[username] && users[username].password === password) {
    res.json({
      success: true,
      role: users[username].role,
      username: username
    });
  } else {
    res.json({ success: false, message: 'Invalid credentials' });
  }
});

// API для загрузки файлов (только для админов)
app.post('/api/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const type = req.file.mimetype.startsWith('image/') ? 'images' : 'sounds';
    const filePath = `/media/${type}/${req.file.filename}`;

    res.json({
      success: true,
      filePath: filePath,
      filename: req.file.filename,
      type: type
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// API для получения списка файлов
app.get('/api/media/list', (req, res) => {
  try {
    const imagesPath = path.join(__dirname, 'public', 'media', 'images');
    const soundsPath = path.join(__dirname, 'public', 'media', 'sounds');

    const images = fs.existsSync(imagesPath) ?
      fs.readdirSync(imagesPath)
        .filter(f => /\.(jpg|jpeg|png|gif|svg|webp)$/i.test(f))
        .map(f => ({ name: f, path: `/media/images/${f}`, type: 'image' })) : [];

    const sounds = fs.existsSync(soundsPath) ?
      fs.readdirSync(soundsPath)
        .filter(f => /\.(mp3|wav|ogg|m4a)$/i.test(f))
        .map(f => ({ name: f, path: `/media/sounds/${f}`, type: 'sound' })) : [];

    res.json({
      success: true,
      images: images,
      sounds: sounds
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// API для начала взлома
app.post('/api/hack/start', (req, res) => {
  const { username, sessionId } = req.body;

  if (username !== 'satirikon') {
    return res.json({ success: false, message: 'Взлом доступен только для пользователя satirikon' });
  }

  if (!hackingProgress[sessionId]) {
    hackingProgress[sessionId] = { completedLevels: 0, username: username };
  }

  const progress = hackingProgress[sessionId];
  const level = progress.completedLevels + 1;

  if (level > 5) {
    return res.json({
      success: true,
      completed: true,
      message: 'Взлом завершен! Доступ разрешен.'
    });
  }

  // Генерация слов для текущего уровня
  const words = generateHackingWords(level);

  res.json({
    success: true,
    level: level,
    attempts: 5,
    words: words.allWords,
    correctWord: words.correctWord,
    completedLevels: progress.completedLevels
  });
});

// API для проверки слова
app.post('/api/hack/check', (req, res) => {
  const { sessionId, word, correctWord, level } = req.body;

  if (!hackingProgress[sessionId]) {
    return res.json({ success: false, message: 'Сессия не найдена' });
  }

  const isCorrect = word === correctWord;

  if (isCorrect) {
    hackingProgress[sessionId].completedLevels = level;

    if (level >= 5) {
      return res.json({
        success: true,
        correct: true,
        completed: true,
        message: 'ДОСТУП РАЗРЕШЕН',
        credentials: { username: 'satirikon', password: 'venom' }
      });
    } else {
      return res.json({
        success: true,
        correct: true,
        completed: false,
        message: 'Уровень пройден!',
        nextLevel: level + 1
      });
    }
  } else {
    const similarity = calculateSimilarity(word, correctWord);
    return res.json({
      success: true,
      correct: false,
      similarity: similarity,
      message: `Совпадений: ${similarity}/${correctWord.length}`
    });
  }
});

// Функция генерации слов для взлома
function generateHackingWords(level) {
  const wordLists = {
    1: ['APPLE', 'ARROW', 'AREAS', 'ASIDE', 'ADAPT', 'ALBUM', 'ADMIN', 'AFTER'],
    2: ['BRIDGE', 'BROKEN', 'BRONZE', 'BREATH', 'BRANCH', 'BRUTAL', 'BREAST', 'BRIGHT'],
    3: ['CAPTURE', 'CAREFUL', 'CABINET', 'CALCIUM', 'CALIBER', 'CAPABLE', 'CARRIER', 'CAPITAL'],
    4: ['DISCOVER', 'DISTANCE', 'DIRECTLY', 'DISTRICT', 'DISASTER', 'DINOSAUR', 'DIALOGUE', 'DISCOUNT'],
    5: ['EVERYBODY', 'EVOLUTION', 'EDUCATION', 'EMERGENCY', 'ESTABLISH', 'EXCELLENT', 'EXECUTIVE', 'EXPENSIVE', 'EXPLOSION']
  };

  const words = wordLists[level] || wordLists[5];
  const correctIndex = Math.floor(Math.random() * words.length);
  const correctWord = words[correctIndex];

  // Создать массив всех слов с дублями и мусором
  const allWords = [];
  const wordsToShow = 15 + level * 2; // Больше слов на высоких уровнях

  for (let i = 0; i < wordsToShow; i++) {
    if (i < words.length) {
      allWords.push(words[i]);
    } else {
      // Добавить случайные символы
      allWords.push(generateGarbage(correctWord.length));
    }
  }

  // Перемешать
  allWords.sort(() => Math.random() - 0.5);

  return { allWords, correctWord };
}

// Генерация мусорных символов
function generateGarbage(length) {
  const chars = '!@#$%^&*(){}[]<>/\\|?~-+=';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

// Вычислить совпадение символов
function calculateSimilarity(word1, word2) {
  let count = 0;
  const minLength = Math.min(word1.length, word2.length);

  for (let i = 0; i < minLength; i++) {
    if (word1[i] === word2[i]) {
      count++;
    }
  }

  return count;
}

// WebSocket соединение
wss.on('connection', (ws) => {
  console.log('New WebSocket connection');

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);

      // Аутентификация
      if (data.type === 'auth') {
        const { username, password } = data;

        if (users[username] && users[username].password === password) {
          connections.set(username, { ws, role: users[username].role });
          ws.username = username;
          ws.role = users[username].role;

          ws.send(JSON.stringify({
            type: 'auth_success',
            role: users[username].role,
            username: username
          }));

          // Если это админ, отправить список пользователей онлайн
          if (users[username].role === 'admin') {
            sendUsersList();
          }

          // Отправить историю чата
          if (chatHistory.has(username)) {
            ws.send(JSON.stringify({
              type: 'history',
              messages: chatHistory.get(username)
            }));
          }

          console.log(`User ${username} authenticated as ${users[username].role}`);
        } else {
          ws.send(JSON.stringify({ type: 'auth_failed' }));
        }
      }

      // Сообщение от пользователя
      if (data.type === 'message') {
        const { to, text } = data;
        const from = ws.username;

        const messageData = {
          from: from,
          to: to,
          text: text,
          timestamp: new Date().toISOString()
        };

        // Сохранить в историю
        if (ws.role === 'user') {
          // Сообщение от пользователя админу
          if (!chatHistory.has(from)) {
            chatHistory.set(from, []);
          }
          chatHistory.get(from).push(messageData);

          // Отправить админу
          const adminConnection = Array.from(connections.entries())
            .find(([username, conn]) => conn.role === 'admin');

          if (adminConnection) {
            adminConnection[1].ws.send(JSON.stringify({
              type: 'message',
              ...messageData
            }));
          }

          // Подтверждение отправителю
          ws.send(JSON.stringify({
            type: 'message_sent',
            ...messageData
          }));

        } else if (ws.role === 'admin') {
          // Сообщение от админа пользователю
          if (!chatHistory.has(to)) {
            chatHistory.set(to, []);
          }
          chatHistory.get(to).push(messageData);

          // Отправить пользователю
          const userConnection = connections.get(to);
          if (userConnection) {
            userConnection.ws.send(JSON.stringify({
              type: 'message',
              ...messageData
            }));
          }

          // Подтверждение админу
          ws.send(JSON.stringify({
            type: 'message_sent',
            ...messageData
          }));
        }
      }

      // Получить список пользователей (для админа)
      if (data.type === 'get_users') {
        sendUsersList();
      }

      // Троллинг функции (только для админа)
      if (data.type === 'troll_action' && ws.role === 'admin') {
        const { action, targetUser, data: actionData } = data;
        const userConnection = connections.get(targetUser);

        if (userConnection) {
          userConnection.ws.send(JSON.stringify({
            type: 'troll_action',
            action: action,
            data: actionData
          }));

          console.log(`Admin ${ws.username} sent troll action '${action}' to ${targetUser}`);
        }
      }

    } catch (error) {
      console.error('Error processing message:', error);
    }
  });

  ws.on('close', () => {
    if (ws.username) {
      connections.delete(ws.username);
      console.log(`User ${ws.username} disconnected`);

      // Обновить список пользователей для админа
      sendUsersList();
    }
  });
});

function sendUsersList() {
  const adminConnection = Array.from(connections.entries())
    .find(([username, conn]) => conn.role === 'admin');

  if (adminConnection) {
    const usersList = Array.from(connections.entries())
      .filter(([username, conn]) => conn.role === 'user')
      .map(([username, conn]) => ({
        username,
        messagesCount: chatHistory.has(username) ? chatHistory.get(username).length : 0
      }));

    adminConnection[1].ws.send(JSON.stringify({
      type: 'users_list',
      users: usersList
    }));
  }
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('Default users:');
  console.log('  Admin: username=TheWorldV, password=qwerty');
  console.log('  User: username=satirikon, password=venom');
  console.log('  Hack mode: Click [ВЗЛОМ] button on login page');
});
