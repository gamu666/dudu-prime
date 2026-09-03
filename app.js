(function () {
  document.getElementById("year").textContent = new Date().getFullYear();
  document.getElementById("brand-name").textContent = SITE_CONFIG.BRAND.name;
  document.getElementById("brand-name-2").textContent = SITE_CONFIG.BRAND.name;
  document.getElementById("brand-phone").textContent = SITE_CONFIG.BRAND.phone;
  document.getElementById("brand-phone-2").textContent = SITE_CONFIG.BRAND.phone;
  document.getElementById("brand-email").textContent = SITE_CONFIG.BRAND.email;
    document.getElementById("brand-name-3").textContent = SITE_CONFIG.BRAND.name;

  const grid = document.getElementById("listing-grid");
  const params = new URLSearchParams(location.search);
  let allListings = [];
  let currentListings = [];
  let propertyMap = null;
  let mapLayer = null;
  let showingSaved = params.get("saved") === "1";
  const SAVED_KEY = "urguu-saved-listings";
  const COMPARE_KEY = "urguu-compare-listings";

  function savedIds() {
    try { return new Set(JSON.parse(localStorage.getItem(SAVED_KEY) || "[]")); }
    catch (_) { return new Set(); }
  }

  function toggleSaved(id) {
    const saved = savedIds();
    if (saved.has(id)) saved.delete(id); else saved.add(id);
    localStorage.setItem(SAVED_KEY, JSON.stringify([...saved]));
    return saved.has(id);
  }

  function compareIds() {
    try { return new Set(JSON.parse(localStorage.getItem(COMPARE_KEY) || "[]")); }
    catch (_) { return new Set(); }
  }

  function setCompare(ids) {
    localStorage.setItem(COMPARE_KEY, JSON.stringify([...ids]));
    updateCompareTray();
  }

  function updateSavedControl() {
    const count = savedIds().size;
    const button = document.getElementById("saved-filter-button");
    document.getElementById("saved-count").textContent = count;
    button.classList.toggle("is-active", showingSaved);
    button.setAttribute("aria-pressed", String(showingSaved));
  }

  function scrollToListings() {
    requestAnimationFrame(() => document.getElementById("listings-section").scrollIntoView({
      behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
      block: "start"
    }));
  }

  function pulse(element) {
    if (!element.animate || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    element.animate([{ transform: "scale(.8)" }, { transform: "scale(1.12)" }, { transform: "scale(1)" }], { duration: 320, easing: "cubic-bezier(.2,.8,.2,1)" });
  }

  function enhanceSelect(select) {
    const shell = document.createElement("div");
    shell.className = "custom-select";
    const trigger = document.createElement("button");
    trigger.type = "button";
    trigger.className = "custom-select-trigger";
    trigger.dataset.for = select.id;
    trigger.setAttribute("aria-haspopup", "listbox");
    trigger.setAttribute("aria-expanded", "false");
    const menu = document.createElement("div");
    menu.className = "custom-select-menu";
    menu.setAttribute("role", "listbox");

    function sync() {
      const selected = select.options[select.selectedIndex];
      trigger.innerHTML = `<span>${selected.textContent}</span><i aria-hidden="true"></i>`;
      menu.querySelectorAll("button").forEach(option => {
        const active = option.dataset.value === select.value;
        option.classList.toggle("is-selected", active);
        option.setAttribute("aria-selected", String(active));
      });
    }
    function close() {
      shell.classList.remove("is-open");
      trigger.setAttribute("aria-expanded", "false");
    }

    [...select.options].forEach(option => {
      const item = document.createElement("button");
      item.type = "button";
      item.setAttribute("role", "option");
      item.dataset.value = option.value;
      item.innerHTML = `<span>${option.textContent}</span><i aria-hidden="true"></i>`;
      item.addEventListener("click", () => {
        select.value = option.value;
        select.dispatchEvent(new Event("change", { bubbles: true }));
        sync();
        close();
        trigger.focus();
      });
      menu.appendChild(item);
    });
    trigger.addEventListener("click", () => {
      const opening = !shell.classList.contains("is-open");
      document.querySelectorAll(".custom-select.is-open").forEach(open => open.classList.remove("is-open"));
      shell.classList.toggle("is-open", opening);
      trigger.setAttribute("aria-expanded", String(opening));
    });
    select.classList.add("native-select-enhanced");
    select.insertAdjacentElement("afterend", shell);
    shell.append(trigger, menu);
    select.addEventListener("change", sync);
    sync();
    return { shell, close };
  }

  function syncCategoryState(type) {
    const selectedType = (type || "").trim().toLocaleLowerCase("mn");
    document.querySelectorAll(".tile[data-type]").forEach(tile => {
      const isActive = tile.dataset.type.trim().toLocaleLowerCase("mn") === selectedType;
      tile.classList.toggle("is-active", isActive);
      if (isActive) tile.setAttribute("aria-current", "true");
      else tile.removeAttribute("aria-current");
    });
  }

  function statusBadgeClass(status) {
    return status === "ЗАРАГДСАН" ? "badge status-sold" : "badge";
  }

  function card(l, index) {
    const chips = specsChips(l).map(c => `<span class="chip">${c}</span>`).join("");
    const isSaved = savedIds().has(l.id);
    const isCompared = compareIds().has(l.id);
    return `
      <article class="card card-enter" data-listing-id="${l.id}" data-open-id="${l.id}" tabindex="0" aria-label="${l.title || "Зар харах"}" style="--card-delay:${Math.min(index, 8) * 65}ms">
        <div class="card-link">
        <div class="card-photo" data-folder="${l.photoFolder || ""}" style="--image-position:${l.imagePosition || "center"}">
          <span class="${statusBadgeClass(l.status)}">${statusLabel(l.status)}</span>
        </div>
        <div class="card-body">
          <div class="card-price">${formatPrice(l.price, l.status)}</div>
          <div class="card-title">${l.title || "Гарчиггүй зар"}</div>
          <div class="card-loc"><span class="location-mark" aria-hidden="true"></span>${[l.district, l.location].filter(Boolean).join(", ")}</div>
          <div class="card-specs">${chips}</div>
        </div>
        </div>
        <div class="card-actions">
          <button class="compare-button${isCompared ? " is-active" : ""}" type="button" data-compare-id="${l.id}" aria-pressed="${isCompared}"><span></span>Харьцуулах</button>
        </div>
        <button class="save-button${isSaved ? " is-saved" : ""}" type="button" data-save-id="${l.id}" aria-label="Зар хадгалах" aria-pressed="${isSaved}">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z"/></svg>
        </button>
      </article>`;
  }

  function render(list) {
    currentListings = list;
    if (!list.length) {
      grid.innerHTML = showingSaved
        ? `<div class="empty-state saved-empty"><strong>Хадгалсан зар алга байна</strong><span>Таалагдсан зарынхаа зүрхэн дээр дарахад энд хадгалагдана.</span></div>`
        : `<p class="empty-state">Одоогоор тохирох зар алга байна. Sheet-дээ мэдээлэл нэмсэн эсэхээ эсвэл шүүлтүүрээ шалгана уу.</p>`;
      return;
    }
    grid.innerHTML = list.map(card).join("");
    // lazily fill in cover photos where a Drive folder link exists
    grid.querySelectorAll(".card-photo[data-folder]").forEach(async (el) => {
      const folder = el.getAttribute("data-folder");
      if (!folder) return;
      const imgs = await fetchFolderImages(folder);
      if (imgs.length) {
        const img = document.createElement("img");
        el.style.backgroundImage = `url(${imgs[0].tiny})`;
        const listing = allListings.find(item => item.photoFolder === folder);
        if (listing) el.style.setProperty("--image-position", listing.imagePosition || "center");
        img.src = imgs[0].card;
        img.alt = "";
        img.addEventListener("load", () => img.classList.add("is-loaded"), { once: true });
        el.prepend(img);
      }
    });
  }

  function compactPrice(price) {
    const n = parseInt(String(price).replace(/[^\d]/g, ""), 10);
    if (!Number.isFinite(n)) return "Үнэ асуух";
    if (n >= 1e9) return `${(n / 1e9).toFixed(n % 1e9 ? 1 : 0)} тэрбум`;
    if (n >= 1e6) return `${(n / 1e6).toFixed(n % 1e6 ? 1 : 0)} сая`;
    return n.toLocaleString("mn-MN");
  }

  function closePanels() {
    document.querySelectorAll(".saved-drawer,.quick-modal,.compare-modal").forEach(panel => {
      panel.classList.remove("is-open");
      panel.setAttribute("aria-hidden", "true");
    });
    document.getElementById("panel-backdrop").classList.remove("is-open");
    document.body.classList.remove("panel-open");
  }

  function openPanel(panel) {
    closePanels();
    panel.classList.add("is-open");
    panel.setAttribute("aria-hidden", "false");
    document.getElementById("panel-backdrop").classList.add("is-open");
    document.body.classList.add("panel-open");
    panel.querySelector("button")?.focus();
  }

  function renderSavedDrawer() {
    const saved = savedIds();
    const items = allListings.filter(l => saved.has(l.id));
    const list = document.getElementById("saved-drawer-list");
    list.innerHTML = items.length ? items.map(l => `<article class="drawer-listing"><div><span>${l.type || "Үл хөдлөх"}</span><strong>${l.title || "Гарчиггүй зар"}</strong><p>${formatPrice(l.price, l.status)}</p></div><button class="drawer-open" type="button" data-drawer-open="${l.id}">Нээх</button><button class="drawer-remove" type="button" data-drawer-remove="${l.id}" aria-label="Хадгалалтаас хасах">×</button></article>`).join("") : `<div class="drawer-empty"><strong>Хадгалсан зар алга байна</strong><p>Таалагдсан зарынхаа зүрхэн дээр дарахад энд цугларна.</p></div>`;
  }

  async function openQuickView(id) {
    const l = allListings.find(item => item.id === id);
    if (!l) return;
    const content = document.getElementById("quick-modal-content");
    const quickSpecs = [l.rooms && `${l.rooms} өрөө`, l.area && `${l.area} м²`, l.floor && `${l.floor} давхар`, l.year && `${l.year} он`].filter(Boolean);
    const quickAmenities = (l.amenities || []).map(item => `<li><span aria-hidden="true"></span>${item}</li>`).join("");
    content.innerHTML = `<div class="quick-gallery skeleton-gallery"><div class="quick-gallery-empty">Зургуудыг ачаалж байна</div></div>
      <div class="quick-caption"><div><span>${l.type || "Үл хөдлөх"}</span><strong>${l.title || "Гарчиггүй зар"}</strong><small>${[l.district,l.location].filter(Boolean).join(", ")}</small></div><b>${formatPrice(l.price, l.status)}</b></div>
      <div class="quick-overview">
        ${quickSpecs.length ? `<div class="quick-facts">${quickSpecs.map(item => `<span>${item}</span>`).join("")}</div>` : ""}
        ${l.description ? `<section><span class="quick-section-label">Зарын тухай</span><h3>Тайлбар</h3><p>${l.description}</p></section>` : ""}
        ${quickAmenities ? `<section><span class="quick-section-label">Тав тух</span><h3>Тохижилт</h3><ul class="quick-amenities">${quickAmenities}</ul></section>` : ""}
        ${l.lat && l.lng ? `<section><span class="quick-section-label">Орчин</span><h3>Байршил</h3><div class="quick-map"><iframe loading="lazy" title="Зарын байршил" src="https://maps.google.com/maps?q=${l.lat},${l.lng}&z=15&output=embed"></iframe></div></section>` : ""}
        <div class="quick-agent"><img src="agent.jpg" alt=""><div><strong>${SITE_CONFIG.BRAND.agentName}</strong><span>${SITE_CONFIG.BRAND.agentRole}</span></div></div>
        <div class="quick-contact"><a href="tel:${SITE_CONFIG.BRAND.phone.replace(/\s+/g, "")}">${SITE_CONFIG.BRAND.phone}</a><a class="primary" href="${SITE_CONFIG.BRAND.messenger}" target="_blank" rel="noopener">Чатаар холбогдох</a></div>
      </div>`;
    openPanel(document.getElementById("quick-modal"));
    const images = await fetchFolderImages(l.photoFolder);
    const gallery = content.querySelector(".quick-gallery");
    if (!gallery || !document.getElementById("quick-modal").classList.contains("is-open")) return;
    if (!images.length) { gallery.classList.remove("skeleton-gallery"); gallery.innerHTML = `<div class="quick-gallery-empty">Энэ зард зураг оруулаагүй байна</div>`; return; }
    gallery.innerHTML = `<img alt="${l.title || "Зарын зураг"}"><button class="quick-gallery-arrow quick-gallery-prev" type="button" aria-label="Өмнөх зураг">‹</button><button class="quick-gallery-arrow quick-gallery-next" type="button" aria-label="Дараагийн зураг">›</button><span class="quick-gallery-count"></span>`;
    const image = gallery.querySelector("img");
    const count = gallery.querySelector(".quick-gallery-count");
    let active = 0;
    const show = next => {
      const target = (next + images.length) % images.length;
      active = target;
      count.textContent = `${target + 1} / ${images.length}`;
      const source = images[target].full || images[target].card;
      const preload = new Image();
      preload.onload = () => {
        if (active !== target) return;
        image.src = source;
        image.style.objectPosition = l.imagePosition || "center";
        gallery.classList.remove("skeleton-gallery");
        requestAnimationFrame(() => image.classList.add("is-ready"));
      };
      preload.src = source;
    };
    gallery.querySelector(".quick-gallery-prev").onclick = () => show(active - 1);
    gallery.querySelector(".quick-gallery-next").onclick = () => show(active + 1);
    gallery.querySelectorAll(".quick-gallery-arrow").forEach(button => button.hidden = images.length < 2);
    let touchX = 0;
    gallery.addEventListener("touchstart", event => { touchX = event.changedTouches[0].clientX; }, { passive:true });
    gallery.addEventListener("touchend", event => { const delta = event.changedTouches[0].clientX - touchX; if (Math.abs(delta) > 45) show(active + (delta < 0 ? 1 : -1)); }, { passive:true });
    show(0);
  }

  function updateCompareTray() {
    const count = compareIds().size;
    const tray = document.getElementById("compare-tray");
    document.getElementById("compare-count").textContent = count;
    tray.classList.toggle("is-open", count > 0);
    tray.setAttribute("aria-hidden", String(count === 0));
    document.getElementById("open-compare").disabled = count < 2;
  }

  function openComparison() {
    const ids = compareIds();
    const items = allListings.filter(l => ids.has(l.id));
    const rows = [
      ["Үнэ", l => formatPrice(l.price,l.status)], ["Төрөл", l => l.type || "—"], ["Байршил", l => [l.district,l.location].filter(Boolean).join(", ") || "—"],
      ["Өрөө", l => l.rooms || "—"], ["Талбай", l => l.area ? `${l.area} м²` : "—"], ["Давхар", l => l.floor || "—"], ["Барилгын он", l => l.year || "—"]
    ];
    document.getElementById("compare-table-wrap").innerHTML = `<table class="compare-table"><thead><tr><th>Үзүүлэлт</th>${items.map(l => `<th>${l.title || "Зар"}</th>`).join("")}</tr></thead><tbody>${rows.map(([label,get]) => `<tr><th>${label}</th>${items.map(l => `<td>${get(l)}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
    openPanel(document.getElementById("compare-modal"));
  }

  function renderMap() {
    if (!window.L) {
      const mapRoot = document.getElementById("property-map");
      mapRoot.className = "map-fallback";
      mapRoot.innerHTML = `<iframe title="Улаанбаатар хотын газрын зураг" loading="lazy" src="https://www.openstreetmap.org/export/embed.html?bbox=106.72%2C47.78%2C107.10%2C48.02&amp;layer=mapnik"></iframe><div class="map-fallback-panel"><span>Газрын зураг дээрх зарууд</span>${currentListings.map(l => `<button type="button" data-map-open="${l.id}"><strong>${compactPrice(l.price)}</strong><small>${[l.district,l.location].filter(Boolean).join(", ") || "Улаанбаатар"}</small></button>`).join("")}</div>`;
      return;
    }
    if (!propertyMap) {
      propertyMap = L.map("property-map", { zoomControl: false }).setView([47.9184,106.9177], 12);
      L.control.zoom({ position: "bottomright" }).addTo(propertyMap);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: "© OpenStreetMap" }).addTo(propertyMap);
      mapLayer = L.layerGroup().addTo(propertyMap);
    }
    mapLayer.clearLayers();
    const districtCenters = {
      "Баянгол":[47.9164,106.8832], "Баянзүрх":[47.9212,106.9692], "Сүхбаатар":[47.9187,106.9176],
      "Хан-Уул":[47.8866,106.9094], "Чингэлтэй":[47.9347,106.9088], "Сонгинохайрхан":[47.9173,106.8134],
      "Налайх":[47.7727,107.2533], "Багануур":[47.7798,108.3656], "Багахангай":[47.3607,107.4845]
    };
    const hash = value => [...String(value)].reduce((sum, ch) => ((sum * 31) + ch.charCodeAt(0)) | 0, 0);
    const plotted = currentListings.map(l => {
      if (Number.isFinite(l.lat) && Number.isFinite(l.lng)) return { listing:l, point:[l.lat,l.lng], approximate:false };
      const center = districtCenters[l.district] || [47.9184,106.9177];
      const seed = Math.abs(hash(l.id));
      return { listing:l, point:[center[0] + ((seed % 17) - 8) * .0011, center[1] + ((Math.floor(seed / 17) % 17) - 8) * .0016], approximate:true };
    });
    plotted.forEach(({ listing:l, point, approximate }) => L.marker(point, { icon: L.divIcon({ className:"price-marker", html:`<span>${compactPrice(l.price)}</span>`, iconSize:null }) }).addTo(mapLayer).bindPopup(`<strong>${l.title || "Зар"}</strong><br>${formatPrice(l.price,l.status)}${approximate ? '<small>Дүүргийн ойролцоо байршил</small>' : ''}<br><button type="button" data-map-open="${l.id}">Зарыг нээх</button>`));
    if (plotted.length) propertyMap.fitBounds(plotted.map(item => item.point), { padding:[40,40], maxZoom:14 });
    setTimeout(() => propertyMap.invalidateSize(), 80);
  }

  grid.addEventListener("click", (e) => {
    const button = e.target.closest("[data-save-id]");
    if (button) {
      const isSaved = toggleSaved(button.dataset.saveId);
      button.classList.toggle("is-saved", isSaved);
      button.setAttribute("aria-pressed", String(isSaved));
      pulse(button);
      updateSavedControl();
      if (showingSaved && !isSaved) applyFilters();
      return;
    }
    const compare = e.target.closest("[data-compare-id]");
    if (compare) {
      const ids = compareIds();
      const id = compare.dataset.compareId;
      if (ids.has(id)) ids.delete(id); else if (ids.size < 3) ids.add(id);
      setCompare(ids);
      compare.classList.toggle("is-active", ids.has(id));
      compare.setAttribute("aria-pressed", String(ids.has(id)));
      return;
    }
    const open = e.target.closest("[data-open-id]");
    if (open) openQuickView(open.dataset.openId);
  });
  grid.addEventListener("keydown", e => { if ((e.key === "Enter" || e.key === " ") && e.target.matches("[data-open-id]")) { e.preventDefault(); openQuickView(e.target.dataset.openId); } });

  function applyFilters() {
    const type = document.getElementById("f-type").value;
    syncCategoryState(type);
        const status = document.getElementById("f-status").value;
    const district = document.getElementById("f-district").value;
    const q = document.getElementById("f-query").value.trim().toLowerCase();
    const filtered = allListings.filter(l => {
      if (showingSaved && !savedIds().has(l.id)) return false;
      if (type && l.type !== type) return false;
      if (district && l.district !== district) return false;
            if (status && l.status !== status) return false;
      if (q) {
        const hay = [l.title, l.location, l.district, l.description].join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    document.getElementById("results-title").textContent =
            showingSaved ? `Хадгалсан ${filtered.length} зар` :
            (type || status || district || q) ? `${filtered.length} тохирох зар` : "Шинээр нэмэгдсэн";
    render(filtered);
    if (document.getElementById("map-view").classList.contains("is-active")) renderMap();
  }

  document.getElementById("saved-filter-button").addEventListener("click", () => {
    renderSavedDrawer();
    openPanel(document.getElementById("saved-drawer"));
  });

  document.getElementById("saved-drawer-list").addEventListener("click", e => {
    const open = e.target.closest("[data-drawer-open]");
    if (open) { closePanels(); openQuickView(open.dataset.drawerOpen); return; }
    const remove = e.target.closest("[data-drawer-remove]");
    if (!remove) return;
    toggleSaved(remove.dataset.drawerRemove);
    updateSavedControl();
    renderSavedDrawer();
    applyFilters();
  });
  document.getElementById("property-map").addEventListener("click", e => { const open = e.target.closest("[data-map-open]"); if (open) openQuickView(open.dataset.mapOpen); });
  document.querySelectorAll("[data-close-panel]").forEach(button => button.addEventListener("click", closePanels));
  document.getElementById("panel-backdrop").addEventListener("click", closePanels);
  document.getElementById("clear-compare").addEventListener("click", () => { setCompare(new Set()); applyFilters(); });
  document.getElementById("open-compare").addEventListener("click", openComparison);
  document.getElementById("grid-view-button").addEventListener("click", () => {
    document.getElementById("listing-grid").hidden = false; document.getElementById("map-view").classList.remove("is-active");
    document.getElementById("grid-view-button").classList.add("is-active"); document.getElementById("map-view-button").classList.remove("is-active");
  });
  document.getElementById("map-view-button").addEventListener("click", () => {
    document.getElementById("listing-grid").hidden = true; document.getElementById("map-view").classList.add("is-active");
    document.getElementById("map-view-button").classList.add("is-active"); document.getElementById("grid-view-button").classList.remove("is-active"); renderMap();
  });

  document.getElementById("search-form").addEventListener("submit", (e) => {
    e.preventDefault();
    applyFilters();
    closeFilterSheet();
  });

  const filterForm = document.getElementById("search-form");
  function openFilterSheet() {
    filterForm.classList.add("is-open");
    document.body.classList.add("filter-sheet-open");
    document.getElementById("f-type").focus({ preventScroll: true });
  }
  function closeFilterSheet() {
    filterForm.classList.remove("is-open");
    document.body.classList.remove("filter-sheet-open");
  }
  document.getElementById("mobile-filter-trigger").addEventListener("click", openFilterSheet);
  document.getElementById("filter-sheet-close").addEventListener("click", closeFilterSheet);
  document.getElementById("filter-backdrop").addEventListener("click", closeFilterSheet);
  document.addEventListener("keydown", e => { if (e.key === "Escape") { closeFilterSheet(); closePanels(); } });

  document.querySelector(".cat-tiles").addEventListener("click", (e) => {
    const tile = e.target.closest(".tile[data-type]");
    if (!tile) return;
    e.preventDefault();
    const type = tile.dataset.type;
    document.getElementById("f-type").value = type;
    const nextParams = new URLSearchParams();
    nextParams.set("type", type);
    if (showingSaved) nextParams.set("saved", "1");
    history.replaceState(null, "", `${location.pathname}?${nextParams}`);
    syncCategoryState(type);
    applyFilters();
  });

  const initialType = params.get("type");
  if (initialType) document.getElementById("f-type").value = initialType;
  syncCategoryState(initialType || "");
  updateSavedControl();
  updateCompareTray();

  const enhancedSelects = matchMedia("(min-width: 701px)").matches
    ? [...document.querySelectorAll(".search-bar select")].map(enhanceSelect)
    : [];
  document.addEventListener("click", e => {
    enhancedSelects.forEach(({ shell, close }) => { if (!shell.contains(e.target)) close(); });
  });
  document.addEventListener("keydown", e => {
    if (e.key === "Escape") enhancedSelects.forEach(({ close }) => close());
  });

  fetchListings().then(list => {
    allListings = list;
    if (!list.length) {
      grid.innerHTML = `<p class="empty-state">Sheet холбогдоогүй байна. <code>config.js</code> дотор <b>SHEET_CSV_URL</b>-ээ оруулна уу.</p>`;
      return;
    }
    const openSavedOnLoad = showingSaved;
    showingSaved = false;
    updateSavedControl();
    applyFilters();
    if (openSavedOnLoad) { renderSavedDrawer(); openPanel(document.getElementById("saved-drawer")); }
  }).catch(err => {
    console.error(err);
    grid.innerHTML = `<p class="empty-state">Өгөгдөл татахад алдаа гарлаа. Sheet-ийн CSV линкээ шалгана уу.</p>`;
  });

  const revealObserver = "IntersectionObserver" in window
    ? new IntersectionObserver(entries => entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      }), { threshold: 0.08, rootMargin: "0px 0px -32px" })
    : null;

  document.querySelectorAll(".categories-section, .listings-section, .cta-band").forEach(section => {
    section.classList.add("reveal-section");
    if (revealObserver) revealObserver.observe(section);
    else section.classList.add("is-visible");
  });
})();
