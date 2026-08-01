import { LanguageMode, Sentence, VoiceGenderPreference } from '../types';

export type VoiceGender = 'male' | 'female' | 'neutral';

export interface TTSVoiceOption {
  name: string;
  lang: string;
  voiceURI: string;
  gender: VoiceGender;
  isPremium: boolean;
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
      // Mobile Safari / iOS / Android Chrome fallback — voices often load late
      setTimeout(() => this.loadVoices(), 500);
      setTimeout(() => this.loadVoices(), 1500);
    }
  }

  public refreshVoices(): SpeechSynthesisVoice[] {
    this.loadVoices();
    return this.voices;
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

  /** Detect gender from voice name and URI (includes Android Google TTS codes). */
  public detectGender(name: string, voiceURI = ''): VoiceGender {
    const lower = `${name} ${voiceURI}`.toLowerCase();

    // Android / Chrome OS Google TTS native IDs (most reliable on Android)
    // FR male: frd, frb | FR female: frc, fra, vlf | CA male: cab, cad | CA female: caa, cac
    if (/fr-fr-x-fr[db]\b/.test(lower) || /fr-ca-x-ca[bd]\b/.test(lower)) return 'male';
    if (/fr-fr-x-fr[ac]\b/.test(lower) || /fr-fr-x-vlf\b/.test(lower) || /fr-ca-x-ca[ac]\b/.test(lower)) {
      return 'female';
    }

    // Chrome OS / Android display names: "Google français 3/5" = male, "1/2/4" = female
    if (/fran[cç]ais\s*[35]\b/.test(lower) || /french\s*[35]\b/.test(lower)) return 'male';
    if (/fran[cç]ais\s*[124]\b/.test(lower) || /french\s*[124]\b/.test(lower)) return 'female';

    if (/#male\b|\bmasculine\b|\bmasculin\b|\bhomme\b|\bmale\b/.test(lower)) return 'male';
    if (/#female\b|\bfeminine\b|\bféminin\b|\bfeminin\b|\bfemme\b|\bfemale\b/.test(lower)) return 'female';

    const maleNames = [
      'thomas', 'paul', 'daniel', 'nicolas', 'claude', 'david', 'mark', 'george', 'fred',
      'alex', 'james', 'richard', 'gordon', 'arthur', 'remy', 'henri', 'pierre', 'alain', 'bruno', 'gilles',
      'jacques', 'mathieu', 'philippe', 'jean', 'steve', 'gerard', 'fabrice', 'antoine', 'thierry',
      'microsoft paul', 'microsoft david', 'microsoft mark', 'microsoft henri', 'microsoft remy',
    ];
    const femaleNames = [
      'amélie', 'amelie', 'aurelie', 'aurélie', 'hortense', 'julie', 'virginie', 'celine',
      'samantha', 'victoria', 'karen', 'fiona', 'moira', 'zira', 'denise', 'marie', 'claire', 'genevieve',
      'audrey', 'chloe', 'chloë', 'lea', 'léa', 'manon', 'florence', 'vivienne', 'charline', 'ariane',
      'eloise', 'sylvie', 'chantal', 'aude', 'microsoft zira', 'microsoft hortense', 'microsoft julie',
    ];

    if (maleNames.some((m) => lower.includes(m))) return 'male';
    if (femaleNames.some((f) => lower.includes(f))) return 'female';
    return 'neutral';
  }

  public detectVoiceGender(v: SpeechSynthesisVoice): VoiceGender {
    return this.detectGender(v.name, v.voiceURI);
  }

  /**
   * Pitch for preferred gender when the engine only exposes a neutral/wrong-gender voice
   * (common on Android Chrome). Leave natural pitch when a real matching voice is selected.
   */
  public resolvePitch(voice: SpeechSynthesisVoice | null, preferred: VoiceGenderPreference): number {
    const detected = voice ? this.detectVoiceGender(voice) : 'neutral';
    if (preferred === 'male') {
      if (detected === 'male') return 1.0;
      // Neutral/female Android locale voice → deepen toward male
      return detected === 'female' ? 0.7 : 0.78;
    }
    if (detected === 'female') return 1.0;
    if (detected === 'male') return 1.2;
    return 1.05;
  }

  private scoreVoice(v: SpeechSynthesisVoice): number {
    let score = 0;
    const name = v.name.toLowerCase();
    const uri = v.voiceURI.toLowerCase();

    // Premium / High Quality indicators
    if (name.includes('premium') || uri.includes('premium')) score += 100;
    if (name.includes('enhanced') || uri.includes('enhanced')) score += 90;
    if (name.includes('natural') || uri.includes('natural')) score += 80;
    if (name.includes('siri') || uri.includes('siri')) score += 70;
    if (name.includes('google') || uri.includes('google')) score += 60;
    if (name.includes('network') || uri.includes('network')) score += 50;
    if (uri.includes('-local') || name.includes('-local')) score += 40;

    // Popular high-fidelity natural iOS & Windows voices
    if (
      name.includes('thomas') ||
      name.includes('amélie') ||
      name.includes('amelie') ||
      name.includes('audrey') ||
      name.includes('marie') ||
      name.includes('daniel') ||
      name.includes('samantha') ||
      name.includes('aurelie')
    ) {
      score += 30;
    }

    // Prefer known Android male French packs when ranking
    if (/fr-fr-x-fr[db]\b/.test(uri) || /fr-fr-x-fr[db]\b/.test(name)) score += 45;
    if (/fr-ca-x-ca[bd]\b/.test(uri) || /fr-ca-x-ca[bd]\b/.test(name)) score += 40;

    // Penalize compact/low-quality robot fallbacks
    if (name.includes('compact') || uri.includes('compact')) score -= 50;

    if (v.localService) score += 10;

    return score;
  }

  private filterByLang(prefix: 'fr' | 'en'): SpeechSynthesisVoice[] {
    if (!this.voices.length && this.synth) this.loadVoices();
    return [...this.voices]
      .filter((v) => v.lang.toLowerCase().startsWith(prefix))
      .sort((a, b) => this.scoreVoice(b) - this.scoreVoice(a));
  }

  public getAvailableVoices(): TTSVoiceOption[] {
    if (this.voices.length === 0 && this.synth) {
      this.loadVoices();
    }

    const sorted = [...this.voices].sort((a, b) => this.scoreVoice(b) - this.scoreVoice(a));

    return sorted.map((v) => {
      const gender = this.detectVoiceGender(v);
      const score = this.scoreVoice(v);
      const isPremium = score >= 50;
      const genderTag = gender === 'neutral' ? '' : ` · ${gender}`;

      return {
        name: `${v.name} (${v.lang})${genderTag}`,
        lang: v.lang,
        voiceURI: v.voiceURI,
        gender,
        isPremium,
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
    const frVoices = this.filterByLang('fr');
    return frVoices.find((v) => this.detectVoiceGender(v) === 'male') || null;
  }

  public getFrenchFemaleVoice(): SpeechSynthesisVoice | null {
    const frVoices = this.filterByLang('fr');
    return (
      frVoices.find((v) => this.detectVoiceGender(v) === 'female') ||
      frVoices[0] ||
      this.getDefaultVoice('fr')
    );
  }

  public getEnglishMaleVoice(): SpeechSynthesisVoice | null {
    const enVoices = this.filterByLang('en');
    return enVoices.find((v) => this.detectVoiceGender(v) === 'male') || null;
  }

  public getEnglishFemaleVoice(): SpeechSynthesisVoice | null {
    const enVoices = this.filterByLang('en');
    return (
      enVoices.find((v) => this.detectVoiceGender(v) === 'female') ||
      enVoices[0] ||
      this.getDefaultVoice('en')
    );
  }

  /** Best voice for a language + preferred gender (falls back to best available). */
  public getVoiceForGender(lang: 'en' | 'fr', gender: VoiceGenderPreference): SpeechSynthesisVoice | null {
    const matches = this.filterByLang(lang);
    const gendered = matches.find((v) => this.detectVoiceGender(v) === gender);
    if (gendered) return gendered;
    return matches[0] || this.getDefaultVoice(lang);
  }

  /**
   * Prefer a real gendered pack when the engine exposes one (Android fr-fr-x-frd, iOS Thomas, etc.).
   * Otherwise keep the user's saved URI / best available — pitch handles the rest.
   */
  private resolveVoice(
    lang: 'en' | 'fr',
    savedURI: string | undefined,
    gender: VoiceGenderPreference
  ): SpeechSynthesisVoice | null {
    const matches = this.filterByLang(lang);
    const gendered = matches.find((v) => this.detectVoiceGender(v) === gender);
    if (gendered) return gendered;

    if (savedURI) {
      const saved = this.getVoiceByURI(savedURI);
      if (saved) return saved;
    }
    return matches[0] || this.getDefaultVoice(lang);
  }

  public getDefaultVoice(lang: 'en' | 'fr'): SpeechSynthesisVoice | null {
    if (!this.voices.length && this.synth) {
      this.loadVoices();
    }
    if (!this.voices.length) return null;

    const matches = this.filterByLang(lang);
    return matches[0] || this.voices[0] || null;
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
      targetVoiceGender?: VoiceGenderPreference;
      nativeVoiceGender?: VoiceGenderPreference;
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
      const frGender = options.targetVoiceGender || 'female';
      const enGender = options.nativeVoiceGender || 'female';

      const frVoice = this.resolveVoice('fr', options.targetVoiceURI, frGender);
      const enVoice = this.resolveVoice('en', options.nativeVoiceURI, enGender);

      const speakParts: Array<{
        text: string;
        voice: SpeechSynthesisVoice | null;
        defaultLang: string;
        pitch: number;
      }> = [];

      if (options.languageMode === 'en_fr') {
        speakParts.push({
          text: sentence.native,
          voice: enVoice,
          defaultLang: 'en-US',
          pitch: this.resolvePitch(enVoice, enGender),
        });
        speakParts.push({
          text: sentence.target,
          voice: frVoice,
          defaultLang: 'fr-FR',
          pitch: this.resolvePitch(frVoice, frGender),
        });
      } else if (options.languageMode === 'fr_en') {
        speakParts.push({
          text: sentence.target,
          voice: frVoice,
          defaultLang: 'fr-FR',
          pitch: this.resolvePitch(frVoice, frGender),
        });
        speakParts.push({
          text: sentence.native,
          voice: enVoice,
          defaultLang: 'en-US',
          pitch: this.resolvePitch(enVoice, enGender),
        });
      } else if (options.languageMode === 'fr_only') {
        speakParts.push({
          text: sentence.target,
          voice: frVoice,
          defaultLang: 'fr-FR',
          pitch: this.resolvePitch(frVoice, frGender),
        });
      } else if (options.languageMode === 'en_only') {
        speakParts.push({
          text: sentence.native,
          voice: enVoice,
          defaultLang: 'en-US',
          pitch: this.resolvePitch(enVoice, enGender),
        });
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
          utterance.pitch = part.pitch;
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
