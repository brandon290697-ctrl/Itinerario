(function () {
  const tripStart = new Date("2026-10-05T00:00:00-06:00");
  const tripEnd = new Date("2026-10-24T23:59:59-06:00");
  const planningStart = new Date("2026-07-01T00:00:00-06:00");

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
    cards.forEach((card, index) => {
      card.dataset.search = normalize(card.textContent);
      card.dataset.city = cityFromCard(card);
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

    addDetailToggle();
    addTravelDock(pageKey);
    improveMapLoading();
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
    const dock = document.createElement("nav");
    dock.className = "travel-dock";
    dock.setAttribute("aria-label", "Controles del día");
    dock.innerHTML = `
      <button type="button" data-dock="prev">Anterior</button>
      <button class="dock-primary" type="button" data-dock="next">Siguiente</button>
      <a class="dock-map" href="#" target="_blank" rel="noopener" data-dock="map">Mapa</a>
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
      dockMode.textContent = document.body.classList.contains("route-mode") ? "Completo" : "Modo";
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

  document.addEventListener("DOMContentLoaded", () => {
    addHomeEnhancements();
    addDayEnhancements();
  });
})();
