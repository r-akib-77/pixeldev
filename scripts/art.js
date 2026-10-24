/* ============================================================
   PixelDev — art.js
   Procedural pixel-art: drawing primitives, palette, sprite
   maps (character, cat), a 3x5 micro-font, and baked scenery
   (project thumbnails, portraits, poster art, contact scene).
   Everything is painted in code — no image assets needed.
   ============================================================ */

const ART = (() => {
  "use strict";

  /* ---------------- master palette ---------------- */
  const P = {
    // water
    water0: "#0a1f4d", water1: "#0c2a63", water2: "#123a86", waterGlint: "#3f6fd1",
    // ground
    grass0: "#3c5a2e", grass1: "#456634", grass2: "#2f4724", grassDark: "#26391c",
    path: "#8a6f4d",
    stone: "#5c6474", stoneLit: "#79839a", stoneDark: "#3e4553",
    // house
    floor0: "#9a6a3d", floor1: "#8a5c34", floor2: "#7c5230", floorLine: "#6b4626",
    wallWood: "#5a3d28", wallWood2: "#4a3120", wallTrim: "#3a2718",
    wallStone: "#3f4454", wallStone2: "#333846",
    wood: "#8a5a34", wood2: "#6e4626", wood3: "#54341c", woodLit: "#a8743f",
    // fabric
    bedBlue: "#3f5fae", bedBlue2: "#35509a", bedBlue3: "#2c437e",
    sofaBlue: "#3f5fae", sofaBlue2: "#34519c",
    rugIndigo: "#2c3f77", rugIndigo2: "#243463", rugGold: "#caa23f",
    // accents
    gold: "#ffd24a", gold2: "#d9a321", gold3: "#a97b12",
    cyan: "#5cc8ff", green: "#6fbf4a", green2: "#4f8f34", green3: "#396626",
    pink: "#ff8fb3", pink2: "#e06b93",
    coral: "#ff7a6b",
    cream: "#f2ead8", white: "#f4f6ff",
    night: "#0a1226", night2: "#101a30",
    glowWarm: "#ffb454", glowCool: "#7fb8ff",
    leafPot: "#7a4a2a", terracotta: "#a05a34", terracotta2: "#7c4223"
  };

  /* ---------------- primitives ---------------- */
  function px(g, x, y, c){ g.fillStyle = c; g.fillRect(x | 0, y | 0, 1, 1); }
  function R(g, x, y, w, h, c){ g.fillStyle = c; g.fillRect(x | 0, y | 0, w | 0, h | 0); }
  function frame(g, x, y, w, h, c){
    R(g, x, y, w, 1, c); R(g, x, y + h - 1, w, 1, c);
    R(g, x, y, 1, h, c); R(g, x + w - 1, y, 1, h, c);
  }
  function dither(g, x, y, w, h, c, step, off){
    step = step || 2; off = off || 0;
    for (let iy = 0; iy < h; iy++)
      for (let ix = 0; ix < w; ix++)
        if ((ix + iy + off) % step === 0) px(g, x + ix, y + iy, c);
  }
  /* deterministic pseudo-random */
  function rng(seed){
    let s = seed >>> 0 || 1;
    return function(){
      s ^= s << 13; s ^= s >> 17; s ^= s << 5; s >>>= 0;
      return s / 4294967296;
    };
  }
  function noiseFill(g, x, y, w, h, colors, seed, density){
    const r = rng(seed);
    for (let iy = 0; iy < h; iy++)
      for (let ix = 0; ix < w; ix++)
        if (r() < (density || 0.12)) px(g, x + ix, y + iy, colors[(r() * colors.length) | 0]);
  }
  /* filled pixel circle */
  function disc(g, cx, cy, rad, c){
    for (let iy = -rad; iy <= rad; iy++){
      const dx = Math.floor(Math.sqrt(rad * rad - iy * iy) + 0.5);
      R(g, cx - dx, cy + iy, dx * 2 + 1, 1, c);
    }
  }
  function discRing(g, cx, cy, rad, c){
    for (let a = 0; a < 64; a++){
      const t = a / 64 * Math.PI * 2;
      px(g, Math.round(cx + Math.cos(t) * rad), Math.round(cy + Math.sin(t) * rad), c);
    }
  }
  function blob(g, cx, cy, rx, ry, c){
    for (let iy = -ry; iy <= ry; iy++){
      const t = 1 - (iy * iy) / (ry * ry);
      if (t < 0) continue;
      const dx = Math.floor(Math.sqrt(t) * rx + 0.5);
      R(g, cx - dx, cy + iy, dx * 2 + 1, 1, c);
    }
  }
  /* soft drop shadow under furniture */
  function shadow(g, x, y, w, h){
    g.save();
    g.globalAlpha = 0.28;
    blob(g, x + w / 2, y + h / 2, w / 2, h / 2, "#060a18");
    g.globalAlpha = 0.18;
    blob(g, x + w / 2, y + h / 2, w / 2 + 2, h / 2 + 1, "#060a18");
    g.restore();
  }

  function bake(w, h, painter){
    const c = document.createElement("canvas");
    c.width = w; c.height = h;
    const g = c.getContext("2d");
    g.imageSmoothingEnabled = false;
    painter(g);
    return c;
  }

  /* bake sprite from string rows with a palette map */
  function fromMaps(rows, pal, mirror){
    const w = Math.max(...rows.map(r => r.length));
    const h = rows.length;
    const c = bake(w, h, g => {
      rows.forEach((row, y) => {
        for (let x = 0; x < row.length; x++){
          const ch = row[x];
          if (ch === "." || ch === " ") continue;
          const col = pal[ch];
          if (col) px(g, x, y, col);
        }
      });
    });
    if (!mirror) return c;
    return bake(w, h, g => {
      g.imageSmoothingEnabled = false;
      g.translate(w, 0); g.scale(-1, 1);
      g.drawImage(c, 0, 0);
    });
  }

  /* ================= 3x5 MICRO FONT ================= */
  const FONT3 = {
    "A":["010","101","111","101","101"], "B":["111","101","110","101","110"],
    "C":["011","100","100","100","011"], "D":["110","101","101","101","110"],
    "E":["111","100","110","100","111"], "F":["111","100","110","100","100"],
    "G":["011","100","101","101","011"], "H":["101","101","111","101","101"],
    "I":["111","010","010","010","111"], "J":["011","001","001","101","010"],
    "K":["101","110","100","110","101"], "L":["100","100","100","100","111"],
    "M":["101","111","111","101","101"], "N":["101","111","111","111","101"],
    "O":["010","101","101","101","010"], "P":["110","101","110","100","100"],
    "Q":["010","101","101","110","011"], "R":["110","101","110","110","101"],
    "S":["011","100","010","001","110"], "T":["111","010","010","010","010"],
    "U":["101","101","101","101","111"], "V":["101","101","101","010","010"],
    "W":["101","101","111","111","101"], "X":["101","101","010","101","101"],
    "Y":["101","101","010","010","010"], "Z":["111","001","010","100","111"],
    "0":["111","101","101","101","111"], "1":["010","110","010","010","111"],
    "2":["111","001","111","100","111"], "3":["111","001","011","001","111"],
    "4":["101","101","111","001","001"], "5":["111","100","111","001","111"],
    "6":["111","100","111","101","111"], "7":["111","001","010","010","010"],
    "8":["111","101","111","101","111"], "9":["111","101","111","001","111"],
    ".":["000","000","000","000","010"], ":":["000","010","000","010","000"],
    ">":["100","010","001","010","100"], "<":["001","010","100","010","001"],
    "-":["000","000","111","000","000"], "!":["010","010","010","000","010"],
    "'":["010","010","000","000","000"], "/":["001","001","010","100","100"],
    "+":["000","010","111","010","000"], "?":["110","001","010","000","010"],
    " ": ["000","000","000","000","000"]
  };
  function text3(g, x, y, str, c, scale){
    scale = scale || 1;
    let cx = x;
    for (const ch of str.toUpperCase()){
      const m = FONT3[ch] || FONT3[" "];
      for (let ry = 0; ry < 5; ry++)
        for (let rx = 0; rx < 3; rx++)
          if (m[ry][rx] === "1")
            R(g, cx + rx * scale, y + ry * scale, scale, scale, c);
      cx += 4 * scale;
    }
    return cx - x;
  }
  function text3w(str, scale){ scale = scale || 1; return str.length * 4 * scale - scale; }

  /* ================= CHARACTER SPRITES ================= */
  /* 12x20, feet at bottom. Walk frames swap leg rows. */
  const CP = {
    O:"#171a2e", H:"#23263f", h:"#31365a",
    S:"#f6cba0", s:"#d9a06d", E:"#181a30",
    J:"#2e3254", j:"#3d4270", K:"#23263f",
    T:"#3a4468", W:"#efeef8", w:"#b9b6cf"
  };

  const HEAD_DOWN = [
    "...OOOOOO...",
    "..OHHHHHHO..",
    ".OHHHHHHHHO.",
    ".OHHHHHHHHO.",
    ".OHhHHHHhHO.",
    ".OHHHHHHHHO.",
    ".OHSESSESHO.",
    ".OSSSSSSSSO.",
    ".OSsSSSSsSO.",
    "..OsSSSSsO.."
  ];
  const HEAD_UP = [
    "...OOOOOO...",
    "..OHHHHHHO..",
    ".OHHHHHHHHO.",
    ".OHHHHHHHHO.",
    ".OHhHHHHhHO.",
    ".OHHHHHHHHO.",
    ".OHhHHHHhHO.",
    ".OHHHHHHHHO.",
    ".OHHHHHHHHO.",
    "..OHHHHHHO.."
  ];
  const HEAD_SIDE = [
    "...OOOOOO...",
    "..OHHHHHHO..",
    ".OHHHHHHHHO.",
    ".OHHHHHHHHO.",
    ".OHHHHHHHHO.",
    ".OHHHHSSSSO.",
    ".OHHHHSSESO.",
    ".OHHSSSSSSO.",
    ".OHSSSSSsSO.",
    "..OSSSSSsO.."
  ];
  const BODY_FRONT = [
    ".OJJJJJJJJO.",
    "OJJJJJJJJJJO",
    "OJjJJJJJJjJO",
    "OJjJJJJJJjJO",
    "OJjJJkkJJjJO",
    ".OKKKKKKKKO."
  ];
  const BODY_SIDE = [
    ".OJJJJJJJJO.",
    "OJJJJJJJJJJO",
    "OJjJJJJJJjJO",
    "OJjJJJJJJjJO",
    "OJjJJJJJJjJO",
    ".OKKKKKKKKO."
  ];
  const LEGS_IDLE = [
    ".OTTTTTTTTO.",
    ".OTTTTTTTTO.",
    ".OWWWOWWWO..",
    ".OwwwOwwwO.."
  ];
  const LEGS_A = [          /* left foot planted, right foot raised */
    ".OTTTOWWWO..",
    ".OTTTOwwwO..",
    ".OWWWO......",
    ".OwwwO......"
  ];
  const LEGS_B = [          /* right foot planted, left foot raised */
    ".OWWWOTTTTO.",
    ".OwwwOTTTTO.",
    "......OWWWO.",
    "......OwwwO."
  ];
  const LEGS_SIDE_IDLE = [
    ".OTTTTTTTTO.",
    ".OTTTTTTTTO.",
    ".OwWWWWWwO..",
    "..OwwwwwO..."
  ];
  const LEGS_SIDE_A = [
    ".OTTTTTTTTO.",
    ".OTT...TTTO.",
    ".OWWw..WWWO.",
    ".Oww...wwwO."
  ];
  const LEGS_SIDE_B = [
    ".OTTTTTTTTO.",
    ".OTTT...TTO.",
    ".OWWW..wWWO.",
    ".Owww...wwO."
  ];

  function charFrame(head, body, legs){
    return fromMaps(head.concat(body).concat(legs), CP);
  }
  function buildCharSprites(){
    const mk = (head, body, l0, l1, l2) => ({
      idle: charFrame(head, body, l0),
      a:    charFrame(head, body, l1),
      b:    charFrame(head, body, l2)
    });
    const front = mk(HEAD_DOWN, BODY_FRONT, LEGS_IDLE, LEGS_A, LEGS_B);
    const back  = mk(HEAD_UP,   BODY_FRONT, LEGS_IDLE, LEGS_A, LEGS_B);
    const sideR = mk(HEAD_SIDE, BODY_SIDE,  LEGS_SIDE_IDLE, LEGS_SIDE_A, LEGS_SIDE_B);
    /* left = mirrored right */
    const sideL = {
      idle: bake(12, 20, g => { g.imageSmoothingEnabled=false; g.translate(12,0); g.scale(-1,1); g.drawImage(sideR.idle,0,0); }),
      a:    bake(12, 20, g => { g.imageSmoothingEnabled=false; g.translate(12,0); g.scale(-1,1); g.drawImage(sideR.a,0,0); }),
      b:    bake(12, 20, g => { g.imageSmoothingEnabled=false; g.translate(12,0); g.scale(-1,1); g.drawImage(sideR.b,0,0); })
    };
    return { down: front, up: back, right: sideR, left: sideL };
  }

  /* head-only portrait sprite (front-facing, cropped) */
  function headPortrait(size, scale){
    return bake(size, size, g => {
      /* night window backdrop */
      const grd = g.createLinearGradient(0, 0, 0, size);
      grd.addColorStop(0, "#0d1c46"); grd.addColorStop(1, "#1c1038");
      g.fillStyle = grd; g.fillRect(0, 0, size, size);
      /* moon */
      disc(g, size * 0.72, size * 0.2, size * 0.11, "#f4f0d8");
      disc(g, size * 0.74, size * 0.18, size * 0.04, "#d8d4bc");
      /* stars */
      const r = rng(77);
      for (let i = 0; i < 14; i++) px(g, (r() * size) | 0, (r() * size * 0.6) | 0, "rgba(230,240,255,.8)");
      /* city dots */
      R(g, 0, size * 0.52, size, size * 0.12, "#0a1230");
      const r2 = rng(31);
      for (let i = 0; i < 22; i++) px(g, (r2() * size) | 0, size * (0.55 + r2() * 0.08), "#ffd24a");
      /* shoulders + head (scaled head map, bottom-cropped) */
      const head = fromMaps(HEAD_DOWN, CP);
      const s = size / 20;      /* draw head block covering lower 3/4 */
      g.imageSmoothingEnabled = false;
      /* hoodie shoulders */
      R(g, size * 0.08, size * 0.78, size * 0.84, size * 0.22, CP.J);
      R(g, size * 0.02, size * 0.86, size * 0.2, size * 0.14, CP.J);
      R(g, size * 0.78, size * 0.86, size * 0.2, size * 0.14, CP.J);
      R(g, size * 0.08, size * 0.78, size * 0.84, 1, "#171a2e");
      const hw = head.width * s * 1.15;
      g.drawImage(head, 0, 0, head.width, 10, size / 2 - hw / 2, size * 0.2 - 2, hw, 10 * s * 1.15);
    });
  }

  /* ================= CAT (sleeping, 2 frames) ================= */
  /* ================= CAT ================= */
  /* crisp sleeping ginger loaf, 40x24 footprint — [y, x, runs…] spans */
  const CAT_ART = [
    [3, 27, "KK"],
    [3, 34, "KK"],
    [4, 26, "KPBK"],
    [4, 33, "KPBK"],
    [5, 26, "KBBK"],
    [5, 33, "KBBK"],
    [6, 27, "KKKKKKKKKK"],
    [7, 26, "KBBBDBDBBBBK"],
    [8, 26, "KBBBBBBBBBBK"],
    [9, 14, "KKKKKKKKKKKK"],
    [9, 26, "KBBBBBBBBBBK"],
    [10, 12, "KLLLLLLLLLLLLLKBEBBBBEBEBK"],
    [11, 11, "KBDDBBDDBBDDBBBKBBEBBBBBEBK"],
    [12, 10, "KBBDDBBDDBBDDBBBKBBCCNNCCCBK"],
    [13, 9, "KBBBDDBBDDBBDDBBBKBBCCCCCCCBK"],
    [14, 8, "KBBBBDDBBDDBBDDBBBKCCCCECECCBK"],
    [15, 7, "KBBBBBBBBBBBBBBBBBBKKKKKKKKKK"],
    [16, 8, "KBBBBBBBBBBBBBBBBBBBBCCCCBK"],
    [17, 8, "KBBBBBBBBBBBBBBBBBBBBCCCCBBK"],
    [18, 9, "KBBBBBBBBBBBDDDDDDCCCCBBK"],
    [19, 10, "KDDDDDDDDDDDDDDDDCCCCBK"],
    [20, 11, "KKKKKKKKKKKKKKKKKKKKK"]
  ];
  const CAT_PAL = {
    K: "#6b3d10", B: "#e8a84e", L: "#f6c979", D: "#c9832f",
    C: "#f6e3c0", P: "#f0b1a6", N: "#e2726a", E: "#4a2c10"
  };
  function paintCat(g, ox, oy, frame){
    /* map spans */
    CAT_ART.forEach(([y, x, s]) => {
      for (let i = 0; i < s.length; i++){
        const col = CAT_PAL[s[i]];
        if (col) px(g, ox + x + i, oy + y, col);
      }
    });
    /* tail tip — resting vs lifted (breathing beat) */
    if (frame === 0){
      px(g, ox + 24, oy + 15, CAT_PAL.D);
      px(g, ox + 24, oy + 16, CAT_PAL.D);
      px(g, ox + 25, oy + 16, CAT_PAL.D);
    } else {
      px(g, ox + 25, oy + 13, CAT_PAL.D);
      px(g, ox + 25, oy + 14, CAT_PAL.D);
      px(g, ox + 25, oy + 15, CAT_PAL.D);
    }
    /* sleepy ear twitch on frame 1 */
    if (frame === 1) px(g, ox + 27, oy + 4, CAT_PAL.B);
    /* soft ground shadow */
    shadow(g, ox + 6, oy + 21, 28, 3);
  }
  function catFrames(w, h){
    return [0, 1].map(f => bake(w, h, g => paintCat(g, 0, 0, f)));
  }

  /* ================= POSTER ART MAPS ================= */
  function paintSkull(g, x, y, s){
    const rows = [
      ".OOOOOOO.",
      "OOOOOOOOO",
      "OBBOOOBBO",   /* brow */
      "OEEEOEEEO",   /* eyes */
      "OOOOEOOOO",   /* nose */
      "OOOOOOOOO",
      ".OEOEOEO.",
      ".OOOOOOO.",
      "..O.O.O.."
    ];
    const pal = { O:"#cfd6e4", B:"#8a93a8", E:"#12142a" };
    rows.forEach((row, ry) => {
      for (let rx = 0; rx < row.length; rx++){
        const col = pal[row[rx]];
        if (col) R(g, x + rx * s, y + ry * s, s, s, col);
      }
    });
  }
  function paintSunrise(g, x, y, s){
    /* half sun over dark mountains */
    const rows = [
      "....RRRR....",
      "..RRYYYYRR..",
      ".RYYWWWWYYR.",
      "RRYWWWWWWYRR",
      "RRYWWWWWWYRR",
      ".RRRYYYYRRR.",
      "..MMMMMMMM..",
      ".MMMMMMMMMM.",
      "MMMMMMMMMMMM"
    ];
    const pal = { R:"#e86a3a", Y:"#ffb454", W:"#ffe9b0", M:"#2c2440" };
    rows.forEach((row, ry) => {
      for (let rx = 0; rx < row.length; rx++){
        const col = pal[row[rx]];
        if (col) R(g, x + rx * s, y + ry * s, s, s, col);
      }
    });
  }

  /* ================= GLOW SPRITES ================= */
  function glowSpriteRGBA(size, rgb){  /* rgb = "255,180,84" */
    return bake(size, size, g => {
      const r = size / 2;
      const grd = g.createRadialGradient(r, r, 0, r, r, r);
      grd.addColorStop(0, "rgba(" + rgb + ",0.55)");
      grd.addColorStop(0.4, "rgba(" + rgb + ",0.18)");
      grd.addColorStop(1, "rgba(" + rgb + ",0)");
      g.fillStyle = grd;
      g.fillRect(0, 0, size, size);
    });
  }

  /* ================= PROJECT THUMBNAILS (96x64) ================= */
  function thumbBase(g, skyTop, skyBot){
    const grd = g.createLinearGradient(0, 0, 0, 64);
    grd.addColorStop(0, skyTop); grd.addColorStop(1, skyBot);
    g.fillStyle = grd; g.fillRect(0, 0, 96, 64);
    /* stars */
    const r = rng(5);
    for (let i = 0; i < 12; i++) px(g, (r() * 96) | 0, (r() * 26) | 0, "rgba(240,245,255,.7)");
  }
  function shopFront(g, wallC, awningA, awningB, signC){
    /* shop wall + awning + glowing window */
    R(g, 6, 16, 84, 48, wallC);
    R(g, 6, 16, 84, 2, "#0e1428");
    /* awning */
    for (let i = 0; i < 7; i++) R(g, 6 + i * 12, 18, 12, 8, i % 2 ? awningA : awningB);
    R(g, 6, 26, 84, 2, "#101425");
    /* window */
    R(g, 16, 34, 64, 24, "#0b1030");
    R(g, 17, 35, 62, 22, "#ffd97a");
    R(g, 19, 37, 58, 18, "#ffcf55");
    /* sign board */
    R(g, 28, 6, 40, 12, "#101a30");
    frame(g, 28, 6, 40, 12, signC);
  }
  const THUMBS = {
    kickzone(){
      return bake(96, 64, g => {
        thumbBase(g, "#101a38", "#1a1030");
        shopFront(g, "#241430", "#e04848", "#f2f2f2", "#e04848");
        text3(g, 30, 10, "KZ", "#ffe08a", 2);
        /* jersey in window */
        R(g, 40, 40, 18, 14, "#e8eef8");
        R(g, 40, 40, 18, 3, "#e04848"); R(g, 47, 43, 6, 7, "#e04848");
        R(g, 42, 47, 3, 4, "#223"); R(g, 53, 47, 3, 4, "#223");
        /* football */
        disc(g, 26, 52, 5, "#f4f6ff");
        px(g, 25, 51, "#223"); px(g, 27, 51, "#223"); px(g, 26, 53, "#223");
      });
    },
    jersey(){
      return bake(96, 64, g => {
        thumbBase(g, "#0d1631", "#151a3a");
        /* hanger + big navy jersey */
        R(g, 44, 10, 2, 4, "#8a93a8");
        R(g, 38, 14, 14, 2, "#5a6478");
        R(g, 26, 16, 44, 30, "#2c437e");
        R(g, 26, 16, 44, 4, "#3f5fae");
        R(g, 44, 18, 8, 6, "#0d1631");          /* collar */
        R(g, 40, 28, 16, 10, "#101a30");        /* number plate */
        text3(g, 44, 30, "10", "#ffd24a", 1);
        R(g, 30, 46, 8, 10, "#e8eef8");         /* sock */
        R(g, 58, 46, 8, 10, "#e8eef8");
        R(g, 26, 56, 44, 2, "#4a3120");
      });
    },
    forme(){
      return bake(96, 64, g => {
        thumbBase(g, "#140f26", "#1d1030");
        shopFront(g, "#2a1830", "#e07ba8", "#f4d8e8", "#e07ba8");
        text3(g, 32, 10, "FORME", "#ffe8f2", 1);
        /* dress mannequin */
        R(g, 44, 40, 8, 10, "#f4d8e8");
        R(g, 42, 44, 12, 5, "#f4d8e8");
        R(g, 46, 50, 2, 6, "#8a93a8");
        /* gift boxes */
        R(g, 24, 46, 10, 8, "#e07ba8"); R(g, 28, 44, 2, 10, "#fff");
        R(g, 62, 46, 10, 8, "#8a6ad8"); R(g, 66, 44, 2, 10, "#fff");
      });
    },
    scentora(){
      return bake(96, 64, g => {
        thumbBase(g, "#0e1434", "#191038");
        /* vanity + perfume bottle */
        R(g, 12, 46, 72, 6, "#4a3120");
        R(g, 12, 52, 4, 10, "#3a2718"); R(g, 80, 52, 4, 10, "#3a2718");
        /* big bottle */
        R(g, 40, 26, 16, 20, "#bfe6ff");
        R(g, 41, 27, 14, 18, "#8fd0f4");
        R(g, 41, 27, 14, 4, "#c9ecff");
        R(g, 45, 20, 6, 6, "#caa23f");
        R(g, 44, 18, 8, 3, "#8a6a1e");
        /* small bottles */
        R(g, 26, 34, 8, 12, "#e8b4d8"); R(g, 28, 30, 4, 4, "#caa23f");
        R(g, 64, 34, 8, 12, "#a8e6c8"); R(g, 66, 30, 4, 4, "#caa23f");
        /* sparkles */
        px(g, 34, 22, "#fff"); px(g, 60, 26, "#fff"); px(g, 52, 44, "#fff");
        text3(g, 34, 6, "SCENTORA", "#c9ecff", 1);
      });
    },
    pixeldev(){
      return bake(96, 64, g => {
        /* mini version of the dev room */
        R(g, 0, 0, 96, 24, "#3a2718");
        R(g, 0, 24, 96, 40, "#8a5c34");
        R(g, 0, 24, 96, 2, "#6b4626");
        /* window */
        R(g, 8, 5, 16, 14, "#101a30"); R(g, 9, 6, 14, 12, "#16336e");
        disc(g, 18, 9, 2, "#f4f0d8");
        /* desk + monitor */
        R(g, 44, 34, 40, 4, "#a8743f");
        R(g, 50, 24, 18, 10, "#101a30"); R(g, 51, 25, 16, 8, "#2f6bff");
        R(g, 52, 26, 5, 1, "#7fe07f"); R(g, 52, 28, 8, 1, "#ffd24a");
        R(g, 56, 38, 8, 6, "#23263f"); /* chair */
        /* character */
        const chr = buildCharSprites().down.idle;
        g.drawImage(chr, 20, 24, 12, 20);
        /* plant */
        R(g, 84, 38, 6, 6, "#6fbf4a"); R(g, 85, 44, 4, 6, "#a05a34");
        text3(g, 6, 30, "PIXELDEV", "#ffd24a", 1);
      });
    }
  };
  function thumb(name){
    const fn = THUMBS[name] || THUMBS.pixeldev;
    return fn();
  }

  /* ================= ABOUT PORTRAIT (64x64) ================= */
  function aboutPortrait(){
    return bake(64, 64, g => {
      const bg = g.createLinearGradient(0, 0, 0, 64);
      bg.addColorStop(0, "#101c48"); bg.addColorStop(0.6, "#151034"); bg.addColorStop(1, "#0c0a24");
      g.fillStyle = bg; g.fillRect(0, 0, 64, 64);
      /* moon + glow */
      disc(g, 48, 12, 7, "rgba(160,190,255,.16)");
      disc(g, 48, 12, 5, "#f4f0d8");
      disc(g, 50, 10, 1.6, "#d8d4bc");
      /* stars */
      const r = rng(9);
      for (let i = 0; i < 26; i++) px(g, (r() * 64) | 0, (r() * 40) | 0, r() > 0.5 ? "#cfe0ff" : "#8fa8e8");
      /* skyline */
      const b = [[0,40,10],[10,34,8],[18,44,7],[25,30,9],[34,42,10],[44,32,8],[52,40,12]];
      b.forEach(([x, y, w]) => R(g, x, y, w, 64 - y, "#0a0f24"));
      const r2 = rng(23);
      for (let i = 0; i < 30; i++) px(g, (r2() * 64) | 0, (46 + r2() * 16) | 0, "rgba(255,210,74,.8)");
      /* window frame edges */
      R(g, 0, 0, 3, 64, "#22160e"); R(g, 61, 0, 3, 64, "#22160e");
      R(g, 0, 0, 64, 3, "#22160e"); R(g, 0, 61, 64, 3, "#22160e");
      /* boy: shoulders + head */
      const head = fromMaps(HEAD_DOWN, CP);
      g.imageSmoothingEnabled = false;
      R(g, 12, 48, 40, 16, CP.J);
      R(g, 12, 48, 40, 1, "#171a2e");
      R(g, 12, 48, 3, 16, CP.K); R(g, 49, 48, 3, 16, CP.K);
      R(g, 30, 52, 4, 12, CP.K);
      g.drawImage(head, 0, 0, 12, 10, 17, 12, 30, 25);
    });
  }

  /* ================= CONTACT SCENE (320x170) ================= */
  function contactScene(){
    return bake(320, 170, g => {
      /* sunset sky */
      const sky = g.createLinearGradient(0, 0, 0, 108);
      sky.addColorStop(0, "#141a4a"); sky.addColorStop(0.45, "#3d2a68");
      sky.addColorStop(0.72, "#8a3a5e"); sky.addColorStop(1, "#d96a3e");
      g.fillStyle = sky; g.fillRect(0, 0, 320, 108);
      /* stars top */
      const r = rng(41);
      for (let i = 0; i < 40; i++) px(g, (r() * 320) | 0, (r() * 50) | 0, "rgba(230,240,255," + (0.3 + r() * 0.6).toFixed(2) + ")");
      /* sun */
      disc(g, 236, 84, 20, "rgba(255,180,84,.25)");
      disc(g, 236, 84, 13, "#ffb454");
      disc(g, 236, 84, 13, "#ffd86a"); discRing(g, 236, 84, 13, "#e86a3a");
      R(g, 236, 72, 1, 26, "rgba(255,230,160,.8)");
      R(g, 224, 84, 25, 1, "rgba(255,230,160,.6)");
      /* city silhouettes */
      const sky1 = [[6,66,16],[22,74,10],[32,58,12],[44,70,8],[52,62,14],[66,72,9],[75,56,10],[85,68,13],[98,60,8]];
      const sky2 = [[210,72,10],[220,62,12],[232,74,8],[240,58,12],[252,70,10],[262,64,9],[271,74,12],[283,60,10],[293,70,14],[307,64,9]];
      sky1.concat(sky2).forEach(([x, y, w]) => {
        R(g, x, y, w, 108 - y, "#141228");
        R(g, x + 1, y + 2, 1, 1, "rgba(255,200,90,.75)");
        R(g, x + 3, y + 5, 1, 1, "rgba(255,200,90,.5)");
      });
      /* water */
      const wtr = g.createLinearGradient(0, 108, 0, 170);
      wtr.addColorStop(0, "#232a5e"); wtr.addColorStop(1, "#0c1234");
      g.fillStyle = wtr; g.fillRect(0, 108, 320, 62);
      /* sun reflection */
      for (let i = 0; i < 16; i++){
        const yy = 110 + i * 3.4;
        const w = 2 + Math.abs(Math.sin(i * 1.7)) * 3;
        R(g, 234 - w, yy, w * 2, 1, "rgba(255,170,80," + (0.5 - i * 0.03).toFixed(2) + ")");
      }
      /* dock */
      R(g, 118, 132, 96, 6, "#5a3d28");
      R(g, 118, 138, 96, 3, "#4a3120");
      for (let i = 0; i < 10; i++) px(g, 122 + i * 9, 134, "#3a2718");
      R(g, 126, 141, 4, 22, "#3a2718"); R(g, 202, 141, 4, 22, "#3a2718");
      /* boy sitting (back view, dark silhouette) */
      R(g, 152, 106, 14, 12, "#1c1f36");          /* torso */
      R(g, 152, 106, 14, 2, "#2e3254");
      R(g, 153, 96, 12, 11, "#171a2e");           /* head */
      R(g, 155, 98, 8, 2, "#31365a");             /* hair shine */
      R(g, 150, 118, 18, 3, "#23263f");           /* legs on dock */
      R(g, 166, 118, 5, 2, "#efeef8");
      /* cat beside */
      R(g, 170, 110, 10, 8, "#e8a84e");
      R(g, 178, 108, 4, 4, "#e8a84e");
      px(g, 172, 112, "#5a3418"); px(g, 175, 112, "#5a3418");
      R(g, 168, 118, 12, 2, "#c9832f");
      /* lantern on dock */
      R(g, 136, 116, 2, 16, "#2a2f44");
      R(g, 132, 110, 10, 8, "#2a2f44");
      R(g, 134, 112, 6, 5, "#ffd86a");
    });
  }

  /* ================= RESUME MOCK (200x260) ================= */
  function resumeMock(){
    return bake(200, 260, g => {
      R(g, 0, 0, 200, 260, "#eceff8");
      R(g, 0, 0, 200, 60, "#e2e8f6");
      R(g, 0, 58, 200, 2, "#c9d2ea");
      /* portrait + name */
      const head = fromMaps(HEAD_DOWN, CP);
      g.imageSmoothingEnabled = false;
      g.drawImage(head, 0, 0, 12, 20, 14, 10, 36, 60);
      text3(g, 62, 14, "RAKIB", "#1c2440", 2);
      R(g, 62, 28, 2, 26, "#2f6bff");
      text3(g, 68, 30, "FULL STACK", "#5a648a", 1);
      text3(g, 68, 37, "DEVELOPER", "#5a648a", 1);
      /* skeleton lines (clearly a template) */
      let y = 76;
      ["EXPERIENCE", "PROJECTS", "SKILLS", "EDUCATION"].forEach(h => {
        text3(g, 16, y, h, "#8a93b0", 1);
        y += 9;
        R(g, 16, y, 168, 5, "#dde4f4");
        y += 8;
        R(g, 16, y, 140, 5, "#e6ecf8");
        y += 8;
        R(g, 16, y, 152, 5, "#e6ecf8");
        y += 15;
      });
      /* corner accent */
      R(g, 0, 0, 200, 4, "#2f6bff");
    });
  }

  /* ================= public API ================= */
  return {
    P, px, R, frame, dither, rng, noiseFill, disc, discRing, blob, shadow, bake, fromMaps,
    text3, text3w, FONT3,
    buildCharSprites, headPortrait, catFrames,
    paintSkull, paintSunrise,
    glowSpriteRGBA,
    thumb, aboutPortrait, contactScene, resumeMock
  };
})();

