// -------------------------------
// GESTIÓN DE BLOQUES DE PÁGINA
// -------------------------------

// Referencias para gestión de bloques
const agregarTextoBtn = document.getElementById("agregar-texto");
const agregarImagenBtn = document.getElementById("agregar-imagen");
const bloquesLista = document.getElementById("bloques-lista");

let bloques = [];
let paginaActualSlug = null;

// Event listeners para gestión de bloques
agregarTextoBtn.addEventListener("click", async () => {
  if (!paginaActualSlug) {
    showToast("Selecciona una página primero", "error");
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/paginas/${paginaActualSlug}/bloques`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token
      },
      body: JSON.stringify({ 
        tipo: "texto", 
        contenido: "<p>Escribe tu texto aquí...</p>", 
        orden: Date.now() 
      })
    });

    if (!res.ok) {
      const error = await res.json();
      showToast(error.error || "Error al añadir texto", "error");
      return;
    }

    showToast("Texto añadido correctamente", "success");
    cargarBloques(paginaActualSlug);

  } catch (err) {
    showToast("Error de conexión", "error");
  }
});

agregarImagenBtn.addEventListener("click", async () => {
  if (!paginaActualSlug) {
    showToast("Selecciona una página primero", "error");
    return;
  }

  const url = prompt("URL de la imagen:");
  if (!url) return;

  try {
    const res = await fetch(`${API_BASE}/paginas/${paginaActualSlug}/bloques`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token
      },
      body: JSON.stringify({ 
        tipo: "imagen", 
        contenido: url, 
        orden: Date.now() 
      })
    });

    if (!res.ok) {
      const error = await res.json();
      showToast(error.error || "Error al añadir imagen", "error");
      return;
    }

    showToast("Imagen añadida correctamente", "success");
    cargarBloques(paginaActualSlug);

  } catch (err) {
    showToast("Error de conexión", "error");
  }
});

// Event listener para gestionar bloques (mover, borrar, editar)
bloquesLista.addEventListener("click", async (e) => {
  const id = e.target.dataset.id;
  if (!id) return;

  if (e.target.classList.contains("bloque-borrar")) {
    if (!confirm("¿Seguro que quieres borrar este bloque?")) return;

    try {
      const res = await fetch(`${API_BASE}/bloques/${id}`, {
        method: "DELETE",
        headers: { Authorization: "Bearer " + token }
      });

      if (!res.ok) {
        const error = await res.json();
        showToast(error.error || "Error al borrar bloque", "error");
        return;
      }

      showToast("Bloque borrado correctamente", "success");
      cargarBloques(paginaActualSlug);

    } catch (err) {
      showToast("Error de conexión", "error");
    }
  }

  if (e.target.classList.contains("bloque-arriba")) {
    await moverBloque(id, -1);
  }

  if (e.target.classList.contains("bloque-abajo")) {
    await moverBloque(id, 1);
  }
});

// Event listener para guardar texto automáticamente
bloquesLista.addEventListener("input", async (e) => {
  if (e.target.classList.contains("bloque-texto")) {
    const id = e.target.dataset.id;
    const contenido = e.target.value;

    try {
      const res = await fetch(`${API_BASE}/bloques/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token
        },
        body: JSON.stringify({ contenido })
      });

      if (!res.ok) {
        const error = await res.json();
        console.error("Error al guardar texto:", error);
      }

    } catch (err) {
      console.error("Error de conexión al guardar texto:", err);
    }
  }
});

// Función para cargar bloques
async function cargarBloques(slug) {
  if (!slug) return;

  try {
    const res = await fetch(`${API_BASE}/paginas/${slug}/bloques`);
    const data = await res.json();

    if (!Array.isArray(data)) {
      bloquesLista.innerHTML = "<p style='color:#a1a3b3;font-size:0.85rem;'>Error al cargar bloques</p>";
      return;
    }

    bloques = data;
    renderBloques();

  } catch (err) {
    bloquesLista.innerHTML = "<p style='color:#a1a3b3;font-size:0.85rem;'>Error de conexión</p>";
    console.error("Error cargando bloques:", err);
  }
}

// Función para renderizar bloques
function renderBloques() {
  if (bloques.length === 0) {
    bloquesLista.innerHTML = "<p style='color:#a1a3b3;font-size:0.85rem;'>No hay bloques. Añade texto o imágenes para empezar.</p>";
    return;
  }

  bloquesLista.innerHTML = "";

  bloques.forEach((bloque, index) => {
    const div = document.createElement("div");
    div.className = "bloque-item";
    div.style.cssText = `
      border: 1px solid #334155;
      padding: 0.75rem;
      margin-bottom: 0.75rem;
      border-radius: 0.5rem;
      background: rgba(15, 23, 42, 0.9);
    `;

    const contenidoHtml = bloque.tipo === "texto" 
      ? `<textarea 
          data-id="${bloque.id}" 
          class="bloque-texto" 
          style="width: 100%; min-height: 80px; padding: 0.5rem; border: 1px solid #272938; border-radius: 0.25rem; background: #11131b; color: #f5f5f7; resize: vertical; font-family: inherit;"
          placeholder="Escribe tu texto aquí..."
        >${bloque.contenido}</textarea>`
      : `<div style="margin-bottom: 0.5rem;">
          <img src="${bloque.contenido}" style="max-width: 200px; max-height: 150px; border-radius: 0.25rem;" alt="Imagen">
          <div style="margin-top: 0.5rem;">
            <input 
              type="text" 
              data-id="${bloque.id}" 
              class="bloque-imagen-url" 
              value="${bloque.contenido}"
              style="width: 100%; padding: 0.25rem; border: 1px solid #272938; border-radius: 0.25rem; background: #11131b; color: #f5f5f7; font-size: 0.8rem;"
              placeholder="URL de la imagen"
            >
          </div>
        </div>`;

    div.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
        <div style="font-weight: 500; color: #e5e7eb;">
          ${bloque.tipo === "texto" ? "📝 Texto" : "🖼️ Imagen"}
        </div>
        <div style="display: flex; gap: 0.25rem;">
          <button class="bloque-arriba" data-id="${bloque.id}" style="padding: 0.25rem 0.5rem; border: 1px solid #272938; background: #11131b; color: #f5f5f7; border-radius: 0.25rem; cursor: pointer; font-size: 0.7rem;">↑</button>
          <button class="bloque-abajo" data-id="${bloque.id}" style="padding: 0.25rem 0.5rem; border: 1px solid #272938; background: #11131b; color: #f5f5f7; border-radius: 0.25rem; cursor: pointer; font-size: 0.7rem;">↓</button>
          <button class="bloque-borrar" data-id="${bloque.id}" style="padding: 0.25rem 0.5rem; border: 1px solid #dc2626; background: #dc2626; color: #ffffff; border-radius: 0.25rem; cursor: pointer; font-size: 0.7rem;">✕</button>
        </div>
      </div>
      <div>
        ${contenidoHtml}
      </div>
    `;

    bloquesLista.appendChild(div);
  });

  // Agregar event listeners para URLs de imágenes
  document.querySelectorAll(".bloque-imagen-url").forEach(input => {
    input.addEventListener("blur", async (e) => {
      const id = e.target.dataset.id;
      const url = e.target.value;

      try {
        const res = await fetch(`${API_BASE}/bloques/${id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + token
          },
          body: JSON.stringify({ contenido: url })
        });

        if (!res.ok) {
          const error = await res.json();
          console.error("Error al actualizar imagen:", error);
          return;
        }

        // Recargar bloques para actualizar la imagen
        cargarBloques(paginaActualSlug);

      } catch (err) {
        console.error("Error de conexión al actualizar imagen:", err);
      }
    });
  });
}

// Función para mover bloques
async function moverBloque(id, direccion) {
  const bloqueIndex = bloques.findIndex(b => b.id == id);
  if (bloqueIndex === -1) return;

  const nuevoOrden = bloqueIndex + direccion;
  
  if (nuevoOrden < 0 || nuevoOrden >= bloques.length) return;

  // Intercambiar órdenes
  const bloqueActual = bloques[bloqueIndex];
  const bloqueVecino = bloques[nuevoOrden];

  try {
    // Actualizar orden del bloque actual
    await fetch(`${API_BASE}/bloques/${id}/orden`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token
      },
      body: JSON.stringify({ orden: nuevoOrden })
    });

    // Actualizar orden del bloque vecino
    await fetch(`${API_BASE}/bloques/${bloqueVecino.id}/orden`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token
      },
      body: JSON.stringify({ orden: bloqueIndex })
    });

    // Recargar bloques para reflejar cambios
    await cargarBloques(paginaActualSlug);

  } catch (err) {
    showToast("Error al mover bloque", "error");
    console.error("Error moviendo bloque:", err);
  }
}

// Función para actualizar la página actual cuando se selecciona
function actualizarPaginaActual(slug) {
  paginaActualSlug = slug;
  if (slug) {
    cargarBloques(slug);
  } else {
    bloquesLista.innerHTML = "<p style='color:#a1a3b3;font-size:0.85rem;'>Selecciona una página para gestionar sus bloques</p>";
  }
}

// Exportar función para uso en pages-management.js
if (typeof window !== 'undefined') {
  window.actualizarPaginaActual = actualizarPaginaActual;
}
