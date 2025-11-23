/* =========================================================
   💾 IndexedDB - Modo Offline / Sincronización
   ========================================================= */

const DB_NAME = "asistenciaDB";
const DB_VERSION = 1;

/* ---------- Inicialización ---------- */
const openRequest = indexedDB.open(DB_NAME, DB_VERSION);

openRequest.onupgradeneeded = (e) => {
  const db = e.target.result;

  if (!db.objectStoreNames.contains("docentes"))
    db.createObjectStore("docentes", { keyPath: "id" });

  if (!db.objectStoreNames.contains("estudiantes"))
    db.createObjectStore("estudiantes", { keyPath: "id" });

  if (!db.objectStoreNames.contains("asistencia"))
    db.createObjectStore("asistencia", { keyPath: "id", autoIncrement: true });

  if (!db.objectStoreNames.contains("uploads"))
    db.createObjectStore("uploads", { keyPath: "id", autoIncrement: true });

  console.log("IndexedDB configurada correctamente ✅");
};

openRequest.onerror = (e) => console.error("Error al abrir IndexedDB", e);

/* ---------- Helper para operaciones ---------- */
function withStore(storeName, mode, callback) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onsuccess = () => {
      const db = request.result;
      const tx = db.transaction(storeName, mode);
      const store = tx.objectStore(storeName);
      const result = callback(store);
      tx.oncomplete = () => resolve(result);
      tx.onerror = () => reject(tx.error);
    };
  });
}

/* =========================================================
   🧩 Funciones CRUD Locales
   ========================================================= */

// ---------- DOCENTES ----------
async function saveDocente(docente) {
  return withStore("docentes", "readwrite", (store) => store.put(docente));
}

async function getDocentes() {
  return withStore("docentes", "readonly", (store) => store.getAll());
}

async function clearDocentes() {
  return withStore("docentes", "readwrite", (store) => store.clear());
}

// ---------- ESTUDIANTES ----------
async function saveEstudiante(estudiante) {
  return withStore("estudiantes", "readwrite", (store) => store.put(estudiante));
}

async function getEstudiantes() {
  return withStore("estudiantes", "readonly", (store) => store.getAll());
}

async function clearEstudiantes() {
  return withStore("estudiantes", "readwrite", (store) => store.clear());
}

// ---------- ASISTENCIA ----------
async function registrarAsistenciaLocal(registro) {
  return withStore("asistencia", "readwrite", (store) => store.add(registro));
}

async function getAsistenciasPendientes() {
  return withStore("asistencia", "readonly", (store) => store.getAll());
}

async function clearAsistencias() {
  return withStore("asistencia", "readwrite", (store) => store.clear());
}

// ---------- UPLOADS ----------
async function saveUploadInfo(upload) {
  return withStore("uploads", "readwrite", (store) => store.add(upload));
}

async function getUploads() {
  return withStore("uploads", "readonly", (store) => store.getAll());
}

/* =========================================================
   🔄 Sincronización con Supabase
   ========================================================= */
async function syncWithSupabase() {
  try {
    // 1️⃣ Enviar asistencias pendientes
    const asistencias = await getAsistenciasPendientes();
    if (asistencias.length > 0) {
      for (const a of asistencias) {
        await supabase.from("asistencia").insert([a]);
      }
      await clearAsistencias();
      console.log("Asistencias sincronizadas ✅");
    }

    // 2️⃣ Enviar uploads locales
    const uploads = await getUploads();
    if (uploads.length > 0) {
      for (const u of uploads) {
        await supabase.from("uploads").insert([u]);
      }
      await withStore("uploads", "readwrite", (s) => s.clear());
      console.log("Uploads sincronizados ✅");
    }

    alert("✅ Sincronización completada con Supabase");
  } catch (err) {
    console.error("Error en sincronización:", err);
    alert("⚠️ Error al sincronizar, intenta más tarde");
  }
}
