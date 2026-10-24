/* ============================================================
   PixelDev â€” game.js
   Lightweight game engine: requestAnimationFrame loop, keyboard
   + touch input, normalized diagonal movement, AABB collision,
   camera (fit on desktop / follow on touch), hotspots proximity,
   and ambient FX (water shimmer, glows, fireflies, petals,
   cat frames, flickering code screens, digital clock).
   Rendering is canvas-only; all UI is DOM (see ui.js).
   ============================================================ */

const GAME = (() => {
  "use strict";

  let data = null;                 // built world (WORLD.build())
  let canvas = null, ctx = null;
  let cssW = 0, cssH = 0, dpr = 1;
  let cam = { x: 0, y: 0, s: 1 };  // world coords at top-left + scale (css px per world px)

  const player = {
    x: 484, y: 330, dir: "down",
    moving: false, animT: 0, frameIdx: 0,
    speed: 92, sprites: null, shadow: null
  };

  let keys = new Set();
  let touchDir = null;             // "up"|"down"|"left"|"right"|null
  let paused = false;
  let hidden = false;
  let reduced = false;
  let raf = 0;
  let lastT = 0;
  let elapsed = 0;

  /* callbacks wired by ui.js/main.js */
  const cb = { onHotspot: null, onNear: null, onFrame: null };

  /* FX state */
  let fireflies = [], petals = [];
  let catT = 0, catFrame = 0;
  let screenT = 0, screenIdx = 0;
  let clockCanvas = null;
  let nearSpot = null;
  let nearCheckT = 0;

  /* ================================================================
     INIT
     ================================================================ */
  function init(canvasEl){
    canvas = canvasEl;
    ctx = canvas.getContext("2d");
    data = WORLD.build();
    player.sprites = ART.buildCharSprites();
    bakeGlowSprites();
    player.shadow = ART.bake(26, 12, g => {
      const grd = g.createRadialGradient(13, 6, 1, 13, 6, 12);
      grd.addColorStop(0, "rgba(4,7,18,.45)");
      grd.addColorStop(1, "rgba(4,7,18,0)");
      g.fillStyle = grd;
      g.fillRect(0, 0, 26, 12);
    });
    reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduced){
      /* static particles: still visible but frozen */
      for (let i = 0; i < 12; i++) fireflies.push(newFirefly(true));
      for (let i = 0; i < 8; i++) petals.push(newPetal(true));
    }

    clockCanvas = ART.bake(24, 10, g => {});
    drawClock();

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", () => keys.clear());
    document.addEventListener("visibilitychange", () => {
      hidden = document.hidden;
      if (!hidden){ lastT = 0; if (!paused) start(); }
    });
    window.addEventListener("resize", resize);
    resize();
    lastT = 0;
    start();
    return data;
  }

  function resize(){
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    cssW = Math.max(1, rect.width);
    cssH = Math.max(1, rect.height);
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    /* keep CSS size pinned to the stage, independent of attribute size */
    canvas.style.width = cssW + "px";
    canvas.style.height = cssH + "px";
    updateCamera();
  }

  /* ---------------- camera ---------------- */
  function updateCamera(){
    const W = data.W, H = data.H;
    if (!isTouch()){
      /* fit whole world, cover viewport but never crop the room */
      const cover = Math.max(cssW / W, cssH / H);
      const fit   = Math.min(cssW / W, cssH / H);
      const roomFit = Math.min(
        (cssW - 16) / (data.ROOM.x1 - data.ROOM.x0 + 60),
        (cssH - 16) / (data.ROOM.y1 - data.ROOM.y0 + 60)
      );
      const s = Math.max(fit, Math.min(cover, roomFit));
      cam.s = s;
      cam.x = (W - cssW / s) / 2;
      cam.y = (H - cssH / s) / 2;
      /* never leave world bounds */
      cam.x = Math.max(0, Math.min(W - cssW / s, cam.x));
      cam.y = Math.max(0, Math.min(H - cssH / s, cam.y));
    } else {
      /* mobile: zoom in a bit and follow the player */
      let s = Math.min(
        cssW / (data.ROOM.x1 - data.ROOM.x0 + 80),
        cssH / (data.ROOM.y1 - data.ROOM.y0 + 40)
      ) * 1.3;
      /* guarantee the world covers the viewport in both axes (no black voids) */
      s = Math.max(s, cssW / data.W, cssH / data.H);
      cam.s = s;
      followPlayer();
    }
  }
  function followPlayer(){
    const vw = cssW / cam.s, vh = cssH / cam.s;
    let tx = player.x - vw / 2, ty = player.y - vh / 2 - 10;
    tx = Math.max(0, Math.min(data.W - vw, tx));
    ty = Math.max(0, Math.min(data.H - vh, ty));
    cam.x = tx; cam.y = ty;
  }
  function isTouch(){ return document.body.classList.contains("touch"); }

  /* ================================================================
     INPUT
     ================================================================ */
  const KEYMAP = {
    w: "up", W: "up", ArrowUp: "up",
    s: "down", S: "down", ArrowDown: "down",
    a: "left", A: "left", ArrowLeft: "left",
    d: "right", D: "right", ArrowRight: "right"
  };
  function onKeyDown(e){
    if (e.key === "e" || e.key === "E"){
      if (cb.onHotspot && nearSpot && !paused) cb.onHotspot(nearSpot);
      return;
    }
    const dir = KEYMAP[e.key];
    if (dir){ keys.add(dir); e.preventDefault(); }
  }
  function onKeyUp(e){
    const dir = KEYMAP[e.key];
    if (dir) keys.delete(dir);
  }
  function setTouchDir(dir){
    touchDir = dir;
    if (dir) unlockFirstMove();
  }

  /* ================================================================
     MOVEMENT + COLLISION
     ================================================================ */
  function currentDirInput(){
    let dx = 0, dy = 0;
    if (keys.has("up")) dy -= 1;
    if (keys.has("down")) dy += 1;
    if (keys.has("left")) dx -= 1;
    if (keys.has("right")) dx += 1;
    if (touchDir){
      if (touchDir === "up") dy = -1;
      else if (touchDir === "down") dy = 1;
      else if (touchDir === "left") dx = -1;
      else if (touchDir === "right") dx = 1;
    }
    return [dx, dy];
  }

  function blocked(x, y){
    /* feet box: 10x6 centered at (x, y) */
    const fx0 = x - 5, fy0 = y - 6, fx1 = x + 5, fy1 = y;
    for (const s of data.SOLIDS){
      if (fx0 < s.x + s.w && fx1 > s.x && fy0 < s.y + s.h && fy1 > s.y) return true;
    }
    /* world bounds */
    if (x < 6 || y < 10 || x > data.W - 6 || y > data.H - 2) return true;
    return false;
  }

  function move(dt){
    const [dx, dy] = currentDirInput();
    const moving = dx !== 0 || dy !== 0;
    player.moving = moving;
    if (moving){
      unlockFirstMove();
      /* normalize diagonal speed */
      const n = Math.hypot(dx, dy);
      const vx = dx / n * player.speed, vy = dy / n * player.speed;
      /* axis-separated sweep so we slide along walls */
      if (dx !== 0 && !blocked(player.x + vx * dt, player.y)) player.x += vx * dt;
      if (dy !== 0 && !blocked(player.x, player.y + vy * dt)) player.y += vy * dt;
      /* facing */
      if (Math.abs(dx) >= Math.abs(dy) && dx !== 0) player.dir = dx < 0 ? "left" : "right";
      else if (dy !== 0) player.dir = dy < 0 ? "up" : "down";
      /* walk animation */
      player.animT += dt;
      if (player.animT > 0.13){ player.animT = 0; player.frameIdx = (player.frameIdx + 1) % 4; }
      if (Math.random() < 0.06) SND.sfx.step();
    } else {
      player.frameIdx = 0;
      player.animT = 0;
    }
  }

  let movedOnce = false;
  function unlockFirstMove(){
    if (movedOnce) return;
    movedOnce = true;
    try { localStorage.setItem("pixeldev.ach.first", "1"); } catch (e) {}
  }

  /* ================================================================
     HOTSPOT PROXIMITY
     ================================================================ */
  function checkNear(){
    const px0 = player.x - 5 - 24, py0 = player.y - 6 - 24;
    const px1 = player.x + 5 + 24, py1 = player.y + 24;
    let best = null, bestD = 1e9;
    for (const h of data.HOTSPOTS){
      for (const r of h.rects){
        if (px0 < r.x + r.w && px1 > r.x && py0 < r.y + r.h && py1 > r.y){
          const d = Math.hypot(player.x - (r.x + r.w / 2), player.y - (r.y + r.h / 2));
          if (d < bestD){ bestD = d; best = h; }
        }
      }
    }
    if (best !== nearSpot){
      nearSpot = best;
      if (cb.onNear) cb.onNear(nearSpot);
    }
  }
  function interactNearest(){
    if (nearSpot && cb.onHotspot && !paused) cb.onHotspot(nearSpot);
    else SND.sfx.denied();
  }

  /* ================================================================
     FX
     ================================================================ */
  function newFirefly(still){
    const z = data.FIREFLY_ZONES[(Math.random() * data.FIREFLY_ZONES.length) | 0];
    return {
      x: z.x + Math.random() * z.w, y: z.y + Math.random() * z.h,
      t: Math.random() * 10, sp: 0.3 + Math.random() * 0.5,
      drift: Math.random() * Math.PI * 2, still: !!still
    };
  }
  function newPetal(still){
    return {
      x: data.PETAL_ZONE.x + Math.random() * data.PETAL_ZONE.w,
      y: data.PETAL_ZONE.y + Math.random() * data.PETAL_ZONE.h,
      t: Math.random() * 10, sp: 9 + Math.random() * 7, still: !!still
    };
  }

  let glowWarm = null, glowCool = null, glowFirefly = null, petalSprite = null;
  function bakeGlowSprites(){
    glowWarm = ART.glowSpriteRGBA(96, "255,180,84");
    glowCool = ART.glowSpriteRGBA(96, "130,180,255");
    glowFirefly = ART.glowSpriteRGBA(24, "216,255,158");
    petalSprite = ART.bake(5, 4, g => {
      ART.R(g, 1, 0, 3, 1, "#ffb8d0"); ART.R(g, 0, 1, 5, 2, "#ff9fc0"); ART.R(g, 1, 3, 3, 1, "#e8799e");
    });
  }

  function drawClock(){
    const d = new Date();
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    clockCanvas = ART.bake(22, 6, g => {
      ART.text3(g, 0, 0, hh + ":" + mm, "#ff5f57", 1);
    });
  }

  /* ================================================================
     RENDER
     ================================================================ */
  function draw(){
    const s = cam.s * dpr;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = "#071227";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    /* snap camera to device pixels for crisp alignment */
    const ox = Math.round(cam.x * s) / s, oy = Math.round(cam.y * s) / s;
    ctx.setTransform(s, 0, 0, s, -ox * s, -oy * s);

    /* static world */
    ctx.drawImage(data.canvas, 0, 0);

    /* ---- water shimmer ---- */
    if (!reduced){
      ctx.save();
      for (const sp of data.seeds){
        const a = Math.pow(Math.abs(Math.sin(elapsed * sp.speed + sp.phase)), 6) * 0.55;
        if (a < 0.04) continue;
        ctx.globalAlpha = a;
        ctx.fillStyle = "#5d86e8";
        ctx.fillRect(sp.x, sp.y, 3, 1);
      }
      ctx.restore();
    }

    /* ---- sleeping cat frames ---- */
    ctx.drawImage(data.cat[catFrame], data.catPos.x, data.catPos.y);

    /* ---- flickering monitor code ---- */
    for (const sc of data.screens){
      const v = sc.variants[(screenIdx + sc.rect.x) % sc.variants.length];
      ctx.drawImage(v, sc.rect.x, sc.rect.y);
    }

    /* ---- digital clock ---- */
    ctx.drawImage(clockCanvas, 607, 89);

    /* ---- glows (additive) ---- */
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const puls = reduced ? 0.8 : (0.72 + Math.sin(elapsed * 2.1) * 0.14);
    for (const gl of data.GLOWS){
      const img = gl.rgb.startsWith("255,180") ? glowWarm : glowCool;
      const a = gl.flick ? puls + Math.sin(elapsed * 9 + gl.x) * gl.flick : puls;
      ctx.globalAlpha = Math.max(0.1, Math.min(1, a * 0.55));
      ctx.drawImage(img, gl.x - gl.r / 2, gl.y - gl.r / 2, gl.r, gl.r);
    }
    ctx.restore();

    /* ---- player shadow + sprite ---- */
    const spr = player.sprites[player.dir];
    const f = [ "idle", "a", "idle", "b" ][player.frameIdx];
    /* drawn a touch larger (4/3) than the baked 12x20 sprite for presence */
    const pw = 16, ph = 26;
    ctx.drawImage(player.shadow, player.x - 14, player.y - 4, 28, 12);
    ctx.drawImage(spr[f], Math.round(player.x - pw / 2), Math.round(player.y - ph + 1), pw, ph);

    /* ---- fireflies + petals ---- */
    if (fireflies.length){
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      for (const ff of fireflies){
        const a = reduced ? 0.5 : (0.35 + Math.sin(elapsed * ff.sp * 3 + ff.t) * 0.35);
        if (a <= 0.05) continue;
        ctx.globalAlpha = a;
        ctx.drawImage(glowFirefly, ff.x - 12, ff.y - 12, 24, 24);
        ctx.globalAlpha = Math.min(1, a + 0.3);
        ctx.fillStyle = "#eaffc0";
        ctx.fillRect(ff.x, ff.y, 1.6, 1.6);
      }
      ctx.restore();
    }
    if (petals.length){
      ctx.save();
      ctx.globalAlpha = 0.8;
      for (const pt of petals) ctx.drawImage(petalSprite, pt.x, pt.y);
      ctx.restore();
    }

    /* frame callback for DOM overlay positioning */
    if (cb.onFrame) cb.onFrame();
  }

  /* ================================================================
     LOOP
     ================================================================ */
  function start(){
    if (raf) return;
    lastT = 0;
    raf = requestAnimationFrame(loop);
  }
  function stop(){ if (raf){ cancelAnimationFrame(raf); raf = 0; } }

  function loop(t){
    raf = requestAnimationFrame(loop);
    if (!lastT){ lastT = t; return; }
    let dt = (t - lastT) / 1000;
    lastT = t;
    if (dt > 0.12) dt = 0.12;

    if (!paused){
      elapsed += dt;
      move(dt);
      checkNear();
      if (isTouch()) followPlayer();
      /* fx timers */
      if (!reduced){
        catT += dt; if (catT > 1.4){ catT = 0; catFrame = 1 - catFrame; }
        screenT += dt; if (screenT > 0.85){ screenT = 0; screenIdx++; }
        /* move fireflies */
        for (const ff of fireflies){
          ff.t += dt * ff.sp;
          ff.x += Math.cos(ff.drift + ff.t) * 6 * dt;
          ff.y += Math.sin(ff.drift * 1.7 + ff.t * 1.3) * 4 * dt;
        }
        /* petals fall */
        for (const pt of petals){
          pt.y += pt.sp * dt;
          pt.x += Math.sin(pt.y * 0.06 + pt.t) * 12 * dt;
          if (pt.y > data.H - 30) { Object.assign(pt, newPetal(false)); pt.y = data.PETAL_ZONE.y; }
        }
      } else {
        for (const pt of petals) if (pt.y > data.H - 30) Object.assign(pt, newPetal(true));
      }
      const d = new Date();
      if (d.getSeconds() === 0) drawClock();
    }
    draw();
  }

  /* ================================================================
     PUBLIC API
     ================================================================ */
  return {
    init,
    resize,
    setPaused(p){
      paused = !!p;
      if (paused) keys.clear();
    },
    isPaused(){ return paused; },
    setTouchDir,
    interactNearest,
    get nearSpot(){ return nearSpot; },
    get player(){ return player; },
    get worldData(){ return data; },
    get cam(){ return cam; },
    /** world coords -> css px within the canvas */
    toScreen(wx, wy){
      return { x: (wx - cam.x) * cam.s, y: (wy - cam.y) * cam.s };
    },
    warp(x, y){
      const p = WORLD.findFree(data, x, y);
      player.x = p[0]; player.y = p[1];
      if (isTouch()) followPlayer();
      SND.sfx.warp();
    },
    /** register hotspot callbacks */
    on(h){ Object.assign(cb, h); }
  };
})();


