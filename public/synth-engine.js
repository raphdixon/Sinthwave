/**
 * AETHER-909 // Built-In Analog-Modeled WebAudio Synthesizer & Master FX Rack
 * Provides immediate zero-setup studio sound for all 5 hardware synth roles
 * (808/909 Drums, TB-303 Acid, Moog Model D Bass, Prophet-5 Lead, Juno-60/CS-80 Pads)
 * + Analog Tape Delay, Lexicon Hall Reverb, Master DJ Filter, and Bus Compressor.
 */

export class AnalogStudioDSP {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.analyser = null;
    this.djFilter = null;
    this.compressor = null;
    this.delayNode = null;
    this.delayFeedback = null;
    this.delayWet = null;
    this.reverbNode = null;
    this.reverbWet = null;

    // Last note state for true 303 slide & Moog glide
    this.lastAcidFreq = 65.41;
    this.lastMoogFreq = 43.65;
    this.lastLeadFreq = 261.63;
    this.openHatGain = null; // For closed-hat choke of open-hat
  }

  init() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AudioCtx({ latencyHint: 'interactive' });

    // Master Bus Chain: Voices -> Master DJ Filter -> Bus Compressor -> Saturator -> Master Gain -> Analyser -> Out
    this.djFilter = this.ctx.createBiquadFilter();
    this.djFilter.type = 'lowpass';
    this.djFilter.frequency.value = 18500;
    this.djFilter.Q.value = 1.1;

    this.compressor = this.ctx.createDynamicsCompressor();
    this.compressor.threshold.value = -14;
    this.compressor.knee.value = 8;
    this.compressor.ratio.value = 3.5;
    this.compressor.attack.value = 0.005;
    this.compressor.release.value = 0.14;

    this.masterSaturator = this.ctx.createWaveShaper();
    this.masterSaturator.curve = this._makeSoftClipCurve(1.45);
    this.masterSaturator.oversample = '2x';

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.85;

    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 1024;
    this.analyser.smoothingTimeConstant = 0.78;

    // Analog Tape Delay Bus (Delay TAPE-201 style)
    this.delaySendBus = this.ctx.createGain();
    this.delayNode = this.ctx.createDelay(2.0);
    this.delayNode.delayTime.value = 0.357; // Dotted 8th @ 126 BPM
    this.delayFilter = this.ctx.createBiquadFilter();
    this.delayFilter.type = 'bandpass';
    this.delayFilter.frequency.value = 1350;
    this.delayFilter.Q.value = 0.7;
    this.delayFeedback = this.ctx.createGain();
    this.delayFeedback.gain.value = 0.42;
    this.delayWet = this.ctx.createGain();
    this.delayWet.gain.value = 0.32;

    this.delaySendBus.connect(this.delayNode);
    this.delayNode.connect(this.delayFilter);
    this.delayFilter.connect(this.delayFeedback);
    this.delayFeedback.connect(this.delayNode);
    this.delayFilter.connect(this.delayWet);
    this.delayWet.connect(this.djFilter);

    // Lexicon LX-24 Style Lush Stereo Hall Reverb Bus
    this.reverbSendBus = this.ctx.createGain();
    this.reverbNode = this.ctx.createConvolver();
    this.reverbNode.buffer = this._createHallImpulse(2.8, 2.4);
    this.reverbWet = this.ctx.createGain();
    this.reverbWet.gain.value = 0.38;

    this.reverbSendBus.connect(this.reverbNode);
    this.reverbNode.connect(this.reverbWet);
    this.reverbWet.connect(this.djFilter);

    // Connect Master Chain
    this.djFilter.connect(this.compressor);
    this.compressor.connect(this.masterSaturator);
    this.masterSaturator.connect(this.masterGain);
    this.masterGain.connect(this.analyser);
    this.analyser.connect(this.ctx.destination);

    // Pre-generate shared noise buffer
    this.noiseBuffer = this._createNoiseBuffer(2.0);
  }

  midiToFreq(note) {
    return 440 * Math.pow(2, (note - 69) / 12);
  }

  updateMasterFX(fx, bpm = 126) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    // Dotted 8th tape delay synced to BPM
    const beatSec = 60 / Math.max(60, Math.min(200, bpm));
    const dotted8th = beatSec * 0.75;
    this.delayNode.delayTime.setTargetAtTime(dotted8th, now, 0.03);
    this.delayFeedback.gain.setTargetAtTime(Math.min(0.84, (fx.delayFeedback ?? 0.45) * 0.85), now, 0.02);
    this.delayWet.gain.setTargetAtTime((fx.delayMix ?? 0.32) * 0.75, now, 0.02);
    this.reverbWet.gain.setTargetAtTime((fx.reverbMix ?? 0.38) * 0.9, now, 0.02);

    // Bipolar Master DJ Filter: 0..0.47 = LPF sweep, 0.47..0.53 = Open, 0.53..1.0 = HPF sweep
    const mf = fx.masterFilter ?? 0.5;
    if (mf < 0.48) {
      this.djFilter.type = 'lowpass';
      const norm = Math.max(0.01, mf / 0.48);
      const freq = 140 * Math.pow(130, norm);
      this.djFilter.frequency.setTargetAtTime(freq, now, 0.025);
      this.djFilter.Q.setTargetAtTime(1.8, now, 0.02);
    } else if (mf > 0.52) {
      this.djFilter.type = 'highpass';
      const norm = (mf - 0.52) / 0.48;
      const freq = 35 * Math.pow(55, norm);
      this.djFilter.frequency.setTargetAtTime(freq, now, 0.025);
      this.djFilter.Q.setTargetAtTime(1.8, now, 0.02);
    } else {
      this.djFilter.type = 'lowpass';
      this.djFilter.frequency.setTargetAtTime(18500, now, 0.025);
      this.djFilter.Q.setTargetAtTime(0.7, now, 0.02);
    }

    // Drive / Compression
    const drive = fx.busDrive ?? 0.45;
    this.compressor.threshold.setTargetAtTime(-8 - drive * 16, now, 0.03);
  }

  // ==========================================================================
  // UNIT 01: TR-808 / TR-909 ANALOG DRUM COMPUTER
  // ==========================================================================

  triggerDrum(voice, time, velNorm, params = {}) {
    if (!this.ctx) return;
    const t = Math.max(this.ctx.currentTime, time);
    const v = Math.max(0.1, Math.min(1.0, velNorm));
    const punch = params.punch ?? 0.72;
    const decay = params.decay ?? 0.58;
    const snappy = params.snappy ?? 0.65;
    const hatDecay = params.hatDecay ?? 0.42;
    const drive = params.drive ?? 0.45;
    const level = params.level ?? 0.88;

    if (voice === 'kick') {
      const osc = this.ctx.createOscillator();
      const clickOsc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const clickGain = this.ctx.createGain();

      osc.type = 'sine';
      const startFreq = 135 + punch * 85;
      const endFreq = 44;
      const dur = 0.22 + decay * 0.48;

      osc.frequency.setValueAtTime(startFreq, t);
      osc.frequency.exponentialRampToValueAtTime(62, t + 0.038);
      osc.frequency.exponentialRampToValueAtTime(endFreq, t + dur);

      gain.gain.setValueAtTime(v * level * (0.95 + drive * 0.25), t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

      // 909 beater transient click
      clickOsc.type = 'triangle';
      clickOsc.frequency.setValueAtTime(420, t);
      clickOsc.frequency.exponentialRampToValueAtTime(80, t + 0.018);
      clickGain.gain.setValueAtTime(v * punch * 0.45 * level, t);
      clickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.019);

      osc.connect(gain);
      clickOsc.connect(clickGain);
      gain.connect(this.djFilter);
      clickGain.connect(this.djFilter);

      osc.start(t);
      osc.stop(t + dur + 0.02);
      clickOsc.start(t);
      clickOsc.stop(t + 0.025);
    } else if (voice === 'snare') {
      // Dual 808/909 body oscillators + snappy noise wires
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const bodyGain = this.ctx.createGain();

      osc1.type = 'triangle';
      osc2.type = 'sine';
      osc1.frequency.setValueAtTime(220, t);
      osc1.frequency.exponentialRampToValueAtTime(145, t + 0.08);
      osc2.frequency.setValueAtTime(330, t);
      osc2.frequency.exponentialRampToValueAtTime(195, t + 0.07);

      bodyGain.gain.setValueAtTime(v * level * 0.55, t);
      bodyGain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

      osc1.connect(bodyGain);
      osc2.connect(bodyGain);
      bodyGain.connect(this.djFilter);

      const noise = this.ctx.createBufferSource();
      noise.buffer = this.noiseBuffer;
      const hp = this.ctx.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = 1100;
      const noiseGain = this.ctx.createGain();
      const snareDur = 0.14 + snappy * 0.18;
      noiseGain.gain.setValueAtTime(v * level * (0.45 + snappy * 0.45), t);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, t + snareDur);

      noise.connect(hp);
      hp.connect(noiseGain);
      noiseGain.connect(this.djFilter);
      noiseGain.connect(this.reverbSendBus);

      osc1.start(t);
      osc1.stop(t + 0.16);
      osc2.start(t);
      osc2.stop(t + 0.16);
      noise.start(t);
      noise.stop(t + snareDur + 0.02);
    } else if (voice === 'clap') {
      // Classic 808/909 4-tap micro-burst handclap
      const noise = this.ctx.createBufferSource();
      noise.buffer = this.noiseBuffer;
      const bp = this.ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = 1250;
      bp.Q.value = 1.6;
      const gain = this.ctx.createGain();

      const amp = v * level * 0.68;
      gain.gain.setValueAtTime(0.001, t);
      for (let i = 0; i < 3; i++) {
        const offset = i * 0.011;
        gain.gain.setValueAtTime(amp, t + offset);
        gain.gain.exponentialRampToValueAtTime(amp * 0.2, t + offset + 0.009);
      }
      gain.gain.setValueAtTime(amp * 0.9, t + 0.033);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.24);

      noise.connect(bp);
      bp.connect(gain);
      gain.connect(this.djFilter);
      gain.connect(this.reverbSendBus);

      noise.start(t);
      noise.stop(t + 0.26);
    } else if (voice === 'ch' || voice === 'oh') {
      const isOpen = voice === 'oh';
      // Choke any ringing open hat when closed hat triggers
      if (!isOpen && this.openHatGain) {
        try {
          this.openHatGain.gain.cancelScheduledValues(t);
          this.openHatGain.gain.setTargetAtTime(0.0001, t, 0.008);
        } catch (_) {}
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = this.noiseBuffer;
      const hp = this.ctx.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = isOpen ? 6800 : 8200;

      const bp = this.ctx.createBiquadFilter();
      bp.type = 'peaking';
      bp.frequency.value = 9600;
      bp.gain.value = 4.5;

      const gain = this.ctx.createGain();
      const dur = isOpen ? (0.22 + hatDecay * 0.36) : (0.035 + hatDecay * 0.045);

      gain.gain.setValueAtTime(v * level * (isOpen ? 0.42 : 0.36), t);
      gain.gain.exponentialRampToValueAtTime(0.0008, t + dur);

      if (isOpen) this.openHatGain = gain;

      noise.connect(hp);
      hp.connect(bp);
      bp.connect(gain);
      gain.connect(this.djFilter);

      noise.start(t);
      noise.stop(t + dur + 0.02);
    } else if (voice === 'perc') {
      // 808 Rimshot / Conga hybrid
      const osc = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc2.type = 'square';
      osc.frequency.setValueAtTime(460, t);
      osc.frequency.exponentialRampToValueAtTime(290, t + 0.045);
      osc2.frequency.setValueAtTime(1180, t);
      gain.gain.setValueAtTime(v * level * 0.4, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.065);

      osc.connect(gain);
      osc2.connect(gain);
      gain.connect(this.djFilter);
      gain.connect(this.delaySendBus);

      osc.start(t);
      osc.stop(t + 0.075);
      osc2.start(t);
      osc2.stop(t + 0.025);
    }
  }

  // ==========================================================================
  // UNIT 02: ROLAND TB-303 ACID BASSLINE (WITH TRUE ACCENT & SLIDE)
  // ==========================================================================

  triggerAcid303(note, time, duration, accent = false, slide = false, params = {}) {
    if (!this.ctx) return;
    const t = Math.max(this.ctx.currentTime, time);
    const freq = this.midiToFreq(note);

    const cutoffNorm = params.cutoff ?? 0.48;
    const resNorm = params.resonance ?? 0.76;
    const envModNorm = params.envMod ?? 0.68;
    const decayNorm = params.decay ?? 0.46;
    const driveNorm = params.drive ?? 0.55;
    const level = params.level ?? 0.84;

    const osc = this.ctx.createOscillator();
    osc.type = (params.waveform === 'square') ? 'square' : 'sawtooth';

    // True 303 slide glides from previous step's frequency!
    if (slide && this.lastAcidFreq > 20) {
      osc.frequency.setValueAtTime(this.lastAcidFreq, t);
      osc.frequency.exponentialRampToValueAtTime(freq, t + Math.min(0.085, duration * 0.65));
    } else {
      osc.frequency.setValueAtTime(freq, t);
    }
    this.lastAcidFreq = freq;

    // 24dB Acid Ladder Filter (cascaded biquads for authentic squelch)
    const filter1 = this.ctx.createBiquadFilter();
    const filter2 = this.ctx.createBiquadFilter();
    filter1.type = 'lowpass';
    filter2.type = 'lowpass';

    const baseFreq = 85 * Math.pow(36, cutoffNorm);
    const envSpan = baseFreq * (1.2 + envModNorm * 6.5) * (accent ? 1.65 : 1.0);
    const peakFreq = Math.min(14500, baseFreq + envSpan);
    // 303 Accent forces a snappy 180ms filter decay sweep
    const fDecay = accent ? 0.16 : (0.09 + decayNorm * 0.42);

    filter1.frequency.setValueAtTime(peakFreq, t);
    filter1.frequency.exponentialRampToValueAtTime(Math.max(65, baseFreq), t + fDecay);
    filter2.frequency.setValueAtTime(peakFreq, t);
    filter2.frequency.exponentialRampToValueAtTime(Math.max(65, baseFreq), t + fDecay);

    const qVal = 1.2 + resNorm * (accent ? 14.5 : 11.0);
    filter1.Q.value = qVal;
    filter2.Q.value = qVal * 0.55;

    // Acid Distortion Shaper
    const shaper = this.ctx.createWaveShaper();
    shaper.curve = this._makeSoftClipCurve(1.2 + driveNorm * 3.8);

    const vca = this.ctx.createGain();
    const amp = level * (accent ? 0.54 : 0.36);
    const gateDur = slide ? duration * 1.18 : duration * 0.72;

    vca.gain.setValueAtTime(0.001, t);
    vca.gain.linearRampToValueAtTime(amp, t + 0.004);
    vca.gain.exponentialRampToValueAtTime(amp * 0.65, t + gateDur * 0.8);
    vca.gain.exponentialRampToValueAtTime(0.0008, t + gateDur + 0.025);

    const delaySend = this.ctx.createGain();
    delaySend.gain.value = 0.28;

    osc.connect(filter1);
    filter1.connect(filter2);
    filter2.connect(shaper);
    shaper.connect(vca);
    vca.connect(this.djFilter);
    vca.connect(delaySend);
    delaySend.connect(this.delaySendBus);

    osc.start(t);
    osc.stop(t + gateDur + 0.04);
  }

  // ==========================================================================
  // UNIT 03: MOOG MODEL D 3-OSCILLATOR SUB / BASS
  // ==========================================================================

  triggerMoogBass(note, time, duration, velNorm = 0.85, params = {}) {
    if (!this.ctx) return;
    const t = Math.max(this.ctx.currentTime, time);
    const freq = this.midiToFreq(note);

    const cutoffNorm = params.cutoff ?? 0.44;
    const resNorm = params.resonance ?? 0.35;
    const envNorm = params.contour ?? 0.58;
    const detuneNorm = params.detune ?? 0.38;
    const subNorm = params.sub ?? 0.75;
    const level = params.level ?? 0.86;

    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const subOsc = this.ctx.createOscillator();

    osc1.type = 'sawtooth';
    osc2.type = 'sawtooth';
    subOsc.type = 'triangle';

    osc1.frequency.setValueAtTime(freq, t);
    osc2.frequency.setValueAtTime(freq, t);
    osc2.detune.value = 5 + detuneNorm * 18;
    subOsc.frequency.setValueAtTime(freq * 0.5, t); // -1 Octave Warm Moog Sub

    const subGain = this.ctx.createGain();
    subGain.gain.value = 0.5 + subNorm * 0.65;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    const baseCut = 60 * Math.pow(24, cutoffNorm);
    const peakCut = Math.min(8000, baseCut + baseCut * envNorm * 4.5);
    filter.frequency.setValueAtTime(peakCut, t);
    filter.frequency.exponentialRampToValueAtTime(baseCut, t + duration * 0.85);
    filter.Q.value = 0.8 + resNorm * 5.5;

    const vca = this.ctx.createGain();
    const amp = velNorm * level * 0.36;
    vca.gain.setValueAtTime(0.001, t);
    vca.gain.linearRampToValueAtTime(amp, t + 0.006);
    vca.gain.exponentialRampToValueAtTime(amp * 0.6, t + duration * 0.8);
    vca.gain.exponentialRampToValueAtTime(0.001, t + duration + 0.04);

    osc1.connect(filter);
    osc2.connect(filter);
    subOsc.connect(subGain);
    subGain.connect(filter);
    filter.connect(vca);
    vca.connect(this.djFilter);

    osc1.start(t);
    osc2.start(t);
    subOsc.start(t);
    osc1.stop(t + duration + 0.05);
    osc2.stop(t + duration + 0.05);
    subOsc.stop(t + duration + 0.05);
  }

  // ==========================================================================
  // UNIT 04: PROPHET-5 / MS-20 ANALOG LEAD SYNTH
  // ==========================================================================

  triggerProphetLead(note, time, duration, velNorm = 0.8, params = {}) {
    if (!this.ctx) return;
    const t = Math.max(this.ctx.currentTime, time);
    const freq = this.midiToFreq(note);

    const cutoffNorm = params.cutoff ?? 0.62;
    const resNorm = params.resonance ?? 0.42;
    const modNorm = params.lfoMod ?? 0.35;
    const delaySendAmt = params.delaySend ?? 0.58;
    const reverbSendAmt = params.reverbSend ?? 0.48;
    const level = params.level ?? 0.76;

    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    osc1.type = 'sawtooth';
    osc2.type = 'square';

    osc1.frequency.setValueAtTime(freq, t);
    osc2.frequency.setValueAtTime(freq, t);
    osc2.detune.value = 7 + modNorm * 16;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    const baseCut = 240 * Math.pow(22, cutoffNorm);
    const peakCut = Math.min(14000, baseCut * (1.8 + modNorm * 2.2));
    filter.frequency.setValueAtTime(peakCut, t);
    filter.frequency.exponentialRampToValueAtTime(baseCut, t + duration * 0.9);
    filter.Q.value = 1.0 + resNorm * 6.5;

    const vca = this.ctx.createGain();
    const amp = velNorm * level * 0.22;
    vca.gain.setValueAtTime(0.001, t);
    vca.gain.linearRampToValueAtTime(amp, t + 0.008);
    vca.gain.exponentialRampToValueAtTime(amp * 0.55, t + duration * 0.75);
    vca.gain.exponentialRampToValueAtTime(0.0008, t + duration + 0.08);

    const dlySend = this.ctx.createGain();
    dlySend.gain.value = delaySendAmt * 0.65;
    const revSend = this.ctx.createGain();
    revSend.gain.value = reverbSendAmt * 0.65;

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(vca);
    vca.connect(this.djFilter);
    vca.connect(dlySend);
    dlySend.connect(this.delaySendBus);
    vca.connect(revSend);
    revSend.connect(this.reverbSendBus);

    osc1.start(t);
    osc2.start(t);
    osc1.stop(t + duration + 0.1);
    osc2.stop(t + duration + 0.1);
  }

  // ==========================================================================
  // UNIT 05: JUNO-60 / CS-80 LUSH POLYPHONIC CHORD PADS
  // ==========================================================================

  triggerJunoPadChord(notes, time, duration, velNorm = 0.78, params = {}) {
    if (!this.ctx || !Array.isArray(notes) || notes.length === 0) return;
    const t = Math.max(this.ctx.currentTime, time);

    const cutoffNorm = params.cutoff ?? 0.54;
    const chorusNorm = params.chorus ?? 0.68;
    const attackNorm = params.attack ?? 0.45;
    const releaseNorm = params.release ?? 0.62;
    const reverbSendAmt = params.reverbSend ?? 0.72;
    const level = params.level ?? 0.78;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    const baseCut = 180 * Math.pow(20, cutoffNorm);
    filter.frequency.setValueAtTime(baseCut * 0.65, t);
    filter.frequency.exponentialRampToValueAtTime(baseCut * 1.45, t + duration * 0.55);
    filter.frequency.exponentialRampToValueAtTime(baseCut * 0.8, t + duration + 0.4);
    filter.Q.value = 1.1;

    const vca = this.ctx.createGain();
    const atk = 0.08 + attackNorm * 0.55;
    const rel = 0.35 + releaseNorm * 1.1;
    const voiceAmp = (velNorm * level * 0.14) / Math.sqrt(notes.length);

    vca.gain.setValueAtTime(0.0008, t);
    vca.gain.linearRampToValueAtTime(voiceAmp, t + atk);
    vca.gain.setValueAtTime(voiceAmp * 0.85, t + Math.max(atk, duration - 0.05));
    vca.gain.exponentialRampToValueAtTime(0.0005, t + duration + rel);

    const revSend = this.ctx.createGain();
    revSend.gain.value = reverbSendAmt * 0.85;
    const dlySend = this.ctx.createGain();
    dlySend.gain.value = 0.25;

    filter.connect(vca);
    vca.connect(this.djFilter);
    vca.connect(revSend);
    revSend.connect(this.reverbSendBus);
    vca.connect(dlySend);
    dlySend.connect(this.delaySendBus);

    const stopTime = t + duration + rel + 0.05;
    const detuneSpread = 6 + chorusNorm * 18;

    notes.forEach((n, idx) => {
      const freq = this.midiToFreq(n);
      const o1 = this.ctx.createOscillator();
      const o2 = this.ctx.createOscillator();
      o1.type = 'sawtooth';
      o2.type = (idx % 2 === 0) ? 'triangle' : 'sawtooth';
      o1.frequency.setValueAtTime(freq, t);
      o2.frequency.setValueAtTime(freq, t);
      o1.detune.value = -detuneSpread * 0.5;
      o2.detune.value = detuneSpread * 0.5;

      o1.connect(filter);
      o2.connect(filter);
      o1.start(t);
      o2.start(t);
      o1.stop(stopTime);
      o2.stop(stopTime);
    });
  }

  // ==========================================================================
  // DSP HELPERS
  // ==========================================================================

  _makeSoftClipCurve(amount = 2.0) {
    const samples = 4096;
    const curve = new Float32Array(samples);
    for (let i = 0; i < samples; i++) {
      const x = (i * 2) / samples - 1;
      curve[i] = Math.tanh(x * amount);
    }
    return curve;
  }

  _createNoiseBuffer(seconds = 2.0) {
    const sr = this.ctx.sampleRate;
    const len = Math.floor(sr * seconds);
    const buffer = this.ctx.createBuffer(1, len, sr);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  _createHallImpulse(seconds = 2.6, decay = 2.3) {
    const sr = this.ctx.sampleRate;
    const len = Math.floor(sr * seconds);
    const impulse = this.ctx.createBuffer(2, len, sr);
    for (let ch = 0; ch < 2; ch++) {
      const data = impulse.getChannelData(ch);
      for (let i = 0; i < len; i++) {
        const env = Math.pow(1 - i / len, decay);
        data[i] = (Math.random() * 2 - 1) * env * 0.5;
      }
    }
    return impulse;
  }
}
