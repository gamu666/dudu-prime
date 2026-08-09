(function () {
  document.getElementById("year").textContent = new Date().getFullYear();
  document.getElementById("brand-name").textContent = SITE_CONFIG.BRAND.name;
  document.getElementById("brand-phone").textContent = SITE_CONFIG.BRAND.phone;

  const container = document.getElementById("detail-content");
  const params = new URLSearchParams(location.search);
  const id = params.get("id");

  function statusBadgeClass(status) {
    return status === "ЗАРАГДСАН" ? "badge status-sold" : "badge";
  }

  function galleryHTML(images) {
    const hasImgs = images.length > 0;
    const mainSrc = hasImgs ? images[0].full : "";
    return `
      <div class="gallery-main" id="gallery-main" style="${hasImgs ? "" : ""}">
        ${hasImgs ? `<img id="gallery-img" src="${mainSrc}" alt="">` : ""}
        <div class="gallery-top">
          <span class="badge" id="gallery-badge"></span>
          <span class="photo-count" id="gallery-count">${hasImgs ? `📷 1 / ${images.length}` : "Зураг алга"}</span>
        </div>
        ${images.length > 1 ? `
        <div class="gallery-bottom">
          <button class="gallery-arrow" onclick="window.__galleryPrev()">‹</button>
          <div class="gallery-dots" id="gallery-dots"></div>
          <button class="gallery-arrow" onclick="window.__galleryNext()">›</button>
        </div>` : ""}
      </div>
      ${images.length > 1 ? `<div class="thumb-row" id="thumb-row"></div>` : ""}
    `;
  }

  function setupGallery(images) {
    if (!images.length) return;
    let idx = 0;
    const imgEl = document.getElementById("gallery-img");
    const countEl = document.getElementById("gallery-count");
    const dotsEl = document.getElementById("gallery-dots");
    const thumbRow = document.getElementById("thumb-row");

    function show(i) {
      idx = (i + images.length) % images.length;
      imgEl.src = images[idx].full;
      countEl.textContent = `📷 ${idx + 1} / ${images.length}`;
      if (dotsEl) {
        dotsEl.innerHTML = images.map((_, i2) => `<span class="${i2 === idx ? "active" : ""}"></span>`).join("");
      }
      if (thumbRow) {
        thumbRow.querySelectorAll(".thumb").forEach((t, i2) => t.classList.toggle("active", i2 === idx));
      }
    }
    window.__galleryPrev = () => show(idx - 1);
    window.__galleryNext = () => show(idx + 1);

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

    container.innerHTML = `
      ${galleryHTML(images)}
      <div class="detail-grid">
        <div class="detail-main">
          <p class="detail-price">${formatPrice(l.price, l.status)}</p>
          <h1 class="detail-title">${l.title || ""}</h1>
          <p class="detail-loc">◎ ${[l.district, l.location].filter(Boolean).join(", ")}</p>
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
            <div class="phone-row"><span>${SITE_CONFIG.BRAND.phone}</span><span>📞</span></div>
            <button class="btn btn-accent" onclick="document.getElementById('chat-panel').classList.add('open')">💬 Онлайн чатаар асуух</button>
            <a class="btn btn-outline-light" href="index.html#footer">Үзэх цаг товлох</a>
            <p class="trust-note">Хариу ихэвчлэн 10 минутын дотор ирдэг</p>
          </div>
        </div>
      </div>
    `;

    document.getElementById("gallery-badge").textContent = statusLabel(l.status);
    document.getElementById("gallery-badge").className = statusBadgeClass(l.status);
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
