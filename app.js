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
  let showingSaved = params.get("saved") === "1";
  const SAVED_KEY = "urguu-saved-listings";

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

  function card(l) {
    const chips = specsChips(l).map(c => `<span class="chip">${c}</span>`).join("");
    const isSaved = savedIds().has(l.id);
    return `
      <article class="card">
        <a class="card-link" href="listing.html?id=${encodeURIComponent(l.id)}">
        <div class="card-photo" data-folder="${l.photoFolder || ""}">
          <span class="${statusBadgeClass(l.status)}">${statusLabel(l.status)}</span>
        </div>
        <div class="card-body">
          <div class="card-price">${formatPrice(l.price, l.status)}</div>
          <div class="card-title">${l.title || "Гарчиггүй зар"}</div>
          <div class="card-loc"><span class="location-mark" aria-hidden="true"></span>${[l.district, l.location].filter(Boolean).join(", ")}</div>
          <div class="card-specs">${chips}</div>
        </div>
        </a>
        <button class="save-button${isSaved ? " is-saved" : ""}" type="button" data-save-id="${l.id}" aria-label="Зар хадгалах" aria-pressed="${isSaved}">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z"/></svg>
        </button>
      </article>`;
  }

  function render(list) {
    if (!list.length) {
      grid.innerHTML = showingSaved
        ? `<div class="empty-state saved-empty"><strong>Хадгалсан зар алга байна</strong><span>Таалагдсан зарынхаа зүрхэн дээр дарахад энд хадгалагдана.</span></div>`
        : `<p class="empty-state">Одоогоор тохирох зар алга байна. Sheet-дээ мэдээлэл нэмсэн эсэхээ, эсвэл шvvлтvvрээ шалгана уу.</p>`;
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
        img.src = imgs[0].thumb;
        img.alt = "";
        img.addEventListener("load", () => img.classList.add("is-loaded"), { once: true });
        el.prepend(img);
      }
    });
  }

  grid.addEventListener("click", (e) => {
    const button = e.target.closest("[data-save-id]");
    if (!button) return;
    const isSaved = toggleSaved(button.dataset.saveId);
    button.classList.toggle("is-saved", isSaved);
    button.setAttribute("aria-pressed", String(isSaved));
    pulse(button);
    updateSavedControl();
    if (showingSaved && !isSaved) applyFilters();
  });

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
  }

  document.getElementById("saved-filter-button").addEventListener("click", () => {
    showingSaved = !showingSaved;
    const nextParams = new URLSearchParams(location.search);
    if (showingSaved) nextParams.set("saved", "1"); else nextParams.delete("saved");
    history.replaceState(null, "", `${location.pathname}${nextParams.toString() ? `?${nextParams}` : ""}`);
    updateSavedControl();
    applyFilters();
    if (showingSaved) scrollToListings();
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
  document.addEventListener("keydown", e => { if (e.key === "Escape") closeFilterSheet(); });

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
    applyFilters();
    if (showingSaved) scrollToListings();
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
