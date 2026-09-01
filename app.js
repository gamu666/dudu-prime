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
    return `
      <a class="card" href="listing.html?id=${encodeURIComponent(l.id)}">
        <div class="card-photo" data-folder="${l.photoFolder || ""}">
          <span class="${statusBadgeClass(l.status)}">${statusLabel(l.status)}</span>
        </div>
        <div class="card-body">
          <div class="card-price">${formatPrice(l.price, l.status)}</div>
          <div class="card-title">${l.title || "Гарчиггүй зар"}</div>
          <div class="card-loc">◎ ${[l.district, l.location].filter(Boolean).join(", ")}</div>
          <div class="card-specs">${chips}</div>
        </div>
      </a>`;
  }

  function render(list) {
    if (!list.length) {
      grid.innerHTML = `<p class="empty-state">Одоогоор тохирох зар алга байна. Sheet-дээ мэдээлэл нэмсэн эсэхээ, эсвэл шvvлтvvрээ шалгана уу.</p>`;
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
        el.prepend(img);
      }
    });
  }

  function applyFilters() {
    const type = document.getElementById("f-type").value;
    syncCategoryState(type);
        const status = document.getElementById("f-status").value;
    const district = document.getElementById("f-district").value;
    const q = document.getElementById("f-query").value.trim().toLowerCase();
    const filtered = allListings.filter(l => {
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
            (type || status || district || q) ? `${filtered.length} тохирох зар` : "Шинээр нэмэгдсэн";
    render(filtered);
  }

  document.getElementById("search-form").addEventListener("submit", (e) => {
    e.preventDefault();
    applyFilters();
  });

  document.querySelector(".cat-tiles").addEventListener("click", (e) => {
    const tile = e.target.closest(".tile[data-type]");
    if (!tile) return;
    e.preventDefault();
    const type = tile.dataset.type;
    document.getElementById("f-type").value = type;
    history.replaceState(null, "", `${location.pathname}?type=${encodeURIComponent(type)}`);
    syncCategoryState(type);
    applyFilters();
    document.getElementById("listings-section").scrollIntoView({ behavior: "smooth", block: "start" });
  });

  const initialType = params.get("type");
  if (initialType) document.getElementById("f-type").value = initialType;
  syncCategoryState(initialType || "");

  fetchListings().then(list => {
    allListings = list;
    if (!list.length) {
      grid.innerHTML = `<p class="empty-state">Sheet холбогдоогүй байна. <code>config.js</code> дотор <b>SHEET_CSV_URL</b>-ээ оруулна уу.</p>`;
      return;
    }
    applyFilters();
  }).catch(err => {
    console.error(err);
    grid.innerHTML = `<p class="empty-state">Өгөгдөл татахад алдаа гарлаа. Sheet-ийн CSV линкээ шалгана уу.</p>`;
  });
})();
