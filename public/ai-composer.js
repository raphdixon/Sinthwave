/**
 * AETHER-909 // AI Infinite Song Conductor & Generative Music Theory Engine v2
 * Features:
 * 1. Dynamic Voice Orchestration & TB-303 Restraint (never blasts all 5 synths non-stop;
 *    stages instruments in and out across INTRO, GROOVE, BUILD, PEAK, BREAKDOWN).
 * 2. MIDI Program Change (Patch Selection) per genre & section.
 * 3. Hybrid execution: Symbolic Music Theory Engine (<1ms) + Live Gemini 2.5 Flash/Pro API.
 */

export const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export const SCALES = {
  minor:         [0, 2, 3, 5, 7, 8, 10], // Natural Minor (Aeolian)
  dorian:        [0, 2, 3, 5, 7, 9, 10], // Classic Detroit / Deep Techno Dorian
  phrygian:      [0, 1, 3, 5, 7, 8, 10], // Dark Acid Phrygian (b2 tension)
  harmonicMinor: [0, 2, 3, 5, 7, 8, 11], // Dramatic Minor with raised 7th
  mixolydian:    [0, 2, 4, 5, 7, 9, 10], // Classic House / Cosmic Mixolydian
};

export const GENRE_CARTRIDGES = [
  {
    id: 'berlin_dub',
    name: 'Berlin Dub & Hypnotic Minimal (No 303)',
    prompt: 'Deep atmospheric Berlin dub techno at 122 BPM with warm 808 sub kick, rolling Moog bass, dub tape-delayed minor 9th Juno chords, and spacious reverb',
    bpm: 122,
    rootNote: 'D',
    scale: 'minor',
    grooveStyle: 'dub-minimal',
    acidPolicy: 'rare', // 303 stays silent except rare peak cameo
  },
  {
    id: 'euphoric_breakbeat',
    name: 'Bicep / Overmono Euphoric Breaks',
    prompt: 'Emotional UK breakbeat electronica at 132 BPM with syncopated 808/909 breaks, lush CS-80 polyphonic pads, soaring Prophet-5 lead arp, and warm Moog bass',
    bpm: 132,
    rootNote: 'A',
    scale: 'minor',
    grooveStyle: 'breakbeat',
    acidPolicy: 'off', // No 303 — pure breaks, pads, Moog & Prophet lead
  },
  {
    id: 'cosmic_balearic',
    name: 'Cosmic Analog Odyssey (Moog + Prophet + Juno)',
    prompt: 'Warm cosmic analog synthesizer odyssey at 118 BPM with vintage 808 rhythm, rolling Moog bassline, shimmering Prophet-5 arpeggios, and lush Jupiter-8 pads',
    bpm: 118,
    rootNote: 'G',
    scale: 'mixolydian',
    grooveStyle: 'four-on-floor',
    acidPolicy: 'off',
  },
  {
    id: 'detroit_acid',
    name: 'Detroit 909 Warehouse (Staged 303)',
    prompt: 'Driving 90s Detroit warehouse 909 techno with staged TB-303 acid hooks on builds/peaks, rolling Moog sub bass, and deep Dorian Juno-60 pads',
    bpm: 130,
    rootNote: 'F',
    scale: 'dorian',
    grooveStyle: 'four-on-floor',
    acidPolicy: 'staged', // 303 rests in Intro/Breakdown/early Groove, enters on Build/Peak
  },
  {
    id: 'dark_electro',
    name: 'Drexciya / Gesaffelstein Electro',
    prompt: 'Dark punchy analog electro at 116 BPM with snappy 808 drums,heavy Moog Model D bass, MS-20 lead stabs, and occasional acid phrases',
    bpm: 116,
    rootNote: 'E',
    scale: 'phrygian',
    grooveStyle: 'electro',
    acidPolicy: 'staged',
  },
  {
    id: 'braindance_idm',
    name: 'Aphex / Braindance Polyrhythm',
    prompt: 'Intricate melodic Braindance IDM at 136 BPM with complex 909 percussion, nostalgic Prophet melody, floating pads, and sparse acid accents',
    bpm: 136,
    rootNote: 'C',
    scale: 'dorian',
    grooveStyle: 'idm-acid',
    acidPolicy: 'staged',
  },
];

export const SONG_SECTIONS = ['INTRO', 'GROOVE', 'TENSION BUILD', 'PEAK EUPHORIA', 'DUB BREAKDOWN'];

export function midiToNoteName(midi) {
  const n = Math.max(0, Math.min(127, Math.round(midi)));
  const name = NOTE_NAMES[n % 12];
  const oct = Math.floor(n / 12) - 1;
  return `${name}${oct}`;
}

export class AIConductorEngine {
  constructor() {
    this.generationCount = 0;
    this.evolutionStep = 0;
  }

  /**
   * Parses natural language prompt to infer musical parameters, acid policy, and voice staging
   */
  analyzePrompt(promptText, currentState = {}) {
    const p = (promptText || '').toLowerCase();
    let grooveStyle = currentState.grooveStyle || 'four-on-floor';
    let bpm = currentState.bpm || 126;
    let rootNote = currentState.rootNote || 'D';
    let scale = currentState.scale || 'dorian';

    const bpmMatch = p.match(/\b(9\d|1\d\d)\s*bpm\b/);
    if (bpmMatch) {
      bpm = parseInt(bpmMatch[1], 10);
    } else if (p.includes('dub') || p.includes('ambient') || p.includes('deep')) {
      bpm = 122;
    } else if (p.includes('electro') || p.includes('industrial') || p.includes('gesaffelstein')) {
      bpm = 116;
    } else if (p.includes('break') || p.includes('bicep') || p.includes('overmono')) {
      bpm = 132;
    } else if (p.includes('idm') || p.includes('aphex')) {
      bpm = 136;
    } else if (p.includes('cosmic') || p.includes('odyssey') || p.includes('balearic')) {
      bpm = 118;
    } else if (p.includes('detroit') || p.includes('warehouse')) {
      bpm = 130;
    }

    if (p.includes('break') || p.includes('bicep') || p.includes('overmono') || p.includes('uk')) {
      grooveStyle = 'breakbeat';
    } else if (p.includes('electro') || p.includes('drexciya')) {
      grooveStyle = 'electro';
    } else if (p.includes('dub') || p.includes('minimal') || p.includes('ambient')) {
      grooveStyle = 'dub-minimal';
    } else if (p.includes('idm') || p.includes('aphex') || p.includes('poly')) {
      grooveStyle = 'idm-acid';
    } else {
      grooveStyle = 'four-on-floor';
    }

    if (p.includes('dark') || p.includes('phrygian') || p.includes('industrial') || p.includes('gesaffelstein')) {
      scale = 'phrygian';
    } else if (p.includes('detroit') || p.includes('dorian') || p.includes('warehouse')) {
      scale = 'dorian';
    } else if (p.includes('cosmic') || p.includes('bright') || p.includes('balearic') || p.includes('mixolydian')) {
      scale = 'mixolydian';
    } else if (p.includes('dramatic') || p.includes('harmonic')) {
      scale = 'harmonicMinor';
    } else {
      scale = 'minor';
    }

    const keyMatch = p.match(/\b([a-g](?:#)?)\s*(minor|dorian|phrygian|mixolydian)\b/);
    if (keyMatch) {
      rootNote = keyMatch[1].toUpperCase();
    }

    // Determine 303 Acid Policy so 303 is NEVER overused!
    let acidPolicy = 'off';
    if (p.includes('no 303') || p.includes('no acid') || p.includes('without 303')) {
      acidPolicy = 'off';
    } else if (p.includes('303') || p.includes('acid') || p.includes('squelch')) {
      acidPolicy = 'staged'; // Even when requested, stage it in and out so it stays fresh!
    } else if (p.includes('detroit') || p.includes('electro') || p.includes('idm')) {
      acidPolicy = 'rare'; // Only bring 303 in occasionally on builds/peaks
    } else {
      acidPolicy = 'off'; // Default for Dub, Breaks, Cosmic, Ambient: keep 303 silent!
    }

    return {
      grooveStyle,
      bpm,
      rootNote,
      scale,
      acidPolicy,
      isDubby: p.includes('dub') || p.includes('delay') || p.includes('echo') || p.includes('reverb'),
    };
  }

  /**
   * Decides WHICH subset of the 5 instruments should play in this section (2 to 4 voices max!)
   * so the arrangement breathes and the 303 Acid never wears out its welcome.
   */
  selectActiveVoicesForSection(section, acidPolicy, evolutionCycle = 0) {
    // Rotate spotlight between Lead, Pads, and Acid across cycles
    const spotlightCycle = evolutionCycle % 3;

    switch (section) {
      case 'INTRO':
        return {
          drums: true,
          acid: false, // Never start with 303 roaring in the intro
          moog: spotlightCycle === 1,
          lead: false,
          pads: true,
        };

      case 'GROOVE':
        return {
          drums: true,
          // In GROOVE, Moog Bass carries the low end; 303 rests unless acidPolicy === 'staged' AND spotlightCycle === 2
          acid: acidPolicy === 'staged' && spotlightCycle === 2,
          moog: true,
          lead: spotlightCycle === 1,
          pads: spotlightCycle !== 2,
        };

      case 'TENSION BUILD':
        if (acidPolicy === 'staged' || (acidPolicy === 'rare' && spotlightCycle === 1)) {
          // 303 Acid takes center stage for the build while Pads or Moog step back!
          return {
            drums: true,
            acid: true,
            moog: false, // Let 303 own the bass/mid-bass frequencies during the acid build!
            lead: spotlightCycle === 0,
            pads: spotlightCycle !== 0,
          };
        }
        // Non-acid build: Prophet Lead Arp + Moog Bass + Drums
        return {
          drums: true,
          acid: false,
          moog: true,
          lead: true,
          pads: false,
        };

      case 'PEAK EUPHORIA':
        if (acidPolicy === 'staged' && spotlightCycle !== 1) {
          // Acid Peak (4 voices: Drums + 303 + Moog Sub + Pads/Lead)
          return {
            drums: true,
            acid: true,
            moog: true,
            lead: spotlightCycle === 2,
            pads: spotlightCycle !== 2,
          };
        }
        // Melodic Euphoric Peak (Drums + Moog + Prophet Lead + Lush Juno Pads — zero 303!)
        return {
          drums: true,
          acid: false,
          moog: true,
          lead: true,
          pads: true,
        };

      case 'DUB BREAKDOWN':
      default:
        return {
          drums: spotlightCycle === 0, // Often drop drums or leave sparse rimshot
          acid: false,                 // Always rest the 303 in the breakdown!
          moog: spotlightCycle === 2,
          lead: true,                  // Echoing Prophet lead motif
          pads: true,                  // Lush CS-80 / Juno chords
        };
    }
  }

  /**
   * Selects MIDI Program Change (0..31) per instrument based on genre & section
   */
  selectProgramChanges(grooveStyle, section) {
    const baseOffset =
      grooveStyle === 'dub-minimal' ? 4 :
      grooveStyle === 'breakbeat' ? 8 :
      grooveStyle === 'electro' ? 12 :
      grooveStyle === 'idm-acid' ? 16 : 0;
    const secOffset = SONG_SECTIONS.indexOf(section) % 4;
    return {
      drums: (baseOffset + secOffset) % 16,
      acid:  (baseOffset + secOffset) % 16,
      moog:  (baseOffset + secOffset) % 16,
      lead:  (baseOffset + secOffset) % 16,
      pads:  (baseOffset + secOffset) % 16,
    };
  }

  composeFullArrangement(options = {}) {
    this.generationCount++;
    const prompt = options.prompt || GENRE_CARTRIDGES[0].prompt;
    const section = options.section || 'GROOVE';
    const parsed = this.analyzePrompt(prompt, options);
    const acidPolicy = options.acidPolicy || parsed.acidPolicy;

    const rootIdx = Math.max(0, NOTE_NAMES.indexOf(options.rootNote || parsed.rootNote));
    const scaleName = options.scale || parsed.scale;
    const intervals = SCALES[scaleName] || SCALES.dorian;
    const grooveStyle = options.grooveStyle || parsed.grooveStyle;

    const activeVoices = this.selectActiveVoicesForSection(section, acidPolicy, this.evolutionStep);
    const programs = this.selectProgramChanges(grooveStyle, section);

    const drums = this._composeDrums(grooveStyle, section);
    const pads = this._composePolyChords(rootIdx, intervals, scaleName, section);
    const acid = this._composeAcid303(rootIdx, intervals, section, activeVoices.acid);
    const bass = this._composeMoogBass(rootIdx, intervals, drums.kick, section);
    const lead = this._composeProphetLead(rootIdx, intervals, section);
    const macros = this._computeSectionMacros(section, parsed);

    const commentary = this._buildCommentary(
      section,
      NOTE_NAMES[rootIdx],
      scaleName,
      grooveStyle,
      activeVoices,
      pads
    );

    return {
      bpm: options.lockBpm ? options.bpm : parsed.bpm,
      rootNote: NOTE_NAMES[rootIdx],
      scale: scaleName,
      grooveStyle,
      acidPolicy,
      section,
      activeVoices,
      programs,
      drums,
      acid,
      bass,
      lead,
      pads,
      macros,
      commentary,
    };
  }

  evolveArrangement(state, nextSection) {
    this.evolutionStep++;
    const rootIdx = Math.max(0, NOTE_NAMES.indexOf(state.rootNote || 'D'));
    const intervals = SCALES[state.scale] || SCALES.dorian;
    const grooveStyle = state.grooveStyle || 'four-on-floor';
    const acidPolicy = state.acidPolicy || this.analyzePrompt(state.prompt, state).acidPolicy;

    const activeVoices = this.selectActiveVoicesForSection(nextSection, acidPolicy, this.evolutionStep);
    const programs = this.selectProgramChanges(grooveStyle, nextSection);

    const drums = this._composeDrums(grooveStyle, nextSection);
    const acid = this._composeAcid303(rootIdx, intervals, nextSection, activeVoices.acid);
    const bass = this._composeMoogBass(rootIdx, intervals, drums.kick, nextSection);
    const lead = this._composeProphetLead(rootIdx, intervals, nextSection);
    const pads = this._composePolyChords(rootIdx, intervals, state.scale, nextSection);
    const macros = this._computeSectionMacros(nextSection, {
      isDubby: nextSection === 'DUB BREAKDOWN' || grooveStyle === 'dub-minimal',
    });

    const commentary = this._buildCommentary(
      nextSection,
      state.rootNote,
      state.scale,
      grooveStyle,
      activeVoices,
      pads
    );

    return {
      ...state,
      section: nextSection,
      acidPolicy,
      activeVoices,
      programs,
      drums,
      acid,
      bass,
      lead,
      pads,
      macros,
      commentary,
    };
  }

  // --------------------------------------------------------------------------
  // INTERNAL GENERATORS
  // --------------------------------------------------------------------------

  _composeDrums(grooveStyle, section) {
    const emptyLane = () => Array.from({ length: 16 }, () => ({ active: false, vel: 96 }));
    const kick = emptyLane();
    const snare = emptyLane();
    const clap = emptyLane();
    const ch = emptyLane();
    const oh = emptyLane();
    const perc = emptyLane();

    const isBreakdown = section === 'DUB BREAKDOWN';
    const isIntro = section === 'INTRO';
    const isPeak = section === 'PEAK EUPHORIA';
    const isBuild = section === 'TENSION BUILD';

    if (grooveStyle === 'breakbeat') {
      const kSteps = isBreakdown ? [0] : [0, 6, 10];
      kSteps.forEach((s) => { kick[s] = { active: true, vel: 118 }; });
      if (!isIntro) {
        [4, 12].forEach((s) => { snare[s] = { active: true, vel: 112 }; });
        if (isPeak || isBuild) snare[15] = { active: true, vel: 78 };
        clap[12] = { active: !isBreakdown, vel: 104 };
      }
      for (let i = 0; i < 16; i += 2) {
        ch[i] = { active: true, vel: i % 4 === 0 ? 94 : 72 };
      }
      [2, 14].forEach((s) => { oh[s] = { active: !isIntro && !isBreakdown, vel: 90 }; });
      [3, 7, 11].forEach((s) => {
        if (Math.random() < 0.6) perc[s] = { active: true, vel: 82 };
      });
    } else if (grooveStyle === 'electro') {
      const kSteps = isBreakdown ? [0] : [0, 3, 6, 10];
      kSteps.forEach((s, idx) => { kick[s] = { active: true, vel: idx === 0 ? 122 : 104 }; });
      [4, 12].forEach((s) => {
        snare[s] = { active: !isBreakdown, vel: 114 };
        clap[s] = { active: isPeak || isBuild, vel: 106 };
      });
      for (let i = 0; i < 16; i += 2) {
        ch[i] = { active: true, vel: i % 4 === 0 ? 96 : 68 };
      }
      [2, 10, 14].forEach((s) => { oh[s] = { active: !isBreakdown, vel: 86 }; });
      [7, 9, 15].forEach((s) => { perc[s] = { active: true, vel: 86 }; });
    } else if (grooveStyle === 'idm-acid') {
      [0, 3, 8, 11, 14].forEach((s) => {
        if (!isBreakdown || s === 0) kick[s] = { active: true, vel: s === 0 ? 120 : 96 };
      });
      [4, 7, 12, 15].forEach((s) => {
        snare[s] = { active: s === 4 || s === 12 || Math.random() < 0.6, vel: s % 4 === 0 ? 112 : 70 };
      });
      for (let i = 0; i < 16; i++) {
        if (Math.random() < 0.65) ch[i] = { active: true, vel: 60 + Math.floor(Math.random() * 40) };
      }
      [2, 6, 13].forEach((s) => { oh[s] = { active: !isBreakdown, vel: 84 }; });
      [1, 5, 9, 14].forEach((s) => {
        if (Math.random() < 0.55) perc[s] = { active: true, vel: 82 };
      });
    } else {
      // Four-on-the-floor / Dub Minimal
      if (!isBreakdown) {
        [0, 4, 8, 12].forEach((s) => { kick[s] = { active: true, vel: 120 }; });
        if (isPeak && Math.random() < 0.5) kick[14] = { active: true, vel: 90 };
      } else {
        // Breakdown: no heavy 4x4 kick, just warm rimshot & hats
        perc[3] = { active: true, vel: 82 };
        perc[11] = { active: true, vel: 78 };
      }

      if (!isIntro && !isBreakdown && grooveStyle !== 'dub-minimal') {
        [4, 12].forEach((s) => {
          clap[s] = { active: true, vel: 104 };
          if (isPeak) snare[s] = { active: true, vel: 100 };
        });
      } else if (grooveStyle === 'dub-minimal' && !isIntro) {
        perc[4] = { active: true, vel: 86 };
        clap[12] = { active: true, vel: 90 };
      }

      [2, 6, 10, 14].forEach((s) => {
        if (!isIntro || s === 2 || s === 10) {
          oh[s] = { active: !isBreakdown, vel: 92 };
        }
      });

      for (let i = 0; i < 16; i++) {
        if (i % 2 === 0 || ((isBuild || isPeak) && Math.random() < 0.55)) {
          ch[i] = { active: true, vel: (i % 4 === 2) ? 90 : 66 };
        }
      }
    }

    return { kick, snare, clap, ch, oh, perc };
  }

  _composeAcid303(rootIdx, intervals, section, isAcidActive = false) {
    const baseMidi = 36 + rootIdx;
    const steps = [];
    const favOffsets = [0, 0, 12, intervals[4] || 7, intervals[2] || 3, intervals[6] || 10];

    // Even when 303 IS active, keep step density tasteful (6 to 9 steps out of 16, with musical rests!)
    const density = !isAcidActive ? 0.0 : (section === 'PEAK EUPHORIA' ? 0.52 : 0.44);

    for (let i = 0; i < 16; i++) {
      const active = isAcidActive && (i === 0 || (i % 2 === 1 && Math.random() < density) || (i % 4 === 2 && Math.random() < density));
      const offset = i === 0 ? 0 : favOffsets[Math.floor(Math.random() * favOffsets.length)];
      const note = Math.max(28, Math.min(64, baseMidi + offset));
      const accent = active && (i === 0 || (i % 4 === 2 && Math.random() < 0.35));
      const slide = active && Math.random() < 0.28;

      steps.push({
        active,
        note,
        vel: accent ? 124 : 84,
        accent,
        slide,
      });
    }
    return steps;
  }

  _composeMoogBass(rootIdx, intervals, kickLane, section) {
    const baseMidi = 24 + rootIdx;
    const fifth = intervals[4] || 7;
    const seventh = intervals[6] || 10;
    const third = intervals[2] || 3;

    const steps = [];
    for (let i = 0; i < 16; i++) {
      const isKick = kickLane[i] && kickLane[i].active;
      let active = false;
      if (section === 'DUB BREAKDOWN') {
        active = i === 0 || i === 6 || i === 10;
      } else if (section === 'INTRO') {
        active = i === 0 || i === 8 || i === 14;
      } else {
        active = i === 0 || i === 2 || i === 6 || i === 10 || i === 11 || i === 14;
      }

      let offset = 12;
      if (i === 3 || i === 11) offset = 12 + third;
      else if (i === 6 || i === 14) offset = 12 + fifth;
      else if (i === 15) offset = 12 + seventh;

      steps.push({
        active,
        note: baseMidi + offset,
        vel: isKick ? 84 : 106,
        gate: i % 4 === 0 ? 0.85 : 0.68,
      });
    }
    return steps;
  }

  _composeProphetLead(rootIdx, intervals, section) {
    const baseMidi = 60 + rootIdx;
    const steps = [];
    const motifDegrees = [0, 2, 4, 6, 4, 2, 1, 4];
    const density =
      section === 'PEAK EUPHORIA' ? 0.58 :
      section === 'TENSION BUILD' ? 0.50 :
      section === 'DUB BREAKDOWN' ? 0.42 : 0.36;

    for (let i = 0; i < 16; i++) {
      const active = (i % 3 === 0 || i % 4 === 2) && Math.random() < density * 1.25;
      const degIdx = motifDegrees[i % motifDegrees.length] % intervals.length;
      const octaveShift = (i >= 11 && section === 'PEAK EUPHORIA') ? 12 : 0;
      const note = baseMidi + intervals[degIdx] + octaveShift;

      steps.push({
        active,
        note,
        vel: (i % 4 === 0) ? 102 : 82,
        gate: section === 'DUB BREAKDOWN' ? 0.85 : 0.58,
      });
    }
    return steps;
  }

  _composePolyChords(rootIdx, intervals, scaleName, section) {
    const baseMidi = 48 + rootIdx;
    const progDegrees = [0, 5, 3, 6];
    const Roman = ['i9', 'II7', 'III+', 'iv9', 'v7', 'VIΔ7', 'VII7'];

    return progDegrees.map((deg, barIdx) => {
      const n1 = baseMidi + intervals[deg % intervals.length];
      const n2 = baseMidi + intervals[(deg + 2) % intervals.length] + (deg + 2 >= 7 ? 12 : 0);
      const n3 = baseMidi + intervals[(deg + 4) % intervals.length] + (deg + 4 >= 7 ? 12 : 0);
      const n4 = baseMidi + intervals[(deg + 6) % intervals.length] + 12;

      const chordRootName = NOTE_NAMES[n1 % 12];
      const quality = (deg === 0 || deg === 3 || deg === 4) ? 'min9' : 'maj7';

      return {
        bar: barIdx + 1,
        name: `${chordRootName}${quality}`,
        roman: Roman[deg % Roman.length],
        notes: [n1, n2, n3, n4],
        vel: section === 'DUB BREAKDOWN' || section === 'PEAK EUPHORIA' ? 90 : 78,
      };
    });
  }

  _computeSectionMacros(section, parsed) {
    switch (section) {
      case 'INTRO':
        return {
          acidCutoff: 0.28, acidRes: 0.52, acidEnvMod: 0.42, acidDecay: 0.35,
          moogCutoff: 0.38, leadCutoff: 0.44, padCutoff: 0.48,
          delayMix: 0.36, reverbMix: 0.48, masterFilter: 0.46,
        };
      case 'TENSION BUILD':
        return {
          acidCutoff: 0.64, acidRes: 0.78, acidEnvMod: 0.72, acidDecay: 0.58,
          moogCutoff: 0.56, leadCutoff: 0.68, padCutoff: 0.64,
          delayMix: 0.44, reverbMix: 0.48, masterFilter: 0.55,
        };
      case 'PEAK EUPHORIA':
        return {
          acidCutoff: 0.72, acidRes: 0.76, acidEnvMod: 0.76, acidDecay: 0.64,
          moogCutoff: 0.66, leadCutoff: 0.78, padCutoff: 0.74,
          delayMix: 0.38, reverbMix: 0.44, masterFilter: 0.50,
        };
      case 'DUB BREAKDOWN':
        return {
          acidCutoff: 0.32, acidRes: 0.58, acidEnvMod: 0.46, acidDecay: 0.48,
          moogCutoff: 0.36, leadCutoff: 0.58, padCutoff: 0.72,
          delayMix: 0.56, reverbMix: 0.64, masterFilter: 0.43,
        };
      case 'GROOVE':
      default:
        return {
          acidCutoff: 0.44, acidRes: 0.62, acidEnvMod: 0.56, acidDecay: 0.46,
          moogCutoff: 0.48, leadCutoff: 0.58, padCutoff: 0.58,
          delayMix: parsed.isDubby ? 0.48 : 0.34,
          reverbMix: parsed.isDubby ? 0.54 : 0.40,
          masterFilter: 0.50,
        };
    }
  }

  _buildCommentary(section, rootNote, scale, grooveStyle, activeVoices, pads) {
    const playingList = Object.entries(activeVoices)
      .filter(([, on]) => on)
      .map(([k]) => k.toUpperCase());
    const restingList = Object.entries(activeVoices)
      .filter(([, on]) => !on)
      .map(([k]) => k.toUpperCase());
    const chordNames = pads.map((p) => p.name).join(' → ');

    return `[${section}] Active Synths (${playingList.length}/5): ${playingList.join(' + ')} | Resting: ${restingList.join(', ') || 'None'} | Key: ${rootNote} ${scale} (${chordNames})`;
  }
}
