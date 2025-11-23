/* =========================================================
   🔳 Generador de QR cifrado y exportación PDF/PNG
   ========================================================= */

// Dependencias externas
// qrcode.js (https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js)
// crypto-js (https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.1.1/crypto-js.min.js)
// html2canvas (https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js)
// jsPDF (https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js)

const AES_KEY = "1bot_secret_key";

/* =========================================================
   🔐 Función para cifrar JSON del estudiante
   ========================================================= */
function cifrarDatosEstudiante(est) {
  const payload = JSON.stringify({
    id: est.id || crypto.randomUUID(),
    nombre: `${est.nombres} ${est.apellidos}`.trim(),
    cui: est.cui,
    grado: est.grado,
    seccion: est.seccion,
    establecimiento: est.establecimiento,
  });
  return CryptoJS.AES.encrypt(payload, AES_KEY).toString();
}

/* =========================================================
   🧾 Generar QR individual
   ========================================================= */
async function generarQREstudiante(est) {
  const area = document.getElementById("contentArea");
  area.innerHTML = `
    <div class="card">
      <h2>🆔 Carnet QR del estudiante</h2>
      <div id="qrCard" class="qr-card">
        <h3>${est.nombres} ${est.apellidos}</h3>
        <p>CUI: ${est.cui}</p>
        <p>Grado: ${est.grado} - Sección: ${est.seccion}</p>
        <p>${est.establecimiento}</p>
        <div id="qrcode"></div>
      </div>
      <button class="crud-btn" id="descargarQR">📥 Descargar</button>
    </div>
  `;

  const qrContainer = document.getElementById("qrcode");
  const encrypted = cifrarDatosEstudiante(est);
  new QRCode(qrContainer, {
    text: encrypted,
    width: 140,
    height: 140,
  });

  document.getElementById("descargarQR").addEventListener("click", () => {
    exportarCarnetPDF("qrCard", `${est.nombres}_${est.apellidos}_QR`);
  });
}

/* =========================================================
   🧾 Generar lote de QRs desde PDF
   ========================================================= */
async function generarQREstudianteLote(lista) {
  const area = document.getElementById("contentArea");
  area.innerHTML = `
    <div class="card">
      <h2>🆔 Generación de carnets QR</h2>
      <p>Total: ${lista.length} estudiantes</p>
      <div id="qrLote" class="qr-lote"></div>
      <button class="crud-btn" id="exportarLote">📦 Exportar lote (PDF)</button>
    </div>
  `;

  const cont = document.getElementById("qrLote");

  for (const est of lista) {
    const id = crypto.randomUUID();
    const encrypted = cifrarDatosEstudiante(est);

    const div = document.createElement("div");
    div.className = "qr-carnet";
    div.innerHTML = `
      <div class="qr-card">
        <h3>${est.nombres} ${est.apellidos}</h3>
        <p>CUI: ${est.cui}</p>
        <p>${est.grado} - ${est.seccion}</p>
        <p>${est.establecimiento}</p>
        <div id="qr_${id}"></div>
      </div>
    `;
    cont.appendChild(div);

    new QRCode(document.getElementById(`qr_${id}`), {
      text: encrypted,
      width: 120,
      height: 120,
    });

    // Guardar automáticamente en Supabase
    try {
      await supabase.from("estudiantes").insert([{
        nombre: `${est.nombres} ${est.apellidos}`,
        cui: est.cui,
        grado: est.grado,
        seccion: est.seccion,
        establecimiento_id: null, // Si hay selector, asignar aquí
        qr_json_encrypted: encrypted
      }]);
    } catch {
      await saveEstudiante({
        id,
        nombre: `${est.nombres} ${est.apellidos}`,
        cui: est.cui,
        grado: est.grado,
        seccion: est.seccion,
        establecimiento: est.establecimiento,
        qr_json_encrypted: encrypted
      });
    }
  }

  document.getElementById("exportarLote").addEventListener("click", () => {
    exportarLotePDF("qrLote", "carnets_qr_estudiantes");
  });
}

/* =========================================================
   🧾 Exportar carnet o lote a PDF/PNG
   ========================================================= */
async function exportarCarnetPDF(elementId, filename) {
  const element = document.getElementById(elementId);
  const canvas = await html2canvas(element);
  const imgData = canvas.toDataURL("image/png");
  const pdf = new jspdf.jsPDF({ orientation: "portrait", unit: "mm", format: "a6" });
  pdf.addImage(imgData, "PNG", 5, 5, 95, 130);
  pdf.save(`${filename}.pdf`);
}

async function exportarLotePDF(containerId, filename) {
  const pdf = new jspdf.jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const cont = document.getElementById(containerId);
  const carnets = cont.querySelectorAll(".qr-card");

  let y = 10;
  for (let i = 0; i < carnets.length; i++) {
    const canvas = await html2canvas(carnets[i]);
    const imgData = canvas.toDataURL("image/png");
    pdf.addImage(imgData, "PNG", 10, y, 90, 110);
    y += 115;
    if (y > 260 && i < carnets.length - 1) {
      pdf.addPage();
      y = 10;
    }
  }
  pdf.save(`${filename}.pdf`);
}

/* =========================================================
   🎨 Estilos visuales para carnets
   ========================================================= */
const style = document.createElement("style");
style.textContent = `
.qr-lote {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
.qr-card {
  width: 180px;
  border: 2px solid var(--azul-steam);
  border-radius: 12px;
  background: var(--blanco);
  box-shadow: 0 3px 5px var(--sombra-card);
  text-align: center;
  padding: 10px;
  font-size: 0.9em;
}
.qr-card h3 {
  color: var(--azul-steam);
  font-size: 1em;
}
.qr-card p {
  margin: 3px 0;
  color: var(--gris-oscuro);
}
`;
document.head.appendChild(style);
