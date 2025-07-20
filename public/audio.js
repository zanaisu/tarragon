class AudioEngine {
    constructor() {
        this.context = null;
        this.masterGain = null;
        this.sounds = new Map();
        this.musicGain = null;
        this.sfxGain = null;
        this.ambientGain = null;
        this.init();
    }
    
    async init() {
        try {
            this.context = new (window.AudioContext || window.webkitAudioContext)();
            
            // Create gain nodes for different audio categories
            this.masterGain = this.context.createGain();
            this.musicGain = this.context.createGain();
            this.sfxGain = this.context.createGain();
            this.ambientGain = this.context.createGain();
            
            // Connect the audio graph
            this.musicGain.connect(this.masterGain);
            this.sfxGain.connect(this.masterGain);
            this.ambientGain.connect(this.masterGain);
            this.masterGain.connect(this.context.destination);
            
            // Set initial volumes
            this.masterGain.gain.value = 0.7;
            this.musicGain.gain.value = 0.3;
            this.sfxGain.gain.value = 0.8;
            this.ambientGain.gain.value = 0.4;
            
            this.createSounds();
            console.log('AudioEngine initialized');
        } catch (error) {
            console.error('AudioEngine failed to initialize:', error);
        }
    }
    
    async resume() {
        if (this.context && this.context.state === 'suspended') {
            await this.context.resume();
        }
    }
    
    createSounds() {
        // Weapon sounds with realistic characteristics
        this.sounds.set('rifle_shot', () => this.createRifleShot());
        this.sounds.set('pistol_shot', () => this.createPistolShot());
        this.sounds.set('shotgun_shot', () => this.createShotgunShot());
        
        // Environment sounds
        this.sounds.set('water_splash', () => this.createWaterSplash());
        this.sounds.set('boat_engine', () => this.createBoatEngine());
        this.sounds.set('wind_ambient', () => this.createWindAmbient());
        
        // UI/Action sounds
        this.sounds.set('weapon_reload', () => this.createReloadSound());
        this.sounds.set('weapon_pickup', () => this.createPickupSound());
        this.sounds.set('boat_enter', () => this.createBoatEnterSound());
        this.sounds.set('boat_exit', () => this.createBoatExitSound());
        
        // Impact sounds
        this.sounds.set('bullet_hit_metal', () => this.createBulletHitMetal());
        this.sounds.set('bullet_hit_wood', () => this.createBulletHitWood());
        this.sounds.set('bullet_hit_water', () => this.createBulletHitWater());
        
        // Player feedback
        this.sounds.set('player_damage', () => this.createPlayerDamageSound());
        this.sounds.set('player_death', () => this.createPlayerDeathSound());
        this.sounds.set('enemy_kill', () => this.createEnemyKillSound());
    }
    
    createRifleShot() {
        const duration = 0.3;
        const oscillator = this.context.createOscillator();
        const gain = this.context.createGain();
        const filter = this.context.createBiquadFilter();
        const noise = this.createWhiteNoise(duration);
        
        // Main crack sound
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(200, this.context.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(80, this.context.currentTime + 0.05);
        
        // Filter for realism
        filter.type = 'bandpass';
        filter.frequency.value = 2000;
        filter.Q.value = 0.5;
        
        // Sharp attack, quick decay
        gain.gain.setValueAtTime(0.8, this.context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.3, this.context.currentTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + duration);
        
        oscillator.connect(filter);
        filter.connect(gain);
        noise.connect(gain);
        gain.connect(this.sfxGain);
        
        oscillator.start(this.context.currentTime);
        oscillator.stop(this.context.currentTime + duration);
        
        return gain;
    }
    
    createPistolShot() {
        const duration = 0.2;
        const oscillator = this.context.createOscillator();
        const gain = this.context.createGain();
        
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(300, this.context.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(150, this.context.currentTime + 0.03);
        
        gain.gain.setValueAtTime(0.6, this.context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + duration);
        
        oscillator.connect(gain);
        gain.connect(this.sfxGain);
        
        oscillator.start(this.context.currentTime);
        oscillator.stop(this.context.currentTime + duration);
        
        return gain;
    }
    
    createShotgunShot() {
        const duration = 0.4;
        const gain = this.context.createGain();
        
        // Multiple oscillators for scatter effect
        for (let i = 0; i < 5; i++) {
            const osc = this.context.createOscillator();
            const oscGain = this.context.createGain();
            
            osc.type = 'square';
            osc.frequency.setValueAtTime(180 + i * 20, this.context.currentTime);
            osc.frequency.exponentialRampToValueAtTime(60 + i * 10, this.context.currentTime + 0.1);
            
            oscGain.gain.setValueAtTime(0.2, this.context.currentTime + i * 0.01);
            oscGain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + duration);
            
            osc.connect(oscGain);
            oscGain.connect(gain);
            
            osc.start(this.context.currentTime + i * 0.005);
            osc.stop(this.context.currentTime + duration);
        }
        
        const noise = this.createWhiteNoise(duration * 0.5);
        noise.connect(gain);
        
        gain.connect(this.sfxGain);
        return gain;
    }
    
    createWaterSplash() {
        const duration = 0.6;
        const noise = this.createWhiteNoise(duration);
        const filter = this.context.createBiquadFilter();
        const gain = this.context.createGain();
        
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, this.context.currentTime);
        filter.frequency.exponentialRampToValueAtTime(200, this.context.currentTime + duration);
        
        gain.gain.setValueAtTime(0.4, this.context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + duration);
        
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxGain);
        
        return gain;
    }
    
    createBoatEngine() {
        const oscillator = this.context.createOscillator();
        const gain = this.context.createGain();
        const filter = this.context.createBiquadFilter();
        
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(80, this.context.currentTime);
        
        filter.type = 'lowpass';
        filter.frequency.value = 300;
        
        gain.gain.setValueAtTime(0.3, this.context.currentTime);
        
        oscillator.connect(filter);
        filter.connect(gain);
        gain.connect(this.ambientGain);
        
        oscillator.start(this.context.currentTime);
        
        return { oscillator, gain, filter };
    }
    
    createWindAmbient() {
        const noise = this.createWhiteNoise(60); // Long ambient sound
        const filter = this.context.createBiquadFilter();
        const gain = this.context.createGain();
        
        filter.type = 'bandpass';
        filter.frequency.value = 400;
        filter.Q.value = 0.3;
        
        gain.gain.setValueAtTime(0.15, this.context.currentTime);
        
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ambientGain);
        
        return gain;
    }
    
    createReloadSound() {
        const duration = 1.2;
        const gain = this.context.createGain();
        
        // Metal clicking sounds
        const times = [0, 0.3, 0.5, 0.8, 1.0];
        times.forEach((time, index) => {
            const osc = this.context.createOscillator();
            const oscGain = this.context.createGain();
            
            osc.type = 'square';
            osc.frequency.value = 800 + Math.random() * 400;
            
            oscGain.gain.setValueAtTime(0.3, this.context.currentTime + time);
            oscGain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + time + 0.1);
            
            osc.connect(oscGain);
            oscGain.connect(gain);
            
            osc.start(this.context.currentTime + time);
            osc.stop(this.context.currentTime + time + 0.1);
        });
        
        gain.connect(this.sfxGain);
        return gain;
    }
    
    createPickupSound() {
        const duration = 0.3;
        const oscillator = this.context.createOscillator();
        const gain = this.context.createGain();
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(400, this.context.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(800, this.context.currentTime + duration);
        
        gain.gain.setValueAtTime(0.4, this.context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + duration);
        
        oscillator.connect(gain);
        gain.connect(this.sfxGain);
        
        oscillator.start(this.context.currentTime);
        oscillator.stop(this.context.currentTime + duration);
        
        return gain;
    }
    
    createBoatEnterSound() {
        const duration = 0.5;
        const oscillator = this.context.createOscillator();
        const gain = this.context.createGain();
        
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(300, this.context.currentTime);
        oscillator.frequency.linearRampToValueAtTime(200, this.context.currentTime + duration);
        
        gain.gain.setValueAtTime(0.5, this.context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + duration);
        
        oscillator.connect(gain);
        gain.connect(this.sfxGain);
        
        oscillator.start(this.context.currentTime);
        oscillator.stop(this.context.currentTime + duration);
        
        return gain;
    }
    
    createBoatExitSound() {
        const duration = 0.4;
        const oscillator = this.context.createOscillator();
        const gain = this.context.createGain();
        
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(200, this.context.currentTime);
        oscillator.frequency.linearRampToValueAtTime(300, this.context.currentTime + duration);
        
        gain.gain.setValueAtTime(0.5, this.context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + duration);
        
        oscillator.connect(gain);
        gain.connect(this.sfxGain);
        
        oscillator.start(this.context.currentTime);
        oscillator.stop(this.context.currentTime + duration);
        
        return gain;
    }
    
    createBulletHitMetal() {
        const duration = 0.2;
        const oscillator = this.context.createOscillator();
        const gain = this.context.createGain();
        
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(1200, this.context.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(400, this.context.currentTime + duration);
        
        gain.gain.setValueAtTime(0.6, this.context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + duration);
        
        oscillator.connect(gain);
        gain.connect(this.sfxGain);
        
        oscillator.start(this.context.currentTime);
        oscillator.stop(this.context.currentTime + duration);
        
        return gain;
    }
    
    createBulletHitWood() {
        const duration = 0.15;
        const noise = this.createWhiteNoise(duration);
        const filter = this.context.createBiquadFilter();
        const gain = this.context.createGain();
        
        filter.type = 'bandpass';
        filter.frequency.value = 600;
        filter.Q.value = 2;
        
        gain.gain.setValueAtTime(0.4, this.context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + duration);
        
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxGain);
        
        return gain;
    }
    
    createBulletHitWater() {
        const duration = 0.3;
        const noise = this.createWhiteNoise(duration);
        const filter = this.context.createBiquadFilter();
        const gain = this.context.createGain();
        
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(400, this.context.currentTime);
        filter.frequency.exponentialRampToValueAtTime(100, this.context.currentTime + duration);
        
        gain.gain.setValueAtTime(0.3, this.context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + duration);
        
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxGain);
        
        return gain;
    }
    
    createPlayerDamageSound() {
        const duration = 0.2;
        const oscillator = this.context.createOscillator();
        const gain = this.context.createGain();
        
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(150, this.context.currentTime);
        oscillator.frequency.linearRampToValueAtTime(100, this.context.currentTime + duration);
        
        gain.gain.setValueAtTime(0.7, this.context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + duration);
        
        oscillator.connect(gain);
        gain.connect(this.sfxGain);
        
        oscillator.start(this.context.currentTime);
        oscillator.stop(this.context.currentTime + duration);
        
        return gain;
    }
    
    createPlayerDeathSound() {
        const duration = 1.0;
        const oscillator = this.context.createOscillator();
        const gain = this.context.createGain();
        const filter = this.context.createBiquadFilter();
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(400, this.context.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(50, this.context.currentTime + duration);
        
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, this.context.currentTime);
        filter.frequency.exponentialRampToValueAtTime(100, this.context.currentTime + duration);
        
        gain.gain.setValueAtTime(0.8, this.context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + duration);
        
        oscillator.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxGain);
        
        oscillator.start(this.context.currentTime);
        oscillator.stop(this.context.currentTime + duration);
        
        return gain;
    }
    
    createEnemyKillSound() {
        const duration = 0.4;
        const oscillator = this.context.createOscillator();
        const gain = this.context.createGain();
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(800, this.context.currentTime);
        oscillator.frequency.linearRampToValueAtTime(1200, this.context.currentTime + duration);
        
        gain.gain.setValueAtTime(0.6, this.context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + duration);
        
        oscillator.connect(gain);
        gain.connect(this.sfxGain);
        
        oscillator.start(this.context.currentTime);
        oscillator.stop(this.context.currentTime + duration);
        
        return gain;
    }
    
    createWhiteNoise(duration) {
        const bufferSize = this.context.sampleRate * duration;
        const buffer = this.context.createBuffer(1, bufferSize, this.context.sampleRate);
        const output = buffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }
        
        const noise = this.context.createBufferSource();
        noise.buffer = buffer;
        noise.start(this.context.currentTime);
        
        return noise;
    }
    
    play(soundName, volume = 1, pitch = 1) {
        if (!this.context || !this.sounds.has(soundName)) {
            console.warn(`Sound "${soundName}" not found`);
            return;
        }
        
        try {
            const soundFunction = this.sounds.get(soundName);
            const sound = soundFunction();
            
            if (sound && sound.gain) {
                sound.gain.gain.value *= volume;
            }
            
            // Apply pitch shifting if needed
            if (pitch !== 1 && sound && sound.oscillator) {
                sound.oscillator.frequency.value *= pitch;
            }
            
        } catch (error) {
            console.error(`Error playing sound "${soundName}":`, error);
        }
    }
    
    setMasterVolume(volume) {
        if (this.masterGain) {
            this.masterGain.gain.value = Math.max(0, Math.min(1, volume));
        }
    }
    
    setSFXVolume(volume) {
        if (this.sfxGain) {
            this.sfxGain.gain.value = Math.max(0, Math.min(1, volume));
        }
    }
    
    setMusicVolume(volume) {
        if (this.musicGain) {
            this.musicGain.gain.value = Math.max(0, Math.min(1, volume));
        }
    }
    
    setAmbientVolume(volume) {
        if (this.ambientGain) {
            this.ambientGain.gain.value = Math.max(0, Math.min(1, volume));
        }
    }
}