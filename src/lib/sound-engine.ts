/**
 * Procedural Web Audio API Synthesizer Engine for LunarOps
 * Inspired by 3dsolarsystem.online
 *
 * Zero external audio assets required. All sounds (ambient cosmic drone,
 * telemetry chirps, beacon chimes, LoS alerts, and mechanical scrub ticks)
 * are synthesized in real-time.
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = true;
  private volume: number = 0.4;
  private masterGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;

  // Drone nodes
  private droneGain: GainNode | null = null;
  private droneOsc1: OscillatorNode | null = null;
  private droneOsc2: OscillatorNode | null = null;
  private droneSubOsc: OscillatorNode | null = null;
  private droneFilter: BiquadFilterNode | null = null;
  private isDroneRunning: boolean = false;

  private isInitialized: boolean = false;

  constructor() {
    // Lazy initialization on first user interaction
  }

  /**
   * Initializes the AudioContext on first user gesture.
   */
  public init(): boolean {
    if (this.isInitialized && this.ctx) {
      if (this.ctx.state === "suspended") {
        this.ctx.resume();
      }
      return true;
    }

    try {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return false;

      this.ctx = new AudioContextClass();

      // Master gain
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume, this.ctx.currentTime);

      // Analyser node for live HUD visualizer
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 64;
      this.analyser.smoothingTimeConstant = 0.8;

      this.masterGain.connect(this.analyser);
      this.analyser.connect(this.ctx.destination);

      this.isInitialized = true;
      return true;
    } catch (e) {
      console.warn("Web Audio API initialization deferred or not supported:", e);
      return false;
    }
  }

  /**
   * Starts the subtle ambient cosmic drone.
   * Multi-oscillator harmonic chord at 55Hz (A1) & 110Hz (A2) with low-pass filter.
   */
  public startAmbientDrone() {
    if (!this.init() || !this.ctx || !this.masterGain || this.isDroneRunning) return;

    try {
      const t = this.ctx.currentTime;

      this.droneGain = this.ctx.createGain();
      this.droneGain.gain.setValueAtTime(0.001, t);
      this.droneGain.gain.exponentialRampToValueAtTime(0.12, t + 4.0); // Gentle fade-in

      // Low-pass filter to keep it deep and atmospheric
      this.droneFilter = this.ctx.createBiquadFilter();
      this.droneFilter.type = "lowpass";
      this.droneFilter.frequency.setValueAtTime(140, t);
      this.droneFilter.Q.setValueAtTime(2, t);

      // Slow LFO for filter breath sweep
      const lfo = this.ctx.createOscillator();
      lfo.frequency.setValueAtTime(0.08, t); // 12-second cycle
      const lfoGain = this.ctx.createGain();
      lfoGain.gain.setValueAtTime(40, t);
      lfo.connect(lfoGain);
      lfoGain.connect(this.droneFilter.frequency);
      lfo.start(t);

      // Oscillator 1: 55 Hz sine (deep root)
      this.droneOsc1 = this.ctx.createOscillator();
      this.droneOsc1.type = "sine";
      this.droneOsc1.frequency.setValueAtTime(55, t);

      // Oscillator 2: 110 Hz triangle (warm body)
      this.droneOsc2 = this.ctx.createOscillator();
      this.droneOsc2.type = "triangle";
      this.droneOsc2.frequency.setValueAtTime(110.2, t); // slight detune for cosmic chorus

      // Oscillator 3: 165 Hz subtle fifth harmonic
      this.droneSubOsc = this.ctx.createOscillator();
      this.droneSubOsc.type = "sine";
      this.droneSubOsc.frequency.setValueAtTime(164.8, t);

      const oscGain1 = this.ctx.createGain();
      oscGain1.gain.setValueAtTime(0.6, t);
      const oscGain2 = this.ctx.createGain();
      oscGain2.gain.setValueAtTime(0.3, t);
      const oscGain3 = this.ctx.createGain();
      oscGain3.gain.setValueAtTime(0.15, t);

      this.droneOsc1.connect(oscGain1);
      this.droneOsc2.connect(oscGain2);
      this.droneSubOsc.connect(oscGain3);

      oscGain1.connect(this.droneFilter);
      oscGain2.connect(this.droneFilter);
      oscGain3.connect(this.droneFilter);

      this.droneFilter.connect(this.droneGain);
      this.droneGain.connect(this.masterGain);

      this.droneOsc1.start(t);
      this.droneOsc2.start(t);
      this.droneSubOsc.start(t);

      this.isDroneRunning = true;
    } catch (e) {
      console.warn("Unable to start ambient cosmic drone:", e);
    }
  }

  /**
   * Stops the ambient drone.
   */
  public stopAmbientDrone() {
    if (!this.ctx || !this.isDroneRunning || !this.droneGain) return;
    try {
      const t = this.ctx.currentTime;
      this.droneGain.gain.setValueAtTime(this.droneGain.gain.value, t);
      this.droneGain.gain.exponentialRampToValueAtTime(0.0001, t + 1.5);

      setTimeout(() => {
        try {
          this.droneOsc1?.stop();
          this.droneOsc2?.stop();
          this.droneSubOsc?.stop();
          this.droneOsc1?.disconnect();
          this.droneOsc2?.disconnect();
          this.droneSubOsc?.disconnect();
          this.isDroneRunning = false;
        } catch {}
      }, 1600);
    } catch {}
  }

  /**
   * High-tech tactile UI click chirp (880Hz -> 1760Hz sweep).
   */
  public playClick() {
    if (this.isMuted || !this.init() || !this.ctx || !this.masterGain) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(880, t);
      osc.frequency.exponentialRampToValueAtTime(1760, t + 0.04);

      gain.gain.setValueAtTime(0.18, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.045);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t);
      osc.stop(t + 0.05);
    } catch {}
  }

  /**
   * Sub-bass pulse + crystalline chime when selecting a candidate site.
   */
  public playBeaconSelect() {
    if (this.isMuted || !this.init() || !this.ctx || !this.masterGain) return;
    try {
      const t = this.ctx.currentTime;

      // 1. Sub-bass thump
      const subOsc = this.ctx.createOscillator();
      const subGain = this.ctx.createGain();
      subOsc.type = "sine";
      subOsc.frequency.setValueAtTime(90, t);
      subOsc.frequency.exponentialRampToValueAtTime(35, t + 0.18);
      subGain.gain.setValueAtTime(0.35, t);
      subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
      subOsc.connect(subGain);
      subGain.connect(this.masterGain);
      subOsc.start(t);
      subOsc.stop(t + 0.22);

      // 2. Dual crystalline chimes (E6: 1318.5Hz and B6: 1975.5Hz)
      [1318.5, 1975.5].forEach((freq, idx) => {
        if (!this.ctx || !this.masterGain) return;
        const chime = this.ctx.createOscillator();
        const cGain = this.ctx.createGain();
        const start = t + idx * 0.04;
        chime.type = "triangle";
        chime.frequency.setValueAtTime(freq, start);
        cGain.gain.setValueAtTime(0.16, start);
        cGain.gain.exponentialRampToValueAtTime(0.0005, start + 0.35);
        chime.connect(cGain);
        cGain.connect(this.masterGain);
        chime.start(start);
        chime.stop(start + 0.38);
      });
    } catch {}
  }

  /**
   * Subtle alert chime when transitioning into an obstructed/shadowed period.
   */
  public playLoSAlert() {
    if (this.isMuted || !this.init() || !this.ctx || !this.masterGain) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(320, t);
      osc.frequency.exponentialRampToValueAtTime(220, t + 0.15);

      gain.gain.setValueAtTime(0.1, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);

      const filter = this.ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(800, t);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t);
      osc.stop(t + 0.18);
    } catch {}
  }

  /**
   * Mechanical tick when scrubbing the timeline slider.
   */
  public playScrubTick() {
    if (this.isMuted || !this.init() || !this.ctx || !this.masterGain) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(1200, t);
      gain.gain.setValueAtTime(0.06, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.015);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t);
      osc.stop(t + 0.02);
    } catch {}
  }

  /**
   * Aerospace aerodynamic whoosh sound for panel animations and camera transitions.
   */
  public playWhoosh() {
    if (this.isMuted || !this.init() || !this.ctx || !this.masterGain) return;
    try {
      const t = this.ctx.currentTime;
      const bufferSize = Math.floor(this.ctx.sampleRate * 0.24);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(350, t);
      filter.frequency.exponentialRampToValueAtTime(1400, t + 0.12);
      filter.frequency.exponentialRampToValueAtTime(300, t + 0.23);
      filter.Q.setValueAtTime(3.2, t);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.exponentialRampToValueAtTime(0.18, t + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.23);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      noise.start(t);
      noise.stop(t + 0.24);
    } catch {}
  }

  /**
   * Rapid high-frequency blip (8ms, 1900Hz) during numeric telemetry CountUp.
   */
  public playDataTick() {
    if (this.isMuted || !this.init() || !this.ctx || !this.masterGain) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(1850 + Math.random() * 250, t);
      gain.gain.setValueAtTime(0.035, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.012);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t);
      osc.stop(t + 0.014);
    } catch {}
  }

  /**
   * Sci-Fi diagnostic scan sound (dual ascending chime + laser resonance).
   */
  public playScanDiagnostic() {
    if (this.isMuted || !this.init() || !this.ctx || !this.masterGain) return;
    try {
      const t = this.ctx.currentTime;

      // Sweep oscillator
      const sweepOsc = this.ctx.createOscillator();
      const sweepGain = this.ctx.createGain();
      sweepOsc.type = "sine";
      sweepOsc.frequency.setValueAtTime(320, t);
      sweepOsc.frequency.exponentialRampToValueAtTime(1350, t + 0.32);
      sweepGain.gain.setValueAtTime(0.16, t);
      sweepGain.gain.exponentialRampToValueAtTime(0.001, t + 0.36);

      sweepOsc.connect(sweepGain);
      sweepGain.connect(this.masterGain);
      sweepOsc.start(t);
      sweepOsc.stop(t + 0.38);

      // Resonant harmonic ping
      const pingOsc = this.ctx.createOscillator();
      const pingGain = this.ctx.createGain();
      pingOsc.type = "triangle";
      pingOsc.frequency.setValueAtTime(1760, t + 0.18);
      pingGain.gain.setValueAtTime(0.001, t);
      pingGain.gain.setValueAtTime(0.14, t + 0.18);
      pingGain.gain.exponentialRampToValueAtTime(0.0005, t + 0.55);

      pingOsc.connect(pingGain);
      pingGain.connect(this.masterGain);
      pingOsc.start(t + 0.18);
      pingOsc.stop(t + 0.58);
    } catch {}
  }

  /**
   * Toggle mute state.
   */
  public toggleMute(): boolean {
    this.init();
    this.isMuted = !this.isMuted;

    if (this.ctx && this.masterGain) {
      const t = this.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(t);
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume, t);
    }

    if (!this.isMuted) {
      this.startAmbientDrone();
      this.playClick();
    } else {
      this.stopAmbientDrone();
    }

    return this.isMuted;
  }

  /**
   * Set volume [0.0, 1.0].
   */
  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (!this.isMuted && this.ctx && this.masterGain) {
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
    }
  }

  public getVolume(): number {
    return this.volume;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  /**
   * Retrieves live frequency data for the HUD audio visualizer.
   */
  public getVisualizerData(array: Uint8Array): void {
    if (this.analyser && !this.isMuted) {
      (this.analyser as unknown as { getByteFrequencyData: (arr: unknown) => void }).getByteFrequencyData(array);
    } else {
      array.fill(0);
    }
  }
}

// Global Singleton Instance
export const soundEngine = typeof window !== "undefined" ? new SoundEngine() : (null as unknown as SoundEngine);
