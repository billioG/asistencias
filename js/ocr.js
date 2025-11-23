/* =========================================================
   🧠 OCR Híbrido con Tesseract.js (para PDFs escaneados)
   ========================================================= */

/**
 * Procesa un archivo PDF escaneado (sin texto)
 * y extrae su contenido como texto usando OCR.
 *
 * @param {File} file - El archivo PDF cargado.
 * @param {Function} onProgress - Callback opcional para progreso (%)
 * @returns {Promise<string>} texto reconocido
 */
async function procesarOCRCompleto(file, onProgress) {
  return new Promise(async (resolve, reject) => {
    try {
      const pdfData = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;
      let textoTotal = "";
      const totalPages = pdf.numPages;

      const { createWorker } = Tesseract;
      const worker = await createWorker("spa", 1, {
        logger: (m) => {
          if (m.status === "recognizing text" && onProgress) {
            const progress = Math.round(m.progress * 100);
            onProgress(progress);
          }
        },
      });

      for (let i = 1; i <= totalPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2 });
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        const renderContext = { canvasContext: ctx, viewport };
        await page.render(renderContext).promise;

        const dataUrl = canvas.toDataURL("image/png");
        const { data: { text } } = await worker.recognize(dataUrl);
        textoTotal += "\n" + text;
      }

      await worker.terminate();
      resolve(textoTotal);
    } catch (error) {
      console.error("Error OCR:", error);
      reject("Error durante OCR: " + error.message);
    }
  });
}

/**
 * Interfaz visual auxiliar para mostrar progreso OCR
 */
async function mostrarProgresoOCR(file) {
  const area = document.getElementById("pdfPreview");
  area.innerHTML = `
    <div class="card">
      <h3>🧠 Procesando OCR...</h3>
      <div id="ocrProgressBar" style="width:100%;background:#eee;border-radius:10px;height:25px;margin-top:10px;">
        <div id="ocrProgress" style="height:25px;width:0%;background:linear-gradient(90deg,var(--azul-steam),var(--violeta-steam));border-radius:10px;transition:width 0.3s;"></div>
      </div>
      <p id="ocrStatus">Preparando OCR...</p>
    </div>
  `;

  const progressBar = document.getElementById("ocrProgress");
  const status = document.getElementById("ocrStatus");

  const texto = await procesarOCRCompleto(file, (percent) => {
    progressBar.style.width = percent + "%";
    status.textContent = `Reconociendo texto... ${percent}%`;
  });

  status.textContent = "✅ OCR completado. Analizando texto...";
  return texto;
}

/* =========================================================
   🔄 Integración con pdfParser.js
   ========================================================= */

async function procesarOCR(file) {
  // Reutiliza la interfaz de progreso integrada
  return await mostrarProgresoOCR(file);
}
