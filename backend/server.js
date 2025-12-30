const express = require("express");
const path = require("path");
const app = express();

// Middleware para JSON y form data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, "../tienda")));

// ================================
// DATOS DE PRUEBA (en memoria)
// ================================

let productos = [
  { id: 1, nombre: "Laptop Pro", precio: 999.99, stock: 10, imagen: "/uploads/laptop.jpg", categoria: "Electrónica", subcategoria: "Laptops", en_oferta: false, precio_oferta: null },
  { id: 2, nombre: "Mouse Gamer", precio: 29.99, stock: 25, imagen: "/uploads/mouse.jpg", categoria: "Electrónica", subcategoria: "Accesorios", en_oferta: true, precio_oferta: 19.99 },
  { id: 3, nombre: "Camiseta Nike", precio: 39.99, stock: 5, imagen: "/uploads/camiseta.jpg", categoria: "Ropa", subcategoria: "Camisetas", en_oferta: false, precio_oferta: null }
];

let paginas = [
  { id: 1, slug: "sobre-nosotros", titulo: "Sobre Nosotros", contenido: "<p>Somos una empresa dedicada a...</p>", visible: 1 },
  { id: 2, slug: "contacto", titulo: "Contacto", contenido: "<p>Teléfono: 123-456-789</p>", visible: 1 }
];

let bloques = [
  { id: 1, pagina_slug: "sobre-nosotros", tipo: "texto", contenido: "<h2>Nuestra Historia</h2><p>Fundada en 2020...</p>", orden: 1 },
  { id: 2, pagina_slug: "sobre-nosotros", tipo: "imagen", contenido: "/uploads/nosotros.jpg", orden: 2 }
];

let categorias = [
  { id: 1, nombre: "Electrónica", slug: "electronica", visible: 1 },
  { id: 2, nombre: "Ropa", slug: "ropa", visible: 1 },
  { id: 3, nombre: "Hogar", slug: "hogar", visible: 1 }
];

let subcategorias = [
  { id: 1, categoria_id: 1, nombre: "Laptops", slug: "laptops", visible: 1 },
  { id: 2, categoria_id: 1, nombre: "Accesorios", slug: "accesorios", visible: 1 },
  { id: 3, categoria_id: 2, nombre: "Camisetas", slug: "camisetas", visible: 1 }
];

let banner = {
  id: 1,
  texto: "Bienvenido a nuestra tienda",
  color_fondo: "#1d4ed8",
  color_texto: "#ffffff",
  visible: 1
};

let nextId = {
  productos: 4,
  paginas: 3,
  bloques: 3,
  categorias: 4,
  subcategorias: 4
};

// ================================
// RUTAS DE AUTENTICACIÓN
// ================================

app.post("/api/login", (req, res) => {
  const { username, password } = req.body;
  
  if (username === "admin" && password === "admin123") {
    res.json({
      success: true,
      token: "token-de-prueba-admin",
      user: { id: 1, username: "admin" }
    });
  } else {
    res.status(401).json({
      success: false,
      error: "Credenciales incorrectas"
    });
  }
});

// ================================
// RUTAS DE BANNER
// ================================

app.get("/api/banner", (req, res) => {
  res.json(banner);
});

app.post("/api/banner", (req, res) => {
  const { texto, color_fondo, color_texto, visible } = req.body;
  
  if (texto !== undefined) banner.texto = texto;
  if (color_fondo !== undefined) banner.color_fondo = color_fondo;
  if (color_texto !== undefined) banner.color_texto = color_texto;
  if (visible !== undefined) banner.visible = visible;
  
  res.json({ success: true, banner });
});

// ================================
// RUTAS DE PRODUCTOS
// ================================

app.get("/api/productos", (req, res) => {
  res.json(productos);
});

app.post("/api/productos", (req, res) => {
  const { nombre, precio, stock, categoria, subcategoria, en_oferta, precio_oferta } = req.body;
  
  const nuevoProducto = {
    id: nextId.productos++,
    nombre: nombre || "Producto sin nombre",
    precio: parseFloat(precio) || 0,
    stock: parseInt(stock) || 0,
    imagen: "/uploads/default.jpg",
    categoria: categoria || "Sin categoría",
    subcategoria: subcategoria || "Sin subcategoría",
    en_oferta: en_oferta || false,
    precio_oferta: precio_oferta || null
  };
  
  productos.push(nuevoProducto);
  res.json({ success: true, producto: nuevoProducto });
});

app.put("/api/productos/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const producto = productos.find(p => p.id === id);
  
  if (!producto) {
    return res.status(404).json({ success: false, error: "Producto no encontrado" });
  }
  
  const { nombre, precio, stock, categoria, subcategoria, en_oferta, precio_oferta } = req.body;
  
  if (nombre !== undefined) producto.nombre = nombre;
  if (precio !== undefined) producto.precio = parseFloat(precio);
  if (stock !== undefined) producto.stock = parseInt(stock);
  if (categoria !== undefined) producto.categoria = categoria;
  if (subcategoria !== undefined) producto.subcategoria = subcategoria;
  if (en_oferta !== undefined) producto.en_oferta = en_oferta;
  if (precio_oferta !== undefined) producto.precio_oferta = precio_oferta;
  
  res.json({ success: true, producto });
});

app.delete("/api/productos/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const index = productos.findIndex(p => p.id === id);
  
  if (index === -1) {
    return res.status(404).json({ success: false, error: "Producto no encontrado" });
  }
  
  productos.splice(index, 1);
  res.json({ success: true });
});

// ================================
// RUTAS DE PÁGINAS
// ================================

app.get("/api/paginas", (req, res) => {
  res.json(paginas);
});

app.get("/api/paginas/:slug", (req, res) => {
  const pagina = paginas.find(p => p.slug === req.params.slug);
  
  if (!pagina) {
    return res.status(404).json({ success: false, error: "Página no encontrada" });
  }
  
  res.json(pagina);
});

app.post("/api/paginas", (req, res) => {
  const { slug, titulo, contenido, visible } = req.body;
  
  const nuevaPagina = {
    id: nextId.paginas++,
    slug: slug || `pagina-${Date.now()}`,
    titulo: titulo || "Página sin título",
    contenido: contenido || "",
    visible: visible !== undefined ? visible : 1
  };
  
  paginas.push(nuevaPagina);
  res.json({ success: true, pagina: nuevaPagina });
});

app.post("/api/paginas/:slug", (req, res) => {
  const pagina = paginas.find(p => p.slug === req.params.slug);
  
  if (!pagina) {
    return res.status(404).json({ success: false, error: "Página no encontrada" });
  }
  
  const { titulo, contenido, visible } = req.body;
  
  if (titulo !== undefined) pagina.titulo = titulo;
  if (contenido !== undefined) pagina.contenido = contenido;
  if (visible !== undefined) pagina.visible = visible;
  
  res.json({ success: true, pagina });
});

app.delete("/api/paginas/:slug", (req, res) => {
  const index = paginas.findIndex(p => p.slug === req.params.slug);
  
  if (index === -1) {
    return res.status(404).json({ success: false, error: "Página no encontrada" });
  }
  
  paginas.splice(index, 1);
  
  // También borrar los bloques de esta página
  bloques = bloques.filter(b => b.pagina_slug !== req.params.slug);
  
  res.json({ success: true });
});

// ================================
// RUTAS DE BLOQUES
// ================================

app.get("/api/paginas/:slug/bloques", (req, res) => {
  const bloquesPagina = bloques
    .filter(b => b.pagina_slug === req.params.slug)
    .sort((a, b) => a.orden - b.orden);
  
  res.json(bloquesPagina);
});

app.post("/api/paginas/:slug/bloques", (req, res) => {
  const { tipo, contenido, orden } = req.body;
  
  if (!tipo || !contenido) {
    return res.status(400).json({ success: false, error: "Tipo y contenido son obligatorios" });
  }
  
  const nuevoBloque = {
    id: nextId.bloques++,
    pagina_slug: req.params.slug,
    tipo: tipo,
    contenido: contenido,
    orden: orden || Date.now()
  };
  
  bloques.push(nuevoBloque);
  res.json({ success: true, bloque: nuevoBloque });
});

app.put("/api/bloques/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const bloque = bloques.find(b => b.id === id);
  
  if (!bloque) {
    return res.status(404).json({ success: false, error: "Bloque no encontrado" });
  }
  
  const { contenido, orden } = req.body;
  
  if (contenido !== undefined) bloque.contenido = contenido;
  if (orden !== undefined) bloque.orden = orden;
  
  res.json({ success: true, bloque });
});

app.put("/api/bloques/:id/orden", (req, res) => {
  const id = parseInt(req.params.id);
  const bloque = bloques.find(b => b.id === id);
  
  if (!bloque) {
    return res.status(404).json({ success: false, error: "Bloque no encontrado" });
  }
  
  const { orden } = req.body;
  
  if (orden === undefined) {
    return res.status(400).json({ success: false, error: "Orden es obligatorio" });
  }
  
  bloque.orden = orden;
  res.json({ success: true, bloque });
});

app.delete("/api/bloques/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const index = bloques.findIndex(b => b.id === id);
  
  if (index === -1) {
    return res.status(404).json({ success: false, error: "Bloque no encontrado" });
  }
  
  bloques.splice(index, 1);
  res.json({ success: true });
});

// ================================
// RUTAS DE CATEGORÍAS
// ================================

app.get("/api/categorias", (req, res) => {
  res.json(categorias);
});

app.post("/api/categorias", (req, res) => {
  const { nombre, slug, visible } = req.body;
  
  const nuevaCategoria = {
    id: nextId.categorias++,
    nombre: nombre || "Categoría sin nombre",
    slug: slug || `categoria-${Date.now()}`,
    visible: visible !== undefined ? visible : 1
  };
  
  categorias.push(nuevaCategoria);
  res.json({ success: true, categoria: nuevaCategoria });
});

app.put("/api/categorias/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const categoria = categorias.find(c => c.id === id);
  
  if (!categoria) {
    return res.status(404).json({ success: false, error: "Categoría no encontrada" });
  }
  
  const { nombre, slug, visible } = req.body;
  
  if (nombre !== undefined) categoria.nombre = nombre;
  if (slug !== undefined) categoria.slug = slug;
  if (visible !== undefined) categoria.visible = visible;
  
  res.json({ success: true, categoria });
});

app.delete("/api/categorias/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const index = categorias.findIndex(c => c.id === id);
  
  if (index === -1) {
    return res.status(404).json({ success: false, error: "Categoría no encontrada" });
  }
  
  categorias.splice(index, 1);
  res.json({ success: true });
});

// ================================
// RUTAS DE SUBCATEGORÍAS
// ================================

app.get("/api/subcategorias", (req, res) => {
  const categoria_id = req.query.categoria_id;
  
  if (categoria_id) {
    const filtradas = subcategorias.filter(s => s.categoria_id == categoria_id);
    res.json(filtradas);
  } else {
    res.json(subcategorias);
  }
});

app.post("/api/subcategorias", (req, res) => {
  const { categoria_id, nombre, slug, visible } = req.body;
  
  if (!categoria_id) {
    return res.status(400).json({ success: false, error: "categoria_id es obligatorio" });
  }
  
  const nuevaSubcategoria = {
    id: nextId.subcategorias++,
    categoria_id: parseInt(categoria_id),
    nombre: nombre || "Subcategoría sin nombre",
    slug: slug || `subcategoria-${Date.now()}`,
    visible: visible !== undefined ? visible : 1
  };
  
  subcategorias.push(nuevaSubcategoria);
  res.json({ success: true, subcategoria: nuevaSubcategoria });
});

app.put("/api/subcategorias/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const subcategoria = subcategorias.find(s => s.id === id);
  
  if (!subcategoria) {
    return res.status(404).json({ success: false, error: "Subcategoría no encontrada" });
  }
  
  const { categoria_id, nombre, slug, visible } = req.body;
  
  if (categoria_id !== undefined) subcategoria.categoria_id = parseInt(categoria_id);
  if (nombre !== undefined) subcategoria.nombre = nombre;
  if (slug !== undefined) subcategoria.slug = slug;
  if (visible !== undefined) subcategoria.visible = visible;
  
  res.json({ success: true, subcategoria });
});

app.delete("/api/subcategorias/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const index = subcategorias.findIndex(s => s.id === id);
  
  if (index === -1) {
    return res.status(404).json({ success: false, error: "Subcategoría no encontrada" });
  }
  
  subcategorias.splice(index, 1);
  res.json({ success: true });
});

// ================================
// RUTAS DE PÁGINAS ESTÁTICAS (para compatibilidad)
// ================================

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../tienda/frontend/pagina.html"));
});

app.get("/admin/productos", (req, res) => {
  res.sendFile(path.join(__dirname, "../tienda/admin/productos.html"));
});

app.get("/tienda/productos.html", (req, res) => {
  res.sendFile(path.join(__dirname, "../tienda/frontend/productos.html"));
});

app.get("/admin/login", (req, res) => {
  res.sendFile(path.join(__dirname, "../tienda/admin/login.html"));
});

// ================================
// INICIAR SERVIDOR
// ================================

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
  console.log("API endpoints disponibles:");
  console.log("- GET /api/login");
  console.log("- GET /api/banner");
  console.log("- GET /api/productos");
  console.log("- GET /api/paginas");
  console.log("- GET /api/categorias");
  console.log("- GET /api/subcategorias");
  console.log("- Y 20 endpoints más para CRUD completo");
});
