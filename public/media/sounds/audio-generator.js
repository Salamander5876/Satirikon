// Audio generator for troll sounds using Web Audio API
// This generates sounds on-the-fly without needing MP3 files

class TrollAudioGenerator {
    constructor() {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }

    playAlarm() {
        const duration = 2;
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.frequency.value = 800;
        oscillator.type = 'square';

        gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);

        // Create beep pattern
        for (let i = 0; i < 4; i++) {
            const startTime = this.audioContext.currentTime + i * 0.5;
            gainNode.gain.setValueAtTime(0.3, startTime);
            gainNode.gain.setValueAtTime(0, startTime + 0.2);
        }

        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);

        return oscillator;
    }

    playError() {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.frequency.value = 400;
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);

        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.5);

        return oscillator;
    }

    playGlitch() {
        const bufferSize = this.audioContext.sampleRate * 1.5;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);

        // Generate glitchy noise
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * 0.2 * Math.sin(i / 100);
        }

        const source = this.audioContext.createBufferSource();
        const gainNode = this.audioContext.createGain();

        source.buffer = buffer;
        source.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        gainNode.gain.value = 0.4;

        source.start(this.audioContext.currentTime);

        return source;
    }

    playLaugh() {
        // Evil laugh effect using oscillators
        const duration = 2;
        const oscillator1 = this.audioContext.createOscillator();
        const oscillator2 = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator1.connect(gainNode);
        oscillator2.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator1.type = 'sawtooth';
        oscillator2.type = 'sine';

        // Create laughing pattern
        const laughPattern = [300, 350, 300, 250, 300, 350, 280, 320];
        laughPattern.forEach((freq, i) => {
            const time = this.audioContext.currentTime + i * 0.2;
            oscillator1.frequency.setValueAtTime(freq, time);
            oscillator2.frequency.setValueAtTime(freq * 1.5, time);
            gainNode.gain.setValueAtTime(0.2, time);
            gainNode.gain.setValueAtTime(0, time + 0.15);
        });

        oscillator1.start(this.audioContext.currentTime);
        oscillator2.start(this.audioContext.currentTime);
        oscillator1.stop(this.audioContext.currentTime + duration);
        oscillator2.stop(this.audioContext.currentTime + duration);

        return oscillator1;
    }

    playStatic() {
        const bufferSize = this.audioContext.sampleRate * 2;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);

        // Generate white noise
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * 0.15;
        }

        const source = this.audioContext.createBufferSource();
        const gainNode = this.audioContext.createGain();

        source.buffer = buffer;
        source.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        gainNode.gain.value = 0.3;

        source.start(this.audioContext.currentTime);

        return source;
    }

    playSoundById(soundId) {
        try {
            switch(soundId) {
                case 'alarm':
                    return this.playAlarm();
                case 'error':
                    return this.playError();
                case 'glitch_sound':
                    return this.playGlitch();
                case 'laugh':
                    return this.playLaugh();
                case 'static':
                    return this.playStatic();
                default:
                    console.error('Unknown sound ID:', soundId);
            }
        } catch(err) {
            console.error('Error playing sound:', err);
        }
    }
}

// Export for use in other scripts
if (typeof window !== 'undefined') {
    window.TrollAudioGenerator = TrollAudioGenerator;
}
