/* ============================================================
   PixelDev — main.js
   Boot: lays out the world, wires the engine to the UI,
   detects touch layout, verifies the optional resume PDF and
   fades in. Everything is local — no backend, no build step.
   ============================================================ */

(function () {
  "use strict";

  /* error guard — log only, never hide the world */
  window.addEventListener("error", e => {
    if (e && e.message) console.warn("[PixelDev] " + e.message);
  });

  function touchLayout(){
    return window.matchMedia("(pointer: coarse)").matches || window.innerWidth <= 900;
  }
  function applyLayout(){
    document.body.classList.toggle("touch", touchLayout());
  }
  applyLayout();
  window.addEventListener("resize", applyLayout);

  function boot(){
    /* 1. engine */
    GAME.init(document.getElementById("game"));

    /* 2. interface */
    UI.init(GAME);

    /* 2b. ?panel= / ?modal= deep links (also handy for automated screenshots) */
    const q = new URLSearchParams(location.search);
    const names = DATA.nav.map(n => n.id);
    if (q.get("panel") && names.includes(q.get("panel"))) UI.openPanel(q.get("panel"));
    if (q.get("modal") === "map") UI.openMap();
    if (q.get("modal") === "help") UI.openHelp();

    /* 3. optional resume pdf — enable only if it really exists */
    fetch(DATA.resume.file, { method: "HEAD" })
      .then(r => {
        DATA.resume.__hasFile = r.ok;
        console.info("[PixelDev] resume file " + (r.ok ? "found" : "missing"));
      })
      .catch(() => {
        /* file:// or offline — buttons stay honest and disabled */
        DATA.resume.__hasFile = false;
      });

    /* 4. fade the boot overlay */
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const b = document.getElementById("boot");
      if (b) b.classList.add("done");
      setTimeout(() => b && b.remove(), 900);
    }));
  }

  if (document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
