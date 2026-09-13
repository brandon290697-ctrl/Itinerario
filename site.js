(function () {
  const tripStart = new Date("2026-10-05T00:00:00-06:00");
  const tripEnd = new Date("2026-10-24T23:59:59-06:00");
  const planningStart = new Date("2026-07-01T00:00:00-06:00");
  const dayDates = {
    "00": "2026-10-05",
    "01": "2026-10-07",
    "02": "2026-10-08",
    "03": "2026-10-09",
    "04": "2026-10-10",
    "05": "2026-10-11",
    "06": "2026-10-12",
    "07": "2026-10-13",
    "08": "2026-10-14",
    "09": "2026-10-15",
    "10": "2026-10-16",
    "11": "2026-10-17",
    "12": "2026-10-18",
    "13": "2026-10-19",
    "14": "2026-10-20",
    "15": "2026-10-21",
    "16": "2026-10-22",
    "17": "2026-10-23",
    "18": "2026-10-24"
  };
  const hotelByRange = [
    { from: 1, to: 4, label: "Hotel Osaka", query: "Cross Hotel Osaka, Osaka, Japan" },
    { from: 5, to: 9, label: "Hotel Kyoto", query: "Henn na Hotel Premier Kyoto Gojo Karasuma, 195 Daikokucho, Shimogyo Ward, Kyoto, 600-8161, Japan" },
    { from: 10, to: 18, label: "Hotel Tokyo", query: "Henn na Hotel Premier Tokyo Asakusa Tawaramachi, Tokyo, Japan" }
  ];

  function qs(selector, root = document) {
    return root.querySelector(selector);
  }

  function qsa(selector, root = document) {
    return Array.from(root.querySelectorAll(selector));
  }

  function normalize(value) {
    return (value || "")
      .toString()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  }

  function cityFromCard(card) {
    const text = normalize(card.textContent);
    if (text.includes("kyoto") || text.includes("uji") || text.includes("arashiyama")) return "kyoto";
    if (text.includes("tokyo") || text.includes("shibuya") || text.includes("asakusa") || text.includes("kamakura") || text.includes("narita")) return "tokyo";
    return "osaka";
  }

  function localIsoDate(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function todayDayNumber() {
    const today = localIsoDate();
    const entry = Object.entries(dayDates).find(([, value]) => value === today);
    return entry ? Number(entry[0]) : null;
  }

  function dayFromHref(value) {
    const match = String(value || "").match(/dia_(\d{2})\.html/i);
    return match ? Number(match[1]) : null;
  }

  function currentPageDayNumber() {
    return dayFromHref(location.pathname);
  }

  function padDay(day) {
    return String(day).padStart(2, "0");
  }

  function dayUrl(day) {
    return `dia_${padDay(day)}.html`;
  }

  function readLastDay() {
    try {
      return JSON.parse(localStorage.getItem("japon2026:lastDay") || "null");
    } catch {
      return null;
    }
  }

  function bestSavedDay() {
    const last = readLastDay();
    if (last?.page) return last;
    let best = null;
    for (let i = 0; i <= 18; i += 1) {
      const key = `japon2026_dia_${padDay(i)}_paso`;
      const step = Number(localStorage.getItem(key) || 0);
      if (step > 0) best = { day: i, page: dayUrl(i), step: step + 1, total: null };
    }
    return best;
  }

  function hotelForDay(day) {
    return hotelByRange.find(item => day >= item.from && day <= item.to) || null;
  }

  function mapsTo(destination) {
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}&travelmode=transit`;
  }

  function progressInfo() {
    const now = new Date();
    if (now >= tripStart && now <= tripEnd) {
      return { title: "Viaje en curso", hint: "Ya están en Japón.", value: 100 };
    }
    if (now > tripEnd) {
      return { title: "Viaje completado", hint: "Japón 2026 cerrado.", value: 100 };
    }
    const remaining = Math.max(0, Math.ceil((tripStart - now) / 86400000));
    const total = Math.max(1, tripStart - planningStart);
    const elapsed = Math.max(0, now - planningStart);
    const value = Math.max(0, Math.min(99, Math.round((elapsed / total) * 100)));
    return {
      title: `${remaining} días para el Día 0`,
      hint: `${value}% hacia Japón`,
      value
    };
  }

  function addHomeEnhancements() {
    const hero = qs(".hero");
    const grid = qs(".grid");
    if (!hero || !grid) return;

    const cards = qsa(".daycard", grid);
    if (!cards.length) return;
    document.body.classList.add("is-home");
    const today = todayDayNumber();
    const nowIso = localIsoDate();
    cards.forEach((card, index) => {
      const day = dayFromHref(card.getAttribute("href"));
      card.dataset.search = normalize(card.textContent);
      card.dataset.city = cityFromCard(card);
      if (day !== null) {
        card.dataset.day = String(day);
        const date = dayDates[padDay(day)];
        const savedStep = Number(localStorage.getItem(`japon2026_dia_${padDay(day)}_paso`) || 0);
        if (date && date < nowIso) card.classList.add("day-past");
        if (date && date > nowIso) card.classList.add("day-future");
        if (day === today) card.classList.add("day-today");
        if (savedStep > 0) card.classList.add("day-started");
        addCardBadge(card, day, savedStep, day === today);
      }
      card.style.setProperty("--fallback-scene", fallbackScene(index, card.dataset.city));
    });

    const info = progressInfo();
    const tools = document.createElement("section");
    tools.className = "home-tools";
    tools.innerHTML = `
      <div class="trip-progress-card" aria-label="Progreso hacia el viaje">
        <div class="trip-progress-top">
          <strong>${info.title}</strong>
          <span>${info.hint}</span>
        </div>
        <div class="trip-progress-track" style="--trip-progress:${info.value}%">
          <div class="trip-progress-fill"></div>
          <span class="trip-progress-plane" aria-hidden="true">✈</span>
        </div>
      </div>
      <label class="search-shell">
        <span aria-hidden="true">⌕</span>
        <input class="trip-search" type="search" placeholder="Buscar: pokemon, ramen, hotel, kyoto..." autocomplete="off">
      </label>
      <div class="city-filter" aria-label="Filtrar por ciudad">
        <button class="city-chip active" type="button" data-city="all">Todo</button>
        <button class="city-chip" type="button" data-city="osaka">Osaka</button>
        <button class="city-chip" type="button" data-city="kyoto">Kyoto</button>
        <button class="city-chip" type="button" data-city="tokyo">Tokyo</button>
      </div>
      <div class="result-count">${cards.length} días visibles</div>
    `;
    hero.insertAdjacentElement("afterend", tools);
    addHomeSmartPanel(tools, cards, today);

    const empty = document.createElement("div");
    empty.className = "empty-filter-state";
    empty.textContent = "No encontré días con ese filtro.";
    grid.insertAdjacentElement("afterend", empty);

    let activeCity = "all";
    const input = qs(".trip-search", tools);
    const counter = qs(".result-count", tools);
    const chips = qsa(".city-chip", tools);

    function applyFilters() {
      const term = normalize(input.value);
      let visible = 0;
      cards.forEach(card => {
        const matchesCity = activeCity === "all" || card.dataset.city === activeCity;
        const matchesTerm = !term || card.dataset.search.includes(term);
        const show = matchesCity && matchesTerm;
        card.hidden = !show;
        if (show) visible += 1;
      });
      counter.textContent = `${visible} día${visible === 1 ? "" : "s"} visible${visible === 1 ? "" : "s"}`;
      empty.classList.toggle("visible", visible === 0);
    }

    input.addEventListener("input", applyFilters);
    chips.forEach(chip => {
      chip.addEventListener("click", () => {
        activeCity = chip.dataset.city;
        chips.forEach(item => item.classList.toggle("active", item === chip));
        applyFilters();
      });
    });
  }

  function addCardBadge(card, day, savedStep, isToday) {
    if (qs(".day-status-badge", card)) return;
    const badge = document.createElement("span");
    badge.className = "day-status-badge";
    if (isToday) {
      badge.textContent = "Hoy";
      badge.classList.add("today");
    } else if (savedStep > 0) {
      badge.textContent = `Paso ${savedStep + 1}`;
      badge.classList.add("started");
    } else if (dayDates[padDay(day)] < localIsoDate()) {
      badge.textContent = "Pasado";
      badge.classList.add("past");
    } else {
      badge.textContent = "Plan";
    }
    card.appendChild(badge);
  }

  function addHomeSmartPanel(anchor, cards, today) {
    const last = bestSavedDay();
    const panel = document.createElement("section");
    panel.className = "home-smart";

    const todayCard = today !== null ? cards.find(card => Number(card.dataset.day) === today) : null;
    const todayTitle = todayCard ? (qs(".ctitle", todayCard)?.textContent || `Día ${today}`) : "Todavía no hay día activo";
    const todayHref = todayCard?.getAttribute("href") || dayUrl(0);
    const lastTitle = last?.day !== undefined ? `Día ${last.day} · paso ${last.step || 1}${last.total ? `/${last.total}` : ""}` : "Sin avance guardado";
    const lastHref = last?.page || todayHref;

    panel.innerHTML = `
      <a class="smart-card smart-today" href="${todayHref}">
        <span class="smart-kicker">${todayCard ? "Abrir el día de hoy" : "Durante el viaje aparecerá aquí"}</span>
        <strong>${todayTitle}</strong>
        <small>${todayCard ? "Ir directo al itinerario del día actual" : "Mientras tanto, puede abrir el Día 0"}</small>
      </a>
      <a class="smart-card smart-continue" href="${lastHref}">
        <span class="smart-kicker">Continuar</span>
        <strong>${lastTitle}</strong>
        <small>Retoma el último punto que quedó guardado en este dispositivo</small>
      </a>
    `;
    anchor.insertAdjacentElement("afterend", panel);
  }

  function fallbackScene(index, city) {
    const palettes = {
      osaka: "linear-gradient(135deg,#fde2d1,#f8fafc 52%,#dbeafe)",
      kyoto: "linear-gradient(135deg,#fee2e2,#f0fdf4 52%,#e0f2fe)",
      tokyo: "linear-gradient(135deg,#dbeafe,#f5d0fe 54%,#fff7ed)"
    };
    return palettes[city] || palettes.osaka;
  }

  function addDayEnhancements() {
    if (!qs("#timeline") || !qs("#prev") || !qs("#next")) return;
    document.body.classList.add("is-day", "compact-details");
    const pageKey = `japon2026:${location.pathname}:routeMode`;
    if (localStorage.getItem(pageKey) === "1") document.body.classList.add("route-mode");

    addDayAssist();
    addDetailToggle();
    addTravelDock(pageKey);
    improveMapLoading();
    syncDayMemory();
  }

  function addDayAssist() {
    if (qs(".day-assist")) return;
    const day = currentPageDayNumber();
    const chips = qs(".infochips");
    if (day === null || !chips) return;
    const today = todayDayNumber();
    const hotel = hotelForDay(day);
    const assist = document.createElement("section");
    assist.className = "day-assist";
    assist.innerHTML = `
      <div>
        <span>${day === today ? "Hoy" : "Día guardado"}</span>
        <strong>${day === today ? "Este es el plan activo de hoy" : "Se guarda automáticamente el paso donde va"}</strong>
      </div>
      <div class="day-assist-actions">
        <a class="day-assist-link" href="index.html">Todos</a>
        ${hotel ? `<a class="day-assist-link hotel" href="${mapsTo(hotel.query)}" target="_blank" rel="noopener">${hotel.label}</a>` : ""}
      </div>
    `;
    chips.insertAdjacentElement("afterend", assist);
  }

  function addDetailToggle() {
    const detail = qs("#detail");
    if (!detail || qs(".detail-toggle")) return;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "detail-toggle";
    button.textContent = "Ver detalles";
    detail.insertAdjacentElement("beforebegin", button);
    button.addEventListener("click", () => {
      const open = document.body.classList.toggle("details-open");
      button.textContent = open ? "Ocultar detalles" : "Ver detalles";
    });
  }

  function addTravelDock(pageKey) {
    if (qs(".travel-dock")) return;
    const day = currentPageDayNumber();
    const hotel = day === null ? null : hotelForDay(day);
    const dock = document.createElement("nav");
    dock.className = "travel-dock";
    dock.setAttribute("aria-label", "Controles del día");
    dock.innerHTML = `
      <button type="button" data-dock="prev">Anterior</button>
      <button class="dock-primary" type="button" data-dock="next">Siguiente</button>
      <a class="dock-map" href="#" target="_blank" rel="noopener" data-dock="map">Mapa</a>
      ${hotel ? `<a class="dock-hotel" href="${mapsTo(hotel.query)}" target="_blank" rel="noopener" data-dock="hotel">Hotel</a>` : ""}
      <button class="dock-toggle" type="button" data-dock="mode">Modo</button>
    `;
    document.body.appendChild(dock);

    const dockMap = qs("[data-dock='map']", dock);
    const dockMode = qs("[data-dock='mode']", dock);

    function syncDock() {
      const prev = qs("#prev");
      const next = qs("#next");
      const maps = qs("#mapsLeg");
      qsa("[data-dock='prev']", dock).forEach(button => button.toggleAttribute("disabled", Boolean(prev?.disabled)));
      qsa("[data-dock='next']", dock).forEach(button => {
        button.textContent = next?.textContent?.includes("completado") ? "Listo" : "Siguiente";
        button.toggleAttribute("disabled", Boolean(next?.disabled));
      });
      if (maps?.href) dockMap.href = maps.href;
      dockMode.classList.toggle("active", document.body.classList.contains("route-mode"));
      dockMode.textContent = document.body.classList.contains("route-mode") ? "Completo" : "Ruta";
      syncDayMemory();
    }

    dock.addEventListener("click", event => {
      const control = event.target.closest("[data-dock]");
      if (!control) return;
      const action = control.dataset.dock;
      if (action === "prev") qs("#prev")?.click();
      if (action === "next") qs("#next")?.click();
      if (action === "mode") {
        const enabled = document.body.classList.toggle("route-mode");
        localStorage.setItem(pageKey, enabled ? "1" : "0");
      }
      setTimeout(syncDock, 50);
    });

    const observer = new MutationObserver(syncDock);
    ["count", "mapsLeg", "next", "prev", "title"].forEach(id => {
      const node = qs(`#${id}`);
      if (node) observer.observe(node, { attributes: true, childList: true, subtree: true });
    });
    syncDock();
  }

  function improveMapLoading() {
    const frame = qs("#map");
    if (!frame) return;
    frame.addEventListener("load", () => frame.classList.add("map-loaded"));
  }

  function syncDayMemory() {
    const day = currentPageDayNumber();
    if (day === null) return;
    const countText = qs("#count")?.textContent || "1";
    const totalText = qs(".daypill")?.textContent || "";
    const step = Math.max(1, Number(countText.match(/\d+/)?.[0] || 1));
    const total = Number(totalText.match(/\/\s*(\d+)/)?.[1] || 0) || null;
    const title = qs("h1")?.textContent?.trim() || `Día ${day}`;
    localStorage.setItem("japon2026:lastDay", JSON.stringify({
      day,
      page: dayUrl(day),
      step,
      total,
      title,
      updatedAt: Date.now()
    }));
  }

  document.addEventListener("DOMContentLoaded", () => {
    addHomeEnhancements();
    addDayEnhancements();
  });
})();
