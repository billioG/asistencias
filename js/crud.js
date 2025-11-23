/* =========================================================
   ⚙️ CRUD General - Establecimientos, Docentes, Estudiantes
   ========================================================= */

// =========================================================
// 🏫 MÓDULO ESTABLECIMIENTOS
// =========================================================
async function cargarModuloEstablecimientos() {
  const area = document.getElementById("contentArea");
  area.innerHTML = `
    <div class="card">
      <h2>🏫 Establecimientos</h2>
      <div>
        <input id="nombreEst" placeholder="Nombre del establecimiento" />
        <input id="codigoEst" placeholder="Código (opcional)" />
        <input id="direccionEst" placeholder="Dirección" />
        <input id="municipioEst" placeholder="Municipio" />
        <input id="departamentoEst" placeholder="Departamento" />
        <button class="crud-btn" id="addEstBtn">Agregar</button>
      </div>
      <div id="tablaEst"></div>
    </div>
  `;

  document.getElementById("addEstBtn").addEventListener("click", async () => {
    const nombre = document.getElementById("nombreEst").value.trim();
    if (!nombre) return alert("Debe ingresar un nombre.");
    const nuevo = {
      nombre,
      codigo: document.getElementById("codigoEst").value.trim(),
      direccion: document.getElementById("direccionEst").value.trim(),
      municipio: document.getElementById("municipioEst").value.trim(),
      departamento: document.getElementById("departamentoEst").value.trim(),
    };
    try {
      const { error } = await supabase.from("establecimientos").insert([nuevo]);
      if (error) throw error;
      alert("✅ Establecimiento agregado.");
      cargarModuloEstablecimientos();
    } catch {
      await withStore("establecimientos", "readwrite", (s) => s.put(nuevo));
      alert("⚠️ Sin conexión, guardado localmente.");
    }
  });

  listarEstablecimientos();
}

async function listarEstablecimientos() {
  const cont = document.getElementById("tablaEst");
  cont.innerHTML = "<p>Cargando...</p>";
  let data = [];

  try {
    const { data: supaData, error } = await supabase.from("establecimientos").select("*").order("nombre");
    if (error) throw error;
    data = supaData;
  } catch {
    data = await withStore("establecimientos", "readonly", (s) => s.getAll());
  }

  if (data.length === 0) {
    cont.innerHTML = "<p>No hay establecimientos registrados.</p>";
    return;
  }

  let tabla = `<div class="table-container"><table><thead><tr>
      <th>Nombre</th><th>Municipio</th><th>Departamento</th><th>Acción</th>
    </tr></thead><tbody>`;

  data.forEach((e) => {
    tabla += `<tr>
      <td>${e.nombre}</td>
      <td>${e.municipio || "-"}</td>
      <td>${e.departamento || "-"}</td>
      <td><button class="crud-btn delete" onclick="eliminarEstablecimiento('${e.id}')">Eliminar</button></td>
    </tr>`;
  });

  tabla += `</tbody></table></div>`;
  cont.innerHTML = tabla;
}

async function eliminarEstablecimiento(id) {
  if (!confirm("¿Eliminar este establecimiento?")) return;
  try {
    await supabase.from("establecimientos").delete().eq("id", id);
    alert("✅ Eliminado");
  } catch {
    await withStore("establecimientos", "readwrite", (s) => s.delete(id));
    alert("⚠️ Sin conexión, se eliminará al sincronizar.");
  }
  listarEstablecimientos();
}

// =========================================================
// 👩‍🏫 MÓDULO DOCENTES
// =========================================================
async function cargarModuloDocentes() {
  const area = document.getElementById("contentArea");
  const { data: ests } = await supabase.from("establecimientos").select("*");
  const opciones = ests.map((e) => `<option value="${e.id}">${e.nombre}</option>`).join("");

  area.innerHTML = `
    <div class="card">
      <h2>👩‍🏫 Docentes</h2>
      <div>
        <input id="nombreDoc" placeholder="Nombre del docente" />
        <input id="emailDoc" placeholder="Correo electrónico" />
        <input id="telDoc" placeholder="Teléfono" />
        <input id="gradoDoc" placeholder="Grado" />
        <input id="seccionDoc" placeholder="Sección" />
        <select id="instDoc">${opciones}</select>
        <button class="crud-btn" id="addDocBtn">Agregar</button>
      </div>
      <div id="tablaDoc"></div>
    </div>
  `;

  document.getElementById("addDocBtn").addEventListener("click", async () => {
    const d = {
      nombre: document.getElementById("nombreDoc").value.trim(),
      email: document.getElementById("emailDoc").value.trim(),
      telefono: document.getElementById("telDoc").value.trim(),
      grado: document.getElementById("gradoDoc").value.trim(),
      seccion: document.getElementById("seccionDoc").value.trim(),
      establecimiento_id: document.getElementById("instDoc").value,
    };
    try {
      const { error } = await supabase.from("docentes").insert([d]);
      if (error) throw error;
      alert("✅ Docente agregado");
      cargarModuloDocentes();
    } catch {
      await saveDocente(d);
      alert("⚠️ Sin conexión, guardado localmente.");
    }
  });

  listarDocentes();
}

async function listarDocentes() {
  const cont = document.getElementById("tablaDoc");
  cont.innerHTML = "<p>Cargando...</p>";
  let data = [];

  try {
    const { data: supaData, error } = await supabase.from("docentes").select("*").order("nombre");
    if (error) throw error;
    data = supaData;
  } catch {
    data = await getDocentes();
  }

  if (data.length === 0) {
    cont.innerHTML = "<p>No hay docentes registrados.</p>";
    return;
  }

  let tabla = `<div class="table-container"><table><thead><tr>
      <th>Nombre</th><th>Email</th><th>Grado</th><th>Sección</th><th>Acción</th>
    </tr></thead><tbody>`;

  data.forEach((e) => {
    tabla += `<tr>
      <td>${e.nombre}</td>
      <td>${e.email}</td>
      <td>${e.grado}</td>
      <td>${e.seccion}</td>
      <td><button class="crud-btn delete" onclick="eliminarDocente('${e.id}')">Eliminar</button></td>
    </tr>`;
  });

  tabla += `</tbody></table></div>`;
  cont.innerHTML = tabla;
}

async function eliminarDocente(id) {
  if (!confirm("¿Eliminar este docente?")) return;
  try {
    await supabase.from("docentes").delete().eq("id", id);
    alert("✅ Eliminado");
  } catch {
    alert("⚠️ Sin conexión, pendiente de eliminar.");
  }
  listarDocentes();
}

// =========================================================
// 👨‍🎓 MÓDULO ESTUDIANTES
// =========================================================
async function cargarModuloEstudiantes() {
  const area = document.getElementById("contentArea");
  const { data: ests } = await supabase.from("establecimientos").select("*");
  const opciones = ests.map((e) => `<option value="${e.id}">${e.nombre}</option>`).join("");

  area.innerHTML = `
    <div class="card">
      <h2>👨‍🎓 Estudiantes</h2>
      <div>
        <input id="nombreEstu" placeholder="Nombre del estudiante" />
        <input id="cuiEstu" placeholder="CUI" />
        <input id="gradoEstu" placeholder="Grado" />
        <input id="seccionEstu" placeholder="Sección" />
        <select id="instEstu">${opciones}</select>
        <button class="crud-btn" id="addEstuBtn">Agregar</button>
      </div>
      <div id="tablaEstu"></div>
    </div>
  `;

  document.getElementById("addEstuBtn").addEventListener("click", async () => {
    const e = {
      nombre: document.getElementById("nombreEstu").value.trim(),
      cui: document.getElementById("cuiEstu").value.trim(),
      grado: document.getElementById("gradoEstu").value.trim(),
      seccion: document.getElementById("seccionEstu").value.trim(),
      establecimiento_id: document.getElementById("instEstu").value,
    };
    try {
      const { error } = await supabase.from("estudiantes").insert([e]);
      if (error) throw error;
      alert("✅ Estudiante agregado");
      cargarModuloEstudiantes();
    } catch {
      await saveEstudiante(e);
      alert("⚠️ Sin conexión, guardado localmente.");
    }
  });

  listarEstudiantes();
}

async function listarEstudiantes() {
  const cont = document.getElementById("tablaEstu");
  cont.innerHTML = "<p>Cargando...</p>";
  let data = [];

  try {
    const { data: supaData, error } = await supabase.from("estudiantes").select("*").order("nombre");
    if (error) throw error;
    data = supaData;
  } catch {
    data = await getEstudiantes();
  }

  if (data.length === 0) {
    cont.innerHTML = "<p>No hay estudiantes registrados.</p>";
    return;
  }

  let tabla = `<div class="table-container"><table><thead><tr>
      <th>Nombre</th><th>CUI</th><th>Grado</th><th>Sección</th><th>Acción</th>
    </tr></thead><tbody>`;

  data.forEach((e) => {
    tabla += `<tr>
      <td>${e.nombre}</td>
      <td>${e.cui}</td>
      <td>${e.grado}</td>
      <td>${e.seccion}</td>
      <td><button class="crud-btn delete" onclick="eliminarEstudiante('${e.id}')">Eliminar</button></td>
    </tr>`;
  });

  tabla += `</tbody></table></div>`;
  cont.innerHTML = tabla;
}

async function eliminarEstudiante(id) {
  if (!confirm("¿Eliminar este estudiante?")) return;
  try {
    await supabase.from("estudiantes").delete().eq("id", id);
    alert("✅ Eliminado");
  } catch {
    alert("⚠️ Sin conexión, pendiente de eliminar.");
  }
  listarEstudiantes();
}
