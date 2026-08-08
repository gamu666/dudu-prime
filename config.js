// ====== ТОХИРГОО — эндээс өөрийн мэдээллээ оруулна ======
//
// 1) SHEET_CSV_URL: Google Sheet-ээ File → Share → Publish to web хийгээд,
//    "Зарууд" sheet-ийг CSV форматаар publish хийгээд гарч ирэх линкийг энд буулгана.
//
// 2) DRIVE_API_KEY: Google Cloud Console-с Drive API-д зориулж авсан API key.
//    (Google Cloud Console → APIs & Services → Credentials → Create API key,
//     дараа нь "Google Drive API"-г "Enabled APIs" дотор идэвхжvvлнэ.)
//
// 3) BRAND: сайтын нэр, утас зэрэг — нэг л газар солиход бvх хуудсанд
//    автоматаар шинэчлэгдэнэ.

const SITE_CONFIG = {
  SHEET_CSV_URL: "PASTE_YOUR_PUBLISHED_CSV_LINK_HERE",
  DRIVE_API_KEY: "PASTE_YOUR_DRIVE_API_KEY_HERE",
  BRAND: {
    name: "ӨРГӨӨ",
    tagline: "Үл хөдлөх хөрөнгийн зуучлал",
    phone: "+976 9911 2233",
    email: "info@urguu.mn",
    agentName: "Б. Батзориг",
    agentRole: "Үл хөдлөх хөрөнгийн зуучлагч",
  },
};
