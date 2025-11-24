let ws = null;
let username = null;
let isConnected = false;
let currentUser = null;
let users = [];
let chatHistories = {}; // username -> messages[]
let mediaFiles = { images: [], sounds: [] }; // Загруженные файлы

// Проверка авторизации
function checkAuth() {
    username = sessionStorage.getItem('username');
    const password = sessionStorage.getItem('password');
    const role = sessionStorage.getItem('role');

    if (!username || !password || role !== 'admin') {
        window.location.href = '/';
        return false;
    }

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

            // Запросить список пользователей
            ws.send(JSON.stringify({ type: 'get_users' }));
        }

        if (data.type === 'auth_failed') {
            alert('Authentication failed');
            logout();
        }

        if (data.type === 'users_list') {
            updateUsersList(data.users);
        }

        if (data.type === 'history') {
            // Загрузить историю сообщений для текущего пользователя
            if (currentUser) {
                chatHistories[currentUser] = data.messages;
                displayChat(currentUser);
            }
        }

        if (data.type === 'message' || data.type === 'message_sent') {
            // Добавить сообщение в историю
            const user = data.from === username ? data.to : data.from;

            if (!chatHistories[user]) {
                chatHistories[user] = [];
            }

            chatHistories[user].push(data);

            // Обновить чат если это текущий пользователь
            if (currentUser === user) {
                displayMessage(data);
            }

            // Обновить счетчик сообщений
            updateUserMessageCount(user);
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

// Обновить список пользователей
function updateUsersList(usersList) {
    users = usersList;
    const container = document.getElementById('usersList');

    if (usersList.length === 0) {
        container.innerHTML = `
            <div style="padding: 20px; text-align: center; color: #888888;">
                Нет пользователей онлайн
            </div>
        `;
        return;
    }

    container.innerHTML = '';

    usersList.forEach(user => {
        const userDiv = document.createElement('div');
        userDiv.className = 'user-item';
        if (currentUser === user.username) {
            userDiv.classList.add('active');
        }

        userDiv.innerHTML = `
            <div class="user-name">&gt; ${user.username}</div>
            <div class="user-messages-count">Сообщений: ${user.messagesCount || 0}</div>
        `;

        userDiv.onclick = () => selectUser(user.username);

        container.appendChild(userDiv);
    });
}

// Выбрать пользователя
function selectUser(userName) {
    currentUser = userName;

    // Обновить активный класс
    document.querySelectorAll('.user-item').forEach(item => {
        item.classList.remove('active');
    });

    event.currentTarget.classList.add('active');

    // Показать чат
    displayChat(userName);
}

// Отобразить чат с пользователем
function displayChat(userName) {
    const chatPanel = document.getElementById('chatPanel');

    chatPanel.innerHTML = `
        <div class="messages-container" id="messages"></div>
        <div class="troll-buttons">
            <button class="btn-troll" onclick="openMediaSelector('image')">[ ПОКАЗАТЬ КАРТИНКУ ]</button>
            <button class="btn-troll" onclick="openMediaSelector('sound')">[ ВОСПРОИЗВЕСТИ ЗВУК ]</button>
            <button class="btn-troll danger" onclick="sendTrollAction('shake_screen')">[ ВСТРЯХНУТЬ ЭКРАН ]</button>
            <button class="btn-troll danger" onclick="sendTrollAction('glitch_effect')">[ ГЛИТЧ ЭФФЕКТ ]</button>
        </div>
        <div class="input-container">
            <input
                type="text"
                id="messageInput"
                class="message-input"
                placeholder="> Введите сообщение для ${userName}..."
                autocomplete="off"
            />
            <button class="btn-send" onclick="sendMessage()">[ ОТПРАВИТЬ ]</button>
        </div>

        <!-- Media Selector Modal -->
        <div id="mediaSelectorModal" class="modal hidden">
            <div class="modal-content">
                <div class="modal-header">
                    <span id="modalTitle">[ ВЫБРАТЬ ФАЙЛ ]</span>
                    <button class="modal-close" onclick="closeMediaSelector()">✕</button>
                </div>
                <div class="modal-body">
                    <div class="upload-section">
                        <input type="file" id="fileUpload" accept="image/*,audio/*" style="display:none" onchange="uploadFile()">
                        <button class="btn-upload" onclick="document.getElementById('fileUpload').click()">
                            [ ЗАГРУЗИТЬ НОВЫЙ ФАЙЛ ]
                        </button>
                        <div id="uploadStatus"></div>
                    </div>
                    <div class="files-list" id="filesList">
                        <p style="color: #888888; text-align: center;">Загрузка файлов...</p>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Загрузить историю
    if (chatHistories[userName]) {
        chatHistories[userName].forEach(msg => {
            displayMessage(msg);
        });
    }

    // Обработка Enter для отправки
    document.getElementById('messageInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    // Фокус на поле ввода
    document.getElementById('messageInput').focus();
}

// Отправить сообщение
function sendMessage() {
    if (!currentUser) return;

    const input = document.getElementById('messageInput');
    const text = input.value.trim();

    if (!text || !isConnected) return;

    ws.send(JSON.stringify({
        type: 'message',
        to: currentUser,
        text: text
    }));

    input.value = '';
}

// Отобразить сообщение
function displayMessage(data) {
    const messagesContainer = document.getElementById('messages');
    if (!messagesContainer) return;

    const messageDiv = document.createElement('div');
    messageDiv.className = 'message';

    const isFromAdmin = data.from === username;

    if (isFromAdmin) {
        messageDiv.classList.add('admin-message');
    }

    const timestamp = new Date(data.timestamp).toLocaleTimeString('ru-RU');

    messageDiv.innerHTML = `
        <div class="message-header">
            <span class="message-from">&gt; ${isFromAdmin ? 'YOU (ADMIN)' : data.from.toUpperCase()}</span>
            <span class="message-time">[${timestamp}]</span>
        </div>
        <div class="message-text">${escapeHtml(data.text)}</div>
    `;

    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Обновить счетчик сообщений для пользователя
function updateUserMessageCount(userName) {
    const userItems = document.querySelectorAll('.user-item');

    userItems.forEach(item => {
        const nameElement = item.querySelector('.user-name');
        if (nameElement && nameElement.textContent.includes(userName)) {
            const countElement = item.querySelector('.user-messages-count');
            const count = chatHistories[userName] ? chatHistories[userName].length : 0;
            countElement.textContent = `Messages: ${count}`;
        }
    });
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

// Открыть селектор медиа
let currentMediaType = null;
async function openMediaSelector(type) {
    if (!currentUser) return;

    currentMediaType = type;
    const modal = document.getElementById('mediaSelectorModal');
    const title = document.getElementById('modalTitle');
    const fileUpload = document.getElementById('fileUpload');

    title.textContent = type === 'image' ? '[ ВЫБРАТЬ ИЗОБРАЖЕНИЕ ]' : '[ ВЫБРАТЬ ЗВУК ]';
    fileUpload.accept = type === 'image' ? 'image/*' : 'audio/*';

    modal.classList.remove('hidden');

    // Загрузить список файлов
    await loadMediaFiles();
    displayMediaFiles(type);
}

// Закрыть селектор
function closeMediaSelector() {
    const modal = document.getElementById('mediaSelectorModal');
    modal.classList.add('hidden');
    currentMediaType = null;
}

// Загрузить список медиа-файлов
async function loadMediaFiles() {
    try {
        const response = await fetch('/api/media/list');
        const data = await response.json();

        if (data.success) {
            mediaFiles.images = data.images;
            mediaFiles.sounds = data.sounds;
        }
    } catch (error) {
        console.error('Error loading media files:', error);
    }
}

// Отобразить список файлов
function displayMediaFiles(type) {
    const filesList = document.getElementById('filesList');
    const files = type === 'image' ? mediaFiles.images : mediaFiles.sounds;

    if (files.length === 0) {
        filesList.innerHTML = '<p style="color: #888888; text-align: center;">Файлы ещё не загружены</p>';
        return;
    }

    filesList.innerHTML = '';

    files.forEach(file => {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';

        if (type === 'image') {
            fileItem.innerHTML = `
                <img src="${file.path}" alt="${file.name}" class="file-preview">
                <span class="file-name">${file.name}</span>
                <button class="btn-select" onclick="selectFile('${file.path}', 'show_image')">[ ВЫБРАТЬ ]</button>
            `;
        } else {
            fileItem.innerHTML = `
                <div class="file-icon">🔊</div>
                <span class="file-name">${file.name}</span>
                <button class="btn-select" onclick="selectFile('${file.path}', 'play_sound')">[ ВЫБРАТЬ ]</button>
            `;
        }

        filesList.appendChild(fileItem);
    });
}

// Выбрать файл
function selectFile(filePath, action) {
    sendTrollAction(action, { url: filePath });
    closeMediaSelector();
}

// Загрузить файл
async function uploadFile() {
    const fileInput = document.getElementById('fileUpload');
    const file = fileInput.files[0];
    const uploadStatus = document.getElementById('uploadStatus');

    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    uploadStatus.innerHTML = '<p style="color: #ffff00;">Загрузка...</p>';

    try {
        const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (data.success) {
            uploadStatus.innerHTML = '<p style="color: #00ff00;">✓ Загрузка успешна!</p>';

            // Обновить список файлов
            await loadMediaFiles();
            displayMediaFiles(currentMediaType);

            setTimeout(() => {
                uploadStatus.innerHTML = '';
            }, 3000);
        } else {
            uploadStatus.innerHTML = `<p style="color: #ff0000;">✗ ${data.message}</p>`;
        }
    } catch (error) {
        uploadStatus.innerHTML = '<p style="color: #ff0000;">✗ Ошибка загрузки</p>';
        console.error('Upload error:', error);
    }

    fileInput.value = '';
}

// Отправить троллинг-действие
function sendTrollAction(action, actionData = {}) {
    if (!currentUser || !isConnected) return;

    ws.send(JSON.stringify({
        type: 'troll_action',
        action: action,
        targetUser: currentUser,
        data: actionData
    }));

    console.log(`Sent troll action: ${action} to ${currentUser}`);

    // Показать уведомление
    const messagesContainer = document.getElementById('messages');
    if (messagesContainer) {
        const notification = document.createElement('div');
        notification.style.cssText = 'padding: 10px; margin: 10px 0; border: 1px solid #ff00ff; color: #ff00ff; text-align: center;';
        notification.textContent = `[ TROLL ACTION SENT: ${action.toUpperCase()} ]`;
        messagesContainer.appendChild(notification);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;

        setTimeout(() => notification.remove(), 3000);
    }
}

// Инициализация
if (checkAuth()) {
    connectWebSocket();
}
