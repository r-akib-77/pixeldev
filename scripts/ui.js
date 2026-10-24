/* ============================================================
   PixelDev — ui.js
   All DOM interface: HUD, hotspot labels, bottom navigation,
   portfolio panels (About/Skills/Projects/Achievements/Blog/
   Resume/Contact), map + help modals, touch controls, toasts,
   tutorial tip, sound & fullscreen toggles.
   Content comes exclusively from DATA (see data.js).
   ============================================================ */

const UI = (() => {
  "use strict";
  const $ = s => document.querySelector(s);
  const el = (tag, cls, html) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  };
  const LS = {
    get(k){ try { return localStorage.getItem(k); } catch (e){ return null; } },
    set(k, v){ try { localStorage.setItem(k, v); } catch (e){} }
  };

  let game = null;
  let panelEls = {};        // section id -> <section>
  let spotEls = {};         // hotspot id -> button
  let openedSections = new Set(JSON.parse(LS.get("pixeldev.visits") || "[]"));
  let opener = null;        // element to restore focus to
  let currentPanel = null;
  let menuSheet = null;

  const ico = (name, cls) => '<svg class="ic' + (cls ? " " + cls : "") + '" aria-hidden="true"><use href="#i-' + name + '"/></svg>';

  /* ================================================================
     BOOT / INIT
     ================================================================ */
  function init(g){
    game = g;
    buildHUD();
    buildHotspots();
    buildNavbar();
    buildPanels();
    buildTouchControls();
    buildModals();
    wireControls();
    /* game callbacks */
    game.on({
      onHotspot: h => openPanel(h.section, h),
      onNear: spot => updateNear(spot),
      onFrame: () => tickPositions()
    });
    if (!LS.get("pixeldev.tutorial")) showTip();
  }

  /* ================================================================
     HUD
     ================================================================ */
  function buildHUD(){
    $("#hudName").textContent = DATA.profile.name;
    $("#hudRole").textContent = DATA.profile.role;
    const p = ART.headPortrait(24, 2);
    $("#hudPortrait").getContext("2d").drawImage(p, 0, 0);
    /* hearts: 5 full + 1 half (decorative) */
    const hearts = $("#hudHearts");
    for (let i = 0; i < 5; i++) hearts.appendChild(el("span", "", ico("heart")));
    hearts.appendChild(el("span", "h-half", ico("heart")));
  }

  /* ================================================================
     HOTSPOT LABELS
     ================================================================ */
  function buildHotspots(){
    const wrap = $("#hotspots");
    for (const h of game.worldData.HOTSPOTS){
      const b = el("button", "spot");
      b.id = "spot-" + h.id;
      b.innerHTML = '<span class="ico" style="color:' + h.accent + '">' + ico(h.icon) + "</span>" + h.name;
      b.style.setProperty("--acc", h.accent);
      b.setAttribute("aria-label", "Open " + h.name);
      b.addEventListener("click", () => { SND.sfx.click(); openPanel(h.section, h); });
      wrap.appendChild(b);
      spotEls[h.id] = b;
    }
    tickPositions();
  }

  function tickPositions(){
    for (const h of game.worldData.HOTSPOTS){
      const b = spotEls[h.id];
      if (!b) continue;
      const p = game.toScreen(h.lx, h.ly);
      b.style.transform = "translate(-50%,-50%) translate(" + p.x.toFixed(1) + "px," + p.y.toFixed(1) + "px)";
      b.style.left = "0"; b.style.top = "0";
      b.style.right = "auto"; b.style.bottom = "auto";
    }
    /* prompt bubble above the near spot */
    if (promptSpot && spotEls[promptSpot.id]){
      const b = spotEls[promptSpot.id];
      const pr = $("#prompt");
      const r = b.getBoundingClientRect();
      const host = $("#hotspots").getBoundingClientRect();
      pr.style.transform = "translate(-50%,-100%) translate(" +
        (r.left - host.left + r.width / 2).toFixed(1) + "px," +
        (r.top - host.top - 8).toFixed(1) + "px)";
    }
  }

  let promptSpot = null;
  function updateNear(spot){
    Object.values(spotEls).forEach(b => b.classList.remove("near"));
    if (spot && !document.body.classList.contains("modal-open")){
      spotEls[spot.id].classList.add("near");
      promptSpot = spot;
      if (!document.body.classList.contains("touch")){
        $("#promptKey").textContent = "E";
        $("#promptTxt").textContent = "Interact — " + spot.name;
        $("#prompt").classList.add("show");
      } else {
        $("#interactBtn").classList.add("ready");
      }
    } else {
      promptSpot = null;
      $("#prompt").classList.remove("show");
      $("#interactBtn").classList.remove("ready");
    }
    tickPositions();
  }

  /* ================================================================
     NAVIGATION (desktop bar + mobile menu sheet)
     ================================================================ */
  function buildNavbar(){
    const nav = $("#navbar");
    const prev = el("button", "nav-arrow");
    prev.innerHTML = ico("chev-l");
    prev.setAttribute("aria-label", "Previous section");
    prev.addEventListener("click", cyclePrev);
    const next = el("button", "nav-arrow");
    next.innerHTML = ico("chev-r");
    next.setAttribute("aria-label", "Next section");
    next.addEventListener("click", cycleNext);
    nav.appendChild(prev);
    nav.appendChild(el("span", "nav-sep"));
    for (const n of DATA.nav){
      const b = el("button", "nav-btn");
      b.innerHTML = '<span style="color:' + n.accent + '">' + ico(n.icon) + "</span>" +
        '<span class="nav-lab">' + (window.innerWidth < 1250 && n.short ? n.short : n.label) + "</span>";
      b.setAttribute("aria-label", "Open " + n.full);
      b.addEventListener("click", () => { SND.sfx.click(); openPanel(n.id); });
      b.dataset.section = n.id;
      nav.appendChild(b);
    }
  }

  function buildTouchControls(){
    /* d-pad */
    document.querySelectorAll("#dpad .dpad-btn").forEach(b => {
      const dir = b.dataset.dir;
      b.addEventListener("pointerdown", e => {
        e.preventDefault();
        b.setPointerCapture(e.pointerId);
        b.classList.add("pressed");
        game.setTouchDir(dir);
        SND.kick();
      });
      const stop = () => { b.classList.remove("pressed"); game.setTouchDir(null); };
      b.addEventListener("pointerup", stop);
      b.addEventListener("pointercancel", stop);
      b.addEventListener("lostpointercapture", stop);
      b.addEventListener("contextmenu", e => e.preventDefault());
    });
    /* interact */
    $("#interactBtn").addEventListener("click", () => { SND.kick(); game.interactNearest(); });
    /* menu sheet */
    menuSheet = el("div", "");
    menuSheet.id = "menuSheet";
    menuSheet.innerHTML = '<div class="menu-card" role="dialog" aria-label="Menu"></div>';
    document.getElementById("app").appendChild(menuSheet);
    $("#menuBtn").addEventListener("click", () => openMenu());
    menuSheet.addEventListener("click", e => { if (e.target === menuSheet) closeMenu(); });
    renderMenuItems();
  }

  function renderMenuItems(){
    const card = menuSheet.querySelector(".menu-card");
    card.innerHTML = "";
    const head = el("div", "menu-head", "<span>Menu</span>");
    const x = el("button", "panel-close");
    x.innerHTML = ico("close");
    x.setAttribute("aria-label", "Close menu");
    x.addEventListener("click", closeMenu);
    head.appendChild(x);
    card.appendChild(head);
    const home = el("button", "menu-item");
    home.innerHTML = '<span class="ico" style="color:#ffd24a">' + ico("play") + "</span>Home<span>" + ico("chev-r", "chev") + "</span>";
    home.addEventListener("click", () => { closeMenu(); closePanel(); });
    card.appendChild(home);
    card.appendChild(el("div", "menu-sep"));
    for (const n of DATA.nav){
      const b = el("button", "menu-item");
      b.innerHTML = '<span class="ico" style="color:' + n.accent + '">' + ico(n.icon) + "</span>" + n.full +
        "<span>" + ico("chev-r", "chev") + "</span>";
      b.addEventListener("click", () => { closeMenu(); openPanel(n.id); });
      card.appendChild(b);
    }
    card.appendChild(el("div", "menu-sep"));
    const map = el("button", "menu-item");
    map.innerHTML = '<span class="ico" style="color:#5cc8ff">' + ico("map") + "</span>View Map<span>" + ico("chev-r", "chev") + "</span>";
    map.addEventListener("click", () => { closeMenu(); openMap(); });
    card.appendChild(map);
  }

  function openMenu(){
    SND.sfx.open();
    menuSheet.classList.add("open");
    game.setPaused(true);
    menuSheet.querySelector(".panel-close").focus();
  }
  function closeMenu(){
    if (!menuSheet.classList.contains("open")) return;
    menuSheet.classList.remove("open");
    if (!currentPanel && !$("#mapModal").classList.contains("open") && !$("#helpModal").classList.contains("open")){
      game.setPaused(false);
      document.body.classList.remove("modal-open");
    }
    SND.sfx.close();
  }

  /* ================================================================
     PANELS (shared between desktop modal + mobile sheet)
     ================================================================ */
  function buildPanels(){
    const wrap = $("#panels");
    for (const n of DATA.nav){
      const head = el("div", "panel-head");
      head.innerHTML =
        '<span class="panel-ico" style="color:' + n.accent + '">' + ico(n.icon) + "</span>" +
        '<h2 class="panel-title" id="pt-' + n.id + '">' + n.full + "</h2>";
      const close = el("button", "panel-close");
      close.innerHTML = ico("close");
      close.setAttribute("aria-label", "Close " + n.full);
      close.addEventListener("click", closePanel);
      head.appendChild(close);

      const body = el("div", "panel-body");
      body.id = "pb-" + n.id;

      const p = el("section", "panel");
      p.id = "panel-" + n.id;
      p.setAttribute("role", "dialog");
      p.setAttribute("aria-modal", "true");
      p.setAttribute("aria-labelledby", "pt-" + n.id);
      p.appendChild(head);
      p.appendChild(body);
      wrap.appendChild(p);
      panelEls[n.id] = p;
    }
  }

  function openPanel(section, viaSpot){
    const p = panelEls[section];
    if (!p) return;
    if (currentPanel && currentPanel !== p){
      currentPanel.classList.remove("open");
      currentPanel.querySelector(".mini-modal.open")?.classList.remove("open");
    }
    closeMenu();
    currentPanel = p;
    p.classList.add("open");
    document.body.classList.add("modal-open");
    game.setPaused(true);
    opener = document.activeElement;
    if (!openedSections.has(section)){
      openedSections.add(section);
      LS.set("pixeldev.visits", JSON.stringify([...openedSections]));
      if (openedSections.size >= 6) unlockGameAch("visit");
    }
    if (section === "blog") unlockGameAchLater("read");
    /* highlight nav */
    document.querySelectorAll("#navbar .nav-btn").forEach(b =>
      b.setAttribute("aria-current", b.dataset.section === section ? "true" : "false"));
    /* render content lazily each open (cheap, stays fresh) */
    RENDER[section](p.querySelector(".panel-body"));
    p.querySelector(".panel-body").scrollTop = 0;
    p.querySelector(".panel-close").focus({ preventScroll: true });
    SND.sfx.open();
    announce((DATA.nav.find(n => n.id === section) || {}).full + " opened");
  }

  function closePanel(){
    if (!currentPanel) return;
    currentPanel.classList.remove("open");
    currentPanel.querySelector(".mini-modal.open")?.classList.remove("open");
    currentPanel = null;
    document.body.classList.remove("modal-open");
    document.querySelectorAll("#navbar .nav-btn").forEach(b => b.removeAttribute("aria-current"));
    game.setPaused(false);
    SND.sfx.close();
    if (opener && document.contains(opener)) opener.focus({ preventScroll: true });
    updateNear(null);
  }

  function cyclePanel(step){
    const ids = DATA.nav.map(n => n.id);
    let i = currentPanel ? ids.indexOf(currentPanel.id.replace("panel-", "")) : -1;
    i = (i + step + ids.length) % ids.length;
    openPanel(ids[i]);
  }
  function cycleNext(){ cyclePanel(1); }
  function cyclePrev(){ cyclePanel(-1); }

  /* track "read" game achievement with a small delay after opening blog */
  function unlockGameAchLater(id){ setTimeout(() => unlockGameAch(id), 2500); }

  /* ================================================================
     CONTENT RENDERERS
     ================================================================ */
  const SKILL_META = {
    "JavaScript":      { bg:"#f7df1e", fg:"#1c1c10", lab:"JS" },
    "TypeScript":      { bg:"#3178c6", fg:"#fff",    lab:"TS" },
    "C":               { bg:"#5a8ac8", fg:"#fff",    lab:"C" },
    "C++":             { bg:"#649ad2", fg:"#fff",    lab:"C++" },
    "React.js":        { icon:"atom" },
    "Next.js":         { bg:"#f4f6ff", fg:"#111",    lab:"N" },
    "Firebase":        { bg:"#ffca28", fg:"#7a3c00", lab:"FB" },
    "Tailwind CSS":    { icon:"wave" },
    "shadcn/ui":       { bg:"#e8e8f0", fg:"#111",    lab:"UI" },
    "Node.js":         { icon:"hex" },
    "Express.js":      { bg:"#2a2f44", fg:"#9fc0ff", lab:"EX" },
    "Next.js API Routes": { bg:"#2f6bff", fg:"#fff", lab:"API" },
    "MongoDB":         { icon:"db" },
    "MySQL":           { bg:"#00758f", fg:"#fff",    lab:"MY" },
    "PostgreSQL":      { bg:"#336791", fg:"#fff",    lab:"PG" },
    "Prisma":          { bg:"#2d3748", fg:"#8fd0f4", lab:"P" },
    "Drizzle ORM":     { bg:"#c5f74f", fg:"#1e2a05", lab:"DZ" },
    "Git":             { icon:"branch" },
    "GitHub Actions":  { bg:"#2088ff", fg:"#fff",    lab:"GA" },
    "CI/CD Pipelines": { icon:"loop" },
    "Docker":          { icon:"box" },
    "Vercel":          { icon:"tri" },
    "Data Structures and Algorithms (DSA)": { bg:"#2b4a8f", fg:"#fff", lab:"DSA" },
    "Problem Solving": { bg:"#ffd24a", fg:"#4a3200", lab:"PS" }
  };

  const RENDER = {
    about(body){
      const pr = DATA.profile;
      body.innerHTML = "";
      const wrap = el("div", "about-wrap");
      wrap.innerHTML =
        '<div class="about-left"><canvas id="aboutArt" width="64" height="64"></canvas></div>' +
        '<div class="about-right">' +
          '<div class="about-name">' + pr.name + '</div>' +
          '<div class="about-role">' + pr.role + '</div>' +
          '<div class="about-loc">' + ico("pin") + pr.location + '</div>' +
          '<p class="about-p">' + pr.intro + '</p>' +
          '<p class="about-p dim">' + pr.intro2 + '</p>' +
          '<div class="about-int"></div>' +
          '<a class="btn primary" href="mailto:' + DATA.contact.email + '" id="aboutCta">' + ico("mail") + "Let's Connect" + '</a>' +
        '</div>';
      body.appendChild(wrap);
      const c = wrap.querySelector("#aboutArt");
      c.getContext("2d").drawImage(ART.aboutPortrait(), 0, 0);
      const int = wrap.querySelector(".about-int");
      int.className = "about-int";
      pr.interests.forEach(i => {
        const row = el("div", "about-int-row");
        row.innerHTML = '<span class="about-int-ic" style="color:' + accentFor(i.icon) + '">' + ico(i.icon) + "</span>" + i.text;
        int.appendChild(row);
      });
      wrap.querySelector("#aboutCta").addEventListener("click", () => unlockGameAch("hello"));
    },

    skills(body){
      body.innerHTML = "";
      DATA.skills.forEach(cat => {
        body.appendChild(el("h3", "sect-h", cat.category));
        const grid = el("div", "skills-grid");
        cat.items.forEach(item => {
          const m = SKILL_META[item] || { lab: item.slice(0, 2).toUpperCase() };
          const t = el("div", "skill-tile");
          if (m.icon){
            t.innerHTML = '<span class="sk-ic">' + ico(m.icon) + "</span><span class='sk-lab'>" + item + "</span>";
          } else {
            t.innerHTML = '<span class="sk-badge" style="background:' + m.bg + ";color:" + m.fg + '">' + m.lab + "</span><span class='sk-lab'>" + item + "</span>";
          }
          grid.appendChild(t);
        });
        body.appendChild(grid);
      });
      const note = el("div", "note info",
        ico("leaf") + "<span>All tools above are in active rotation — from UI work in React to data layers with Prisma and shipping through CI.</span>");
      note.style.marginTop = "18px";
      body.appendChild(note);
    },

    projects(body){
      body.innerHTML = "";
      const grid = el("div", "proj-grid");
      DATA.projects.forEach(pr => {
        const card = el("article", "card clickable proj-card");
        card.innerHTML =
          '<canvas class="proj-thumb" width="96" height="64"></canvas>' +
          '<div class="proj-info"><div class="proj-name">' + pr.name + "</div>" +
          '<p class="proj-desc">' + pr.desc + "</p>" +
          '<div class="proj-tags">' + pr.tags.map(t => '<span class="chip">' + t + "</span>").join("") + "</div>" +
          '<div class="proj-actions">' +
            (pr.url ? '<a class="btn sm" href="' + pr.url + '" target="_blank" rel="noopener noreferrer" aria-label="Open live demo of ' + pr.name + '">' + ico("ext") + "Live demo</a>"
                    : '<span class="chip gray">' + ico("heart") + "Featured build</span>") +
            '<button class="btn sm ghost" data-details="' + pr.id + '">' + ico("play") + "Details</button>" +
          "</div></div>";
        card.querySelector(".proj-thumb").getContext("2d").drawImage(ART.thumb(pr.thumb), 0, 0);
        card.querySelector("[data-details]").addEventListener("click", () => projectDetail(pr));
        grid.appendChild(card);
      });
      body.appendChild(grid);
      const more = el("a", "btn wide",
        ico("globe") + "View All Projects" + ico("chev-r"));
      more.href = DATA.profile.moreUrl;
      more.target = "_blank"; more.rel = "noopener noreferrer";
      more.style.marginTop = "16px";
      more.setAttribute("aria-label", "View all projects on the earlier portfolio (opens in a new tab)");
      body.appendChild(more);
      const note = el("div", "note",
        ico("zap") + "<span>Repository links are added only for projects with public repos — none are linked above unless supplied in <b>scripts/data.js</b>.</span>");
      note.style.marginTop = "10px";
      body.appendChild(note);
    },

    achievements(body){
      body.innerHTML = "";
      body.appendChild(el("h3", "sect-h", "Experience & Interests"));
      const grid = el("div", "ach-grid");
      DATA.achievements.forEach(a => {
        const card = el("div", "card ach-card");
        card.innerHTML =
          '<span class="ach-ic" style="color:' + accentFor(a.icon) + '">' + ico(a.icon) + "</span>" +
          '<div class="ach-info"><div class="ach-title">' + a.title + "</div>" +
          '<p class="ach-desc">' + a.desc + "</p>" +
          '<span class="chip gray">' + a.meta + "</span></div>";
        grid.appendChild(card);
      });
      body.appendChild(grid);

      body.appendChild(el("h3", "sect-h", "In-Game Achievements"));
      body.appendChild(el("div", "note info",
        ico("play") + "<span>These unlock by actually exploring this little world — progress is saved in your browser only.</span>"));
      const list = el("div", "game-ach");
      DATA.gameAchievements.forEach(a => {
        const done = LS.get("pixeldev.ach." + a.id) === "1";
        const row = el("div", "card game-ach-row" + (done ? " done" : ""));
        row.innerHTML =
          '<span class="ach-ic" style="color:' + (done ? "#ffd24a" : "#3a4a74") + '">' + ico(a.icon) + "</span>" +
          '<div class="ach-info"><div class="ach-title">' + a.title + "</div><p class=\"ach-desc\">" + a.desc + "</p></div>" +
          (done ? '<span class="chip ok">' + ico("check" ) + "Unlocked</span>" : '<span class="chip gray">Locked</span>');
        list.appendChild(row);
      });
      /* progress bar for explorer */
      const exp = el("div", "game-ach-progress");
      exp.innerHTML = '<span>Sections visited: <b>' + openedSections.size + " / " + DATA.nav.length + "</b></span>" +
        '<span class="xp big"><i style="width:' + Math.round(openedSections.size / DATA.nav.length * 100) + '%"></i></span>';
      exp.setAttribute("aria-label", "Sections visited " + openedSections.size + " of " + DATA.nav.length);
      list.appendChild(exp);
      body.appendChild(list);
    },

    blog(body){
      body.innerHTML = "";
      body.appendChild(el("div", "note", ico("zap") + "<span>" + DATA.blogNote + "</span>"));
      const list = el("div", "blog-list");
      DATA.blog.forEach(post => {
        const card = el("article", "card clickable blog-card");
        card.innerHTML =
          '<canvas class="blog-thumb" width="64" height="48"></canvas>' +
          '<div class="blog-info">' +
            '<div class="blog-title">' + post.title + '</div>' +
            '<div class="blog-meta">' + post.date + ' <span class="chip warn">Sample</span></div>' +
            '<p class="blog-excerpt">' + post.excerpt + "</p>" +
          "</div>" +
          '<span class="blog-go">' + ico("chev-r") + "</span>";
        card.querySelector(".blog-thumb").getContext("2d").drawImage(blogThumb(post), 0, 0);
        card.setAttribute("role", "button");
        card.setAttribute("tabindex", "0");
        card.setAttribute("aria-label", "Read sample post: " + post.title);
        const open = () => blogReader(post);
        card.addEventListener("click", open);
        card.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " "){ e.preventDefault(); open(); } });
        list.appendChild(card);
      });
      body.appendChild(list);
    },

    resume(body){
      body.innerHTML = "";
      const has = !!DATA.resume.__hasFile;
      const wrap = el("div", "resume-wrap");
      wrap.innerHTML =
        '<div class="resume-preview"><canvas id="resumeArt" width="200" height="260"></canvas></div>' +
        '<div class="resume-side">' +
          '<p class="about-p">' +
            "A one-page PDF resume lives with the site files. " +
            (has ? "Your file is ready — grab it below."
                 : "It is not added yet, so the buttons below are disabled instead of pretending to work.") +
          "</p>" +
          (has
            ? ""
            : '<div class="note">' + ico("zap") + "<span>" + DATA.resume.note + "</span></div>") +
          '<div class="resume-actions">' +
            '<button class="btn primary" id="resumeDl" ' + (has ? "" : "disabled") + ">" + ico("download") + "Download PDF</button>" +
            '<button class="btn" id="resumeView" ' + (has ? "" : "disabled") + ">" + ico("globe") + "View Online</button>" +
          "</div>" +
          '<p class="resume-hint dim">Looking for specifics? Everything about my work on this site is real: the projects list links out to live sites you can visit right now.</p>' +
        "</div>";
      body.appendChild(wrap);
      wrap.querySelector("#resumeArt").getContext("2d").drawImage(ART.resumeMock(), 0, 0);
      if (has){
        wrap.querySelector("#resumeDl").addEventListener("click", () => {
          const a = document.createElement("a");
          a.href = DATA.resume.file; a.download = "rakib-resume.pdf";
          document.body.appendChild(a); a.click(); a.remove();
          SND.sfx.chime();
        });
        wrap.querySelector("#resumeView").addEventListener("click", () => {
          window.open(DATA.resume.file, "_blank", "noopener");
        });
      }
    },

    contact(body){
      body.innerHTML = "";
      const c = DATA.contact;
      const wrap = el("div", "contact-wrap");
      wrap.innerHTML =
        '<canvas id="contactArt" width="320" height="170"></canvas>' +
        '<div class="contact-bubble">' + ico("hand") + "<span>" + c.message + "</span></div>" +
        '<div class="contact-cards">' +
          '<a class="card clickable contact-card" href="mailto:' + c.email + '" id="mailLink">' +
            '<span class="contact-ic" style="color:#ff7a6b">' + ico("mail") + "</span>" +
            '<span class="contact-info"><b>Email Me</b><span class="dim">' + c.email + "</span></span>" +
            (c.emailPlaceholder ? '<span class="placeholder">placeholder</span>' : ico("ext", "contact-ext")) + "</a>" +
          '<a class="card clickable contact-card" href="' + c.linkedin + '" target="_blank" rel="noopener noreferrer">' +
            '<span class="contact-ic" style="color:#5cc8ff">' + ico("linkedin") + "</span>" +
            '<span class="contact-info"><b>LinkedIn</b><span class="dim">' + c.linkedinHandle + "</span></span>" +
            (c.linkedinPlaceholder ? '<span class="placeholder">placeholder</span>' : ico("ext", "contact-ext")) + "</a>" +
          '<a class="card clickable contact-card" href="' + c.github + '" target="_blank" rel="noopener noreferrer">' +
            '<span class="contact-ic" style="color:#9fb0d8">' + ico("github") + "</span>" +
            '<span class="contact-info"><b>GitHub</b><span class="dim">' + c.githubHandle + "</span></span>" +
            (c.githubPlaceholder ? '<span class="placeholder">placeholder</span>' : ico("ext", "contact-ext")) + "</a>" +
        "</div>" +
        '<div class="note">' + ico("pin") + "<span>Contact details above are <b>placeholders</b> until real ones are added — edit the <b>contact</b> section of <b>scripts/data.js</b>.</span></div>";
      body.appendChild(wrap);
      wrap.querySelector("#contactArt").getContext("2d").drawImage(ART.contactScene(), 0, 0);
      wrap.querySelector("#mailLink").addEventListener("click", () => unlockGameAch("hello"));
    }
  };

  function accentFor(icon){
    return ({ user:"#ff9f43", gear:"#5cc8ff", folder:"#ffd24a", trophy:"#ffd24a",
      blog:"#7fe07f", resume:"#5cc8ff", mail:"#ff7a6b", code:"#5cc8ff",
      cap:"#a78bff", heart:"#ff7a6b", leaf:"#7fe07f", users:"#5cc8ff",
      chart:"#7fe07f", ball:"#f4f6ff", pin:"#ff7a6b" })[icon] || "#5cc8ff";
  }

  function blogThumb(post){
    const grads = [["#2a1a4a", "#4a2060"], ["#12304a", "#1a4a6a"], ["#4a2a12", "#6a4018"], ["#123a2a", "#1a5a42"]];
    const gIdx = DATA.blog.indexOf(post) % grads.length;
    const c = ART.bake(64, 48, g => {
      const grd = g.createLinearGradient(0, 0, 0, 48);
      grd.addColorStop(0, grads[gIdx][0]); grd.addColorStop(1, grads[gIdx][1]);
      g.fillStyle = grd; g.fillRect(0, 0, 64, 48);
      const r = ART.rng(gIdx * 13 + 5);
      for (let i = 0; i < 9; i++) ART.px(g, (r() * 64) | 0, (r() * 18) | 0, "rgba(240,245,255,.7)");
      ART.disc(g, 50, 10, 4, "rgba(160,190,255,.2)");
      ART.disc(g, 50, 10, 3, "#f4f0d8");
      /* icon glyph per post */
      const glyph = [["<", ">"], ["^", "v"], ["J", "S"], ["F", "B"]][gIdx];
      ART.text3(g, 10, 20, glyph[0] + glyph[1], "#9fd8ff", 2);
      ART.R(g, 0, 38, 64, 10, "rgba(6,10,24,.6)");
      ART.text3(g, 6, 40, "SAMPLE", "#ffd24a", 1);
    });
    return c;
  }

  /* ---------------- project detail mini-modal ---------------- */
  function projectDetail(pr){
    const p = currentPanel;
    let m = p.querySelector(".mini-modal");
    if (!m){
      m = el("div", "mini-modal");
      m.innerHTML =
        '<div class="card proj-detail">' +
          '<div style="display:flex;justify-content:flex-end"><button class="panel-close" aria-label="Close details">' + ico("close") + '</button></div>' +
          '<canvas class="proj-hero" width="192" height="128"></canvas>' +
          '<h3 style="margin:0 0 6px">' + pr.name + "</h3>" +
          '<p class="dim">' + pr.desc + "</p>" +
          '<div class="proj-tags">' + pr.tags.map(t => '<span class="chip">' + t + "</span>").join("") + "</div>" +
          '<div class="proj-actions" style="margin-top:14px">' +
            (pr.url ? '<a class="btn primary" href="' + pr.url + '" target="_blank" rel="noopener noreferrer">' + ico("ext") + "Open live site</a>"
                    : '<span class="chip warn">Private build — this very website</span>') +
          "</div>" +
        "</div>";
      p.appendChild(m);
      m.querySelector(".panel-close").addEventListener("click", () => m.classList.remove("open"));
    }
    const g2 = m.querySelector(".proj-hero").getContext("2d");
    g2.imageSmoothingEnabled = false;
    g2.drawImage(ART.thumb(pr.thumb), 0, 0, 192, 128);
    m.classList.add("open");
    m.querySelector(".panel-close").focus();
    SND.sfx.click();
  }

  /* ---------------- blog reader mini-modal ---------------- */
  function blogReader(post){
    const p = currentPanel;
    let m = p.querySelector(".mini-modal");
    if (!m){
      m = el("div", "mini-modal");
      m.innerHTML =
        '<div class="card proj-detail">' +
          '<div style="display:flex;justify-content:flex-end"><button class="panel-close" aria-label="Close article">' + ico("close") + '</button></div>' +
          '<div class="blog-meta" style="margin:8px 0 2px">' + post.date + ' <span class="chip warn">Sample content</span></div>' +
          '<h3 style="margin:0 0 10px">' + post.title + "</h3>" +
          '<p class="dim">' + post.body + "</p>" +
          '<div class="note info" style="margin-top:12px">' + ico("zap") + "<span>This is placeholder text so the reading view can be previewed. Real articles will open exactly like this.</span></div>" +
        "</div>";
      p.appendChild(m);
      m.querySelector(".panel-close").addEventListener("click", () => m.classList.remove("open"));
    }
    m.querySelector("h3").textContent = post.title;
    m.querySelector("p.dim").textContent = post.body;
    m.classList.add("open");
    m.querySelector(".panel-close").focus();
    unlockGameAch("read");
    SND.sfx.click();
  }

  /* ================================================================
     MAP + HELP MODALS
     ================================================================ */
  function buildModals(){
    document.getElementById("app").appendChild(el("div", "modal", "")).id = "mapModal";
    const map = $("#mapModal");
    map.setAttribute("role", "dialog");
    map.setAttribute("aria-label", "World map");
    map.innerHTML =
      '<div class="panel-head"><span class="panel-ico" style="color:#5cc8ff">' + ico("map") + '</span>' +
      '<h2 class="panel-title">World Map</h2><button class="panel-close" aria-label="Close map">' + ico("close") + "</button></div>" +
      '<div class="map-canvas-wrap"><canvas id="mapCanvas" width="320" height="202"></canvas><div id="mapPins"></div></div>' +
      '<div class="map-legend"></div>';
    map.querySelector(".panel-close").addEventListener("click", closeMap);

    document.getElementById("app").appendChild(el("div", "modal", "")).id = "helpModal";
    const help = $("#helpModal");
    help.setAttribute("role", "dialog");
    help.setAttribute("aria-label", "Help");
    const kbd = k => "<kbd>" + k + "</kbd>";
    help.innerHTML =
      '<div class="panel-head"><span class="panel-ico" style="color:#ffd24a">' + ico("help") + '</span>' +
      '<h2 class="panel-title">How to Play</h2><button class="panel-close" aria-label="Close help">' + ico("close") + "</button></div>" +
      '<div class="help-body">' +
        '<div class="help-row">' + kbd("W A S D") + " " + kbd("ARROW KEYS") + "<span><b>Walk</b> around the room and garden.</span></div>" +
        '<div class="help-row">' + kbd("E") + "<span><b>Interact</b> with the nearest highlighted object.</span></div>" +
        '<div class="help-row">' + kbd("ESC") + "<span>Close the panel you have open.</span></div>" +
        '<div class="help-row">' + ico("hand") + "<span>Prefer clicking? Every label in the world is a <b>button</b>.</span></div>" +
        '<div class="help-row">' + ico("map") + "<span>Use <b>View Map</b> to warp straight to a destination.</span></div>" +
        '<div class="help-row">' + ico("sound") + "<span><b>Sound</b> is off by default — toggle it top-right. Preference is remembered.</span></div>" +
        '<div class="help-row">' + ico("heart") + "<span>The hearts and XP bar are <b>game decorations</b>, not real stats. Every project link, however, is real.</span></div>" +
      "</div>";
    help.querySelector(".panel-close").addEventListener("click", closeHelp);
  }

  let mapOpen = false;
  function openMap(){
    if (mapOpen) return;
    mapOpen = true;
    SND.sfx.open();
    $("#mapModal").classList.add("open");
    document.body.classList.add("modal-open");
    game.setPaused(true);
    /* draw map */
    const c = $("#mapCanvas");
    const g = c.getContext("2d");
    g.imageSmoothingEnabled = false;
    g.drawImage(game.worldData.canvas, 0, 0, 320, 202);
    /* pins */
    const pins = $("#mapPins");
    pins.innerHTML = "";
    for (const h of game.worldData.HOTSPOTS){
      const b = el("button", "map-pin");
      b.style.left = (h.lx / game.worldData.W * 100) + "%";
      b.style.top = (h.ly / game.worldData.H * 100) + "%";
      b.innerHTML = ico(h.icon);
      b.setAttribute("aria-label", "Travel to " + h.name);
      b.title = h.name;
      b.addEventListener("click", () => {
        const w = game.worldData.WARP[h.id];
        game.warp(w[0], w[1]);
        closeMap();
        toast("Warped to " + h.name);
      });
      pins.appendChild(b);
    }
    const you = el("span", "map-pin you");
    you.innerHTML = ico("user");
    you.setAttribute("aria-label", "Your position");
    const p = game.player;
    you.style.left = (p.x / game.worldData.W * 100) + "%";
    you.style.top = (p.y / game.worldData.H * 100) + "%";
    pins.appendChild(you);
    /* legend */
    const leg = $("#mapModal").querySelector(".map-legend");
    leg.innerHTML = DATA.nav.map(n =>
      '<button class="chip" data-warp="' + n.id + '">' + n.label + "</button>").join("");
    leg.querySelectorAll("button[data-warp]").forEach(b => {
      b.addEventListener("click", () => {
        const h = game.worldData.HOTSPOTS.find(h2 => h2.section === b.dataset.warp);
        if (h){
          const w = game.worldData.WARP[h.id];
          game.warp(w[0], w[1]);
          closeMap();
          toast("Warped to " + h.name);
        }
      });
    });
    $("#mapModal .panel-close").focus();
  }
  function closeMap(){
    mapOpen = false;
    $("#mapModal").classList.remove("open");
    maybeUnpause();
  }

  function openHelp(){
    SND.sfx.open();
    $("#helpModal").classList.add("open");
    document.body.classList.add("modal-open");
    game.setPaused(true);
    $("#helpModal .panel-close").focus();
  }
  function closeHelp(){
    $("#helpModal").classList.remove("open");
    maybeUnpause();
  }

  function maybeUnpause(){
    const anyOpen = currentPanel || mapOpen ||
      $("#helpModal").classList.contains("open") ||
      (menuSheet && menuSheet.classList.contains("open"));
    if (!anyOpen){
      game.setPaused(false);
      document.body.classList.remove("modal-open");
    }
  }

  /* ================================================================
     GLOBAL CONTROLS (sound / fullscreen / esc / toast / tip)
     ================================================================ */
  function wireControls(){
    /* sound */
    const sb = $("#btnSound");
    const syncSound = () => {
      sb.setAttribute("aria-pressed", SND.enabled ? "true" : "false");
      sb.setAttribute("aria-label", "Sound: " + (SND.enabled ? "on" : "off"));
    };
    SND.init(); syncSound();
    sb.addEventListener("click", () => {
      SND.setEnabled(SND.toggle());
      syncSound();
      if (SND.enabled){ SND.sfx.chime(); unlockGameAch("night"); }
      toast(SND.enabled ? "Sound on — ambient night enabled" : "Sound off");
    });
    document.addEventListener("pointerdown", () => SND.kick(), { once: false });

    /* help + map + fullscreen */
    $("#btnHelp").addEventListener("click", openHelp);
    $("#btnMap").addEventListener("click", openMap);
    $("#btnFs").addEventListener("click", () => {
      if (!document.fullscreenElement){
        document.documentElement.requestFullscreen?.().then(() => {
          toast("Fullscreen on — press ESC to leave");
        }, () => toast("Fullscreen isn't available in this browser"));
      } else {
        document.exitFullscreen?.();
      }
    });

    /* ESC handling */
    window.addEventListener("keydown", e => {
      if (e.key !== "Escape") return;
      const m = currentPanel && currentPanel.querySelector(".mini-modal.open");
      if (m){ m.classList.remove("open"); return; }
      if (mapOpen){ closeMap(); return; }
      if ($("#helpModal").classList.contains("open")){ closeHelp(); return; }
      if (menuSheet && menuSheet.classList.contains("open")){ closeMenu(); return; }
      if (currentPanel) closePanel();
    });
  }

  let toastT = 0;
  function toast(msg){
    const t = $("#toast");
    t.textContent = msg;
    t.hidden = false;
    clearTimeout(toastT);
    toastT = setTimeout(() => { t.hidden = true; }, 2400);
  }

  function showTip(){
    const tip = $("#tip");
    const isTouch = document.body.classList.contains("touch");
    tip.innerHTML = isTouch
      ? "<span><b>Welcome to PixelDev.</b> Use the <b>pad</b> to walk, the <b>hand</b> to interact — or simply tap any label in the world.</span>"
      : "<span><b>Welcome to PixelDev.</b> Walk with <kbd>W A S D</kbd>/arrows, press <kbd>E</kbd> near objects — or just click any label. <b>Esc</b> closes panels.</span>";
    const x = el("button", "tip-x");
    x.innerHTML = ico("close");
    x.setAttribute("aria-label", "Dismiss tips");
    x.addEventListener("click", () => {
      tip.hidden = true;
      LS.set("pixeldev.tutorial", "1");
    });
    tip.appendChild(x);
    tip.hidden = false;
  }

  function announce(msg){
    $("#sr").textContent = msg;
  }

  /* ================================================================
     GAME ACHIEVEMENTS
     ================================================================ */
  function unlockGameAch(id){
    if (LS.get("pixeldev.ach." + id) === "1") return;
    LS.set("pixeldev.ach." + id, "1");
    const a = DATA.gameAchievements.find(g => g.id === id);
    if (a){
      SND.sfx.chime();
      toast("Achievement unlocked — " + a.title);
      announce("Achievement unlocked: " + a.title);
    }
  }

  /* ================================================================
     API
     ================================================================ */
  return { init, openPanel, closePanel, openMap, closeMap, openHelp, toast, announce };
})();


