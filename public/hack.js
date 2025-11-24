let sessionId = generateSessionId();
let currentLevel = 1;
let attemptsLeft = 5;
let correctWord = '';
let words = [];
let selectedWord = null;

// Звуковые элементы
let soundPassGood = null;
let soundPassBad = null;

const difficulties = {
    1: 'ОЧЕНЬ ЛЕГКО',
    2: 'ЛЕГКО',
    3: 'СРЕДНЕ',
    4: 'ТРУДНО',
    5: 'ОЧЕНЬ ТРУДНО'
};

// Инициализация звуков
function initSounds() {
    soundPassGood = document.getElementById('soundPassGood');
    soundPassBad = document.getElementById('soundPassBad');
}

// Воспроизвести звук успеха
function playPassGood() {
    if (soundPassGood) {
        soundPassGood.currentTime = 0;
        soundPassGood.volume = 0.5;
        soundPassGood.play().catch(err => console.log('Sound play error:', err));
    }
}

// Воспроизвести звук неудачи
function playPassBad() {
    if (soundPassBad) {
        soundPassBad.currentTime = 0;
        soundPassBad.volume = 0.5;
        soundPassBad.play().catch(err => console.log('Sound play error:', err));
    }
}

// Генерация ID сессии
function generateSessionId() {
    return 'hack_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Начать новый уровень
async function startLevel() {
    try {
        const response = await fetch('/api/hack/start', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: 'satirikon',
                sessionId: sessionId
            })
        });

        const data = await response.json();

        if (!data.success) {
            addLog(data.message, 'error');
            return;
        }

        if (data.completed) {
            showComplete({ username: 'satirikon', password: 'venom' });
            return;
        }

        currentLevel = data.level;
        attemptsLeft = data.attempts;
        words = data.words;
        correctWord = data.correctWord;

        document.getElementById('currentLevel').textContent = currentLevel;
        document.getElementById('difficulty').textContent = difficulties[currentLevel];

        updateAttemptsDisplay();
        displayWords();

        addLog(`> УРОВЕНЬ ${currentLevel} НАЧАТ`, 'success');
        addLog(`> Длина пароля: ${correctWord.length} символов`);

    } catch (error) {
        console.error('Error starting level:', error);
        addLog('> ОШИБКА ИНИЦИАЛИЗАЦИИ', 'error');
    }
}

// Отобразить слова
function displayWords() {
    const leftColumn = document.getElementById('leftColumn');
    const rightColumn = document.getElementById('rightColumn');

    leftColumn.innerHTML = '';
    rightColumn.innerHTML = '';

    // Разделить слова на две колонки
    const half = Math.ceil(words.length / 2);
    const leftWords = words.slice(0, half);
    const rightWords = words.slice(half);

    // Добавить мусорные символы между словами для атмосферы
    function addWordsWithGarbage(column, wordsList) {
        let html = '';
        wordsList.forEach((word, index) => {
            const address = (0x0F00 + index * 12).toString(16).toUpperCase();
            html += `<span style="color: #888888;">0x${address}</span> `;

            // Добавить мусорные символы перед словом
            const garbageBefore = generateDisplayGarbage(Math.floor(Math.random() * 3));
            html += `<span style="color: #666666;">${garbageBefore}</span>`;

            // Само слово
            html += `<span class="hack-word" data-word="${word}" onclick="selectWord(this)">${word}</span>`;

            // Мусор после
            const garbageAfter = generateDisplayGarbage(Math.floor(Math.random() * 3));
            html += `<span style="color: #666666;">${garbageAfter}</span><br>`;
        });
        column.innerHTML = html;
    }

    addWordsWithGarbage(leftColumn, leftWords);
    addWordsWithGarbage(rightColumn, rightWords);
}

// Генерация отображаемого мусора
function generateDisplayGarbage(length) {
    const chars = '!@#$%^&*(){}[]<>/\\|?~-+=.,;:';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars[Math.floor(Math.random() * chars.length)];
    }
    return result;
}

// Выбрать слово
async function selectWord(element) {
    if (attemptsLeft <= 0) return;

    const word = element.getAttribute('data-word');

    // Выделить выбранное слово
    document.querySelectorAll('.hack-word').forEach(el => el.classList.remove('selected'));
    element.classList.add('selected');

    addLog(`> ${word}`);

    // Проверить слово
    setTimeout(async () => {
        await checkWord(word);
    }, 500);
}

// Проверить слово
async function checkWord(word) {
    try {
        const response = await fetch('/api/hack/check', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                sessionId: sessionId,
                word: word,
                correctWord: correctWord,
                level: currentLevel
            })
        });

        const data = await response.json();

        if (!data.success) {
            addLog(data.message, 'error');
            return;
        }

        if (data.correct) {
            // Воспроизвести звук успеха
            playPassGood();

            addLog('> ' + data.message, 'success');

            if (data.completed) {
                setTimeout(() => {
                    showComplete(data.credentials);
                }, 1500);
            } else {
                setTimeout(() => {
                    addLog(`> ПЕРЕХОД НА УРОВЕНЬ ${data.nextLevel}...`, 'success');
                    setTimeout(() => {
                        startLevel();
                    }, 1500);
                }, 1000);
            }
        } else {
            // Воспроизвести звук неудачи
            playPassBad();

            attemptsLeft--;
            updateAttemptsDisplay();

            addLog(`> ОТКАЗАНО`, 'error');
            addLog(`> ${data.message}`);

            if (attemptsLeft <= 0) {
                addLog('> ТЕРМИНАЛ ЗАБЛОКИРОВАН', 'error');
                addLog('> Перезагрузите страницу для повтора');
                document.querySelectorAll('.hack-word').forEach(el => {
                    el.style.pointerEvents = 'none';
                    el.style.opacity = '0.5';
                });
            }
        }

        // Убрать выделение
        document.querySelectorAll('.hack-word').forEach(el => el.classList.remove('selected'));

    } catch (error) {
        console.error('Error checking word:', error);
        addLog('> ОШИБКА ПРОВЕРКИ', 'error');
    }
}

// Обновить отображение попыток
function updateAttemptsDisplay() {
    const display = document.getElementById('attemptsDisplay');
    display.innerHTML = '';

    for (let i = 0; i < 5; i++) {
        const box = document.createElement('div');
        box.className = 'attempt-box';
        if (i >= attemptsLeft) {
            box.classList.add('used');
        }
        display.appendChild(box);
    }
}

// Добавить запись в лог
function addLog(message, type = '') {
    const log = document.getElementById('hackLog');
    const entry = document.createElement('div');
    entry.className = 'hack-log-entry';
    if (type) entry.classList.add(type);
    entry.textContent = message;

    log.appendChild(entry);
    log.scrollTop = log.scrollHeight;
}

// Показать экран завершения
function showComplete(credentials) {
    document.getElementById('gameArea').style.display = 'none';
    document.getElementById('completeArea').style.display = 'block';

    document.getElementById('revealedUsername').textContent = credentials.username;
    document.getElementById('revealedPassword').textContent = credentials.password;
}

// Вернуться на страницу входа
function returnToLogin() {
    // Сохранить учетные данные в sessionStorage для автозаполнения
    sessionStorage.setItem('hackedUsername', 'satirikon');
    sessionStorage.setItem('hackedPassword', 'venom');
    window.location.href = '/';
}

// Инициализация при загрузке страницы
window.onload = () => {
    initSounds();
    updateAttemptsDisplay();
    startLevel();
};
