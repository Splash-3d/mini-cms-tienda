// ACTUALIZACIONES NECESARIAS PARA EL FORMULARIO DE PRODUCTOS

// 1. Agregar referencias a los elementos de categoría:
const categoriaIdSelect = document.getElementById("categoria_id");
const subcategoriaIdSelect = document.getElementById("subcategoria_id");

// 2. Agregar en la función editarProducto(p):
categoriaIdSelect.value = p.categoria_id || "";
subcategoriaIdSelect.value = p.subcategoria_id || "";
actualizarSubcategoriasPorCategoria();

// 3. Agregar en la función saveBtn.addEventListener:
const categoria_id = categoriaIdSelect.value || null;
const subcategoria_id = subcategoriaIdSelect.value || null;

// 4. Agregar en el formData:
if (categoria_id) formData.append("categoria_id", categoria_id);
if (subcategoria_id) formData.append("subcategoria_id", subcategoria_id);

// 5. Agregar función para actualizar subcategorías según categoría:
function actualizarSubcategoriasPorCategoria() {
  const categoriaId = categoriaIdSelect.value;
  
  // Limpiar subcategorías
  subcategoriaIdSelect.innerHTML = '<option value="">Selecciona una subcategoría...</option>';
  
  if (!categoriaId) return;
  
  // Cargar subcategorías de la categoría seleccionada
  fetch(`${API_BASE}/subcategorias?categoria_id=${categoriaId}`)
    .then(res => res.json())
    .then(subcategorias => {
      subcategorias.forEach(sub => {
        const opt = document.createElement("option");
        opt.value = sub.id;
        opt.textContent = sub.nombre;
        subcategoriaIdSelect.appendChild(opt);
      });
    })
    .catch(err => console.error("Error cargando subcategorías:", err));
}

// 6. Agregar event listener para cambio de categoría:
categoriaIdSelect.addEventListener("change", actualizarSubcategoriasPorCategoria);

// 7. Agregar en la función cargarProductos() o similar:
// Cargar categorías al iniciar
fetch(`${API_BASE}/categorias`)
  .then(res => res.json())
  .then(categorias => {
    categorias.forEach(cat => {
      const opt = document.createElement("option");
      opt.value = cat.id;
      opt.textContent = cat.nombre;
      categoriaIdSelect.appendChild(opt);
    });
  })
  .catch(err => console.error("Error cargando categorías:", err));
