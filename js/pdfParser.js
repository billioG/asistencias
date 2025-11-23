/* =========================================================
   📄 Lector PDF SIRE - pdf.js + OCR + vista previa
   ========================================================= */

// Importar PDF.js
importScripts = undefined; // Evita conflictos
const pdfjsLib = window['pdfjs-dist/build/pdf'];
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.10.377/pdf.worker.min.js';

/* =========================================================
   📥 Cargar PDF desde archivo
   ========================================================= */
async function cargarModuloPDF() {
  const area = document.getElementById('contentArea');
  area.innerHTML = `
    <div class="card">
      <h2>📄 Cargar PDF del SIRE</h2>
      <input type="file" id="pdfFile" accept=".pdf" />
      <button class="crud-btn" id="leerPDFBtn">Leer PDF</button>
      <div id="pdfPreview"></div>
    </div>
  `;

  document.getElementById('leerPDFBtn').addEventListener('click', async () => {
    const file = document.getElementById('pdfFile').files[0];
    if (!file) return alert("Por favor selecciona un archivo PDF.");

    const text = await extraerTextoPDF(file);
    if (!text || text.trim().length < 100) {
      alert("No se detectó texto, usando OCR...");
      const ocrText = await procesarOCR(file);
      procesarDatosSIRE(ocrText);
    } else {
      procesarDatosSIRE(text);
    }
  });
}

/* =========================================================
   🔍 Extraer texto usando pdf.js
   ========================================================= */
async function extraerTextoPDF(file) {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let text = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items.map(i => i.str).join(" ");
    text += "\n" + pageText;
  }
  return text;
}

/* =========================================================
   🧠 Procesar datos del texto SIRE
   ========================================================= */
function procesarDatosSIRE(text) {
  const area = document.getElementById('pdfPreview');
  area.innerHTML = `<p>Analizando PDF...</p>`;

  // --- Extraer encabezado
  const establecimiento = (text.match(/Nombre:\s+([A-ZÁÉÍÓÚÑ\s]+)/i) || [])[1] || "No detectado";
  const grado = (text.match(/Grado:\s+([A-Z0-9ÁÉÍÓÚÑ\s]+)/i) || [])[1] || "Desconocido";
  const seccion = (text.match(/Seccion:\s+([A-Z0-9ÁÉÍÓÚÑ]+)/i) || [])[1] || "N/A";

  // --- Extraer filas de alumnos (regex robusto)
  const regex = /([A-Z0-9]{7})\s+([A-ZÁÉÍÓÚÑ\s]+)\s+([A-ZÁÉÍÓÚÑ\s]+)\s+(\d{2}\/\d{2}\/\d{4})\s+Guatemalteca\s+CUI\s+(\d{13})\s+(MASCULINO|FEMENINO)/gi;
  const estudiantes = [];
  let match;

  while ((match = regex.exec(text)) !== null) {
    estudiantes.push({
      codigo: match[1],
      apellidos: match[2].trim(),
      nombres: match[3].trim(),
      fecha: match[4],
      cui: match[5],
      genero: match[6]
    });
  }

  // --- Mostrar vista previa editable
  if (estudiantes.length === 0) {
    area.innerHTML = `<p style="color:red;">⚠️ No se detectaron estudiantes. Revisa el formato del PDF.</p>`;
    return;
  }

  let tabla = `
    <h3>Vista previa - ${establecimiento}</h3>
    <p>Grado: ${grado} | Sección: ${seccion}</p>
    <div class="table-container">
      <table>
        <thead>
          <tr><th>#</th><th>Apellidos</th><th>Nombres</th><th>CUI</th><th>Fecha</th><th>Género</th></tr>
        </thead>
        <tbody>
  `;
  estudiantes.forEach((e, i) => {
    tabla += `
      <tr>
        <td>${i + 1}</td>
        <td contenteditable>${e.apellidos}</td>
        <td contenteditable>${e.nombres}</td>
        <td contenteditable>${e.cui}</td>
        <td contenteditable>${e.fecha}</td>
        <td contenteditable>${e.genero}</td>
      </tr>`;
  });
  tabla += `</tbody></table></div>
    <button class="crud-btn" id="generarQRBtn">Generar QRs</button>`;

  area.innerHTML = tabla;

  document.getElementById('generarQRBtn').addEventListener('click', () => {
    const rows = area.querySelectorAll('tbody tr');
    const estudiantesValidados = [];
    rows.forEach((r) => {
      const cols = r.querySelectorAll('td');
      estudiantesValidados.push({
        apellidos: cols[1].innerText.trim(),
        nombres: cols[2].innerText.trim(),
        cui: cols[3].innerText.trim(),
        fecha: cols[4].innerText.trim(),
        genero: cols[5].innerText.trim(),
        grado,
        seccion,
        establecimiento
      });
    });

    generarQREstudianteLote(estudiantesValidados);
  });
}

/* =========================================================
   🧾 OCR Fallback (Tesseract.js)
   ========================================================= */
async function procesarOCR(file) {
  return new Promise(async (resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async function () {
      const { createWorker } = Tesseract;
      const worker = await createWorker('spa');
      const { data: { text } } = await worker.recognize(reader.result);
      await worker.terminate();
      resolve(text);
    };
    reader.readAsDataURL(file);
  });
}
