(function () {
  document.getElementById("year").textContent = new Date().getFullYear();
  document.getElementById("brand-name").textContent = SITE_CONFIG.BRAND.name;
  document.getElementById("brand-phone").textContent = SITE_CONFIG.BRAND.phone;
    document.getElementById("brand-name-2").textContent = SITE_CONFIG.BRAND.name;

  const container = document.getElementById("detail-content");
  const params = new URLSearchParams(location.search);
  const id = params.get("id");
  const SAVED_KEY = "urguu-saved-listings";

  function savedIds() {
    try { return new Set(JSON.parse(localStorage.getItem(SAVED_KEY) || "[]")); }
    catch (_) { return new Set(); }
  }

  document.getElementById("saved-count").textContent = savedIds().size;

  function toggleSaved(listingId) {
    const saved = savedIds();
    if (saved.has(listingId)) saved.delete(listingId); else saved.add(listingId);
    localStorage.setItem(SAVED_KEY, JSON.stringify([...saved]));
    return saved.has(listingId);
  }

  function pulse(element) {
    if (!element.animate || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    element.animate([{ transform: "scale(.82)" }, { transform: "scale(1.1)" }, { transform: "scale(1)" }], { duration: 320, easing: "cubic-bezier(.2,.8,.2,1)" });
  }

  function statusBadgeClass(status) {
    return status === "ЗАРАГДСАН" ? "badge status-sold" : "badge";
  }

  function galleryHTML(images, imagePosition) {
    const hasImgs = images.length > 0;
    const mainSrc = hasImgs ? images[0].full : "";
    return `
      <div class="gallery-main" id="gallery-main" role="${hasImgs ? "button" : "img"}" tabindex="${hasImgs ? "0" : "-1"}" aria-label="${hasImgs ? "Зургийг бүтэн дэлгэцээр харах" : "Зураг алга"}" style="${hasImgs ? `background-image:url(${images[0].tiny});--image-position:${imagePosition || "center"}` : ""}">
        ${hasImgs ? `<img id="gallery-img" src="${mainSrc}" alt="" style="object-position:${imagePosition || "center"}">` : ""}
        <div class="gallery-top">
          <span class="badge" id="gallery-badge"></span>
          <span class="photo-count" id="gallery-count">${hasImgs ? `1 / ${images.length} зураг` : "Зураг алга"}</span>
        </div>
        ${images.length > 1 ? `
        <div class="gallery-bottom">
          <button class="gallery-arrow" onclick="window.__galleryPrev()">‹</button>
          <div class="gallery-dots" id="gallery-dots"></div>
          <button class="gallery-arrow" onclick="window.__galleryNext()">›</button>
        </div>` : ""}
      </div>
      ${images.length > 1 ? `<div class="thumb-row" id="thumb-row"></div>` : ""}
      ${hasImgs ? `<div class="lightbox${images.length === 1 ? " single-image" : ""}" id="lightbox" role="dialog" aria-modal="true" aria-label="Зургийн цомог" aria-hidden="true"><button class="lightbox-close" type="button" aria-label="Хаах">×</button><button class="lightbox-arrow lightbox-prev" type="button" aria-label="Өмнөх зураг">‹</button><img id="lightbox-img" alt=""><button class="lightbox-arrow lightbox-next" type="button" aria-label="Дараагийн зураг">›</button><span class="lightbox-count" id="lightbox-count"></span></div>` : ""}
    `;
  }

  function setupGallery(images) {
    if (!images.length) return;
    let idx = 0;
    const imgEl = document.getElementById("gallery-img");
    const countEl = document.getElementById("gallery-count");
    const dotsEl = document.getElementById("gallery-dots");
    const thumbRow = document.getElementById("thumb-row");
    const gallery = document.getElementById("gallery-main");
    const lightbox = document.getElementById("lightbox");
    const lightboxImg = document.getElementById("lightbox-img");
    const lightboxCount = document.getElementById("lightbox-count");
    let touchStartX = 0;

    function show(i) {
      idx = (i + images.length) % images.length;
      imgEl.src = images[idx].full;
      countEl.textContent = `${idx + 1} / ${images.length} зураг`;
      if (lightboxImg) lightboxImg.src = images[idx].original;
      if (lightboxCount) lightboxCount.textContent = `${idx + 1} / ${images.length}`;
      if (dotsEl) {
        dotsEl.innerHTML = images.map((_, i2) => `<span class="${i2 === idx ? "active" : ""}"></span>`).join("");
      }
      if (thumbRow) {
        thumbRow.querySelectorAll(".thumb").forEach((t, i2) => t.classList.toggle("active", i2 === idx));
      }
    }
    window.__galleryPrev = () => show(idx - 1);
    window.__galleryNext = () => show(idx + 1);

    function openLightbox() {
      lightbox.classList.add("is-open");
      lightbox.setAttribute("aria-hidden", "false");
      document.body.classList.add("lightbox-open");
      document.querySelector(".lightbox-close").focus();
    }
    function closeLightbox() {
      lightbox.classList.remove("is-open");
      lightbox.setAttribute("aria-hidden", "true");
      document.body.classList.remove("lightbox-open");
      gallery.focus({ preventScroll: true });
    }
    gallery.addEventListener("click", e => { if (!e.target.closest("button")) openLightbox(); });
    gallery.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openLightbox(); } });
    lightbox.querySelector(".lightbox-close").addEventListener("click", closeLightbox);
    lightbox.querySelector(".lightbox-prev").addEventListener("click", window.__galleryPrev);
    lightbox.querySelector(".lightbox-next").addEventListener("click", window.__galleryNext);
    lightbox.addEventListener("click", e => { if (e.target === lightbox) closeLightbox(); });
    lightbox.addEventListener("touchstart", e => { touchStartX = e.changedTouches[0].clientX; }, { passive: true });
    lightbox.addEventListener("touchend", e => {
      const delta = e.changedTouches[0].clientX - touchStartX;
      if (Math.abs(delta) > 45) delta > 0 ? window.__galleryPrev() : window.__galleryNext();
    }, { passive: true });
    document.addEventListener("keydown", e => {
      if (!lightbox.classList.contains("is-open")) return;
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") window.__galleryPrev();
      if (e.key === "ArrowRight") window.__galleryNext();
    });

    if (thumbRow) {
      thumbRow.innerHTML = images.map((im, i) =>
        `<img class="thumb" src="${im.thumb}" alt="" onclick="window.__gallerySet(${i})">`).join("");
      window.__gallerySet = (i) => show(i);
    }
    show(0);
  }

  function render(l, images) {
    document.title = `${l.title || "Зар"} — ${SITE_CONFIG.BRAND.name}`;
    document.getElementById("crumb-type").textContent = l.type || "";
    document.getElementById("crumb-title").textContent = l.title || "";

    const chips = specsChips(l);
    const specsHtml = [
      l.rooms ? { val: l.rooms, lbl: "Өрөө" } : null,
      l.area ? { val: l.area + " м²", lbl: "Талбай" } : null,
      l.floor ? { val: l.floor, lbl: "Давхар" } : null,
      l.year ? { val: l.year, lbl: "Барилгын он" } : null,
    ].filter(Boolean).map(s => `<div class="spec-item"><div class="val">${s.val}</div><div class="lbl">${s.lbl}</div></div>`).join("");

    const amenitiesHtml = l.amenities.length
      ? `<div class="amenities-grid">${l.amenities.map(a => `<div class="amenity"><span class="check"></span>${a}</div>`).join("")}</div>`
      : "";

    const mapHtml = (l.lat && l.lng)
      ? `<div class="map-embed"><iframe loading="lazy" src="https://maps.google.com/maps?q=${l.lat},${l.lng}&z=15&output=embed"></iframe></div>`
      : "";
    const isSaved = savedIds().has(l.id);

    container.innerHTML = `
      ${galleryHTML(images, l.imagePosition)}
      <div class="detail-grid">
        <div class="detail-main">
          <div class="detail-title-row"><p class="detail-price">${formatPrice(l.price, l.status)}</p><button class="detail-save-button${isSaved ? " is-saved" : ""}" id="detail-save-button" type="button" aria-label="Зар хадгалах" aria-pressed="${isSaved}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z"/></svg></button></div>
          <h1 class="detail-title">${l.title || ""}</h1>
          <p class="detail-loc"><span class="location-mark" aria-hidden="true"></span>${[l.district, l.location].filter(Boolean).join(", ")}</p>
          ${specsHtml ? `<div class="specs-bar">${specsHtml}</div>` : ""}
          ${l.description ? `<h3 class="block-title">Тайлбар</h3><p class="detail-desc">${l.description}</p>` : ""}
          ${amenitiesHtml ? `<h3 class="block-title">Тохижилт</h3>${amenitiesHtml}` : ""}
          ${mapHtml ? `<h3 class="block-title">Байршил</h3>${mapHtml}` : ""}
        </div>
        <div class="detail-side">
          <div class="agent-card">
            <div class="agent-profile">
              <img class="avatar" src="agent.jpg" alt="Агент">
              <div>
                <strong>${SITE_CONFIG.BRAND.agentName}</strong>
                <span>${SITE_CONFIG.BRAND.agentRole}</span>
              </div>
            </div>
            <a class="phone-row" href="tel:${SITE_CONFIG.BRAND.phone.replace(/\s+/g, "")}"><span>${SITE_CONFIG.BRAND.phone}</span><span class="action-arrow">↗</span></a>
                        <a class="btn btn-accent" href="${SITE_CONFIG.BRAND.messenger}" target="_blank" rel="noopener">Чатаар холбогдох</a>
            <p class="trust-note">Хариу ихэвчлэн 10 минутын дотор ирдэг</p>
          </div>
        </div>
      </div>
    `;

    document.getElementById("gallery-badge").textContent = statusLabel(l.status);
    document.getElementById("gallery-badge").className = statusBadgeClass(l.status);
    document.getElementById("detail-save-button").addEventListener("click", e => {
      const isNowSaved = toggleSaved(l.id);
      e.currentTarget.classList.toggle("is-saved", isNowSaved);
      e.currentTarget.setAttribute("aria-pressed", String(isNowSaved));
      document.getElementById("saved-count").textContent = savedIds().size;
      pulse(e.currentTarget);
      syncMobileSave();
    });
    const mobileSave = document.getElementById("mobile-save-action");
    const syncMobileSave = () => {
      const active = savedIds().has(l.id);
      mobileSave.classList.toggle("is-saved", active);
      mobileSave.textContent = active ? "♥" : "♡";
      mobileSave.setAttribute("aria-pressed", String(active));
    };
    mobileSave.addEventListener("click", () => {
      const active = toggleSaved(l.id);
      document.getElementById("detail-save-button").classList.toggle("is-saved", active);
      document.getElementById("detail-save-button").setAttribute("aria-pressed", String(active));
      document.getElementById("saved-count").textContent = savedIds().size;
      syncMobileSave();
    });
    document.getElementById("mobile-call-action").href = `tel:${SITE_CONFIG.BRAND.phone.replace(/\s+/g, "")}`;
    document.getElementById("mobile-chat-action").href = SITE_CONFIG.BRAND.messenger;
    syncMobileSave();
    document.getElementById("mobile-detail-actions").classList.add("is-ready");
    setupGallery(images);
  }

  if (!id) {
    container.innerHTML = `<p class="empty-state">Зарын ID алга байна.</p>`;
  } else {
    fetchListings().then(async (list) => {
      const l = list.find(x => x.id === id);
      if (!l) {
        container.innerHTML = `<p class="empty-state">Энэ зар олдсонгүй. <a href="index.html">Бүх зар руу буцах</a></p>`;
        return;
      }
      const images = await fetchFolderImages(l.photoFolder);
      render(l, images);
    }).catch(err => {
      console.error(err);
      container.innerHTML = `<p class="empty-state">Өгөгдөл татахад алдаа гарлаа.</p>`;
    });
  }
})();
