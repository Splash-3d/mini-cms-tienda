// -------------------------------
// MENÚ DE CATEGORÍAS AUTOMÁTICO
// -------------------------------
async function loadCategoryMenu() {
  try {
    const res = await fetch("/api/categorias");
    const categorias = await res.json();

    const container = document.getElementById("menu-categorias");
    if (!container) return; // No existe el contenedor, salir

    container.innerHTML = "";

    categorias.forEach(cat => {
      const link = document.createElement("a");
      link.href = `/tienda/productos.html?categoria=${cat.slug}`;
      link.textContent = cat.nombre;
      link.className = "menu-category-link";
      container.appendChild(link);
    });

  } catch (err) {
    console.error("Error cargando menú de categorías:", err);
  }
}

// CSS para el menú de categorías (agregar al <style>):
/*
.menu-categorias {
  display: flex;
  gap: 0.75rem;
  margin-left: 1rem;
}

.menu-category-link {
  padding: 0.35rem 0.75rem;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.4);
  background: rgba(15, 23, 42, 0.7);
  color: var(--text-muted);
  font-size: 0.85rem;
  cursor: pointer;
  transition: 0.2s;
  text-decoration: none;
}

.menu-category-link:hover {
  background: rgba(15, 23, 42, 1);
  color: var(--text-main);
  border-color: rgba(248, 250, 252, 0.2);
  transform: translateY(-1px);
}
*/

// Agregar contenedor en el nav (después de menu-paginas):
/*
<div id="menu-categorias" class="menu-categorias"></div>
*/

// Llamar la función al cargar la página:
// loadCategoryMenu();
