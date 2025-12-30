// -------------------------------
// SISTEMA DE PÁGINAS - BOTÓN + FORM + LISTADO
// -------------------------------

document.addEventListener("DOMContentLoaded", () => {
  console.log("JS del admin cargado");

  // Referencias principales
  const btnNueva = document.getElementById("nueva-pagina");
  const form = document.getElementById("form-pagina");
  const formTitulo = document.getElementById("form-pagina-titulo");
  const listaPaginas = document.getElementById("lista-paginas");
  const bloquesContainer = document.getElementById("bloques-container");
  const recargarBtn = document.getElementById("recargar-paginas");

  // Form inputs
  const paginaSlugInput = document.getElementById("pagina-slug");
  const paginaTituloInput = document.getElementById("pagina-titulo");
  const paginaContenidoInput = document.getElementById("pagina-contenido");
  const paginaVisibleSelect = document.getElementById("pagina-visible");
  const guardarBtn = document.getElementById("guardar-pagina");
  const cancelarBtn = document.getElementById("cancelar-pagina");

  // Variables globales
  let paginas = [];
  let paginaEditando = null;

  // Verificar que los elementos existen
  if (btnNueva && form) {
    console.log("Botón 'Nueva página' encontrado");

    // Event listener para el botón "Nueva página"
    btnNueva.addEventListener("click", () => {
      console.log("Click en 'Nueva página'");
      
      // Mostrar formulario
      form.style.display = "block";
      formTitulo.textContent = "Crear página";
      
      // Ocultar bloques
      if (bloquesContainer) bloquesContainer.style.display = "none";
      
      // Resetear formulario
      resetearFormulario();
      
      // Limpiar estado de edición
      paginaEditando = null;
    });
  } else {
    console.log("NO se ha encontrado el botón o el formulario de página");
  }

  // Event listener para cancelar
  if (cancelarBtn) {
    cancelarBtn.addEventListener("click", () => {
      form.style.display = "none";
      if (bloquesContainer) bloquesContainer.style.display = "none";
      paginaEditando = null;
    });
  }

  // Event listener para guardar
  if (guardarBtn) {
    guardarBtn.addEventListener("click", async () => {
      await guardarPagina();
    });
  }

  // Event listener para el formulario
  const formElement = document.getElementById("pagina-form-element");
  if (formElement) {
    formElement.addEventListener("submit", async (e) => {
      e.preventDefault();
      await guardarPagina();
    });
  }

  // Event listener para recargar
  if (recargarBtn) {
    recargarBtn.addEventListener("click", () => {
      cargarPaginas();
    });
  }

  // Event listener para generar slug automáticamente
  if (paginaTituloInput) {
    paginaTituloInput.addEventListener("input", () => {
      const titulo = paginaTituloInput.value.trim();
      if (titulo && !paginaSlugInput.value) {
        paginaSlugInput.value = generarSlug(titulo);
      }
    });
  }

  // -------------------------------
  // FUNCIONES PRINCIPALES
  // -------------------------------

  // Resetear formulario
  function resetearFormulario() {
    if (paginaSlugInput) paginaSlugInput.value = "";
    if (paginaTituloInput) paginaTituloInput.value = "";
    if (paginaContenidoInput) paginaContenidoInput.value = "";
    if (paginaVisibleSelect) paginaVisibleSelect.value = "1";
  }

  // Generar slug
  function generarSlug(texto) {
    return texto
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  // Guardar página (crear o actualizar)
  async function guardarPagina() {
    const slug = paginaSlugInput.value.trim();
    const titulo = paginaTituloInput.value.trim();
    const contenido = paginaContenidoInput.value;
    const visible = paginaVisibleSelect.value;

    console.log("Guardando página:", { slug, titulo, contenido: contenido.substring(0, 100) + "...", visible, modo: paginaEditando ? "editar" : "crear" });

    // Validación
    if (!slug || !titulo) {
      showToast("El slug y el título son obligatorios", "error");
      return;
    }

    try {
      let res;
      let data;

      if (paginaEditando) {
        // Actualizar página existente
        console.log("Actualizando página existente:", paginaEditando.slug);
        res = await fetch(`/api/paginas/${paginaEditando.slug}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + localStorage.getItem("admin_token")
          },
          body: JSON.stringify({ titulo, contenido, visible })
        });
        data = await res.json();

        if (!res.ok) {
          console.error("Error al actualizar página:", data);
          showToast(data.error || "Error al actualizar página", "error");
          return;
        }

        console.log("Página actualizada exitosamente");
        showToast("Página actualizada correctamente", "success");
      } else {
        // Crear nueva página
        console.log("Creando nueva página:", slug);
        res = await fetch("/api/paginas", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + localStorage.getItem("admin_token")
          },
          body: JSON.stringify({ slug, titulo, contenido, visible })
        });
        data = await res.json();

        if (!res.ok) {
          console.error("Error al crear página:", data);
          showToast(data.error || "Error al crear página", "error");
          return;
        }

        console.log("Página creada exitosamente:", data);
        showToast("Página creada correctamente", "success");
      }

      // Ocultar formulario y recargar
      form.style.display = "none";
      if (bloquesContainer) bloquesContainer.style.display = "none";
      await cargarPaginas();

    } catch (err) {
      console.error("Error guardando página:", err);
      showToast("Error de conexión", "error");
    }
  }

  // Cargar páginas desde la API
  async function cargarPaginas() {
    if (!listaPaginas) return;

    listaPaginas.innerHTML = "<p style='color:#a1a3b3;font-size:0.85rem;'>Cargando páginas...</p>";

    try {
      const res = await fetch("/api/paginas");
      const data = await res.json();

      if (!Array.isArray(data)) {
        listaPaginas.innerHTML = "<p style='color:#ff9fb1;font-size:0.85rem;'>Error al cargar páginas</p>";
        return;
      }

      paginas = data;
      renderizarListaPaginas();

    } catch (err) {
      listaPaginas.innerHTML = "<p style='color:#ff9fb1;font-size:0.85rem;'>Error de conexión</p>";
      console.error("Error cargando páginas:", err);
    }
  }

  // Renderizar listado de páginas
  function renderizarListaPaginas() {
    if (!listaPaginas) return;

    if (paginas.length === 0) {
      listaPaginas.innerHTML = "<p style='color:#a1a3b3;font-size:0.85rem;'>No hay páginas creadas todavía.</p>";
      return;
    }

    listaPaginas.innerHTML = "";

    paginas.forEach(pagina => {
      const div = document.createElement("div");
      div.className = "pagina-item";
      div.style.cssText = `
        border: 1px solid #334155;
        padding: 1rem;
        margin-bottom: 0.75rem;
        border-radius: 0.5rem;
        background: rgba(15, 23, 42, 0.9);
        display: flex;
        justify-content: space-between;
        align-items: center;
      `;

      const info = document.createElement("div");
      info.innerHTML = `
        <div style="font-weight: 500; color: #e5e7eb; margin-bottom: 0.25rem;">${pagina.titulo}</div>
        <div style="font-size: 0.8rem; color: #9ca3af;">/${pagina.slug}</div>
        <div style="font-size: 0.7rem; color: ${pagina.visible ? '#2ecc71' : '#e74c3c'};">
          ${pagina.visible ? '✓ Visible' : '✗ Oculta'}
        </div>
      `;

      const acciones = document.createElement("div");
      acciones.style.cssText = "display: flex; gap: 0.5rem;";

      const btnEditar = document.createElement("button");
      btnEditar.textContent = "Editar";
      btnEditar.className = "btn-secondary";
      btnEditar.style.cssText = "padding: 0.25rem 0.75rem; font-size: 0.8rem;";
      btnEditar.addEventListener("click", () => editarPagina(pagina));

      const btnBloques = document.createElement("button");
      btnBloques.textContent = "Bloques";
      btnBloques.className = "btn-primary";
      btnBloques.style.cssText = "padding: 0.25rem 0.75rem; font-size: 0.8rem;";
      btnBloques.addEventListener("click", () => gestionarBloques(pagina));

      const btnBorrar = document.createElement("button");
      btnBorrar.textContent = "Borrar";
      btnBorrar.className = "btn-secondary";
      btnBorrar.style.cssText = "padding: 0.25rem 0.75rem; font-size: 0.8rem; background: #e74c3c; border-color: #e74c3c;";
      btnBorrar.addEventListener("click", () => borrarPagina(pagina));

      acciones.appendChild(btnEditar);
      acciones.appendChild(btnBloques);
      acciones.appendChild(btnBorrar);

      div.appendChild(info);
      div.appendChild(acciones);

      listaPaginas.appendChild(div);
    });
  }

  // Editar página
  function editarPagina(pagina) {
    console.log("Editando página:", pagina);
    paginaEditando = pagina;
    
    // Mostrar formulario
    form.style.display = "block";
    formTitulo.textContent = "Editar página";
    
    // Ocultar bloques
    if (bloquesContainer) bloquesContainer.style.display = "none";
    
    // Cargar datos
    if (paginaSlugInput) {
      paginaSlugInput.value = pagina.slug;
      console.log("Slug cargado:", pagina.slug);
    }
    if (paginaTituloInput) {
      paginaTituloInput.value = pagina.titulo;
      console.log("Título cargado:", pagina.titulo);
    }
    if (paginaContenidoInput) {
      paginaContenidoInput.value = pagina.contenido || "";
      console.log("Contenido cargado:", pagina.contenido ? pagina.contenido.substring(0, 100) + "..." : "(vacío)");
    }
    if (paginaVisibleSelect) {
      paginaVisibleSelect.value = pagina.visible ? "1" : "0";
      console.log("Visibilidad cargada:", pagina.visible);
    }
  }

  // Gestionar bloques
  function gestionarBloques(pagina) {
    paginaEditando = pagina;
    
    // Ocultar formulario
    form.style.display = "none";
    
    // Mostrar contenedor de bloques
    if (bloquesContainer) {
      bloquesContainer.style.display = "block";
      
      // Llamar a la función de gestión de bloques si existe
      if (typeof window.actualizarPaginaActual === 'function') {
        window.actualizarPaginaActual(pagina.slug);
      }
    }
  }

  // Borrar página
  async function borrarPagina(pagina) {
    if (!confirm(`¿Seguro que quieres borrar la página "${pagina.titulo}"?`)) return;

    try {
      const res = await fetch(`/api/paginas/${pagina.slug}`, {
        method: "DELETE",
        headers: {
          Authorization: "Bearer " + localStorage.getItem("admin_token")
        }
      });

      const data = await res.json();

      if (!res.ok) {
        showToast(data.error || "Error al borrar página", "error");
        return;
      }

      showToast("Página borrada correctamente", "success");
      await cargarPaginas();

    } catch (err) {
      showToast("Error de conexión", "error");
      console.error("Error borrando página:", err);
    }
  }

  // Función para mostrar toasts (si no existe global)
  if (typeof window.showToast !== 'function') {
    window.showToast = function(message, type = "success", duration = 3000) {
      const toastContainer = document.getElementById("toast-container");
      if (!toastContainer) return;

      const toast = document.createElement("div");
      toast.className = "toast " + (type === "error" ? "toast-error" : "toast-success");

      const icon = document.createElement("div");
      icon.className = "toast-icon";
      icon.textContent = type === "error" ? "⚠" : "✔";

      const msg = document.createElement("div");
      msg.className = "toast-message";
      msg.textContent = message;

      const closeBtn = document.createElement("button");
      closeBtn.className = "toast-close";
      closeBtn.textContent = "✕";
      closeBtn.addEventListener("click", () => {
        toastContainer.removeChild(toast);
      });

      toast.appendChild(icon);
      toast.appendChild(msg);
      toast.appendChild(closeBtn);

      toastContainer.appendChild(toast);

      setTimeout(() => {
        if (toast.parentElement === toastContainer) {
          toastContainer.removeChild(toast);
        }
      }, duration);
    };
  }

  // Cargar páginas al iniciar si estamos en la sección de páginas
  if (document.getElementById('seccion-paginas')) {
    cargarPaginas();
  }
});
