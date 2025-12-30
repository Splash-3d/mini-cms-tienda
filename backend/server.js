const path = require("path");
const fs = require("fs");
const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const multer = require("multer");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || "CAMBIA_ESTO_EN_PRODUCCION";

// Paths
const dbPath = path.join(__dirname, "data", "database.sqlite");
const DB_PATH = dbPath;
const ADMIN_PATH = path.join(__dirname, "..", "tienda", "admin");
const FRONTEND_PATH = path.join(__dirname, "..", "tienda", "frontend");
const UPLOADS_PATH = path.join(__dirname, "data");

// Asegurar carpeta uploads
if (!fs.existsSync(UPLOADS_PATH)) {
  fs.mkdirSync(UPLOADS_PATH, { recursive: true });
}

// DB
const db = new sqlite3.Database(DB_PATH);

// Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Static
app.use("/uploads", express.static(UPLOADS_PATH));
app.use("/admin", express.static(ADMIN_PATH));
app.use("/tienda", express.static(path.join(__dirname, "..", "tienda")));

// Multer para imágenes
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_PATH);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname) || ".jpg";
    cb(null, "prod-" + unique + ext);
  }
});
const upload = multer({ storage });

// Inicializar tablas si no existen
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      usuario TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS productos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      precio REAL NOT NULL,
      stock INTEGER NOT NULL DEFAULT 0,
      imagen TEXT,
      disponible INTEGER NOT NULL DEFAULT 1,
      creado_en TEXT DEFAULT CURRENT_TIMESTAMP,
      categoria_id INTEGER,
      subcategoria_id INTEGER
    )
  `);

  // Añadir columnas de ofertas si no existen
  db.run("ALTER TABLE productos ADD COLUMN en_oferta INTEGER DEFAULT 0", (err) => {
    if (err && !err.message.includes('duplicate column name')) {
      console.log('Columna en_oferta ya existe o error:', err.message);
    }
  });
  
  db.run("ALTER TABLE productos ADD COLUMN precio_oferta REAL", (err) => {
    if (err && !err.message.includes('duplicate column name')) {
      console.log('Columna precio_oferta ya existe o error:', err.message);
    }
  });

  // Añadir columnas de categorías si no existen
  db.run("ALTER TABLE productos ADD COLUMN categoria_id INTEGER", (err) => {
    if (err && !err.message.includes('duplicate column name')) {
      console.log('Columna categoria_id ya existe o error:', err.message);
    }
  });
  
  db.run("ALTER TABLE productos ADD COLUMN subcategoria_id INTEGER", (err) => {
    if (err && !err.message.includes('duplicate column name')) {
      console.log('Columna subcategoria_id ya existe o error:', err.message);
    }
  });

  // Tabla del banner
  db.run(`
    CREATE TABLE IF NOT EXISTS banner (
      id INTEGER PRIMARY KEY,
      texto TEXT,
      color_fondo TEXT,
      color_texto TEXT,
      visible INTEGER DEFAULT 1
    )
  `);

  // Tabla de páginas
  db.run(`
    CREATE TABLE IF NOT EXISTS paginas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT UNIQUE,
      titulo TEXT,
      contenido TEXT,
      visible INTEGER DEFAULT 1
    )
  `);

  // Tabla de bloques de página
  db.run(`
    CREATE TABLE IF NOT EXISTS pagina_bloques (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pagina_slug TEXT,
      tipo TEXT,              -- "texto" o "imagen"
      contenido TEXT,         -- texto o URL de imagen
      orden INTEGER,
      FOREIGN KEY(pagina_slug) REFERENCES paginas(slug)
    )
  `);

  // Tabla de categorías
  db.run(`
    CREATE TABLE IF NOT EXISTS categorias (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      slug TEXT UNIQUE,
      visible INTEGER DEFAULT 1
    )
  `);

  // Tabla de subcategorías
  db.run(`
    CREATE TABLE IF NOT EXISTS subcategorias (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      categoria_id INTEGER,
      nombre TEXT NOT NULL,
      slug TEXT UNIQUE,
      visible INTEGER DEFAULT 1,
      FOREIGN KEY(categoria_id) REFERENCES categorias(id)
    )
  `);

  // Insertar banner por defecto si no existe
  db.get("SELECT COUNT(*) as c FROM banner", (err, row) => {
    if (row.c === 0) {
      db.run(`
        INSERT INTO banner (id, texto, color_fondo, color_texto, visible)
        VALUES (1, 'Bienvenido a nuestra tienda', '#1d4ed8', '#ffffff', 1)
      `);
    }
  });

  // Insertar páginas por defecto si no existen
  db.get("SELECT COUNT(*) as c FROM paginas", (err, row) => {
    if (row.c === 0) {
      db.run(`
        INSERT INTO paginas (slug, titulo, contenido, visible)
        VALUES
        ('sobre-nosotros', 'Sobre nosotros', '<p>Contenido editable sobre nuestra empresa...</p>', 1),
        ('envios', 'Política de envíos', '<p>Contenido editable sobre política de envíos...</p>', 1),
        ('terminos', 'Términos y condiciones', '<p>Contenido editable sobre términos y condiciones...</p>', 1)
      `);
    }
  });

  // Insertar categorías por defecto si no existen
  db.get("SELECT COUNT(*) as c FROM categorias", (err, row) => {
    if (row.c === 0) {
      db.run(`
        INSERT INTO categorias (nombre, slug, visible)
        VALUES
        ('Electrónica', 'electronica', 1),
        ('Ropa', 'ropa', 1),
        ('Hogar', 'hogar', 1),
        ('Deportes', 'deportes', 1),
        ('Libros', 'libros', 1)
      `);
    }
  });

  // Insertar subcategorías por defecto si no existen
  db.get("SELECT COUNT(*) as c FROM subcategorias", (err, row) => {
    if (row.c === 0) {
      db.run(`
        INSERT INTO subcategorias (categoria_id, nombre, slug, visible)
        VALUES
        (1, 'Smartphones', 'smartphones', 1),
        (1, 'Laptops', 'laptops', 1),
        (1, 'Accesorios', 'accesorios-electronica', 1),
        (2, 'Camisetas', 'camisetas', 1),
        (2, 'Pantalones', 'pantalones', 1),
        (2, 'Calzado', 'calzado', 1),
        (3, 'Cocina', 'cocina', 1),
        (3, 'Decoración', 'decoracion', 1),
        (4, 'Fitness', 'fitness', 1),
        (4, 'Outdoor', 'outdoor', 1),
        (5, 'Ficción', 'ficcion', 1),
        (5, 'No ficción', 'no-ficcion', 1)
      `);
    }
  });

  // Crear usuario admin por defecto si no existe
  db.get("SELECT COUNT(*) as c FROM usuarios", (err, row) => {
    if (row.c === 0) {
      const username = "admin";
      const password = "admin123"; // cámbialo en producción
      const hash = bcrypt.hashSync(password, 10);
      db.run(
        "INSERT INTO usuarios (usuario, password_hash) VALUES (?, ?)",
        [username, hash]
      );
      console.log("Usuario admin creado: admin / admin123");
    }
  });
});

// Middleware auth
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Token necesario" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: "Token inválido" });
  }
}

// Rutas básicas
app.get("/", (req, res) => {
  res.redirect("/tienda/productos.html");
});

app.get("/admin-panel", (req, res) => {
  res.redirect("/admin/login.html");
});

// Login
app.post("/api/login", (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password)
    return res.status(400).json({ error: "Usuario y contraseña obligatorios" });

  db.get("SELECT * FROM usuarios WHERE usuario = ?", [username], (err, user) => {
    if (!user) return res.status(401).json({ error: "Credenciales incorrectas" });

    const match = bcrypt.compareSync(password, user.password_hash);
    if (!match) return res.status(401).json({ error: "Credenciales incorrectas" });

    const token = jwt.sign(
      { id: user.id, usuario: user.usuario },
      JWT_SECRET,
      { expiresIn: "8h" }
    );

    res.json({ token });
  });
});

// Listar productos (público)
app.get("/api/productos", (req, res) => {
  const soloDisponibles = req.query.disponibles === "1";
  const sql = soloDisponibles
    ? "SELECT * FROM productos WHERE disponible = 1 ORDER BY creado_en DESC"
    : "SELECT * FROM productos ORDER BY creado_en DESC";

  db.all(sql, [], (err, rows) => {
    if (err) return res.status(500).json({ error: "Error interno" });
    res.json(rows);
  });
});

// Crear producto
app.post("/api/productos", authMiddleware, upload.single("imagen"), (req, res) => {
  const { nombre, precio, stock, disponible, en_oferta, precio_oferta, categoria_id, subcategoria_id } = req.body || {};
  if (!nombre || precio === undefined || stock === undefined)
    return res.status(400).json({ error: "Faltan campos obligatorios" });

  const precioNum = Number(precio);
  const stockNum = Number(stock);
  if (!isFinite(precioNum) || precioNum <= 0)
    return res.status(400).json({ error: "Precio inválido" });
  if (!Number.isInteger(stockNum) || stockNum < 0)
    return res.status(400).json({ error: "Stock inválido" });

  const disponibleVal = disponible === "0" ? 0 : 1;
  const enOfertaVal = en_oferta === "1" ? 1 : 0;
  const precioOfertaVal = precio_oferta && precio_oferta !== "" ? Number(precio_oferta) : null;
  const categoriaIdVal = categoria_id ? Number(categoria_id) : null;
  const subcategoriaIdVal = subcategoria_id ? Number(subcategoria_id) : null;
  const imagen = req.file ? "/uploads/" + req.file.filename : null;

  db.run(
    `INSERT INTO productos (nombre, precio, stock, imagen, disponible, en_oferta, precio_oferta, categoria_id, subcategoria_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [nombre, precioNum, stockNum, imagen, disponibleVal, enOfertaVal, precioOfertaVal, categoriaIdVal, subcategoriaIdVal],
    function (err) {
      if (err) return res.status(500).json({ error: "Error interno" });

      res.status(201).json({
        id: this.lastID,
        nombre,
        precio: precioNum,
        stock: stockNum,
        imagen,
        disponible: disponibleVal,
        en_oferta: enOfertaVal,
        precio_oferta: precioOfertaVal,
        categoria_id: categoriaIdVal,
        subcategoria_id: subcategoriaIdVal
      });
    }
  );
});

// Actualizar producto
app.put("/api/productos/:id", authMiddleware, upload.single("imagen"), (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ error: "ID inválido" });

  const { nombre, precio, stock, disponible, imagenActual, en_oferta, precio_oferta, categoria_id, subcategoria_id } = req.body || {};
  if (!nombre || precio === undefined || stock === undefined)
    return res.status(400).json({ error: "Faltan campos obligatorios" });

  const precioNum = Number(precio);
  const stockNum = Number(stock);
  if (!isFinite(precioNum) || precioNum <= 0)
    return res.status(400).json({ error: "Precio inválido" });
  if (!Number.isInteger(stockNum) || stockNum < 0)
    return res.status(400).json({ error: "Stock inválido" });

  const disponibleVal = disponible === "0" ? 0 : 1;
  const enOfertaVal = en_oferta === "1" ? 1 : 0;
  const precioOfertaVal = precio_oferta && precio_oferta !== "" ? Number(precio_oferta) : null;
  const categoriaIdVal = categoria_id ? Number(categoria_id) : null;
  const subcategoriaIdVal = subcategoria_id ? Number(subcategoria_id) : null;
  const nuevaImagen = req.file ? "/uploads/" + req.file.filename : imagenActual || null;

  db.run(
    `UPDATE productos
     SET nombre=?, precio=?, stock=?, imagen=?, disponible=?, en_oferta=?, precio_oferta=?, categoria_id=?, subcategoria_id=?
     WHERE id=?`,
    [nombre, precioNum, stockNum, nuevaImagen, disponibleVal, enOfertaVal, precioOfertaVal, categoriaIdVal, subcategoriaIdVal, id],
    function (err) {
      if (err) return res.status(500).json({ error: "Error interno" });
      if (this.changes === 0) return res.status(404).json({ error: "No encontrado" });

      res.json({
        id,
        nombre,
        precio: precioNum,
        stock: stockNum,
        imagen: nuevaImagen,
        disponible: disponibleVal,
        en_oferta: enOfertaVal,
        precio_oferta: precioOfertaVal,
        categoria_id: categoriaIdVal,
        subcategoria_id: subcategoriaIdVal
      });
    }
  );
});

// Borrar producto
app.delete("/api/productos/:id", authMiddleware, (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ error: "ID inválido" });

  db.run("DELETE FROM productos WHERE id=?", [id], function (err) {
    if (err) return res.status(500).json({ error: "Error interno" });
    if (this.changes === 0) return res.status(404).json({ error: "No encontrado" });

    res.json({ ok: true });
  });
});

// -------------------------------
// ENDPOINTS DEL BANNER
// -------------------------------

// Obtener banner
app.get("/api/banner", (req, res) => {
  db.get("SELECT * FROM banner WHERE id = 1", (err, row) => {
    if (err) return res.status(500).json({ error: "Error al obtener banner" });
    res.json(row);
  });
});

// Actualizar banner
app.post("/api/banner", authMiddleware, (req, res) => {
  const { texto, color_fondo, color_texto, visible } = req.body;
  db.run(
    "UPDATE banner SET texto=?, color_fondo=?, color_texto=?, visible=? WHERE id=1",
    [texto, color_fondo, color_texto, visible],
    function (err) {
      if (err) return res.status(500).json({ error: "Error al actualizar banner" });
      res.json({ success: true });
    }
  );
});

// -------------------------------
// ENDPOINTS DE PÁGINAS
// -------------------------------

// Obtener todas las páginas
app.get("/api/paginas", (req, res) => {
  db.all("SELECT * FROM paginas", (err, rows) => {
    if (err) return res.status(500).json({ error: "Error al obtener páginas" });
    res.json(rows);
  });
});

// Obtener una página por slug
app.get("/api/paginas/:slug", (req, res) => {
  db.get("SELECT * FROM paginas WHERE slug = ?", [req.params.slug], (err, row) => {
    if (err) return res.status(500).json({ error: "Error al obtener página" });
    if (!row) return res.status(404).json({ error: "Página no encontrada" });
    res.json(row);
  });
});

// Actualizar una página
app.post("/api/paginas/:slug", authMiddleware, (req, res) => {
  const { titulo, contenido, visible } = req.body;
  db.run(
    "UPDATE paginas SET titulo=?, contenido=?, visible=? WHERE slug=?",
    [titulo, contenido, visible, req.params.slug],
    function (err) {
      if (err) return res.status(500).json({ error: "Error al actualizar página" });
      if (this.changes === 0) return res.status(404).json({ error: "Página no encontrada" });
      res.json({ success: true });
    }
  );
});

// Crear nueva página
app.post("/api/paginas", authMiddleware, (req, res) => {
  const { slug, titulo, contenido, visible } = req.body;
  
  if (!slug || !titulo) {
    return res.status(400).json({ error: "Slug y título son obligatorios" });
  }

  db.run(
    "INSERT INTO paginas (slug, titulo, contenido, visible) VALUES (?,?,?,?)",
    [slug, titulo, contenido, visible],
    function (err) {
      if (err) return res.status(500).json({ error: "Error al crear página" });
      res.json({ success: true, id: this.lastID });
    }
  );
});

// Borrar página
app.delete("/api/paginas/:slug", authMiddleware, (req, res) => {
  db.run(
    "DELETE FROM paginas WHERE slug = ?",
    [req.params.slug],
    function (err) {
      if (err) return res.status(500).json({ error: "Error al borrar página" });
      res.json({ success: true });
    }
  );
});

// -------------------------------
// ENDPOINTS DE BLOQUES DE PÁGINA
// -------------------------------

// Obtener bloques de una página
app.get("/api/paginas/:slug/bloques", (req, res) => {
  db.all(
    "SELECT * FROM pagina_bloques WHERE pagina_slug = ? ORDER BY orden ASC",
    [req.params.slug],
    (err, rows) => {
      if (err) return res.status(500).json({ error: "Error al obtener bloques" });
      res.json(rows);
    }
  );
});

// Crear bloque
app.post("/api/paginas/:slug/bloques", authMiddleware, (req, res) => {
  const { tipo, contenido, orden } = req.body;

  if (!tipo || !contenido) {
    return res.status(400).json({ error: "Tipo y contenido son obligatorios" });
  }

  if (!["texto", "imagen"].includes(tipo)) {
    return res.status(400).json({ error: "Tipo debe ser 'texto' o 'imagen'" });
  }

  const ordenFinal = orden || Date.now();

  db.run(
    "INSERT INTO pagina_bloques (pagina_slug, tipo, contenido, orden) VALUES (?,?,?,?)",
    [req.params.slug, tipo, contenido, ordenFinal],
    function (err) {
      if (err) return res.status(500).json({ error: "Error al crear bloque" });
      res.json({ success: true, id: this.lastID });
    }
  );
});

// Borrar bloque
app.delete("/api/bloques/:id", authMiddleware, (req, res) => {
  db.run(
    "DELETE FROM pagina_bloques WHERE id = ?",
    [req.params.id],
    function (err) {
      if (err) return res.status(500).json({ error: "Error al borrar bloque" });
      res.json({ success: true });
    }
  );
});

// Actualizar orden de bloque
app.put("/api/bloques/:id/orden", authMiddleware, (req, res) => {
  const { orden } = req.body;

  if (orden === undefined || orden === null) {
    return res.status(400).json({ error: "Orden es obligatorio" });
  }

  db.run(
    "UPDATE pagina_bloques SET orden = ? WHERE id = ?",
    [orden, req.params.id],
    function (err) {
      if (err) return res.status(500).json({ error: "Error al actualizar orden" });
      res.json({ success: true });
    }
  );
});

// Actualizar contenido de bloque
app.put("/api/bloques/:id", authMiddleware, (req, res) => {
  const { contenido } = req.body;

  if (contenido === undefined || contenido === null) {
    return res.status(400).json({ error: "Contenido es obligatorio" });
  }

  db.run(
    "UPDATE pagina_bloques SET contenido = ? WHERE id = ?",
    [contenido, req.params.id],
    function (err) {
      if (err) return res.status(500).json({ error: "Error al actualizar contenido" });
      res.json({ success: true });
    }
  );
});

// Obtener todas las categorías
app.get("/api/categorias", (req, res) => {
  db.all("SELECT * FROM categorias WHERE visible = 1 ORDER BY nombre", (err, rows) => {
    if (err) return res.status(500).json({ error: "Error al obtener categorías" });
    res.json(rows);
  });
});

// Obtener subcategorías por categoría
app.get("/api/subcategorias", (req, res) => {
  const categoriaId = req.query.categoria_id;
  let sql = "SELECT * FROM subcategorias WHERE visible = 1";
  let params = [];
  
  if (categoriaId) {
    sql += " AND categoria_id = ?";
    params.push(categoriaId);
  }
  
  sql += " ORDER BY nombre";
  
  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: "Error al obtener subcategorías" });
    res.json(rows);
  });
});

// Crear categoría
app.post("/api/categorias", authMiddleware, (req, res) => {
  const { nombre, slug, visible } = req.body;
  if (!nombre) return res.status(400).json({ error: "El nombre es obligatorio" });

  const slugFinal = slug || nombre.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  const visibleVal = visible !== undefined ? visible : 1;

  db.run(
    "INSERT INTO categorias (nombre, slug, visible) VALUES (?, ?, ?)",
    [nombre, slugFinal, visibleVal],
    function (err) {
      if (err) return res.status(500).json({ error: "Error interno" });
      res.status(201).json({
        id: this.lastID,
        nombre,
        slug: slugFinal,
        visible: visibleVal
      });
    }
  );
});

// Actualizar categoría
app.put("/api/categorias/:id", authMiddleware, (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ error: "ID inválido" });

  const { nombre, slug, visible } = req.body;
  if (!nombre) return res.status(400).json({ error: "El nombre es obligatorio" });

  const slugFinal = slug || nombre.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

  db.run(
    "UPDATE categorias SET nombre=?, slug=?, visible=? WHERE id=?",
    [nombre, slugFinal, visible, id],
    function (err) {
      if (err) return res.status(500).json({ error: "Error interno" });
      if (this.changes === 0) return res.status(404).json({ error: "Categoría no encontrada" });
      res.json({ success: true });
    }
  );
});

// Borrar categoría
app.delete("/api/categorias/:id", authMiddleware, (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ error: "ID inválido" });

  db.run("DELETE FROM categorias WHERE id=?", [id], function (err) {
    if (err) return res.status(500).json({ error: "Error interno" });
    if (this.changes === 0) return res.status(404).json({ error: "Categoría no encontrada" });
    res.json({ ok: true });
  });
});

// Crear subcategoría
app.post("/api/subcategorias", authMiddleware, (req, res) => {
  const { categoria_id, nombre, slug, visible } = req.body;
  if (!nombre || !categoria_id) return res.status(400).json({ error: "El nombre y categoría son obligatorios" });

  const slugFinal = slug || nombre.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  const visibleVal = visible !== undefined ? visible : 1;

  db.run(
    "INSERT INTO subcategorias (categoria_id, nombre, slug, visible) VALUES (?, ?, ?, ?)",
    [categoria_id, nombre, slugFinal, visibleVal],
    function (err) {
      if (err) return res.status(500).json({ error: "Error interno" });
      res.status(201).json({
        id: this.lastID,
        categoria_id,
        nombre,
        slug: slugFinal,
        visible: visibleVal
      });
    }
  );
});

// Actualizar subcategoría
app.put("/api/subcategorias/:id", authMiddleware, (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ error: "ID inválido" });

  const { categoria_id, nombre, slug, visible } = req.body;
  if (!nombre) return res.status(400).json({ error: "El nombre es obligatorio" });

  const slugFinal = slug || nombre.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

  db.run(
    "UPDATE subcategorias SET categoria_id=?, nombre=?, slug=?, visible=? WHERE id=?",
    [categoria_id, nombre, slugFinal, visible, id],
    function (err) {
      if (err) return res.status(500).json({ error: "Error interno" });
      if (this.changes === 0) return res.status(404).json({ error: "Subcategoría no encontrada" });
      res.json({ success: true });
    }
  );
});

// Borrar subcategoría
app.delete("/api/subcategorias/:id", authMiddleware, (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ error: "ID inválido" });

  db.run("DELETE FROM subcategorias WHERE id=?", [id], function (err) {
    if (err) return res.status(500).json({ error: "Error interno" });
  });
});

// Obtener subcategorías por categoría
app.get("/api/subcategorias", (req, res) => {
  const categoriaId = req.query.categoria_id;
  let sql = "SELECT * FROM subcategorias WHERE visible = 1";
  let params = [];
  
  if (categoriaId) {
    sql += " AND categoria_id = ?";
    params.push(categoriaId);
  }
  
  sql += " ORDER BY nombre";
  
  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: "Error al obtener subcategorías" });
    res.json(rows);
  });
});

// Crear categoría
app.post("/api/categorias", authMiddleware, (req, res) => {
  const { nombre, slug, visible } = req.body;
  if (!nombre) return res.status(400).json({ error: "El nombre es obligatorio" });

  const slugFinal = slug || nombre.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  const visibleVal = visible !== undefined ? visible : 1;

  db.run(
    "INSERT INTO categorias (nombre, slug, visible) VALUES (?, ?, ?)",
    [nombre, slugFinal, visibleVal],
    function (err) {
      if (err) return res.status(500).json({ error: "Error interno" });
      res.status(201).json({
        id: this.lastID,
        nombre,
        slug: slugFinal,
        visible: visibleVal
      });
    }
  );
});

// Actualizar categoría
app.put("/api/categorias/:id", authMiddleware, (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ error: "ID inválido" });

  const { nombre, slug, visible } = req.body;
  if (!nombre) return res.status(400).json({ error: "El nombre es obligatorio" });

  const slugFinal = slug || nombre.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

  db.run(
    "UPDATE categorias SET nombre=?, slug=?, visible=? WHERE id=?",
    [nombre, slugFinal, visible, id],
    function (err) {
      if (err) return res.status(500).json({ error: "Error interno" });
      if (this.changes === 0) return res.status(404).json({ error: "Categoría no encontrada" });
      res.json({ success: true });
    }
  );
});

// Borrar categoría
app.delete("/api/categorias/:id", authMiddleware, (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ error: "ID inválido" });

  db.run("DELETE FROM categorias WHERE id=?", [id], function (err) {
    if (err) return res.status(500).json({ error: "Error interno" });
    if (this.changes === 0) return res.status(404).json({ error: "Categoría no encontrada" });
    res.json({ ok: true });
  });
});

// Crear subcategoría
app.post("/api/subcategorias", authMiddleware, (req, res) => {
  const { categoria_id, nombre, slug, visible } = req.body;
  if (!nombre || !categoria_id) return res.status(400).json({ error: "El nombre y categoría son obligatorios" });

  const slugFinal = slug || nombre.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  const visibleVal = visible !== undefined ? visible : 1;

  db.run(
    "INSERT INTO subcategorias (categoria_id, nombre, slug, visible) VALUES (?, ?, ?, ?)",
    [categoria_id, nombre, slugFinal, visibleVal],
    function (err) {
      if (err) return res.status(500).json({ error: "Error interno" });
      res.status(201).json({
        id: this.lastID,
        categoria_id,
        nombre,
        slug: slugFinal,
        visible: visibleVal
      });
    }
  );
});

// Actualizar subcategoría
app.put("/api/subcategorias/:id", authMiddleware, (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ error: "ID inválido" });

  const { categoria_id, nombre, slug, visible } = req.body;
  if (!nombre) return res.status(400).json({ error: "El nombre es obligatorio" });

  const slugFinal = slug || nombre.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

  db.run(
    "UPDATE subcategorias SET categoria_id=?, nombre=?, slug=?, visible=? WHERE id=?",
    [categoria_id, nombre, slugFinal, visible, id],
    function (err) {
      if (err) return res.status(500).json({ error: "Error interno" });
      if (this.changes === 0) return res.status(404).json({ error: "Subcategoría no encontrada" });
      res.json({ success: true });
    }
  );
});

// Borrar subcategoría
app.delete("/api/subcategorias/:id", authMiddleware, (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ error: "ID inválido" });

  db.run("DELETE FROM subcategorias WHERE id=?", [id], function (err) {
    if (err) return res.status(500).json({ error: "Error interno" });
    if (this.changes === 0) return res.status(404).json({ error: "Subcategoría no encontrada" });
    res.json({ ok: true });
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor funcionando en puerto ${PORT}`);
});