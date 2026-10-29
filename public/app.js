/**
 * AETHER-909 // Master Studio Sequencer, CoreMIDI + WebMIDI Dispatcher & UI Controller
 */

import { AnalogStudioDSP } from './synth-engine.js?v=usb2';
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
    sp404: {
      // Roland SP-404MKII Hardware Sampler MIDI CC specification
      // CC16=MFX Param1 (Filter/DJFX), CC17=MFX Param2 (Sub/Decay), CC18=MFX Param3 (Vinyl/Snap), CC74=Cutoff, CC80=Bus FX Drive, CC7=Volume
      name: 'Roland SP-404MKII Sampler',
      ccMap: { punch: 16, decay: 17, snappy: 18, hatDecay: 74, drive: 80, level: 7 },
    },
    te_ep40: {
      // Teenage Engineering EP-40 / K.O. II Sampler (Limited CC Mapping — velocity-driven pads + core CCs)
      name: 'Teenage Eng. EP-40 Sampler (Limited CC)',
      limitedCC: true,
      ccMap: { punch: 1, decay: 74, snappy: 71, hatDecay: 10, drive: 64, level: 7 },
    },
    arturia_emulator_cmi: {
      name: 'Arturia Emulator II V / CMI V (Factory)',
      ccMap: { punch: 16, decay: 75, snappy: 17, hatDecay: 74, drive: 18, level: 85 },
    },
    ableton_drums: {
      name: 'Ableton 12 Drum Rack Macros',
      ccMap: { punch: 20, decay: 21, snappy: 22, hatDecay: 23, drive: 24, level: 7 },
    },
  },
  moog: {
    moog_sub37: {
      // Moog Sub 37 / Subsequent 37 Hardware MIDI CC specification:
      // CC19=Filter Cutoff, CC21=Filter Resonance, CC22=Filter EG Amount, CC23=Filter Decay (+CC12 Osc2 Beat), CC18=Multidrive (+CC114 Sub Osc), CC7=Volume
      name: 'Moog Sub 37 Hardware (Bass)',
      ccMap: { cutoff: 19, resonance: 21, contour: 22, detune: 23, sub: 18, level: 7 },
      extraCCs: { cutoff: [74], resonance: [71], detune: [12], sub: [114] },
    },
    korg_volca_keys_bass: {
      // Korg Volca Keys Hardware in Unison / Ring Bass Mode:
      // CC44=VCF Cutoff, CC46=VCF EG Int, CC42=VCO Detune, CC49=EG Decay/Release, CC40=Voice Mode, CC11=Expression
      name: 'Korg Volca Keys (Unison Sub Bass)',
      ccMap: { cutoff: 44, resonance: 46, contour: 42, detune: 49, sub: 40, level: 11 },
    },
    arturia_mini_v4: {
      name: 'Arturia Mini V4 (Factory Default)',
      ccMap: { cutoff: 74, resonance: 71, contour: 73, detune: 79, sub: 19, level: 17 },
      extraCCs: { detune: [83] },
    },
  },
  lead: {
    prophet_6: {
      // Sequential Prophet-6 Hardware MIDI CC specification:
      // CC102=LPF Cutoff, CC103=LPF Resonance, CC104=LPF Env Amt, CC62=FX1 Delay Mix, CC68=FX2 Reverb Mix, CC7=Master Volume
      name: 'Sequential Prophet-6 Hardware',
      ccMap: { cutoff: 102, resonance: 103, lfoMod: 104, delaySend: 62, reverbSend: 68, level: 7 },
      extraCCs: { cutoff: [74], resonance: [71], reverbSend: [91] },
    },
    korg_volca_fm: {
      // Korg Volca FM Hardware MIDI CC specification:
      // CC44=Modulator Attack, CC45=Modulator Decay, CC49=Algorithm, CC43=Carrier Decay, CC47=LFO Pitch Depth (+CC46 LFO Rate), CC41=Velocity
      name: 'Korg Volca FM (6-Op DX Lead/Arp)',
      ccMap: { cutoff: 44, resonance: 45, lfoMod: 49, delaySend: 43, reverbSend: 47, level: 41 },
      extraCCs: { reverbSend: [46] },
    },
    korg_volca_keys: {
      name: 'Korg Volca Keys (Analog Delay Lead)',
      ccMap: { cutoff: 44, resonance: 42, lfoMod: 46, delaySend: 52, reverbSend: 53, level: 11 },
    },
    arturia_dx7_prophet: {
      // Exact Arturia Factory Default map for Prophet-5 V, KORG MS-20 V & DX7 V
      name: 'Arturia DX7 V / MS-20 V / Prophet-5 V',
      ccMap: { cutoff: 74, resonance: 71, lfoMod: 18, delaySend: 75, reverbSend: 83, level: 85 },
      extraCCs: { cutoff: [16], resonance: [17], reverbSend: [19] },
    },
  },
  pads: {
    korg_minilogue: {
      name: 'Korg Minilogue (4-Voice Analog Poly)',
      ccMap: { cutoff: 43, chorus: 44, attack: 16, release: 19, reverbSend: 29, level: 7 },
      extraCCs: { cutoff: [74], chorus: [45, 71, 93], attack: [73], release: [72], reverbSend: [30, 31, 91] },
    },
    korg_kronos: {
      name: 'Korg Kronos Workstation Combi/Pads',
      ccMap: { cutoff: 74, chorus: 93, attack: 73, release: 72, reverbSend: 91, level: 7 },
      extraCCs: { chorus: [71] },
    },
    arturia_juno_cs80: {
      // Exact Arturia Factory Default map for Jun-6 V, CS-80 V4, Jup-8 V4 & Matrix-12 V2
      name: 'Arturia Jun-6 V / CS-80 V4 / Jup-8 V4',
      ccMap: { cutoff: 74, chorus: 93, attack: 73, release: 72, reverbSend: 91, level: 85 },
      extraCCs: { cutoff: [16], chorus: [71] },
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
  autoEvolveBars: 16, // 16 bars (~31s at 124 BPM) per section so Dub Techno movements genuinely breathe!
  activeCartridgeId: 'berlin_dub',
  prompt: GENRE_CARTRIDGES[0].prompt,
  studioMode: 'hardware', // 'hardware' (USB MIDI only, Mac muted) | 'mac_dsp' (USB + Mac DSP) | 'arturia'

  currentStep: 0,
  currentBar: 1,
  totalBarsPlayed: 0,
  txPacketCount: 0,
  setDirector: {
    trackNumber: 1,
    barInTrack: 0,
    transitionActive: false,
    transitionBar: 0,
    incomingArrangement: null,
    persistentUserSteering: {
      noiseMuted: false,
      darker: false,
      brighter: false,
      dry: false,
    },
  },

  activeVoices: {
    drums: true,
    moog: true,
    lead: true,
    pads: true,
  },
  programs: { drums: 25, moog: 38, lead: 81, pads: 89 },

  // Per-Unit Routing, Active CC Profile & Mixer State (4-Unit Hardware Rig)
  units: {
    drums: {
      mute: false,
      solo: false,
      pinned: false,
      extOnly: true,
      profile: 'sp404',
      lastReadout: 'CH10 • READY',
      params: { punch: 0.75, decay: 0.58, snappy: 0.68, hatDecay: 0.42, drive: 0.48, level: 0.88 },
    },
    moog: {
      mute: false,
      solo: false,
      pinned: false,
      extOnly: true,
      profile: 'moog_sub37',
      waveform: 'sawtooth',
      lastReadout: 'CH3 • READY',
      params: { cutoff: 0.48, resonance: 0.42, contour: 0.62, detune: 0.38, sub: 0.78, level: 0.86 },
    },
    lead: {
      mute: false,
      solo: false,
      pinned: false,
      extOnly: true,
      profile: 'prophet_6',
      lastReadout: 'CH4 • READY',
      params: { cutoff: 0.62, resonance: 0.42, lfoMod: 0.38, delaySend: 0.58, reverbSend: 0.48, level: 0.76 },
    },
    pads: {
      mute: false,
      solo: false,
      pinned: false,
      extOnly: true,
      profile: 'korg_minilogue',
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
    { key: 'punch',    label: 'DJFX / PUNCH' },
    { key: 'decay',    label: 'SUB / DECAY'  },
    { key: 'snappy',   label: 'VINYL SNAP'   },
    { key: 'hatDecay', label: 'ISOLATOR HI'  },
    { key: 'drive',    label: 'BUS DRIVE'    },
    { key: 'level',    label: 'SAMPLER LVL'  },
  ],
  moog: [
    { key: 'cutoff',    label: 'LADDER CUT'  },
    { key: 'resonance', label: 'RESONANCE'   },
    { key: 'contour',   label: 'EG CONTOUR'  },
    { key: 'detune',    label: 'FILT DECAY'  },
    { key: 'sub',       label: 'MULTIDRIVE'  },
    { key: 'level',     label: 'MASTER VOL'  },
  ],
  lead: [
    { key: 'cutoff',     label: 'CUT / MOD ATK'},
    { key: 'resonance',  label: 'RES / MOD DEC'},
    { key: 'lfoMod',     label: 'ENV / ALGO'   },
    { key: 'delaySend',  label: 'DLY / CAR DEC'},
    { key: 'reverbSend', label: 'REV / LFO DEP'},
    { key: 'level',      label: 'LEVEL / VEL'  },
  ],
  pads: [
    { key: 'cutoff',     label: 'VCF CUTOFF'  },
    { key: 'chorus',     label: 'RES / CHORUS'},
    { key: 'attack',     label: 'EG ATTACK'   },
    { key: 'release',    label: 'EG RELEASE'  },
    { key: 'reverbSend', label: 'DELAY / REV' },
    { key: 'level',      label: 'MASTER VOL'  },
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
  const chMap = { drums: 9, moog: 2, lead: 3, pads: 4 };
  const portMap = { drums: 1, moog: 2, lead: 3, pads: 4 };
  const ch = chMap[unitKey] ?? 0;
  const port = portMap[unitKey] ?? 0;
  const ccVal = Math.max(0, Math.min(127, Math.round(normVal * 127)));

  const primaryCC = getActiveCCForParam(unitKey, paramKey);
  queueMidiEvent(port, [0xB0 | ch, primaryCC & 0x7F, ccVal]);

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

function resolveUnitProgram(unitKey, rawProg) {
  const n = Math.max(0, parseInt(rawProg ?? 0, 10) || 0);
  if (state.studioMode === 'arturia') return n & 0x7F;
  // Hardware / GM Synth banks for Raspberry Pi FluidSynth & external synths (avoids GM Program 0 Grand Piano!)
  const hwBank = {
    drums: [25, 25, 24, 25, 26], // TR-808 / Electronic Drum Kits
    moog:  [38, 39, 38, 39, 87], // Synth Bass 1 / Synth Bass 2 / Bass+Lead
    lead:  [81, 80, 81, 84, 81], // Lead 2 (Sawtooth) / Lead 1 (Square)
    pads:  [89, 95, 88, 90, 92], // Pad 2 (Warm) / Pad 8 (Sweep) / Polysynth
  };
  const choices = hwBank[unitKey];
  if (!choices) return n & 0x7F;
  // Preserve already-valid GM synth patch numbers if explicitly chosen
  if (unitKey === 'drums' && n >= 24 && n <= 32) return n;
  if (unitKey === 'moog' && n >= 32 && n <= 40) return n;
  if (unitKey === 'lead' && n >= 80 && n <= 87) return n;
  if (unitKey === 'pads' && n >= 88 && n <= 95) return n;
  return choices[n % choices.length];
}

function webMidiMatchesPort(destName, portId) {
  if (!destName) return false;
  const low = destName.toLowerCase();
  if (low.includes('iac driver') || low.includes('aether //') || low.includes('arturia //') || low.includes('network')) {
    return false;
  }
  if (portId === 0) return true;
  if (!low.includes('aether') && !low.includes('pi')) return true;
  if (low.includes('pi1') || low.includes('sp404') || low.includes('drum')) return portId === 1;
  if (low.includes('pi2') || low.includes('moog') || low.includes('sub37') || low.includes('acid')) return portId === 2;
  if (low.includes('pi3') || low.includes('prophet') || low.includes('volca') || low.includes('lead')) return portId === 3;
  if (low.includes('pi4') || low.includes('pi5') || low.includes('minilogue') || low.includes('kronos') || low.includes('pad')) return portId === 4;
  return true;
}

function queueMidiEvent(portId, bytes, noteOffDelayMs = 0, noteOffBytes = null, stepTimeSec = null) {
  const delayMs = (stepTimeSec !== null && dsp.ctx)
    ? Math.max(0, Math.round((stepTimeSec - dsp.ctx.currentTime) * 1000))
    : 0;
  pendingMidiEvents.push({ port: portId, bytes, delayMs });

  if (noteOffDelayMs > 0 && noteOffBytes) {
    pendingMidiEvents.push({ port: portId, bytes: noteOffBytes, delayMs: delayMs + Math.round(noteOffDelayMs) });
  }

  if (!flushTimer) {
    flushTimer = setTimeout(flushMidiQueue, 4);
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

  let sentViaCoreMidi = false;
  if (state.coreMidiStatus?.coreMidiAvailable !== false) {
    try {
      const res = await fetch('/api/midi/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events: batch }),
      });
      if (res.ok) {
        const data = await res.json();
        sentViaCoreMidi = true;
        state.txPacketCount = data.totalTx || (state.txPacketCount + batch.length);
        const countEl = document.getElementById('tx-count-val');
        if (countEl) countEl.textContent = String(state.txPacketCount);
      }
    } catch (_) {}
  }

  // Automatic direct WebMIDI USB fallback if native CoreMIDI server is unreachable
  if (!sentViaCoreMidi && state.webMidiOutputs.length > 0) {
    const nowPerf = window.performance.now();
    for (const ev of batch) {
      for (const out of state.webMidiOutputs) {
        if (webMidiMatchesPort(out.name, ev.port)) {
          try {
            out.send(ev.bytes, nowPerf + (ev.delayMs || 0));
          } catch (_) {}
        }
      }
    }
    state.txPacketCount += batch.length;
    const countEl = document.getElementById('tx-count-val');
    if (countEl) countEl.textContent = String(state.txPacketCount);
  }
}

async function initWebMIDI() {
  if (!navigator.requestMIDIAccess) return;
  try {
    const access = await navigator.requestMIDIAccess({ sysex: false });
    const updatePorts = () => {
      state.webMidiOutputs = Array.from(access.outputs.values());
      updateUsbHeaderBadge();
    };
    access.onstatechange = updatePorts;
    updatePorts();
  } catch (_) {}
}

function updateUsbHeaderBadge() {
  const badgeEl = document.getElementById('usb-hw-count-badge');
  if (!badgeEl) return;
  const hwDests = state.coreMidiStatus?.hardwareDestinations || [];
  const activeUsb = hwDests.filter((d) => d.enabled && d.isHardware !== false);
  if (activeUsb.length > 0) {
    const shortNames = activeUsb.map((d) => d.name.replace(/^AETHER-/i, '').split('-')[0]);
    badgeEl.textContent = `${activeUsb.length} USB ROUTED (${shortNames.join(' · ')})`;
    badgeEl.style.color = '#15803d';
  } else {
    const webUsb = state.webMidiOutputs.filter((o) => webMidiMatchesPort(o.name, 0));
    if (webUsb.length > 0) {
      badgeEl.textContent = `${webUsb.length} WEBMIDI USB`;
      badgeEl.style.color = '#15803d';
    } else {
      badgeEl.textContent = '0 USB DEVICES';
      badgeEl.style.color = '#b91c1c';
    }
  }
}

async function fetchCoreMidiStatus() {
  try {
    const res = await fetch('/api/midi/status');
    if (!res.ok) return;
    const data = await res.json();
    state.coreMidiStatus = data;
    state.txPacketCount = data.txMessageCount || state.txPacketCount;
    updateUsbHeaderBadge();
    renderPatchbayAndApps();
  } catch (_) {
    state.coreMidiStatus.coreMidiAvailable = false;
    updateUsbHeaderBadge();
  }
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
  dsp.resumeAudioOutput();
  dsp.updateMasterFX(state.fx, state.bpm);
  if (state.isPlaying) return;

  state.isPlaying = true;
  state.currentStep = 0;
  state.currentBar = 1;
  nextStepTime = dsp.ctx.currentTime + 0.04;

  // Send MIDI Start (0xFA) + immediate Program Change & Volume CC7 to all 4 Pis
  queueMidiEvent(0, [0xFA]);
  queueMidiEvent(1, [0xC9, resolveUnitProgram('drums', state.programs.drums)]);
  queueMidiEvent(1, [0xB9, 7, 127]);
  queueMidiEvent(2, [0xC2, resolveUnitProgram('moog', state.programs.moog)]);
  queueMidiEvent(2, [0xB2, 7, 127]);
  queueMidiEvent(3, [0xC3, resolveUnitProgram('lead', state.programs.lead)]);
  queueMidiEvent(3, [0xB3, 7, 127]);
  queueMidiEvent(4, [0xC4, resolveUnitProgram('pads', state.programs.pads)]);
  queueMidiEvent(4, [0xB4, 7, 127]);
  const playBtn = document.getElementById('btn-play-toggle');
  if (playBtn) {
    playBtn.classList.add('active');
  }
  addLog(
    'MIDI',
    state.studioMode === 'hardware'
      ? `Transport locked at ${state.bpm} BPM. Streaming Notes + MIDI CCs strictly over USB to connected hardware (Mac audio muted).`
      : `Transport locked at ${state.bpm} BPM. Streaming Notes + Full-Synth MIDI CCs to USB + Internal DSP.`
  );

  schedulerTimer = setInterval(schedulerTick, LOOKAHEAD_MS);
}

function stopSequencer() {
  state.isPlaying = false;
  if (schedulerTimer) {
    clearInterval(schedulerTimer);
    schedulerTimer = null;
  }
  dsp.stopAllTails();
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
    state.setDirector.barInTrack++;

    // Manage active 16-bar DJ stem-by-stem crossfade transition!
    if (state.setDirector.transitionActive && state.setDirector.incomingArrangement) {
      const inc = state.setDirector.incomingArrangement;
      // Smooth Technics/CDJ pitch-fader tempo glide (~0.4 BPM per bar)
      if (inc.bpm && Math.abs(inc.bpm - state.bpm) > 0.25) {
        state.bpm = Math.round((state.bpm + (inc.bpm - state.bpm) * 0.22) * 10) / 10;
        const hdrBpm = document.getElementById('header-bpm-readout');
        if (hdrBpm) hdrBpm.textContent = `${Math.round(state.bpm)} BPM`;
      }
      state.setDirector.transitionBar++;
      const statusEl = document.getElementById('gemini-ear-status-text');
      if (statusEl) {
        const phaseLabel = state.setDirector.transitionBar < 4
          ? 'Phase 1/4: Space Wash & Tempo Glide'
          : state.setDirector.transitionBar < 8
            ? 'Phase 2/4: Sub-Bass Stem Cross-Swap!'
            : state.setDirector.transitionBar < 12
              ? 'Phase 3/4: Secondary Dyad & Hat Weave!'
              : 'Phase 4/4: Outgoing Chord Filter Fade & Drop!';
        statusEl.innerHTML = `<strong>SET DIRECTOR DJ MIX [BAR ${state.setDirector.transitionBar}/16] //</strong> Morphing into <em>${inc.archetypeName}</em> — ${phaseLabel}`;
      }
      if (state.setDirector.transitionBar >= 16) {
        completeSeamlessTrackArrival();
      }
    } else {
      // Auto-initiate 16-bar stem-by-stem DJ transition into next track at Bar 32 of each 48-bar chapter!
      if (state.setDirector.barInTrack === 32) {
        initiateSeamlessTrackTransition();
      } else if (state.autoEvolveBars > 0 && state.totalBarsPlayed > 0 && (state.totalBarsPlayed % state.autoEvolveBars === 0)) {
        triggerAutonomousEvolution();
      }
    }
  }
}

function scheduleStep(stepIdx, stepTime) {
  const secondsPerBeat = 60.0 / Math.max(60, Math.min(200, state.bpm));
  const stepDurSec = secondsPerBeat * 0.25;
  const stepDurMs = stepDurSec * 1000;

  // Smoothly interpolate AI Macros + broadcast full CC modulation to Arturia / Hardware!
  stepMacroInterpolation(stepIdx);

  // On every bar downbeat (step 0), send MIDI Program Change + CC7 Volume so newly connected/booted Pis lock patch immediately
  if (stepIdx === 0) {
    queueMidiEvent(1, [0xC9, resolveUnitProgram('drums', state.programs.drums)], 0, null, stepTime);
    queueMidiEvent(1, [0xB9, 7, 127], 0, null, stepTime);
    queueMidiEvent(2, [0xC2, resolveUnitProgram('moog', state.programs.moog)], 0, null, stepTime);
    queueMidiEvent(2, [0xB2, 7, 127], 0, null, stepTime);
    queueMidiEvent(3, [0xC3, resolveUnitProgram('lead', state.programs.lead)], 0, null, stepTime);
    queueMidiEvent(3, [0xB3, 7, 127], 0, null, stepTime);
    queueMidiEvent(4, [0xC4, resolveUnitProgram('pads', state.programs.pads)], 0, null, stepTime);
    queueMidiEvent(4, [0xB4, 7, 127], 0, null, stepTime);
  }

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
    // 8-Bar Berlin/Detroit Dub Console Development Arc:
    // Bar 4 (+5 st parallel subdominant lift), Bar 7 (-2 st Aeolian drop), Bar 8 (+7 st fifth lift + Beat 3-4 kick drop + step 14 rim fill!)
    const barIn8 = state.totalBarsPlayed % 8;
    const planingOffset = (barIn8 === 3) ? 5 : (barIn8 === 6 ? -2 : (barIn8 === 7 && stepIdx < 12 ? 7 : 0));
    const isBar8DrumDrop = (barIn8 === 7 && stepIdx >= 8);
    // Smooth 8-bar filter trajectory scaled by user baseStabCutoffHz AND active Song Section!
    const phraseProgress = (barIn8 * 16 + stepIdx) / 128;
    const arcShape = Math.sin(phraseProgress * Math.PI);
    const sectionMult = state.section === 'PEAK EUPHORIA' ? 1.58
      : (state.section === 'TENSION BUILD' ? 1.26 : (state.section === 'DUB BREAKDOWN' ? 0.72 : 0.96));
    const baseCut = dsp.params.baseStabCutoffHz || 485;
    dsp.params.stabCutoffHz = Math.max(220, Math.min(2200, Math.round(baseCut * sectionMult * (0.85 + arcShape * 0.55))));

    const triggeredLabels = [];
    for (const d of drumMap) {
      const cell = state.drums[d.key]?.[stepIdx];
      // Drop kick on beats 3-4 of bar 8 for authentic Berlin dub breakdown tension!
      if (d.key === 'kick' && isBar8DrumDrop) continue;
      if (cell && cell.active) {
        const vel = Math.max(1, Math.min(127, cell.vel || 100));
        if (!state.units.drums.extOnly) {
          dsp.triggerDrum(d.key, stepTime, vel / 127, state.units.drums.params);
        }
        queueMidiEvent(1, [0x99, d.midi, vel], Math.round(stepDurMs * 0.5), [0x89, d.midi, 0], stepTime);
        triggeredLabels.push(d.label);
      }
    }
    // Dramatic Bar-8 Beat-4 rimshot delay splash turnaround!
    if (barIn8 === 7 && stepIdx === 14) {
      if (!state.units.drums.extOnly) dsp.triggerDrum('snare', stepTime, 0.85, state.units.drums.params);
      queueMidiEvent(1, [0x99, 37, 108], 90, [0x89, 37, 0], stepTime);
      triggeredLabels.push('TURNAROUND-RIM');
    }
    if (triggeredLabels.length > 0) {
      state.units.drums.lastReadout = `CH10 • ${triggeredLabels.join('+')}`;
    }
  }

  // Recompute barIn8 & planingOffset for melodic synths
  const barIn8 = state.totalBarsPlayed % 8;
  const planingOffset = (barIn8 === 3) ? 5 : (barIn8 === 6 ? -2 : (barIn8 === 7 && stepIdx < 12 ? 7 : 0));

  // --------------------------------------------------------------------------
  // 2. UNIT 02: MOOG SUB 37 / MINI V4 ANALOG BASS (MIDI Ch 2 & Ch 3, Port 2)
  // --------------------------------------------------------------------------
  if (isUnitAudible('moog')) {
    // During DJ Mix Bars 4..15, smoothly cross-swap Unit 2 (Sub-Bass) to the incoming track's bassline!
    const activeBassLane = (state.setDirector.transitionActive && state.setDirector.transitionBar >= 4 && state.setDirector.incomingArrangement?.bass)
      ? state.setDirector.incomingArrangement.bass
      : state.bass;
    const bassCell = activeBassLane[stepIdx];
    if (bassCell && bassCell.active) {
      const note = Math.max(24, Math.min(72, (bassCell.note || 36) + planingOffset));
      const vel = bassCell.accent ? 124 : Math.max(1, Math.min(127, bassCell.vel || 100));
      const gateFactor = bassCell.slide ? 1.18 : (bassCell.gate || 0.72);
      const gateMs = Math.round(stepDurMs * gateFactor);

      if (!state.units.moog.extOnly) {
        dsp.triggerMoogBass(
          note,
          stepTime,
          stepDurSec * gateFactor,
          vel / 127,
          {
            ...state.units.moog.params,
            waveform: state.units.moog.waveform,
            accent: bassCell.accent,
            slide: bassCell.slide,
          }
        );
      }
      if (bassCell.slide) {
        queueMidiEvent(2, [0xB2, 5, 58], 0, null, stepTime);
      }
      queueMidiEvent(2, [0x92, note, vel], gateMs, [0x82, note, 0], stepTime);
      const flags = `${bassCell.accent ? ' ACC' : ''}${bassCell.slide ? ' GLD' : ''}`;
      state.units.moog.lastReadout = `CH3 • ${midiToNoteName(note)} V${vel}${flags}`;
    }
  }

  // --------------------------------------------------------------------------
  // 3. UNIT 03: SECONDARY DUB VOICE — 12-STEP POLYMETRIC ROOTLESS DYADS (PhD #8)
  // --------------------------------------------------------------------------
  const globalPolymetricStep = state.totalBarsPlayed * 16 + stepIdx;
  const activeLeadLane = (state.setDirector.transitionActive && state.setDirector.transitionBar >= 8 && state.setDirector.incomingArrangement?.lead)
    ? state.setDirector.incomingArrangement.lead
    : state.lead;
  if (isUnitAudible('lead') && Array.isArray(activeLeadLane) && activeLeadLane.length > 0) {
    const leadCell = activeLeadLane[globalPolymetricStep % activeLeadLane.length];
    const isAnswerFill = (barIn8 % 2 === 1 && stepIdx === 8);
    if ((leadCell && leadCell.active) || isAnswerFill) {
      const baseNote = isAnswerFill ? ((state.pads?.[0]?.notes?.[0] || 50) + 12) : (leadCell?.note || 60);
      const note = Math.max(36, Math.min(96, baseNote + planingOffset));
      const vel = Math.max(1, Math.min(127, leadCell?.vel || 78));
      const gateFactor = leadCell?.gate || 0.45;
      if (!state.units.lead.extOnly) {
        dsp.triggerProphetLead(note, stepTime + 0.018, stepDurSec * gateFactor, vel / 127, state.units.lead.params);
      }
      queueMidiEvent(3, [0x93, note, vel], Math.round(stepDurMs * gateFactor), [0x83, note, 0], stepTime + 0.018);
      state.units.lead.lastReadout = `CH4 • ${midiToNoteName(note)} DYAD V${vel}`;
    }
  }

  // --------------------------------------------------------------------------
  // 4. UNIT 04: PRIMARY DUB CHORD SOUND-OBJECT — 14-STEP POLYMETRIC STABS (PhD #1 & #2)
  // --------------------------------------------------------------------------
  if (isUnitAudible('pads')) {
    const stabSteps = Array.isArray(state.chordStabSteps) && state.chordStabSteps.length > 0
      ? state.chordStabSteps
      : null;
    const activeStab = stabSteps
      ? stabSteps[globalPolymetricStep % stabSteps.length]
      : ((globalPolymetricStep % 14 === 0 || globalPolymetricStep % 14 === 6) ? state.pads?.[0] : null);

    if (activeStab && activeStab.active && Array.isArray(activeStab.notes)) {
      const shiftedNotes = activeStab.notes.map((n) => n + planingOffset);
      // During DJ Mix Bars 8..15, gently attenuate outgoing chord velocity so incoming bass & dyads glide forward seamlessly!
      const djFade = (state.setDirector.transitionActive && state.setDirector.transitionBar >= 8)
        ? Math.max(0.45, 1.0 - (state.setDirector.transitionBar - 7) * 0.065)
        : 1.0;
      const vel = Math.round((activeStab.vel || 96) * djFade);
      if (!state.units.pads.extOnly) {
        dsp.triggerJunoPadChord(shiftedNotes, stepTime, 0.18, vel / 127, state.units.pads.params);
      }
      // Percussive 165ms MIDI chord stab impulse into Unit 4 (Ch 5)!
      shiftedNotes.forEach((n) => {
        queueMidiEvent(4, [0x94, n, vel], 165, [0x84, n, 0], stepTime);
      });
      // Stream live section- & steering-aware filter CC74 + CC43 on Ch 5 (0xB4)!
      const cutoffCc = Math.max(18, Math.min(112, Math.round(18 + (dsp.params.stabCutoffHz / 1900) * 92)));
      queueMidiEvent(4, [0xB4, 74, cutoffCc], 0, null, stepTime);
      queueMidiEvent(4, [0xB4, 43, cutoffCc], 0, null, stepTime);
      state.units.pads.lastReadout = `CH5 • STAB [${shiftedNotes.map(midiToNoteName).join('-')}]`;
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

  // 1. Moog Sub 37 Bass Parameters (Ladder Cutoff, Resonance, EG Contour, Decay, Multidrive)
  state.units.moog.params.cutoff    = clamp(lerp(state.units.moog.params.cutoff, tm.moogCutoff) + lfoFast * 0.85);
  state.units.moog.params.resonance = clamp(lerp(state.units.moog.params.resonance, tm.acidRes * 0.65) - lfoMed * 0.4);
  state.units.moog.params.contour   = clamp(lerp(state.units.moog.params.contour, tm.acidEnvMod * 0.9) + lfoSlow * 0.5);
  state.units.moog.params.detune    = clamp(lerp(state.units.moog.params.detune, tm.acidDecay) + lfoSlow);

  // 2. Prophet-6 / Korg Volca Lead Parameters
  state.units.lead.params.cutoff     = clamp(lerp(state.units.lead.params.cutoff, tm.leadCutoff) - lfoFast * 0.8);
  state.units.lead.params.resonance  = clamp(0.42 + lfoMed * 1.5);
  state.units.lead.params.lfoMod     = clamp(0.45 + lfoSlow * 2.2);
  state.units.lead.params.delaySend  = clamp(lerp(state.units.lead.params.delaySend, tm.delayMix * 0.42));
  state.units.lead.params.reverbSend = clamp(lerp(state.units.lead.params.reverbSend, tm.reverbMix * 0.55));

  // 3. Korg Minilogue / Kronos Pad Parameters
  state.units.pads.params.cutoff     = clamp(lerp(state.units.pads.params.cutoff, tm.padCutoff) + lfoSlow * 1.2);
  state.units.pads.params.chorus     = clamp(0.58 + lfoMed * 0.8);
  state.units.pads.params.reverbSend = clamp(lerp(state.units.pads.params.reverbSend, tm.reverbMix * 0.52));

  // 4. Master FX
  state.fx.delayMix     = Math.min(0.45, lerp(state.fx.delayMix, tm.delayMix * 0.48));
  state.fx.reverbMix    = Math.min(0.52, lerp(state.fx.reverbMix, tm.reverbMix * 0.65));
  state.fx.masterFilter = lerp(state.fx.masterFilter, tm.masterFilter);
  dsp.updateMasterFX(state.fx, state.bpm);

  // Broadcast continuous MIDI CCs out to Hardware (unless CC LEARN SOLO mode is paused)
  if (!state.midiLearnSolo) {
    if (stepIdx % 2 === 1 && isUnitAudible('moog')) {
      sendUnitParamCC('moog', 'cutoff', state.units.moog.params.cutoff);
      sendUnitParamCC('moog', 'resonance', state.units.moog.params.resonance);
      sendUnitParamCC('moog', 'contour', state.units.moog.params.contour);
      sendUnitParamCC('moog', 'detune', state.units.moog.params.detune);
      sendUnitParamCC('moog', 'sub', state.units.moog.params.sub);
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
    // Respect Teenage Engineering EP-40 limited CC mapping (only send sparse filter CC on bar downbeat)
    const isEp40 = state.units.drums.profile === 'te_ep40';
    if (isUnitAudible('drums') && (isEp40 ? stepIdx === 0 : stepIdx % 8 === 0)) {
      sendUnitParamCC('drums', 'decay', state.units.drums.params.decay);
      if (!isEp40) {
        sendUnitParamCC('drums', 'snappy', state.units.drums.params.snappy);
        sendUnitParamCC('drums', 'hatDecay', state.units.drums.params.hatDecay);
      }
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


// ============================================================================
// OVERARCHING NARRATIVE SET DIRECTOR & 16-BAR DJ STEM HANDOVER ENGINE
// ============================================================================

async function initiateSeamlessTrackTransition(requestedArchetype = null) {
  if (state.setDirector.transitionActive) return;
  try {
    const resp = await fetch('/api/director/plan-transition', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        currentArchetype: state.archetypeId || 'basic_channel',
        requestedArchetype,
        userPrompt: state.prompt,
        userSteering: state.setDirector.persistentUserSteering,
        apiKey: state.geminiApiKey,
      }),
    }).then((r) => r.json());

    const nextArch = resp.toArchetype || 'fluxion';
    const incoming = ai.composeFullArrangement({
      archetypeId: nextArch,
      section: 'GROOVE',
      lockBpm: false,
    });
    state.setDirector.incomingArrangement = incoming;
    state.setDirector.transitionActive = true;
    state.setDirector.transitionBar = 0;

    const statusEl = document.getElementById('gemini-ear-status-text');
    if (statusEl) {
      statusEl.innerHTML = `<strong>SET DIRECTOR DJ MIX INITIATED //</strong> ${resp.narrative || `Morphing stem-by-stem into ${incoming.archetypeName}`}`;
    }
    addLog('AI', `[SET DIRECTOR] Initiated 16-bar stem-by-stem DJ transition -> ${incoming.archetypeName} (${incoming.bpm} BPM).`);
  } catch (err) {
    addLog('ERR', `Set Director fallback transition: ${err.message}`);
  }
}

function completeSeamlessTrackArrival() {
  const inc = state.setDirector.incomingArrangement;
  state.setDirector.transitionActive = false;
  state.setDirector.transitionBar = 0;
  state.setDirector.barInTrack = 0;
  state.setDirector.trackNumber++;
  state.setDirector.incomingArrangement = null;
  if (!inc) return;

  applyArrangementToState(inc);

  // Strictly re-apply all user persistent preferences across track boundaries!
  const prefs = state.setDirector.persistentUserSteering;
  if (prefs.noiseMuted) {
    dsp.params.noiseBedLevel = 0.0;
    dsp.params.vinylCrackleDensity = 0.0;
    const portCh = { 1: 9, 2: 2, 3: 3, 4: 4 };
    [1, 2, 3, 4].forEach((portId) => queueMidiEvent(portId, [0xB0 | portCh[portId], 16, 0]));
  }
  if (prefs.darker) {
    dsp.params.baseStabCutoffHz = Math.max(240, (dsp.params.baseStabCutoffHz || 460) * 0.72);
  } else if (prefs.brighter) {
    dsp.params.baseStabCutoffHz = Math.min(1650, (dsp.params.baseStabCutoffHz || 520) * 1.38);
  }
  dsp._syncLiveNodes();

  const statusEl = document.getElementById('gemini-ear-status-text');
  if (statusEl) {
    statusEl.innerHTML = `<strong>TRACK #${state.setDirector.trackNumber} ARRIVED SEAMLESSLY //</strong> Now playing <em>${inc.archetypeName}</em> (${inc.bpm} BPM · ${inc.rootNote}) — Persistent user sound profile locked.`;
  }
  addLog('AI', `[SET DIRECTOR] Arrived seamlessly at Track #${state.setDirector.trackNumber}: ${inc.archetypeName}`);
}

async function generateFromPrompt(promptText, cartridge = null) {
  const activePrompt = promptText || state.prompt;
  state.prompt = activePrompt;
  const lower = activePrompt.toLowerCase();

  // 1. Immediately apply any explicit natural-language sound / mixer / tempo steering commands!
  const steerResult = dsp.applyNaturalLanguageSteering(activePrompt);
  // Persist user sound preferences into Set Director memory so future tracks never undo user steering!
  if (/(remove|no|mute|kill|stop|zero|without|off)\s+(the\s+)?(white\s*noise|noise|hiss|vinyl|crackle)/i.test(lower)) {
    state.setDirector.persistentUserSteering.noiseMuted = true;
  } else if (/(more|add|heavy|boost)\s+(white\s*noise|noise|hiss|vinyl|crackle)/i.test(lower)) {
    state.setDirector.persistentUserSteering.noiseMuted = false;
  }
  if (/(darker|muffled|underwater|submerged|warmer)/i.test(lower)) {
    state.setDirector.persistentUserSteering.darker = true;
    state.setDirector.persistentUserSteering.brighter = false;
  } else if (/(brighter|open\s+filter|acid|sharper)/i.test(lower)) {
    state.setDirector.persistentUserSteering.brighter = true;
    state.setDirector.persistentUserSteering.darker = false;
  }
  if (/(remove|no|mute|kill|drop|without)\s+(the\s+)?(drums|kick|beat|percussion)/i.test(lower)) {
    state.activeVoices.drums = false;
    steerResult.applied.push('Muted Drums / Kick');
  } else if (/(add|bring\s+back|enable|with|more)\s+(the\s+)?(drums|kick|beat)/i.test(lower)) {
    state.activeVoices.drums = true;
    steerResult.applied.push('Enabled Drums / Kick');
  }
  if (/(remove|no|mute|drop|without)\s+(the\s+)?(bass|sub|moog)/i.test(lower)) {
    state.activeVoices.moog = false;
    steerResult.applied.push('Muted Sub-Bass');
  } else if (/(add|bring\s+back|enable|more)\s+(the\s+)?(bass|sub|moog)/i.test(lower)) {
    state.activeVoices.moog = true;
    steerResult.applied.push('Enabled Sub-Bass');
  }
  const explicitBpmMatch = lower.match(/\b(\d{2,3})\s*bpm\b/);
  if (explicitBpmMatch) {
    state.bpm = Math.max(70, Math.min(180, parseInt(explicitBpmMatch[1], 10)));
    steerResult.applied.push(`Set BPM to ${state.bpm}`);
  } else if (lower.includes('faster')) {
    state.bpm = Math.min(165, state.bpm + 6);
    steerResult.applied.push(`Increased BPM to ${state.bpm}`);
  } else if (lower.includes('slower')) {
    state.bpm = Math.max(85, state.bpm - 6);
    steerResult.applied.push(`Slowed BPM to ${state.bpm}`);
  }

  // Immediately push any steered MIDI CCs (e.g. CC16=0 Noise Off, CC74 Cutoff, CC13 Delay FB) to each unit's MIDI channel!
  const portChMap = { 1: 9, 2: 2, 3: 3, 4: 4 };
  for (const [ccNumStr, ccVal] of Object.entries(steerResult.ccs || {})) {
    const ccNum = parseInt(ccNumStr, 10);
    [1, 2, 3, 4].forEach((portId) => queueMidiEvent(portId, [0xB0 | portChMap[portId], ccNum, ccVal]));
  }

  // If user typed a pure live mix/sound command (e.g. "remove the white noise") without picking a new genre cartridge,
  // apply it instantaneously in-place without resetting the active musical groove!
  const hasExplicitGenreWord = /(basic channel|deepchord|echospace|rhythm & sound|maurizio|fluxion|yagya|porter ricks|traumprinz|prince of denmark)/i.test(lower);
  if (!cartridge && steerResult.applied.length > 0 && !hasExplicitGenreWord) {
    renderUnitStagingBadges();
    const statusEl = document.getElementById('gemini-ear-status-text');
    if (statusEl) {
      statusEl.innerHTML = `<strong>STEERING APPLIED LIVE //</strong> ${steerResult.applied.join(' · ')}`;
    }
    addLog('AI', `Applied live steering: ${steerResult.applied.join(' | ')}`);
    return;
  }

  const composed = ai.composeFullArrangement({
    archetypeId: cartridge ? cartridge.id : undefined,
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
  // Re-apply natural-language overrides (e.g. if user wrote "DeepChord but remove the white noise")!
  dsp.applyNaturalLanguageSteering(activePrompt);
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
            const chMap = { drums: 9, moog: 2, lead: 3, pads: 4 };
            const portMap = { drums: 1, moog: 2, lead: 3, pads: 4 };
            for (const [uKey, prog] of Object.entries(data.llm.programs)) {
              if (uKey in state.units && isUnitAudible(uKey)) {
                const resolvedProg = resolveUnitProgram(uKey, prog);
                if (state.programs[uKey] !== resolvedProg) {
                  state.programs[uKey] = resolvedProg;
                  queueMidiEvent(portMap[uKey] || 0, [0xC0 | (chMap[uKey] || 0), resolvedProg & 0x7F]);
                }
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
  const chMap = { drums: 10, moog: 3, lead: 4, pads: 5 };
  for (const uKey of ['drums', 'moog', 'lead', 'pads']) {
    const u = state.units[uKey];
    const isActive = u.pinned || (state.activeVoices?.[uKey] !== false);
    const card = document.getElementById(`unit-card-${uKey}`);
    const badge = document.getElementById(`stage-badge-${uKey}`);
    if (card) {
      card.classList.toggle('ai-resting', !isActive && !u.solo);
    }
    if (badge) {
      badge.classList.toggle('resting', !isActive && !u.solo);
      badge.title = u.pinned ? 'PINNED ON' : (isActive ? 'ACTIVE' : 'AI RESTING');
      badge.textContent = '';
    }
    if (!isActive && !u.solo) {
      state.units[uKey].lastReadout = `CH${chMap[uKey]} • RESTING`;
      const rEl = document.getElementById(`readout-${uKey}`);
      if (rEl) rEl.textContent = state.units[uKey].lastReadout;
    }
  }
}

function applyArrangementToState(arr) {
  state.archetypeId = arr.archetypeId || state.archetypeId || 'basic_channel';
  state.bpm = arr.bpm || state.bpm;
  state.swing = arr.swing || state.swing;
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
  state.chordStabSteps = arr.chordStabSteps || [];
  state.targetMacros = arr.macros;

  dsp.applyArchetypePreset(state.archetypeId);
  dsp.updateMasterFX(state.fx, state.bpm);
  // Send MIDI Program Change (0xC0 | ch) when patch program changes
  if (arr.programs) {
    const chMap = { drums: 9, moog: 2, lead: 3, pads: 4 };
    const portMap = { drums: 1, moog: 2, lead: 3, pads: 4 };
    for (const [uKey, prog] of Object.entries(arr.programs)) {
      if (uKey in state.units && isUnitAudible(uKey)) {
        const resolvedProg = resolveUnitProgram(uKey, prog);
        if (state.programs[uKey] !== resolvedProg) {
          state.programs[uKey] = resolvedProg;
          queueMidiEvent(portMap[uKey] || 0, [0xC0 | (chMap[uKey] || 0), resolvedProg & 0x7F]);
        }
      }
    }
  }

  const bpmInput = document.getElementById('input-bpm');
  if (bpmInput) bpmInput.value = state.bpm;
  const hdrBpm = document.getElementById('header-bpm-readout');
  if (hdrBpm) hdrBpm.textContent = `${state.bpm} BPM`;
  const segBpm = document.getElementById('seg-display-drums');
  if (segBpm) segBpm.textContent = String(state.bpm).padStart(3, '0');
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
function createKnobSVG(normVal, style = 'bakelite') {
  const radius = 17.5;
  const circumference = 2 * Math.PI * radius;
  const arcSpan = circumference * 0.75; // 270 degree sweep
  const dashOffset = arcSpan * (1 - Math.max(0, Math.min(1, normVal)));
  const angleDeg = -135 + normVal * 270;

  if (style === 'moog-concentric') {
    return `
      <svg class="knob-svg" viewBox="0 0 52 52">
        <circle class="knob-ticks" cx="26" cy="26" r="22.5"
          stroke-dasharray="${arcSpan * 1.25} ${circumference * 1.25}"
          transform="rotate(135 26 26)" />
        <circle class="knob-silver-skirt" cx="26" cy="26" r="18.0" />
        <circle class="knob-body-silver" cx="26" cy="26" r="12.0" />
        <line class="knob-pointer-dark" x1="26" y1="24" x2="26" y2="12.0"
          transform="rotate(${angleDeg} 26 26)" />
      </svg>
    `;
  }

  const bodyClass = style === 'vermilion' ? 'knob-body-red' : 'knob-body';
  return `
    <svg class="knob-svg" viewBox="0 0 46 46">
      <circle class="knob-track" cx="23" cy="23" r="${radius}"
        stroke-dasharray="${arcSpan} ${circumference}"
        transform="rotate(135 23 23)" />
      <circle class="knob-arc" cx="23" cy="23" r="${radius}"
        stroke-dasharray="${arcSpan} ${circumference}"
        stroke-dashoffset="${dashOffset}"
        transform="rotate(135 23 23)" />
      <circle class="${bodyClass}" cx="23" cy="23" r="12.5" />
      <line class="knob-pointer" x1="23" y1="21.5" x2="23" y2="11.5"
        transform="rotate(${angleDeg} 23 23)" />
    </svg>
  `;
}

function renderKnobCell(unitKey, paramKey, label, style = 'bakelite', sizeClass = '') {
  const val = state.units[unitKey]?.params?.[paramKey] ?? 0.5;
  const ccNum = getActiveCCForParam(unitKey, paramKey);
  return `
    <div class="knob-cell ${sizeClass}" data-unit="${unitKey}" data-param="${paramKey}" data-knob-style="${style}" title="${label} (MIDI CC ${ccNum})">
      <div class="knob-svg-holder">${createKnobSVG(val, style)}</div>
      <span class="knob-label">${label}</span>
    </div>
  `;
}

function renderAllKnobs() {
  // 1. SYNTH 1 (DRUMS): Top Velocity Pods + Right 2x2 Cluster with Bright Red Master Knob
  const drumsPods = document.getElementById('drums-top-pods');
  if (drumsPods) {
    drumsPods.innerHTML =
      renderKnobCell('drums', 'punch', 'PITCH / TUNE', 'bakelite', 'knob-small') +
      renderKnobCell('drums', 'snappy', 'SNAP / DECAY', 'bakelite', 'knob-small');
  }
  const drumsRight = document.getElementById('knobs-drums');
  if (drumsRight) {
    drumsRight.innerHTML =
      renderKnobCell('drums', 'hatDecay', 'VINYL COMP & FILTER', 'bakelite') +
      renderKnobCell('drums', 'level', 'MASTER LEVEL', 'vermilion') +
      renderKnobCell('drums', 'decay', 'SUB BOOM DECAY', 'bakelite') +
      renderKnobCell('drums', 'drive', 'BUS SATURATION', 'bakelite');
  }

  // 2. SYNTH 2 (MOOG SUB 37 TRIBUTE): 4-Column Custom Fascia with Concentric Silver Dials & Chrome Switches
  const moogEl = document.getElementById('knobs-moog');
  if (moogEl) {
    moogEl.innerHTML = `
      <div class="moog-sub-col">
        ${renderKnobCell('moog', 'cutoff', '24dB LADDER CUTOFF', 'moog-concentric', 'knob-large')}
        ${renderKnobCell('moog', 'resonance', 'RESONANCE', 'bakelite', 'knob-small')}
      </div>
      <div class="rams-hairline-divider"></div>
      <div class="moog-sub-col">
        <span class="moog-col-header">MODULATION</span>
        <div class="moog-pair-row">
          ${renderKnobCell('moog', 'sub', 'MULTIDRIVE', 'bakelite', 'knob-small')}
          ${renderKnobCell('moog', 'contour', 'EG CONTOUR', 'bakelite', 'knob-small')}
        </div>
        <div class="moog-pair-row">
          ${renderKnobCell('moog', 'detune', 'GLIDE RATE', 'bakelite', 'knob-small')}
          <div class="rams-toggle-unit">
            <button id="btn-moog-wave" type="button" class="rams-chrome-toggle on" title="Toggle Saw/Square">
              <span class="hex-nut"><span class="chrome-bat"></span></span>
            </button>
            <span class="toggle-caption">WAVE</span>
          </div>
          <div class="rams-toggle-unit">
            <button type="button" class="rams-chrome-toggle" data-unit-mute="moog" title="Mute Moog">
              <span class="hex-nut"><span class="chrome-bat"></span></span>
            </button>
            <span class="toggle-caption">MUTE</span>
          </div>
        </div>
      </div>
      <div class="rams-hairline-divider"></div>
      <div class="moog-sub-col">
        ${renderKnobCell('moog', 'cutoff', 'OSC 1 / 2 OCTAVE', 'moog-concentric', 'knob-large')}
        ${renderKnobCell('moog', 'level', 'SUB OSC LEVEL', 'bakelite', 'knob-small')}
      </div>
      <div class="rams-hairline-divider"></div>
      <div class="moog-sub-col">
        <span class="moog-col-header">OSCILLATORS</span>
        <div class="moog-2x2-grid">
          ${renderKnobCell('moog', 'contour', 'FILTER ATK', 'bakelite', 'knob-small')}
          ${renderKnobCell('moog', 'detune', 'FILTER DEC', 'bakelite', 'knob-small')}
          ${renderKnobCell('moog', 'sub', 'AMP ATK', 'bakelite', 'knob-small')}
          ${renderKnobCell('moog', 'level', 'MASTER VOL', 'bakelite', 'knob-small')}
        </div>
      </div>
    `;
  }

  // 3. SYNTH 3 (PROPHET-6 / VOLCA LEAD): FM Ratio Knob + Right 2x2 Brassy Lead / Envelope Cluster
  const leadFmSlot = document.getElementById('lead-fm-ratio-slot');
  if (leadFmSlot) {
    leadFmSlot.innerHTML = renderKnobCell('lead', 'lfoMod', 'FM RATIO', 'bakelite', 'knob-small');
  }
  const leadRight = document.getElementById('knobs-lead');
  if (leadRight) {
    leadRight.innerHTML =
      renderKnobCell('lead', 'cutoff', 'LPF CUTOFF', 'bakelite') +
      renderKnobCell('lead', 'delaySend', 'DELAY SEND', 'bakelite') +
      renderKnobCell('lead', 'resonance', 'LPF RESONANCE', 'bakelite') +
      renderKnobCell('lead', 'reverbSend', 'REVERB SEND', 'bakelite');
  }

  // 4. SYNTH 4 (MINILOGUE / KRONOS PADS): 2x2 VCF Cutoff / Resonance / BBD Chorus / Shimmer Reverb
  const padsRight = document.getElementById('knobs-pads');
  if (padsRight) {
    padsRight.innerHTML =
      renderKnobCell('pads', 'cutoff', 'VCF CUTOFF', 'bakelite') +
      renderKnobCell('pads', 'attack', 'SHIMMER MIX', 'bakelite') +
      renderKnobCell('pads', 'chorus', 'BBD CHORUS', 'bakelite') +
      renderKnobCell('pads', 'reverbSend', 'HALL REVERB', 'bakelite');
  }

  // 5. SEQUENCER SIDE KNOBS (Track Level, Swing, Gate)
  const seqLeft = document.getElementById('seq-left-knob');
  if (seqLeft) seqLeft.innerHTML = renderKnobCell('drums', 'level', 'LEVEL', 'bakelite', 'knob-small');
  const seqSwing = document.getElementById('seq-swing-knob');
  if (seqSwing) seqSwing.innerHTML = renderKnobCell('drums', 'decay', 'SWING', 'bakelite', 'knob-small');
  const seqGate = document.getElementById('seq-gate-knob');
  if (seqGate) seqGate.innerHTML = renderKnobCell('moog', 'detune', 'GATE', 'bakelite', 'knob-small');
  // 6. Below-the-Fold Master FX Knobs
  const fxContainer = document.getElementById('knobs-fx');
  if (fxContainer) {
    fxContainer.innerHTML = FX_KNOB_DEFS.map((d) => {
      const val = state.fx[d.key] ?? 0.5;
      return `
        <div class="knob-cell" data-fx="${d.key}">
          <div class="knob-svg-holder">${createKnobSVG(val, 'bakelite')}</div>
          <span class="knob-label">${d.label}</span>
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
    const style = cell.getAttribute('data-knob-style') || 'bakelite';
    const val = state.units[unitKey]?.params?.[paramKey];
    if (typeof val !== 'number') return;
    const holder = cell.querySelector('.knob-svg-holder');
    if (holder) holder.innerHTML = createKnobSVG(val, style);
  });

  document.querySelectorAll('.knob-cell[data-fx]').forEach((cell) => {
    const fxKey = cell.getAttribute('data-fx');
    const val = state.fx[fxKey];
    if (typeof val !== 'number') return;
    const holder = cell.querySelector('.knob-svg-holder');
    if (holder) holder.innerHTML = createKnobSVG(val, 'bakelite');
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
          const chMap = { drums: 10, moog: 3, lead: 4, pads: 5 };
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
    { key: 'kick',  label: 'PAD 1 // KICK',  badge: '36' },
    { key: 'snare', label: 'PAD 2 // SNARE', badge: '38' },
    { key: 'clap',  label: 'PAD 3 // CLAP',  badge: '39' },
    { key: 'ch',    label: 'PAD 4 // CH HAT',badge: '42' },
    { key: 'oh',    label: 'PAD 5 // OH HAT',badge: '46' },
    { key: 'perc',  label: 'PAD 6 // CHOP',  badge: '37' },
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
          ${i + 1}
        </button>`;
      }).join('')}
    </div>`;
  }

  html += `<div class="acid-programmer-box">
    <div class="seq-row">
      <div class="seq-row-label">
        <span style="color:var(--accent-green)">MOOG SUB 37</span>
        <span class="seq-row-badge">CH2–3</span>
      </div>
      ${Array.from({ length: 16 }, (_, i) => {
        const st = state.bass[i] || { active: false, note: 36 };
        return `<button type="button" class="step-pad ${st.active ? 'active-moog' : ''}"
          data-lane-type="moog" data-step="${i}" title="Click to toggle step, Right-click to re-pitch in scale">
          ${st.active ? midiToNoteName(st.note) : '·'}
        </button>`;
      }).join('')}
    </div>
    <div class="seq-row" style="margin-bottom:3px;">
      <div class="seq-row-label">
        <span style="font-size:9.5px;color:#fca5a5;">SUB37 ACCENT</span>
        <span class="seq-row-badge">V124</span>
      </div>
      ${Array.from({ length: 16 }, (_, i) => {
        const st = state.bass[i] || {};
        return `<button type="button" class="sub-step-toggle ${st.accent ? 'acc-on' : ''}"
          data-lane-type="moog-acc" data-step="${i}">ACC</button>`;
      }).join('')}
    </div>
    <div class="seq-row" style="margin-bottom:0;">
      <div class="seq-row-label">
        <span style="font-size:9.5px;color:#67e8f9;">SUB37 GLIDE</span>
        <span class="seq-row-badge">SLIDE</span>
      </div>
      ${Array.from({ length: 16 }, (_, i) => {
        const st = state.bass[i] || {};
        return `<button type="button" class="sub-step-toggle ${st.slide ? 'sld-on' : ''}"
          data-lane-type="moog-sld" data-step="${i}">GLD</button>`;
      }).join('')}
    </div>
  </div>`;

  html += `<div class="seq-row" style="margin-top:8px;">
    <div class="seq-row-label">
      <span style="color:var(--accent-cyan)">PROPHET / VOLCA</span>
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
  renderBottom16StepRail();

  matrixEl.querySelectorAll('[data-lane-type]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const type = btn.getAttribute('data-lane-type');
      const s = parseInt(btn.getAttribute('data-step'), 10);
      if (type === 'drum') {
        const dKey = btn.getAttribute('data-drum');
        state.drums[dKey][s].active = !state.drums[dKey][s].active;
      } else if (type === 'moog') {
        state.bass[s].active = !state.bass[s].active;
      } else if (type === 'moog-acc') {
        state.bass[s].accent = !state.bass[s].accent;
        state.bass[s].vel = state.bass[s].accent ? 124 : 100;
      } else if (type === 'moog-sld') {
        state.bass[s].slide = !state.bass[s].slide;
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
      if (type === 'moog') {
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
      ${c.shortName || c.name}
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

function renderBottom16StepRail() {
  const railEl = document.getElementById('sequencer-rail-16');
  if (!railEl) return;
  const quads = [0, 1, 2, 3];
  railEl.innerHTML = quads.map((q) => {
    const stepsHtml = [0, 1, 2, 3].map((offset) => {
      const i = q * 4 + offset;
      const drumOn = state.drums.kick?.[i]?.active || state.drums.snare?.[i]?.active || state.drums.ch?.[i]?.active;
      const moogOn = state.bass?.[i]?.active;
      const isLit = Boolean(drumOn || moogOn);
      return `
        <div class="rail-step-col" data-rail-col="${i}">
          <div class="rail-leds-stack">
            <span class="rail-led-top" data-rail-top-led="${i}"></span>
            <span class="rail-led-bot ${isLit ? 'lit' : ''}" data-rail-bot-led="${i}"></span>
          </div>
          <button type="button" class="rail-step-key" data-rail-step="${i}" data-step="${i}">${i + 1}</button>
        </div>
      `;
    }).join('');
    return `
      <div class="seq-quad-group">
        <div class="bracket-group"><span>4-STEP</span></div>
        <div class="seq-quad-steps">${stepsHtml}</div>
      </div>
    `;
  }).join('');

  railEl.querySelectorAll('[data-rail-step]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const s = parseInt(btn.getAttribute('data-rail-step'), 10);
      const next = !state.drums.kick[s].active;
      state.drums.kick[s].active = next;
      state.bass[s].active = next;
      renderSequencerGrid();
    });
  });
}

function clearPlayheadHighlight() {
  document.querySelectorAll('.current-step').forEach((el) => el.classList.remove('current-step'));
  document.querySelectorAll('.step-num.playhead').forEach((el) => el.classList.remove('playhead'));
  document.querySelectorAll('.rail-led-top.playhead-led').forEach((el) => el.classList.remove('playhead-led'));
}

// ============================================================================
// REAL-TIME OSCILLOSCOPE & UI ANIMATION LOOP
// ============================================================================

function renderMiniKeyboard() {
  const kbEl = document.getElementById('lead-mini-keyboard');
  if (!kbEl) return;
  // True 25-Key (2-Octave C3-to-C5: 15 White Keys + 10 Black Keys)
  const whiteOffsets = [0, 2, 4, 5, 7, 9, 11, 12, 14, 16, 17, 19, 21, 23, 24];
  // Exact 1/15th white-key boundaries (6.6667% per white key, centered with 3.8% black key width)
  const blackSpecs = [
    { semi: 1, leftPct: 4.7 },
    { semi: 3, leftPct: 11.4 },
    { semi: 6, leftPct: 24.7 },
    { semi: 8, leftPct: 31.4 },
    { semi: 10, leftPct: 38.1 },
    { semi: 13, leftPct: 51.4 },
    { semi: 15, leftPct: 58.1 },
    { semi: 18, leftPct: 71.4 },
    { semi: 20, leftPct: 78.1 },
    { semi: 22, leftPct: 84.7 },
  ];
  let html = whiteOffsets.map((semi) => `<div class="piano-key-white" data-kb-note="${60 + semi}"></div>`).join('');
  html += blackSpecs.map((b) => `<div class="piano-key-black" style="left:${b.leftPct}%" data-kb-note="${60 + b.semi}"></div>`).join('');
  kbEl.innerHTML = html;

  kbEl.querySelectorAll('[data-kb-note]').forEach((kEl) => {
    kEl.addEventListener('mousedown', (e) => {
      e.stopPropagation();
      const note = parseInt(kEl.getAttribute('data-kb-note'), 10);
      dsp.init();
      if (!state.units.lead.extOnly) {
        dsp.triggerProphetLead(note, dsp.ctx.currentTime, 0.28, 0.88, state.units.lead.params);
      }
      queueMidiEvent(3, [0x93, note, 100], 260, [0x83, note, 0]);
      kEl.classList.add('key-active');
      setTimeout(() => kEl.classList.remove('key-active'), 240);
    });
  });
}

function bindConcept02Modules() {
  // 1. 12 Sampler Pads on Synth 1
  document.querySelectorAll('.sampler-pad').forEach((pad) => {
    pad.addEventListener('mousedown', () => {
      const note = parseInt(pad.getAttribute('data-pad-note') || '36', 10);
      const voice = pad.getAttribute('data-pad-voice') || 'kick';
      dsp.init();
      if (!state.units.drums.extOnly) {
        dsp.triggerDrum(voice, dsp.ctx.currentTime, 0.92, state.units.drums.params);
      }
      queueMidiEvent(1, [0x99, note, 112], 140, [0x89, note, 0]);
      pad.classList.add('pad-lit');
      setTimeout(() => {
        if (pad.textContent.trim() !== '1') pad.classList.remove('pad-lit');
      }, 150);
    });
  });

  // 2. 5 Vertical ADSR Faders on Synth 4
  document.querySelectorAll('.v-fader-slot').forEach((slot) => {
    slot.addEventListener('mousedown', (e) => {
      e.preventDefault();
      const paramKey = slot.getAttribute('data-fader-param') || 'cutoff';
      const track = slot.querySelector('.v-fader-track');
      const cap = slot.querySelector('.v-fader-cap');
      if (!track || !cap) return;
      const updateFromY = (clientY) => {
        const rect = track.getBoundingClientRect();
        const norm = Math.max(0.05, Math.min(0.95, 1 - (clientY - rect.top) / rect.height));
        cap.style.bottom = `${Math.round(norm * 100)}%`;
        state.units.pads.params[paramKey] = norm;
        sendUnitParamCC('pads', paramKey, norm);
        updateKnobVisualsOnly();
      };
      updateFromY(e.clientY);
      const onMove = (me) => updateFromY(me.clientY);
      const onUp = () => {
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
      };
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    });
  });

  // 3. Genre Dropdown in Hero Pedestal
  const genreDrop = document.getElementById('select-genre-dropdown');
  genreDrop?.addEventListener('change', (e) => {
    const id = e.target.value;
    const cart = GENRE_CARTRIDGES.find((x) => x.id === id);
    if (!cart) return;
    state.activeCartridgeId = cart.id;
    const promptInput = document.getElementById('input-ai-prompt');
    if (promptInput) promptInput.value = cart.prompt;
    renderCartridges();
    generateFromPrompt(cart.prompt, cart);
  });

  // 4. Explicit Stop Button in Top Strip
  document.getElementById('btn-stop-explicit')?.addEventListener('click', () => {
    stopSequencer();
  });

  // 5. Studio Mode Switcher: USB Hardware Only vs. USB + Mac DSP vs. Arturia Digital
  document.getElementById('btn-mode-hardware')?.addEventListener('click', () => {
    setStudioMode('hardware');
  });
  document.getElementById('btn-mode-mac-dsp')?.addEventListener('click', () => {
    setStudioMode('mac_dsp');
  });
  document.getElementById('btn-mode-arturia')?.addEventListener('click', () => {
    setStudioMode('arturia');
  });

  // 6. Launch All Arturia Synths Master Buttons
  document.getElementById('btn-launch-arturia-all')?.addEventListener('click', launchAllArturia);
  document.getElementById('btn-modal-launch-all')?.addEventListener('click', () => {
    launchAllArturia();
    closeGuideModal();
  });

  // 7. Setup Guide Modal Open/Close
  document.getElementById('btn-open-guide-modal')?.addEventListener('click', openGuideModal);
  document.getElementById('btn-close-modal')?.addEventListener('click', closeGuideModal);
  document.getElementById('btn-modal-got-it')?.addEventListener('click', closeGuideModal);

  // 8. Individual Per-Module Launch App Buttons
  // 8. Individual Per-Module Launch App Buttons (reads neighboring [data-synth-select] if present)
  document.querySelectorAll('[data-launch-app]').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const selEl = btn.parentElement?.querySelector('[data-synth-select]');
      const appId = selEl ? selEl.value : btn.getAttribute('data-launch-app');
      addLog('MIDI', `Pre-configuring CoreMIDI port & launching ${appId}...`);
      try {
        const res = await fetch('/api/launch-app', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: appId }),
        });
        const data = await res.json();
        if (data.ok) {
          addLog('MIDI', `Opened ${data.launched} auto-bound to "${data.midiPort || 'AETHER Virtual Port'}"!`);
        } else {
          addLog('MIDI', `Could not open ${appId}: ${data.error}`);
        }
      } catch (err) {
        addLog('MIDI', `Error: ${err.message}`);
      }
    });
  });
}

function syncMacAudioUiState() {
  const allExtOnly = Object.values(state.units).every((u) => u.extOnly);
  dsp.setLocalMonitorMuted(allExtOnly);
  const muteBtn = document.getElementById('btn-mute-mac-dsp');
  if (muteBtn) {
    muteBtn.textContent = allExtOnly ? 'MAC AUDIO: MUTED (USB ONLY)' : 'MAC AUDIO: ON';
  }
  for (const uKey of ['drums', 'moog', 'lead', 'pads']) {
    const btn = document.querySelector(`[data-unit-ext="${uKey}"]`);
    if (btn) {
      btn.classList.toggle('ext-active', state.units[uKey].extOnly);
      btn.textContent = state.units[uKey].extOnly ? 'MIDI ONLY' : 'DSP+MIDI';
    }
  }
}

function setStudioMode(mode) {
  state.studioMode = mode;
  const isArturia = mode === 'arturia';
  const isHardwareOnly = mode === 'hardware';
  const isMacDsp = mode === 'mac_dsp';

  document.getElementById('btn-mode-hardware')?.classList.toggle('active', isHardwareOnly);
  document.getElementById('btn-mode-mac-dsp')?.classList.toggle('active', isMacDsp);
  document.getElementById('btn-mode-arturia')?.classList.toggle('active', isArturia);

  const btnLaunchAll = document.getElementById('btn-launch-arturia-all');
  if (btnLaunchAll) btnLaunchAll.style.display = isArturia ? 'inline-flex' : 'none';
  const btnGuide = document.getElementById('btn-open-guide-modal');
  if (btnGuide) btnGuide.style.display = isArturia ? 'inline-flex' : 'none';

  if (isArturia) {
    state.units.drums.profile = 'arturia_emulator_cmi';
    state.units.moog.profile = 'arturia_mini_v4';
    state.units.lead.profile = 'arturia_dx7_prophet';
    state.units.pads.profile = 'arturia_juno_cs80';

    state.units.moog.extOnly = false;
    state.units.lead.extOnly = false;
    state.units.pads.extOnly = false;
    state.units.drums.extOnly = false;

    document.querySelectorAll('.arturia-slot-controls').forEach((el) => (el.style.display = 'inline-flex'));
    document.querySelectorAll('.hw-slot-subtitle').forEach((el) => (el.style.display = 'none'));

    addLog(
      'MIDI',
      '🎹 ARTURIA DIGITAL MODE: Routing to Arturia V Collection virtual ports + internal 48kHz Drums.'
    );
  } else {
    state.units.drums.profile = 'sp404';
    state.units.moog.profile = 'moog_sub37';
    state.units.lead.profile = 'prophet_6';
    state.units.pads.profile = 'korg_minilogue';

    const extOnly = isHardwareOnly;
    state.units.drums.extOnly = extOnly;
    state.units.moog.extOnly = extOnly;
    state.units.lead.extOnly = extOnly;
    state.units.pads.extOnly = extOnly;

    // Ensure GM/Hardware synth programs are active (not 0 = Grand Piano)
    state.programs.drums = resolveUnitProgram('drums', state.programs.drums);
    state.programs.moog = resolveUnitProgram('moog', state.programs.moog);
    state.programs.lead = resolveUnitProgram('lead', state.programs.lead);
    state.programs.pads = resolveUnitProgram('pads', state.programs.pads);

    document.querySelectorAll('.arturia-slot-controls').forEach((el) => (el.style.display = 'none'));
    document.querySelectorAll('.hw-slot-subtitle').forEach((el) => (el.style.display = 'inline'));

    addLog(
      'MIDI',
      isHardwareOnly
        ? '🔌 USB HARDWARE MIDI MODE: Mac soft-synths & noise floor muted — streaming strictly over USB to connected Pis/hardware.'
        : '🔊 USB + MAC DSP MODE: Streaming MIDI over USB while also monitoring internal Mac WebAudio DSP.'
    );
  }

  renderAllKnobs();
  syncMacAudioUiState();
}

async function launchAllArturia() {
  addLog('MIDI', 'Pre-writing standalone.pref & launching Arturia V Collection 11 Synths (Mini V4, DX7 V, Jun-6 V)...');
  try {
    const res = await fetch('/api/launch-arturia-all', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
    const data = await res.json();
    if (data.ok) {
      addLog('MIDI', `Launched & Auto-Bound: ${data.launched.join(' | ')}`);
    } else {
      addLog('MIDI', `Launch status: ${data.errors?.join(', ') || 'No standalone synths found.'}`);
    }
  } catch (err) {
    addLog('MIDI', `Error launching Arturia: ${err.message}`);
  }
}

function openGuideModal() {
  const modal = document.getElementById('arturia-guide-modal');
  if (modal && typeof modal.showModal === 'function') {
    modal.showModal();
  }
}

function closeGuideModal() {
  const modal = document.getElementById('arturia-guide-modal');
  if (modal && typeof modal.close === 'function') {
    modal.close();
  }
}

function startVisualLoop() {
  const canvas = document.getElementById('master-scope');
  const ctx2d = canvas ? canvas.getContext('2d') : null;
  const miniCanvas = document.getElementById('minilogue-oled-scope');
  const miniCtx = miniCanvas ? miniCanvas.getContext('2d') : null;
  const timeData = new Uint8Array(512);
  let phaseTick = 0;

  function frame() {
    phaseTick += 0.045;
    if (dsp.ctx && uiStepQueue.length > 0) {
      const now = dsp.ctx.currentTime;
      while (uiStepQueue.length > 0 && uiStepQueue[0].time <= now + 0.015) {
        const ev = uiStepQueue.shift();
        clearPlayheadHighlight();
        const rulerEl = document.querySelector(`[data-ruler-step="${ev.step}"]`);
        if (rulerEl) rulerEl.classList.add('playhead');
        document.querySelectorAll(`[data-step="${ev.step}"]`).forEach((el) => {
          el.classList.add('current-step');
        });
        const topLed = document.querySelector(`[data-rail-top-led="${ev.step}"]`);
        if (topLed) topLed.classList.add('playhead-led');
        const stepReadout = document.getElementById('readout-bar-step');
        if (stepReadout) {
          stepReadout.textContent = `${String(ev.bar).padStart(2, '0')}.${String(ev.step + 1).padStart(2, '0')}`;
        }
        if (ev.step === 0) {
          renderChordProgression();
        }
        for (const uKey of ['drums', 'moog', 'lead', 'pads']) {
          const rEl = document.getElementById(`readout-${uKey}`);
          if (rEl) rEl.textContent = state.units[uKey].lastReadout;
        }
        updateKnobVisualsOnly();
      }
    }

    // Draw Minilogue Green OLED Oscilloscope on Module 4
    if (miniCtx && miniCanvas) {
      const mw = miniCanvas.width;
      const mh = miniCanvas.height;
      miniCtx.fillStyle = '#0c100d';
      miniCtx.fillRect(0, 0, mw, mh);
      miniCtx.strokeStyle = '#22c55e';
      miniCtx.lineWidth = 1.8;
      miniCtx.beginPath();
      const cut = state.units.pads.params.cutoff ?? 0.56;
      const cho = state.units.pads.params.chorus ?? 0.68;
      for (let x = 0; x < mw; x++) {
        const t = (x / mw) * Math.PI * 4 + phaseTick;
        const y = mh / 2 + (Math.sin(t) * 0.55 + Math.sin(t * 2.02 + cho * 3) * 0.3 * cut) * (mh * 0.36);
        if (x === 0) miniCtx.moveTo(x, y);
        else miniCtx.lineTo(x, y);
      }
      miniCtx.stroke();
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
    const el = document.activeElement;
    const tag = el?.tagName;
    const isTypingField = (
      tag === 'INPUT' ||
      tag === 'TEXTAREA' ||
      tag === 'SELECT' ||
      el?.isContentEditable
    );
    if (e.code === 'Space' && !isTypingField) {
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
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
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
      syncMacAudioUiState();
      addLog('MIDI', `Unit [${u.toUpperCase()}] switched to ${state.units[u].extOnly ? 'External USB MIDI Only (Mac DSP Muted)' : 'Internal Mac DSP + External USB MIDI Out'}.`);
    });
  });
  document.getElementById('btn-mute-mac-dsp')?.addEventListener('click', () => {
    const allMuted = Object.values(state.units).every((u) => u.extOnly);
    const nextExt = !allMuted;
    setStudioMode(nextExt ? 'hardware' : 'mac_dsp');
  });

  document.getElementById('btn-moog-wave')?.addEventListener('click', (e) => {
    const next = state.units.moog.waveform === 'sawtooth' ? 'square' : 'sawtooth';
    state.units.moog.waveform = next;
    e.currentTarget.textContent = next === 'sawtooth' ? 'SAW' : 'SQR';
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

// ============================================================================
// GEMINI AUDIO EAR CLOSED-LOOP WAV LISTENING & PATCH REFINEMENT ENGINE
// ============================================================================

async function runGeminiEarClosedLoop(roundNum = 1) {
  const statusEl = document.getElementById('gemini-ear-status-text');
  const badgeEl = document.getElementById('gemini-ear-score-badge');
  const btnEl = document.getElementById('btn-gemini-ear-listen');
  if (btnEl) btnEl.disabled = true;
  if (statusEl) {
    statusEl.innerHTML = `<strong>GEMINI AUDIO EAR [ROUND ${roundNum}] //</strong> Rendering 16-bit stereo PCM WAV of <em>${state.archetypeId || 'basic_channel'}</em> and sending real audio to <code>gemini-flash-latest</code>...`;
  }

  try {
    // 1. Render deterministic 7.8s stereo 16-bit PCM WAV via OfflineAudioContext
    const rendered = await dsp.renderVariationToWavBase64(state, 7.8);

    // 2. Save baseline/round WAV to disk on backend for scientific inspection
    await fetch('/api/audio/save-wav', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filename: `${state.archetypeId || 'basic_channel'}_round${roundNum}.wav`,
        audioWavBase64: rendered.base64,
      }),
    }).catch(() => {});

    // 3. Send actual rendered WAV audio bytes to Gemini Multimodal Audio Ear!
    const res = await fetch('/api/ai/listen-and-refine', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        round: roundNum,
        prompt: state.prompt,
        audioWavBase64: rendered.base64,
        apiKey: state.geminiApiKey,
        currentParams: {
          archetypeId: state.archetypeId || 'basic_channel',
          bpm: state.bpm,
          swing: state.swing,
          stabCutoffHz: dsp.params.stabCutoffHz,
          stabResonance: dsp.params.stabResonance,
          stabAttackMs: dsp.params.stabAttackMs,
          stabDecayMs: dsp.params.stabDecayMs,
          stabEnvDepth: dsp.params.stabEnvDepth,
          delayFeedback: dsp.params.delayFeedback,
          delayFilterHz: dsp.params.delayFilterHz,
          reverbWet: dsp.params.reverbWet,
          noiseBedLevel: dsp.params.noiseBedLevel,
          vinylCrackleDensity: dsp.params.vinylCrackleDensity,
          subCutoffHz: dsp.params.subCutoffHz,
          kickMuffleHz: dsp.params.kickMuffleHz,
        },
      }),
    });

    const data = await res.json();
    if (!res.ok || !data.ok) {
      throw new Error(data.error || 'Gemini Audio Ear failed');
    }

    // 4. Apply Gemini's real acoustic adjustments directly to live DSP + Arturia CCs!
    dsp.applyGeminiEarAdjustments(data.patchAdjustments);
    if (typeof data.patchAdjustments?.swing === 'number') {
      state.swing = Math.round(data.patchAdjustments.swing * 100);
    }

    // Re-render post-refinement WAV so post-adjustment audio is also archived on disk!
    const refinedRender = await dsp.renderVariationToWavBase64(state, 7.8);
    const savedPost = await fetch('/api/audio/save-wav', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filename: `${state.archetypeId || 'basic_channel'}_round${roundNum}_refined.wav`,
        audioWavBase64: refinedRender.base64,
      }),
    }).then((r) => r.json()).catch(() => ({}));

    const crit = data.critique || {};
    const adj = data.patchAdjustments || {};
    if (statusEl) {
      statusEl.innerHTML = `<strong>GEMINI EAR HEARD [R${roundNum}]:</strong> "${crit.whatGeminiHeard || ''}" → <strong>APPLIED:</strong> Cut <code>${Math.round(adj.stabCutoffHz)}Hz</code> · Res <code>${adj.stabResonance?.toFixed?.(1)}</code> · Decay <code>${Math.round(adj.stabDecayMs)}ms</code> · RE-201 FB <code>${Math.round((adj.delayFeedback || 0.7) * 100)}% @ ${Math.round(adj.delayFilterHz)}Hz</code> (${data.midiCCsSent || 0} Arturia CCs sent)`;
    }
    if (badgeEl) {
      badgeEl.textContent = `DUB ${crit.dubAuthenticityScore || 92}/100 · CASIO ${crit.casioArtifactScore ?? 4}/100`;
    }
    addLog('AI', `[GEMINI EAR R${roundNum}] Dub=${crit.dubAuthenticityScore}/100 Casio=${crit.casioArtifactScore}/100 | ${crit.whatGeminiHeard} | Filter: ${crit.filterAndChordCritique}`);
    return { ...data, postPcmMetrics: savedPost.pcmMetrics || {} };
  } catch (err) {
    if (statusEl) statusEl.innerHTML = `<strong>GEMINI EAR ERROR:</strong> ${err.message}`;
    addLog('ERR', `Gemini Audio Ear error: ${err.message}`);
    throw err;
  } finally {
    if (btnEl) btnEl.disabled = false;
  }
}

async function exportCurrentVariationWav() {
  const rendered = await dsp.renderVariationToWavBase64(state, 8.0);
  const url = URL.createObjectURL(rendered.blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `sinthwave-${state.archetypeId || 'dub-techno'}.wav`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
  addLog('AUDIO', `Exported 16-bit PCM Stereo WAV: sinthwave-${state.archetypeId || 'dub-techno'}.wav (${rendered.durationSec.toFixed(1)}s)`);
}

window.sinthwaveStudio = {
  dsp,
  ai,
  state,
  selectArchetype: (archId) => {
    const cart = GENRE_CARTRIDGES.find((c) => c.id === archId) || GENRE_CARTRIDGES[0];
    generateFromPrompt(cart.prompt, cart);
    return state;
  },
  runGeminiEarClosedLoop,
  exportCurrentVariationWav,
};


window.addEventListener('DOMContentLoaded', () => {
  renderCartridges();
  renderMiniKeyboard();
  bindConcept02Modules();
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
  document.getElementById('btn-gemini-ear-listen')?.addEventListener('click', () => runGeminiEarClosedLoop(1));
  document.getElementById('btn-export-wav')?.addEventListener('click', () => exportCurrentVariationWav());
  document.getElementById('btn-dj-mix-next')?.addEventListener('click', () => {
    initiateSeamlessTrackTransition();
    if (!state.isPlaying) startSequencer();
  });
  setStudioMode('hardware');
  initWebMIDI();
  fetchCoreMidiStatus();
  setInterval(fetchCoreMidiStatus, 3000);
  startVisualLoop();
  addLog('MIDI', 'SINTHWAVE // USB Hardware MIDI mode active (Mac internal soft-synths muted; routing live to connected USB devices).');
});
