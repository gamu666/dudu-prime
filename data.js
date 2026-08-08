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
    coords: findCol(headers, "Координат") >= 0 ? findCol(headers, "Координат") : findCol(headers, "Lat"),
  };
  const get = (r, key) => (col[key] >= 0 && r[col[key]] !== undefined) ? r[col[key]].trim() : "";

  return rows.slice(1)
    .filter(r => get(r, "id"))
    .map(r => {
      const coordsRaw = get(r, "coords");
      let lat = null, lng = null;
      if (coordsRaw) {
        const parts = coordsRaw.split(",").map(s => parseFloat(s.trim()));
        if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) { lat = parts[0]; lng = parts[1]; }
      }
      return {
        id: get(r, "id"),
        title: get(r, "title"),
        type: get(r, "type"),
        status: get(r, "status") || "ЗАРНА",
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
      full: `https://drive.google.com/thumbnail?id=${f.id}&sz=w1600`,
      thumb: `https://drive.google.com/thumbnail?id=${f.id}&sz=w300`,
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
