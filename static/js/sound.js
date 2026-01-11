/**
 * Sound Manager using Web Audio API
 * Generates retro-style synthesized sounds without external assets
 */
class SoundManager {
      constructor() {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            this.muted = localStorage.getItem('snake_muted') === 'true';
            this.bgmOscillators = [];
            this.isBgmPlaying = false;
            this.masterGain = this.ctx.createGain();
            this.masterGain.connect(this.ctx.destination);
            this.updateMuteState();
      }

      updateMuteState() {
            if (this.muted) {
                  this.masterGain.gain.setValueAtTime(0, this.ctx.currentTime);
            } else {
                  this.masterGain.gain.setValueAtTime(0.3, this.ctx.currentTime);
            }
      }

      toggleMute() {
            this.muted = !this.muted;
            localStorage.setItem('snake_muted', this.muted);
            this.updateMuteState();

            // Resume context if suspended (browser policy)
            if (this.ctx.state === 'suspended') {
                  this.ctx.resume();
            }

            return this.muted;
      }

      /**
       * Play a retro 'eat' sound (high pitched jump)
       */
      playEat() {
            if (this.ctx.state === 'suspended') this.ctx.resume();

            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.connect(gain);
            gain.connect(this.masterGain);

            osc.type = 'square';
            osc.frequency.setValueAtTime(440, this.ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.1);

            gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);

            osc.start();
            osc.stop(this.ctx.currentTime + 0.1);
      }

      /**
       * Play a retro 'game over' sound (descending slide)
       */
      playGameOver() {
            if (this.ctx.state === 'suspended') this.ctx.resume();

            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.connect(gain);
            gain.connect(this.masterGain);

            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(440, this.ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(55, this.ctx.currentTime + 0.5);

            gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.5);

            osc.start();
            osc.stop(this.ctx.currentTime + 0.5);
      }

      /**
       * Play a simple background melody
       */
      startBgm() {
            if (this.isBgmPlaying) return;
            this.isBgmPlaying = true;

            if (this.ctx.state === 'suspended') this.ctx.resume();

            this.playBgmLoop();
      }

      playBgmLoop() {
            if (!this.isBgmPlaying) return;

            // Simple arpeggio pattern: C4, E4, G4, A4
            const notes = [261.63, 329.63, 392.00, 440.00];
            const duration = 0.2; // seconds per note
            const gap = 0.05; // gap between loops

            let startTime = this.ctx.currentTime;

            notes.forEach((freq, index) => {
                  const osc = this.ctx.createOscillator();
                  const gain = this.ctx.createGain();

                  osc.connect(gain);
                  gain.connect(this.masterGain);

                  osc.type = 'sine';
                  osc.frequency.value = freq;

                  // Envelope
                  const noteStart = startTime + index * duration;
                  const noteEnd = noteStart + duration - 0.05;

                  gain.gain.setValueAtTime(0, noteStart);
                  gain.gain.linearRampToValueAtTime(0.1, noteStart + 0.05);
                  gain.gain.linearRampToValueAtTime(0, noteEnd);

                  osc.start(noteStart);
                  osc.stop(noteEnd);
            });

            // Loop
            this.bgmTimer = setTimeout(() => {
                  if (this.isBgmPlaying) this.playBgmLoop();
            }, (notes.length * duration + gap) * 1000);
      }

      stopBgm() {
            this.isBgmPlaying = false;
            if (this.bgmTimer) {
                  clearTimeout(this.bgmTimer);
            }
      }
}

// Export a singleton instance
const soundManager = new SoundManager();
