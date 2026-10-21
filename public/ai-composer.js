/**
 * SINTHWAVE // PhD MUSICOLOGY DUB TECHNO COMPOSITIONAL ENGINE (AI CONDUCTOR v4.0)
 * Replaces 100% of "children's Casio" 4-chord bar progressions, sustained organ pads,
 * and busy single-note lead arpeggios with:
 *   1) Single-Chord Minor-7/9/11 Sound-Object Stasis (PhD #1)
 *   2) Tripartite Polymetric Sequencer (16-step Kick/Sub, 14-step Primary Dub Chord Stab,
 *      12-step Secondary Rootless Dub Dyad -> LCM(16,14,12) = 336 steps = 21-bar cycle!) (PhD #2)
 *   3) Minimalist Sub-Pressure Percussion & Off-Grid Dub Rimshot Throws (PhD #5)
 *   4) 8 Canonical Dub Techno Subgenre Cartridge Blueprints (PhD #10)
 */

import { DUB_ARCHETYPES } from './synth-engine.js';

export const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export const SCALES = {
  minor:    [0, 2, 3, 5, 7, 8, 10], // Aeolian
  dorian:   [0, 2, 3, 5, 7, 9, 10], // Canonical Basic Channel / Rhythm & Sound Dorian
  phrygian: [0, 1, 3, 5, 7, 8, 10], // Porter Ricks Dark Phrygian
};

export const SONG_SECTIONS = [
  'GROOVE',
  'TENSION BUILD',
  'PEAK EUPHORIA',
  'DUB BREAKDOWN',
];

export function midiToNoteName(midiNote) {
  const n = Math.max(0, Math.min(127, Math.round(midiNote)));
  const octave = Math.floor(n / 12) - 1;
  return `${NOTE_NAMES[n % 12]}${octave}`;
}

export const GENRE_CARTRIDGES = [
  {
    id: 'basic_channel',
    name: '01 · BASIC CHANNEL',
    subtitle: 'Berlin RE-201 Dub',
    bpm: 126,
    swing: 53,
    rootNote: 'D',
    scale: 'dorian',
    grooveStyle: 'dub-minimal',
    acidPolicy: 'rare',
    prompt: '1994 Hardwax Berlin Basic Channel Phylyps Trak II: D Dorian hollow Dm7(no5) percussive chord stab into Roland RE-201 dotted-8th feedback matrix, muffled 909 pressure kick, off-beat SH-101 sub bass, vinyl crackle.',
  },
  {
    id: 'deepchord',
    name: '02 · DEEPCHORD',
    subtitle: 'Detroit Echospace',
    bpm: 118,
    swing: 56,
    rootNote: 'D#',
    scale: 'minor',
    grooveStyle: 'dub-minimal',
    acidPolicy: 'rare',
    prompt: 'Nocturnal Lake Huron DeepChord & Echospace Liumin: Eb Aeolian Ebm9 submerged chord stabs, cross-coupled ping-pong tape delay melting into 8.5s cavernous hall reverb, 39Hz 808 sub drone, hydrothermal noise.',
  },
  {
    id: 'rhythm_sound',
    name: '03 · RHYTHM & SOUND',
    subtitle: 'Burial Mix Roots',
    bpm: 112,
    swing: 60,
    rootNote: 'E',
    scale: 'dorian',
    grooveStyle: 'dub-minimal',
    acidPolicy: 'rare',
    prompt: 'Rhythm & Sound King In My Empire (Burial Mix): Dread 112 BPM half-time roots dub techno, tight Em7 offbeat chop skank into Roland SRE-555 triplet echo & spring tank, heavy walking Minimoog sub bassline.',
  },
  {
    id: 'maurizio',
    name: '04 · MAURIZIO M-4',
    subtitle: 'Peak Berlin Lathe',
    bpm: 124,
    swing: 51,
    rootNote: 'C',
    scale: 'minor',
    grooveStyle: 'dub-minimal',
    acidPolicy: 'rare',
    prompt: 'Maurizio M-4 / Domina peak-time Berlin lathe cut: Austere C minor triad ostinato through CEM3320 filter sweep, crisp 420Hz high-passed stereo delay, relentless rolling 16th-note off-kick SH-101 sub bass.',
  },
  {
    id: 'fluxion',
    name: '05 · FLUXION',
    subtitle: 'Chain Reaction',
    bpm: 116,
    swing: 53,
    rootNote: 'D',
    scale: 'dorian',
    grooveStyle: 'dub-minimal',
    acidPolicy: 'rare',
    prompt: 'Fluxion Vibrant Forms II (Chain Reaction): Zero-gravity aquatic Dm11 quartal swells breathing through SSM2044 lowpass filter, 4-tap diffuse underwater delay, infinite smeared hall, hydrothermal ocean current.',
  },
  {
    id: 'yagya',
    name: '06 · YAGYA',
    subtitle: 'Nordic Snow Dub',
    bpm: 120,
    swing: 51,
    rootNote: 'C#',
    scale: 'dorian',
    grooveStyle: 'dub-minimal',
    acidPolicy: 'rare',
    prompt: 'Yagya Rhythm of Snow (Reykjavik): C# Dorian wide-spread C#m9 frosty chords over warm sustained sub pedal, sidechain-breathing 6s concert hall shimmer, dotted-8th ping-pong echoes, falling snow air.',
  },
  {
    id: 'porter_ricks',
    name: '07 · PORTER RICKS',
    subtitle: 'Biokinetics Sonar',
    bpm: 122,
    swing: 50,
    rootNote: 'G',
    scale: 'phrygian',
    grooveStyle: 'dub-minimal',
    acidPolicy: 'rare',
    prompt: 'Porter Ricks Biokinetics (Chain Reaction): Pressurized submarine G Phrygian half-diminished metallic DX7 FM clangs (1:3.41 ratio) through MS-20 comb filter, hull slapback echo, diesel sub rumble & sonar.',
  },
  {
    id: 'prince_of_denmark',
    name: '08 · TRAUMPRINZ',
    subtitle: 'Giegling Cassette',
    bpm: 125,
    swing: 55,
    rootNote: 'G#',
    scale: 'minor',
    grooveStyle: 'dub-minimal',
    acidPolicy: 'rare',
    prompt: 'Prince of Denmark / Traumprinz (Giegling Weimar): Melancholic Ab Aeolian Abm9 close tape cluster recorded onto worn Type-II cassette at 125 BPM, 3/16 Korg Stage Echo rolloff, Midiverb II bloom, heavy vinyl dust.',
  },
];

export class AIConductorEngine {
  constructor() {
    this.activeArchetypeId = 'basic_channel';
  }

  _inferArchetype(promptText = '') {
    const p = (promptText || '').toLowerCase();
    if (p.includes('yagya') || p.includes('rhythm of snow') || p.includes('nordic')) return 'yagya';
    if (p.includes('deepchord') || p.includes('echospace') || p.includes('modell') || p.includes('liumin')) return 'deepchord';
    if (p.includes('rhythm & sound') || p.includes('rhythm and sound') || p.includes('burial') || p.includes('skank')) return 'rhythm_sound';
    if (p.includes('maurizio') || p.includes('m-4') || p.includes('domina')) return 'maurizio';
    if (p.includes('fluxion') || p.includes('aquatic') || p.includes('vibrant')) return 'fluxion';
    if (p.includes('porter') || p.includes('biokinetics') || p.includes('nautical') || p.includes('sonar')) return 'porter_ricks';
    if (p.includes('prince') || p.includes('traumprinz') || p.includes('giegling') || p.includes('cassette')) return 'prince_of_denmark';
    if (p.includes('basic channel') || p.includes('phylyps')) return 'basic_channel';
    return this.activeArchetypeId || 'basic_channel';
  }

  _buildDrumLanes(archetypeId, section = 'GROOVE') {
    const empty16 = () => Array.from({ length: 16 }, () => ({ active: false, vel: 0 }));
    const kick = empty16();
    const snare = empty16();
    const clap = empty16();
    const ch = empty16();
    const oh = empty16();
    const perc = empty16();

    if (section === 'DUB BREAKDOWN') {
      // Weightless Berlin/Detroit breakdown: kick drops out except deep bar-1 heartbeat pulse; echoing rim throws float in space!
      kick[0] = { active: true, vel: 90 };
      snare[6] = { active: true, vel: 82 };
      perc[12] = { active: true, vel: 76 };
      ch[2] = { active: true, vel: 44 };
      ch[10] = { active: true, vel: 48 };
      return { kick, snare, clap, ch, oh, perc };
    }

    // Core 4-on-the-floor sub-pressure kick (0, 4, 8, 12)
    [0, 4, 8, 12].forEach((i) => {
      kick[i] = { active: true, vel: section === 'PEAK EUPHORIA' ? 118 : 106 };
    });

    if (section === 'TENSION BUILD') {
      // Driving 16th closed-hat pulse + open-hat lifts on 6 & 14 + tension rim roll on 10, 14, 15!
      [1, 3, 5, 7, 9, 11, 13, 15].forEach((i) => { ch[i] = { active: true, vel: 52 + (i % 4) * 6 }; });
      [2, 10].forEach((i) => { ch[i] = { active: true, vel: 74 }; });
      [6, 14].forEach((i) => { oh[i] = { active: true, vel: 78 }; });
      snare[10] = { active: true, vel: 84 };
      perc[15] = { active: true, vel: 72 };
    } else if (section === 'PEAK EUPHORIA') {
      // Full Peak Berlin/Detroit Groove: Open 909 hats on every upbeat (2, 6, 10, 14) + crisp snare backbeat + ghost 16ths!
      [2, 6, 10, 14].forEach((i) => { oh[i] = { active: true, vel: 88 }; });
      [1, 3, 5, 7, 9, 11, 13, 15].forEach((i) => { ch[i] = { active: true, vel: 48 }; });
      snare[4] = { active: true, vel: 86 };
      snare[12] = { active: true, vel: 92 };
      perc[10] = { active: true, vel: 78 };
    } else {
      // Canonical GROOVE foundation
      if (archetypeId === 'rhythm_sound') {
        [2, 6, 10, 14].forEach((i) => { ch[i] = { active: true, vel: 68 }; });
        oh[10] = { active: true, vel: 72 };
        snare[8] = { active: true, vel: 94 };
      } else {
        [2, 6, 10, 14].forEach((i) => { ch[i] = { active: true, vel: 64 }; });
        ch[7] = { active: true, vel: 38 };
        ch[15] = { active: true, vel: 42 };
        perc[archetypeId === 'basic_channel' ? 10 : 12] = { active: true, vel: 76 };
      }
    }

    return { kick, snare, clap, ch, oh, perc };
  }

  _buildSubBass16(arch, section = 'GROOVE') {
    const bass = Array.from({ length: 16 }, () => ({ active: false, note: arch.subMidi, vel: 92, gate: 0.85, slide: false }));
    const r = arch.subMidi;

    if (section === 'DUB BREAKDOWN') {
      // Deep cavernous whole-bar sub drone pedal on beat 1!
      bass[0] = { active: true, note: r, vel: 98, gate: 6.0, slide: false };
      return bass;
    }

    if (arch.id === 'basic_channel') {
      bass[2]  = { active: true, note: r,      vel: 104, gate: 0.85, slide: false };
      bass[6]  = { active: true, note: r,      vel: 94,  gate: 0.75, slide: false };
      bass[10] = { active: true, note: r + 12, vel: 108, gate: 0.90, slide: true };
      bass[13] = { active: true, note: r - 2,  vel: 86,  gate: 0.70, slide: true };
    } else if (arch.id === 'deepchord' || arch.id === 'fluxion' || arch.id === 'yagya') {
      bass[0]  = { active: true, note: r, vel: 104, gate: 3.2, slide: false };
      bass[9]  = { active: true, note: r, vel: 92,  gate: 2.4, slide: true };
    } else if (arch.id === 'rhythm_sound') {
      bass[0]  = { active: true, note: r,     vel: 112, gate: 1.6, slide: false };
      bass[3]  = { active: true, note: r,     vel: 94,  gate: 1.1, slide: false };
      bass[6]  = { active: true, note: r + 3, vel: 104, gate: 1.4, slide: true };
      bass[9]  = { active: true, note: r + 7, vel: 98,  gate: 1.3, slide: true };
      bass[13] = { active: true, note: r - 2, vel: 90,  gate: 1.2, slide: true };
    } else if (arch.id === 'maurizio') {
      [1, 2, 3, 5, 6, 7, 9, 10, 11, 13, 14, 15].forEach((i) => {
        const semi = i === 10 ? 3 : (i === 14 ? -2 : 0);
        bass[i] = { active: true, note: r + semi, vel: i % 2 === 0 ? 102 : 84, gate: 0.78, slide: i === 10 };
      });
    } else if (arch.id === 'porter_ricks') {
      [2, 6, 10, 14].forEach((i) => {
        bass[i] = { active: true, note: r + (i === 14 ? 1 : 0), vel: 104, gate: 1.2, slide: false };
      });
    } else {
      bass[0]  = { active: true, note: r,     vel: 106, gate: 1.8, slide: false };
      bass[9]  = { active: true, note: r - 5, vel: 102, gate: 2.2, slide: true };
      bass[14] = { active: true, note: r - 2, vel: 84,  gate: 1.0, slide: true };
    }

    // In TENSION BUILD & PEAK EUPHORIA, inject extra octave syncopation on steps 7 & 15 so bass noticeably drives harder!
    if (section === 'TENSION BUILD' || section === 'PEAK EUPHORIA') {
      bass[7]  = { active: true, note: r + 7,  vel: 96,  gate: 0.75, slide: true };
      bass[15] = { active: true, note: r + 12, vel: 106, gate: 0.85, slide: true };
    }
    return bass;
  }

  _buildPrimaryChordStabs14(arch, section = 'GROOVE') {
    // Add lush upper octave/9th extension note in PEAK EUPHORIA!
    const baseNotes = arch.chordIntervals.map((iv) => arch.rootMidi + iv);
    const chordNotes = section === 'PEAK EUPHORIA'
      ? [...baseNotes, arch.rootMidi + 14]
      : baseNotes;
    const steps14 = Array.from({ length: 14 }, () => ({ active: false, notes: chordNotes, vel: 92 }));

    if (section === 'DUB BREAKDOWN') {
      // Sparse deep echoing stab on step 0 & step 9 only so cavern echoes breathe!
      steps14[0] = { active: true, notes: chordNotes, vel: 96 };
      steps14[9] = { active: true, notes: chordNotes, vel: 72 };
      return steps14;
    }

    const hitMap = {
      basic_channel:     [ { s: 0, v: 112 }, { s: 6, v: 92 }, { s: 11, v: 74 } ],
      deepchord:         [ { s: 0, v: 104 }, { s: 8, v: 82 } ],
      rhythm_sound:      [ { s: 2, v: 106 }, { s: 6, v: 98 }, { s: 10, v: 104 } ],
      maurizio:          [ { s: 0, v: 116 }, { s: 3, v: 94 }, { s: 6, v: 106 }, { s: 9, v: 98 }, { s: 12, v: 88 } ],
      fluxion:           [ { s: 0, v: 98 },  { s: 7, v: 84 } ],
      yagya:             [ { s: 0, v: 96 },  { s: 6, v: 78 }, { s: 11, v: 86 } ],
      porter_ricks:      [ { s: 3, v: 118 }, { s: 8, v: 96 }, { s: 13, v: 78 } ],
      prince_of_denmark: [ { s: 0, v: 104 }, { s: 9, v: 88 }, { s: 13, v: 68 } ],
    }[arch.id] || [ { s: 0, v: 108 }, { s: 6, v: 88 } ];

    hitMap.forEach(({ s, v }) => {
      if (s < 14) steps14[s] = { active: true, notes: chordNotes, vel: v };
    });

    if (section === 'TENSION BUILD') {
      steps14[4] = { active: true, notes: chordNotes, vel: 84 };
    } else if (section === 'PEAK EUPHORIA') {
      steps14[3] = { active: true, notes: chordNotes, vel: 92 };
      steps14[9] = { active: true, notes: chordNotes, vel: 96 };
    }
    return steps14;
  }

  _buildSecondaryDyadStabs12(arch, section = 'GROOVE') {
    const steps12 = Array.from({ length: 12 }, () => ({ active: false, note: arch.rootMidi + 7, vel: 72, gate: 0.45 }));
    steps12[4]  = { active: true, note: arch.rootMidi + arch.dyadIntervals[0], vel: section === 'PEAK EUPHORIA' ? 92 : 78, gate: 0.45 };
    steps12[10] = { active: true, note: arch.rootMidi + arch.dyadIntervals[1], vel: 72, gate: 0.42 };
    if (section === 'TENSION BUILD' || section === 'PEAK EUPHORIA') {
      // Add interlocking fifth/ninth call-and-response answers on steps 2 & 8!
      steps12[2] = { active: true, note: arch.rootMidi + arch.dyadIntervals[0] + 5, vel: 84, gate: 0.45 };
      steps12[8] = { active: true, note: arch.rootMidi + arch.dyadIntervals[1] + 5, vel: 88, gate: 0.48 };
    }
    return steps12;
  }

  composeFullArrangement(opts = {}) {
    const archetypeId = opts.archetypeId || this._inferArchetype(opts.prompt);
    this.activeArchetypeId = archetypeId;
    const arch = DUB_ARCHETYPES[archetypeId] || DUB_ARCHETYPES.basic_channel;
    const section = opts.section || 'GROOVE';

    const rootName = NOTE_NAMES[arch.rootMidi % 12];
    const chordNotes = arch.chordIntervals.map((iv) => arch.rootMidi + iv);
    const chordStabSteps = this._buildPrimaryChordStabs14(arch, section);

    const pads = [0, 1, 2, 3].map(() => ({
      active: true,
      name: `${rootName}m9 [${arch.id.toUpperCase()}]`,
      chordName: `${rootName}m9`,
      notes: chordNotes,
      vel: 98,
    }));
    return {
      archetypeId: arch.id,
      archetypeName: arch.name,
      artistRef: arch.artistRef,
      commentary: `${arch.name} (${arch.artistRef}) — Single-chord ${rootName} modal stasis, 16/14/12 polymetric dub engine (${arch.bpm} BPM, ${Math.round(arch.swing * 100)}% swing), RE-201 degrading tape loop & hydrothermal vinyl floor.`,
      section,
      bpm: arch.bpm,
      swing: Math.round(arch.swing * 100),
      rootNote: rootName,
      scale: arch.id === 'porter_ricks' ? 'phrygian' : (arch.id === 'basic_channel' || arch.id === 'rhythm_sound' || arch.id === 'fluxion' || arch.id === 'yagya' ? 'dorian' : 'minor'),
      activeVoices: {
        drums: true,
        moog: true,
        lead: true,
        pads: true,
      },
      programs: arch.arturiaPrograms,
      drums: this._buildDrumLanes(arch.id, section),
      acid: [],
      bass: this._buildSubBass16(arch, section),
      lead: this._buildSecondaryDyadStabs12(arch, section),
      chordStabSteps,
      pads,
      macros: {
        acidCutoff: (arch.stabCutoffHz - 240) / 1400,
        acidRes: arch.stabResonance / 5.0,
        acidEnvMod: arch.stabEnvDepth / 1500,
        acidDecay: arch.stabDecayMs / 500,
        moogCutoff: arch.subCutoffHz / 120,
        leadCutoff: 0.42,
        padCutoff: (arch.stabCutoffHz - 240) / 1400,
        delayMix: arch.delayFeedback,
        reverbMix: arch.reverbWet,
        masterFilter: 0.52,
      },
    };
  }

  evolveArrangement(state, nextSection = 'TENSION BUILD') {
    const arr = this.composeFullArrangement({
      archetypeId: this.activeArchetypeId,
      prompt: state.prompt,
      section: nextSection,
    });
    // Subtle Dub Techno filter & delay send evolution per section (NEVER breaking modal chord stasis!)
    if (nextSection === 'TENSION BUILD') {
      arr.macros.delayMix = Math.min(0.84, arr.macros.delayMix + 0.08);
      arr.macros.padCutoff = Math.min(0.72, arr.macros.padCutoff + 0.10);
    } else if (nextSection === 'DUB BREAKDOWN') {
      arr.macros.reverbMix = Math.min(0.75, arr.macros.reverbMix + 0.14);
      arr.macros.delayMix = Math.min(0.85, arr.macros.delayMix + 0.10);
    }
    return arr;
  }
}

export const AIComposerEngine = AIConductorEngine;
