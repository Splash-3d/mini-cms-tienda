// -------------------------------
// FUNCIONALIDAD DE CATEGORÍAS
// -------------------------------
const categoriaDrawer = document.getElementById("categoria-drawer");
const categoriaDrawerTitle = document.getElementById("categoria-drawer-title");
const categoriaDrawerClose = document.getElementById("categoria-drawer-close");
const categoriaForm = document.getElementById("categoria-form");
const categoriaNombreInput = document.getElementById("categoria-nombre");
const categoriaVisibleSelect = document.getElementById("categoria-visible");
const categoriaCancelBtn = document.getElementById("categoria-cancel-btn");
const categoriaSaveBtn = document.getElementById("categoria-save-btn");

const subcategoriaDrawer = document.getElementById("subcategoria-drawer");
const subcategoriaDrawerTitle = document.getElementById("subcategoria-drawer-title");
const subcategoriaDrawerClose = document.getElementById("subcategoria-drawer-close");
const subcategoriaForm = document.getElementById("subcategoria-form");
const subcategoriaIdInput = document.getElementById("subcategoria-id");
const subcategoriaCategoriaSelect = document.getElementById("subcategoria-categoria");
const subcategoriaNombreInput = document.getElementById("subcategoria-nombre");
const subcategoriaVisibleSelect = document.getElementById("subcategoria-visible");
const subcategoriaCancelBtn = document.getElementById("subcategoria-cancel-btn");
const subcategoriaSaveBtn = document.getElementById("subcategoria-save-btn");

const nuevaCategoriaBtn = document.getElementById("nueva-categoria-btn");
const nuevaSubcategoriaBtn = document.getElementById("nueva-subcategoria-btn");
const recargarCategoriasBtn = document.getElementById("recargar-categorias");

let categorias = [];
let subcategorias = [];
let categoriaEditando = null;
let subcategoriaEditando = null;

// Event listeners categorías
nuevaCategoriaBtn.addEventListener("click", () => {
  categoriaEditando = null;
  categoriaDrawerTitle.textContent = "Nueva categoría";
  categoriaForm.reset();
  categoriaVisibleSelect.value = "1";
  categoriaDrawer.classList.add("open");
});

categoriaDrawerClose.addEventListener("click", () => {
  categoriaDrawer.classList.remove("open");
});

categoriaCancelBtn.addEventListener("click", () => {
  categoriaDrawer.classList.remove("open");
});

categoriaSaveBtn.addEventListener("click", async () => {
  const nombre = categoriaNombreInput.value.trim();
  const visible = categoriaVisibleSelect.value;

  if (!nombre) {
    showToast("El nombre es obligatorio", "error");
    return;
  }

  const data = { nombre, visible };

  try {
    const url = categoriaEditando 
      ? `${API_BASE}/categorias/${categoriaEditando.id}`
      : `${API_BASE}/categorias`;
    const method = categoriaEditando ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token
      },
      body: JSON.stringify(data)
    });

    if (!res.ok) {
      const error = await res.json();
      showToast(error.error || "Error al guardar categoría", "error");
      return;
    }

    showToast(categoriaEditando ? "Categoría actualizada" : "Categoría creada", "success");
    categoriaDrawer.classList.remove("open");
    cargarCategorias();
    cargarSubcategorias();

  } catch (err) {
    showToast("Error de conexión", "error");
  }
});

// Event listeners subcategorías
nuevaSubcategoriaBtn.addEventListener("click", () => {
  subcategoriaEditando = null;
  subcategoriaDrawerTitle.textContent = "Nueva subcategoría";
  subcategoriaForm.reset();
  subcategoriaVisibleSelect.value = "1";
  cargarCategoriasEnSelect();
  subcategoriaDrawer.classList.add("open");
});

subcategoriaDrawerClose.addEventListener("click", () => {
  subcategoriaDrawer.classList.remove("open");
});

subcategoriaCancelBtn.addEventListener("click", () => {
  subcategoriaDrawer.classList.remove("open");
});

subcategoriaSaveBtn.addEventListener("click", async () => {
  const categoria_id = subcategoriaCategoriaSelect.value;
  const nombre = subcategoriaNombreInput.value.trim();
  const visible = subcategoriaVisibleSelect.value;

  if (!nombre || !categoria_id) {
    showToast("La categoría y nombre son obligatorios", "error");
    return;
  }

  const data = { categoria_id, nombre, visible };

  try {
    const url = subcategoriaEditando 
      ? `${API_BASE}/subcategorias/${subcategoriaEditando.id}`
      : `${API_BASE}/subcategorias`;
    const method = subcategoriaEditando ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token
      },
      body: JSON.stringify(data)
    });

    if (!res.ok) {
      const error = await res.json();
      showToast(error.error || "Error al guardar subcategoría", "error");
      return;
    }

    showToast(subcategoriaEditando ? "Subcategoría actualizada" : "Subcategoría creada", "success");
    subcategoriaDrawer.classList.remove("open");
    cargarCategorias();
    cargarSubcategorias();

  } catch (err) {
    showToast("Error de conexión", "error");
  }
});

recargarCategoriasBtn.addEventListener("click", () => {
  cargarCategorias();
  cargarSubcategorias();
  showToast("Categorías recargadas", "success");
});

// Funciones
async function cargarCategorias() {
  try {
    const res = await fetch(`${API_BASE}/categorias`);
    const data = await res.json();
    
    if (!Array.isArray(data)) {
      showToast("Error al cargar categorías", "error");
      return;
    }

    categorias = data;
    renderCategorias();

  } catch (err) {
    showToast("Error de conexión al cargar categorías", "error");
  }
}

async function cargarSubcategorias() {
  try {
    const res = await fetch(`${API_BASE}/subcategorias`);
    const data = await res.json();
    
    if (!Array.isArray(data)) {
      showToast("Error al cargar subcategorías", "error");
      return;
    }

    subcategorias = data;
    renderSubcategorias();

  } catch (err) {
    showToast("Error de conexión al cargar subcategorías", "error");
  }
}

function renderCategorias() {
  const container = document.getElementById("categorias-list");
  
  if (categorias.length === 0) {
    container.innerHTML = "<p style='color:#a1a3b3;font-size:0.85rem;'>No hay categorías.</p>";
    return;
  }

  container.innerHTML = "";
  
  categorias.forEach(cat => {
    const item = document.createElement("div");
    item.className = "category-item";
    item.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem;
      background: rgba(15, 23, 42, 0.9);
      border: 1px solid rgba(148, 163, 184, 0.5);
      border-radius: 0.5rem;
    `;

    item.innerHTML = `
      <div>
        <div style="font-weight: 500; color: #e5e7eb;">${cat.nombre}</div>
        <div style="font-size: 0.8rem; color: #9ca3af;">Slug: ${cat.slug}</div>
        <div style="font-size: 0.8rem; color: ${cat.visible ? '#4ade80' : '#f97316'};">
          ${cat.visible ? 'Visible' : 'Oculta'}
        </div>
      </div>
      <div style="display: flex; gap: 0.5rem;">
        <button class="btn-secondary" onclick="editarCategoria(${cat.id})">Editar</button>
        <button class="btn-secondary" style="border-color: #ff4b6a; color: #ff9fb1;" 
                onclick="borrarCategoria(${cat.id})">Borrar</button>
      </div>
    `;

    container.appendChild(item);
  });
}

function renderSubcategorias() {
  const container = document.getElementById("subcategorias-list");
  
  if (subcategorias.length === 0) {
    container.innerHTML = "<p style='color:#a1a3b3;font-size:0.85rem;'>No hay subcategorías.</p>";
    return;
  }

  container.innerHTML = "";
  
  subcategorias.forEach(sub => {
    const categoria = categorias.find(c => c.id === sub.categoria_id);
    const item = document.createElement("div");
    item.className = "category-item";
    item.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem;
      background: rgba(15, 23, 42, 0.9);
      border: 1px solid rgba(148, 163, 184, 0.5);
      border-radius: 0.5rem;
    `;

    item.innerHTML = `
      <div>
        <div style="font-weight: 500; color: #e5e7eb;">${sub.nombre}</div>
        <div style="font-size: 0.8rem; color: #9ca3af;">
          Categoría: ${categoria ? categoria.nombre : 'N/A'}
        </div>
        <div style="font-size: 0.8rem; color: #9ca3af;">Slug: ${sub.slug}</div>
        <div style="font-size: 0.8rem; color: ${sub.visible ? '#4ade80' : '#f97316'};">
          ${sub.visible ? 'Visible' : 'Oculta'}
        </div>
      </div>
      <div style="display: flex; gap: 0.5rem;">
        <button class="btn-secondary" onclick="editarSubcategoria(${sub.id})">Editar</button>
        <button class="btn-secondary" style="border-color: #ff4b6a; color: #ff9fb1;" 
                onclick="borrarSubcategoria(${sub.id})">Borrar</button>
      </div>
    `;

    container.appendChild(item);
  });
}

function cargarCategoriasEnSelect() {
  subcategoriaCategoriaSelect.innerHTML = '<option value="">Selecciona una categoría...</option>';
  
  categorias.forEach(cat => {
    const opt = document.createElement("option");
    opt.value = cat.id;
    opt.textContent = cat.nombre;
    subcategoriaCategoriaSelect.appendChild(opt);
  });
}

function editarCategoria(id) {
  const cat = categorias.find(c => c.id === id);
  if (!cat) return;

  categoriaEditando = cat;
  categoriaDrawerTitle.textContent = "Editar categoría";
  categoriaNombreInput.value = cat.nombre;
  categoriaVisibleSelect.value = cat.visible ? "1" : "0";
  categoriaDrawer.classList.add("open");
}

function editarSubcategoria(id) {
  const sub = subcategorias.find(s => s.id === id);
  if (!sub) return;

  subcategoriaEditando = sub;
  subcategoriaDrawerTitle.textContent = "Editar subcategoría";
  subcategoriaIdInput.value = sub.id;
  subcategoriaNombreInput.value = sub.nombre;
  subcategoriaVisibleSelect.value = sub.visible ? "1" : "0";
  
  cargarCategoriasEnSelect();
  subcategoriaCategoriaSelect.value = sub.categoria_id;
  
  subcategoriaDrawer.classList.add("open");
}

async function borrarCategoria(id) {
  if (!confirm("¿Seguro que quieres borrar esta categoría?")) return;

  try {
    const res = await fetch(`${API_BASE}/categorias/${id}`, {
      method: "DELETE",
      headers: { Authorization: "Bearer " + token }
    });

    if (!res.ok) {
      const error = await res.json();
      showToast(error.error || "Error al borrar categoría", "error");
      return;
    }

    showToast("Categoría borrada", "success");
    cargarCategorias();
    cargarSubcategorias();

  } catch (err) {
    showToast("Error de conexión", "error");
  }
}

async function borrarSubcategoria(id) {
  if (!confirm("¿Seguro que quieres borrar esta subcategoría?")) return;

  try {
    const res = await fetch(`${API_BASE}/subcategorias/${id}`, {
      method: "DELETE",
      headers: { Authorization: "Bearer " + token }
    });

    if (!res.ok) {
      const error = await res.json();
      showToast(error.error || "Error al borrar subcategoría", "error");
      return;
    }

    showToast("Subcategoría borrada", "success");
    cargarCategorias();
    cargarSubcategorias();

  } catch (err) {
    showToast("Error de conexión", "error");
  }
}

// Cargar al iniciar si estamos en la sección de categorías
if (document.getElementById('seccion-categorias')) {
  cargarCategorias();
  cargarSubcategorias();
}
