/* =========================================================
   ⚙️ Service Worker - PWA Asistencia QR 1Bot
   ========================================================= */

const CACHE_NAME = "asistencia-qr-cache-v1";
const ASSETS = [
  "/", 
  "/index.html",
  "/admin.html",
  "/css/styles.css",
  "/js/supabase.js",
  "/js/db.js",
  "/js/crud.js",
  "/js/pdfParser.js",
  "/js/ocr.js",
  "/js/qrGenerator.js",
  "/assets/logo-1bot.png",
  "https://unpkg.com/@supabase/supabase-js@2",
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.10.377/pdf.worker.min.js",
  "https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.1.1/crypto-js.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"
];

// 📦 Instalar Service Worker
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  console.log("✅ SW instalado y assets cacheados");
});

// ♻️ Activar y limpiar cachés viejas
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  console.log("♻️ SW activo y caché actualizado");
});

// 🌐 Interceptar peticiones (modo offline)
self.addEventListener("fetch", (e) => {
  e.respondWith(
    caches.match(e.request).then((response) =>
      response ||
      fetch(e.request).catch(() => {
        // Página offline opcional
        if (e.request.destination === "document") {
          return new Response("<h1>📡 Sin conexión</h1><p>Por favor reconecta para sincronizar.</p>", {
            headers: { "Content-Type": "text/html" },
          });
        }
      })
    )
  );
});
