(function () {
  const TOTAL_SHEETS = 20;
  const STATE_KEY = "haanes_1kl_mattehefte_v1";

  let activeSheet = 1;
  let showPageNumbers = true;

  // Beregn standard ukenummer (starter på Uke 37 og hopper over Uke 40 / høstferie og Uke 52/1 juleferie)
  function getDefaultWeekLabel(sheetIndex) {
    let week = 36 + sheetIndex;
    if (week >= 40) week += 1;
    if (week >= 52) week = ((week - 1) % 52) + 2;
    return `Uke ${week}`;
  }

  function createDefaultSettings() {
    const map = {};
    for (let i = 0; i <= TOTAL_SHEETS; i++) {
      if (i === 0) {
        map[0] = {
          visible: true,
          showToc: true
        };
        continue;
      }
      map[i] = {
        visible: true,
        weekLabel: getDefaultWeekLabel(i),
        matte: {
          show: true,
          intro: true,
          dice: true,
          neighbors: true,
          quantity: true,
          count: true
        }
      };
    }
    return map;
  }

  let sheetSettings = loadSettings();

  function loadSettings() {
    try {
      const saved = localStorage.getItem(STATE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const defaults = createDefaultSettings();
        if (parsed[0]) {
          defaults[0] = { ...defaults[0], ...parsed[0] };
        }
        for (let i = 1; i <= TOTAL_SHEETS; i++) {
          if (parsed[i]) {
            defaults[i] = {
              ...defaults[i],
              ...parsed[i],
              matte: { ...defaults[i].matte, ...(parsed[i].matte || {}) }
            };
          }
        }
        return defaults;
      }
    } catch (e) {
      console.warn("Kunne ikke lese lagrede innstillinger:", e);
    }
    return createDefaultSettings();
  }

  function saveSettings() {
    try {
      localStorage.setItem(STATE_KEY, JSON.stringify(sheetSettings));
    } catch (e) {
      console.warn("Kunne ikke lagre innstillinger:", e);
    }
  }

  const ICON_DOC = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`;
  const ICON_EYE_OPEN = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
  const ICON_EYE_OFF = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`;

  const NUMBER_WORDS = {
    1: "en", 2: "to", 3: "tre", 4: "fire", 5: "fem",
    6: "seks", 7: "sju", 8: "åtte", 9: "ni", 10: "ti",
    11: "elleve", 12: "tolv", 13: "tretten", 14: "fjorten", 15: "femten",
    16: "seksten", 17: "sytten", 18: "atten", 19: "nitten", 20: "tjue"
  };

  // ==========================================
  // INNLOGGING OG VANNMERKE FOR HÅNES SKOLE
  // ==========================================
  const HAANES_AUTH = {
    user: "Haanes",
    pass: "Hest1234",
    storageKey: "haanes_arbeidshefte_auth"
  };

  function updateAuthButtons(isLoggedIn) {
    const loginBtn = document.getElementById("sidebarLoginBtn");
    const logoutBtn = document.getElementById("sidebarLogoutBtn");

    if (isLoggedIn) {
      if (loginBtn) loginBtn.classList.add("hidden");
      if (logoutBtn) logoutBtn.classList.remove("hidden");
    } else {
      if (loginBtn) loginBtn.classList.remove("hidden");
      if (logoutBtn) logoutBtn.classList.add("hidden");
    }
  }

  function openLoginModal() {
    const modal = document.getElementById("loginModal");
    const errorMsg = document.getElementById("loginErrorMsg");
    if (errorMsg) errorMsg.classList.add("hidden");
    if (modal) modal.classList.remove("hidden");
  }

  function handleLoginSubmit(event) {
    event.preventDefault();
    const usernameInput = document.getElementById("loginUsername").value.trim();
    const passwordInput = document.getElementById("loginPassword").value;
    const errorMsg = document.getElementById("loginErrorMsg");

    if (usernameInput.toLowerCase() === HAANES_AUTH.user.toLowerCase() && passwordInput === HAANES_AUTH.pass) {
      sessionStorage.setItem(HAANES_AUTH.storageKey, "logged_in");
      document.body.classList.remove("show-watermark");
      document.getElementById("loginModal").classList.add("hidden");
      if (errorMsg) errorMsg.classList.add("hidden");
      updateAuthButtons(true);
    } else {
      if (errorMsg) errorMsg.classList.remove("hidden");
    }
  }

  function continueWithWatermark() {
    sessionStorage.setItem(HAANES_AUTH.storageKey, "guest");
    document.body.classList.add("show-watermark");
    document.getElementById("loginModal").classList.add("hidden");
    updateAuthButtons(false);
  }

  function logoutUser() {
    sessionStorage.removeItem(HAANES_AUTH.storageKey);
    document.body.classList.add("show-watermark");
    updateAuthButtons(false);
    openLoginModal();
  }

  function initAuthWatermark() {
    const savedState = sessionStorage.getItem(HAANES_AUTH.storageKey);
    const modal = document.getElementById("loginModal");

    if (savedState === "logged_in") {
      document.body.classList.remove("show-watermark");
      if (modal) modal.classList.add("hidden");
      updateAuthButtons(true);
    } else if (savedState === "guest") {
      document.body.classList.add("show-watermark");
      if (modal) modal.classList.add("hidden");
      updateAuthButtons(false);
    } else {
      document.body.classList.add("show-watermark");
      if (modal) modal.classList.remove("hidden");
      updateAuthButtons(false);
    }

    const form = document.getElementById("haanesLoginForm");
    if (form) form.addEventListener("submit", handleLoginSubmit);

    const guestBtn = document.getElementById("btnContinueWatermark");
    if (guestBtn) guestBtn.addEventListener("click", continueWithWatermark);

    const loginBtn = document.getElementById("sidebarLoginBtn");
    if (loginBtn) loginBtn.addEventListener("click", openLoginModal);

    const logoutBtn = document.getElementById("sidebarLogoutBtn");
    if (logoutBtn) logoutBtn.addEventListener("click", logoutUser);
  }

  // REDIGER UKENUMRE-MODAL
  document.getElementById("btn-edit-weeks").addEventListener("click", () => {
    const grid = document.getElementById("weeks-editor-grid");
    grid.innerHTML = "";
    for (let i = 1; i <= TOTAL_SHEETS; i++) {
      const matte = window.MATTE_DATA[i] || {};
      const numVal = matte.tall ?? i;
      const row = document.createElement("div");
      row.className = "week-edit-item";
      row.innerHTML = `
        <span>Ark ${i} (Tall ${numVal})</span>
        <input type="text" data-sheet="${i}" value="${sheetSettings[i].weekLabel}" />
      `;
      row.querySelector("input").addEventListener("input", (e) => {
        sheetSettings[i].weekLabel = e.target.value;
        saveSettings();
        renderSidebarCards();
        renderSheets();
      });
      grid.appendChild(row);
    }
    document.getElementById("weeks-modal").classList.remove("hidden");
  });

  document.getElementById("btn-reset-weeks").addEventListener("click", () => {
    for (let i = 1; i <= TOTAL_SHEETS; i++) {
      sheetSettings[i].weekLabel = getDefaultWeekLabel(i);
    }
    saveSettings();
    document.getElementById("btn-edit-weeks").click();
    renderSidebarCards();
    renderSheets();
  });

  document.getElementById("btn-close-weeks").addEventListener("click", () => {
    document.getElementById("weeks-modal").classList.add("hidden");
  });

  document.getElementById("chk-show-pagenums").addEventListener("change", (e) => {
    showPageNumbers = e.target.checked;
    renderSheets();
  });

  setupPrintModals();

  // RENDER KORTENE I VENSTREMENYEN (0–20)
  function renderSidebarCards() {
    const container = document.getElementById("sheet-cards-list");
    container.innerHTML = "";

    // KORT FOR ARK 0 (FORSIDE & INNHOLDSFORTEGNELSE)
    const cfg0 = sheetSettings[0];
    const isCoverSelected = activeSheet === 0;
    const coverCard = document.createElement("div");
    coverCard.dataset.sheet = "0";
    coverCard.className =
      "sheet-card" +
      (isCoverSelected ? " active" : "") +
      (!cfg0.visible ? " is-hidden-sheet" : "");

    coverCard.innerHTML = `
      <div class="card-top-row" style="margin-bottom: ${isCoverSelected && cfg0.visible ? "8px" : "0"};">
        <div class="card-title-left">
          ${ICON_DOC}
          <span>Forside &amp; Innholdsfortegnelse</span>
        </div>
        <div class="card-meta-right">
          <span class="week-badge">Hefte</span>
          <button type="button" class="eye-btn" data-action="toggle-visible" title="${cfg0.visible ? "Skjul forside fra utskrift" : "Vis forside"}">
            ${cfg0.visible ? ICON_EYE_OPEN : ICON_EYE_OFF}
          </button>
        </div>
      </div>

      ${isCoverSelected && cfg0.visible ? `
        <div class="card-subtasks-row">
          <button type="button" class="mini-chip ${cfg0.showToc ? "on" : ""}" data-action="toggle-toc">Innholdsfortegnelse</button>
        </div>
      ` : ""}
    `;

    coverCard.addEventListener("click", (e) => {
      if (e.target.closest("button")) return;
      isManualSidebarClick = true;
      clearTimeout(manualClickTimer);
      manualClickTimer = setTimeout(() => { isManualSidebarClick = false; }, 700);

      activeSheet = 0;
      renderSidebarCards();
      const target = document.getElementById("sheet-page-cover") || document.getElementById("sheet-page-toc");
      if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    coverCard.querySelector('[data-action="toggle-visible"]').addEventListener("click", (e) => {
      e.stopPropagation();
      cfg0.visible = !cfg0.visible;
      saveSettings();
      renderSidebarCards();
      renderSheets();
    });

    const tocBtn = coverCard.querySelector('[data-action="toggle-toc"]');
    if (tocBtn) {
      tocBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        cfg0.showToc = !cfg0.showToc;
        saveSettings();
        renderSidebarCards();
        renderSheets();
      });
    }

    container.appendChild(coverCard);

    for (let i = 1; i <= TOTAL_SHEETS; i++) {
      const cfg = sheetSettings[i];
      const matte = window.MATTE_DATA[i] || {};
      const numVal = matte.tall ?? i;
      const numWord = (matte && (matte.tallOrd || matte.ord)) || NUMBER_WORDS[numVal] || "";
      const isSelected = i === activeSheet;

      const card = document.createElement("div");
      card.dataset.sheet = String(i);
      card.className =
        "sheet-card" +
        (isSelected ? " active" : "") +
        (!cfg.visible ? " is-hidden-sheet" : "");

      const subtaskChips = isSelected ? `
        <button type="button" class="mini-chip ${cfg.matte.intro ? "on" : ""}" data-sub="matte.intro">Tall ${numVal}</button>
        <button type="button" class="mini-chip ${cfg.matte.dice ? "on" : ""}" data-sub="matte.dice">Terning</button>
        <button type="button" class="mini-chip ${cfg.matte.neighbors ? "on" : ""}" data-sub="matte.neighbors">Nabotall</button>
        <button type="button" class="mini-chip ${cfg.matte.quantity ? "on" : ""}" data-sub="matte.quantity">Mengde</button>
        <button type="button" class="mini-chip ${cfg.matte.count ? "on" : ""}" data-sub="matte.count">Tell og skriv</button>
      ` : "";

      card.innerHTML = `
        <div class="card-top-row" style="margin-bottom: ${isSelected ? "8px" : "0"};">
          <div class="card-title-left">
            ${ICON_DOC}
            <span>Arbeidsark ${i} – Tallet ${numVal}${numWord ? ` (${numWord})` : ""}</span>
          </div>
          <div class="card-meta-right">
            <span class="week-badge">${cfg.weekLabel}</span>
            <button type="button" class="eye-btn" data-action="toggle-visible" title="${cfg.visible ? "Skjul ark fra utskrift" : "Vis ark"}">
              ${cfg.visible ? ICON_EYE_OPEN : ICON_EYE_OFF}
            </button>
          </div>
        </div>

        ${isSelected && subtaskChips ? `<div class="card-subtasks-row">${subtaskChips}</div>` : ""}
      `;

      card.addEventListener("click", (e) => {
        if (e.target.closest("button")) return;
        isManualSidebarClick = true;
        clearTimeout(manualClickTimer);
        manualClickTimer = setTimeout(() => { isManualSidebarClick = false; }, 700);

        activeSheet = i;
        renderSidebarCards();
        const targetSheet = document.getElementById(`sheet-page-${i}-matte`);
        if (targetSheet) {
          targetSheet.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      });

      card.querySelector('[data-action="toggle-visible"]').addEventListener("click", (e) => {
        e.stopPropagation();
        cfg.visible = !cfg.visible;
        saveSettings();
        renderSidebarCards();
        renderSheets();
      });

      card.querySelectorAll("[data-sub]").forEach((chip) => {
        chip.addEventListener("click", (e) => {
          e.stopPropagation();
          const subPath = chip.getAttribute("data-sub");
          const [subj, key] = subPath.split(".");
          cfg[subj][key] = !cfg[subj][key];

          saveSettings();
          renderSidebarCards();
          renderSheets();
        });
      });

      container.appendChild(card);
    }
  }

  // VEKTORBANER OG SKRIVERETNING FOR TALL 0–9 (TOR-TRYKKSKRIFT-STIL)
  const DIGIT_TRACING_DATA = {
    0: {
      viewWidth: 74,
      strokes: ["M 49,21 A 23,36 0 1,0 59,50 A 23,36 0 0,0 49,21"],
      startMarker: "M 54,28 A 23,36 0 0,0 38,14",
      arrows: [{ d: "M 59,24 A 27,40 0 0,0 39,9", tip: "39,9 44,6 44,12" }]
    },
    1: {
      viewWidth: 44,
      strokes: ["M 22,14 L 22,86"],
      startMarker: "M 22,14 L 22,38",
      arrows: [{ d: "M 13,14 L 13,34", tip: "13,34 10,28 16,28" }]
    },
    2: {
      viewWidth: 70,
      strokes: ["M 15,33 C 15,10 55,10 55,33 C 55,52 15,72 14,86 L 56,86"],
      startMarker: "M 15,33 C 15,19 25,14 36,14",
      arrows: [{ d: "M 9,31 C 10,16 20,9 32,8", tip: "32,8 26,6 27,12" }]
    },
    3: {
      viewWidth: 70,
      strokes: [
        "M 18,26 C 23,11 52,11 52,29 C 52,42 41,46 30,46",
        "M 30,46 C 43,46 56,52 56,68 C 56,88 22,90 14,76"
      ],
      startMarker: "M 18,26 C 20,17 28,14 37,14",
      arrows: [{ d: "M 12,24 C 15,14 23,9 33,8", tip: "33,8 27,6 28,12" }]
    },
    4: {
      viewWidth: 74,
      strokes: [
        "M 21,14 L 21,49 L 47,49",
        "M 47,14 L 47,86"
      ],
      startMarker: "M 21,14 L 21,34",
      arrows: [
        { d: "M 12,14 L 12,33", tip: "12,33 9,27 15,27" },
        { d: "M 55,14 L 55,33", tip: "55,33 52,27 58,27", label: "2", lx: 60, ly: 23 }
      ]
    },
    5: {
      viewWidth: 76,
      strokes: [
        "M 24,16 L 24,47 C 38,40 60,45 60,66 C 60,89 23,90 20,71",
        "M 24,16 L 58,16"
      ],
      startMarker: "M 24,16 L 24,37",
      arrows: [
        { d: "M 15,16 L 15,35", tip: "15,35 12,29 18,29", label: "1", lx: 4, ly: 17 },
        { d: "M 25,8 L 50,8", tip: "50,8 44,5 44,11", label: "2", lx: 25, ly: -4 }
      ]
    },
    6: {
      viewWidth: 72,
      strokes: ["M 45,14 L 19,55 A 20,21 0 1,0 55,65 A 20,21 0 0,0 19,55"],
      startMarker: "M 45,14 L 35,30",
      arrows: [{ d: "M 37,12 L 28,26", tip: "28,26 28,20 33,23" }]
    },
    7: {
      viewWidth: 70,
      strokes: ["M 14,14 L 56,14 L 27,86"],
      startMarker: "M 14,14 L 44,14",
      arrows: [{ d: "M 15,6 L 46,6", tip: "46,6 40,3 40,9" }]
    },
    8: {
      viewWidth: 72,
      strokes: [
        "M 51,28 C 51,12 21,12 21,29 C 21,40 31,45 36,49 C 42,53 54,58 54,70 C 54,88 18,88 18,70 C 18,58 30,53 36,49 C 41,45 51,40 51,28 Z"
      ],
      startMarker: "M 51,28 C 51,19 44,15 36,15",
      arrows: [
        { d: "M 57,26 C 56,15 48,9 37,9", tip: "37,9 43,6 43,12" }
      ]
    },
    9: {
      viewWidth: 72,
      strokes: [
        "M 52,18 C 33,12 18,21 18,39 C 18,56 37,61 52,48",
        "M 52,18 L 52,86"
      ],
      startMarker: "M 52,18 C 41,14 29,15 22,23",
      arrows: [
        { d: "M 48,10 C 38,7 28,8 20,15", tip: "20,15 26,15 23,10" },
        { d: "M 59,20 L 59,39", tip: "59,39 56,33 62,33", label: "2", lx: 64, ly: 29 }
      ]
    }
  };

  function buildNumberCellSVG(numStr, mode) {
    const digits = numStr.split("");
    const gap = digits.length > 1 ? 4 : 0;
    const totalW = digits.reduce((sum, d) => sum + (DIGIT_TRACING_DATA[d] ? DIGIT_TRACING_DATA[d].viewWidth : 60), 0) + gap * (digits.length - 1);
    let offsetX = 0;
    let innerSVG = "";

    digits.forEach((d) => {
      const spec = DIGIT_TRACING_DATA[d];
      if (!spec) return;
      innerSVG += `<g transform="translate(${offsetX}, 0)">`;

      if (mode === "solid") {
        spec.strokes.forEach((pathD) => {
          innerSVG += `<path d="${pathD}" fill="none" stroke="#1e293b" stroke-width="5.2" stroke-linecap="round" stroke-linejoin="round" />`;
        });
      } else {
        spec.strokes.forEach((pathD) => {
          innerSVG += `<path d="${pathD}" fill="none" stroke="#94a3b8" stroke-width="4.4" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="0.1 7.6" />`;
        });
        if (mode === "guided") {
          innerSVG += `<path d="${spec.startMarker}" fill="none" stroke="#1e293b" stroke-width="5.2" stroke-linecap="round" />`;
          spec.arrows.forEach((arr) => {
            innerSVG += `<path d="${arr.d}" fill="none" stroke="#1e293b" stroke-width="1.8" stroke-linecap="round" />`;
            innerSVG += `<polygon points="${arr.tip}" fill="#1e293b" />`;
            if (arr.label) {
              innerSVG += `<text x="${arr.lx}" y="${arr.ly + 9}" font-family="Trykkskrift, sans-serif" font-size="13" font-weight="700" fill="#1e293b">${arr.label}</text>`;
            }
          });
        }
      }

      innerSVG += `</g>`;
      offsetX += spec.viewWidth + gap;
    });

    return `<svg class="number-trace-svg" viewBox="0 -4 ${totalW} 102" xmlns="http://www.w3.org/2000/svg">${innerSVG}</svg>`;
  }

  function renderNumberPracticeGridHTML(tall) {
    const numStr = String(tall);
    const cells = [
      buildNumberCellSVG(numStr, "solid"),
      buildNumberCellSVG(numStr, "guided"),
      buildNumberCellSVG(numStr, "dotted"),
      "", "", "", "", ""
    ];

    return `
      <div class="number-practice-grid" role="img" aria-label="Øv på å skrive tallet ${numStr}">
        ${cells.map((content) => `<div class="number-practice-cell">${content}</div>`).join("")}
      </div>
    `;
  }

  // RENDER MATTE SEKSJON (EGEN A4-SIDE)
  function renderMatteBodyHTML(matte, cfg) {
    if (!matte) return "";
    const padded = String(matte.tall).padStart(2, "0");

    const renderSymbols = (item, cssClass, maxPerRow = 0) => {
      const sym = String(item.symbol || "●");
      const isImg = /\.(png|jpe?g|svg|webp)$/i.test(sym) || sym.includes("/");
      const single = isImg
        ? `<img src="${sym}" alt="" class="${cssClass}">`
        : `<span>${sym}</span>`;
      return Array.from({ length: item.antall }, (_, idx) => {
        const lineBreak = maxPerRow > 0 && idx > 0 && idx % maxPerRow === 0
          ? `<span class="symbol-row-break"></span>`
          : "";
        return lineBreak + single;
      }).join("");
    };

    let taskNum = 1;
    let html = `<section class="subject-section matte full-page-section">
      <div class="matte-hero-wrap">
        <img src="bilder/tall_${padded}.png" alt="Tallet ${matte.tall}" class="matte-hero-img" onerror="this.parentElement.style.display='none'">
      </div>`;

    if (cfg.intro) {
      html += `
        <div class="task-block">
          <p class="task-title">${taskNum++}. Spor skriveretning og øv på å skrive tallet ${matte.tall}:</p>
          ${renderNumberPracticeGridHTML(matte.tall)}
        </div>`;
    }

    const hasDice = Boolean(cfg.dice && matte.tall !== undefined);
    const hasNeighbors = Boolean(cfg.neighbors && Array.isArray(matte.nabotall));

    if (hasDice || hasNeighbors) {
      const diceCount = Math.max(1, Math.ceil(Number(matte.tall) / 6));
      const diceSVG = `
        <svg class="dice-svg" viewBox="0 0 100 100" aria-label="Tom terning" xmlns="http://www.w3.org/2000/svg">
          <rect x="6" y="6" width="88" height="88" rx="18" fill="#cbd5e1" stroke="#1e293b" stroke-width="3.2"/>
          <rect x="9" y="9" width="82" height="82" rx="34" fill="#ffffff"/>
          <path d="M 14,34 A 24,24 0 0,1 34,14" fill="none" stroke="#f8fafc" stroke-width="3" stroke-linecap="round"/>
          <rect x="6" y="6" width="88" height="88" rx="18" fill="none" stroke="#1e293b" stroke-width="3.2"/>
        </svg>`;
      const diceBoxesHTML = Array.from({ length: diceCount }, () => diceSVG).join("");

      html += `
        <div class="task-block ${hasDice && hasNeighbors ? "task-block-split" : ""}">
          ${hasDice ? `
            <div class="task-split-col">
              <p class="task-title">${taskNum++}. Tegn ${matte.tall} ${Number(matte.tall) === 1 ? "prikk" : "prikker"} på ${diceCount > 1 ? "terningene" : "terningen"}:</p>
              <div class="dice-area" style="${diceCount >= 4 ? "gap: 8px;" : ""}">
                ${diceBoxesHTML}
              </div>
            </div>
          ` : ""}
          ${hasNeighbors ? `
            <div class="task-split-col">
              <p class="task-title">${taskNum++}. Skriv nabotallene som mangler:</p>
              <div class="neighbor-rows">
                ${matte.nabotall
                  .map(
                    (row) => `
                  <div class="neighbor-row">
                    ${row
                      .map((val, idx) => {
                        const cell = val === null ? `<span class="num-box"></span>` : `<span class="num-box filled">${val}</span>`;
                        return idx < row.length - 1 ? `${cell}<span class="dash">–</span>` : cell;
                      })
                      .join("")}
                  </div>`
                  )
                  .join("")}
              </div>
            </div>
          ` : ""}
        </div>`;
    }

    if (cfg.quantity && Array.isArray(matte.mengder)) {
      const maxPerRow = Number(matte.tall) > 12 ? 7 : 5;
      html += `
        <div class="task-block">
          <p class="task-title">${taskNum++}. Sett ring rundt boksene som har lik mengde som ukens tall (${matte.tall}):</p>
          <div class="quantity-grid">
            ${matte.mengder
              .map(
                (m) => `
              <div class="quantity-card">
                ${renderSymbols(m, "quantity-img", maxPerRow)}
              </div>`
              )
              .join("")}
          </div>
        </div>`;
    }

    if (cfg.count && Array.isArray(matte.telleOppgaver)) {
      html += `
        <div class="task-block">
          <p class="task-title">${taskNum++}. Tell figurene og skriv riktig tall i ruten:</p>
          <div class="count-grid">
            ${matte.telleOppgaver
              .slice(0, 3)
              .map(
                (item) => `
              <div class="count-card">
                <div class="count-symbols">${renderSymbols(item, "count-img", 5)}</div>
                <span class="num-box count-answer"></span>
              </div>`
              )
              .join("")}
          </div>
        </div>`;
    }

    html += `</section>`;
    return html;
  }

  // BYGG ENKELT A4-SIDE
  function createA4PageElement({ id, title, weekLabel, subjectTag, bodyHTML, pageIndex, totalPages }) {
    const article = document.createElement("article");
    article.id = id;

    if (id === "sheet-page-cover-back") {
      article.className = "a4-sheet cover-back-sheet";
    } else if (subjectTag === "Oversikt") {
      article.className = "a4-sheet toc-sheet";
    } else {
      article.className = "a4-sheet";
    }

    const parts = title.split(/\s*[–-]\s*/);
    const baseTitle = parts[0] || title;
    const sheetNumMatch = baseTitle.match(/\d+/);
    const sheetNum = sheetNumMatch ? sheetNumMatch[0] : "";

    let formattedTitle = title;
    if (subjectTag === "Regning" || subjectTag === "Matematikk") {
      const matteObj = sheetNum && window.MATTE_DATA ? window.MATTE_DATA[sheetNum] : null;
      const numVal = matteObj && matteObj.tall !== undefined ? matteObj.tall : sheetNum;
      const numWord = (matteObj && (matteObj.tallOrd || matteObj.ord)) || NUMBER_WORDS[numVal] || "";
      formattedTitle = numVal
        ? `${baseTitle} - Tallet: ${numVal}${numWord ? ` - ${numWord}` : ""}`
        : baseTitle;
    }

    const hideHeaderFooter = id === "sheet-page-cover-back" || id === "sheet-page-cover";

    article.innerHTML = `
      <div class="sheet-inner-top">
        ${hideHeaderFooter ? "" : `
          <header class="sheet-header">
            <div class="sheet-title-block">
              <h1>${formattedTitle}</h1>
            </div>
            <div class="student-meta">
              <span>Hånes skole${weekLabel ? ` • ${weekLabel}` : ""}</span>
            </div>
          </header>
        `}

        ${bodyHTML}
      </div>

      ${hideHeaderFooter ? "" : `
        <footer class="sheet-footer ${!showPageNumbers ? "hide-pagenum" : ""}">
          <span>Hånes skole</span>
          <span class="page-num-text">Side ${pageIndex} av ${totalPages}</span>
        </footer>
      `}
    `;

    return article;
  }

  // RENDER ALLE SYNLIGE A4-SIDER
  function renderSheets() {
    const sheetsContainerEl = document.getElementById("sheets-container");
    sheetsContainerEl.innerHTML = "";

    const cfg0 = sheetSettings[0] || { visible: true, showToc: true };
    const showCover = Boolean(cfg0.visible);
    const showToc = Boolean(cfg0.visible && cfg0.showToc);
    const showCoverBack = Boolean(showCover && showToc);

    const taskPages = [];
    const tocEntries = [];
    let currentPageNum = 1 + (showCover ? 1 : 0) + (showToc ? 1 : 0) + (showCoverBack ? 1 : 0);

    for (let i = 1; i <= TOTAL_SHEETS; i++) {
      const cfg = sheetSettings[i];
      if (!cfg.visible) continue;

      const matte = window.MATTE_DATA[i];
      if (!cfg.matte.show || !matte) continue;

      const startPage = currentPageNum;

      taskPages.push({
        id: `sheet-page-${i}-matte`,
        title: `Arbeidsark ${i}`,
        weekLabel: cfg.weekLabel,
        subjectTag: "Regning",
        bodyHTML: renderMatteBodyHTML(matte, cfg.matte)
      });
      currentPageNum++;

      const numVal = matte && matte.tall !== undefined ? matte.tall : i;
      const numWord = (matte && (matte.tallOrd || matte.ord)) || NUMBER_WORDS[numVal] || "";
      const numberStr = `${numVal}${numWord ? ` - ${numWord}` : ""}`;

      tocEntries.push({
        sheetNum: i,
        weekLabel: cfg.weekLabel || "",
        topicHTML: `Tallet: <strong>${numberStr}</strong>`,
        subjects: "Regning",
        pageRange: `${startPage}`
      });
    }

    const pagesToRender = [];

    // 1. FORSIDE (SIDE 1)
    if (showCover) {
      pagesToRender.push({
        id: "sheet-page-cover",
        title: "",
        weekLabel: "",
        subjectTag: "",
        isCover: true,
        bodyHTML: `
          <div class="hefte-cover">
            <div class="cover-inner-border"></div>
            <div class="cover-top-blobs">
              <div class="cover-blob-top-1"></div>
              <div class="cover-blob-top-2"></div>
            </div>

            <div class="cover-header-block">
              <h1 class="cover-title">Arbeidshefte for 1. klasse</h1>
              <div class="cover-divider"></div>
              <p class="cover-subtitle">Tall &amp; Regning (1–20)</p>
            </div>

            <div class="cover-info-box">
              <ul class="cover-bullets">
                <li><span class="cover-dot"></span><span>Heftet tar for seg hvordan tallene 1 til 20 skrives.</span></li>
                <li><span class="cover-dot"></span><span>Her er det øveoppgaver med mengder, telling og nabotall.</span></li>
              </ul>
            </div>

            <div class="cover-image-wrap">
              <div class="cover-image-frame">
                <img src="bilder/forside_mattehefte.png" onerror="this.src='bilder/forside_arbeidshefte.png'" alt="Forsideillustrasjon" class="cover-image" />
              </div>
            </div>

            <div class="cover-name-box">
              <label>Navn:</label>
              <div class="cover-line"></div>
            </div>

            <div class="cover-bottom-area">
              <div class="cover-school-footer">
                <div class="school-line"></div>
                <span class="school-name">HÅNES SKOLEENHET</span>
                <div class="school-line"></div>
              </div>
            </div>

            <div class="cover-bottom-blobs">
              <div class="cover-blob-bot-1"></div>
              <div class="cover-blob-bot-2"></div>
            </div>
          </div>
        `
      });
    }

    // 2. INNHOLDSFORTEGNELSE (SIDE 2)
    if (showToc) {
      const tocRowsHTML = tocEntries.length > 0
        ? tocEntries.map((entry) => `
            <div class="toc-row" style="font-size: 10pt;">
              <div class="toc-left">
                <span class="toc-sheet">Arbeidsark ${entry.sheetNum}</span>
                ${entry.weekLabel ? `<span class="toc-week">(${entry.weekLabel})</span>` : ""}
                ${entry.topicHTML ? `<span class="toc-letters">${entry.topicHTML}</span>` : ""}
              </div>
              <div class="toc-dots"></div>
              <div class="toc-right">
                <span class="toc-subjects">${entry.subjects}</span>
                <span class="toc-page">s. ${entry.pageRange}</span>
              </div>
            </div>
          `).join("")
        : `<p class="toc-empty">Ingen arbeidsark er valgt for visning.</p>`;

      pagesToRender.push({
        id: "sheet-page-toc",
        title: "Innholdsfortegnelse",
        weekLabel: "",
        subjectTag: "Oversikt",
        isToc: true,
        bodyHTML: `
          <div class="hefte-toc">
            <p class="toc-intro" style="margin-bottom: 5mm;">Oversikt over utvalgte matteark i dette heftet:</p>
            <div class="toc-list" style="gap: 2.6mm;">
              ${tocRowsHTML}
            </div>
          </div>
        `
      });
    }

    // 3. MELLOMSIDE I ARK 0 (SIDE 3)
    if (showCoverBack) {
      pagesToRender.push({
        id: "sheet-page-cover-back",
        title: "",
        weekLabel: "",
        subjectTag: "",
        isCover: true,
        bodyHTML: `
          <div class="hefte-cover hefte-cover-faded">
            <div class="cover-inner-border"></div>
            <div class="cover-top-blobs">
              <div class="cover-blob-top-1"></div>
              <div class="cover-blob-top-2"></div>
            </div>

            <div class="cover-header-block">
              <h1 class="cover-title">Mattehefte</h1>
              <div class="cover-divider"></div>
              <p class="cover-subtitle">Tall &amp; Regning</p>
            </div>

            <div class="cover-info-box">
              <ul class="cover-bullets">
                <li><span class="cover-dot"></span><span>Heftet tar for seg hvordan tallene 1 til 20 skrives.</span></li>
                <li><span class="cover-dot"></span><span>Det er lagt inn enkle øveoppgaver med mengder, telling og nabotall.</span></li>
              </ul>
            </div>

            <div class="cover-image-wrap">
              <div class="cover-image-frame">
                <img src="bilder/forside_mattehefte.png" onerror="this.src='bilder/forside_arbeidshefte.png'" alt="Forsideillustrasjon" class="cover-image" />
              </div>
            </div>

            <div class="cover-bottom-area">
              <div class="cover-school-footer">
                <div class="school-line"></div>
                <span class="school-name">HÅNES SKOLEENHET</span>
                <div class="school-line"></div>
              </div>
            </div>

            <div class="cover-bottom-blobs">
              <div class="cover-blob-bot-1"></div>
              <div class="cover-blob-bot-2"></div>
            </div>
          </div>
        `
      });
    }

    // 4. ARBEIDSARK
    pagesToRender.push(...taskPages);

    pagesToRender.forEach((pageData, idx) => {
      const pageEl = createA4PageElement({
        ...pageData,
        pageIndex: idx + 1,
        totalPages: pagesToRender.length
      });
      sheetsContainerEl.appendChild(pageEl);
    });

    updatePageScale();
    initScrollSync();
  }

  function setupPrintModals() {
    const printBtn = document.getElementById("btn-print") || document.querySelector(".btn-print-main");
    const optionsModal = document.getElementById("print-options-modal");
    const guideModal = document.getElementById("pdf-guide-modal");
    const readyModal = document.getElementById("pdf-ready-modal");
    const zoomModal = document.getElementById("guide-zoom-modal");

    if (!printBtn || !optionsModal) return;

    const scopeRadios = optionsModal.querySelectorAll('input[name="printScope"]');
    const includeArk0Cb = document.getElementById("print-include-ark0");
    const estimateEl = document.getElementById("print-estimate-text");
    const currentLabelEl = document.getElementById("print-current-label");

    let awaitingPdfSave = false;

    function getActiveSheetNum() {
      const activeCard = document.querySelector(".sheet-card.active");
      if (activeCard && activeCard.dataset && activeCard.dataset.sheet) {
        const num = parseInt(activeCard.dataset.sheet, 10);
        if (num >= 1) return num;
      }
      return 1;
    }

    function updatePrintEstimate() {
      const scope = optionsModal.querySelector('input[name="printScope"]:checked').value;
      const activeNum = getActiveSheetNum();
      currentLabelEl.textContent = `Arbeidsark ${activeNum} (Tallet ${activeNum})`;

      document.getElementById("print-scope-selected-card").classList.toggle("active", scope === "selected");
      document.getElementById("print-scope-current-card").classList.toggle("active", scope === "current");

      let totalPages = 0;

      if (scope === "selected") {
        if (includeArk0Cb.checked) {
          const cfg0 = sheetSettings[0] || { visible: true, showToc: true };
          totalPages += cfg0.showToc ? 3 : 1;
        }
        for (let i = 1; i <= TOTAL_SHEETS; i++) {
          const cfg = sheetSettings[i];
          if (!cfg || !cfg.visible) continue;
          if (cfg.matte && cfg.matte.show && window.MATTE_DATA[i]) totalPages++;
        }
      } else {
        if (includeArk0Cb.checked) {
          const cfg0 = sheetSettings[0] || { visible: true, showToc: true };
          totalPages += cfg0.showToc ? 3 : 1;
        }
        const cfg = sheetSettings[activeNum];
        if (cfg && cfg.matte && cfg.matte.show && window.MATTE_DATA[activeNum]) totalPages++;
      }

      const physicalSheets = Math.ceil(totalPages / 2);
      estimateEl.textContent = `${physicalSheets} ark (${totalPages} sider)`;
    }

    function applyPrintFilterAndPrint() {
      const scope = optionsModal.querySelector('input[name="printScope"]:checked').value;
      const includeArk0 = includeArk0Cb.checked;
      const activeNum = getActiveSheetNum();

      const prevArk0Visible = sheetSettings[0] ? sheetSettings[0].visible : true;
      let rerendered = false;

      if (sheetSettings[0] && sheetSettings[0].visible !== includeArk0) {
        sheetSettings[0].visible = includeArk0;
        renderSheets();
        rerendered = true;
      }

      const allSheets = document.querySelectorAll(".a4-sheet");
      allSheets.forEach((el) => {
        el.classList.remove("print-skip");
        if (scope === "current") {
          const isArk0 = el.id === "sheet-page-cover" || el.id === "sheet-page-toc" || el.id === "sheet-page-cover-back";
          const isTargetSheet = el.id.startsWith(`sheet-page-${activeNum}-`);
          if (!isTargetSheet && !(includeArk0 && isArk0)) {
            el.classList.add("print-skip");
          }
        }
      });

      window.print();

      document.querySelectorAll(".a4-sheet.print-skip").forEach((el) => el.classList.remove("print-skip"));
      if (rerendered && sheetSettings[0]) {
        sheetSettings[0].visible = prevArk0Visible;
        renderSheets();
      }
    }

    printBtn.addEventListener("click", (e) => {
      e.preventDefault();
      includeArk0Cb.checked = sheetSettings[0] ? Boolean(sheetSettings[0].visible) : true;
      updatePrintEstimate();
      optionsModal.classList.remove("hidden");
    });

    scopeRadios.forEach((r) => r.addEventListener("change", updatePrintEstimate));
    includeArk0Cb.addEventListener("change", updatePrintEstimate);

    document.getElementById("btn-do-normal-print").addEventListener("click", () => {
      optionsModal.classList.add("hidden");
      applyPrintFilterAndPrint();
    });

    document.getElementById("btn-open-pdf-guide").addEventListener("click", () => {
      optionsModal.classList.add("hidden");
      guideModal.classList.remove("hidden");
    });

    document.getElementById("btn-continue-save-pdf").addEventListener("click", () => {
      guideModal.classList.add("hidden");
      awaitingPdfSave = true;
      applyPrintFilterAndPrint();
    });

    window.addEventListener("afterprint", () => {
      if (awaitingPdfSave) {
        awaitingPdfSave = false;
        readyModal.classList.remove("hidden");
      }
    });

    const filePicker = document.getElementById("pdf-file-picker");
    let currentBlobUrl = null;

    document.getElementById("btn-open-saved-pdf").addEventListener("click", () => {
      filePicker.value = "";
      filePicker.click();
    });

    filePicker.addEventListener("change", (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;

      if (currentBlobUrl) {
        URL.revokeObjectURL(currentBlobUrl);
      }
      currentBlobUrl = URL.createObjectURL(file);

      const linkWrap = document.getElementById("opened-pdf-link-wrap");
      const pdfLink = document.getElementById("opened-pdf-link");
      if (pdfLink && linkWrap) {
        pdfLink.href = currentBlobUrl;
        pdfLink.textContent = `📄 Åpne «${file.name}» i ny fane →`;
        linkWrap.classList.remove("hidden");
      }

      setTimeout(() => {
        window.open(currentBlobUrl, "_blank", "noopener");
      }, 150);
    });

    document.querySelectorAll(".pmodal-tabs").forEach((tabBar) => {
      tabBar.addEventListener("click", (e) => {
        const btn = e.target.closest(".pmodal-tab");
        if (!btn) return;
        const container = tabBar.closest(".pmodal-body");
        tabBar.querySelectorAll(".pmodal-tab").forEach((t) => t.classList.remove("active"));
        container.querySelectorAll(".pmodal-tab-pane").forEach((p) => p.classList.remove("active"));
        btn.classList.add("active");
        const target = document.getElementById(btn.dataset.tabTarget);
        if (target) target.classList.add("active");
      });
    });

    document.querySelectorAll("[data-zoom-img]").forEach((el) => {
      el.addEventListener("click", (e) => {
        e.preventDefault();
        document.getElementById("guide-zoom-img").src = el.dataset.zoomImg;
        document.getElementById("guide-zoom-title").textContent = el.dataset.zoomTitle || "Veiledningsbilde";
        zoomModal.classList.remove("hidden");
      });
    });

    document.querySelectorAll("[data-close-pmodal]").forEach((btn) => {
      btn.addEventListener("click", () => {
        document.getElementById(btn.dataset.closePmodal).classList.add("hidden");
      });
    });

    [optionsModal, guideModal, readyModal, zoomModal].forEach((modal) => {
      modal.addEventListener("click", (e) => {
        if (e.target === modal) modal.classList.add("hidden");
      });
    });
  }

  let sheetScrollObserver = null;
  let isManualSidebarClick = false;
  let manualClickTimer = null;

  function initScrollSync() {
    if (sheetScrollObserver) {
      sheetScrollObserver.disconnect();
    }

    const sheets = document.querySelectorAll("#sheets-container .a4-sheet");
    if (!sheets.length) return;

    const visibilityMap = new Map();

    sheetScrollObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        visibilityMap.set(entry.target.id, entry.intersectionRatio);
      });

      if (isManualSidebarClick) return;

      let bestId = null;
      let maxRatio = 0;

      visibilityMap.forEach((ratio, id) => {
        if (ratio > maxRatio) {
          maxRatio = ratio;
          bestId = id;
        }
      });

      if (!bestId || maxRatio < 0.15) return;

      let sheetNum = 0;
      if (bestId.startsWith("sheet-page-")) {
        const parts = bestId.split("-");
        const parsed = parseInt(parts[2], 10);
        if (!isNaN(parsed)) {
          sheetNum = parsed;
        }
      }

      setActiveSidebarCard(sheetNum);
    }, {
      threshold: [0, 0.15, 0.3, 0.5, 0.75, 1.0]
    });

    sheets.forEach((sheet) => sheetScrollObserver.observe(sheet));
  }

  function setActiveSidebarCard(sheetNum) {
    if (activeSheet === sheetNum) return;
    activeSheet = sheetNum;
    renderSidebarCards();

    const targetCard = document.querySelector(`.sheet-card[data-sheet="${sheetNum}"]`);
    if (targetCard) {
      targetCard.scrollIntoView({
        behavior: "smooth",
        block: "nearest"
      });
    }
  }

  let customZoom = null;

  function updatePageScale() {
    const container = document.getElementById("sheets-container");
    const pages = Array.from(document.querySelectorAll("#sheets-container .a4-sheet"));

    if (!container || pages.length === 0) return;

    const scrollWrapper = container.parentElement || container;
    const firstPage = pages[0];

    const pageW = firstPage.offsetWidth;
    const pageH = firstPage.offsetHeight;

    if (!pageW || !pageH) return;

    const containerW = scrollWrapper.clientWidth - 96;
    const containerH = window.innerHeight - 36;

    let scale;
    if (customZoom !== null) {
      scale = customZoom;
    } else {
      const scaleW = containerW / pageW;
      const scaleH = containerH / pageH;
      scale = Math.min(scaleW, scaleH, 1.15);
    }

    scale = Math.max(scale, 0.25);

    pages.forEach((page, index) => {
      page.style.transform = `scale(${scale})`;
      page.style.transformOrigin = "top center";

      const nextPage = pages[index + 1];

      const getSheetKey = (el) => {
        if (!el) return "";
        if (el.id === "sheet-page-cover" || el.id === "sheet-page-toc" || el.id === "sheet-page-cover-back") return "ark-0";
        const parts = el.id.split("-");
        return parts.length >= 3 ? `ark-${parts[2]}` : el.id;
      };

      const isLastPageOfSheet = !nextPage || getSheetKey(nextPage) !== getSheetKey(page);
      const spacing = isLastPageOfSheet ? 32 : 14;

      page.style.marginBottom = `${(scale - 1) * pageH + spacing}px`;
    });

    const zoomText = document.getElementById("zoomValText");
    if (zoomText) {
      const pct = Math.round(scale * 100);
      zoomText.textContent = customZoom !== null ? `${pct}%` : `Auto\n(${pct}%)`;
    }
  }

  function changeZoom(delta) {
    const page = document.querySelector("#sheets-container .a4-sheet");
    if (!page) return;

    const currentMatrix = window.getComputedStyle(page).transform;
    let currentScale = 1;

    if (currentMatrix && currentMatrix !== "none") {
      const values = currentMatrix.split("(")[1].split(")")[0].split(",");
      currentScale = parseFloat(values[0]) || 1;
    }

    const base = customZoom !== null ? customZoom : currentScale;
    customZoom = Math.min(Math.max(Math.round((base + delta) * 100) / 100, 0.3), 2.0);
    updatePageScale();
  }

  function resetZoom() {
    customZoom = null;
    updatePageScale();
  }

  function initZoomControls() {
    const btnIn = document.getElementById("btn-zoom-in");
    const btnOut = document.getElementById("btn-zoom-out");
    const btnReset = document.getElementById("zoomValText");

    if (btnIn) btnIn.addEventListener("click", () => changeZoom(0.05));
    if (btnOut) btnOut.addEventListener("click", () => changeZoom(-0.05));
    if (btnReset) btnReset.addEventListener("click", resetZoom);

    window.addEventListener("resize", updatePageScale);
  }

  window.openAppSwitchModal = function () {
    const modal = document.getElementById("appSwitchModal");
    if (modal) modal.style.display = "flex";
  };

  window.closeAppSwitchModal = function () {
    const modal = document.getElementById("appSwitchModal");
    if (modal) modal.style.display = "none";
  };

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      window.closeAppSwitchModal();
    }
  });

  // INIT
  initAuthWatermark();
  initZoomControls();
  renderSidebarCards();
  renderSheets();
})();