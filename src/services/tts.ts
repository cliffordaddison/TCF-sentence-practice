import { LanguageMode, Sentence } from '../types';

export type VoiceGender = 'male' | 'female' | 'neutral';

export interface TTSVoiceOption {
  name: string;
  lang: string;
  voiceURI: string;
  gender: VoiceGender;
}

class TTSService {
  private synth: SpeechSynthesis | null = typeof window !== 'undefined' ? window.speechSynthesis : null;
  private voices: SpeechSynthesisVoice[] = [];
  private isPlaying = false;
  private isPaused = false;
  private onVoicesLoadedCallbacks: Array<() => void> = [];
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private timeoutId: any = null;

  constructor() {
    if (this.synth) {
      this.loadVoices();
      if ('onvoiceschanged' in this.synth) {
        this.synth.onvoiceschanged = () => this.loadVoices();
      }
    }
  }

  private loadVoices() {
    if (!this.synth) return;
    const available = this.synth.getVoices();
    if (available && available.length > 0) {
      this.voices = available;
      this.onVoicesLoadedCallbacks.forEach((cb) => cb());
    }
  }

  public onVoicesLoaded(callback: () => void) {
    this.onVoicesLoadedCallbacks.push(callback);
    if (this.voices.length > 0) {
      callback();
    }
  }

  public detectGender(name: string): VoiceGender {
    const lower = name.toLowerCase();
    const maleNames = [
      'male', 'homme', 'thomas', 'paul', 'daniel', 'nicolas', 'claude', 'david', 'mark', 'george', 'fred',
      'alex', 'james', 'richard', 'gordon', 'arthur', 'remy', 'henri', 'pierre', 'alain', 'bruno', 'gilles',
      'jacques', 'mathieu', 'philippe', 'jean', 'steve', 'microsoft paul', 'microsoft david', 'microsoft mark'
    ];
    const femaleNames = [
      'female', 'femme', 'amélie', 'amelie', 'aurelie', 'aurélie', 'hortense', 'julie', 'virginie', 'celine',
      'samantha', 'victoria', 'karen', 'fiona', 'moira', 'zira', 'denise', 'marie', 'claire', 'genevieve',
      'audrey', 'chloe', 'chloë', 'lea', 'léa', 'manon', 'florence', 'microsoft zira', 'microsoft hortense', 'microsoft julie'
    ];

    if (maleNames.some((m) => lower.includes(m))) return 'male';
    if (femaleNames.some((f) => lower.includes(f))) return 'female';
    return 'neutral';
  }

  public getAvailableVoices(): TTSVoiceOption[] {
    if (this.voices.length === 0 && this.synth) {
      this.loadVoices();
    }
    return this.voices.map((v) => {
      const gender = this.detectGender(v.name);
      const symbol = gender === 'male' ? '👨 ' : gender === 'female' ? '👩 ' : '';
      return {
        name: `${symbol}${v.name} (${v.lang})`,
        lang: v.lang,
        voiceURI: v.voiceURI,
        gender,
      };
    });
  }

  public getEnglishVoices(): TTSVoiceOption[] {
    return this.getAvailableVoices().filter(
      (v) => v.lang.toLowerCase().startsWith('en') || v.lang.toLowerCase().includes('en-')
    );
  }

  public getFrenchVoices(): TTSVoiceOption[] {
    return this.getAvailableVoices().filter(
      (v) => v.lang.toLowerCase().startsWith('fr') || v.lang.toLowerCase().includes('fr-')
    );
  }

  public getFrenchMaleVoice(): SpeechSynthesisVoice | null {
    if (!this.voices.length && this.synth) this.loadVoices();
    const frVoices = this.voices.filter((v) => v.lang.toLowerCase().startsWith('fr'));
    return (
      frVoices.find((v) => this.detectGender(v.name) === 'male') ||
      frVoices.find((v) => v.name.toLowerCase().includes('thomas') || v.name.toLowerCase().includes('paul') || v.name.toLowerCase().includes('daniel')) ||
      this.getDefaultVoice('fr')
    );
  }

  public getFrenchFemaleVoice(): SpeechSynthesisVoice | null {
    if (!this.voices.length && this.synth) this.loadVoices();
    const frVoices = this.voices.filter((v) => v.lang.toLowerCase().startsWith('fr'));
    return (
      frVoices.find((v) => this.detectGender(v.name) === 'female') ||
      frVoices.find((v) => v.name.toLowerCase().includes('amélie') || v.name.toLowerCase().includes('hortense') || v.name.toLowerCase().includes('julie')) ||
      this.getDefaultVoice('fr')
    );
  }

  public getEnglishMaleVoice(): SpeechSynthesisVoice | null {
    if (!this.voices.length && this.synth) this.loadVoices();
    const enVoices = this.voices.filter((v) => v.lang.toLowerCase().startsWith('en'));
    return (
      enVoices.find((v) => this.detectGender(v.name) === 'male') ||
      enVoices.find((v) => v.name.toLowerCase().includes('daniel') || v.name.toLowerCase().includes('david') || v.name.toLowerCase().includes('alex')) ||
      this.getDefaultVoice('en')
    );
  }

  public getEnglishFemaleVoice(): SpeechSynthesisVoice | null {
    if (!this.voices.length && this.synth) this.loadVoices();
    const enVoices = this.voices.filter((v) => v.lang.toLowerCase().startsWith('en'));
    return (
      enVoices.find((v) => this.detectGender(v.name) === 'female') ||
      enVoices.find((v) => v.name.toLowerCase().includes('samantha') || v.name.toLowerCase().includes('zira') || v.name.toLowerCase().includes('victoria')) ||
      this.getDefaultVoice('en')
    );
  }

  public getDefaultVoice(lang: 'en' | 'fr'): SpeechSynthesisVoice | null {
    if (!this.voices.length && this.synth) {
      this.loadVoices();
    }
    if (!this.voices.length) return null;

    const prefix = lang === 'fr' ? 'fr' : 'en';
    const matches = this.voices.filter((v) => v.lang.toLowerCase().startsWith(prefix));

    // Preferred high-quality voices
    const preferred = matches.find(
      (v) =>
        v.name.includes('Google') ||
        v.name.includes('Natural') ||
        v.name.includes('Enhanced') ||
        v.name.includes('Thomas') ||
        v.name.includes('Amélie') ||
        v.name.includes('Samantha') ||
        v.name.includes('Aurelie') ||
        v.name.includes('Daniel')
    );

    return preferred || matches[0] || this.voices[0] || null;
  }

  public getVoiceByURI(voiceURI: string): SpeechSynthesisVoice | null {
    if (!voiceURI) return null;
    if (!this.voices.length && this.synth) {
      this.loadVoices();
    }
    return this.voices.find((v) => v.voiceURI === voiceURI) || null;
  }

  public stop() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    if (this.synth) {
      try {
        if (this.synth.paused) {
          this.synth.resume();
        }
        this.synth.cancel();
      } catch (err) {
        // Ignore synthesis cancel exceptions
      }
    }
    this.currentUtterance = null;
    this.isPlaying = false;
    this.isPaused = false;
  }

  public pause() {
    if (this.synth && this.isPlaying) {
      try {
        this.synth.pause();
        this.isPaused = true;
      } catch (err) {
        // Ignore
      }
    }
  }

  public resume() {
    if (this.synth && this.isPaused) {
      try {
        this.synth.resume();
        this.isPaused = false;
      } catch (err) {
        // Ignore
      }
    }
  }

  public speakSentence(
    sentence: Sentence,
    options: {
      languageMode: LanguageMode;
      playbackSpeed: number;
      targetVoiceURI?: string;
      nativeVoiceURI?: string;
      onEnd?: () => void;
      onError?: (err: any) => void;
    }
  ): Promise<void> {
    return new Promise((resolve) => {
      if (!this.synth) {
        options.onEnd?.();
        resolve();
        return;
      }

      // Stop previous utterance safely
      this.stop();
      this.isPlaying = true;

      const rate = Math.max(0.5, Math.min(2.0, options.playbackSpeed));

      // Resolve voices
      const frVoice = options.targetVoiceURI
        ? this.getVoiceByURI(options.targetVoiceURI) || this.getDefaultVoice('fr')
        : this.getDefaultVoice('fr');

      const enVoice = options.nativeVoiceURI
        ? this.getVoiceByURI(options.nativeVoiceURI) || this.getDefaultVoice('en')
        : this.getDefaultVoice('en');

      const speakParts: Array<{
        text: string;
        voice: SpeechSynthesisVoice | null;
        defaultLang: string;
      }> = [];

      if (options.languageMode === 'en_fr') {
        // English first, French second
        speakParts.push({ text: sentence.native, voice: enVoice, defaultLang: 'en-US' });
        speakParts.push({ text: sentence.target, voice: frVoice, defaultLang: 'fr-FR' });
      } else if (options.languageMode === 'fr_en') {
        // French first, English second
        speakParts.push({ text: sentence.target, voice: frVoice, defaultLang: 'fr-FR' });
        speakParts.push({ text: sentence.native, voice: enVoice, defaultLang: 'en-US' });
      } else if (options.languageMode === 'fr_only') {
        // French only
        speakParts.push({ text: sentence.target, voice: frVoice, defaultLang: 'fr-FR' });
      } else if (options.languageMode === 'en_only') {
        // English only
        speakParts.push({ text: sentence.native, voice: enVoice, defaultLang: 'en-US' });
      }

      let currentIndex = 0;

      const speakNextPart = () => {
        if (!this.isPlaying || currentIndex >= speakParts.length) {
          this.isPlaying = false;
          options.onEnd?.();
          resolve();
          return;
        }

        const part = speakParts[currentIndex];
        currentIndex++;

        if (!part.text || !part.text.trim()) {
          speakNextPart();
          return;
        }

        try {
          // Unstick Chrome speech synthesis queue if paused
          if (this.synth?.paused) {
            this.synth.resume();
          }

          const utterance = new SpeechSynthesisUtterance(part.text);
          utterance.rate = rate;
          utterance.lang = part.voice?.lang || part.defaultLang;

          if (part.voice) {
            utterance.voice = part.voice;
          }

          // Save utterance reference to avoid GC cutoff bug in Chromium
          this.currentUtterance = utterance;

          let hasEnded = false;
          const finishPart = () => {
            if (hasEnded) return;
            hasEnded = true;
            if (this.timeoutId) {
              clearTimeout(this.timeoutId);
              this.timeoutId = null;
            }
            this.currentUtterance = null;

            if (this.isPlaying && currentIndex < speakParts.length) {
              setTimeout(speakNextPart, 250);
            } else {
              this.isPlaying = false;
              options.onEnd?.();
              resolve();
            }
          };

          utterance.onend = () => {
            finishPart();
          };

          utterance.onerror = (e) => {
            // Ignore benign cancel/interrupt events
            if (e.error !== 'canceled' && e.error !== 'interrupted') {
              console.warn('Speech synthesis non-fatal note:', e.error || e);
            }
            finishPart();
          };

          // Safety fallback timeout in case browser TTS event hangs
          const estimatedDuration = Math.max(3000, (part.text.length * 150) / rate);
          this.timeoutId = setTimeout(() => {
            finishPart();
          }, estimatedDuration);

          this.synth.speak(utterance);
        } catch (err) {
          console.warn('Speech synthesis catch fallback:', err);
          this.isPlaying = false;
          options.onEnd?.();
          resolve();
        }
      };

      // Short delay after stop() to let browser release speech lock
      setTimeout(speakNextPart, 50);
    });
  }
}

export const ttsService = new TTSService();

