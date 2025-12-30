// -------------------------------
// GESTIÓN DE PÁGINAS - NUEVAS FUNCIONALIDADES
// -------------------------------

// Referencias para gestión de páginas
const nuevaPaginaBtn = document.getElementById("nueva-pagina-btn");
const nuevaPaginaForm = document.getElementById("nueva-pagina-form");
const nuevaPaginaFormElement = document.getElementById("nueva-pagina-form-element");
const nuevaPaginaSlugInput = document.getElementById("nueva-pagina-slug");
const nuevaPaginaTituloInput = document.getElementById("nueva-pagina-titulo");
const nuevaPaginaContenidoInput = document.getElementById("nueva-pagina-contenido");
const nuevaPaginaVisibleSelect = document.getElementById("nueva-pagina-visible");
const cancelarNuevaPaginaBtn = document.getElementById("cancelar-nueva-pagina");

const paginasLista = document.getElementById("paginas-lista");
const paginaEditor = document.getElementById("pagina-editor");
const paginaForm = document.getElementById("pagina-form");
const paginaTituloInput = document.getElementById("pagina-titulo");
const paginaContenidoInput = document.getElementById("pagina-contenido");
const paginaVisibleSelect = document.getElementById("pagina-visible");
const cancelarPaginaBtn = document.getElementById("cancelar-pagina");

let paginas = [];
let paginaEditando = null;

// Event listeners para gestión de páginas
nuevaPaginaBtn.addEventListener("click", () => {
  nuevaPaginaForm.style.display = "block";
  paginaEditor.style.display = "none";
  nuevaPaginaFormElement.reset();
  nuevaPaginaVisibleSelect.value = "1";
});

cancelarNuevaPaginaBtn.addEventListener("click", () => {
  nuevaPaginaForm.style.display = "none";
});

nuevaPaginaFormElement.addEventListener("submit", async (e) => {
  e.preventDefault();
  
  const slug = nuevaPaginaSlugInput.value.trim();
  const titulo = nuevaPaginaTituloInput.value.trim();
  const contenido = nuevaPaginaContenidoInput.value;
  const visible = nuevaPaginaVisibleSelect.value;

  if (!slug || !titulo) {
    showToast("El slug y el título son obligatorios", "error");
    return;
  }

  // Validar slug (solo letras minúsculas, números y guiones)
  const slugValido = /^[a-z0-9-]+$/.test(slug);
  if (!slugValido) {
    showToast("El slug solo puede contener letras minúsculas, números y guiones", "error");
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/paginas`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token
      },
      body: JSON.stringify({ slug, titulo, contenido, visible })
    });

    if (!res.ok) {
      const error = await res.json();
      showToast(error.error || "Error al crear página", "error");
      return;
    }

    showToast("Página creada correctamente", "success");
    nuevaPaginaForm.style.display = "none";
    cargarPaginas();

  } catch (err) {
    showToast("Error de conexión", "error");
  }
});

cancelarPaginaBtn.addEventListener("click", () => {
  paginaEditor.style.display = "none";
  paginaEditando = null;
});

paginaForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  
  if (!paginaEditando) return;

  const titulo = paginaTituloInput.value.trim();
  const contenido = paginaContenidoInput.value;
  const visible = paginaVisibleSelect.value;

  try {
    const res = await fetch(`${API_BASE}/paginas/${paginaEditando.slug}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token
      },
      body: JSON.stringify({ titulo, contenido, visible })
    });

    if (!res.ok) {
      const error = await res.json();
      showToast(error.error || "Error al actualizar página", "error");
      return;
    }

    showToast("Página actualizada correctamente", "success");
    paginaEditor.style.display = "none";
    paginaEditando = null;
    cargarPaginas();

  } catch (err) {
    showToast("Error de conexión", "error");
  }
});

// Event listener para borrar páginas
document.addEventListener("click", async (e) => {
  if (e.target.classList.contains("borrar-pagina")) {
    const slug = e.target.dataset.slug;
    if (!confirm("¿Seguro que quieres borrar esta página?")) return;

    try {
      const res = await fetch(`${API_BASE}/paginas/${slug}`, {
        method: "DELETE",
        headers: { Authorization: "Bearer " + token }
      });

      if (!res.ok) {
        const error = await res.json();
        showToast(error.error || "Error al borrar página", "error");
        return;
      }

      showToast("Página borrada correctamente", "success");
      cargarPaginas();

    } catch (err) {
      showToast("Error de conexión", "error");
    }
  }
});

// Función para cargar páginas
async function cargarPaginas() {
  try {
    const res = await fetch(`${API_BASE}/paginas`);
    const data = await res.json();

    if (!Array.isArray(data)) {
      showToast("Error al cargar páginas", "error");
      return;
    }

    paginas = data;
    renderPaginasLista();

  } catch (err) {
    showToast("Error de conexión al cargar páginas", "error");
  }
}

// Función para renderizar lista de páginas
function renderPaginasLista() {
  paginasLista.innerHTML = '<option value="">Selecciona una página...</option>';
  
  paginas.forEach(pagina => {
    const option = document.createElement("option");
    option.value = pagina.slug;
    option.textContent = pagina.titulo;
    paginasLista.appendChild(option);
  });
}

// Event listener para seleccionar página
paginasLista.addEventListener("change", () => {
  const slugSeleccionado = paginasLista.value;
  
  if (!slugSeleccionado) {
    paginaEditor.style.display = "none";
    paginaEditando = null;
    return;
  }

  const pagina = paginas.find(p => p.slug === slugSeleccionado);
  if (!pagina) return;

  paginaEditando = pagina;
  paginaEditor.style.display = "block";
  nuevaPaginaForm.style.display = "none";
  
  paginaTituloInput.value = pagina.titulo;
  paginaContenidoInput.value = pagina.contenido;
  paginaVisibleSelect.value = pagina.visible ? "1" : "0";
});

// Función para generar slug automáticamente
function generarSlug(texto) {
  return texto
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

// Event listener para generar slug automáticamente desde el título
nuevaPaginaTituloInput.addEventListener("input", () => {
  const titulo = nuevaPaginaTituloInput.value.trim();
  if (titulo && !nuevaPaginaSlugInput.value) {
    nuevaPaginaSlugInput.value = generarSlug(titulo);
  }
});

// Cargar páginas al iniciar si estamos en la sección de páginas
if (document.getElementById('seccion-paginas')) {
  cargarPaginas();
}
