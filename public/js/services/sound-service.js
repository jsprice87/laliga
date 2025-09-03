/**
 * Sound Service
 * Manages game sounds and audio feedback
 */

import { Logger } from '../utils/logger.js';

export class SoundService {
  constructor() {
    this.logger = new Logger('SoundService');
    this.enabled = this.getSoundPreference();
  }

  /**
   * Get user sound preference
   */
  getSoundPreference() {
    try {
      return localStorage.getItem('laliga-sounds') !== 'false';
    } catch (e) {
      return true;
    }
  }

  /**
   * Set sound preference
   */
  setSoundPreference(enabled) {
    this.enabled = enabled;
    try {
      localStorage.setItem('laliga-sounds', enabled.toString());
    } catch (e) {
      // Ignore localStorage errors
    }
  }

  /**
   * Play game sound
   */
  playGameSound(type) {
    if (!this.enabled) return;

    try {
      // Simple audio feedback using Web Audio API
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Different sounds for different actions
      switch (type) {
        case 'nav':
          oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
          gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
          break;
        case 'success':
          oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime);
          oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1);
          gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
          break;
        case 'error':
          oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
          gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
          break;
        case 'achievement':
          // Victory fanfare
          oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime);
          oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1);
          oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.2);
          gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
          break;
        default:
          oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
          gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
      }

      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.5);

    } catch (error) {
      this.logger.debug('Audio playback failed:', error);
    }
  }

  /**
   * Play navigation sound
   */
  playNavSound() {
    this.playGameSound('nav');
  }

  /**
   * Play success sound
   */
  playSuccessSound() {
    this.playGameSound('success');
  }

  /**
   * Play error sound
   */
  playErrorSound() {
    this.playGameSound('error');
  }

  /**
   * Play achievement sound
   */
  playAchievementSound() {
    this.playGameSound('achievement');
  }

  /**
   * Toggle sound on/off
   */
  toggle() {
    this.setSoundPreference(!this.enabled);
    return this.enabled;
  }

  /**
   * Check if sounds are enabled
   */
  isEnabled() {
    return this.enabled;
  }
}