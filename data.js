// ====== Sheet-ээс өгөгдөл татаж, ашиглахад бэлэн болгох ======

function parseCSV(text) {
  const rows = [];
  let row = [], field = "", inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i], next = text[i + 1];
    if (inQuotes) {
      if (c === '"' && next === '"') { field += '"'; i++; }
      else if (c === '"') { inQuotes = false; }
      else { field += c; }
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ",") { row.push(field); field = ""; }
      else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
      else if (c === "\r") { /* skip */ }
      else { field += c; }
    }
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows.filter(r => r.some(c => c.trim() !== ""));
}

function findCol(headers, keyword) {
  const idx = headers.findIndex(h => h.toLowerCase().includes(keyword.toLowerCase()));
  return idx;
}

function normalizeRows(rows) {
  if (!rows.length) return [];
  const headers = rows[0];
  const col = {
    id: findCol(headers, "ID"),
    title: findCol(headers, "Гарчиг"),
    type: findCol(headers, "Төрөл"),
    status: findCol(headers, "Статус"),
    price: findCol(headers, "Үнэ"),
    district: findCol(headers, "Дүүрэг"),
    location: findCol(headers, "Байршил"),
    rooms: findCol(headers, "Өрөө"),
    area: findCol(headers, "Талбай"),
    floor: findCol(headers, "Давхар"),
    year: findCol(headers, "Барилгын он"),
    description: findCol(headers, "Тайлбар"),
    amenities: findCol(headers, "Тохижилт"),
    photoFolder: findCol(headers, "Зургийн"),
    imagePosition: findCol(headers, "Зургийн байрлал"),
    coords: findCol(headers, "Координат") >= 0 ? findCol(headers, "Координат") : findCol(headers, "Lat"),
    lng: findCol(headers, "Long"),
  };
  const get = (r, key) => (col[key] >= 0 && r[col[key]] !== undefined) ? r[col[key]].trim() : "";
  const cleanStatus = value => {
    const normalized = String(value || "").toUpperCase().replaceAll("V", "Ү");
    if (normalized.includes("ТҮРЭЭС")) return "ТҮРЭЭС";
    if (normalized.includes("ЗАРАГДСАН")) return "ЗАРАГДСАН";
    return normalized || "ЗАРНА";
  };
  const cleanImagePosition = value => {
    const position = String(value || "").trim().toLowerCase();
    return /^(center|top|bottom|left|right|(?:\d{1,3}%\s+\d{1,3}%))$/.test(position) ? position : "center";
  };

  return rows.slice(1)
    .filter(r => get(r, "id"))
    .map(r => {
      const coordsRaw = get(r, "coords");
      const lngRaw = get(r, "lng");
      let lat = null, lng = null;
      if (coordsRaw && !/^https?:/i.test(coordsRaw)) {
        const decimal = `${coordsRaw}${lngRaw ? `,${lngRaw}` : ""}`.match(/(-?\d+(?:\.\d+)?)\s*[,;\s]+\s*(-?\d+(?:\.\d+)?)/);
        const dms = coordsRaw.match(/(\d+)°\s*(\d+)'\s*([\d.]+)"?\s*([NS]).*?(\d+)°\s*(\d+)'\s*([\d.]+)"?\s*([EW])/i);
        if (decimal) {
          lat = Number(decimal[1]); lng = Number(decimal[2]);
        } else if (dms) {
          lat = Number(dms[1]) + Number(dms[2]) / 60 + Number(dms[3]) / 3600;
          lng = Number(dms[5]) + Number(dms[6]) / 60 + Number(dms[7]) / 3600;
          if (dms[4].toUpperCase() === "S") lat *= -1;
          if (dms[8].toUpperCase() === "W") lng *= -1;
        }
        if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) { lat = null; lng = null; }
      }
      return {
        id: get(r, "id"),
        title: get(r, "title"),
        type: get(r, "type"),
        status: cleanStatus(get(r, "status")),
        price: get(r, "price"),
        district: get(r, "district"),
        location: get(r, "location"),
        rooms: get(r, "rooms"),
        area: get(r, "area"),
        floor: get(r, "floor"),
        year: get(r, "year"),
        description: get(r, "description"),
        amenities: get(r, "amenities").split(",").map(s => s.trim()).filter(Boolean),
        photoFolder: get(r, "photoFolder"),
        imagePosition: cleanImagePosition(get(r, "imagePosition")),
        lat, lng,
      };
    });
}

async function fetchListings() {
  const url = SITE_CONFIG.SHEET_CSV_URL;
  if (!url || url.indexOf("PASTE_YOUR") === 0) return [];
  const res = await fetch(url, { cache: "no-store" });
  const text = await res.text();
  const rows = parseCSV(text);
  return normalizeRows(rows);
}

function formatPrice(priceStr, status) {
  const n = parseInt(String(priceStr).replace(/[^\d]/g, ""), 10);
  if (isNaN(n)) return priceStr || "Үнэ асуух";
  const formatted = n.toLocaleString("mn-MN");
  if (status === "ТҮРЭЭС") return formatted + " ₮ / сар";
  return formatted + " ₮";
}

function statusLabel(status) {
  return status || "ЗАРНА";
}

function extractDriveFolderId(url) {
  if (!url) return null;
  const m = url.match(/[-\w]{25,}/);
  return m ? m[0] : null;
}

async function fetchFolderImages(folderUrl) {
  const folderId = extractDriveFolderId(folderUrl);
  const key = SITE_CONFIG.DRIVE_API_KEY;
  if (!folderId || !key || key.indexOf("PASTE_YOUR") === 0) return [];
  const q = encodeURIComponent(`'${folderId}' in parents and mimeType contains 'image/' and trashed = false`);
  const url = `https://www.googleapis.com/drive/v3/files?q=${q}&key=${key}&fields=files(id,name)&orderBy=name`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    if (!data.files) return [];
    return data.files.map(f => ({
      id: f.id,
      tiny: `https://drive.google.com/thumbnail?id=${f.id}&sz=w80`,
      card: `https://drive.google.com/thumbnail?id=${f.id}&sz=w900`,
      thumb: `https://drive.google.com/thumbnail?id=${f.id}&sz=w400`,
      full: `https://drive.google.com/thumbnail?id=${f.id}&sz=w1800`,
      original: `https://drive.google.com/thumbnail?id=${f.id}&sz=w2400`,
    }));
  } catch (e) {
    console.warn("Drive folder fetch failed", e);
    return [];
  }
}

function specsChips(l) {
  const chips = [];
  if (l.rooms) chips.push(`${l.rooms} өрөө`);
  if (l.area) chips.push(`${l.area} м²`);
  if (l.floor) chips.push(`${l.floor} давхар`);
  return chips;
}
