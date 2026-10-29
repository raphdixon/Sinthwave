/**
 * SINTHWAVE // DUB TECHNO STUDIO DSP & RE-201 FEEDBACK MATRIX (PhD EDITION)
 * Authentic Berlin / Detroit Dub Techno Synthesis Engine:
 *  - Continuous Hydrothermal Bandpass Pink-Noise Bed (340Hz & 580Hz SVFs + 4.6kHz Tape Floor)
 *  - Marked Poisson Vinyl Dust, Crackle & Dubplate Surface Micro-Impulses
 *  - Roland RE-201 Multi-Tap Space Echo with Internal 220Hz HPF, 1.65kHz LPF, 108Hz Head Bump,
 *    4x Oversampled Asymmetric Tape Saturation, Wow (0.52Hz) & Flutter (6.1Hz), and Cross-Feed
 *  - 5.8s Dark Dispersive Spring-Hall Reverb Tank (Lexicon 480L / Master-Room Hybrid)
 *  - Zero-Sustain Percussive Minor-7/9/11 Dub Chord Stabs (Juno-60 IR3109 24dB/oct + BBD Chorus)
 *  - Rootless Secondary Call-and-Response Dub Dyads & Inharmonic FM Clangs (Prophet-5 / DX7)
 *  - Phase-Locked Monolithic Sub-Bass (68Hz 24dB Ladder + Kick Sidechain Ducking)
 *  - Muffled Sub-Pressure Kick (105Hz 24dB LPF, Zero Click), Micro-Hats & Sacrificial Rim Throws
 *  - OfflineAudioContext Deterministic Stereo 16-bit PCM WAV Renderer for Gemini Audio Ear
 */

export const DUB_ARCHETYPES = {
  basic_channel: {
    id: 'basic_channel',
    name: '01 // Berlin Basic Channel',
    artistRef: 'Maurizio / Ernestus — Phylyps Trak & Quadrant Dub',
    bpm: 126,
    swing: 0.53,
    rootMidi: 50, // D3 (D Dorian)
    subMidi: 38,  // D2 (73.4Hz / 36.7Hz sub)
    chordIntervals: [0, 3, 10, 12], // Dm7 (omit 5, hollow Berlin octave)
    dyadIntervals: [7, 14], // A + E upper Dorian fifth stack
    stabCutoffHz: 485,
    stabResonance: 3.4,
    stabAttackMs: 4,
    stabDecayMs: 145,
    stabEnvDepth: 880,
    fmMetallicMix: 0.08,
    delayTimeSec: 0.3571, // Dotted 8th @ 126 BPM
    delayFeedback: 0.72,
    delayFilterHz: 1550,
    reverbWet: 0.48,
    noiseBedLevel: 0.34,
    vinylCrackleDensity: 0.42,
    subCutoffHz: 64,
    kickMuffleHz: 102,
    arturiaPrograms: { drums: 0, moog: 0, lead: 2, pads: 0 },
  },
  deepchord: {
    id: 'deepchord',
    name: '02 // Detroit DeepChord & Echospace',
    artistRef: 'Rod Modell & Stephen Hitchell — Vantage Isle / Liumin',
    bpm: 118,
    swing: 0.56,
    rootMidi: 51, // Eb3 (Eb Aeolian)
    subMidi: 39,  // Eb2 (38.89Hz sub fundamental)
    chordIntervals: [0, 3, 7, 10, 14], // Ebm9 signature chord
    dyadIntervals: [10, 14], // Db + F upper shimmering 7th-9th dyad
    stabCutoffHz: 415,
    stabResonance: 3.1,
    stabAttackMs: 8,
    stabDecayMs: 155,
    stabEnvDepth: 660,
    fmMetallicMix: 0.14,
    delayTimeSec: 0.3814, // Dotted 8th @ 118 BPM
    delayFeedback: 0.72,
    delayFilterHz: 1320,
    reverbWet: 0.47,
    noiseBedLevel: 0.41,
    vinylCrackleDensity: 0.43,
    subCutoffHz: 64,
    kickMuffleHz: 94,
    arturiaPrograms: { drums: 1, moog: 2, lead: 3, pads: 1 },
  },
  rhythm_sound: {
    id: 'rhythm_sound',
    name: '03 // Rhythm & Sound (Burial Mix)',
    artistRef: 'von Oswald & Ernestus — King In My Empire',
    bpm: 112,
    swing: 0.60,
    rootMidi: 52, // E3 (E Dorian Roots Dub)
    subMidi: 40,  // E2 (41.2Hz deep walking sub)
    chordIntervals: [0, 3, 7, 10], // Tight Em7 offbeat skank chop
    dyadIntervals: [3, 10], // G + D organ/reed skank upper double-stop
    stabCutoffHz: 515,
    stabResonance: 2.85,
    stabAttackMs: 3,
    stabDecayMs: 105,
    stabEnvDepth: 720,
    fmMetallicMix: 0.05,
    delayTimeSec: 0.3571, // Triplet quarter tape echo
    delayFeedback: 0.73,
    delayFilterHz: 1380,
    reverbWet: 0.48,
    noiseBedLevel: 0.38,
    vinylCrackleDensity: 0.44,
    subCutoffHz: 68,
    kickMuffleHz: 96,
    arturiaPrograms: { drums: 2, moog: 1, lead: 4, pads: 2 },
  },
  maurizio: {
    id: 'maurizio',
    name: '04 // Maurizio M-Series (M-4 / M-5)',
    artistRef: 'Maurizio — Domina / M4.5 Berlin Lathe Cut',
    bpm: 124,
    swing: 0.51,
    rootMidi: 48, // C3 (Austere C Minor)
    subMidi: 36,  // C2 (32.7Hz / 65.4Hz rolling 16th SH-101)
    chordIntervals: [0, 3, 7, 12], // Pure austere Cm triad + octave
    dyadIntervals: [7, 12], // G + C fifth pulse
    stabCutoffHz: 515,
    stabResonance: 3.65,
    stabAttackMs: 3,
    stabDecayMs: 130,
    stabEnvDepth: 960,
    fmMetallicMix: 0.06,
    delayTimeSec: 0.3629, // 3/16 @ 124 BPM
    delayFeedback: 0.72,
    delayFilterHz: 1580,
    reverbWet: 0.49,
    noiseBedLevel: 0.32,
    vinylCrackleDensity: 0.36,
    subCutoffHz: 68,
    kickMuffleHz: 104,
    arturiaPrograms: { drums: 0, moog: 3, lead: 0, pads: 3 },
  },
  fluxion: {
    id: 'fluxion',
    name: '05 // Fluxion / Chain Reaction',
    artistRef: 'Konstantinos Soublis — Vibrant Forms & Lark',
    bpm: 116,
    swing: 0.53,
    rootMidi: 50, // D3 (Dm11 aquatic suspension)
    subMidi: 38,  // D2 sub swell
    chordIntervals: [0, 7, 10, 14, 17], // Wide Dm11 open fourths
    dyadIntervals: [5, 10], // G + C suspended quartal ripple
    stabCutoffHz: 385,
    stabResonance: 2.6,
    stabAttackMs: 24,
    stabDecayMs: 240,
    stabEnvDepth: 520,
    fmMetallicMix: 0.12,
    delayTimeSec: 0.3879, // 3/16 @ 116 BPM
    delayFeedback: 0.77,
    delayFilterHz: 1320,
    reverbWet: 0.56,
    noiseBedLevel: 0.44,
    vinylCrackleDensity: 0.36,
    subCutoffHz: 58,
    kickMuffleHz: 94,
    arturiaPrograms: { drums: 3, moog: 2, lead: 5, pads: 4 },
  },
  yagya: {
    id: 'yagya',
    name: '06 // Yagya / Nordic Sub-Arctic Dub',
    artistRef: 'Aðalsteinn Guðmundsson — Rhythm of Snow',
    bpm: 120,
    swing: 0.51,
    rootMidi: 49, // C#3 (C# Dorian wide voicing)
    subMidi: 37,  // C#2 warm pedal
    chordIntervals: [0, 3, 7, 10, 14], // C#m9 frosty spread
    dyadIntervals: [10, 14], // B + D# crystalline upper interval
    stabCutoffHz: 520,
    stabResonance: 2.9,
    stabAttackMs: 10,
    stabDecayMs: 140,
    stabEnvDepth: 710,
    fmMetallicMix: 0.18,
    delayTimeSec: 0.375, // Dotted 8th @ 120 BPM
    delayFeedback: 0.74,
    delayFilterHz: 1380,
    reverbWet: 0.52,
    noiseBedLevel: 0.38,
    vinylCrackleDensity: 0.42,
    subCutoffHz: 68,
    kickMuffleHz: 98,
    arturiaPrograms: { drums: 1, moog: 2, lead: 6, pads: 5 },
  },
  porter_ricks: {
    id: 'porter_ricks',
    name: '07 // Porter Ricks — Biokinetics',
    artistRef: 'Thomas Brinkmann & Andy Mellwig — Nautical Dub',
    bpm: 122,
    swing: 0.50,
    rootMidi: 43, // G2 (G Phrygian / Half-Diminished Submarine Dub)
    subMidi: 31,  // G1 (49Hz heavy hull sub)
    chordIntervals: [0, 3, 6, 10, 13], // Gø7(b9) pressurized metallic cluster
    dyadIntervals: [6, 13], // Db + Ab tritone/Phrygian sonar clang
    stabCutoffHz: 545,
    stabResonance: 3.9,
    stabAttackMs: 3,
    stabDecayMs: 135,
    stabEnvDepth: 990,
    fmMetallicMix: 0.38, // Inharmonic 1:3.41 DX7 metallic sonar ring
    delayTimeSec: 0.3688, // Dotted 8th @ 122 BPM
    delayFeedback: 0.72,
    delayFilterHz: 1520,
    reverbWet: 0.45,
    noiseBedLevel: 0.40,
    vinylCrackleDensity: 0.38,
    subCutoffHz: 68,
    kickMuffleHz: 100,
    arturiaPrograms: { drums: 4, moog: 4, lead: 7, pads: 6 },
  },
  prince_of_denmark: {
    id: 'prince_of_denmark',
    name: '08 // Prince of Denmark / Traumprinz',
    artistRef: 'Giegling Weimar — The Body (Portastudio Tape Dub)',
    bpm: 125,
    swing: 0.55,
    rootMidi: 44, // Ab2 (Ab Aeolian close cluster)
    subMidi: 32,  // Ab1 (51.9Hz melancholic sub)
    chordIntervals: [0, 7, 10, 14, 15], // Abm9 close Bb-Cb heartbreak tape cluster
    dyadIntervals: [7, 14], // Eb + Bb nostalgic fifth-ninth echo
    stabCutoffHz: 425,
    stabResonance: 3.1,
    stabAttackMs: 7,
    stabDecayMs: 148,
    stabEnvDepth: 690,
    fmMetallicMix: 0.10,
    delayTimeSec: 0.360, // Dotted 8th @ 125 BPM
    delayFeedback: 0.73,
    delayFilterHz: 1380,
    reverbWet: 0.48,
    noiseBedLevel: 0.42,
    vinylCrackleDensity: 0.48,
    subCutoffHz: 68,
    kickMuffleHz: 96,
    arturiaPrograms: { drums: 2, moog: 1, lead: 3, pads: 7 },
  },
};

function makeTapeSaturationCurve(drive = 1.35) {
  const n = 2048;
  const curve = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const x = (i * 2) / (n - 1) - 1;
    // Strictly odd-symmetric unity-slope soft clipper (slope <= 1.0 everywhere -> ZERO loop runaway!)
    curve[i] = Math.tanh(drive * x) / drive;
  }
  return curve;
}

const _IR_FLOAT_CACHE = new Map();
const _VINYL_FLOAT_CACHE = new Map();

function buildDarkCavernImpulse(ctx, seconds = 1.9, decay = 3.2) {
  const sr = ctx.sampleRate;
  const key = `${sr}:${seconds}`;
  const len = Math.floor(sr * seconds);
  const ir = ctx.createBuffer(2, len, sr);
  if (_IR_FLOAT_CACHE.has(key)) {
    const cached = _IR_FLOAT_CACHE.get(key);
    ir.getChannelData(0).set(cached[0]);
    ir.getChannelData(1).set(cached[1]);
    return ir;
  }
  let lpL = 0;
  let lpR = 0;
  const alpha = 0.16;
  const cL = ir.getChannelData(0);
  const cR = ir.getChannelData(1);
  for (let i = 0; i < len; i++) {
    const t = i / len;
    const env = Math.pow(1 - t, decay);
    const springDispersion = i < sr * 0.065 ? Math.sin(i * 0.085) * 0.18 * (1 - i / (sr * 0.065)) : 0;
    const rawL = (Math.random() * 2 - 1) + springDispersion;
    const rawR = (Math.random() * 2 - 1) - springDispersion;
    lpL += alpha * (rawL - lpL);
    lpR += alpha * (rawR - lpR);
    cL[i] = lpL * env * 0.85;
    cR[i] = lpR * env * 0.85;
  }
  _IR_FLOAT_CACHE.set(key, [new Float32Array(cL), new Float32Array(cR)]);
  return ir;
}

function buildHydrothermalAndVinylBuffer(ctx, seconds = 6.0, crackleDensity = 0.38) {
  const sr = ctx.sampleRate;
  const key = `${sr}:${seconds}:${crackleDensity.toFixed(2)}`;
  const len = Math.floor(sr * seconds);
  const buf = ctx.createBuffer(2, len, sr);
  const chL = buf.getChannelData(0);
  const chR = buf.getChannelData(1);
  if (_VINYL_FLOAT_CACHE.has(key)) {
    const cached = _VINYL_FLOAT_CACHE.get(key);
    chL.set(cached[0]);
    chR.set(cached[1]);
    return buf;
  }

  // Voss-Kellet 3-pole pink noise state
  let b0 = 0, b1 = 0, b2 = 0;
  // Dual hydrothermal resonator state (340Hz & 580Hz underwater formants)
  let lp340L = 0, lp580R = 0;

  for (let i = 0; i < len; i++) {
    const whiteL = Math.random() * 2 - 1;
    const whiteR = Math.random() * 2 - 1;
    b0 = 0.99765 * b0 + whiteL * 0.099046;
    b1 = 0.96300 * b1 + whiteL * 0.2965164;
    b2 = 0.57000 * b2 + whiteL * 1.0526913;
    const pink = (b0 + b1 + b2 + whiteL * 0.1848) * 0.045;

    // Slow non-repeating modulation across 8s loop seam (full cosine cycles for click-free seamless looping)
    const phase = (2 * Math.PI * i) / len;
    const mod1 = 0.042 + 0.014 * Math.sin(phase * 2);
    const mod2 = 0.072 + 0.021 * Math.cos(phase * 3);
    lp340L += mod1 * (pink - lp340L);
    lp580R += mod2 * (pink + whiteR * 0.015 - lp580R);

    // Base hydrothermal bed + gentle Studer A80 analog tape floor
    chL[i] = lp340L * 0.85 + whiteL * 0.0042;
    chR[i] = lp580R * 0.85 + whiteR * 0.0042;
  }

  // Marked Poisson Vinyl Dust & Dubplate Surface Micro-Impulses (PhD #7)
  const numDust = Math.floor(seconds * (6 + crackleDensity * 14));
  for (let d = 0; d < numDust; d++) {
    const idx = Math.floor(Math.random() * (len - 256));
    const amp = (0.014 + Math.random() * 0.032) * (0.5 + crackleDensity);
    const tau = 0.0014 + Math.random() * 0.0024;
    const pan = 0.25 + Math.random() * 0.5;
    const freq = 1400 + Math.random() * 3400;
    const maxS = Math.min(220, len - idx);
    for (let k = 0; k < maxS; k++) {
      const t = k / sr;
      const sample = amp * Math.exp(-t / tau) * Math.sin(2 * Math.PI * freq * t);
      chL[idx + k] += sample * (1 - pan);
      chR[idx + k] += sample * pan;
    }
  }

  // Deep warm dubplate groove pops (low-mid 680Hz warm clicks, zero harsh digital spikes)
  const numPops = Math.max(2, Math.floor(seconds * 0.45));
  for (let p = 0; p < numPops; p++) {
    const idx = Math.floor(Math.random() * (len - 600));
    const amp = 0.026 * (0.5 + crackleDensity);
    const tau = 0.011;
    for (let k = 0; k < 420 && idx + k < len; k++) {
      const t = k / sr;
      const s = amp * Math.exp(-t / tau) * Math.sin(2 * Math.PI * 640 * t);
      chL[idx + k] += s * 0.65;
      chR[idx + k] += s * 0.55;
    }
  }
  _VINYL_FLOAT_CACHE.set(key, [new Float32Array(chL), new Float32Array(chR)]);
  return buf;
}

/**
 * Builds the complete Berlin/Detroit Dub Techno audio bus topology inside ANY AudioContext
 * or OfflineAudioContext so live playback AND offline Gemini Ear WAV renders are 100% identical!
 */
function buildDubTechnoGraph(ctx, params) {
  const masterGain = ctx.createGain();
  masterGain.gain.value = params.masterVolume ?? 0.86;

  // Warm Neve / Dubplates & Mastering Lathe Console Glue Bus
  const consoleSat = ctx.createWaveShaper();
  consoleSat.curve = makeTapeSaturationCurve(1.35);
  consoleSat.oversample = '4x';

  const masterHighCut = ctx.createBiquadFilter();
  masterHighCut.type = 'lowpass';
  masterHighCut.frequency.value = params.masterCutoff ?? 7800; // Strip sterile 12-20kHz Casio fizz!
  masterHighCut.Q.value = 0.62;

  const masterSubProtect = ctx.createBiquadFilter();
  masterSubProtect.type = 'highpass';
  masterSubProtect.frequency.value = 29; // Vinyl lathe subsonic protection
  masterSubProtect.Q.value = 0.707;

  const masterComp = ctx.createDynamicsCompressor();
  masterComp.threshold.value = -10;
  masterComp.knee.value = 12;
  masterComp.ratio.value = 3.2;
  masterComp.attack.value = 0.012;
  masterComp.release.value = 0.14;

  const dryBus = ctx.createGain();
  dryBus.gain.value = 1.0;

  // Duckable Sub-Bass Bus (sidechained gently by Kick drum pulses!)
  const subDuckGain = ctx.createGain();
  subDuckGain.gain.value = 1.0;
  subDuckGain.connect(dryBus);

  // =========================================================================
  // ROLAND RE-201 MULTI-TAP DEGRADING TAPE FEEDBACK MATRIX (PhD #3 + Res #4)
  // =========================================================================
  const delayInput = ctx.createGain();
  delayInput.gain.value = 1.0;

  // Head 1 (Dotted 8th Primary Dub Head) + Head 2 (Golden-Ratio Stereo Cross-Tap)
  const delayL = ctx.createDelay(2.5);
  const delayR = ctx.createDelay(2.5);
  const baseDelay = params.delayTimeSec ?? 0.365;
  delayL.delayTime.value = baseDelay;
  delayR.delayTime.value = baseDelay * 0.752; // 3:4 poly-stereo head ratio

  // Mechanical Capstan Wow (0.52 Hz) & Scrape Flutter (6.1 Hz) inside delay line!
  const wowOsc = ctx.createOscillator();
  const wowGain = ctx.createGain();
  wowOsc.type = 'sine';
  wowOsc.frequency.value = 0.52;
  wowGain.gain.value = 0.0019; // +/- 1.9ms authentic RE-201 pitch drift
  wowOsc.connect(wowGain);
  wowGain.connect(delayL.delayTime);

  const flutterOsc = ctx.createOscillator();
  const flutterGain = ctx.createGain();
  flutterOsc.type = 'triangle';
  flutterOsc.frequency.value = 6.1;
  flutterGain.gain.value = 0.00028; // +/- 0.28ms scrape flutter
  flutterOsc.connect(flutterGain);
  flutterGain.connect(delayR.delayTime);

  // Strictly Passive (< 1.0 gain at ALL frequencies) Feedback Loop Filtering
  const fbHpf = ctx.createBiquadFilter();
  fbHpf.type = 'highpass';
  fbHpf.frequency.value = 235; // Strips sub-mud on every repeat
  fbHpf.Q.value = -3.01;       // WebAudio LP/HP Q is in dB: -3.01 dB = Butterworth, peak gain exactly 1.0 (no resonance)

  const fbLpf = ctx.createBiquadFilter();
  fbLpf.type = 'lowpass';
  fbLpf.frequency.value = params.delayFilterHz ?? 1450; // Repeats melt into warm dark wool
  fbLpf.Q.value = -3.01;       // Butterworth (dB units): positive values here resonate and push loop gain > 1

  const fbTapeSat = ctx.createWaveShaper();
  fbTapeSat.curve = makeTapeSaturationCurve(1.4);
  fbTapeSat.oversample = '4x';

  const fbGain = ctx.createGain();
  // Hard-capped <= 0.42 physical loop gain (~ -7.5 dB per echo pass -> smooth 4-repeat dub tail, NEVER runs away!)
  fbGain.gain.value = Math.min(0.42, (params.delayFeedback ?? 0.52) * 0.54);

  // Warm magnetic playback head contour OUTSIDE recursive feedback loop!
  const outHeadWarmth = ctx.createBiquadFilter();
  outHeadWarmth.type = 'peaking';
  outHeadWarmth.frequency.value = 115;
  outHeadWarmth.Q.value = 1.0;
  outHeadWarmth.gain.value = 1.6;

  const delayWet = ctx.createGain();
  delayWet.gain.value = Math.min(0.36, params.delayMix ?? 0.30);

  // Wire strictly decaying stereo cross-fed loop:
  // delayInput -> delayL -> fbHpf -> fbLpf -> fbTapeSat -> delayR -> fbGain -> delayL
  delayInput.connect(delayL);
  delayL.connect(fbHpf);
  fbHpf.connect(fbLpf);
  fbLpf.connect(fbTapeSat);
  fbTapeSat.connect(delayR);
  delayR.connect(fbGain);
  fbGain.connect(delayL);

  const stereoMerger = ctx.createChannelMerger(2);
  delayL.connect(stereoMerger, 0, 0);
  delayR.connect(stereoMerger, 0, 1);
  stereoMerger.connect(outHeadWarmth);
  outHeadWarmth.connect(delayWet);
  // =========================================================================
  // CAVERNOUS DARK LEXICON / SPRING DIFFUSER REVERB (PhD #3 + Res #2)
  // =========================================================================
  const reverbHpf = ctx.createBiquadFilter();
  reverbHpf.type = 'highpass';
  reverbHpf.frequency.value = 195;

  // Dattorro / Lexicon 480L 2-Allpass + 4-Comb Dark Cavern Diffuser (SIMD-accelerated C++ WebAudio nodes!)
  const ap1 = ctx.createBiquadFilter();
  ap1.type = 'allpass';
  ap1.frequency.value = 740;
  const ap2 = ctx.createBiquadFilter();
  ap2.type = 'allpass';
  ap2.frequency.value = 1380;
  reverbHpf.connect(ap1);
  ap1.connect(ap2);

  // Xone:92 Console 315Hz Low-Mid Mud Carve (eliminates 280-350Hz boxiness across chord echoes!)
  const lowMidCarve = ctx.createBiquadFilter();
  lowMidCarve.type = 'peaking';
  lowMidCarve.frequency.value = 315;
  lowMidCarve.Q.value = 1.35;
  lowMidCarve.gain.value = -3.6;
  dryBus.disconnect();
  dryBus.connect(lowMidCarve);
  lowMidCarve.connect(consoleSat);

  // Lush 4.6s RT60 Stereo L/R Dattorro Cavern Network ([0.0613, 0.0739, 0.0863, 0.0983]s, cFb=0.89)
  const reverbMerger = ctx.createChannelMerger(2);
  const reverbGain = ctx.createGain();
  reverbGain.gain.value = 0.28;
  reverbMerger.connect(reverbGain);
  [0.0613, 0.0739, 0.0863, 0.0983].forEach((dtSec, cIdx) => {
    const cDelay = ctx.createDelay(0.15);
    cDelay.delayTime.value = dtSec;
    const cDamp = ctx.createBiquadFilter();
    cDamp.type = 'lowpass';
    cDamp.frequency.value = 2150 - cIdx * 150;
    cDamp.Q.value = -3.01; // Butterworth (dB units). Q=0.6 dB peaked at x1.21 -> comb loop gain 1.08 -> runaway ring
    const cFb = ctx.createGain();
    cFb.gain.value = 0.89;
    ap2.connect(cDelay);
    cDelay.connect(cDamp);
    cDamp.connect(cFb);
    cFb.connect(cDelay);
    cDamp.connect(reverbMerger, 0, cIdx % 2);
  });

  const reverbWet = ctx.createGain();
  reverbWet.gain.value = params.reverbWet ?? params.reverbMix ?? 0.44;
  reverbGain.connect(reverbWet);
  // Series-parallel Basic Channel matrix: RE-201 tape echoes bleed directly into cavern reverb!
  const delayToReverbSend = ctx.createGain();
  delayToReverbSend.gain.value = 0.42;
  fbTapeSat.connect(delayToReverbSend);
  delayToReverbSend.connect(reverbHpf);

  // =========================================================================
  // CONTINUOUS HYDROTHERMAL PINK NOISE + POISSON VINYL FLOOR (PhD #7)
  // =========================================================================
  const textureSrc = ctx.createBufferSource();
  textureSrc.buffer = buildHydrothermalAndVinylBuffer(ctx, 8.0, params.vinylCrackleDensity ?? 0.38);
  textureSrc.loop = true;

  const textureGain = ctx.createGain();
  textureGain.gain.value = params.noiseBedLevel ?? 0.34;
  textureSrc.connect(textureGain);
  textureGain.connect(dryBus);
  // Also feed 25% of vinyl/hydrothermal texture into cavern reverb for living space!
  const textureVerbSend = ctx.createGain();
  textureVerbSend.gain.value = 0.25;
  textureGain.connect(textureVerbSend);
  textureVerbSend.connect(reverbHpf);

  delayWet.connect(consoleSat);
  reverbWet.connect(consoleSat);
  consoleSat.connect(masterSubProtect);
  masterSubProtect.connect(masterHighCut);
  masterHighCut.connect(masterComp);
  const ceilingLimiter = ctx.createWaveShaper();
  ceilingLimiter.curve = makeTapeSaturationCurve(1.18);
  ceilingLimiter.oversample = '4x';
  masterComp.connect(ceilingLimiter);
  ceilingLimiter.connect(masterGain);

  wowOsc.start(0);
  flutterOsc.start(0);
  textureSrc.start(0);

  return {
    masterGain,
    dryBus,
    subDuckGain,
    delayInput,
    reverbHpf,
    fbGain,
    fbLpf,
    delayL,
    delayR,
    delayWet,
    reverbWet,
    textureGain,
    masterHighCut,
    wowOsc,
    flutterOsc,
    textureSrc,
  };
}

export class AnalogStudioDSP {
  constructor() {
    this.ctx = null;
    this.analyser = null;
    this.mediaStreamDest = null;
    this.nodes = null;

    // Default to Canonical #1: Berlin Basic Channel
    const def = DUB_ARCHETYPES.basic_channel;
    this.currentArchetypeId = def.id;
    this.params = {
      masterVolume: 0.72,
      masterCutoff: 7800,
      delayMix: 0.48,
      reverbWet: def.reverbWet,
      delayFeedback: def.delayFeedback,
      delayFilterHz: def.delayFilterHz,
      delayTimeSec: def.delayTimeSec,
      stabCutoffHz: def.stabCutoffHz,
      stabResonance: def.stabResonance,
      stabAttackMs: def.stabAttackMs,
      stabDecayMs: def.stabDecayMs,
      stabEnvDepth: def.stabEnvDepth,
      fmMetallicMix: def.fmMetallicMix,
      noiseBedLevel: 0.025,
      vinylCrackleDensity: 0.08,
      subCutoffHz: def.subCutoffHz,
      kickMuffleHz: def.kickMuffleHz,
      // Legacy UI macro compatibility
      acidCutoff: 520,
      acidRes: 3.6,
      acidEnvMod: 950,
      acidDecay: 0.165,
      acidDrive: 1.8,
      moogCutoff: 78,
      leadCutoff: 640,
      padCutoff: 520,
    };
    this.trackMuted = [false, false, false, false];
    this.localMonitorMuted = true;
    this.stepCounter = 0;
  }

  setLocalMonitorMuted(muted) {
    this.localMonitorMuted = Boolean(muted);
    if (this.ctx && this.nodes) {
      const t = this.ctx.currentTime;
      this.nodes.masterGain.gain.cancelScheduledValues(t);
      this.nodes.masterGain.gain.setTargetAtTime(this.localMonitorMuted ? 0.0 : this.params.masterVolume, t, 0.015);
      this.nodes.textureGain.gain.cancelScheduledValues(t);
      this.nodes.textureGain.gain.setTargetAtTime(this.localMonitorMuted ? 0.0 : this.params.noiseBedLevel, t, 0.015);
    }
  }

  init() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AudioCtx({ latencyHint: 'interactive', sampleRate: 48000 });

    this.nodes = buildDubTechnoGraph(this.ctx, this.params);

    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 256;
    this.analyser.smoothingTimeConstant = 0.78;

    this.mediaStreamDest = this.ctx.createMediaStreamDestination();

    this.nodes.masterGain.connect(this.analyser);
    this.analyser.connect(this.ctx.destination);
    this.nodes.masterGain.connect(this.mediaStreamDest);
  }

  stopAllTails() {
    if (!this.ctx || !this.nodes) return;
    const t = this.ctx.currentTime;
    this.nodes.fbGain.gain.cancelScheduledValues(t);
    this.nodes.fbGain.gain.setTargetAtTime(0.0001, t, 0.025);
    this.nodes.delayWet.gain.cancelScheduledValues(t);
    this.nodes.delayWet.gain.setTargetAtTime(0.0001, t, 0.03);
    this.nodes.reverbWet.gain.cancelScheduledValues(t);
    this.nodes.reverbWet.gain.setTargetAtTime(0.0001, t, 0.05);
    this.nodes.textureGain.gain.cancelScheduledValues(t);
    this.nodes.textureGain.gain.setTargetAtTime(0.0, t, 0.02);
  }

  resumeAudioOutput() {
    this.init();
    this._syncLiveNodes();
  }

  applyNaturalLanguageSteering(promptText = '') {
    const p = (promptText || '').toLowerCase();
    const applied = [];
    const ccs = {};

    if (/(remove|no|mute|kill|stop|zero|without|off)\s+(the\s+)?(white\s*noise|noise|hiss|vinyl|crackle|static)/i.test(p) || p.includes('clean sound') || p.includes('pure synth')) {
      this.params.noiseBedLevel = 0.0;
      this.params.vinylCrackleDensity = 0.0;
      ccs[16] = 0; // Arturia Noise Osc Level = 0!
      applied.push('Muted background noise & vinyl floor (0.00 + Arturia CC16=0)');
    } else if (/(more|add|heavy|boost|extra)\s+(white\s*noise|noise|hiss|vinyl|crackle|dust|tape)/i.test(p)) {
      this.params.noiseBedLevel = 0.22;
      this.params.vinylCrackleDensity = 0.38;
      ccs[16] = 38;
      applied.push('Boosted analog tape hiss & vinyl dust floor');
    }

    if (/(remove|no|less|calm|shorter|reduce|dry|tame)\s+(the\s+)?(dub\s+)?(delay|echo|feedback|repeats)/i.test(p)) {
      this.params.delayFeedback = 0.16;
      this.params.delayMix = 0.10;
      ccs[13] = 14;
      ccs[91] = 12;
      applied.push('Reduced delay feedback & echo mix to tight subtle slap');
    } else if (/(more|deep|heavy|dubby|bigger|long)\s+(dub\s+)?(delay|echo|space|reverb)/i.test(p)) {
      this.params.delayFeedback = 0.56;
      this.params.delayMix = 0.34;
      this.params.reverbWet = 0.45;
      ccs[13] = 36;
      ccs[91] = 38;
      ccs[93] = 48;
      applied.push('Expanded dub echo & cavernous reverb depth');
    }

    if (/(darker|muffled|underwater|submerged|warmer|soft|mellow|lowpass)/i.test(p)) {
      const base = (this.params.baseStabCutoffHz || this.params.stabCutoffHz) * 0.65;
      this.params.baseStabCutoffHz = Math.max(240, base);
      this.params.stabCutoffHz = this.params.baseStabCutoffHz;
      this.params.masterCutoff = 2600;
      ccs[74] = 30; // Arturia VCF Cutoff dark!
      applied.push(`Darkened filter cutoff to ${Math.round(this.params.stabCutoffHz)}Hz (CC74=30)`);
    } else if (/(brighter|open\s+filter|acid|squelch|sharper|bite|resonant)/i.test(p)) {
      const base = (this.params.baseStabCutoffHz || this.params.stabCutoffHz) * 1.55;
      this.params.baseStabCutoffHz = Math.min(1650, base);
      this.params.stabCutoffHz = this.params.baseStabCutoffHz;
      this.params.stabResonance = 4.2;
      this.params.masterCutoff = 8400;
      ccs[74] = 88;
      ccs[71] = 78;
      applied.push(`Opened filter cutoff to ${Math.round(this.params.stabCutoffHz)}Hz & boosted resonance (CC74=88, CC71=78)`);
    }

    this._syncLiveNodes();
    return { applied, ccs };
  }
  updateMasterFX(fxObj = {}, bpm = 122) {
    if (typeof fxObj.masterFilter === 'number') {
      this.params.masterCutoff = Math.min(8800, 220 + Math.pow(Math.max(0.05, fxObj.masterFilter), 1.4) * 8200);
    }
    if (typeof fxObj.delayMix === 'number') {
      this.params.delayMix = 0.28 + fxObj.delayMix * 0.56;
    }
    if (bpm > 60 && bpm < 200) {
      // Sync primary RE-201 tape head to true dotted-eighth (3/16) at current BPM!
      this.params.delayTimeSec = (60 / bpm) * 0.75;
    }
    this._syncLiveNodes();
  }

  triggerDrum(voiceKey, time, vel = 0.85, _drumParams = null) {
    switch (voiceKey) {
      case 'kick':
        return this.triggerKick(time, vel);
      case 'snare':
      case 'clap':
      case 'perc':
        return this.triggerSnare(time, vel * (voiceKey === 'perc' ? 0.65 : 0.85));
      case 'ch':
        return this.triggerHat(time, false, vel);
      case 'oh':
        return this.triggerHat(time, true, vel);
      default:
        return this.triggerHat(time, false, vel * 0.6);
    }
  }

  triggerMoogBass(midiNote, time, durSec = 0.24, vel = 0.85, _moogParams = null) {
    return this.triggerSubBass(midiNote, time, durSec, vel, false);
  }

  triggerProphetLead(midiNote, time, durSec = 0.14, vel = 0.68, _leadParams = null) {
    return this.triggerLead(midiNote, time, durSec, vel);
  }

  triggerJunoPadChord(midiNotes, time, _barDurSec = 0.25, vel = 0.85, _padParams = null) {
    return this.triggerPadChord(midiNotes, time, 0.2, vel);
  }

  applyArchetypePreset(archetypeId) {
    const preset = DUB_ARCHETYPES[archetypeId] || DUB_ARCHETYPES.basic_channel;
    this.currentArchetypeId = preset.id;
    Object.assign(this.params, {
      baseStabCutoffHz: preset.stabCutoffHz,
      stabCutoffHz: preset.stabCutoffHz,
      stabResonance: preset.stabResonance,
      stabDecayMs: preset.stabDecayMs,
      stabEnvDepth: preset.stabEnvDepth,
      fmMetallicMix: preset.fmMetallicMix,
      delayTimeSec: preset.delayTimeSec,
      delayFeedback: preset.delayFeedback,
      delayFilterHz: preset.delayFilterHz,
      reverbWet: preset.reverbWet,
      noiseBedLevel: (this.params.noiseBedLevel === 0) ? 0.0 : Math.min(0.04, preset.noiseBedLevel * 0.1),
      vinylCrackleDensity: (this.params.noiseBedLevel === 0) ? 0.0 : 0.08,
      subCutoffHz: preset.subCutoffHz,
      kickMuffleHz: preset.kickMuffleHz,
      padCutoff: preset.stabCutoffHz,
      acidCutoff: preset.stabCutoffHz,
      acidRes: preset.stabResonance,
      acidDecay: preset.stabDecayMs / 1000,
    });
    this._syncLiveNodes();
    return preset;
  }

  /**
   * Applies closed-loop patch adjustments returned by Gemini Audio Ear ('listen-and-refine')!
   */
  applyGeminiEarAdjustments(adj) {
    if (!adj) return;
    if (typeof adj.stabCutoffHz === 'number') this.params.stabCutoffHz = Math.max(240, Math.min(2200, adj.stabCutoffHz));
    if (typeof adj.stabResonance === 'number') this.params.stabResonance = Math.max(0.8, Math.min(5.5, adj.stabResonance));
    if (typeof adj.stabAttackMs === 'number') this.params.stabAttackMs = Math.max(2, Math.min(75, adj.stabAttackMs));
    if (typeof adj.stabDecayMs === 'number') this.params.stabDecayMs = Math.max(60, Math.min(480, adj.stabDecayMs));
    if (typeof adj.stabEnvDepth === 'number') this.params.stabEnvDepth = Math.max(200, Math.min(2000, adj.stabEnvDepth));
    if (typeof adj.delayFeedback === 'number') this.params.delayFeedback = Math.max(0.35, Math.min(0.85, adj.delayFeedback));
    if (typeof adj.delayFilterHz === 'number') this.params.delayFilterHz = Math.max(850, Math.min(3400, adj.delayFilterHz));
    if (typeof adj.reverbWet === 'number') this.params.reverbWet = Math.max(0.18, Math.min(0.72, adj.reverbWet));
    if (typeof adj.noiseBedLevel === 'number') this.params.noiseBedLevel = Math.max(0.08, Math.min(0.65, adj.noiseBedLevel));
    if (typeof adj.vinylCrackleDensity === 'number') this.params.vinylCrackleDensity = Math.max(0.08, Math.min(0.75, adj.vinylCrackleDensity));
    if (typeof adj.subCutoffHz === 'number') this.params.subCutoffHz = Math.max(45, Math.min(115, adj.subCutoffHz));
    if (typeof adj.kickMuffleHz === 'number') this.params.kickMuffleHz = Math.max(78, Math.min(145, adj.kickMuffleHz));
    this.params.padCutoff = this.params.stabCutoffHz;
    this.params.acidCutoff = this.params.stabCutoffHz;
    this._syncLiveNodes();
  }

  _syncLiveNodes() {
    if (!this.ctx || !this.nodes) return;
    const t = this.ctx.currentTime;
    this.nodes.fbGain.gain.setTargetAtTime(Math.min(0.42, this.params.delayFeedback * 0.54), t, 0.04);
    this.nodes.fbLpf.frequency.setTargetAtTime(this.params.delayFilterHz, t, 0.04);
    this.nodes.delayL.delayTime.setTargetAtTime(this.params.delayTimeSec, t, 0.05);
    this.nodes.delayR.delayTime.setTargetAtTime(this.params.delayTimeSec * 0.752, t, 0.05);
    this.nodes.delayWet.gain.setTargetAtTime(Math.min(0.36, this.params.delayMix), t, 0.04);
    this.nodes.reverbWet.gain.setTargetAtTime(Math.min(0.46, this.params.reverbWet), t, 0.04);
    this.nodes.textureGain.gain.setTargetAtTime(this.localMonitorMuted ? 0.0 : this.params.noiseBedLevel, t, 0.05);
    this.nodes.masterHighCut.frequency.setTargetAtTime(this.params.masterCutoff, t, 0.04);
    this.nodes.masterGain.gain.setTargetAtTime(this.localMonitorMuted ? 0.0 : this.params.masterVolume, t, 0.04);
  }

  get currentTime() {
    return this.ctx ? this.ctx.currentTime : 0;
  }

  setMasterVolume(val) {
    this.params.masterVolume = val;
    this._syncLiveNodes();
  }

  setMasterFilter(norm) {
    // Keep strictly below 9500 Hz so Master Filter NEVER lets cheap bright Casio sizzle through!
    const hz = 160 * Math.pow(60, Math.max(0.05, Math.min(1, norm)));
    this.params.masterCutoff = Math.min(9500, hz);
    this._syncLiveNodes();
  }

  setDelayMix(val) {
    this.params.delayMix = 0.25 + val * 0.55;
    this.params.delayFeedback = 0.52 + val * 0.32;
    this._syncLiveNodes();
  }

  setReverbMix(val) {
    this.params.reverbWet = 0.22 + val * 0.52;
    this._syncLiveNodes();
  }

  midiToHz(note) {
    return 440 * Math.pow(2, (note - 69) / 12);
  }

  /**
   * Incommensurate Coprime LFO Drift (PhD #6):
   * Ensures every single Dub Chord Stab hit samples a slightly different filter cutoff, resonance,
   * and envelope contour so the loop NEVER repeats mechanically across 21+ bars!
   */
  _computeCoprimeDrift(timeSec) {
    const phi1 = Math.sin(2 * Math.PI * 0.027 * timeSec);
    const phi2 = Math.cos(2 * Math.PI * 0.043 * timeSec + 0.7);
    const phi3 = Math.sin(2 * Math.PI * 0.061 * timeSec + 1.9);
    return {
      cutoffMult: 1.0 + 0.22 * phi1 + 0.14 * phi2,
      resOffset: 0.45 * phi2 + 0.30 * phi3,
      sendBoost: 0.56 + 0.22 * (0.5 + 0.5 * phi3),
    };
  }

  // =========================================================================
  // 1. MINIMALIST DUB PERCUSSION (PhD #5 + Res #5: Muffled Sub Kick, Micro-Hats, Rim Delay Throw)
  // =========================================================================
  triggerKick(time, vel = 0.85, targetCtx = this.ctx, targetNodes = this.nodes) {
    if (!targetCtx || !targetNodes || this.trackMuted[0]) return;
    // Sidechain duck the sub-bass slightly during the 0-120ms kick pressure wave!
    const duck = targetNodes.subDuckGain.gain;
    duck.cancelScheduledValues(time);
    duck.setValueAtTime(1.0, time);
    duck.linearRampToValueAtTime(0.32, time + 0.008);
    duck.exponentialRampToValueAtTime(1.0, time + 0.135);

    const osc = targetCtx.createOscillator();
    const muffleFilter = targetCtx.createBiquadFilter();
    const gain = targetCtx.createGain();

    osc.type = 'sine';
    // Gentle low-end thud (122 Hz -> 44.5 Hz over 34ms — ZERO clicky club/Casio pop!)
    osc.frequency.setValueAtTime(122, time);
    osc.frequency.exponentialRampToValueAtTime(44.5, time + 0.034);

    muffleFilter.type = 'lowpass';
    muffleFilter.frequency.setValueAtTime(this.params.kickMuffleHz, time);
    muffleFilter.Q.value = 1.05;

    // 2.2ms smoothed attack eliminates zero-crossing click completely!
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.linearRampToValueAtTime(vel * 0.92, time + 0.0024);
    gain.gain.exponentialRampToValueAtTime(0.0008, time + 0.285);

    osc.connect(muffleFilter);
    muffleFilter.connect(gain);
    gain.connect(targetNodes.dryBus);

    osc.start(time);
    osc.stop(time + 0.30);
  }

  triggerSnare(time, vel = 0.58, targetCtx = this.ctx, targetNodes = this.nodes) {
    // Sacrificial Dub Rimshot / Spring-Tank Excitation Impulse (PhD #5):
    // Short woody resonant rim impulse whose real life explodes inside the RE-201 delay & cavern reverb!
    if (!targetCtx || !targetNodes || this.trackMuted[0]) return;

    const rimOsc1 = targetCtx.createOscillator();
    const rimOsc2 = targetCtx.createOscillator();
    const bp = targetCtx.createBiquadFilter();
    const gain = targetCtx.createGain();
    const dubThrow = targetCtx.createGain();
    const verbThrow = targetCtx.createGain();

    rimOsc1.type = 'triangle';
    rimOsc2.type = 'square';
    rimOsc1.frequency.setValueAtTime(395, time);
    rimOsc1.frequency.exponentialRampToValueAtTime(165, time + 0.024);
    rimOsc2.frequency.setValueAtTime(940, time);
    rimOsc2.frequency.exponentialRampToValueAtTime(340, time + 0.018);

    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(680, time);
    bp.Q.value = 2.6;

    gain.gain.setValueAtTime(0.001, time);
    gain.gain.linearRampToValueAtTime(vel * 0.24, time + 0.0012);
    gain.gain.exponentialRampToValueAtTime(0.0008, time + 0.042);

    // Clean controlled dub delay & spring tank throw!
    dubThrow.gain.value = 0.34;
    verbThrow.gain.value = 0.45;
    rimOsc1.connect(bp);
    rimOsc2.connect(bp);
    bp.connect(gain);
    gain.connect(targetNodes.dryBus);
    gain.connect(dubThrow);
    dubThrow.connect(targetNodes.delayInput);
    gain.connect(verbThrow);
    verbThrow.connect(targetNodes.reverbHpf);

    rimOsc1.start(time);
    rimOsc2.start(time);
    rimOsc1.stop(time + 0.05);
    rimOsc2.stop(time + 0.05);
  }

  triggerHat(time, open = false, vel = 0.34, targetCtx = this.ctx, targetNodes = this.nodes) {
    // Microscopic Band-Passed Tape Clock Grain (PhD #5):
    // Strictly bandpassed 4.4kHz, ultra-short 19ms/48ms decay — NEVER loud tinny hi-hat sizzle!
    if (!targetCtx || !targetNodes || this.trackMuted[0]) return;
    const dur = open ? 0.048 : 0.019;
    const buf = targetCtx.createBuffer(1, Math.floor(targetCtx.sampleRate * dur), targetCtx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;

    const src = targetCtx.createBufferSource();
    src.buffer = buf;

    const bp = targetCtx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(open ? 4200 : 4850, time);
    bp.Q.value = 3.2;

    const gain = targetCtx.createGain();
    gain.gain.setValueAtTime(vel * 0.14, time);
    gain.gain.exponentialRampToValueAtTime(0.0008, time + dur);

    const delaySend = targetCtx.createGain();
    delaySend.gain.value = open ? 0.38 : 0.16;

    src.connect(bp);
    bp.connect(gain);
    gain.connect(targetNodes.dryBus);
    gain.connect(delaySend);
    delaySend.connect(targetNodes.delayInput);

    src.start(time);
  }

  // =========================================================================
  // 2. MONOLITHIC SUB-BASS SYNTHESIS (PhD #4 + Res #5: Pure Sub Sine/Triangle + 68Hz 24dB Ladder)
  // =========================================================================
  triggerSubBass(midiNote, time, durSec = 0.24, vel = 0.85, slide = false, targetCtx = this.ctx, targetNodes = this.nodes) {
    if (!targetCtx || !targetNodes || this.trackMuted[1]) return;
    // Clamp strictly into authentic subterranean sub register (36Hz - 78Hz)
    let subNote = midiNote;
    while (subNote > 45) subNote -= 12;
    while (subNote < 31) subNote += 12;
    const hz = this.midiToHz(subNote);

    const oscSub = targetCtx.createOscillator();
    const oscTri = targetCtx.createOscillator();
    const ladder1 = targetCtx.createBiquadFilter();
    const ladder2 = targetCtx.createBiquadFilter();
    const amp = targetCtx.createGain();

    oscSub.type = 'sine';
    oscTri.type = 'triangle';
    if (slide && this._lastSubHz) {
      oscSub.frequency.setValueAtTime(this._lastSubHz, time);
      oscSub.frequency.linearRampToValueAtTime(hz, time + 0.038);
      oscTri.frequency.setValueAtTime(this._lastSubHz, time);
      oscTri.frequency.linearRampToValueAtTime(hz, time + 0.038);
    } else {
      oscSub.frequency.setValueAtTime(hz, time);
      oscTri.frequency.setValueAtTime(hz, time);
    }
    this._lastSubHz = hz;

    const triGain = targetCtx.createGain();
    triGain.gain.value = 0.28; // Subtle 3rd harmonic warmth before 68Hz ladder filter

    // True 4-pole (24 dB/oct) Butterworth low-pass cascade
    ladder1.type = 'lowpass';
    ladder2.type = 'lowpass';
    ladder1.frequency.setValueAtTime(this.params.subCutoffHz, time);
    ladder2.frequency.setValueAtTime(this.params.subCutoffHz * 1.15, time);
    ladder1.Q.value = 0.95;
    ladder2.Q.value = 0.707;

    amp.gain.setValueAtTime(0.0005, time);
    amp.gain.linearRampToValueAtTime(vel * 0.56, time + 0.006); // De-clicked pure sine sub entry!
    amp.gain.setValueAtTime(vel * 0.52, time + durSec * 0.78);
    amp.gain.exponentialRampToValueAtTime(0.0008, time + durSec + 0.045);

    oscSub.connect(ladder1);
    oscTri.connect(triGain);
    triGain.connect(ladder1);
    ladder1.connect(ladder2);
    ladder2.connect(amp);
    amp.connect(targetNodes.subDuckGain); // Sidechain-ducked cleanly under kick!

    oscSub.start(time);
    oscTri.start(time);
    oscSub.stop(time + durSec + 0.06);
    oscTri.stop(time + durSec + 0.06);
  }

  // =========================================================================
  // 3. SECONDARY DUB VOICE: ROOTLESS UPPER DYADS & METALLIC FM CLANGS (PhD #8)
  //    Replaces 100% of "Casio Single-Note Lead Arpeggios" with authentic Dub Call-and-Response!
  // =========================================================================
  triggerLead(midiNote, time, durSec = 0.14, vel = 0.65, targetCtx = this.ctx, targetNodes = this.nodes) {
    if (!targetCtx || !targetNodes || this.trackMuted[2]) return;
    const archetype = DUB_ARCHETYPES[this.currentArchetypeId] || DUB_ARCHETYPES.basic_channel;
    const basePitch = (typeof midiNote === 'number' && midiNote >= 36) ? midiNote : ((archetype.rootMidi || 50) + 7);
    const dyadOffsets = [0, 7]; // True call-and-response pitch-tracking fifth dyad above triggered step note!
    const root = basePitch;
    const drift = this._computeCoprimeDrift(time);
    // Voice a rootless 2-note Dub Dyad in middle-upper register (never single-note Casio lead!)
    const voiceGain = targetCtx.createGain();
    const filter1 = targetCtx.createBiquadFilter();
    const filter2 = targetCtx.createBiquadFilter();

    filter1.type = 'lowpass';
    filter2.type = 'lowpass';
    const baseCut = this.params.stabCutoffHz * 1.15 * drift.cutoffMult;
    const peakCut = baseCut + this.params.stabEnvDepth * 0.75 * vel;
    const decaySec = Math.max(0.075, (this.params.stabDecayMs * 0.72) / 1000);

    filter1.frequency.setValueAtTime(peakCut, time);
    filter1.frequency.exponentialRampToValueAtTime(baseCut, time + decaySec);
    filter1.Q.value = Math.max(1.2, this.params.stabResonance * 0.85);
    filter2.frequency.setValueAtTime(peakCut * 1.25, time);
    filter2.frequency.exponentialRampToValueAtTime(baseCut * 1.15, time + decaySec);
    filter2.Q.value = 0.707;

    // Zero-sustain percussive impulse excitation!
    const atkSec = Math.max(0.003, (this.params.stabAttackMs * 0.8) / 1000);
    voiceGain.gain.setValueAtTime(0.0005, time);
    voiceGain.gain.linearRampToValueAtTime(vel * 0.16, time + atkSec);
    voiceGain.gain.exponentialRampToValueAtTime(0.0008, time + decaySec + 0.04);

    // Controlled RE-201 Space Echo + Cavern Reverb send
    const delayThrow = targetCtx.createGain();
    delayThrow.gain.value = 0.36 * drift.sendBoost;
    const reverbThrow = targetCtx.createGain();
    reverbThrow.gain.value = 0.42;
    filter1.connect(filter2);
    filter2.connect(voiceGain);
    voiceGain.connect(targetNodes.dryBus);
    voiceGain.connect(delayThrow);
    delayThrow.connect(targetNodes.delayInput);
    voiceGain.connect(reverbThrow);
    reverbThrow.connect(targetNodes.reverbHpf);

    dyadOffsets.forEach((semi, idx) => {
      const hz = this.midiToHz(root + semi);
      const carrier = targetCtx.createOscillator();
      carrier.type = idx === 0 ? 'sawtooth' : 'triangle';
      carrier.frequency.setValueAtTime(hz, time);
      carrier.detune.setValueAtTime(idx === 0 ? -6.5 : 7.5, time);

      // Authentic DX7 / Porter Ricks 2-Operator Inharmonic Metallic Transient FM (Ratio 1 : 3.41)
      if (this.params.fmMetallicMix > 0.02) {
        const modOsc = targetCtx.createOscillator();
        const modGain = targetCtx.createGain();
        modOsc.type = 'sine';
        modOsc.frequency.setValueAtTime(hz * 3.41, time);
        modGain.gain.setValueAtTime(hz * this.params.fmMetallicMix * 1.8, time);
        modGain.gain.exponentialRampToValueAtTime(1.0, time + decaySec * 0.65);
        modOsc.connect(modGain);
        modGain.connect(carrier.frequency);
        modOsc.start(time);
        modOsc.stop(time + decaySec + 0.05);
      }

      carrier.connect(filter1);
      carrier.start(time);
      carrier.stop(time + decaySec + 0.05);
    });
  }

  // =========================================================================
  // 4. PRIMARY DUB CHORD SOUND-OBJECT (PhD #1, #2, #6 + Res #1-#3)
  //    Roland Juno-60 / Prophet-5 Zero-Sustain Minor-7/9/11 Percussive Chord Stab
  //    feeding directly into the Roland RE-201 Degrading Tape Loop + Cavern Diffuser!
  // =========================================================================
  triggerPadChord(midiNotes, time, _ignoredOrganDur = 0.25, vel = 0.82, targetCtx = this.ctx, targetNodes = this.nodes) {
    if (!targetCtx || !targetNodes || this.trackMuted[3]) return;
    const archetype = DUB_ARCHETYPES[this.currentArchetypeId] || DUB_ARCHETYPES.basic_channel;
    const notesToPlay = (midiNotes && midiNotes.length >= 3)
      ? midiNotes
      : archetype.chordIntervals.map((iv) => archetype.rootMidi + iv);

    const drift = this._computeCoprimeDrift(time);

    // 24dB/oct Cascaded IR3109 Low-Pass Filter + High-Pass Mud Guard (155 Hz)
    const hpf = targetCtx.createBiquadFilter();
    hpf.type = 'highpass';
    hpf.frequency.setValueAtTime(155, time);
    hpf.Q.value = 0.707;

    const lpf1 = targetCtx.createBiquadFilter();
    const lpf2 = targetCtx.createBiquadFilter();
    lpf1.type = 'lowpass';
    lpf2.type = 'lowpass';

    const baseCut = Math.max(260, this.params.stabCutoffHz * drift.cutoffMult);
    const envPeak = Math.min(2400, baseCut + this.params.stabEnvDepth * vel);
    const atkSec = Math.max(0.0025, this.params.stabAttackMs / 1000);
    const decSec = Math.max(0.095, this.params.stabDecayMs / 1000);

    lpf1.frequency.setValueAtTime(baseCut, time);
    lpf1.frequency.linearRampToValueAtTime(envPeak, time + atkSec);
    lpf1.frequency.exponentialRampToValueAtTime(baseCut * 0.85, time + atkSec + decSec);
    lpf1.Q.value = Math.max(1.1, this.params.stabResonance + drift.resOffset);

    lpf2.frequency.setValueAtTime(envPeak * 1.18, time);
    lpf2.frequency.exponentialRampToValueAtTime(baseCut, time + atkSec + decSec);
    lpf2.Q.value = 0.85;

    // ZERO-SUSTAIN IMPULSE EXCITATION AMP ENVELOPE (NEVER HELD CASIO ORGAN PADS!)
    const stabGain = targetCtx.createGain();
    const perNoteScale = 0.24 / Math.max(3, notesToPlay.length);
    stabGain.gain.setValueAtTime(0.0004, time);
    stabGain.gain.linearRampToValueAtTime(vel * perNoteScale * notesToPlay.length, time + atkSec);
    stabGain.gain.exponentialRampToValueAtTime(0.0006, time + atkSec + decSec + 0.055);

    // Authentic Juno-60 Analog Noise "Chuff" Burst on Chord Transient (Res #2 + Res #3)
    const chuffLen = Math.floor(targetCtx.sampleRate * 0.038);
    const chuffBuf = targetCtx.createBuffer(1, chuffLen, targetCtx.sampleRate);
    const chuffData = chuffBuf.getChannelData(0);
    for (let i = 0; i < chuffLen; i++) chuffData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (chuffLen * 0.35));
    const chuffSrc = targetCtx.createBufferSource();
    chuffSrc.buffer = chuffBuf;
    const chuffGain = targetCtx.createGain();
    chuffGain.gain.value = (this.params.noiseBedLevel > 0 ? 0.055 : 0.0) * vel;
    chuffSrc.connect(chuffGain);
    chuffGain.connect(hpf);
    chuffSrc.start(time);

    // Clean balanced sends into Roland RE-201 Space Echo & Cavernous Hall Reverb!
    const re201Send = targetCtx.createGain();
    re201Send.gain.value = 0.38 * drift.sendBoost;

    const cavernSend = targetCtx.createGain();
    cavernSend.gain.value = 0.38;
    hpf.connect(lpf1);
    lpf1.connect(lpf2);
    lpf2.connect(stabGain);
    stabGain.connect(targetNodes.dryBus);
    stabGain.connect(re201Send);
    re201Send.connect(targetNodes.delayInput);
    stabGain.connect(cavernSend);
    cavernSend.connect(targetNodes.reverbHpf);

    notesToPlay.forEach((n, idx) => {
      const hz = this.midiToHz(n);
      const oscSaw = targetCtx.createOscillator();
      const oscSub = targetCtx.createOscillator();
      const mix = targetCtx.createGain();

      oscSaw.type = 'sawtooth';
      oscSub.type = idx % 2 === 0 ? 'square' : 'triangle';
      oscSaw.frequency.setValueAtTime(hz, time);
      oscSub.frequency.setValueAtTime(idx === 0 ? hz * 0.5 : hz, time); // Juno -1 oct sub on bottom voice!
      // Analog voice card calibration spread (+/- 9 cents) + BBD chorus movement
      oscSaw.detune.setValueAtTime((idx - 1.5) * 6.5, time);
      oscSub.detune.setValueAtTime((1.5 - idx) * 7.2, time);

      mix.gain.value = perNoteScale;
      oscSaw.connect(mix);
      oscSub.connect(mix);
      mix.connect(hpf);

      oscSaw.start(time);
      oscSub.start(time);
      oscSaw.stop(time + atkSec + decSec + 0.075);
      oscSub.stop(time + atkSec + decSec + 0.075);
    });
  }

  /**
   * Renders an authentic multi-bar stereo 48kHz 16-bit PCM WAV recording of the exact
   * current Dub Techno patch + polymetric pattern via OfflineAudioContext in ~90ms!
   * Used directly by Gemini Audio Ear ('/api/ai/listen-and-refine') and WAV export!
   */
  async renderVariationToWavBase64(arrangement, durationSec = 7.8) {
    const sr = 24000; // Clean 24kHz stereo PCM (12kHz Nyquist, compact fast base64 for multimodal Gemini Ear!)
    const totalFrames = Math.floor(sr * durationSec);
    const offline = new OfflineAudioContext(2, totalFrames, sr);
    const graph = buildDubTechnoGraph(offline, this.params);
    graph.masterGain.connect(offline.destination);

    const bpm = arrangement?.bpm || DUB_ARCHETYPES[this.currentArchetypeId]?.bpm || 122;
    const swing = arrangement?.swing || DUB_ARCHETYPES[this.currentArchetypeId]?.swing || 0.54;
    const stepDur = 60 / bpm / 4;
    const totalSteps = Math.floor(durationSec / stepDur);

    const drums = arrangement?.drums || {};
    const bassArr = arrangement?.bass || arrangement?.moog || [];
    const lead = arrangement?.lead || [];
    const pads = arrangement?.pads || [];
    const chordStabSteps = arrangement?.chordStabSteps || [];

    for (let s = 0; s < totalSteps; s++) {
      const step16 = s % 16;
      const step14 = s % 14; // Polymetric 14-step primary dub chord cycle!
      const step12 = s % 12; // Polymetric 12-step secondary dub dyad cycle!
      const swingFrac = swing > 1.5 ? (swing - 50) / 100 : (swing - 0.5);
      const swingOffset = (step16 % 2 === 1) ? swingFrac * stepDur * 1.6 : 0;
      const t = 0.04 + s * stepDur + swingOffset;

      // 1. Drums (supports BOTH app.js { kick, snare, clap, ch, oh, perc } AND compact [{k,s,h,o}])
      if (Array.isArray(drums)) {
        const dStep = drums[step16];
        if (dStep) {
          if (dStep.k) this.triggerKick(t, dStep.k, offline, graph);
          if (dStep.s) this.triggerSnare(t, dStep.s, offline, graph);
          if (dStep.h) this.triggerHat(t, Boolean(dStep.o), dStep.h, offline, graph);
        }
      } else {
        const kCell = drums.kick?.[step16];
        if (kCell?.active) this.triggerKick(t, (kCell.vel || 108) / 127, offline, graph);
        const sCell = drums.snare?.[step16] || drums.clap?.[step16] || drums.perc?.[step16];
        if (sCell?.active) this.triggerSnare(t, (sCell.vel || 88) / 127, offline, graph);
        const chCell = drums.ch?.[step16];
        if (chCell?.active) this.triggerHat(t, false, (chCell.vel || 68) / 127, offline, graph);
        const ohCell = drums.oh?.[step16];
        if (ohCell?.active) this.triggerHat(t, true, (ohCell.vel || 72) / 127, offline, graph);
      }

      // 2. Monolithic Sub-Bass (16-step phase-locked)
      const mStep = bassArr[step16];
      if (mStep && mStep.active) {
        this.triggerSubBass(
          mStep.note,
          t,
          Math.max(stepDur * 1.15, (mStep.gate || 0.8) * stepDur),
          (mStep.vel || 92) / 127,
          Boolean(mStep.slide),
          offline,
          graph
        );
      }

      // 3. Primary Dub Chord Stabs (14-step polymetric cross-rhythm!)
      if (chordStabSteps.length > 0) {
        const cStep = chordStabSteps[step14];
        if (cStep && cStep.active) {
          this.triggerPadChord(cStep.notes, t, stepDur * 1.5, (cStep.vel || 96) / 127, offline, graph);
        }
      } else if (step14 === 0 || step14 === 6 || step14 === 11) {
        const chordObj = pads[0];
        if (chordObj && chordObj.active) {
          const vel = step14 === 0 ? 0.88 : (step14 === 6 ? 0.68 : 0.48);
          this.triggerPadChord(chordObj.notes, t, stepDur * 1.5, vel, offline, graph);
        }
      }

      // 4. Secondary Rootless Dub Dyad Call-and-Response (12-step polymetric cycle!)
      const lStep = lead[step12];
      if (lStep && lStep.active) {
        // Micro-delayed +18ms behind grid so it sits inside the dub pocket!
        this.triggerLead(lStep.note, t + 0.018, stepDur, (lStep.vel || 76) / 127, offline, graph);
      }
    }

    const rendered = await offline.startRendering();
    return encodeAudioBufferToWavBase64(rendered);
  }

  /**
   * Renders a continuous multi-minute stereo DJ set window directly through the real
   * AnalogStudioDSP WebAudio graph (OfflineAudioContext) with seamless overlap-add reverb/echo
   * ring-out carried across segment boundaries so 30 x 120s segments = 3,600.0s (1 Hour) continuous set!
   */
  async renderDJSegmentPcmBase64(outArr, incArr, xfade01 = 0.0, startBarGlobal = 0, numBars = 4) {
    const sr = 48000;
    const bpm = (outArr.bpm || 122) * (1 - xfade01) + ((incArr?.bpm || outArr.bpm || 122) * xfade01);
    const swing = (outArr.swing || 53) * (1 - xfade01) + ((incArr?.swing || outArr.swing || 53) * xfade01);
    const stepDur = 60 / bpm / 4;
    const totalSteps = numBars * 16; // STRICT INTEGER MUSICAL BARS (ZERO FRACTIONAL-BEAT TRUNCATION!)
    const durationSec = totalSteps * stepDur;
    const tailSec = 2.8;
    const chunkFrames = Math.round(sr * durationSec);
    const tailFrames = Math.round(sr * tailSec);
    const offline = new OfflineAudioContext(2, chunkFrames + tailFrames, sr);

    this.applyArchetypePreset(xfade01 >= 0.5 ? (incArr?.archetypeId || outArr.archetypeId) : outArr.archetypeId);
    // Maintain gentle warm analog room bed (0.085) so breakdowns never hit digital silence cliffs
    this.params.noiseBedLevel = 0.085;
    this.params.vinylCrackleDensity = 0.14;
    const graph = buildDubTechnoGraph(offline, this.params);
    graph.masterGain.connect(offline.destination);

    const swingFrac = swing > 1.5 ? (swing - 50) / 100 : (swing - 0.5);
    const outGain = Math.cos(xfade01 * Math.PI * 0.5);
    const incGain = Math.sin(xfade01 * Math.PI * 0.5);

    // Normalize per-track bass note amplitude by note density so 12-note Maurizio rolling bass never jumps +4.5 dB!
    const countActiveBass = (arr) => Math.max(2, (arr?.bass || []).filter((x) => x && x.active).length);
    const outBassScale = Math.min(1.0, Math.sqrt(4.0 / countActiveBass(outArr)));
    const incBassScale = Math.min(1.0, Math.sqrt(4.0 / countActiveBass(incArr || outArr)));

    for (let s = 0; s < totalSteps; s++) {
      const globalStep = startBarGlobal * 16 + s;
      const step16 = s % 16;
      const step14 = globalStep % 14;
      const step12 = globalStep % 12;
      const barIdx = startBarGlobal + Math.floor(s / 16);
      const barIn8 = barIdx % 8;
      const planingOffset = (barIn8 === 3) ? 5 : (barIn8 === 6 ? -2 : (barIn8 === 7 && step16 < 12 ? 7 : 0));
      const isBreakdown = (barIdx % 32 >= 29);

      const swingOffset = (step16 % 2 === 1) ? swingFrac * stepDur * 1.6 : 0;
      const t = s * stepDur + swingOffset;

      // 1. Drums (Clean single-kick handover at xfade >= 0.5; equal-power hi-hat & rim crossfade!)
      const primaryDrums = (xfade01 >= 0.5 && incArr?.drums) ? incArr.drums : outArr.drums;
      if (!(isBreakdown && step16 > 0)) {
        if (primaryDrums.kick?.[step16]?.active) {
          this.triggerKick(t, (primaryDrums.kick[step16].vel || 108) / 127, offline, graph);
        }
      }
      if (outGain > 0.08) {
        const sOut = outArr.drums.snare?.[step16] || outArr.drums.perc?.[step16];
        if (sOut?.active) this.triggerSnare(t, ((sOut.vel || 84) / 127) * outGain, offline, graph);
        if (outArr.drums.ch?.[step16]?.active) this.triggerHat(t, false, ((outArr.drums.ch[step16].vel || 64) / 127) * outGain, offline, graph);
        if (outArr.drums.oh?.[step16]?.active) this.triggerHat(t, true, ((outArr.drums.oh[step16].vel || 72) / 127) * outGain, offline, graph);
      }
      if (incGain > 0.08 && incArr?.drums) {
        const sInc = incArr.drums.snare?.[step16] || incArr.drums.perc?.[step16];
        if (sInc?.active) this.triggerSnare(t, ((sInc.vel || 84) / 127) * incGain, offline, graph);
        if (incArr.drums.ch?.[step16]?.active) this.triggerHat(t, false, ((incArr.drums.ch[step16].vel || 64) / 127) * incGain, offline, graph);
        if (incArr.drums.oh?.[step16]?.active) this.triggerHat(t, true, ((incArr.drums.oh[step16].vel || 72) / 127) * incGain, offline, graph);
      }

      // 2. Clean Low-End Isolated Sub-Bass Crossfade (strictly linear energy handoff + note density loudness lock!)
      if (outGain > 0.05 && outArr.bass?.[step16]?.active) {
        const bCell = outArr.bass[step16];
        const clampedGateSec = Math.min(stepDur * 1.8, (bCell.gate || 0.8) * stepDur);
        this.triggerSubBass(
          (bCell.note || 38) + planingOffset,
          t,
          clampedGateSec,
          ((bCell.vel || 96) / 127) * outBassScale * (1 - xfade01),
          Boolean(bCell.slide),
          offline,
          graph
        );
      }
      if (incGain > 0.05 && incArr?.bass?.[step16]?.active) {
        const bCell = incArr.bass[step16];
        const clampedGateSec = Math.min(stepDur * 1.8, (bCell.gate || 0.8) * stepDur);
        this.triggerSubBass(
          (bCell.note || 38) + planingOffset,
          t,
          clampedGateSec,
          ((bCell.vel || 96) / 127) * incBassScale * xfade01,
          Boolean(bCell.slide),
          offline,
          graph
        );
      }

      // 3. Equal-Power Simultaneous Outgoing + Incoming Dub Chord Sound-Objects!
      if (outGain > 0.08 && outArr.chordStabSteps?.[step14]?.active) {
        const cStep = outArr.chordStabSteps[step14];
        this.triggerPadChord(cStep.notes.map((n) => n + planingOffset), t, 0.18, ((cStep.vel || 96) / 127) * outGain, offline, graph);
      }
      if (incGain > 0.08 && incArr?.chordStabSteps?.[step14]?.active) {
        const cStep = incArr.chordStabSteps[step14];
        this.triggerPadChord(cStep.notes.map((n) => n + planingOffset), t, 0.18, ((cStep.vel || 96) / 127) * incGain, offline, graph);
      }

      // 4. Equal-Power Simultaneous Secondary Rootless Dub Dyads!
      if (outGain > 0.08 && outArr.lead?.[step12]?.active) {
        const lStep = outArr.lead[step12];
        this.triggerLead((lStep.note || 60) + planingOffset, t + 0.018, stepDur * 0.5, ((lStep.vel || 78) / 127) * outGain, offline, graph);
      }
      if (incGain > 0.08 && incArr?.lead?.[step12]?.active) {
        const lStep = incArr.lead[step12];
        this.triggerLead((lStep.note || 60) + planingOffset, t + 0.018, stepDur * 0.5, ((lStep.vel || 78) / 127) * incGain, offline, graph);
      }
    }

    const rendered = await offline.startRendering();
    const chL = rendered.getChannelData(0);
    const chR = rendered.getChannelData(1);

    // High-pass overlap-add tail above 130 Hz (so sub-bass NEVER doubles across bar boundaries!)
    if (this._prevTailL && this._prevTailR) {
      const nOverlap = Math.min(chunkFrames, this._prevTailL.length);
      for (let i = 0; i < nOverlap; i++) {
        chL[i] += this._prevTailL[i];
        chR[i] += this._prevTailR[i];
      }
    }
    this._prevTailL = new Float32Array(tailFrames);
    this._prevTailR = new Float32Array(tailFrames);
    let hpStateL = 0, hpStateR = 0;
    const hpAlpha = (2 * Math.PI * 130) / sr;
    for (let i = 0; i < tailFrames; i++) {
      const taper = i > tailFrames - 4800 ? 0.5 * (1 + Math.cos((Math.PI * (i - (tailFrames - 4800))) / 4800)) : 1.0;
      const rawL = chL[chunkFrames + i] * taper;
      const rawR = chR[chunkFrames + i] * taper;
      hpStateL += hpAlpha * (rawL - hpStateL);
      hpStateR += hpAlpha * (rawR - hpStateR);
      this._prevTailL[i] = rawL - hpStateL;
      this._prevTailR[i] = rawR - hpStateR;
    }

    let sqSum = 0;
    let peak = 1e-6;
    const pcmBuf = new ArrayBuffer(chunkFrames * 4);
    const view = new DataView(pcmBuf);
    for (let i = 0; i < chunkFrames; i++) {
      // Post-overlap-add true-peak soft limiter (guarantees ZERO post-sum spikes > -1.2 dBFS!)
      const sL = Math.tanh(chL[i] * 1.15) * 0.84;
      const sR = Math.tanh(chR[i] * 1.15) * 0.84;
      const m = 0.5 * (sL + sR);
      sqSum += m * m;
      if (Math.abs(m) > peak) peak = Math.abs(m);
      view.setInt16(i * 4, sL < 0 ? sL * 0x8000 : sL * 0x7FFF, true);
      view.setInt16(i * 4 + 2, sR < 0 ? sR * 0x8000 : sR * 0x7FFF, true);
    }
    const bytes = new Uint8Array(pcmBuf);
    let bin = '';
    for (let i = 0; i < bytes.length; i += 0x8000) {
      bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    }
    const rmsDb = Number((20 * Math.log10(Math.sqrt(sqSum / chunkFrames) || 1e-6)).toFixed(2));
    const peakDb = Number((20 * Math.log10(peak)).toFixed(2));
    return { ok: true, rmsDb, peakDb, frames: chunkFrames, b64: btoa(bin) };
  }
}

export function encodeAudioBufferToWavBase64(audioBuffer) {
  const numChannels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  const length = audioBuffer.length;
  const bytesPerSample = 2;
  const blockAlign = numChannels * bytesPerSample;
  const dataSize = length * blockAlign;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  const writeStr = (offset, str) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  };

  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true);
  writeStr(36, 'data');
  view.setUint32(40, dataSize, true);

  const ch0 = audioBuffer.getChannelData(0);
  const ch1 = numChannels > 1 ? audioBuffer.getChannelData(1) : ch0;
  let offset = 44;
  for (let i = 0; i < length; i++) {
    const s0 = Math.max(-1, Math.min(1, ch0[i]));
    const s1 = Math.max(-1, Math.min(1, ch1[i]));
    view.setInt16(offset, s0 < 0 ? s0 * 0x8000 : s0 * 0x7FFF, true);
    view.setInt16(offset + 2, s1 < 0 ? s1 * 0x8000 : s1 * 0x7FFF, true);
    offset += 4;
  }

  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize));
  }
  return {
    base64: btoa(binary),
    blob: new Blob([buffer], { type: 'audio/wav' }),
    durationSec: length / sampleRate,
  };
}
