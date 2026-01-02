/* =========================================================
   ⚙️ Supabase Configuración y Autenticación
   https://eahfrfntuqdunvmaohcz.supabase.co
   ========================================================= */
https://ufxpbrsqzqfvqdohxlgg.supabase.co
// 🚀 Inserta tus credenciales aquí
const SUPABASE_URL = "https://ufxpbrsqzqfvqdohxlgg.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmeHBicnNxenFmdnFkb2h4bGdnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM0MzU2ODgsImV4cCI6MjA3OTAxMTY4OH0.-6Vz94gp5jT2HbrrhdMrD40-YAzjclDk89RBUxRnS7g";

// Crear cliente Supabase
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// =========================================================
// 🔐 Manejo de sesión persistente
// =========================================================

async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

async function getUserProfile() {
  const session = await getSession();
  if (!session) return null;
  const id = session.user.id;
  const { data, error } = await supabase.from('usuarios').select('*').eq('id', id).single();
  if (error) {
    console.error("Error al obtener perfil:", error);
    return null;
  }
  return data;
}

async function getRol() {
  const perfil = await getUserProfile();
  return perfil ? perfil.rol : null;
}

// =========================================================
// 👑 Crear usuario (solo admins o superadmins)
// =========================================================
async function crearUsuario(email, password, nombre, rol, establecimientoId) {
  try {
    // Solo admins o superadmins pueden crear
    const currentRol = localStorage.getItem('rol');
    if (!['admin', 'superadmin'].includes(currentRol)) {
      alert("No tienes permisos para crear usuarios.");
      return;
    }

    const { data: usuario, error } = await supabase.rpc('crear_usuario_admin', {
      p_email: email,
      p_password: password,
      p_nombre: nombre,
      p_rol: rol,
      p_establecimiento: establecimientoId
    });

    if (error) throw error;
    alert(`✅ Usuario creado exitosamente (${rol})`);
    return usuario;
  } catch (err) {
    console.error("Error al crear usuario:", err);
    alert("❌ Error al crear usuario.");
  }
}

// =========================================================
// 🚪 Cerrar sesión global
// =========================================================
async function cerrarSesion() {
  await supabase.auth.signOut();
  localStorage.clear();
  window.location.href = "index.html";
}

// =========================================================
// 🧭 Autologin: mantener sesión activa al recargar
// =========================================================
(async () => {
  const { data } = await supabase.auth.getSession();
  if (data.session) {
    const user = data.session.user;
    localStorage.setItem('userId', user.id);
  }
})();

