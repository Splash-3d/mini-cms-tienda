const express = require("express");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();
const multer = require("multer");
const fs = require("fs");
const bcrypt = require("bcrypt");
const app = express();

// Middleware para JSON y form data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos - carpeta tienda/frontend bajo /tienda
app.use("/tienda", express.static(path.join(__dirname, "../tienda/frontend")));

// Servir archivos estáticos - carpeta admin bajo /admin
app.use("/admin", express.static(path.join(__dirname, "../tienda/admin")));

// Servir carpeta uploads para imágenes
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Asegurar que la carpeta uploads exista
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configuración de Multer para subir imágenes
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Generar nombre único para evitar conflictos
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, "prod-" + uniqueSuffix + ext);
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    // Aceptar solo archivos de imagen
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos de imagen'), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB límite
  }
});

// ================================
// CONEXIÓN A BASE DE DATOS SQLITE
// ================================

const db = new sqlite3.Database(path.join(__dirname, "uploads", "tienda.db"));

// ================================
// RUTA PARA SUBIR IMÁGENES
// ================================

// POST /api/upload - Subir imagen
app.post("/api/upload", upload.single("imagen"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        error: "No se ha subido ninguna imagen" 
      });
    }

    // Devolver el nombre del archivo subido
    res.json({
      success: true,
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype
    });
  } catch (error) {
    console.error("Error al subir imagen:", error);
    res.status(500).json({ 
      success: false, 
      error: "Error al subir la imagen" 
    });
  }
});

// ================================
// RUTAS DE AUTENTICACIÓN
// ================================

app.post("/api/login", (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({
      success: false,
      error: "Usuario y contraseña son obligatorios"
    });
  }
  
  // Consultar usuario en la base de datos
  db.get(
    "SELECT * FROM usuarios WHERE usuario = ?",
    [username],
    (err, row) => {
      if (err) {
        console.error("Error en consulta de usuario:", err);
        return res.status(500).json({
          success: false,
          error: "Error del servidor"
        });
      }
      
      if (!row) {
        return res.status(401).json({
          success: false,
          error: "Usuario no encontrado"
        });
      }
      
      // Validar contraseña usando bcrypt
      console.log("=== DEBUG LOGIN ===");
      console.log("Usuario recibido:", username);
      console.log("Contraseña recibida:", password);
      console.log("Usuario encontrado en BD:", row.usuario);
      console.log("Hash en BD:", row.password_hash);
      
      bcrypt.compare(password, row.password_hash, (err, result) => {
        if (err) {
          console.error("Error al comparar contraseña:", err);
          return res.status(500).json({
            success: false,
            error: "Error del servidor"
          });
        }
        
        console.log("Resultado de bcrypt.compare:", result);
        console.log("=== FIN DEBUG ===");
        
        if (result) {
          // Login correcto
          res.json({
            success: true,
            token: "token-de-prueba-admin",
            user: { 
              id: row.id, 
              username: row.usuario 
            }
          });
        } else {
          // Contraseña incorrecta
          res.status(401).json({
            success: false,
            error: "Credenciales incorrectas"
          });
        }
      });
    }
  );
});

// ================================
// RUTAS DE BANNER
// ================================

// GET /api/banner - Obtener banner
app.get("/api/banner", (req, res) => {
  db.get("SELECT * FROM banner WHERE id = 1", (err, row) => {
    if (err) {
      console.error("Error al obtener banner:", err);
      return res.status(500).json({ success: false, error: "Error del servidor" });
    }
    res.json(row || {});
  });
});

// POST /api/banner - Actualizar banner
app.post("/api/banner", (req, res) => {
  const { texto, color_fondo, color_texto, visible } = req.body;
  
  db.run(
    `UPDATE banner 
     SET texto = COALESCE(?, texto), 
         color_fondo = COALESCE(?, color_fondo), 
         color_texto = COALESCE(?, color_texto), 
         visible = COALESCE(?, visible)
     WHERE id = 1`,
    [texto, color_fondo, color_texto, visible !== undefined ? (visible ? 1 : 0) : undefined],
    function(err) {
      if (err) {
        console.error("Error al actualizar banner:", err);
        return res.status(500).json({ success: false, error: "Error del servidor" });
      }
      
      // Obtener el banner actualizado
      db.get("SELECT * FROM banner WHERE id = 1", (err, row) => {
        if (err) {
          return res.status(500).json({ success: false, error: "Error del servidor" });
        }
        res.json({ success: true, banner: row || {} });
      });
    }
  );
});

// ================================
// RUTAS DE PRODUCTOS
// ================================

// GET /api/productos - Obtener todos los productos
app.get("/api/productos", (req, res) => {
  db.all("SELECT * FROM productos ORDER BY creado_en DESC", (err, rows) => {
    if (err) {
      console.error("Error al obtener productos:", err);
      return res.status(500).json({ success: false, error: "Error del servidor" });
    }
    res.json(rows);
  });
});

// GET /api/productos/:id - Obtener un producto específico
app.get("/api/productos/:id", (req, res) => {
  const { id } = req.params;
  
  db.get("SELECT * FROM productos WHERE id = ?", [id], (err, row) => {
    if (err) {
      console.error("Error al obtener producto:", err);
      return res.status(500).json({ success: false, error: "Error del servidor" });
    }
    
    if (!row) {
      return res.status(404).json({ success: false, error: "Producto no encontrado" });
    }
    
    res.json(row);
  });
});

// POST /api/productos - Agregar nuevo producto
app.post("/api/productos", (req, res) => {
  const { nombre, precio, stock, categoria, subcategoria, en_oferta, precio_oferta, imagen } = req.body;
  
  if (!nombre || !precio) {
    return res.status(400).json({ success: false, error: "Nombre y precio son obligatorios" });
  }
  
  const imagenNombre = imagen ? (imagen.startsWith("/uploads/") ? imagen : `/uploads/${imagen}`) : "/uploads/default.jpg";
  
  db.run(
    `INSERT INTO productos (nombre, precio, stock, imagen, categoria, subcategoria, en_oferta, precio_oferta, creado_en) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
    [nombre, parseFloat(precio), parseInt(stock || 0), imagenNombre, categoria, subcategoria, en_oferta || 0, precio_oferta || null],
    function(err) {
      if (err) {
        console.error("Error al crear producto:", err);
        return res.status(500).json({ success: false, error: "Error del servidor" });
      }
      
      // Obtener el producto creado
      db.get("SELECT * FROM productos WHERE id = ?", [this.lastID], (err, row) => {
        if (err) {
          return res.status(500).json({ success: false, error: "Error del servidor" });
        }
        res.json({ success: true, producto: row });
      });
    }
  );
});

// PUT /api/productos/:id - Editar producto
app.put("/api/productos/:id", upload.single('imagen'), (req, res) => {
  const id = parseInt(req.params.id);
  
  // Obtener datos del FormData
  const nombre = req.body.nombre;
  const precio = req.body.precio;
  const stock = req.body.stock;
  const categoria = req.body.categoria || 'Sin categoría';
  const subcategoria = req.body.subcategoria || '';
  const en_oferta = req.body.en_oferta || '0';
  const precio_oferta = req.body.precio_oferta || null;
  const imagenActual = req.body.imagenActual || '';
  
  console.log("=== DEBUG PUT ===");
  console.log("ID:", id);
  console.log("Nombre:", nombre);
  console.log("Precio:", precio);
  console.log("Stock:", stock);
  console.log("En oferta:", en_oferta);
  console.log("Precio oferta:", precio_oferta);
  console.log("Imagen actual:", imagenActual);
  console.log("Archivo de imagen:", req.file);
  console.log("=== FIN DEBUG PUT ===");
  
  if (!nombre || !precio) {
    console.log("VALIDACIÓN FALLIDA - Nombre o precio vacíos");
    return res.status(400).json({ success: false, error: "Nombre y precio son obligatorios" });
  }
  
  // Construir la ruta de la imagen
  let imagenFinal = imagenActual;
  if (req.file) {
    imagenFinal = `/uploads/${req.file.filename}`;
  } else if (!imagenActual) {
    imagenFinal = "/uploads/default.jpg";
  }
  
  db.run(
    `UPDATE productos 
     SET nombre = ?, precio = ?, stock = ?, categoria = ?, subcategoria = ?, 
         en_oferta = ?, precio_oferta = ?, imagen = COALESCE(?, imagen)
     WHERE id = ?`,
    [nombre, parseFloat(precio), parseInt(stock || 0), categoria, subcategoria, en_oferta === '1' ? 1 : 0, precio_oferta || null, imagenFinal, id],
    function(err) {
      if (err) {
        console.error("Error al actualizar producto:", err);
        return res.status(500).json({ success: false, error: "Error del servidor" });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ success: false, error: "Producto no encontrado" });
      }
      
      // Obtener el producto actualizado
      db.get("SELECT * FROM productos WHERE id = ?", [id], (err, row) => {
        if (err) {
          return res.status(500).json({ success: false, error: "Error del servidor" });
        }
        console.log("Producto actualizado exitosamente:", row);
        res.json({ success: true, producto: row });
      });
    }
  );
});

// DELETE /api/productos/:id - Eliminar producto
app.delete("/api/productos/:id", (req, res) => {
  const id = parseInt(req.params.id);
  
  db.run("DELETE FROM productos WHERE id = ?", [id], function(err) {
    if (err) {
      console.error("Error al eliminar producto:", err);
      return res.status(500).json({ success: false, error: "Error del servidor" });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ success: false, error: "Producto no encontrado" });
    }
    
    res.json({ success: true });
  });
});

// POST /api/productos/eliminar - Eliminar producto (alternativa)
app.post("/api/productos/eliminar", (req, res) => {
  const { id } = req.body;
  
  if (!id) {
    return res.status(400).json({ success: false, error: "ID del producto es obligatorio" });
  }
  
  db.run("DELETE FROM productos WHERE id = ?", [parseInt(id)], function(err) {
    if (err) {
      console.error("Error al eliminar producto:", err);
      return res.status(500).json({ success: false, error: "Error del servidor" });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ success: false, error: "Producto no encontrado" });
    }
    
    res.json({ success: true });
  });
});

// POST /api/productos/editar - Editar producto (alternativa)
app.post("/api/productos/editar", (req, res) => {
  const { id, nombre, precio, stock, categoria, subcategoria, en_oferta, precio_oferta, imagen } = req.body;
  
  if (!id || !nombre || !precio) {
    return res.status(400).json({ success: false, error: "ID, nombre y precio son obligatorios" });
  }
  
  db.run(
    `UPDATE productos 
     SET nombre = ?, precio = ?, stock = ?, categoria = ?, subcategoria = ?, 
         en_oferta = ?, precio_oferta = ?, imagen = COALESCE(?, imagen)
     WHERE id = ?`,
    [nombre, parseFloat(precio), parseInt(stock || 0), categoria, subcategoria, en_oferta || 0, precio_oferta || null, imagen, parseInt(id)],
    function(err) {
      if (err) {
        console.error("Error al actualizar producto:", err);
        return res.status(500).json({ success: false, error: "Error del servidor" });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ success: false, error: "Producto no encontrado" });
      }
      
      // Obtener el producto actualizado
      db.get("SELECT * FROM productos WHERE id = ?", [parseInt(id)], (err, row) => {
        if (err) {
          return res.status(500).json({ success: false, error: "Error del servidor" });
        }
        res.json({ success: true, producto: row });
      });
    }
  );
});

// ================================
// RUTAS DE PÁGINAS
// ================================

// GET /api/paginas - Obtener todas las páginas
app.get("/api/paginas", (req, res) => {
  db.all("SELECT * FROM paginas WHERE visible = 1 ORDER BY titulo", (err, rows) => {
    if (err) {
      console.error("Error al obtener páginas:", err);
      return res.status(500).json({ success: false, error: "Error del servidor" });
    }
    res.json(rows);
  });
});

// GET /api/paginas/:slug - Obtener página específica
app.get("/api/paginas/:slug", (req, res) => {
  db.get("SELECT * FROM paginas WHERE slug = ?", [req.params.slug], (err, row) => {
    if (err) {
      console.error("Error al obtener página:", err);
      return res.status(500).json({ success: false, error: "Error del servidor" });
    }
    
    if (!row) {
      return res.status(404).json({ success: false, error: "Página no encontrada" });
    }
    
    res.json(row);
  });
});

// POST /api/paginas - Crear nueva página
app.post("/api/paginas", (req, res) => {
  const { slug, titulo, contenido, visible } = req.body;
  
  if (!titulo) {
    return res.status(400).json({ success: false, error: "El título es obligatorio" });
  }
  
  const slugFinal = slug || titulo.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  
  db.run(
    "INSERT INTO paginas (slug, titulo, contenido, visible) VALUES (?, ?, ?, ?)",
    [slugFinal, titulo, contenido || "", visible !== undefined ? (visible ? 1 : 0) : 1],
    function(err) {
      if (err) {
        console.error("Error al crear página:", err);
        return res.status(500).json({ success: false, error: "Error del servidor" });
      }
      
      // Obtener la página creada
      db.get("SELECT * FROM paginas WHERE id = ?", [this.lastID], (err, row) => {
        if (err) {
          return res.status(500).json({ success: false, error: "Error del servidor" });
        }
        res.json({ success: true, pagina: row });
      });
    }
  );
});

// POST /api/paginas/:slug - Actualizar página
app.post("/api/paginas/:slug", (req, res) => {
  const { titulo, contenido, visible } = req.body;
  
  db.run(
    "UPDATE paginas SET titulo = COALESCE(?, titulo), contenido = COALESCE(?, contenido), visible = COALESCE(?, visible) WHERE slug = ?",
    [titulo, contenido, visible !== undefined ? (visible ? 1 : 0) : undefined, req.params.slug],
    function(err) {
      if (err) {
        console.error("Error al actualizar página:", err);
        return res.status(500).json({ success: false, error: "Error del servidor" });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ success: false, error: "Página no encontrada" });
      }
      
      // Obtener la página actualizada
      db.get("SELECT * FROM paginas WHERE slug = ?", [req.params.slug], (err, row) => {
        if (err) {
          return res.status(500).json({ success: false, error: "Error del servidor" });
        }
        res.json({ success: true, pagina: row });
      });
    }
  );
});

// DELETE /api/paginas/:slug - Eliminar página
app.delete("/api/paginas/:slug", (req, res) => {
  db.run("DELETE FROM paginas WHERE slug = ?", [req.params.slug], function(err) {
    if (err) {
      console.error("Error al eliminar página:", err);
      return res.status(500).json({ success: false, error: "Error del servidor" });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ success: false, error: "Página no encontrada" });
    }
    
    // También borrar los bloques de esta página
    db.run("DELETE FROM pagina_bloques WHERE pagina_slug = ?", [req.params.slug]);
    
    res.json({ success: true });
  });
});

// ================================
// RUTAS DE BLOQUES
// ================================

// GET /api/paginas/:slug/bloques - Obtener bloques de una página
app.get("/api/paginas/:slug/bloques", (req, res) => {
  db.all(
    "SELECT * FROM pagina_bloques WHERE pagina_slug = ? ORDER BY orden ASC",
    [req.params.slug],
    (err, rows) => {
      if (err) {
        console.error("Error al obtener bloques:", err);
        return res.status(500).json({ success: false, error: "Error del servidor" });
      }
      res.json(rows);
    }
  );
});

// POST /api/paginas/:slug/bloques - Crear nuevo bloque
app.post("/api/paginas/:slug/bloques", (req, res) => {
  const { tipo, contenido, orden } = req.body;
  
  if (!tipo || !contenido) {
    return res.status(400).json({ success: false, error: "Tipo y contenido son obligatorios" });
  }
  
  if (!["texto", "imagen"].includes(tipo)) {
    return res.status(400).json({ success: false, error: "Tipo debe ser 'texto' o 'imagen'" });
  }
  
  const ordenFinal = orden || Date.now();
  
  db.run(
    "INSERT INTO pagina_bloques (pagina_slug, tipo, contenido, orden) VALUES (?, ?, ?, ?)",
    [req.params.slug, tipo, contenido, ordenFinal],
    function(err) {
      if (err) {
        console.error("Error al crear bloque:", err);
        return res.status(500).json({ success: false, error: "Error del servidor" });
      }
      
      // Obtener el bloque creado
      db.get("SELECT * FROM pagina_bloques WHERE id = ?", [this.lastID], (err, row) => {
        if (err) {
          return res.status(500).json({ success: false, error: "Error del servidor" });
        }
        res.json({ success: true, bloque: row });
      });
    }
  );
});

// PUT /api/bloques/:id - Actualizar bloque
app.put("/api/bloques/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const { contenido, orden } = req.body;
  
  if (contenido === undefined && orden === undefined) {
    return res.status(400).json({ success: false, error: "Contenido u orden es obligatorio" });
  }
  
  db.run(
    "UPDATE pagina_bloques SET contenido = COALESCE(?, contenido), orden = COALESCE(?, orden) WHERE id = ?",
    [contenido, orden, id],
    function(err) {
      if (err) {
        console.error("Error al actualizar bloque:", err);
        return res.status(500).json({ success: false, error: "Error del servidor" });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ success: false, error: "Bloque no encontrado" });
      }
      
      // Obtener el bloque actualizado
      db.get("SELECT * FROM pagina_bloques WHERE id = ?", [id], (err, row) => {
        if (err) {
          return res.status(500).json({ success: false, error: "Error del servidor" });
        }
        res.json({ success: true, bloque: row });
      });
    }
  );
});

// PUT /api/bloques/:id/orden - Actualizar orden de bloque
app.put("/api/bloques/:id/orden", (req, res) => {
  const id = parseInt(req.params.id);
  const { orden } = req.body;
  
  if (orden === undefined || orden === null) {
    return res.status(400).json({ success: false, error: "Orden es obligatorio" });
  }
  
  db.run("UPDATE pagina_bloques SET orden = ? WHERE id = ?", [orden, id], function(err) {
    if (err) {
      console.error("Error al actualizar orden:", err);
      return res.status(500).json({ success: false, error: "Error del servidor" });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ success: false, error: "Bloque no encontrado" });
    }
    
    // Obtener el bloque actualizado
    db.get("SELECT * FROM pagina_bloques WHERE id = ?", [id], (err, row) => {
      if (err) {
        return res.status(500).json({ success: false, error: "Error del servidor" });
      }
      res.json({ success: true, bloque: row });
    });
  });
});

// DELETE /api/bloques/:id - Eliminar bloque
app.delete("/api/bloques/:id", (req, res) => {
  const id = parseInt(req.params.id);
  
  db.run("DELETE FROM pagina_bloques WHERE id = ?", [id], function(err) {
    if (err) {
      console.error("Error al eliminar bloque:", err);
      return res.status(500).json({ success: false, error: "Error del servidor" });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ success: false, error: "Bloque no encontrado" });
    }
    
    res.json({ success: true });
  });
});

// ================================
// RUTAS DE CATEGORÍAS
// ================================

// GET /api/categorias - Obtener todas las categorías
app.get("/api/categorias", (req, res) => {
  db.all("SELECT * FROM categorias WHERE visible = 1 ORDER BY nombre", (err, rows) => {
    if (err) {
      console.error("Error al obtener categorías:", err);
      return res.status(500).json({ success: false, error: "Error del servidor" });
    }
    res.json(rows);
  });
});

// POST /api/categorias - Crear nueva categoría
app.post("/api/categorias", (req, res) => {
  const { nombre, slug, visible } = req.body;
  
  if (!nombre) {
    return res.status(400).json({ success: false, error: "El nombre es obligatorio" });
  }
  
  const slugFinal = slug || nombre.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  
  db.run(
    "INSERT INTO categorias (nombre, slug, visible) VALUES (?, ?, ?)",
    [nombre, slugFinal, visible !== undefined ? (visible ? 1 : 0) : 1],
    function(err) {
      if (err) {
        console.error("Error al crear categoría:", err);
        return res.status(500).json({ success: false, error: "Error del servidor" });
      }
      
      // Obtener la categoría creada
      db.get("SELECT * FROM categorias WHERE id = ?", [this.lastID], (err, row) => {
        if (err) {
          return res.status(500).json({ success: false, error: "Error del servidor" });
        }
        res.json({ success: true, categoria: row });
      });
    }
  );
});

// PUT /api/categorias/:id - Actualizar categoría
app.put("/api/categorias/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const { nombre, slug, visible } = req.body;
  
  db.run(
    "UPDATE categorias SET nombre = COALESCE(?, nombre), slug = COALESCE(?, slug), visible = COALESCE(?, visible) WHERE id = ?",
    [nombre, slug, visible !== undefined ? (visible ? 1 : 0) : undefined, id],
    function(err) {
      if (err) {
        console.error("Error al actualizar categoría:", err);
        return res.status(500).json({ success: false, error: "Error del servidor" });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ success: false, error: "Categoría no encontrada" });
      }
      
      // Obtener la categoría actualizada
      db.get("SELECT * FROM categorias WHERE id = ?", [id], (err, row) => {
        if (err) {
          return res.status(500).json({ success: false, error: "Error del servidor" });
        }
        res.json({ success: true, categoria: row });
      });
    }
  );
});

// DELETE /api/categorias/:id - Eliminar categoría
app.delete("/api/categorias/:id", (req, res) => {
  const id = parseInt(req.params.id);
  
  db.run("DELETE FROM categorias WHERE id = ?", [id], function(err) {
    if (err) {
      console.error("Error al eliminar categoría:", err);
      return res.status(500).json({ success: false, error: "Error del servidor" });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ success: false, error: "Categoría no encontrada" });
    }
    
    res.json({ success: true });
  });
});

// ================================
// RUTAS DE SUBCATEGORÍAS
// ================================

// GET /api/subcategorias - Obtener subcategorías
app.get("/api/subcategorias", (req, res) => {
  const categoria_id = req.query.categoria_id;
  
  if (categoria_id) {
    db.all(
      "SELECT * FROM subcategorias WHERE categoria_id = ? AND visible = 1 ORDER BY nombre",
      [parseInt(categoria_id)],
      (err, rows) => {
        if (err) {
          console.error("Error al obtener subcategorías:", err);
          return res.status(500).json({ success: false, error: "Error del servidor" });
        }
        res.json(rows);
      }
    );
  } else {
    db.all("SELECT * FROM subcategorias WHERE visible = 1 ORDER BY nombre", (err, rows) => {
      if (err) {
        console.error("Error al obtener subcategorías:", err);
        return res.status(500).json({ success: false, error: "Error del servidor" });
      }
      res.json(rows);
    });
  }
});

// POST /api/subcategorias - Crear nueva subcategoría
app.post("/api/subcategorias", (req, res) => {
  const { categoria_id, nombre, slug, visible } = req.body;
  
  if (!categoria_id || !nombre) {
    return res.status(400).json({ success: false, error: "categoria_id y nombre son obligatorios" });
  }
  
  const slugFinal = slug || nombre.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  
  db.run(
    "INSERT INTO subcategorias (categoria_id, nombre, slug, visible) VALUES (?, ?, ?, ?)",
    [parseInt(categoria_id), nombre, slugFinal, visible !== undefined ? (visible ? 1 : 0) : 1],
    function(err) {
      if (err) {
        console.error("Error al crear subcategoría:", err);
        return res.status(500).json({ success: false, error: "Error del servidor" });
      }
      
      // Obtener la subcategoría creada
      db.get("SELECT * FROM subcategorias WHERE id = ?", [this.lastID], (err, row) => {
        if (err) {
          return res.status(500).json({ success: false, error: "Error del servidor" });
        }
        res.json({ success: true, subcategoria: row });
      });
    }
  );
});

// PUT /api/subcategorias/:id - Actualizar subcategoría
app.put("/api/subcategorias/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const { categoria_id, nombre, slug, visible } = req.body;
  
  db.run(
    "UPDATE subcategorias SET categoria_id = COALESCE(?, categoria_id), nombre = COALESCE(?, nombre), slug = COALESCE(?, slug), visible = COALESCE(?, visible) WHERE id = ?",
    [categoria_id ? parseInt(categoria_id) : undefined, nombre, slug, visible !== undefined ? (visible ? 1 : 0) : undefined, id],
    function(err) {
      if (err) {
        console.error("Error al actualizar subcategoría:", err);
        return res.status(500).json({ success: false, error: "Error del servidor" });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ success: false, error: "Subcategoría no encontrada" });
      }
      
      // Obtener la subcategoría actualizada
      db.get("SELECT * FROM subcategorias WHERE id = ?", [id], (err, row) => {
        if (err) {
          return res.status(500).json({ success: false, error: "Error del servidor" });
        }
        res.json({ success: true, subcategoria: row });
      });
    }
  );
});

// DELETE /api/subcategorias/:id - Eliminar subcategoría
app.delete("/api/subcategorias/:id", (req, res) => {
  const id = parseInt(req.params.id);
  
  db.run("DELETE FROM subcategorias WHERE id = ?", [id], function(err) {
    if (err) {
      console.error("Error al eliminar subcategoría:", err);
      return res.status(500).json({ success: false, error: "Error del servidor" });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ success: false, error: "Subcategoría no encontrada" });
    }
    
    res.json({ success: true });
  });
});

// ================================
// RUTAS DE USUARIOS
// ================================

// GET /api/usuarios - Obtener todos los usuarios
app.get("/api/usuarios", (req, res) => {
  db.all("SELECT id, usuario, creado_en FROM usuarios ORDER BY creado_en DESC", (err, rows) => {
    if (err) {
      console.error("Error al obtener usuarios:", err);
      return res.status(500).json({ success: false, error: "Error del servidor" });
    }
    res.json(rows);
  });
});

// POST /api/usuarios - Crear nuevo usuario
app.post("/api/usuarios", (req, res) => {
  const { usuario, password } = req.body;
  
  if (!usuario || !password) {
    return res.status(400).json({ success: false, error: "Usuario y contraseña son obligatorios" });
  }
  
  // En producción usar bcrypt, aquí solo guardamos el hash simple
  const passwordHash = password; // TODO: Implementar bcrypt
  
  db.run(
    "INSERT INTO usuarios (usuario, password_hash) VALUES (?, ?)",
    [usuario, passwordHash],
    function(err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
          return res.status(400).json({ success: false, error: "El usuario ya existe" });
        }
        console.error("Error al crear usuario:", err);
        return res.status(500).json({ success: false, error: "Error del servidor" });
      }
      
      // Obtener el usuario creado (sin password)
      db.get("SELECT id, usuario, creado_en FROM usuarios WHERE id = ?", [this.lastID], (err, row) => {
        if (err) {
          return res.status(500).json({ success: false, error: "Error del servidor" });
        }
        res.json({ success: true, usuario: row });
      });
    }
  );
});

// PUT /api/usuarios/:id - Actualizar usuario
app.put("/api/usuarios/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const { usuario, password } = req.body;
  
  if (!usuario && !password) {
    return res.status(400).json({ success: false, error: "Usuario o contraseña es obligatorio" });
  }
  
  let query = "UPDATE usuarios SET ";
  let params = [];
  
  if (usuario) {
    query += "usuario = COALESCE(?, usuario)";
    params.push(usuario);
  }
  
  if (password) {
    if (usuario) query += ", ";
    query += "password_hash = COALESCE(?, password_hash)";
    params.push(password); // TODO: Implementar bcrypt
  }
  
  query += " WHERE id = ?";
  params.push(id);
  
  db.run(query, params, function(err) {
    if (err) {
      if (err.message.includes('UNIQUE constraint failed')) {
        return res.status(400).json({ success: false, error: "El usuario ya existe" });
      }
      console.error("Error al actualizar usuario:", err);
      return res.status(500).json({ success: false, error: "Error del servidor" });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ success: false, error: "Usuario no encontrado" });
    }
    
    // Obtener el usuario actualizado (sin password)
    db.get("SELECT id, usuario, creado_en FROM usuarios WHERE id = ?", [id], (err, row) => {
      if (err) {
        return res.status(500).json({ success: false, error: "Error del servidor" });
      }
      res.json({ success: true, usuario: row });
    });
  });
});

// DELETE /api/usuarios/:id - Eliminar usuario
app.delete("/api/usuarios/:id", (req, res) => {
  const id = parseInt(req.params.id);
  
  // No permitir eliminar el usuario admin (id = 1)
  if (id === 1) {
    return res.status(400).json({ success: false, error: "No se puede eliminar el usuario admin" });
  }
  
  db.run("DELETE FROM usuarios WHERE id = ?", [id], function(err) {
    if (err) {
      console.error("Error al eliminar usuario:", err);
      return res.status(500).json({ success: false, error: "Error del servidor" });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ success: false, error: "Usuario no encontrado" });
    }
    
    res.json({ success: true });
  });
});

// ================================
// CREAR TABLA DE CONFIGURACIÓN
// ================================

// Crear tabla de configuración si no existe
db.run(`
  CREATE TABLE IF NOT EXISTS site_config (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT UNIQUE NOT NULL,
    value TEXT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`, (err) => {
  if (err) {
    console.error("Error creando tabla site_config:", err);
  } else {
    console.log("Tabla site_config creada o verificada correctamente");
    // Insertar configuración por defecto si no existe
    insertDefaultConfig();
  }
});

// Insertar configuración por defecto
function insertDefaultConfig() {
  const defaultConfig = {
    site_name: "Tienda",
    site_subtitle: "Productos Premium", 
    site_description: "Mini CMS Tienda · Frontend público",
    hero_title: "Catálogo de Productos",
    loading_text: "Cargando productos…",
    empty_products_text: "No hay productos que coincidan con los filtros.",
    error_products_text: "Error al cargar los productos. Revisa el servidor.",
    empty_cart_text: "Tu carrito está vacío.",
    checkout_button_text: "Finalizar (demo)",
    product_placeholder_name: "Producto sin nombre"
  };

  Object.entries(defaultConfig).forEach(([key, value]) => {
    db.run(
      "INSERT OR IGNORE INTO site_config (key, value) VALUES (?, ?)",
      [key, value],
      (err) => {
        if (err) {
          console.error(`Error insertando config ${key}:`, err);
        }
      }
    );
  });
}

// ================================
// RUTAS DE CONFIGURACIÓN DEL SITIO
// ================================

// GET /api/config - Obtener configuración del sitio desde base de datos
app.get("/api/config", (req, res) => {
  db.all("SELECT key, value FROM site_config", (err, rows) => {
    if (err) {
      console.error("Error obteniendo configuración:", err);
      return res.status(500).json({ success: false, error: "Error del servidor" });
    }

    const config = {};
    rows.forEach(row => {
      config[row.key] = row.value;
    });

    // Agregar footer links por defecto (no están en BD)
    config.footer_links = [
      { text: "Términos", url: "/terminos" },
      { text: "Privacidad", url: "/privacidad" },
      { text: "Contacto", url: "/contacto" }
    ];

    res.json(config);
  });
});

// POST /api/config - Actualizar configuración del sitio en base de datos
app.post("/api/config", (req, res) => {
  const configData = req.body;
  
  if (!configData || typeof configData !== 'object') {
    return res.status(400).json({ 
      success: false, 
      error: "Se requiere un objeto de configuración válido" 
    });
  }

  // Actualizar cada valor de configuración
  const updates = [];
  const errors = [];

  Object.entries(configData).forEach(([key, value]) => {
    if (key === 'footer_links') return; // Los footer links no se guardan en BD por ahora

    updates.push(new Promise((resolve, reject) => {
      db.run(
        "INSERT OR REPLACE INTO site_config (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)",
        [key, String(value)],
        function(err) {
          if (err) {
            errors.push({ key, error: err.message });
            reject(err);
          } else {
            resolve({ key, success: true });
          }
        }
      );
    }));
  });

  Promise.all(updates)
    .then(() => {
      if (errors.length > 0) {
        return res.status(500).json({ 
          success: false, 
          error: "Error actualizando algunos valores",
          details: errors 
        });
      }

      // Obtener configuración actualizada para devolverla
      db.all("SELECT key, value FROM site_config", (err, rows) => {
        if (err) {
          return res.status(500).json({ 
            success: false, 
            error: "Error obteniendo configuración actualizada" 
          });
        }

        const updatedConfig = {};
        rows.forEach(row => {
          updatedConfig[row.key] = row.value;
        });

        updatedConfig.footer_links = configData.footer_links || [
          { text: "Términos", url: "/terminos" },
          { text: "Privacidad", url: "/privacidad" },
          { text: "Contacto", url: "/contacto" }
        ];

        res.json({ 
          success: true, 
          config: updatedConfig,
          message: "Configuración actualizada correctamente"
        });
      });
    })
    .catch((err) => {
      console.error("Error en actualización de configuración:", err);
      res.status(500).json({ 
        success: false, 
        error: "Error del servidor al actualizar configuración" 
      });
    });
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
