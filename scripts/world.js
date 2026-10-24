/* ============================================================
   PixelDev — world.js
   Composes the entire scene into a static 960x608 art canvas:
   night water, island garden, the house, furniture, posters,
   trees, pier — plus collision solids, water zones, glow spots
   and the portfolio hotspots.
   ============================================================ */

const WORLD = (() => {
  "use strict";
  const A = ART;
  const P = ART.P;
  const catFrames = ART.catFrames;
  const W = 960, H = 608;

  /* ---------------- layout constants ---------------- */
  const ROOM   = { x0: 248, y0: 120, x1: 792, y1: 464 };      /* interior floor */
  const HOUSE  = { x0: 224, y0: 56,  x1: 816, y1: 504 };      /* outer walls */
  const DOOR   = { x0: 636, x1: 684, y: 464 };                 /* south door gap */

  const WATERZONES = [
    { x: 0,   y: 0,   w: 960, h: 24 },
    { x: 0,   y: 0,   w: 32,  h: 608 },
    { x: 928, y: 0,   w: 32,  h: 608 },
    { x: 0,   y: 584, w: 960, h: 24 },
    { x: 0,   y: 330, w: 118, h: 148 },   /* pond upper */
    { x: 0,   y: 538, w: 118, h: 46  }    /* pond lower */
  ];

  /* collision rects (feet-box testing) */
  const SOLIDS = [
    /* walls */
    { x: 224, y: 40, w: 592, h: 82 },          /* top wall band */
    { x: 224, y: 40, w: 24,  h: 464 },         /* left wall */
    { x: 792, y: 40, w: 24,  h: 464 },         /* right wall */
    { x: 224, y: 464, w: 412, h: 40 },         /* bottom wall (left of door) */
    { x: 684, y: 464, w: 132, h: 40 },         /* bottom wall (right of door) */
    /* water */
    { x: 0,   y: 24,  w: 32,  h: 454 },
    { x: 0,   y: 538, w: 32,  h: 70  },
    { x: 928, y: 0,   w: 32,  h: 608 },
    { x: 0,   y: 0,   w: 960, h: 24  },
    { x: 0,   y: 584, w: 960, h: 24  },
    { x: 0,   y: 330, w: 118, h: 148 },
    { x: 0,   y: 538, w: 118, h: 46  },
    /* furniture */
    { x: 262, y: 170, w: 116, h: 130 },        /* bed */
    { x: 382, y: 200, w: 46,  h: 52  },        /* nightstand */
    { x: 446, y: 126, w: 222, h: 82  },        /* workstation */
    { x: 534, y: 182, w: 62, h: 78  },         /* office chair */
    { x: 688, y: 88,  w: 98,  h: 112 },        /* big shelf */
    { x: 696, y: 328, w: 78,  h: 104 },        /* sofa */
    { x: 612, y: 350, w: 92,  h: 70  },        /* coffee table */
    { x: 284, y: 380, w: 96,  h: 76  },        /* reading desk */
    { x: 252, y: 394, w: 36,  h: 38  },        /* stool */
    { x: 250, y: 312, w: 38,  h: 82  },        /* bookstack + crate */
    { x: 666, y: 236, w: 32,  h: 18  },        /* plant base */
    { x: 750, y: 334, w: 32,  h: 18  },
    { x: 394, y: 438, w: 30,  h: 18  },
    /* garden props */
    { x: 76,  y: 150, w: 18,  h: 32  },        /* tree trunks */
    { x: 884, y: 166, w: 18,  h: 38  },
    { x: 114, y: 428, w: 82,  h: 24  },        /* chalkboard legs */
    { x: 44,  y: 300, w: 16,  h: 46  },        /* lantern poles */
    { x: 300, y: 556, w: 16,  h: 36  },
    { x: 890, y: 346, w: 16,  h: 50  },
    { x: 606, y: 548, w: 14,  h: 38  },
    { x: 842, y: 318, w: 20,  h: 34  },        /* signposts */
    { x: 736, y: 566, w: 16,  h: 24  }
  ];

  /* portfolio hotspots — id, section, world rects, label anchor */
  const HOTSPOTS = [
    { id: "about",   section: "about",        name: "About Me",       icon: "user",   accent: "#ff9f43",
      rects: [{ x: 254, y: 164, w: 130, h: 142 }], lx: 300, ly: 158 },
    { id: "skills",  section: "skills",       name: "Skills",         icon: "gear",   accent: "#5cc8ff",
      rects: [{ x: 440, y: 120, w: 232, h: 92 }, { x: 520, y: 172, w: 90, h: 96 }], lx: 496, ly: 146 },
    { id: "projects",section: "projects",     name: "Projects",       icon: "folder", accent: "#ffd24a",
      rects: [{ x: 606, y: 322, w: 186, h: 116 }], lx: 656, ly: 330 },
    { id: "achievements", section: "achievements", name: "Achievements", icon: "trophy", accent: "#ffd24a",
      rects: [{ x: 684, y: 54, w: 108, h: 150 }], lx: 730, ly: 94 },
    { id: "blog",    section: "blog",         name: "Blog",           icon: "blog",   accent: "#7fe07f",
      rects: [{ x: 246, y: 340, w: 140, h: 124 }], lx: 320, ly: 390 },
    { id: "certs",   section: "achievements", name: "Certifications", icon: "cap",    accent: "#a78bff",
      rects: [{ x: 446, y: 392, w: 148, h: 72 }], lx: 512, ly: 398 },
    { id: "resume",  section: "resume",       name: "Resume",         icon: "resume", accent: "#5cc8ff",
      rects: [{ x: 708, y: 532, w: 76, h: 62 }], lx: 742, ly: 540 },
    { id: "contact", section: "contact",      name: "Contact",        icon: "mail",   accent: "#ff7a6b",
      rects: [{ x: 818, y: 288, w: 84, h: 70 }, { x: 622, y: 494, w: 80, h: 62 }], lx: 846, ly: 296 }
  ];

  /* warp destinations per hotspot (found via findFree at runtime) */
  const WARP = {
    about: [310, 306], skills: [560, 270], projects: [660, 450],
    achievements: [730, 210], blog: [330, 462], certs: [518, 466],
    resume: [700, 560], contact: [660, 545]
  };

  /* glow spots (dynamic additive light)  x, y, radius, rgb, flicker */
  const GLOWS = [
    { x: 361, y: 106, r: 62,  rgb: "255,180,84",  flick: 0.05 },
    { x: 332, y: 88,  r: 46,  rgb: "127,184,255", flick: 0 },
    { x: 558, y: 122, r: 64,  rgb: "120,180,255", flick: 0 },
    { x: 308, y: 380, r: 50,  rgb: "255,180,84",  flick: 0.04 },
    { x: 52,  y: 300, r: 58,  rgb: "255,180,84",  flick: 0.06 },
    { x: 308, y: 556, r: 54,  rgb: "255,180,84",  flick: 0.06 },
    { x: 898, y: 352, r: 54,  rgb: "255,180,84",  flick: 0.06 },
    { x: 613, y: 546, r: 46,  rgb: "255,180,84",  flick: 0.06 }
  ];

  /* firefly zones (garden areas) */
  const FIREFLY_ZONES = [
    { x: 44,  y: 250, w: 170, h: 300 },
    { x: 240, y: 508, w: 340, h: 70  },
    { x: 820, y: 260, w: 96,  h: 260 }
  ];
  const PETAL_ZONE = { x: 820, y: 110, w: 124, h: 140 };

  let worldCanvas = null;

  /* ================================================================
     PAINTERS
     ================================================================ */

  function paintWater(g){
    A.R(g, 0, 0, W, H, P.water1);
    A.R(g, 0, 0, W, H, P.water0);
    /* depth bands toward edges */
    const r = A.rng(101);
    for (let y = 0; y < H; y += 1){
      for (let x = 0; x < W; x += 1){
        if (r() < 0.0022) A.px(g, x, y, P.water2);
      }
    }
    /* darker outer frame */
    A.frame(g, 0, 0, W, H, "#08173b");
  }

  function islandEdge(g){
    /* irregular stone rim around island (32,24)-(928,584) */
    const r = A.rng(7);
    const rimStones = (x0, y0, x1, y1, horizontal) => {
      const len = horizontal ? x1 - x0 : y1 - y0;
      for (let i = 0; i < len; i += 6 + ((r() * 5) | 0)){
        const s = 4 + ((r() * 4) | 0);
        const x = horizontal ? x0 + i : x0 + ((r() * 3) | 0) - 2;
        const y = horizontal ? y0 + ((r() * 3) | 0) - 2 : y0 + i;
        A.blob(g, x + s / 2, y + s / 2, s / 2 + 1, s / 2, P.stone);
        A.blob(g, x + s / 2, y + s / 2 - 1, s / 2 - 1, s / 2 - 2, P.stoneLit);
      }
    };
    rimStones(30, 26, 930, 26, true);     /* top */
    rimStones(30, 580, 930, 580, true);   /* bottom */
    rimStones(30, 26, 30, 580, false);    /* left */
    rimStones(930, 26, 930, 580, false);  /* right */
  }

  function paintIsland(g){
    /* grass base */
    A.R(g, 32, 24, 896, 560, P.grass0);
    A.noiseFill(g, 32, 24, 896, 560, [P.grass1, P.grass2], 3, 0.16);
    /* darker mow stripes */
    for (let y = 24; y < 584; y += 32) A.dither(g, 32, y, 896, 16, P.grassDark, 3, y);
    /* pond (bottom-left) */
    A.blob(g, 58, 460, 62, 130, P.water0);      /* soft edge */
    A.blob(g, 58, 460, 58, 124, P.water1);
    A.blob(g, 58, 460, 40, 100, P.water0);
    A.blob(g, 58, 462, 28, 76, "#081a3e");      /* deep pool */
    /* moon glints baked onto the water */
    const gr = A.rng(41);
    for (let a = 0; a < 10; a++){
      const gx = 30 + ((gr() * 56) | 0), gy = 380 + ((gr() * 150) | 0);
      A.px(g, gx, gy, "#3f6fd1"); A.px(g, gx + 1, gy, "#24509e");
    }
    /* pond rim stones */
    const r = A.rng(11);
    for (let a = 0; a < 40; a++){
      const t = a / 40 * Math.PI * 2;
      const x = 58 + Math.cos(t) * 60, y = 460 + Math.sin(t) * 126;
      if (y > 474 && y < 542 && x < 128) continue;   /* leave gap for bridge */
      A.blob(g, x, y, 4 + r() * 2, 3, P.stone); A.blob(g, x, y - 1, 2, 1, P.stoneLit);
    }
    /* wooden bridge across pond */
    for (let i = 0; i < 8; i++) A.R(g, 2, 480 + i * 7, 122, 5, i % 2 ? P.wood : P.woodLit);
    A.R(g, 2, 536, 122, 2, P.wood3);
    A.R(g, 0, 478, 126, 2, P.wood3);
    A.frame(g, 2, 478, 122, 60, P.wood3);
    /* bridge posts */
    A.R(g, 4, 470, 4, 10, P.wood2); A.R(g, 118, 470, 4, 10, P.wood2);
    A.R(g, 4, 538, 4, 10, P.wood2); A.R(g, 118, 538, 4, 10, P.wood2);
    islandEdge(g);
  }

  function paintHouse(g){
    /* soft shadow all around house */
    g.save(); g.globalAlpha = 0.35;
    A.R(g, 224, 120, 592, 12, "#05091a");
    g.restore();

    /* --- top wall face --- */
    A.R(g, 224, 56, 592, 64, P.wallWood);
    for (let x = 224; x < 816; x += 24) A.R(g, x, 56, 1, 64, P.wallWood2);
    A.noiseFill(g, 224, 56, 592, 64, [P.wallWood2], 5, 0.05);
    A.R(g, 224, 56, 592, 4, "#2a1c12");           /* ceiling edge */
    A.R(g, 224, 112, 592, 8, P.wallTrim);          /* skirting */
    A.R(g, 224, 112, 592, 1, "#6a4a30");

    /* --- side + bottom walls (stone, exterior-ish) --- */
    A.R(g, 224, 56, 24, 464, P.wallStone);
    A.R(g, 792, 56, 24, 464, P.wallStone);
    A.R(g, 224, 464, 592, 40, P.wallStone);
    A.R(g, 224, 56, 24, 464, P.wallStone);
    A.noiseFill(g, 224, 464, 592, 40, [P.wallStone2], 9, 0.2);
    A.noiseFill(g, 224, 120, 24, 344, [P.wallStone2], 10, 0.2);
    A.noiseFill(g, 792, 120, 24, 344, [P.wallStone2], 11, 0.2);
    /* stone courses */
    for (let y = 468; y < 504; y += 10) A.R(g, 224, y, 592, 1, "#282c38");
    for (let y = 60; y < 500; y += 12){ A.R(g, 224, y, 24, 1, "#282c38"); A.R(g, 792, y, 24, 1, "#282c38"); }
    A.R(g, 792, 120, 24, 1, "#4a5064");
    A.R(g, 224, 120, 24, 1, "#4a5064");

    /* --- interior floor: warm parquet --- */
    const fx0 = 248, fy0 = 120, fx1 = 792, fy1 = 464;
    A.R(g, fx0, fy0, fx1 - fx0, fy1 - fy0, P.floor1);
    for (let y = fy0, row = 0; y < fy1; y += 16, row++){
      A.R(g, fx0, y, fx1 - fx0, 16, row % 2 ? P.floor1 : P.floor0);
      /* plank seams */
      const off = (row % 2) ? 0 : 24;
      for (let x = fx0 + off; x < fx1; x += 48) A.R(g, x, y, 1, 16, P.floorLine);
      A.R(g, fx0, y, fx1 - fx0, 1, P.floorLine);
    }
    A.noiseFill(g, fx0, fy0, fx1 - fx0, fy1 - fy0, [P.floor2], 13, 0.05);
    /* plank sheen + wood knots for a hand-painted feel */
    A.noiseFill(g, fx0, fy0, fx1 - fx0, fy1 - fy0, ["#a87949"], 21, 0.045);
    const kr = A.rng(77);
    for (let k = 0; k < 14; k++){
      const kx = fx0 + 8 + ((kr() * (fx1 - fx0 - 16)) | 0);
      const ky = fy0 + 8 + ((kr() * (fy1 - fy0 - 16)) | 0);
      A.px(g, kx, ky, P.floor2); A.px(g, kx + 1, ky, P.floor2);
      A.px(g, kx - 1, ky + 1, "#a06a3a"); A.px(g, kx, ky + 1, P.floor2);
    }
    /* warm ambient pool */
    const warm = g.createRadialGradient(520, 300, 30, 520, 300, 280);
    warm.addColorStop(0, "rgba(255,190,110,0.10)");
    warm.addColorStop(1, "rgba(255,190,110,0)");
    g.fillStyle = warm; g.fillRect(fx0, fy0, fx1 - fx0, fy1 - fy0);
    /* wall base shadow inside */
    g.save(); g.globalAlpha = 0.25;
    A.R(g, fx0, fy0, fx1 - fx0, 10, "#3a250f");
    A.R(g, fx0, fy0, 8, fy1 - fy0, "#3a250f");
    A.R(g, fx1 - 8, fy0, 8, fy1 - fy0, "#3a250f");
    g.restore();
  }

  /* ================= TOP-WALL DECOR ================= */
  function paintWindow(g, x, y, w, h){
    /* moonlit window on the top wall */
    A.R(g, x - 3, y - 3, w + 6, h + 6, "#2a1c12");         /* outer frame */
    A.R(g, x, y, w, h, "#0b1436");                          /* night sky */
    const sky = g.createLinearGradient(0, y, 0, y + h);
    sky.addColorStop(0, "#12245c"); sky.addColorStop(1, "#0a1130");
    g.fillStyle = sky; g.fillRect(x, y, w, h);
    /* moon */
    A.disc(g, x + w - 14, y + 12, 6, "rgba(160,190,255,.18)");
    A.disc(g, x + w - 14, y + 12, 4.5, "#f4f0d8");
    A.px(g, x + w - 13, y + 11, "#d8d4bc");
    /* stars */
    const r = A.rng(17);
    for (let i = 0; i < 10; i++) A.px(g, x + 2 + ((r() * (w - 4)) | 0), y + 2 + ((r() * (h * 0.5)) | 0), "rgba(230,240,255,.9)");
    /* skyline */
    let bx = x + 2;
    while (bx < x + w - 6){
      const bw = 5 + ((r() * 5) | 0), bh = 10 + ((r() * 16) | 0);
      A.R(g, bx, y + h - bh - 6, bw, bh + 6, "#080c20");
      for (let wy = 0; wy < bh - 2; wy += 3)
        for (let wx = 0; wx < bw - 2; wx += 3)
          if (r() < 0.4) A.px(g, bx + 1 + wx, y + h - bh - 4 + wy, "#ffd24a");
      bx += bw + 1;
    }
    A.R(g, x, y + h - 6, w, 6, "#060a1a");      /* reflection strip */
    A.R(g, x + w / 2 - 1, y, 2, h, "#2a1c12");  /* mullions */
    A.R(g, x, y + h / 2 - 1, w, 2, "#2a1c12");
    A.R(g, x - 3, y + h + 1, w + 6, 4, "#3a2718"); /* sill */
  }

  function paintPosters(g){
    /* NULL POINTERS */
    A.R(g, 424, 54, 70, 44, "#0e1530");
    A.frame(g, 424, 54, 70, 44, "#3a2718");
    A.paintSkull(g, 449, 58, 2);
    A.text3(g, 444, 78, "NULL", "#e8ecf8", 2);
    A.text3(g, 428, 89, "POINTERS", "#e8ecf8", 1);
    /* KEEP BUILDING */
    A.R(g, 496, 56, 68, 40, "#0e1530");
    A.frame(g, 496, 56, 68, 40, "#3a2718");
    A.paintSunrise(g, 521, 60, 2);
    A.text3(g, 515, 78, "KEEP", "#ffe08a", 2);
    A.text3(g, 499, 89, "BUILDING", "#ffe08a", 1);
    /* pinboard with notes */
    A.R(g, 564, 60, 38, 38, "#241a10");
    A.frame(g, 564, 60, 38, 38, "#3a2718");
    A.R(g, 568, 64, 9, 9, P.gold); A.R(g, 579, 64, 9, 9, P.cyan); A.R(g, 590, 64, 9, 9, P.coral);
    A.R(g, 568, 75, 9, 9, P.green); A.R(g, 584, 78, 10, 9, "#e8ecf8");
    A.px(g, 572, 62, "#5a4a2a"); A.px(g, 583, 62, "#5a4a2a");
    /* dark art frame */
    A.R(g, 642, 62, 40, 40, "#0a0e20");
    A.frame(g, 642, 62, 40, 40, "#22160e");
    A.frame(g, 645, 65, 34, 34, "#1a2138");
    A.disc(g, 662, 80, 9, "#131a36");
    A.disc(g, 664, 78, 4, "#2a3560");
    A.px(g, 656, 72, "#8fa8e8"); A.px(g, 668, 88, "#8fa8e8"); A.px(g, 674, 74, "#8fa8e8");
  }

  function paintClockBase(g){
    A.R(g, 598, 70, 38, 34, "#0c1020");
    A.frame(g, 598, 70, 38, 34, "#262c40");
    A.R(g, 602, 80, 30, 14, "#160b0b");
    A.frame(g, 602, 80, 30, 14, "#3a1010");
    A.R(g, 608, 72, 18, 3, "#262c40");  /* mount */
  }

  function paintHangingPlant(g, x, y, h){
    /* cord from ceiling + trailing pot */
    A.R(g, x + 7, y, 2, h, "#3a3120");
    A.blob(g, x + 8, y + h + 4, 8, 5, P.terracotta);
    A.blob(g, x + 8, y + h + 2, 8, 3, P.terracotta2);
    A.R(g, x + 2, y + h - 2, 12, 4, "#5a3d28");
    /* leaves trailing down */
    const r = A.rng(x * 7 + 3);
    for (let i = 0; i < 9; i++){
      const lx = x + 1 + ((r() * 15) | 0);
      const ly = y + h + 4 + ((r() * 12) | 0);
      A.disc(g, lx, ly, 2 + (r() * 2 | 0), i % 2 ? P.green : P.green2);
    }
    A.disc(g, x + 8, y + h + 1, 4, P.green);
  }

  function paintCeilingLamp(g, x, y){
    A.R(g, x, 56, 2, 24, "#2a2018");
    A.blob(g, x + 1, y + 24, 9, 3, P.wood3);
    A.blob(g, x + 1, y + 28, 6, 2, P.gold2);
    A.px(g, x, y + 30, "#ffe9b0");
    A.px(g, x + 2, y + 30, "#fff6d8");
  }

  /* ================= FURNITURE ================= */
  function paintBed(g){
    A.shadow(g, 262, 288, 118, 16);
    /* headboard (left) */
    A.R(g, 264, 172, 14, 126, P.wood);
    A.R(g, 264, 172, 14, 126, P.wood2); A.R(g, 264, 172, 4, 126, P.wood3);
    A.R(g, 262, 168, 18, 6, P.woodLit);
    /* mattress */
    A.R(g, 276, 180, 96, 114, "#e8e4ee");
    A.R(g, 276, 180, 96, 4, "#f6f4fa");
    A.frame(g, 276, 180, 96, 114, "#c9c4d8");
    /* pillow */
    A.R(g, 284, 184, 40, 22, P.white);
    A.frame(g, 284, 184, 40, 22, "#c9c4d8");
    A.dither(g, 284, 184, 40, 6, "#e2dff0", 2, 1);
    A.R(g, 284, 194, 40, 1, "#e2dff0");            /* pillow seam */
    A.px(g, 302, 194, "#b9b2cc"); A.px(g, 303, 194, "#b9b2cc");   /* tuft dot */
    /* blanket */
    A.R(g, 278, 208, 92, 86, P.bedBlue);
    A.R(g, 278, 208, 92, 5, P.bedBlue2);
    A.R(g, 278, 212, 92, 2, "#5573cd");            /* turned cuff */
    A.R(g, 278, 256, 92, 3, P.bedBlue3);   /* folded edge */
    A.R(g, 278, 208, 92, 114 - 114, P.bedBlue3);
    /* blanket pattern */
    for (let i = 0; i < 5; i++)
      for (let jx = 0; jx < 4; jx++)
        A.R(g, 288 + jx * 20, 218 + i * 14, 4, 2, "#5a7ad8");
    /* fabric wrinkles */
    A.px(g, 300, 232, "#35509a"); A.px(g, 300, 233, "#35509a");
    A.px(g, 326, 262, "#35509a"); A.px(g, 327, 263, "#35509a");
    A.px(g, 318, 288, "#35509a");
    /* foot board */
    A.R(g, 368, 288, 6, 10, P.wood2);
  }

  function paintNightstand(g){
    A.shadow(g, 382, 244, 46, 8);
    A.R(g, 384, 204, 42, 46, P.bedBlue2);
    A.R(g, 384, 204, 42, 4, P.bedBlue);
    A.R(g, 384, 204, 42, 46, "rgba(0,0,0,0)");
    A.frame(g, 384, 204, 42, 46, "#26386e");
    A.R(g, 388, 214, 34, 14, P.bedBlue3);
    A.frame(g, 388, 214, 34, 14, "#1f2f5e");
    A.R(g, 388, 230, 34, 14, P.bedBlue3);
    A.frame(g, 388, 230, 34, 14, "#1f2f5e");
    A.R(g, 402, 219, 6, 3, P.gold); A.R(g, 402, 235, 6, 3, P.gold);
    /* radio on top */
    A.R(g, 388, 190, 26, 14, "#14182a");
    A.frame(g, 388, 190, 26, 14, "#33375c");
    A.R(g, 391, 194, 8, 6, "#5cc8ff");
    A.px(g, 404, 193, P.gold); A.px(g, 408, 193, P.gold);
    A.R(g, 410, 182, 2, 8, "#8a93a8");
    /* small book stack */
    A.R(g, 404, 198, 16, 3, P.coral); A.R(g, 406, 195, 12, 3, P.cyan);
  }

  function paintShelfSmall(g){
    /* wall shelf with pots, left of monitors */
    A.R(g, 392, 104, 48, 6, P.wood);
    A.R(g, 392, 104, 48, 2, P.woodLit);
    A.R(g, 394, 110, 3, 6, P.wood3); A.R(g, 435, 110, 3, 6, P.wood3);
    /* pots */
    A.blob(g, 400, 98, 5, 4, P.terracotta); A.disc(g, 400, 92, 4, P.green);
    A.blob(g, 416, 98, 5, 4, P.terracotta); A.disc(g, 416, 92, 4, P.green2);
    A.R(g, 426, 94, 10, 10, P.gold3); A.text3(g, 427, 96, "C", P.cream, 1);
  }

  function paintWorkstation(g){
    /* monitors (behind desk top) */
    const screens = [
      { x: 458, y: 106, w: 50, h: 26 },
      { x: 524, y: 100, w: 70, h: 32 },
      { x: 608, y: 106, w: 44, h: 26 }
    ];
    screens.forEach(s => {
      A.R(g, s.x - 3, s.y - 3, s.w + 6, s.h + 6, "#14182a");      /* bezel */
      A.frame(g, s.x - 3, s.y - 3, s.w + 6, s.h + 6, "#33375c");
      A.R(g, s.x, s.y, s.w, s.h, "#0a0f24");                       /* screen base */
      A.R(g, s.x + s.w / 2 - 6, s.y + s.h + 3, 12, 4, "#14182a");  /* stand */
    });
    /* desk top */
    A.R(g, 446, 132, 220, 18, P.wood);
    A.R(g, 446, 132, 220, 4, P.woodLit);
    A.R(g, 446, 146, 220, 4, P.wood2);
    A.frame(g, 446, 132, 220, 18, P.wood3);
    /* drawers */
    A.R(g, 452, 152, 44, 50, P.wood2);
    A.frame(g, 452, 152, 44, 50, P.wood3);
    A.R(g, 456, 158, 36, 12, P.woodLit); A.px(g, 470, 164, P.gold3);
    A.R(g, 456, 174, 36, 12, P.woodLit); A.px(g, 470, 180, P.gold3);
    A.R(g, 456, 190, 36, 8, P.woodLit);
    A.R(g, 614, 152, 46, 50, P.wood2);
    A.frame(g, 614, 152, 46, 50, P.wood3);
    A.R(g, 618, 158, 38, 12, P.woodLit); A.px(g, 634, 164, P.gold3);
    A.R(g, 618, 174, 38, 12, P.woodLit); A.px(g, 634, 180, P.gold3);
    /* legs */
    A.R(g, 648, 152, 12, 54, P.wood3);
    /* keyboard */
    A.R(g, 520, 140, 66, 12, "#1c2038");
    A.frame(g, 520, 140, 66, 12, "#33375c");
    for (let i = 0; i < 12; i++) for (let jy = 0; jy < 2; jy++)
      A.px(g, 523 + i * 5, 143 + jy * 4, "#5a648a");
    /* mouse */
    A.blob(g, 598, 146, 5, 4, "#2a2f4a"); A.px(g, 598, 143, "#5a648a");
    /* headphones hanging on desk edge */
    A.blob(g, 500, 138, 6, 5, "#1c2038");
    A.R(g, 492, 130, 2, 8, "#5a648a"); A.R(g, 506, 130, 2, 8, "#5a648a");
    A.R(g, 492, 128, 16, 2, "#5a648a");
    /* coffee mug */
    A.R(g, 630, 136, 12, 12, "#e8ecf8");
    A.frame(g, 630, 136, 12, 12, "#9aa7c9");
    A.R(g, 631, 137, 10, 3, "#8a5a34");
    A.R(g, 642, 140, 3, 2, "#e8ecf8"); A.R(g, 642, 140, 1, 4, "#e8ecf8");
    /* books on desk */
    A.R(g, 596, 122, 6, 14, P.coral); A.R(g, 602, 122, 5, 14, P.cyan);
  }

  function paintCodeScreen(w, h, seed, variant){
    return A.bake(w, h, g => {
      A.R(g, 0, 0, w, h, "#0d1638");
      const r = A.rng(seed + variant * 977);
      const toks = ["#7fe07f", "#ffd24a", "#5cc8ff", "#ff7a6b", "#a78bff", "#9fb0d8"];
      let y = 2;
      while (y < h - 3){
        const indent = ((r() * 4) | 0) * 3;
        const len = 4 + ((r() * (w / 4 - 6)) | 0);
        const c = toks[(r() * toks.length) | 0];
        A.R(g, 3 + indent, y, len, 1, c);
        if (r() < 0.5) A.R(g, 3 + indent + len + 2, y, 3 + ((r() * 6) | 0), 1, "#3a4a7a");
        y += 3 + ((r() * 2) | 0);
      }
      /* cursor */
      if (variant % 2) A.R(g, 3 + ((r() * (w - 8)) | 0), h - 5, 3, 2, "#e8ecf8");
      /* scanline sheen */
      g.save(); g.globalAlpha = 0.14;
      A.R(g, 0, (variant * 4) % h, w, 2, "#bcd8ff");
      g.restore();
    });
  }

  function paintChair(g){
    A.shadow(g, 532, 250, 66, 10);
    /* back */
    A.R(g, 546, 182, 36, 52, "#1c2038");
    A.R(g, 546, 182, 36, 6, "#33375c");
    A.frame(g, 546, 182, 36, 52, "#0e1122");
    A.dither(g, 549, 192, 30, 32, "#2a2f52", 3, 0);
    /* seat */
    A.R(g, 538, 216, 52, 28, "#1c2038");
    A.R(g, 538, 216, 52, 4, "#33375c");
    A.frame(g, 538, 216, 52, 28, "#0e1122");
    /* armrests */
    A.R(g, 534, 212, 4, 22, "#33375c"); A.R(g, 592, 212, 4, 22, "#33375c");
    /* post + base */
    A.R(g, 560, 244, 8, 8, "#14182a");
    A.R(g, 534, 250, 62, 4, "#14182a");
    [0, 14, 28, 42, 56].forEach(dx => { A.blob(g, 534 + dx + 4, 256, 4, 2, "#0a0e1c"); A.px(g, 534 + dx + 4, 257, "#33375c"); });
  }

  function paintBigShelf(g){
    /* tall bookshelf, right of workstation against top wall */
    A.shadow(g, 688, 192, 102, 10);
    A.R(g, 690, 88, 96, 108, P.wood2);
    A.frame(g, 690, 88, 96, 108, P.wood3);
    A.R(g, 690, 88, 96, 4, P.woodLit);
    /* 3 shelves of books */
    const spineCols = [P.coral, P.gold, P.cyan, P.green, "#a78bff", P.cream, "#5a7ad8"];
    const shelfYs = [100, 132, 164];
    const r = A.rng(29);
    shelfYs.forEach((sy, si) => {
      A.R(g, 694, sy + 24, 88, 4, P.wood3);
      let bx = 696;
      while (bx < 780){
        const bw = 3 + ((r() * 4) | 0);
        const bh = 14 + ((r() * 4) | 0);
        if (r() < 0.12){          /* leaning book */
          A.R(g, bx, sy + 24 - bh, bw, bh, spineCols[(r() * spineCols.length) | 0]);
        } else {
          A.R(g, bx, sy + 24 - bh, bw, bh, spineCols[(r() * spineCols.length) | 0]);
          A.px(g, bx + 1, sy + 24 - bh + 3, "rgba(255,255,255,.35)");
        }
        bx += bw + 1;
      }
    });
    /* trinkets on top row */
    A.blob(g, 700, 96, 4, 3, P.terracotta); A.disc(g, 700, 92, 3, P.green);
  }

  function paintTrophy(g){
    /* golden cup on top of the big shelf */
    A.R(g, 720, 82, 4, 6, P.wood2);   /* small plinths */
    A.R(g, 748, 82, 4, 6, P.wood2);
    A.R(g, 722, 100 - 22, 0, 0, P.gold3);
    A.R(g, 722, 78, 28, 3, P.gold3);  /* base */
    A.R(g, 728, 74, 16, 4, P.gold3);
    A.R(g, 730, 66, 12, 8, P.gold);   /* stem+cup */
    A.R(g, 726, 60, 20, 7, P.gold);
    A.frame(g, 726, 60, 20, 7, P.gold2);
    A.blob(g, 724, 62, 3, 4, P.gold2); A.blob(g, 748, 62, 3, 4, P.gold2);  /* handles */
    A.px(g, 732, 62, "#fff6d8"); A.px(g, 733, 61, "#fff6d8");
  }

  function paintSofa(g){
    A.shadow(g, 696, 424, 80, 10);
    /* backrest — darker so it separates from the seat */
    A.R(g, 752, 330, 20, 96, P.sofaBlue2);
    A.R(g, 756, 334, 13, 89, P.sofaBlue);
    A.frame(g, 752, 330, 20, 96, "#24346e");
    A.R(g, 752, 330, 20, 4, "#5a7ad8");
    /* throw blanket draped over the backrest */
    A.R(g, 753, 346, 18, 6, P.cream);
    A.R(g, 753, 352, 18, 3, P.rugGold);
    /* seat base */
    A.R(g, 700, 366, 56, 48, P.sofaBlue);
    A.frame(g, 700, 366, 56, 48, "#24346e");
    /* two seat cushions (lighter) with a seam */
    A.R(g, 702, 368, 25, 22, "#4a6ac8");
    A.R(g, 729, 368, 25, 22, "#4a6ac8");
    A.R(g, 702, 392, 52, 20, "#3d5c9e");
    A.dither(g, 704, 394, 48, 16, "#35509a", 3, 1);
    A.R(g, 702, 368, 1, 44, "#2e4484"); A.R(g, 728, 368, 1, 44, "#2e4484");
    /* armrest */
    A.R(g, 698, 356, 14, 66, P.sofaBlue2);
    A.frame(g, 698, 356, 14, 66, "#24346e");
    A.R(g, 698, 356, 14, 4, "#5a7ad8");
    /* pillow */
    A.R(g, 714, 374, 20, 20, P.coral);
    A.frame(g, 714, 374, 20, 20, "#c94f42");
    A.R(g, 716, 376, 16, 2, "#ffd0c8");
    A.px(g, 720, 384, "#ffd0c8");
    /* base + legs */
    A.R(g, 700, 414, 72, 10, P.sofaBlue2);
    A.frame(g, 700, 414, 72, 10, "#24346e");
    A.R(g, 702, 424, 6, 6, P.wood3); A.R(g, 762, 424, 6, 6, P.wood3);
  }

  function paintCoffeeTable(g){
    A.shadow(g, 612, 412, 94, 10);
    A.R(g, 614, 352, 90, 22, P.wood);
    A.R(g, 614, 352, 90, 4, P.woodLit);
    A.frame(g, 614, 352, 90, 22, P.wood3);
    A.R(g, 618, 374, 6, 38, P.wood2); A.R(g, 694, 374, 6, 38, P.wood2);
    A.R(g, 620, 396, 78, 4, P.wood3);
    /* gamepad */
    A.R(g, 622, 340, 26, 14, "#dfe6f2");
    A.frame(g, 622, 340, 26, 14, "#8a93a8");
    A.R(g, 626, 344, 4, 4, "#33375c"); A.px(g, 628, 342, "#33375c"); A.px(g, 626, 346, "#33375c");
    A.R(g, 640, 344, 10, 4, "#5cc8ff");
    /* mug */
    A.R(g, 660, 342, 10, 10, "#e8ecf8"); A.frame(g, 660, 342, 10, 10, "#9aa7c9");
    A.R(g, 661, 343, 8, 2, "#8a5a34");
    /* book */
    A.R(g, 676, 344, 16, 8, "#4a3120"); A.R(g, 678, 342, 12, 3, P.coral);
  }

  function paintRug(g, x, y, w, h){
    A.R(g, x, y, w, h, P.rugIndigo);
    A.frame(g, x, y, w, h, P.rugIndigo2);
    A.frame(g, x + 3, y + 3, w - 6, h - 6, P.rugGold);
    for (let i = 0; i < (w - 12) / 16; i++)
      A.R(g, x + 8 + i * 16, y + h / 2 - 1, 8, 2, "rgba(202,162,63,.4)");
    A.noiseFill(g, x + 4, y + 4, w - 8, h - 8, [P.rugIndigo2], 19, 0.08);
  }

  function paintReadingDesk(g){
    A.shadow(g, 284, 446, 98, 10);
    A.R(g, 286, 382, 92, 22, P.wood);
    A.R(g, 286, 382, 92, 4, P.woodLit);
    A.frame(g, 286, 382, 92, 22, P.wood3);
    A.R(g, 290, 404, 8, 44, P.wood2); A.R(g, 366, 404, 8, 44, P.wood2);
    A.R(g, 292, 430, 82, 3, P.wood3);
    /* open book */
    A.R(g, 318, 384, 44, 24, "#d8cfa8");
    A.frame(g, 318, 384, 44, 24, "#a89468");
    A.R(g, 339, 384, 2, 24, "#b0a078");
    for (let i = 0; i < 5; i++){
      A.R(g, 321, 388 + i * 4, 15, 1, "#8a7c54"); A.R(g, 343, 388 + i * 4, 15, 1, "#8a7c54");
    }
    /* brass lamp */
    A.R(g, 300, 372, 2, 14, "#caa23f");
    A.R(g, 300, 372, 10, 2, "#caa23f");
    A.blob(g, 306, 374, 6, 3, "#caa23f");
    A.blob(g, 304, 368, 5, 3, "#e8c26a");
    A.R(g, 298, 384, 6, 3, "#8a6a1e");
    /* pencil + papers */
    A.R(g, 356, 410, 18, 1, "#e8b44a"); A.px(g, 374, 410, "#5a3418");
  }

  function paintStool(g){
    A.shadow(g, 252, 426, 38, 8);
    A.blob(g, 269, 400, 15, 6, P.wood);
    A.blob(g, 269, 398, 15, 4, P.woodLit);
    A.R(g, 258, 406, 3, 20, P.wood2); A.R(g, 278, 406, 3, 20, P.wood2);
  }

  function paintCertMat(g){
    paintRug(g, 452, 398, 136, 60);
    /* big open book on mat */
    A.R(g, 486, 408, 60, 36, "#d8cfa8");
    A.frame(g, 486, 408, 60, 36, "#a89468");
    A.R(g, 515, 408, 2, 36, "#b0a078");
    for (let i = 0; i < 6; i++){
      A.R(g, 490, 413 + i * 5, 22, 1, "#8a7c54"); A.R(g, 521, 413 + i * 5, 21, 1, "#8a7c54");
    }
    A.R(g, 504, 440, 24, 2, P.coral);   /* ribbon */
    /* paper stack with seal */
    A.R(g, 556, 412, 26, 30, P.white); A.frame(g, 556, 412, 26, 30, "#b8c0d8");
    for (let i = 0; i < 4; i++) A.R(g, 560, 418 + i * 6, 18, 1, "#9aa7c9");
    A.disc(g, 570, 436, 3, P.gold2);
  }

  function paintBookstack(g){
    A.shadow(g, 250, 386, 40, 8);
    /* crate */
    A.R(g, 252, 352, 34, 36, P.wood2);
    A.frame(g, 252, 352, 34, 36, P.wood3);
    A.R(g, 254, 354, 30, 3, P.woodLit);
    A.R(g, 252, 368, 34, 2, P.wood3);
    /* book stack on crate */
    A.R(g, 256, 340, 28, 6, P.coral); A.frame(g, 256, 340, 28, 6, "#c94f42");
    A.R(g, 258, 334, 24, 6, P.cyan); A.frame(g, 258, 334, 24, 6, "#3a7ba8");
    A.R(g, 262, 328, 18, 6, P.gold); A.frame(g, 262, 328, 18, 6, P.gold3);
  }

  /* potted plant with trunk & leaves */
  function paintPlant(g, x, y){
    /* y = top of leaves; pot at bottom */
    const potY = y + 42;
    A.shadow(g, x - 2, potY + 14, 36, 8);
    A.blob(g, x + 16, potY + 6, 12, 8, P.terracotta);
    A.blob(g, x + 16, potY + 3, 12, 5, P.terracotta2);
    A.R(g, x + 4, potY - 2, 24, 5, "#7c422a");
    /* trunk */
    A.R(g, x + 14, y + 16, 4, 26, "#5a3d28");
    A.R(g, x + 12, y + 22, 3, 6, "#5a3d28");
    /* leaves */
    A.disc(g, x + 16, y + 10, 10, P.green);
    A.disc(g, x + 6, y + 16, 7, P.green2);
    A.disc(g, x + 26, y + 16, 7, P.green2);
    A.disc(g, x + 16, y + 20, 8, P.green3);
    A.disc(g, x + 12, y + 6, 4, "#7fd45a");
  }

  /* small potted plant (floor) */
  function paintSmallPlant(g, x, y){
    A.shadow(g, x - 1, y + 14, 24, 6);
    A.blob(g, x + 10, y + 12, 8, 5, P.terracotta);
    A.blob(g, x + 10, y + 10, 8, 3, P.terracotta2);
    A.disc(g, x + 10, y + 2, 7, P.green);
    A.disc(g, x + 4, y + 6, 4, P.green2);
    A.disc(g, x + 16, y + 6, 4, P.green2);
  }

  /* ================= GARDEN ================= */
  function paintTree(g, cx, topY, seed, blossom){
    /* trunk */
    A.R(g, cx - 8, topY + 118, 16, 46, "#5a3d28");
    A.R(g, cx - 8, topY + 118, 5, 46, "#6e4a2e");
    A.R(g, cx - 4, topY + 112, 8, 8, "#4a3120");
    /* canopy: cluster of blobs */
    const r = A.rng(seed);
    const leafMain = blossom ? P.pink : P.green;
    const leaf2 = blossom ? P.pink2 : P.green2;
    const leaf3 = blossom ? "#f4b8d0" : P.green3;
    for (let i = 0; i < 9; i++){
      const bx = cx - 40 + ((r() * 80) | 0);
      const by = topY + 30 + ((r() * 70) | 0);
      A.blob(g, bx, by, 14 + ((r() * 10) | 0), 12 + ((r() * 8) | 0), i % 3 === 0 ? leaf2 : leafMain);
    }
    A.blob(g, cx, topY + 44, 44, 34, leafMain);
    A.blob(g, cx - 22, topY + 66, 26, 20, leaf2);
    A.blob(g, cx + 24, topY + 60, 24, 18, leaf3);
    A.blob(g, cx, topY + 26, 30, 18, leaf3);
    /* under-canopy shade — grounds the silhouette */
    A.blob(g, cx - 6, topY + 72, 30, 12, leaf3);
    A.blob(g, cx + 16, topY + 70, 18, 9, blossom ? P.pink2 : P.green3);
    /* top light sheen */
    A.noiseFill(g, cx - 34, topY + 12, 68, 22, [blossom ? "#ffd6e4" : "#7fd45a"], seed + 9, 0.05);
    /* highlight speckles */
    A.noiseFill(g, cx - 44, topY + 10, 88, 70, [blossom ? "#ffd6e4" : "#7fd45a"], seed, 0.08);
    /* trunk detail: knot + bark ribs */
    A.px(g, cx + 2, topY + 132, "#3a2718"); A.px(g, cx + 3, topY + 132, "#3a2718");
    A.px(g, cx - 2, topY + 140, "#3a2718"); A.px(g, cx - 2, topY + 141, "#3a2718");
  }

  function paintBush(g, x, y, seed){
    A.disc(g, x + 14, y + 12, 11, P.green2);
    A.disc(g, x + 4, y + 16, 8, P.green);
    A.disc(g, x + 25, y + 15, 8, P.green);
    A.disc(g, x + 14, y + 7, 7, P.green3);
    A.noiseFill(g, x - 6, y + 2, 42, 26, [P.green3], seed, 0.1);
  }

  function paintFlower(g, x, y, c){
    A.R(g, x, y + 2, 1, 3, P.green3);
    A.disc(g, x, y, 1.6, c);
    A.px(g, x, y - 2, "#fff6d8");
  }

  function paintStone(g, x, y, s){
    A.blob(g, x, y, s, s * 0.7, P.stone);
    A.blob(g, x - 1, y - 1, s * 0.6, s * 0.4, P.stoneLit);
  }

  function paintLantern(g, x, y){
    /* garden lantern pole */
    A.R(g, x + 6, y + 14, 4, 44, "#2a2f44");
    A.R(g, x + 2, y + 56, 12, 4, "#1c2038");
    A.R(g, x, y, 16, 4, "#1c2038");
    A.R(g, x + 3, y + 4, 10, 10, "#ffb454");
    A.frame(g, x + 3, y + 4, 10, 10, "#1c2038");
    A.R(g, x + 2, y + 2, 12, 2, "#1c2038");
    A.px(g, x + 7, y + 6, "#fff6d8");
  }

  function paintChalkboard(g){
    A.R(g, 124, 432, 6, 16, P.wood3); A.R(g, 180, 432, 6, 16, P.wood3);
    A.R(g, 114, 352, 82, 82, P.wood2);
    A.frame(g, 114, 352, 82, 82, P.wood3);
    A.R(g, 120, 358, 70, 70, "#101827");
    A.frame(g, 120, 358, 70, 70, "#1c2638");
    A.text3(g, 136, 366, "RAKIB", P.gold, 2);
    A.text3(g, 140, 383, "KHAT", P.gold, 2);
    A.text3(g, 137, 400, ".DEV", "#e8ecf8", 2);
    A.text3(g, 149, 417, ">>", P.cyan, 2);
    /* chalk dust */
    A.px(g, 128, 420, "rgba(240,244,255,.5)"); A.px(g, 132, 422, "rgba(240,244,255,.4)");
    A.px(g, 168, 416, "rgba(240,244,255,.4)");
  }

  function paintSignpost(g, x, y, kind){
    /* kind: "contact" | "resume" */
    A.R(g, x + 8, y + 20, 5, 26, P.wood2);
    A.R(g, x + 8, y + 20, 2, 26, P.woodLit);
    A.R(g, x, y, 26, 24, P.wood);
    A.frame(g, x, y, 26, 24, P.wood3);
    if (kind === "contact"){
      A.R(g, x + 5, y + 7, 16, 10, "#e8ecf8");
      A.R(g, x + 5, y + 7, 16, 1, "#9aa7c9");
      A.R(g, x + 5, y + 7, 8, 5, "#9aa7c9");
      A.R(g, x + 13, y + 7, 8, 5, "#c9d2ea");
      A.R(g, x + 5, y + 12, 16, 1, "#9aa7c9");
    } else {
      A.R(g, x + 7, y + 5, 12, 14, "#e8ecf8");
      A.frame(g, x + 7, y + 5, 12, 14, "#9aa7c9");
      for (let i = 0; i < 3; i++) A.R(g, x + 9, y + 8 + i * 3, 8, 1, "#8a93b0");
    }
  }

  function paintPier(g){
    /* steps from the door */
    A.R(g, 626, 504, 68, 8, P.stoneLit);
    A.R(g, 630, 512, 60, 8, P.stone);
    A.R(g, 626, 504, 68, 2, "#8a93a8");
    /* pier planks */
    for (let i = 0; i < 9; i++) A.R(g, 600, 530 + i * 8, 100, 6, i % 2 ? P.wood : P.woodLit);
    A.frame(g, 600, 530, 100, 70, P.wood3);
    A.R(g, 600, 528, 100, 2, P.wood3);
    /* plank seams */
    for (let i = 0; i < 9; i++) A.R(g, 600, 536 + i * 8, 100, 1, P.wood3);
    /* posts */
    A.R(g, 602, 586, 6, 14, "#3a2718"); A.R(g, 692, 586, 6, 14, "#3a2718");
    A.R(g, 640, 596, 6, 8, "#3a2718");
  }

  function paintPorch(g){
    /* east wooden deck */
    A.R(g, 816, 248, 92, 278, "#7c5230");
    for (let y = 248; y < 526; y += 14){
      A.R(g, 816, y, 92, 12, y % 28 ? P.wood : P.woodLit);
      A.R(g, 816, y + 12, 92, 2, P.wood3);
      A.px(g, 822, y + 6, "#3a2718"); A.px(g, 898, y + 6, "#3a2718");
    }
    A.R(g, 816, 248, 92, 3, "#54341c");
    A.R(g, 816, 524, 92, 3, P.wood3);
  }

  function paintLilyPads(g){
    /* static in base; slight bob handled dynamically via shimmer only */
    const pads = [[34, 396], [66, 430], [30, 550], [72, 558]];
    pads.forEach(([x, y], i) => {
      A.disc(g, x, y, 8, P.green3);
      A.disc(g, x, y, 7, P.green2);
      A.disc(g, x, y, 5, P.green);
      /* notch cut into the pad */
      A.px(g, x + 5, y - 1, P.water1); A.px(g, x + 6, y, P.water1);
      A.px(g, x + 5, y + 1, P.water1); A.px(g, x + 4, y, P.water1);
      /* light rim on the moonlit side */
      A.px(g, x - 5, y - 2, "#a8d47e"); A.px(g, x - 6, y - 1, "#a8d47e");
      A.px(g, x - 5, y, "#8fbc63");
      /* leaf veins */
      A.px(g, x, y - 3, P.green3); A.px(g, x, y + 3, P.green3);
      if (i % 2 === 0){
        A.disc(g, x + 2, y - 2, 2.4, P.pink);
        A.px(g, x + 2, y - 4, "#fff6d8");
        A.px(g, x + 3, y - 1, P.pink2); A.px(g, x + 1, y - 2, P.pink2);
        A.px(g, x + 2, y - 2, P.gold2);
      }
    });
  }

  function paintGrassTufts(g){
    const r = A.rng(61);
    for (let i = 0; i < 60; i++){
      const x = 40 + ((r() * 880) | 0), y = 30 + ((r() * 540) | 0);
      if (x > 220 && x < 818 && y > 52 && y < 508) continue;   /* inside house */
      if (x < 120 && y > 330) continue;                        /* pond */
      A.R(g, x, y, 1, 2, P.grass1); A.px(g, x + 1, y - 1, P.grass1);
    }
  }

  /* ================================================================
     BUILD
     ================================================================ */
  function build(){
    worldCanvas = A.bake(W, H, g => {
      paintWater(g);
      paintIsland(g);
      paintHouse(g);
      /* top-wall decor */
      paintWindow(g, 296, 64, 72, 48);
      paintHangingPlant(g, 250, 56, 30);
      paintHangingPlant(g, 374, 56, 26);
      paintPosters(g);
      paintShelfSmall(g);
      paintClockBase(g);
      paintCeilingLamp(g, 360, 82);
      /* furniture, back to front */
      paintBigShelf(g);
      paintTrophy(g);
      paintRug(g, 594, 322, 196, 128);
      paintWorkstation(g);
      paintChair(g);
      paintBed(g);
      paintNightstand(g);
      paintBookstack(g);
      paintSofa(g);
      paintCoffeeTable(g);
      paintPlant(g, 662, 194);
      paintPlant(g, 748, 290);
      paintPlant(g, 392, 396);
      paintReadingDesk(g);
      paintStool(g);
      paintCertMat(g);
      /* door + mat */
      A.R(g, 634, 436, 52, 26, "#8a2333");
      A.frame(g, 634, 436, 52, 26, "#5a1420");
      A.R(g, 640, 464, 40, 40, "#060a16");
      A.R(g, 630, 462, 10, 42, P.wood2); A.R(g, 680, 462, 10, 42, P.wood2);
      A.R(g, 630, 458, 60, 6, P.wood);
      /* garden */
      paintPorch(g);
      paintPier(g);
      paintSignpost(g, 842, 296, "contact");
      paintSignpost(g, 714, 538, "resume");
      paintChalkboard(g);
      paintLantern(g, 44, 286);
      paintLantern(g, 298, 538);
      paintLantern(g, 890, 326);
      paintLantern(g, 606, 540);
      paintTree(g, 85, 18, 71, false);
      paintTree(g, 890, 14, 87, true);
      paintBush(g, 146, 48, 91);
      paintBush(g, 196, 536, 92);
      paintBush(g, 846, 464, 93);
      paintSmallPlant(g, 824, 468);
      paintLilyPads(g);
      paintGrassTufts(g);
      /* scattered flowers */
      const fr = A.rng(83);
      const fCols = [P.pink, P.gold, P.white, P.coral, "#a78bff"];
      for (let i = 0; i < 22; i++){
        let x, y;
        if (i % 2 === 0){ x = 130 + ((fr() * 100) | 0); y = 410 + ((fr() * 120) | 0); }
        else { x = 830 + ((fr() * 90) | 0); y = 30 + ((fr() * 160) | 0); }
        paintFlower(g, x, y, fCols[(fr() * fCols.length) | 0]);
      }
      for (let i = 0; i < 10; i++)
        paintFlower(g, 240 + ((fr() * 340) | 0), 552 + ((fr() * 26) | 0), fCols[(fr() * fCols.length) | 0]);
      /* stones in the water */
      paintStone(g, 120, 598, 5); paintStone(g, 320, 600, 4); paintStone(g, 452, 596, 5);
      paintStone(g, 680, 602, 5); paintStone(g, 940, 500, 6); paintStone(g, 210, 598, 4);

      /* baked night vignette — focuses the eye, doesn't shift the palette */
      const vg = g.createRadialGradient(W / 2, H / 2 + 20, 240, W / 2, H / 2 + 20, 620);
      vg.addColorStop(0, "rgba(6,10,24,0)");
      vg.addColorStop(0.72, "rgba(6,10,24,0.10)");
      vg.addColorStop(1, "rgba(6,10,24,0.26)");
      g.fillStyle = vg;
      g.fillRect(0, 0, W, H);
    });

    /* prebaked dynamic bits */
    const screens = [
      { x: 460, y: 108, w: 46, h: 22 },
      { x: 526, y: 102, w: 66, h: 28 },
      { x: 610, y: 108, w: 40, h: 22 }
    ].map((s, i) => ({
      rect: s,
      variants: [0, 1, 2].map(v => paintCodeScreen(s.w, s.h, i * 7 + 3, v))
    }));

    const cat = catFrames(40, 24);
    const catPos = { x: 298, y: 234 };

    /* shimmer seeds */
    const r = A.rng(202);
    const seeds = [];
    for (let i = 0; i < 110; i++){
      const z = WATERZONES[(r() * WATERZONES.length) | 0];
      seeds.push({
        x: z.x + 2 + ((r() * (z.w - 4)) | 0),
        y: z.y + 2 + ((r() * (z.h - 4)) | 0),
        phase: r() * Math.PI * 2,
        speed: 0.6 + r() * 1.2
      });
    }

    return {
      canvas: worldCanvas, W, H, ROOM, HOUSE,
      SOLIDS, HOTSPOTS, WARP, GLOWS, WATERZONES, FIREFLY_ZONES, PETAL_ZONE,
      screens, cat, catPos, seeds
    };
  }

  /* small helper used by UI to test whether a point is collision-free */
  function freeAt(data, x, y){
    const fx0 = x - 5, fy0 = y - 6, fx1 = x + 5, fy1 = y;
    return !data.SOLIDS.some(s => fx0 < s.x + s.w && fx1 > s.x && fy0 < s.y + s.h && fy1 > s.y);
  }
  function findFree(data, x, y){
    if (freeAt(data, x, y)) return [x, y];
    for (let d = 4; d <= 60; d += 4){
      if (freeAt(data, x, y - d)) return [x, y - d];
      if (freeAt(data, x, y + d)) return [x, y + d];
      if (freeAt(data, x - d, y)) return [x - d, y];
      if (freeAt(data, x + d, y)) return [x + d, y];
    }
    return [x, y];
  }

  return { build, freeAt, findFree, W, H };
})();

