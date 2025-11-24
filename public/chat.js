let ws = null;
let username = null;
let isConnected = false;

// Проверка авторизации
function checkAuth() {
    username = sessionStorage.getItem('username');
    const password = sessionStorage.getItem('password');
    const role = sessionStorage.getItem('role');

    if (!username || !password || role !== 'user') {
        window.location.href = '/';
        return false;
    }

    document.getElementById('username').textContent = username;
    return true;
}

// Подключение к WebSocket
function connectWebSocket() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    ws = new WebSocket(`${protocol}//${window.location.host}`);

    ws.onopen = () => {
        console.log('WebSocket connected');
        updateConnectionStatus(true);

        // Аутентификация
        ws.send(JSON.stringify({
            type: 'auth',
            username: username,
            password: sessionStorage.getItem('password')
        }));
    };

    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log('Received:', data);

        if (data.type === 'auth_success') {
            isConnected = true;
            console.log('Authentication successful');
        }

        if (data.type === 'auth_failed') {
            alert('Authentication failed');
            logout();
        }

        if (data.type === 'history') {
            // Загрузить историю сообщений
            data.messages.forEach(msg => {
                displayMessage(msg);
            });
        }

        if (data.type === 'message' || data.type === 'message_sent') {
            displayMessage(data);
        }

        if (data.type === 'troll_action') {
            handleTrollAction(data.action, data.data);
        }
    };

    ws.onclose = () => {
        console.log('WebSocket disconnected');
        updateConnectionStatus(false);

        // Попытка переподключения через 3 секунды
        setTimeout(() => {
            if (checkAuth()) {
                connectWebSocket();
            }
        }, 3000);
    };

    ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        updateConnectionStatus(false);
    };
}

// Обновить статус соединения
function updateConnectionStatus(connected) {
    const statusElement = document.getElementById('connection-status');
    const indicator = document.querySelector('.status-indicator');

    if (connected) {
        statusElement.textContent = 'ПОДКЛЮЧЕНО';
        indicator.style.backgroundColor = '#ffffff';
    } else {
        statusElement.textContent = 'ОТКЛЮЧЕНО';
        indicator.style.backgroundColor = '#ff0000';
    }
}

// Отправить сообщение
function sendMessage() {
    const input = document.getElementById('messageInput');
    const text = input.value.trim();

    if (!text || !isConnected) return;

    ws.send(JSON.stringify({
        type: 'message',
        to: 'admin',
        text: text
    }));

    input.value = '';
}

// Отобразить сообщение
function displayMessage(data) {
    const messagesContainer = document.getElementById('messages');

    // Удалить сообщение "ожидание" если оно есть
    const waitingMsg = messagesContainer.querySelector('[style*="text-align: center"]');
    if (waitingMsg) {
        waitingMsg.remove();
    }

    const messageDiv = document.createElement('div');
    messageDiv.className = 'message';

    const isFromAdmin = data.from === 'admin' || (data.from !== username && data.from !== undefined);

    if (isFromAdmin) {
        messageDiv.classList.add('admin-message');
    }

    const timestamp = new Date(data.timestamp).toLocaleTimeString('ru-RU');

    messageDiv.innerHTML = `
        <div class="message-header">
            <span class="message-from">&gt; ${isFromAdmin ? 'АДМИНИСТРАТОР' : 'ВЫ'}</span>
            <span class="message-time">[${timestamp}]</span>
        </div>
        <div class="message-text">${escapeHtml(data.text)}</div>
    `;

    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Экранирование HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Выход
function logout() {
    if (ws) {
        ws.close();
    }
    sessionStorage.clear();
    window.location.href = '/';
}

// Обработка Enter для отправки
document.getElementById('messageInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

// Обработка троллинг-действий
function handleTrollAction(action, data) {
    if (action === 'show_image') {
        showImageOverlay(data.url);
    } else if (action === 'play_sound') {
        playTrollSound(data.url);
    } else if (action === 'shake_screen') {
        shakeScreen();
    } else if (action === 'glitch_effect') {
        applyGlitchEffect();
    }
}

// Показать картинку на весь экран
function showImageOverlay(imageUrl) {
    const overlay = document.createElement('div');
    overlay.className = 'troll-overlay';
    overlay.innerHTML = `<img src="${imageUrl}" alt="Troll Image">`;

    overlay.onclick = () => {
        overlay.remove();
    };

    document.body.appendChild(overlay);

    // Автоматически убрать через 10 секунд
    setTimeout(() => {
        if (overlay.parentElement) {
            overlay.remove();
        }
    }, 10000);
}

// Воспроизвести звук
function playTrollSound(soundUrl) {
    const audio = new Audio(soundUrl);
    audio.volume = 0.7;
    audio.play().catch(err => console.log('Audio play error:', err));
}

// Встряхнуть экран
function shakeScreen() {
    const container = document.querySelector('.container');
    container.style.animation = 'shake 0.5s';

    setTimeout(() => {
        container.style.animation = '';
    }, 500);
}

// Глитч эффект
function applyGlitchEffect() {
    const terminal = document.querySelector('.terminal');
    terminal.style.animation = 'glitch 1s';

    setTimeout(() => {
        terminal.style.animation = 'flicker 0.15s infinite';
    }, 1000);
}

// Инициализация
if (checkAuth()) {
    connectWebSocket();
}
