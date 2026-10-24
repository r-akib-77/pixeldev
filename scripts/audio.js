/* ============================================================
   PixelDev — audio.js
   Tiny synthesized sound system (WebAudio). No audio files
   needed, so missing assets can never break anything.
   Sound is OFF until the user enables it; preference persists.
   ============================================================ */

const SND = (() => {
  "use strict";

  const LS_KEY = "pixeldev.sound";
  let ctx = null;          // AudioContext (lazy)
  let master = null;
  let ambientNodes = [];
  let enabled = false;
  let cricketTimer = null;

  /* ---------- helpers ---------- */
  function now(){ return ctx.currentTime; }

  function ensureCtx(){
    if (ctx) return true;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.5;
      master.connect(ctx.destination);
    } catch (e) { ctx = null; return false; }
    return true;
  }

  /* short envelope blip */
  function blip(freq, freq2, dur, type, vol){
    if (!enabled || !ensureCtx()) return;
    try {
      const t = now();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = type || "square";
      o.frequency.setValueAtTime(freq, t);
      if (freq2) o.frequency.exponentialRampToValueAtTime(Math.max(40, freq2), t + dur);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol || 0.12, t + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(master);
      o.start(t); o.stop(t + dur + 0.05);
    } catch (e) { /* never break the app over sound */ }
  }

  /* soft chord */
  function chord(freqs, dur, vol){
    if (!enabled || !ensureCtx()) return;
    freqs.forEach((f, i) => setTimeout(() => blip(f, f * 0.995, dur, "triangle", (vol || 0.09) / (1 + i * 0.4)), i * 55));
  }

  /* filtered noise burst (footsteps) */
  function noiseBurst(dur, cutoff, vol){
    if (!enabled || !ensureCtx()) return;
    try {
      const t = now();
      const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
      const src = ctx.createBufferSource();
      src.buffer = buf;
      const f = ctx.createBiquadFilter();
      f.type = "lowpass"; f.frequency.value = cutoff;
      const g = ctx.createGain();
      g.gain.setValueAtTime(vol || 0.1, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      src.connect(f); f.connect(g); g.connect(master);
      src.start(t);
    } catch (e) { /* ignore */ }
  }

  /* ---------- ambient night (crickets + water + soft pad) ---------- */
  function stopAmbient(){
    ambientNodes.forEach(n => { try { n.stop ? n.stop() : n.disconnect(); } catch (e) {} });
    ambientNodes = [];
    if (cricketTimer) { clearInterval(cricketTimer); cricketTimer = null; }
  }

  function startAmbient(){
    if (!enabled || !ensureCtx() || ambientNodes.length) return;
    try {
      const t = now();
      /* low warm pad */
      [98, 147.5, 196].forEach((f, i) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = "sine"; o.frequency.value = f;
        g.gain.value = 0.014 / (i + 1);
        const lfo = ctx.createOscillator();
        const lg = ctx.createGain();
        lfo.frequency.value = 0.07 + i * 0.031;
        lg.gain.value = 0.006 / (i + 1);
        lfo.connect(lg); lg.connect(g.gain);
        o.connect(g); g.connect(master);
        o.start(t); lfo.start(t);
        ambientNodes.push(o, lfo);
      });
      /* gentle water/wind noise bed */
      const len = ctx.sampleRate * 2;
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const d = buf.getChannelData(0);
      let last = 0;
      for (let i = 0; i < len; i++){ last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02; d[i] = last * 3; }
      const src = ctx.createBufferSource();
      src.buffer = buf; src.loop = true;
      const f = ctx.createBiquadFilter();
      f.type = "lowpass"; f.frequency.value = 320;
      const g = ctx.createGain(); g.gain.value = 0.05;
      src.connect(f); f.connect(g); g.connect(master);
      src.start(t);
      ambientNodes.push(src);
      /* crickets */
      cricketTimer = setInterval(() => {
        if (!enabled || Math.random() < 0.4) return;
        const base = 3900 + Math.random() * 900;
        for (let k = 0; k < 3; k++){
          setTimeout(() => blip(base, base * 0.98, 0.045, "sine", 0.014), k * 70);
        }
      }, 2400);
    } catch (e) { /* ignore */ }
  }

  /* ---------- public API ---------- */
  const api = {
    get enabled(){ return enabled; },

    init(){
      try { enabled = localStorage.getItem(LS_KEY) === "on"; } catch (e) { enabled = false; }
      return enabled;
    },

    setEnabled(on){
      enabled = !!on;
      try { localStorage.setItem(LS_KEY, enabled ? "on" : "off"); } catch (e) {}
      if (enabled){
        if (ensureCtx() && ctx.state === "suspended") ctx.resume().catch(() => {});
        startAmbient();
      } else {
        stopAmbient();
      }
      return enabled;
    },

    toggle(){ return api.setEnabled(!enabled); },

    /* called on first user gesture anywhere, to satisfy autoplay policy
       if the stored preference was ON */
    kick(){
      if (enabled && ensureCtx() && ctx.state === "suspended") ctx.resume().catch(() => {});
      if (enabled) startAmbient();
    },

    sfx: {
      step(){ noiseBurst(0.05, 900, 0.05); },
      click(){ blip(720, 940, 0.06, "square", 0.07); },
      open(){ chord([523, 659, 784], 0.16, 0.09); },
      close(){ blip(520, 320, 0.1, "triangle", 0.08); },
      warp(){ chord([392, 523, 659, 784], 0.2, 0.08); },
      chime(){ chord([523, 659, 784, 1046, 1318], 0.22, 0.1); },
      denied(){ blip(180, 130, 0.16, "sawtooth", 0.07); }
    }
  };

  return api;
})();
