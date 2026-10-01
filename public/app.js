/**
 * AETHER-909 // Master Studio Sequencer, CoreMIDI + WebMIDI Dispatcher & UI Controller
 */

import { AnalogStudioDSP } from './synth-engine.js';
import {
  AIConductorEngine,
  GENRE_CARTRIDGES,
  NOTE_NAMES,
  SCALES,
  SONG_SECTIONS,
  midiToNoteName,
} from './ai-composer.js';

const dsp = new AnalogStudioDSP();
const ai = new AIConductorEngine();

// ============================================================================
// HARDWARE & ARTURIA V COLLECTION FACTORY MIDI CC PROFILES
// Extracted from /Library/Arturia/*/resources/plugin.prefmidi.xml & Hardware Manuals
// ============================================================================

const SYNTH_CC_PROFILES = {
  drums: {
    tr8s: {
      name: 'Roland TR-8S / TR-08 Hardware',
      ccMap: { punch: 20, decay: 23, snappy: 26, hatDecay: 61, drive: 80, level: 7 },
    },
    elektron: {
      name: 'Elektron Syntakt / Digitakt',
      ccMap: { punch: 16, decay: 19, snappy: 20, hatDecay: 74, drive: 78, level: 95 },
    },
    ableton_drums: {
      name: 'Ableton 12 Drum Rack Macros',
      ccMap: { punch: 20, decay: 21, snappy: 22, hatDecay: 23, drive: 24, level: 7 },
    },
  },
  acid: {
    arturia_acid_v: {
      // Exact factory Default map from /Library/Arturia/Acid V/resources/plugin.prefmidi.xml:
      // CC74=Cutoff, CC71=Resonance, CC19=EnvMod, CC16=Decay, CC81=Disto_Drive (+CC17=AccentAmt, CC82=DryWet), CC85=MasterVol
      name: 'Arturia Acid V (Factory Default)',
      ccMap: { cutoff: 74, resonance: 71, envMod: 19, decay: 16, drive: 81, level: 85 },
      extraCCs: { drive: [17, 82] },
    },
    roland_tb03: {
      // Roland Boutique TB-03 Hardware CC specification
      name: 'Roland TB-03 Boutique Hardware',
      ccMap: { cutoff: 74, resonance: 71, envMod: 12, decay: 75, drive: 17, level: 16 },
    },
    novation_bs2: {
      // Novation Bass Station II Hardware CC specification
      name: 'Novation Bass Station II Acid',
      ccMap: { cutoff: 16, resonance: 82, envMod: 85, decay: 91, drive: 94, level: 7 },
    },
  },
  moog: {
    arturia_mini_v4: {
      // Exact factory Default map from /Library/Arturia/Mini V4/resources/plugin.prefmidi.xml:
      // CC74=Brightness/Cutoff, CC71=Timbre/Emphasis, CC73=Filter Contour(EnvAmount), CC79=Filter Decay, CC19=Osc3 Sub Level, CC17=MasterVolume
      name: 'Arturia Mini V4 (Factory Default)',
      ccMap: { cutoff: 74, resonance: 71, contour: 73, detune: 79, sub: 19, level: 17 },
      extraCCs: { detune: [83] },
    },
    moog_little_phatty: {
      // Moog Little Phatty & Slim Phatty Hardware (with 15-LED moving encoder rings!)
      // CC19=Filter Cutoff, CC21=Filter Resonance, CC22=Filter KB/EG Amount, CC14=Osc2 Wave/Detune, CC18=Overload/Sub, CC7=Volume
      name: 'Moog Little Phatty / Slim Phatty HW',
      ccMap: { cutoff: 19, resonance: 21, contour: 22, detune: 14, sub: 18, level: 7 },
    },
    moog_minitaur: {
      // Moog Minitaur / Sirin / Subsequent 37 Hardware
      name: 'Moog Minitaur / Subsequent 37 HW',
      ccMap: { cutoff: 19, resonance: 21, contour: 22, detune: 17, sub: 16, level: 7 },
    },
  },
  lead: {
    arturia_prophet5: {
      // Exact factory Default map from /Library/Arturia/Prophet-5 V/resources/plugin.prefmidi.xml:
      // CC74=Freq(Cutoff), CC71=Res, CC18=EnvAmt, CC75=Filter Decay, CC83=VCA Release, CC85=Master Volume
      name: 'Arturia Prophet-5 V (Factory Default)',
      ccMap: { cutoff: 74, resonance: 71, lfoMod: 18, delaySend: 75, reverbSend: 83, level: 85 },
      extraCCs: { lfoMod: [76, 77] },
    },
    dsi_prophet08: {
      // Sequential / Dave Smith Prophet '08 & Prophet Rev2 Hardware CC specification
      // CC102=Filter Cutoff, CC103=Resonance, CC104=Filter Env Amt, CC106=Filter Decay, CC109=Filter Release, CC7=Volume
      name: "Sequential Prophet '08 / Rev2 HW",
      ccMap: { cutoff: 102, resonance: 103, lfoMod: 104, delaySend: 106, reverbSend: 109, level: 7 },
    },
    korg_minilogue_xd: {
      // Korg Minilogue XD Hardware CC specification
      name: 'Korg Minilogue XD Hardware',
      ccMap: { cutoff: 43, resonance: 44, lfoMod: 22, delaySend: 26, reverbSend: 17, level: 7 },
    },
  },
  pads: {
    arturia_juno_jup8: {
      // Exact factory Default map from /Library/Arturia/Jun-6 V & Jup-8 V4/resources/plugin.prefmidi.xml:
      // CC74=Cutoff, CC71=Resonance, CC93=Chorus/Mod, CC73=Attack, CC72=Release, CC91=Delay/Reverb Wet
      name: 'Arturia Jun-6 V / Jup-8 V4 (Factory)',
      ccMap: { cutoff: 74, chorus: 93, attack: 73, release: 72, reverbSend: 91, level: 85 },
      extraCCs: { cutoff: [19], chorus: [71] },
    },
    roland_ju06a: {
      // Roland Boutique JU-06A Hardware CC specification
      name: 'Roland JU-06A Boutique Hardware',
      ccMap: { cutoff: 74, chorus: 93, attack: 73, release: 72, reverbSend: 91, level: 71 },
    },
    dsi_prophet08_pads: {
      // Sequential Prophet '08 / Novation Peak Poly Pads
      name: "Prophet '08 / Novation Peak Pads",
      ccMap: { cutoff: 102, chorus: 103, attack: 105, release: 109, reverbSend: 91, level: 7 },
    },
  },
};

// ============================================================================
// STUDIO STATE
// ============================================================================

const state = {
  isPlaying: false,
  midiLearnSolo: false, // When true, pauses AI CC stream so user can MIDI-Learn individual knobs cleanly
  aiModel: 'gemini-flash-latest',
  geminiApiKey: localStorage.getItem('aether_gemini_key') || '',
  bpm: 122,
  swing: 54, // 50 = straight, 54..68 = classic 909/MPC shuffle
  rootNote: 'D',
  scale: 'minor',
  grooveStyle: 'dub-minimal',
  acidPolicy: 'rare',
  section: 'GROOVE',
  autoEvolveBars: 4, // 0 = Hold, 4 = Every 4 bars, 8 = Every 8 bars
  activeCartridgeId: 'berlin_dub',
  prompt: GENRE_CARTRIDGES[0].prompt,

  currentStep: 0,
  currentBar: 1,
  totalBarsPlayed: 0,
  txPacketCount: 0,

  activeVoices: {
    drums: true,
    acid: false,
    moog: true,
    lead: false,
    pads: true,
  },
  programs: { drums: 0, acid: 0, moog: 0, lead: 0, pads: 0 },

  // Per-Unit Routing, Active CC Profile & Mixer State
  units: {
    drums: {
      mute: false,
      solo: false,
      pinned: false,
      extOnly: false,
      profile: 'tr8s',
      lastReadout: 'CH10 • READY',
      params: { punch: 0.75, decay: 0.58, snappy: 0.68, hatDecay: 0.42, drive: 0.48, level: 0.88 },
    },
    acid: {
      mute: false,
      solo: false,
      pinned: false,
      extOnly: false,
      profile: 'arturia_acid_v',
      waveform: 'sawtooth',
      lastReadout: 'CH2 • RESTING',
      params: { cutoff: 0.44, resonance: 0.64, envMod: 0.56, decay: 0.46, drive: 0.42, level: 0.80 },
    },
    moog: {
      mute: false,
      solo: false,
      pinned: false,
      extOnly: false,
      profile: 'arturia_mini_v4',
      lastReadout: 'CH3 • READY',
      params: { cutoff: 0.48, resonance: 0.36, contour: 0.62, detune: 0.38, sub: 0.78, level: 0.86 },
    },
    lead: {
      mute: false,
      solo: false,
      pinned: false,
      extOnly: false,
      profile: 'arturia_prophet5',
      lastReadout: 'CH4 • READY',
      params: { cutoff: 0.62, resonance: 0.42, lfoMod: 0.38, delaySend: 0.58, reverbSend: 0.48, level: 0.76 },
    },
    pads: {
      mute: false,
      solo: false,
      pinned: false,
      extOnly: false,
      profile: 'arturia_juno_jup8',
      lastReadout: 'CH5 • READY',
      params: { cutoff: 0.56, chorus: 0.68, attack: 0.45, release: 0.62, reverbSend: 0.72, level: 0.78 },
    },
  },

  fx: {
    delayMix: 0.34,
    delayFeedback: 0.46,
    reverbMix: 0.40,
    masterFilter: 0.50, // 0.50 = neutral open
    busDrive: 0.45,
  },

  // Target Macros set by AI Conductor (smoothly interpolated each step)
  targetMacros: null,

  // 16-Step Pattern Data
  drums: { kick: [], snare: [], clap: [], ch: [], oh: [], perc: [] },
  acid: [],
  bass: [],
  lead: [],
  pads: [],

  // CoreMIDI & WebMIDI Status
  coreMidiStatus: {
    coreMidiAvailable: false,
    virtualPorts: [],
    hardwareDestinations: [],
    installedApps: [],
  },
  webMidiOutputs: [],
};

// ============================================================================
// KNOB DEFINITIONS PER HARDWARE UNIT
// ============================================================================

const UNIT_KNOB_DEFS = {
  drums: [
    { key: 'punch',    label: 'BD PUNCH' },
    { key: 'decay',    label: '808 BOOM' },
    { key: 'snappy',   label: 'SD SNAP'  },
    { key: 'hatDecay', label: 'HAT DEC'  },
    { key: 'drive',    label: 'TAPE DRV' },
    { key: 'level',    label: 'LEVEL'    },
  ],
  acid: [
    { key: 'cutoff',    label: 'CUTOFF'  },
    { key: 'resonance', label: 'RESON'   },
    { key: 'envMod',    label: 'ENV MOD' },
    { key: 'decay',     label: 'DECAY'   },
    { key: 'drive',     label: 'OVERDRV' },
    { key: 'level',     label: 'LEVEL'   },
  ],
  moog: [
    { key: 'cutoff',    label: 'LADDER'    },
    { key: 'resonance', label: 'EMPHASIS'  },
    { key: 'contour',   label: 'CONTOUR'   },
    { key: 'detune',    label: 'DEC / DET' },
    { key: 'sub',       label: 'SUB / OVR' },
    { key: 'level',     label: 'LEVEL'     },
  ],
  lead: [
    { key: 'cutoff',     label: 'CUTOFF'   },
    { key: 'resonance',  label: 'RESON'    },
    { key: 'lfoMod',     label: 'ENV / MOD'},
    { key: 'delaySend',  label: 'DEC / DLY'},
    { key: 'reverbSend', label: 'REL / REV'},
    { key: 'level',      label: 'LEVEL'    },
  ],
  pads: [
    { key: 'cutoff',     label: 'BRILLIANCE'},
    { key: 'chorus',     label: 'CHORUS/RES'},
    { key: 'attack',     label: 'ATTACK'    },
    { key: 'release',    label: 'RELEASE'   },
    { key: 'reverbSend', label: 'FX WET'    },
    { key: 'level',      label: 'LEVEL'     },
  ],
};

const FX_KNOB_DEFS = [
  { key: 'masterFilter',  label: 'DJ FILTER' },
  { key: 'delayMix',      label: 'TAPE DELAY' },
  { key: 'reverbMix',     label: 'LX-24 HALL' },
  { key: 'busDrive',      label: 'BUS FORCE' },
];

function getActiveCCForParam(unitKey, paramKey) {
  const profKey = state.units[unitKey]?.profile;
  const prof = SYNTH_CC_PROFILES[unitKey]?.[profKey];
  return prof?.ccMap?.[paramKey] ?? 74;
}

function sendUnitParamCC(unitKey, paramKey, normVal) {
  const chMap = { drums: 9, acid: 1, moog: 2, lead: 3, pads: 4 };
  const portMap = { drums: 1, acid: 2, moog: 3, lead: 4, pads: 5 };
  const ch = chMap[unitKey] ?? 0;
  const port = portMap[unitKey] ?? 0;
  const ccVal = Math.max(0, Math.min(127, Math.round(normVal * 127)));

  const primaryCC = getActiveCCForParam(unitKey, paramKey);
  queueMidiEvent(port, [0xB0 | ch, primaryCC & 0x7F, ccVal]);

  // Also send any linked secondary CCs for Arturia (e.g. Drive + DryWet in Acid V)
  const profKey = state.units[unitKey]?.profile;
  const extraList = SYNTH_CC_PROFILES[unitKey]?.[profKey]?.extraCCs?.[paramKey];
  if (Array.isArray(extraList)) {
    extraList.forEach((extraCC) => {
      queueMidiEvent(port, [0xB0 | ch, extraCC & 0x7F, ccVal]);
    });
  }
}

// ============================================================================
// COREMIDI + WEBMIDI HARDWARE DISPATCHER
// ============================================================================

let pendingMidiEvents = [];
let flushTimer = null;

function queueMidiEvent(portId, bytes, noteOffDelayMs = 0, noteOffBytes = null) {
  pendingMidiEvents.push({ port: portId, bytes });

  // Also send immediately to WebMIDI outputs if present
  if (state.webMidiOutputs.length > 0) {
    for (const out of state.webMidiOutputs) {
      try {
        out.send(bytes);
      } catch (_) {}
    }
  }

  if (!flushTimer) {
    flushTimer = setTimeout(flushMidiQueue, 6);
  }

  if (noteOffDelayMs > 0 && noteOffBytes) {
    setTimeout(() => {
      queueMidiEvent(portId, noteOffBytes);
    }, noteOffDelayMs);
  }
}

async function flushMidiQueue() {
  flushTimer = null;
  if (pendingMidiEvents.length === 0) return;
  const batch = pendingMidiEvents;
  pendingMidiEvents = [];

  // Pulse MIDI TX LED
  const txDot = document.getElementById('midi-tx-dot');
  if (txDot) {
    txDot.classList.add('on-amber');
    setTimeout(() => txDot.classList.remove('on-amber'), 65);
  }

  try {
    const res = await fetch('/api/midi/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ events: batch }),
    });
    if (res.ok) {
      const data = await res.json();
      state.txPacketCount = data.totalTx || (state.txPacketCount + batch.length);
      const countEl = document.getElementById('tx-count-val');
      if (countEl) countEl.textContent = String(state.txPacketCount);
    }
  } catch (_) {}
}

async function initWebMIDI() {
  if (!navigator.requestMIDIAccess) return;
  try {
    const access = await navigator.requestMIDIAccess({ sysex: false });
    const updatePorts = () => {
      state.webMidiOutputs = Array.from(access.outputs.values());
    };
    access.onstatechange = updatePorts;
    updatePorts();
  } catch (_) {}
}

async function fetchCoreMidiStatus() {
  try {
    const res = await fetch('/api/midi/status');
    if (!res.ok) return;
    const data = await res.json();
    state.coreMidiStatus = data;
    state.txPacketCount = data.txMessageCount || state.txPacketCount;
    renderPatchbayAndApps();
  } catch (_) {}
}

// ============================================================================
// SAMPLE-ACCURATE LOOKAHEAD SEQUENCER
// ============================================================================

let schedulerTimer = null;
let nextStepTime = 0;
const LOOKAHEAD_MS = 25.0;
const SCHEDULE_AHEAD_SEC = 0.095;
const uiStepQueue = [];

function isUnitAudible(unitKey) {
  const anySolo = Object.values(state.units).some((u) => u.solo);
  const u = state.units[unitKey];
  if (u.mute) return false;
  if (anySolo) return u.solo;
  if (u.pinned) return true;
  if (state.activeVoices && state.activeVoices[unitKey] === false) return false;
  return true;
}

function startSequencer() {
  dsp.init();
  dsp.updateMasterFX(state.fx, state.bpm);
  if (state.isPlaying) return;

  state.isPlaying = true;
  state.currentStep = 0;
  state.currentBar = 1;
  nextStepTime = dsp.ctx.currentTime + 0.04;

  // Send MIDI Start (0xFA)
  queueMidiEvent(0, [0xFA]);

  const playBtn = document.getElementById('btn-play-toggle');
  if (playBtn) {
    playBtn.classList.add('active');
    playBtn.innerHTML = '<span>■</span> STOP RIG';
  }
  addLog('AI', `Transport locked at ${state.bpm} BPM. Streaming Notes + Full-Synth MIDI CCs to CoreMIDI Virtual Bus + Internal DSP.`);

  schedulerTimer = setInterval(schedulerTick, LOOKAHEAD_MS);
}

function stopSequencer() {
  state.isPlaying = false;
  if (schedulerTimer) {
    clearInterval(schedulerTimer);
    schedulerTimer = null;
  }
  // Send MIDI Stop (0xFC) + All Notes Off
  queueMidiEvent(0, [0xFC]);
  fetch('/api/midi/config', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'panic' }),
  }).catch(() => {});

  const playBtn = document.getElementById('btn-play-toggle');
  if (playBtn) {
    playBtn.classList.remove('active');
    playBtn.innerHTML = '<span>▶</span> RUN INFINITE SONG';
  }
  clearPlayheadHighlight();
}

function schedulerTick() {
  if (!state.isPlaying || !dsp.ctx) return;
  while (nextStepTime < dsp.ctx.currentTime + SCHEDULE_AHEAD_SEC) {
    scheduleStep(state.currentStep, nextStepTime);
    advanceStep();
  }
}

function advanceStep() {
  const secondsPerBeat = 60.0 / Math.max(60, Math.min(200, state.bpm));
  const baseStepSec = secondsPerBeat * 0.25; // 16th note
  const swingFactor = (state.swing - 50) / 100;
  const stepDur = (state.currentStep % 2 === 0)
    ? baseStepSec * (1 + swingFactor * 0.65)
    : baseStepSec * (1 - swingFactor * 0.65);

  nextStepTime += stepDur;
  state.currentStep++;

  if (state.currentStep >= 16) {
    state.currentStep = 0;
    state.currentBar++;
    state.totalBarsPlayed++;

    if (state.autoEvolveBars > 0 && state.totalBarsPlayed > 0 && (state.totalBarsPlayed % state.autoEvolveBars === 0)) {
      triggerAutonomousEvolution();
    }
  }
}

function scheduleStep(stepIdx, stepTime) {
  const secondsPerBeat = 60.0 / Math.max(60, Math.min(200, state.bpm));
  const stepDurSec = secondsPerBeat * 0.25;
  const stepDurMs = stepDurSec * 1000;

  // Smoothly interpolate AI Macros + broadcast full CC modulation to Arturia / Hardware!
  stepMacroInterpolation(stepIdx);

  uiStepQueue.push({ step: stepIdx, bar: state.currentBar, time: stepTime });

  // --------------------------------------------------------------------------
  // 1. UNIT 01: TR-808 / TR-909 DRUMS (MIDI Ch 10 -> 0x99 / 0x89, Port 1)
  // --------------------------------------------------------------------------
  if (isUnitAudible('drums')) {
    const drumMap = [
      { key: 'kick',  midi: 36, label: 'BD' },
      { key: 'snare', midi: 38, label: 'SD' },
      { key: 'clap',  midi: 39, label: 'CP' },
      { key: 'ch',    midi: 42, label: 'CH' },
      { key: 'oh',    midi: 46, label: 'OH' },
      { key: 'perc',  midi: 37, label: 'RM' },
    ];
    const triggeredLabels = [];
    for (const d of drumMap) {
      const cell = state.drums[d.key]?.[stepIdx];
      if (cell && cell.active) {
        const vel = Math.max(1, Math.min(127, cell.vel || 100));
        if (!state.units.drums.extOnly) {
          dsp.triggerDrum(d.key, stepTime, vel / 127, state.units.drums.params);
        }
        queueMidiEvent(1, [0x99, d.midi, vel], Math.round(stepDurMs * 0.5), [0x89, d.midi, 0]);
        triggeredLabels.push(d.label);
      }
    }
    if (triggeredLabels.length > 0) {
      state.units.drums.lastReadout = `CH10 • ${triggeredLabels.join('+')}`;
    }
  }

  // --------------------------------------------------------------------------
  // 2. UNIT 02: TB-303 ACID BASSLINE (MIDI Ch 2 -> 0x91 / 0x81, Port 2)
  // --------------------------------------------------------------------------
  if (isUnitAudible('acid')) {
    const acidCell = state.acid[stepIdx];
    if (acidCell && acidCell.active) {
      const note = Math.max(24, Math.min(84, acidCell.note || 36));
      const vel = acidCell.accent ? 124 : (acidCell.vel || 86);
      // True 303 Legato Slide: overlap MIDI Note Off past next step's Note On!
      const gateMs = acidCell.slide ? Math.round(stepDurMs * 1.18) : Math.round(stepDurMs * 0.62);

      if (!state.units.acid.extOnly) {
        dsp.triggerAcid303(
          note,
          stepTime,
          stepDurSec,
          acidCell.accent,
          acidCell.slide,
          { ...state.units.acid.params, waveform: state.units.acid.waveform }
        );
      }
      queueMidiEvent(2, [0x91, note, vel], gateMs, [0x81, note, 0]);
      const flags = `${acidCell.accent ? ' ACC' : ''}${acidCell.slide ? ' SLD' : ''}`;
      state.units.acid.lastReadout = `CH2 • ${midiToNoteName(note)} V${vel}${flags}`;
    }
  }

  // --------------------------------------------------------------------------
  // 3. UNIT 03: MOOG SUB BASS (MIDI Ch 3 -> 0x92 / 0x82, Port 3)
  // --------------------------------------------------------------------------
  if (isUnitAudible('moog')) {
    const bassCell = state.bass[stepIdx];
    if (bassCell && bassCell.active) {
      const note = Math.max(24, Math.min(72, bassCell.note || 36));
      const vel = Math.max(1, Math.min(127, bassCell.vel || 96));
      const gateFactor = bassCell.gate || 0.72;
      if (!state.units.moog.extOnly) {
        dsp.triggerMoogBass(note, stepTime, stepDurSec * gateFactor, vel / 127, state.units.moog.params);
      }
      queueMidiEvent(3, [0x92, note, vel], Math.round(stepDurMs * gateFactor), [0x82, note, 0]);
      state.units.moog.lastReadout = `CH3 • ${midiToNoteName(note)} V${vel}`;
    }
  }

  // --------------------------------------------------------------------------
  // 4. UNIT 04: PROPHET-5 / ANALOG LEAD (MIDI Ch 4 -> 0x93 / 0x83, Port 4)
  // --------------------------------------------------------------------------
  if (isUnitAudible('lead')) {
    const leadCell = state.lead[stepIdx];
    if (leadCell && leadCell.active) {
      const note = Math.max(36, Math.min(96, leadCell.note || 60));
      const vel = Math.max(1, Math.min(127, leadCell.vel || 90));
      const gateFactor = leadCell.gate || 0.65;
      if (!state.units.lead.extOnly) {
        dsp.triggerProphetLead(note, stepTime, stepDurSec * gateFactor, vel / 127, state.units.lead.params);
      }
      queueMidiEvent(4, [0x93, note, vel], Math.round(stepDurMs * gateFactor), [0x83, note, 0]);
      state.units.lead.lastReadout = `CH4 • ${midiToNoteName(note)} V${vel}`;
    }
  }

  // --------------------------------------------------------------------------
  // 5. UNIT 05: JUNO-60 / CS-80 POLY PADS (MIDI Ch 5 -> 0x94 / 0x84, Port 5)
  // --------------------------------------------------------------------------
  if (isUnitAudible('pads') && stepIdx === 0 && state.pads.length > 0) {
    const barIdx = (state.currentBar - 1) % state.pads.length;
    const chordObj = state.pads[barIdx];
    if (chordObj && Array.isArray(chordObj.notes)) {
      const barDurSec = stepDurSec * 16 * 0.94;
      const barDurMs = Math.round(barDurSec * 1000);
      const vel = chordObj.vel || 82;

      if (!state.units.pads.extOnly) {
        dsp.triggerJunoPadChord(chordObj.notes, stepTime, barDurSec, vel / 127, state.units.pads.params);
      }

      chordObj.notes.forEach((n) => {
        queueMidiEvent(5, [0x94, n, vel], barDurMs, [0x84, n, 0]);
      });
      state.units.pads.lastReadout = `CH5 • ${chordObj.name}`;
    }
  }
}

// ============================================================================
// AI MACRO AUTOMATION & CONTINUOUS MULTI-PARAMETER CC STREAMING
// ============================================================================

function stepMacroInterpolation(stepIdx) {
  if (!state.targetMacros) return;
  const tm = state.targetMacros;
  const lerp = (cur, target, rate = 0.09) => cur + (target - cur) * rate;
  const clamp = (v) => Math.max(0.06, Math.min(0.96, v));

  // Organic poly-phase LFOs so every synth's knobs breathe and evolve musically
  const globalStep = state.totalBarsPlayed * 16 + stepIdx;
  const lfoFast = Math.sin(globalStep * 0.22) * 0.04;
  const lfoMed  = Math.cos(globalStep * 0.11) * 0.035;
  const lfoSlow = Math.sin(globalStep * 0.05) * 0.045;

  // 1. TB-303 Acid Parameters
  state.units.acid.params.cutoff    = clamp(lerp(state.units.acid.params.cutoff, tm.acidCutoff) + lfoFast);
  state.units.acid.params.resonance = clamp(lerp(state.units.acid.params.resonance, tm.acidRes) - lfoMed * 0.5);
  state.units.acid.params.envMod    = clamp(lerp(state.units.acid.params.envMod, tm.acidEnvMod) + lfoMed);
  state.units.acid.params.decay     = clamp(lerp(state.units.acid.params.decay, tm.acidDecay) + lfoSlow);
  state.units.acid.params.drive     = clamp(lerp(state.units.acid.params.drive, tm.acidCutoff * 0.85));

  // 2. Moog Sub/Bass Parameters
  state.units.moog.params.cutoff    = clamp(lerp(state.units.moog.params.cutoff, tm.moogCutoff) + lfoMed * 0.7);
  state.units.moog.params.resonance = clamp(lerp(state.units.moog.params.resonance, tm.acidRes * 0.55));
  state.units.moog.params.contour   = clamp(lerp(state.units.moog.params.contour, tm.acidEnvMod * 0.85) + lfoSlow * 0.5);
  state.units.moog.params.detune    = clamp(0.35 + lfoSlow * 2.0);

  // 3. Prophet Lead Parameters
  state.units.lead.params.cutoff     = clamp(lerp(state.units.lead.params.cutoff, tm.leadCutoff) - lfoFast * 0.8);
  state.units.lead.params.resonance  = clamp(0.42 + lfoMed * 1.5);
  state.units.lead.params.lfoMod     = clamp(0.45 + lfoSlow * 2.2);
  state.units.lead.params.delaySend  = clamp(lerp(state.units.lead.params.delaySend, tm.delayMix * 1.25));
  state.units.lead.params.reverbSend = clamp(lerp(state.units.lead.params.reverbSend, tm.reverbMix * 1.15));

  // 4. Juno / CS-80 Pad Parameters
  state.units.pads.params.cutoff     = clamp(lerp(state.units.pads.params.cutoff, tm.padCutoff) + lfoSlow * 1.2);
  state.units.pads.params.chorus     = clamp(0.68 + lfoMed * 1.1);
  state.units.pads.params.reverbSend = clamp(lerp(state.units.pads.params.reverbSend, tm.reverbMix * 1.35));

  // 5. Master FX
  state.fx.delayMix     = lerp(state.fx.delayMix, tm.delayMix);
  state.fx.reverbMix    = lerp(state.fx.reverbMix, tm.reverbMix);
  state.fx.masterFilter = lerp(state.fx.masterFilter, tm.masterFilter);
  dsp.updateMasterFX(state.fx, state.bpm);

  // Broadcast continuous MIDI CCs out to Arturia & Physical Hardware (unless CC LEARN SOLO mode is paused)
  if (!state.midiLearnSolo) {
    if (stepIdx % 2 === 0 && isUnitAudible('acid')) {
      sendUnitParamCC('acid', 'cutoff', state.units.acid.params.cutoff);
      sendUnitParamCC('acid', 'resonance', state.units.acid.params.resonance);
      sendUnitParamCC('acid', 'envMod', state.units.acid.params.envMod);
      sendUnitParamCC('acid', 'decay', state.units.acid.params.decay);
      sendUnitParamCC('acid', 'drive', state.units.acid.params.drive);
    }
    if (stepIdx % 2 === 1 && isUnitAudible('moog')) {
      sendUnitParamCC('moog', 'cutoff', state.units.moog.params.cutoff);
      sendUnitParamCC('moog', 'resonance', state.units.moog.params.resonance);
      sendUnitParamCC('moog', 'contour', state.units.moog.params.contour);
      sendUnitParamCC('moog', 'detune', state.units.moog.params.detune);
    }
    if (stepIdx % 4 === 0 && isUnitAudible('lead')) {
      sendUnitParamCC('lead', 'cutoff', state.units.lead.params.cutoff);
      sendUnitParamCC('lead', 'resonance', state.units.lead.params.resonance);
      sendUnitParamCC('lead', 'lfoMod', state.units.lead.params.lfoMod);
      sendUnitParamCC('lead', 'delaySend', state.units.lead.params.delaySend);
    }
    if (stepIdx % 4 === 2 && isUnitAudible('pads')) {
      sendUnitParamCC('pads', 'cutoff', state.units.pads.params.cutoff);
      sendUnitParamCC('pads', 'chorus', state.units.pads.params.chorus);
      sendUnitParamCC('pads', 'reverbSend', state.units.pads.params.reverbSend);
    }
    if (stepIdx % 8 === 0 && isUnitAudible('drums')) {
      sendUnitParamCC('drums', 'decay', state.units.drums.params.decay);
      sendUnitParamCC('drums', 'snappy', state.units.drums.params.snappy);
      sendUnitParamCC('drums', 'hatDecay', state.units.drums.params.hatDecay);
    }
  }
}

function triggerAutonomousEvolution(forcedSection = null) {
  let nextSec = forcedSection;
  if (!nextSec) {
    const curIdx = SONG_SECTIONS.indexOf(state.section);
    const arcOrder = ['GROOVE', 'TENSION BUILD', 'PEAK EUPHORIA', 'DUB BREAKDOWN', 'GROOVE', 'PEAK EUPHORIA'];
    nextSec = arcOrder[(state.totalBarsPlayed / Math.max(1, state.autoEvolveBars)) % arcOrder.length | 0] || SONG_SECTIONS[(curIdx + 1) % SONG_SECTIONS.length];
  }

  const evolved = ai.evolveArrangement(state, nextSec);
  applyArrangementToState(evolved);
  addLog('AI', `Bar ${state.currentBar}: Evolved to ${evolved.section} — ${evolved.commentary}`);
}

async function generateFromPrompt(promptText, cartridge = null) {
  const activePrompt = promptText || state.prompt;
  state.prompt = activePrompt;

  const composed = ai.composeFullArrangement({
    prompt: activePrompt,
    section: state.section,
    bpm: cartridge ? cartridge.bpm : state.bpm,
    rootNote: cartridge ? cartridge.rootNote : undefined,
    scale: cartridge ? cartridge.scale : undefined,
    grooveStyle: cartridge ? cartridge.grooveStyle : undefined,
    acidPolicy: cartridge ? cartridge.acidPolicy : undefined,
    lockBpm: false,
  });

  applyArrangementToState(composed);
  addLog('AI', `Generated arrangement for "${activePrompt.slice(0, 68)}..." -> ${composed.commentary}`);

  if (state.aiModel !== 'symbolic') {
    try {
      const res = await fetch('/api/ai/compose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: activePrompt,
          section: state.section,
          bpm: state.bpm,
          rootNote: state.rootNote,
          scale: state.scale,
          model: state.aiModel,
          apiKey: state.geminiApiKey,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.llm) {
          if (data.llm.activeVoices) {
            state.activeVoices = { ...state.activeVoices, ...data.llm.activeVoices };
          }
          if (data.llm.macros) {
            state.targetMacros = { ...state.targetMacros, ...data.llm.macros };
          }
          if (data.llm.programs) {
            const chMap = { drums: 9, acid: 1, moog: 2, lead: 3, pads: 4 };
            const portMap = { drums: 1, acid: 2, moog: 3, lead: 4, pads: 5 };
            for (const [uKey, prog] of Object.entries(data.llm.programs)) {
              if (state.programs[uKey] !== prog && isUnitAudible(uKey)) {
                state.programs[uKey] = prog;
                queueMidiEvent(portMap[uKey] || 0, [0xC0 | (chMap[uKey] || 0), prog & 0x7F]);
              }
            }
          }
          renderUnitStagingBadges();
          if (data.llm.commentary) {
            addLog('AI', `[${state.aiModel}] ${data.llm.commentary}`);
          }
        }
      }
    } catch (_) {}
  }
}

function renderUnitStagingBadges() {
  const chMap = { drums: 10, acid: 2, moog: 3, lead: 4, pads: 5 };
  for (const uKey of ['drums', 'acid', 'moog', 'lead', 'pads']) {
    const u = state.units[uKey];
    const isActive = u.pinned || (state.activeVoices?.[uKey] !== false);
    const card = document.getElementById(`unit-card-${uKey}`);
    const badge = document.getElementById(`stage-badge-${uKey}`);
    if (card) {
      card.classList.toggle('ai-resting', !isActive && !u.solo);
    }
    if (badge) {
      badge.classList.toggle('resting', !isActive && !u.solo);
      badge.textContent = u.pinned ? 'PINNED ON' : (isActive ? 'ACTIVE' : 'AI RESTING');
    }
    if (!isActive && !u.solo) {
      state.units[uKey].lastReadout = `CH${chMap[uKey]} • RESTING`;
      const rEl = document.getElementById(`readout-${uKey}`);
      if (rEl) rEl.textContent = state.units[uKey].lastReadout;
    }
  }
}

function applyArrangementToState(arr) {
  state.bpm = arr.bpm || state.bpm;
  state.rootNote = arr.rootNote || state.rootNote;
  state.scale = arr.scale || state.scale;
  state.grooveStyle = arr.grooveStyle || state.grooveStyle;
  state.acidPolicy = arr.acidPolicy || state.acidPolicy;
  state.section = arr.section || state.section;
  state.activeVoices = arr.activeVoices || state.activeVoices;
  state.drums = arr.drums;
  state.acid = arr.acid;
  state.bass = arr.bass;
  state.lead = arr.lead;
  state.pads = arr.pads;
  state.targetMacros = arr.macros;

  // Send MIDI Program Change (0xC0 | ch) when patch program changes
  if (arr.programs) {
    const chMap = { drums: 9, acid: 1, moog: 2, lead: 3, pads: 4 };
    const portMap = { drums: 1, acid: 2, moog: 3, lead: 4, pads: 5 };
    for (const [uKey, prog] of Object.entries(arr.programs)) {
      if (state.programs[uKey] !== prog && isUnitAudible(uKey)) {
        state.programs[uKey] = prog;
        queueMidiEvent(portMap[uKey] || 0, [0xC0 | (chMap[uKey] || 0), prog & 0x7F]);
      }
    }
  }

  const bpmInput = document.getElementById('input-bpm');
  if (bpmInput) bpmInput.value = state.bpm;
  const rootSel = document.getElementById('select-root');
  if (rootSel) rootSel.value = state.rootNote;
  const scaleSel = document.getElementById('select-scale');
  if (scaleSel) scaleSel.value = state.scale;

  renderUnitStagingBadges();
  renderSectionPills();
  renderSequencerGrid();
  renderChordProgression();
}

// ============================================================================
// UI RENDERING & INTERACTIVE HARDWARE CONTROLS
// ============================================================================

function createKnobSVG(normVal) {
  const radius = 15;
  const circumference = 2 * Math.PI * radius;
  const arcSpan = circumference * 0.75; // 270 degree sweep
  const dashOffset = arcSpan * (1 - Math.max(0, Math.min(1, normVal)));
  const angleDeg = -135 + normVal * 270;

  return `
    <svg class="knob-svg" viewBox="0 0 42 42">
      <circle class="knob-track" cx="21" cy="21" r="${radius}"
        stroke-dasharray="${arcSpan} ${circumference}"
        transform="rotate(135 21 21)" />
      <circle class="knob-arc" cx="21" cy="21" r="${radius}"
        stroke-dasharray="${arcSpan} ${circumference}"
        stroke-dashoffset="${dashOffset}"
        transform="rotate(135 21 21)" />
      <circle class="knob-body" cx="21" cy="21" r="11.5" />
      <line class="knob-pointer" x1="21" y1="21" x2="21" y2="11"
        transform="rotate(${angleDeg} 21 21)" />
    </svg>
  `;
}

function renderAllKnobs() {
  for (const [unitKey, defs] of Object.entries(UNIT_KNOB_DEFS)) {
    const container = document.getElementById(`knobs-${unitKey}`);
    if (!container) continue;
    container.innerHTML = defs.map((d) => {
      const val = state.units[unitKey].params[d.key] ?? 0.5;
      const pct = Math.round(val * 100);
      const ccNum = getActiveCCForParam(unitKey, d.key);
      return `
        <div class="knob-cell" data-unit="${unitKey}" data-param="${d.key}" title="Drag vertically to adjust & send MIDI CC ${ccNum}">
          <div class="knob-svg-holder">${createKnobSVG(val)}</div>
          <span class="knob-label">${d.label}</span>
          <span class="knob-cc-badge" data-cc-badge="${unitKey}-${d.key}">CC ${ccNum} • <span class="knob-val">${pct}%</span></span>
        </div>
      `;
    }).join('');
  }

  const fxContainer = document.getElementById('knobs-fx');
  if (fxContainer) {
    fxContainer.innerHTML = FX_KNOB_DEFS.map((d) => {
      const val = state.fx[d.key] ?? 0.5;
      const pct = Math.round(val * 100);
      return `
        <div class="knob-cell" data-fx="${d.key}">
          <div class="knob-svg-holder">${createKnobSVG(val)}</div>
          <span class="knob-label">${d.label}</span>
          <span class="knob-val">${pct}%</span>
        </div>
      `;
    }).join('');
  }

  bindKnobDragEvents();
}

function updateKnobVisualsOnly() {
  document.querySelectorAll('.knob-cell[data-unit]').forEach((cell) => {
    const unitKey = cell.getAttribute('data-unit');
    const paramKey = cell.getAttribute('data-param');
    const val = state.units[unitKey]?.params?.[paramKey];
    if (typeof val !== 'number') return;
    const holder = cell.querySelector('.knob-svg-holder');
    const valEl = cell.querySelector('.knob-val');
    if (holder) holder.innerHTML = createKnobSVG(val);
    if (valEl) valEl.textContent = `${Math.round(val * 100)}%`;
  });

  document.querySelectorAll('.knob-cell[data-fx]').forEach((cell) => {
    const fxKey = cell.getAttribute('data-fx');
    const val = state.fx[fxKey];
    if (typeof val !== 'number') return;
    const holder = cell.querySelector('.knob-svg-holder');
    const valEl = cell.querySelector('.knob-val');
    if (holder) holder.innerHTML = createKnobSVG(val);
    if (valEl) valEl.textContent = `${Math.round(val * 100)}%`;
  });
}

function bindKnobDragEvents() {
  document.querySelectorAll('.knob-cell').forEach((cell) => {
    cell.addEventListener('mousedown', (e) => {
      e.preventDefault();
      const startY = e.clientY;
      const unitKey = cell.getAttribute('data-unit');
      const paramKey = cell.getAttribute('data-param');
      const fxKey = cell.getAttribute('data-fx');

      const startVal = unitKey
        ? (state.units[unitKey].params[paramKey] ?? 0.5)
        : (state.fx[fxKey] ?? 0.5);

      const onMove = (moveEv) => {
        const delta = (startY - moveEv.clientY) / 130;
        const nextVal = Math.max(0.0, Math.min(1.0, startVal + delta));
        if (unitKey) {
          state.units[unitKey].params[paramKey] = nextVal;
          if (state.targetMacros) {
            if (unitKey === 'acid' && paramKey === 'cutoff') state.targetMacros.acidCutoff = nextVal;
            if (unitKey === 'acid' && paramKey === 'resonance') state.targetMacros.acidRes = nextVal;
            if (unitKey === 'acid' && paramKey === 'envMod') state.targetMacros.acidEnvMod = nextVal;
            if (unitKey === 'acid' && paramKey === 'decay') state.targetMacros.acidDecay = nextVal;
            if (unitKey === 'moog' && paramKey === 'cutoff') state.targetMacros.moogCutoff = nextVal;
            if (unitKey === 'lead' && paramKey === 'cutoff') state.targetMacros.leadCutoff = nextVal;
            if (unitKey === 'pads' && paramKey === 'cutoff') state.targetMacros.padCutoff = nextVal;
          }
          // Send live MIDI CC out according to active Arturia / Hardware profile!
          sendUnitParamCC(unitKey, paramKey, nextVal);
          const ccNum = getActiveCCForParam(unitKey, paramKey);
          const chMap = { drums: 10, acid: 2, moog: 3, lead: 4, pads: 5 };
          state.units[unitKey].lastReadout = `CH${chMap[unitKey]} • CC${ccNum}=${Math.round(nextVal * 127)}`;
          const rEl = document.getElementById(`readout-${unitKey}`);
          if (rEl) rEl.textContent = state.units[unitKey].lastReadout;
        } else if (fxKey) {
          state.fx[fxKey] = nextVal;
          if (state.targetMacros && fxKey in state.targetMacros) {
            state.targetMacros[fxKey] = nextVal;
          }
          dsp.updateMasterFX(state.fx, state.bpm);
        }
        updateKnobVisualsOnly();
      };

      const onUp = () => {
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
      };

      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    });

    cell.addEventListener('dblclick', () => {
      const fxKey = cell.getAttribute('data-fx');
      if (fxKey === 'masterFilter') {
        state.fx.masterFilter = 0.5;
        if (state.targetMacros) state.targetMacros.masterFilter = 0.5;
        dsp.updateMasterFX(state.fx, state.bpm);
        updateKnobVisualsOnly();
      }
    });
  });
}

function renderSequencerGrid() {
  const matrixEl = document.getElementById('sequencer-matrix');
  if (!matrixEl) return;

  let html = `<div class="step-ruler">
    <div class="seq-row-label">STEP // 16TH</div>
    ${Array.from({ length: 16 }, (_, i) => `<div class="step-num ${i % 4 === 0 ? 'beat-down' : ''}" data-ruler-step="${i}">${i + 1}</div>`).join('')}
  </div>`;

  const drumRows = [
    { key: 'kick',  label: 'BD 808/909', badge: '36' },
    { key: 'snare', label: 'SD SNARE',   badge: '38' },
    { key: 'clap',  label: 'CP CLAP',    badge: '39' },
    { key: 'ch',    label: 'CH CLOSED',  badge: '42' },
    { key: 'oh',    label: 'OH OPEN',    badge: '46' },
    { key: 'perc',  label: 'RM / PERC',  badge: '37' },
  ];

  for (const row of drumRows) {
    const steps = state.drums[row.key] || [];
    html += `<div class="seq-row">
      <div class="seq-row-label">
        <span>${row.label}</span>
        <span class="seq-row-badge">N${row.badge}</span>
      </div>
      ${Array.from({ length: 16 }, (_, i) => {
        const active = steps[i]?.active;
        const grp = Math.floor(i / 4);
        return `<button type="button" class="step-pad group-${grp} ${active ? 'active-drum' : ''}"
          data-lane-type="drum" data-drum="${row.key}" data-step="${i}">
          ${active ? '●' : ''}
        </button>`;
      }).join('')}
    </div>`;
  }

  html += `<div class="acid-programmer-box">
    <div class="seq-row">
      <div class="seq-row-label">
        <span style="color:var(--accent-gold)">TB-303 NOTE</span>
        <span class="seq-row-badge">CH2</span>
      </div>
      ${Array.from({ length: 16 }, (_, i) => {
        const st = state.acid[i] || { active: false, note: 36 };
        return `<button type="button" class="step-pad ${st.active ? 'active-acid' : ''}"
          data-lane-type="acid-note" data-step="${i}" title="Click to toggle step, Right-click to transpose up">
          ${st.active ? midiToNoteName(st.note) : '·'}
        </button>`;
      }).join('')}
    </div>
    <div class="seq-row" style="margin-bottom:3px;">
      <div class="seq-row-label">
        <span style="font-size:9.5px;color:#fca5a5;">303 ACCENT</span>
        <span class="seq-row-badge">V124</span>
      </div>
      ${Array.from({ length: 16 }, (_, i) => {
        const st = state.acid[i] || {};
        return `<button type="button" class="sub-step-toggle ${st.accent ? 'acc-on' : ''}"
          data-lane-type="acid-acc" data-step="${i}">ACC</button>`;
      }).join('')}
    </div>
    <div class="seq-row" style="margin-bottom:0;">
      <div class="seq-row-label">
        <span style="font-size:9.5px;color:#67e8f9;">303 SLIDE</span>
        <span class="seq-row-badge">GLIDE</span>
      </div>
      ${Array.from({ length: 16 }, (_, i) => {
        const st = state.acid[i] || {};
        return `<button type="button" class="sub-step-toggle ${st.slide ? 'sld-on' : ''}"
          data-lane-type="acid-sld" data-step="${i}">SLD</button>`;
      }).join('')}
    </div>
  </div>`;

  html += `<div class="seq-row" style="margin-top:8px;">
    <div class="seq-row-label">
      <span style="color:var(--accent-green)">MOOG SUB</span>
      <span class="seq-row-badge">CH3</span>
    </div>
    ${Array.from({ length: 16 }, (_, i) => {
      const st = state.bass[i] || { active: false, note: 36 };
      return `<button type="button" class="step-pad ${st.active ? 'active-moog' : ''}"
        data-lane-type="moog" data-step="${i}">
        ${st.active ? midiToNoteName(st.note) : '·'}
      </button>`;
    }).join('')}
  </div>`;

  html += `<div class="seq-row">
    <div class="seq-row-label">
      <span style="color:var(--accent-cyan)">PROPHET LEAD</span>
      <span class="seq-row-badge">CH4</span>
    </div>
    ${Array.from({ length: 16 }, (_, i) => {
      const st = state.lead[i] || { active: false, note: 60 };
      return `<button type="button" class="step-pad ${st.active ? 'active-lead' : ''}"
        data-lane-type="lead" data-step="${i}">
        ${st.active ? midiToNoteName(st.note) : '·'}
      </button>`;
    }).join('')}
  </div>`;

  matrixEl.innerHTML = html;

  matrixEl.querySelectorAll('[data-lane-type]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const type = btn.getAttribute('data-lane-type');
      const s = parseInt(btn.getAttribute('data-step'), 10);
      if (type === 'drum') {
        const dKey = btn.getAttribute('data-drum');
        state.drums[dKey][s].active = !state.drums[dKey][s].active;
      } else if (type === 'acid-note') {
        state.acid[s].active = !state.acid[s].active;
      } else if (type === 'acid-acc') {
        state.acid[s].accent = !state.acid[s].accent;
        state.acid[s].vel = state.acid[s].accent ? 124 : 86;
      } else if (type === 'acid-sld') {
        state.acid[s].slide = !state.acid[s].slide;
      } else if (type === 'moog') {
        state.bass[s].active = !state.bass[s].active;
      } else if (type === 'lead') {
        state.lead[s].active = !state.lead[s].active;
      }
      renderSequencerGrid();
    });

    btn.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      const type = btn.getAttribute('data-lane-type');
      const s = parseInt(btn.getAttribute('data-step'), 10);
      const intervals = SCALES[state.scale] || SCALES.dorian;
      const stepSemis = intervals[Math.floor(Math.random() * intervals.length)];
      const rootIdx = Math.max(0, NOTE_NAMES.indexOf(state.rootNote));
      if (type === 'acid-note') {
        state.acid[s].note = 36 + rootIdx + stepSemis + (Math.random() < 0.35 ? 12 : 0);
        state.acid[s].active = true;
      } else if (type === 'moog') {
        state.bass[s].note = 24 + rootIdx + stepSemis + 12;
        state.bass[s].active = true;
      } else if (type === 'lead') {
        state.lead[s].note = 60 + rootIdx + stepSemis;
        state.lead[s].active = true;
      }
      renderSequencerGrid();
    });
  });
}

function renderChordProgression() {
  const el = document.getElementById('chord-strip');
  if (!el) return;
  const activeBarIdx = (state.currentBar - 1) % Math.max(1, state.pads.length);
  el.innerHTML = state.pads.map((c, idx) => {
    const noteNames = (c.notes || []).map(midiToNoteName).join(' · ');
    return `
      <div class="chord-card ${idx === activeBarIdx ? 'active-bar' : ''}" data-chord-bar="${idx}">
        <span class="chord-bar-label">BAR 0${idx + 1} // ${c.roman || 'CHORD'}</span>
        <span class="chord-name">${c.name}</span>
        <span class="chord-notes">${noteNames}</span>
      </div>
    `;
  }).join('');
}

function renderCartridges() {
  const el = document.getElementById('cartridge-list');
  if (!el) return;
  el.innerHTML = GENRE_CARTRIDGES.map((c) => `
    <button type="button" class="cartridge-btn ${state.activeCartridgeId === c.id ? 'active' : ''}" data-cartridge="${c.id}">
      ${c.name}
    </button>
  `).join('');

  el.querySelectorAll('[data-cartridge]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-cartridge');
      const cart = GENRE_CARTRIDGES.find((x) => x.id === id);
      if (!cart) return;
      state.activeCartridgeId = cart.id;
      const promptInput = document.getElementById('input-ai-prompt');
      if (promptInput) promptInput.value = cart.prompt;
      renderCartridges();
      generateFromPrompt(cart.prompt, cart);
    });
  });
}

function renderSectionPills() {
  const el = document.getElementById('section-pills');
  if (!el) return;
  el.innerHTML = SONG_SECTIONS.map((sec) => `
    <button type="button" class="section-pill ${state.section === sec ? 'active' : ''}" data-sec="${sec}">
      ${sec}
    </button>
  `).join('');

  el.querySelectorAll('[data-sec]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const sec = btn.getAttribute('data-sec');
      triggerAutonomousEvolution(sec);
    });
  });
}

function renderPatchbayAndApps() {
  const portsEl = document.getElementById('patchbay-ports');
  if (portsEl) {
    const vPorts = state.coreMidiStatus.virtualPorts || [];
    const hwDests = state.coreMidiStatus.hardwareDestinations || [];

    let html = vPorts.map((vp) => `
      <div class="patch-row">
        <span class="patch-port-name">
          <span class="led-dot on-green"></span>
          ${vp.name}
        </span>
        <span class="patch-badge">COREMIDI VIRTUAL OUT</span>
      </div>
    `).join('');

    html += hwDests.map((hd) => `
      <div class="patch-row">
        <span class="patch-port-name">
          <span class="led-dot ${hd.enabled ? 'on-amber' : ''}"></span>
          HW/OS Dest: ${hd.name}
        </span>
        <button type="button" class="mini-btn ${hd.enabled ? 'ext-active' : ''}" data-toggle-dest="${hd.index}">
          ${hd.enabled ? 'ROUTED (ON)' : 'ROUTE MIDI'}
        </button>
      </div>
    `).join('');

    portsEl.innerHTML = html;

    portsEl.querySelectorAll('[data-toggle-dest]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const idx = parseInt(btn.getAttribute('data-toggle-dest'), 10);
        await fetch('/api/midi/config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'toggle_dest', index: idx }),
        });
        fetchCoreMidiStatus();
      });
    });
  }
}

function clearPlayheadHighlight() {
  document.querySelectorAll('.current-step').forEach((el) => el.classList.remove('current-step'));
  document.querySelectorAll('.step-num.playhead').forEach((el) => el.classList.remove('playhead'));
}

// ============================================================================
// REAL-TIME OSCILLOSCOPE & UI ANIMATION LOOP
// ============================================================================

function startVisualLoop() {
  const canvas = document.getElementById('master-scope');
  const ctx2d = canvas ? canvas.getContext('2d') : null;
  const timeData = new Uint8Array(512);

  function frame() {
    if (dsp.ctx && uiStepQueue.length > 0) {
      const now = dsp.ctx.currentTime;
      while (uiStepQueue.length > 0 && uiStepQueue[0].time <= now + 0.015) {
        const ev = uiStepQueue.shift();
        clearPlayheadHighlight();
        const rulerEl = document.querySelector(`[data-ruler-step="${ev.step}"]`);
        if (rulerEl) rulerEl.classList.add('playhead');
        document.querySelectorAll(`.step-pad[data-step="${ev.step}"]`).forEach((el) => {
          el.classList.add('current-step');
        });
        const stepReadout = document.getElementById('readout-bar-step');
        if (stepReadout) {
          stepReadout.textContent = `${String(ev.bar).padStart(2, '0')}.${String(ev.step + 1).padStart(2, '0')}`;
        }
        if (ev.step === 0) {
          renderChordProgression();
        }
        for (const uKey of ['drums', 'acid', 'moog', 'lead', 'pads']) {
          const rEl = document.getElementById(`readout-${uKey}`);
          if (rEl) rEl.textContent = state.units[uKey].lastReadout;
        }
        updateKnobVisualsOnly();
      }
    }

    if (ctx2d && canvas) {
      const w = canvas.width = canvas.clientWidth * (window.devicePixelRatio || 1);
      const h = canvas.height = canvas.clientHeight * (window.devicePixelRatio || 1);
      ctx2d.fillStyle = '#060809';
      ctx2d.fillRect(0, 0, w, h);

      ctx2d.strokeStyle = '#182028';
      ctx2d.lineWidth = 1;
      ctx2d.beginPath();
      ctx2d.moveTo(0, h / 2);
      ctx2d.lineTo(w, h / 2);
      ctx2d.stroke();

      if (dsp.analyser && state.isPlaying) {
        dsp.analyser.getByteTimeDomainData(timeData);
        ctx2d.strokeStyle = '#ff6b1a';
        ctx2d.lineWidth = 2;
        ctx2d.beginPath();
        const slice = w / timeData.length;
        for (let i = 0; i < timeData.length; i++) {
          const v = timeData[i] / 128.0;
          const y = (v * h) / 2;
          if (i === 0) ctx2d.moveTo(0, y);
          else ctx2d.lineTo(i * slice, y);
        }
        ctx2d.stroke();
      } else {
        ctx2d.strokeStyle = '#252d38';
        ctx2d.beginPath();
        ctx2d.moveTo(0, h / 2);
        ctx2d.lineTo(w, h / 2);
        ctx2d.stroke();
      }
    }

    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
}

// ============================================================================
// TELEMETRY LOGGING
// ============================================================================

function addLog(tag, message) {
  const logEl = document.getElementById('telemetry-log');
  if (!logEl) return;
  const now = new Date();
  const ts = now.toTimeString().slice(0, 8);
  const entry = document.createElement('div');
  entry.className = 'log-entry';
  entry.innerHTML = `
    <span class="log-time">${ts}</span>
    <span class="${tag === 'AI' ? 'log-tag-ai' : 'log-tag-midi'}">[${tag}]</span>
    <span class="log-msg">${message}</span>
  `;
  logEl.prepend(entry);
  while (logEl.children.length > 40) {
    logEl.removeChild(logEl.lastChild);
  }
}

// ============================================================================
// INITIALIZATION & EVENT BINDINGS
// ============================================================================

function bindTopAndUnitControls() {
  document.getElementById('btn-play-toggle')?.addEventListener('click', () => {
    if (state.isPlaying) stopSequencer();
    else startSequencer();
  });

  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && document.activeElement?.tagName !== 'INPUT') {
      e.preventDefault();
      if (state.isPlaying) stopSequencer();
      else startSequencer();
    }
  });

  // Solo CC Learn Mode Toggle
  document.getElementById('btn-midi-learn-mode')?.addEventListener('click', (e) => {
    state.midiLearnSolo = !state.midiLearnSolo;
    e.currentTarget.classList.toggle('learn-active', state.midiLearnSolo);
    e.currentTarget.textContent = state.midiLearnSolo ? 'CC LEARN: ACTIVE' : 'CC LEARN SOLO';
    addLog(
      'MIDI',
      state.midiLearnSolo
        ? 'CC LEARN SOLO ACTIVE: Background AI CC stream paused. Drag any single knob to MIDI-learn it cleanly in Arturia or Ableton.'
        : 'CC LEARN SOLO OFF: Resumed full 5-synth AI CC parameter modulation.'
    );
  });

  // Per-Unit Hardware / Arturia CC Profile Selectors
  document.querySelectorAll('[data-profile-select]').forEach((sel) => {
    sel.addEventListener('change', (e) => {
      const unitKey = sel.getAttribute('data-profile-select');
      const nextProf = e.target.value;
      if (state.units[unitKey]) {
        state.units[unitKey].profile = nextProf;
        renderAllKnobs();
        const profObj = SYNTH_CC_PROFILES[unitKey]?.[nextProf];
        const summary = profObj
          ? Object.entries(profObj.ccMap).map(([k, v]) => `${k}=CC${v}`).join(', ')
          : '';
        addLog('MIDI', `Unit [${unitKey.toUpperCase()}] switched CC Profile to "${profObj?.name || nextProf}" (${summary}).`);
      }
    });
  });

  const promptInput = document.getElementById('input-ai-prompt');
  document.getElementById('btn-ai-generate')?.addEventListener('click', () => {
    generateFromPrompt(promptInput?.value || state.prompt);
    if (!state.isPlaying) startSequencer();
  });
  promptInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      generateFromPrompt(promptInput.value);
      if (!state.isPlaying) startSequencer();
    }
  });

  document.getElementById('btn-evolve-now')?.addEventListener('click', () => {
    triggerAutonomousEvolution();
    if (!state.isPlaying) startSequencer();
  });

  document.getElementById('input-bpm')?.addEventListener('change', (e) => {
    state.bpm = Math.max(60, Math.min(200, parseInt(e.target.value, 10) || 128));
    dsp.updateMasterFX(state.fx, state.bpm);
  });

  document.getElementById('select-root')?.addEventListener('change', (e) => {
    state.rootNote = e.target.value;
    generateFromPrompt(state.prompt);
  });

  document.getElementById('select-scale')?.addEventListener('change', (e) => {
    state.scale = e.target.value;
    generateFromPrompt(state.prompt);
  });

  document.getElementById('select-evolve-bars')?.addEventListener('change', (e) => {
    state.autoEvolveBars = parseInt(e.target.value, 10);
    addLog('AI', state.autoEvolveBars > 0
      ? `Autonomous song evolution armed: mutating arrangement every ${state.autoEvolveBars} bars.`
      : 'Autonomous evolution paused: holding current groove infinitely.');
  });

  const modelSelect = document.getElementById('select-ai-model');
  const keyInput = document.getElementById('input-gemini-key');
  if (keyInput && state.geminiApiKey) {
    keyInput.value = state.geminiApiKey;
  }
  modelSelect?.addEventListener('change', (e) => {
    state.aiModel = e.target.value;
    addLog('AI', `Switched AI Conductor model to [${state.aiModel}].`);
  });
  keyInput?.addEventListener('change', (e) => {
    state.geminiApiKey = e.target.value.trim();
    localStorage.setItem('aether_gemini_key', state.geminiApiKey);
    if (state.geminiApiKey && state.aiModel === 'symbolic') {
      state.aiModel = 'gemini-flash-latest';
      if (modelSelect) modelSelect.value = 'gemini-flash-latest';
    }
    addLog('AI', state.geminiApiKey ? `Gemini API Key saved for live [${state.aiModel}] arrangement.` : 'Cleared Gemini API Key (using Local Symbolic Theory Engine v2).');
  });

  document.querySelectorAll('[data-unit-pin]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const u = btn.getAttribute('data-unit-pin');
      state.units[u].pinned = !state.units[u].pinned;
      renderUnitStagingBadges();
      addLog('AI', state.units[u].pinned
        ? `Unit [${u.toUpperCase()}] PINNED ON: overriding AI staging so this synth plays continuously.`
        : `Unit [${u.toUpperCase()}] UNPINNED: returning voice staging control to AI Conductor.`);
    });
  });

  document.querySelectorAll('[data-unit-mute]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const u = btn.getAttribute('data-unit-mute');
      state.units[u].mute = !state.units[u].mute;
      btn.classList.toggle('mute-active', state.units[u].mute);
    });
  });

  document.querySelectorAll('[data-unit-solo]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const u = btn.getAttribute('data-unit-solo');
      state.units[u].solo = !state.units[u].solo;
      btn.classList.toggle('solo-active', state.units[u].solo);
    });
  });

  document.querySelectorAll('[data-unit-ext]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const u = btn.getAttribute('data-unit-ext');
      state.units[u].extOnly = !state.units[u].extOnly;
      btn.classList.toggle('ext-active', state.units[u].extOnly);
      btn.textContent = state.units[u].extOnly ? 'MIDI ONLY' : 'DSP+MIDI';
      addLog('MIDI', `Unit [${u.toUpperCase()}] switched to ${state.units[u].extOnly ? 'External MIDI Only (Internal DSP Muted for Ableton/Arturia/Hardware)' : 'Internal Analog DSP + External MIDI Out'}.`);
    });
  });

  document.getElementById('btn-303-wave')?.addEventListener('click', (e) => {
    const next = state.units.acid.waveform === 'sawtooth' ? 'square' : 'sawtooth';
    state.units.acid.waveform = next;
    e.currentTarget.textContent = next === 'sawtooth' ? 'SAW' : 'SQR';
  });

  document.querySelectorAll('[data-launch-app]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const appId = btn.getAttribute('data-launch-app');
      addLog('MIDI', `Launching standalone synth/DAW: ${appId}...`);
      try {
        const res = await fetch('/api/launch-app', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: appId }),
        });
        const data = await res.json();
        if (data.ok) {
          addLog('MIDI', `Opened ${data.launched}. Select "AETHER // ..." or "IAC Driver Bus 1" in its MIDI settings.`);
        } else {
          addLog('MIDI', `Could not launch ${appId}: ${data.error}`);
        }
      } catch (_) {}
    });
  });

  document.getElementById('btn-export-midi')?.addEventListener('click', async () => {
    try {
      const res = await fetch('/api/midi/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bpm: state.bpm,
          drums: state.drums,
          acid: state.acid,
          bass: state.bass,
          lead: state.lead,
          pads: state.pads,
        }),
      });
      if (!res.ok) return;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `aether-909-${state.rootNote}-${state.scale}-${state.bpm}bpm.mid`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      addLog('MIDI', 'Exported 5-track Standard MIDI File (.mid) with 303 legato overlaps for Ableton Live 12.');
    } catch (_) {}
  });

  document.getElementById('btn-midi-panic')?.addEventListener('click', () => {
    fetch('/api/midi/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'panic' }),
    });
    addLog('MIDI', 'Sent All-Notes-Off (CC 123) across Channels 1–16 on all virtual & hardware ports.');
  });
}

window.addEventListener('DOMContentLoaded', () => {
  renderCartridges();
  const initial = ai.composeFullArrangement({
    prompt: state.prompt,
    section: 'GROOVE',
    bpm: state.bpm,
    rootNote: state.rootNote,
    scale: state.scale,
    grooveStyle: state.grooveStyle,
  });
  applyArrangementToState(initial);
  renderAllKnobs();
  bindTopAndUnitControls();
  initWebMIDI();
  fetchCoreMidiStatus();
  startVisualLoop();

  addLog('AI', 'AETHER-909 Studio ready. Factory Arturia V Collection CC maps + Hardware Synth CC Profiles loaded.');
});
