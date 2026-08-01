// Audio session manager for background audio keep-alive and screen wake lock

class AudioSessionManager {
  private wakeLockSentinel: WakeLockSentinel | null = null;
  private silentAudio: HTMLAudioElement | null = null;
  private keepAliveInterval: any = null;
  private isSessionActive = false;

  constructor() {
    if (typeof window !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && this.isSessionActive) {
          this.requestWakeLock();
          this.startSilentAudio();
        }
        if (this.isSessionActive && window.speechSynthesis) {
          try {
            window.speechSynthesis.resume();
          } catch (e) {
            // Ignore
          }
        }
      });

      // Page unload / hide cleanup
      window.addEventListener('pagehide', () => {
        if (!this.isSessionActive) {
          this.releaseWakeLock();
        }
      });
    }
  }

  public async startSession(
    metadata?: { title?: string; artist?: string; album?: string },
    callbacks?: {
      onPlay?: () => void;
      onPause?: () => void;
      onNext?: () => void;
      onPrev?: () => void;
    }
  ) {
    this.isSessionActive = true;

    // 1. Request Screen Wake Lock (keeps screen on continuously while reps run)
    await this.requestWakeLock();

    // 2. Start silent background audio track (keeps audio engine active in OS background)
    this.startSilentAudio();

    // 3. Configure MediaSession API (lock-screen controls & background audio classification)
    this.updateMediaSession(metadata, callbacks);

    // 4. Start speech synthesis keep-alive timer
    this.startKeepAlive();
  }

  public stopSession() {
    this.isSessionActive = false;

    // 1. Release Screen Wake Lock (allows standard device screen timeout)
    this.releaseWakeLock();

    // 2. Stop silent audio track
    this.stopSilentAudio();

    // 3. Clear MediaSession
    if (typeof navigator !== 'undefined' && 'mediaSession' in navigator) {
      try {
        navigator.mediaSession.playbackState = 'paused';
      } catch (e) {
        // Ignore
      }
    }

    // 4. Clear keep-alive timer
    this.stopKeepAlive();
  }

  public updateMediaSession(
    metadata?: { title?: string; artist?: string; album?: string },
    callbacks?: {
      onPlay?: () => void;
      onPause?: () => void;
      onNext?: () => void;
      onPrev?: () => void;
    }
  ) {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;

    try {
      if (metadata) {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: metadata.title || 'Language Practice',
          artist: metadata.artist || 'Repetition Session',
          album: metadata.album || 'Language Islands',
        });
      }

      navigator.mediaSession.playbackState = this.isSessionActive ? 'playing' : 'paused';

      if (callbacks) {
        if (callbacks.onPlay) navigator.mediaSession.setActionHandler('play', callbacks.onPlay);
        if (callbacks.onPause) navigator.mediaSession.setActionHandler('pause', callbacks.onPause);
        if (callbacks.onNext) navigator.mediaSession.setActionHandler('nexttrack', callbacks.onNext);
        if (callbacks.onPrev) navigator.mediaSession.setActionHandler('previoustrack', callbacks.onPrev);
      }
    } catch (e) {
      // Ignore unsupported action handler errors
    }
  }

  private async requestWakeLock() {
    if (typeof navigator === 'undefined' || !('wakeLock' in navigator)) return;
    try {
      if (!this.wakeLockSentinel) {
        this.wakeLockSentinel = await navigator.wakeLock.request('screen');
        this.wakeLockSentinel.addEventListener('release', () => {
          this.wakeLockSentinel = null;
        });
      }
    } catch (err) {
      // Batter saver or doc hidden can prevent wake lock request
    }
  }

  private async releaseWakeLock() {
    if (this.wakeLockSentinel) {
      try {
        await this.wakeLockSentinel.release();
      } catch (err) {
        // Ignore
      }
      this.wakeLockSentinel = null;
    }
  }

  private startSilentAudio() {
    if (typeof window === 'undefined') return;
    if (!this.silentAudio) {
      // 1-second silent WAV audio data URI
      const silentUri = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA==';
      this.silentAudio = new Audio(silentUri);
      this.silentAudio.loop = true;
      this.silentAudio.volume = 0.01;
      this.silentAudio.setAttribute('playsinline', 'true');
      (this.silentAudio as any).playsInline = true;
    }
    this.silentAudio.play().catch(() => {
      // User gesture might be required on initial play
    });
  }

  private stopSilentAudio() {
    if (this.silentAudio) {
      try {
        this.silentAudio.pause();
        this.silentAudio.currentTime = 0;
      } catch (e) {
        // Ignore
      }
    }
  }

  private startKeepAlive() {
    this.stopKeepAlive();
    this.keepAliveInterval = setInterval(() => {
      if (!this.isSessionActive) return;
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        const synth = window.speechSynthesis;
        if (synth.paused) {
          try {
            synth.resume();
          } catch (e) {
            // Ignore
          }
        }
      }
    }, 2500);
  }

  private stopKeepAlive() {
    if (this.keepAliveInterval) {
      clearInterval(this.keepAliveInterval);
      this.keepAliveInterval = null;
    }
  }
}

export const audioSession = new AudioSessionManager();
