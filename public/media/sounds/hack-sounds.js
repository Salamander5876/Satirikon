// Генератор звуков для игры взлома в стиле Fallout
// Используется Web Audio API для создания звуков на лету

class HackSoundGenerator {
    constructor() {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }

    // Звук успешного взлома (ui_hacking_passgood)
    playPassGood() {
        const now = this.audioContext.currentTime;

        // Создаем три осциллятора для богатого звучания
        const osc1 = this.audioContext.createOscillator();
        const osc2 = this.audioContext.createOscillator();
        const osc3 = this.audioContext.createOscillator();

        const gainNode = this.audioContext.createGain();

        osc1.connect(gainNode);
        osc2.connect(gainNode);
        osc3.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        // Частоты для приятного аккорда
        osc1.frequency.setValueAtTime(523.25, now); // C5
        osc2.frequency.setValueAtTime(659.25, now); // E5
        osc3.frequency.setValueAtTime(783.99, now); // G5

        osc1.type = 'sine';
        osc2.type = 'sine';
        osc3.type = 'sine';

        // Плавное нарастание и затухание
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.3, now + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.6);

        osc1.start(now);
        osc2.start(now);
        osc3.start(now);

        osc1.stop(now + 0.6);
        osc2.stop(now + 0.6);
        osc3.stop(now + 0.6);

        return { osc1, osc2, osc3 };
    }

    // Звук неудачного взлома (ui_hacking_passbad)
    playPassBad() {
        const now = this.audioContext.currentTime;

        const osc = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        osc.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        // Низкий "грубый" звук с понижением частоты
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.3);

        osc.type = 'sawtooth';

        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.4, now + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

        osc.start(now);
        osc.stop(now + 0.4);

        return osc;
    }

    // Звук выбора слова (клик)
    playClick() {
        const now = this.audioContext.currentTime;

        const osc = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        osc.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        osc.frequency.setValueAtTime(800, now);
        osc.type = 'square';

        gainNode.gain.setValueAtTime(0.1, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.05);

        osc.start(now);
        osc.stop(now + 0.05);

        return osc;
    }

    // Звук начала нового уровня
    playLevelStart() {
        const now = this.audioContext.currentTime;

        const osc = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        osc.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        // Восходящий свип
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.2);

        osc.type = 'sine';

        gainNode.gain.setValueAtTime(0.2, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

        osc.start(now);
        osc.stop(now + 0.3);

        return osc;
    }

    // Звук завершения всех уровней (победа)
    playVictory() {
        const now = this.audioContext.currentTime;

        // Последовательность нот для победной мелодии
        const notes = [
            { freq: 523.25, time: 0 },     // C5
            { freq: 659.25, time: 0.15 },  // E5
            { freq: 783.99, time: 0.3 },   // G5
            { freq: 1046.50, time: 0.45 }  // C6
        ];

        notes.forEach(note => {
            const osc = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();

            osc.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            osc.frequency.setValueAtTime(note.freq, now + note.time);
            osc.type = 'sine';

            const startTime = now + note.time;
            gainNode.gain.setValueAtTime(0, startTime);
            gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3);

            osc.start(startTime);
            osc.stop(startTime + 0.3);
        });
    }

    // Звук потери попытки
    playAttemptLost() {
        const now = this.audioContext.currentTime;

        const osc = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        osc.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        osc.frequency.setValueAtTime(150, now);
        osc.type = 'square';

        gainNode.gain.setValueAtTime(0.15, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

        osc.start(now);
        osc.stop(now + 0.1);

        return osc;
    }

    // Звук блокировки терминала
    playLockout() {
        const now = this.audioContext.currentTime;

        // Серия быстрых низких звуков
        for (let i = 0; i < 3; i++) {
            const osc = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();

            osc.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            const startTime = now + (i * 0.15);
            osc.frequency.setValueAtTime(100, startTime);
            osc.type = 'sawtooth';

            gainNode.gain.setValueAtTime(0.25, startTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.1);

            osc.start(startTime);
            osc.stop(startTime + 0.1);
        }
    }
}

// Экспорт для использования в других скриптах
if (typeof window !== 'undefined') {
    window.HackSoundGenerator = HackSoundGenerator;
}
