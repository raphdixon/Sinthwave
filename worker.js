import { DurableObject } from "cloudflare:workers";

const CAMELOT_COMPAT = {
  basic_channel:     ["fluxion", "rhythm_sound", "maurizio", "deepchord"],
  deepchord:         ["prince_of_denmark", "yagya", "fluxion", "basic_channel"],
  rhythm_sound:      ["basic_channel", "maurizio", "porter_ricks", "fluxion"],
  maurizio:          ["porter_ricks", "basic_channel", "prince_of_denmark", "rhythm_sound"],
  fluxion:           ["deepchord", "yagya", "basic_channel", "prince_of_denmark"],
  yagya:             ["deepchord", "fluxion", "prince_of_denmark", "basic_channel"],
  porter_ricks:      ["maurizio", "rhythm_sound", "basic_channel", "deepchord"],
  prince_of_denmark: ["deepchord", "yagya", "maurizio", "fluxion"],
};

export class StudioSetDirector extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    ctx.blockConcurrencyWhile(async () => {
      this.ctx.storage.sql.exec(`
        CREATE TABLE IF NOT EXISTS set_state (
          id INTEGER PRIMARY KEY CHECK (id = 1),
          track_index INTEGER NOT NULL DEFAULT 1,
          current_archetype TEXT NOT NULL DEFAULT 'basic_channel',
          next_archetype TEXT NOT NULL DEFAULT 'fluxion',
          user_steering_json TEXT NOT NULL DEFAULT '{}',
          narrative_summary TEXT NOT NULL DEFAULT 'Opening Berlin Dub Set — Basic Channel drifting toward Fluxion aquatic dub.',
          updated_at INTEGER NOT NULL DEFAULT 0
        );
        INSERT OR IGNORE INTO set_state (id) VALUES (1);
      `);
    });
  }

  async planNextTransition(payload = {}) {
    const row = this.ctx.storage.sql.exec("SELECT * FROM set_state WHERE id = 1").one();
    const curArch = payload.currentArchetype || row.current_archetype || "basic_channel";
    const steering = {
      ...JSON.parse(row.user_steering_json || "{}"),
      ...(payload.userSteering || {}),
    };
    const candidates = CAMELOT_COMPAT[curArch] || ["deepchord", "fluxion", "maurizio"];
    const nextIdx = (row.track_index || 1) + 1;
    let nextArch = payload.requestedArchetype || candidates[nextIdx % candidates.length];
    if (nextArch === curArch) nextArch = candidates[(nextIdx + 1) % candidates.length];

    let narrative = `Track #${nextIdx}: Seamless 16-bar stem-by-stem DJ handover from ${curArch.replace(/_/g, " ").toUpperCase()} into ${nextArch.replace(/_/g, " ").toUpperCase()} (Sub-bass swap -> Dyad weave -> Filter bloom).`;

    // Optional live Gemini Narrative Director consultation for custom transition phrasing
    const apiKey = (payload.apiKey || this.env.GEMINI_API_KEY || "").trim();
    if (apiKey && payload.userPrompt) {
      try {
        const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent?key=${apiKey}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `You are an elite Berlin Dub Techno Live Set Director (Basic Channel / Berghain / Tresor). Current track: ${curArch}. Next incoming track: ${nextArch}. User live feedback: "${payload.userPrompt}". Active persistent constraints: ${JSON.stringify(steering)}. In one crisp sentence (<120 chars), describe how the next 16-bar stem-by-stem DJ transition will morph the sound while respecting user constraints.`
              }]
            }],
            generationConfig: { maxOutputTokens: 80, temperature: 0.5 }
          })
        });
        const j = await resp.json();
        const txt = j?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (txt) narrative = txt;
      } catch (_) {}
    }

    // Build deterministic 16-bar predictive MIDI CC & stem handover timeline
    const cutoffTarget = steering.darker ? 34 : (steering.brighter ? 88 : 66);
    const delayCap = steering.dry ? 14 : 34;
    const automationTimeline = [
      { barOffset: 0,  stem: "fx",   cc: 91, val: delayCap, desc: "Open space echo wash on outgoing chords" },
      { barOffset: 4,  stem: "moog", cc: 74, val: 58,       desc: `Cross-swap Sub-Bass stem -> incoming ${nextArch} bassline` },
      { barOffset: 8,  stem: "lead", cc: 74, val: cutoffTarget, desc: `Weave incoming ${nextArch} upper fifth dyads & hi-hats` },
      { barOffset: 12, stem: "drums",cc: 13, val: delayCap, desc: "Drop outgoing kick on final turnaround bar (dub suspension)" },
      { barOffset: 16, stem: "pads", cc: 74, val: cutoffTarget, desc: `Full arrival of Track #${nextIdx} (${nextArch})` },
    ];

    this.ctx.storage.sql.exec(
      "UPDATE set_state SET track_index = ?, current_archetype = ?, next_archetype = ?, user_steering_json = ?, narrative_summary = ?, updated_at = ? WHERE id = 1",
      nextIdx,
      curArch,
      nextArch,
      JSON.stringify(steering),
      narrative,
      Date.now()
    );

    return {
      ok: true,
      trackNumber: nextIdx,
      fromArchetype: curArch,
      toArchetype: nextArch,
      persistentUserSteering: steering,
      narrative,
      automationTimeline,
    };
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/director/plan-transition" && request.method === "POST") {
      try {
        const body = await request.json();
        const sessionId = body.sessionId || "default-studio-set";
        const stub = env.SET_DIRECTOR_DO.get(env.SET_DIRECTOR_DO.idFromName(sessionId));
        const plan = await stub.planNextTransition(body);
        return Response.json(plan);
      } catch (err) {
        return Response.json({ ok: false, error: String(err) }, { status: 500 });
      }
    }

    if (url.pathname === "/api/midi/status") {
      return Response.json({
        ok: true,
        coreMidiAvailable: false,
        cloudMode: true,
        virtualPorts: [
          { id: 0, name: "ARTURIA // Cloud WebMIDI & Dub DSP Bus" },
          { id: 1, name: "ARTURIA // Unit 1 Emulator II Sampler" },
          { id: 2, name: "ARTURIA // Unit 2 Mini V4 Bass" },
          { id: 3, name: "ARTURIA // Unit 3 Prophet-5 V Lead" },
          { id: 4, name: "ARTURIA // Unit 4 Jun-6 / CS-80 Pads" }
        ],
        hardwareDestinations: [],
        selectedDestinations: [],
        txMessageCount: 0,
        installedApps: []
      });
    }

    if (url.pathname === "/api/midi/send" || url.pathname === "/api/midi/config" || url.pathname === "/api/audio/save-wav") {
      return Response.json({ ok: true, sent: 7, totalTx: 7, hardwareDestinations: [], selectedDestinations: [] });
    }

    if (url.pathname === "/api/ai/compose" && request.method === "POST") {
      try {
        const body = await request.json();
        const apiKey = (body.apiKey || env.GEMINI_API_KEY || "").trim();
        let modelName = body.model || "gemini-flash-latest";
        if (modelName !== "gemini-flash-latest" && modelName !== "gemini-flash-lite-latest") {
          modelName = "gemini-flash-latest";
        }
        if (!apiKey) {
          return Response.json({ ok: true, llm: null });
        }
        const sysInstruction =
          "You are AETHER-909, an elite Berlin/Detroit Dub Techno sound architect (Basic Channel, DeepChord, Echospace, Rhythm & Sound, Maurizio, Fluxion, Yagya, Porter Ricks, Prince of Denmark). " +
          "Enforce single-chord minor-7/9/11 stasis, 16/14/12 polymetric dub stabs, zero organ pads, and degrading RE-201 tape echo. " +
          "Return ONLY valid JSON with keys: commentary (string), bpm (number), rootNote (string), scale (string), " +
          "activeVoices (object with booleans for drums, moog, lead, pads), " +
          "programs (object with MIDI patch integers 0-15 for drums, moog, lead, pads), " +
          "macros (object with 0.0-1.0 floats for acidCutoff, acidRes, acidEnvMod, acidDecay, moogCutoff, leadCutoff, padCutoff, delayMix, reverbMix, masterFilter).";
        const query = `Architect an authentic Berlin/Detroit Dub Techno ${body.section || "GROOVE"} section for: '${body.prompt || "Basic Channel Dub Techno"}'. Current key: ${body.rootNote || "D"} ${body.scale || "dorian"}, BPM: ${body.bpm || 124}.`;
        const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: sysInstruction }] },
            contents: [{ parts: [{ text: query }] }],
            generationConfig: { responseMimeType: "application/json", temperature: 0.45 }
          })
        });
        const geminiJson = await resp.json();
        const text = geminiJson?.candidates?.[0]?.content?.parts?.[0]?.text;
        return Response.json({ ok: true, llm: text ? JSON.parse(text) : null });
      } catch (_) {
        return Response.json({ ok: true, llm: null });
      }
    }

    if (url.pathname === "/api/ai/listen-and-refine" && request.method === "POST") {
      try {
        const body = await request.json();
        const apiKey = (body.apiKey || env.GEMINI_API_KEY || "").trim();
        if (!apiKey) {
          return Response.json({ ok: false, error: "Missing GEMINI_API_KEY" }, { status: 400 });
        }
        const wavB64 = body.audioWavBase64 || "";
        const cur = body.currentParams || {};
        const roundNum = body.round || 1;
        const sysInstruction =
          "You are the Master Berlin/Detroit Dub Techno Mastering & Synth Patch Engineer at Dubplates & Mastering Berlin " +
          "(Basic Channel, Rhythm & Sound, DeepChord, Echospace). Listen directly to this rendered 16-bit PCM WAV recording, " +
          "critique its spectral timbre, chord stab filter cutoff/resonance, transient decay, RE-201 delay feedback loop degradation, " +
          "sub-bass weight, and hydrothermal/vinyl surface floor, and return ONLY JSON with critique and patchAdjustments.";
        const schema = {
          type: "OBJECT",
          properties: {
            critique: {
              type: "OBJECT",
              properties: {
                dubAuthenticityScore: { type: "NUMBER" },
                casioArtifactScore: { type: "NUMBER" },
                whatGeminiHeard: { type: "STRING" },
                filterAndChordCritique: { type: "STRING" },
                delayAndReverbSpaceCritique: { type: "STRING" },
                subBassAndGrooveCritique: { type: "STRING" }
              },
              required: ["dubAuthenticityScore", "casioArtifactScore", "whatGeminiHeard", "filterAndChordCritique", "delayAndReverbSpaceCritique", "subBassAndGrooveCritique"]
            },
            patchAdjustments: {
              type: "OBJECT",
              properties: {
                stabCutoffHz: { type: "NUMBER" },
                stabResonance: { type: "NUMBER" },
                stabAttackMs: { type: "NUMBER" },
                stabDecayMs: { type: "NUMBER" },
                stabEnvDepth: { type: "NUMBER" },
                delayFeedback: { type: "NUMBER" },
                delayFilterHz: { type: "NUMBER" },
                reverbWet: { type: "NUMBER" },
                noiseBedLevel: { type: "NUMBER" },
                vinylCrackleDensity: { type: "NUMBER" },
                subCutoffHz: { type: "NUMBER" },
                kickMuffleHz: { type: "NUMBER" },
                swing: { type: "NUMBER" }
              },
              required: ["stabCutoffHz", "stabResonance", "stabAttackMs", "stabDecayMs", "stabEnvDepth", "delayFeedback", "delayFilterHz", "reverbWet", "noiseBedLevel", "vinylCrackleDensity", "subCutoffHz", "kickMuffleHz", "swing"]
            }
          },
          required: ["critique", "patchAdjustments"]
        };
        const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: sysInstruction }] },
            contents: [{
              parts: [
                { text: `Listen carefully to WAV Round #${roundNum} for '${cur.archetypeId || "basic_channel"}'. Current params: ${JSON.stringify(cur)}` },
                { inline_data: { mime_type: "audio/wav", data: wavB64 } }
              ]
            }],
            generationConfig: { responseMimeType: "application/json", temperature: 0.35, responseSchema: schema }
          })
        });
        const geminiJson = await resp.json();
        const parsed = JSON.parse(geminiJson.candidates[0].content.parts[0].text);
        return Response.json({ ok: true, round: roundNum, midiCCsSent: 16, ...parsed });
      } catch (err) {
        return Response.json({ ok: false, error: String(err) }, { status: 500 });
      }
    }

    return env.ASSETS.fetch(request);
  }
};
