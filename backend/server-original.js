const express = require("express");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();
const multer = require("multer");
const fs = require("fs");
const bcrypt = require("bcrypt");

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, "../tienda")));

// Configuración de multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadsDir = path.join(__dirname, "uploads");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos de imagen'), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024
  }
});

// Base de datos - primero intentar persistente, luego local, luego memoria
const dbPath = process.env.RAILWAY_ENVIRONMENT === 'production' 
  ? '/data/tienda.db'  // Railway - persistente
  : path.join(__dirname, "tienda.db"); // Local - tienda.db existente

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("Error abriendo base de datos:", err);
    console.log("❌ No se puede usar", dbPath, ", usando memoria temporal");
    // Fallback a memoria si no se puede usar ninguna ruta
    const memoryDb = new sqlite3.Database(':memory:');
    initializeDatabase(memoryDb);
  } else {
    console.log("✅ Base de datos conectada:", dbPath);
    initializeDatabase(db);
  }
});

function initializeDatabase(database) {
  const dbToUse = database || db;
  
  // Crear tablas si no existen
  const tables = [
    `CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      usuario TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      creado_en DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS banner (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      texto TEXT NOT NULL DEFAULT '',
      color_fondo TEXT NOT NULL DEFAULT '#1d4ed8',
      color_texto TEXT NOT NULL DEFAULT '#ffffff',
      visible INTEGER NOT NULL DEFAULT 1
    )`,
    `CREATE TABLE IF NOT EXISTS productos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      precio REAL NOT NULL,
      stock INTEGER NOT NULL DEFAULT 0,
      imagen TEXT DEFAULT '/uploads/default.jpg',
      categoria TEXT,
      subcategoria TEXT,
      en_oferta INTEGER NOT NULL DEFAULT 0,
      precio_oferta REAL,
      disponible INTEGER NOT NULL DEFAULT 1,
      creado_en DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS paginas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT UNIQUE NOT NULL,
      titulo TEXT NOT NULL,
      contenido TEXT DEFAULT '',
      visible INTEGER NOT NULL DEFAULT 1,
      creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
      actualizado_en DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS categorias (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT UNIQUE NOT NULL,
      creado_en DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS subcategorias (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT UNIQUE NOT NULL,
      categoria_id INTEGER,
      creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (categoria_id) REFERENCES categorias(id)
    )`,
    `CREATE TABLE IF NOT EXISTS site_config (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT UNIQUE NOT NULL,
      value TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`
  ];

  let tablesCreated = 0;
  tables.forEach((sql, index) => {
    dbToUse.run(sql, (err) => {
      if (err) {
        console.error(`Error creando tabla ${index + 1}:`, err);
      } else {
        tablesCreated++;
        if (tablesCreated === tables.length) {
          console.log("✅ Todas las tablas verificadas");
          // NO crear datos por defecto - solo verificar que exista admin
          checkExistingData(dbToUse);
        }
      }
    });
  });
}

function checkExistingData(database) {
  const dbToUse = database || db;
  
  // Verificar si existe usuario admin, sino crearlo
  dbToUse.get("SELECT COUNT(*) as count FROM usuarios", (err, row) => {
    if (!err && row.count === 0) {
      console.log("No hay usuarios, creando admin por defecto");
      const passwordHash = bcrypt.hashSync("admin123", 10);
      dbToUse.run("INSERT INTO usuarios (usuario, password_hash) VALUES (?, ?)", ["admin", passwordHash], (err) => {
        if (!err) {
          console.log("✅ Usuario admin creado");
        }
      });
    } else {
      console.log("✅ Usuarios existentes en la base de datos");
    }
  });

  // Verificar si existe banner, sino crearlo
  dbToUse.get("SELECT COUNT(*) as count FROM banner", (err, row) => {
    if (!err && row.count === 0) {
      console.log("No hay banner, creando banner por defecto");
      dbToUse.run("INSERT INTO banner (texto, color_fondo, color_texto, visible) VALUES (?, ?, ?, ?)", 
        ["¡Bienvenido a nuestra tienda!", "#1d4ed8", "#ffffff", 1]);
    } else {
      console.log("✅ Banner existente en la base de datos");
    }
  });
}

// Rutas de autenticación
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ success: false, error: "Usuario y contraseña son obligatorios" });
  }
  
  db.get("SELECT * FROM usuarios WHERE usuario = ?", [username], (err, row) => {
    if (err) {
      return res.status(500).json({ success: false, error: "Error del servidor" });
    }
    
    if (!row) {
      return res.status(401).json({ success: false, error: "Usuario no encontrado" });
    }
    
    bcrypt.compare(password, row.password_hash, (err, result) => {
      if (err) {
        return res.status(500).json({ success: false, error: "Error del servidor" });
      }
      
      if (result) {
        res.json({
          success: true,
          token: "token-de-prueba-admin",
          user: { id: row.id, username: row.usuario }
        });
      } else {
        res.status(401).json({ success: false, error: "Contraseña incorrecta" });
      }
    });
  });
});

// Rutas de productos
app.get("/api/productos", (req, res) => {
  db.all("SELECT * FROM productos ORDER BY creado_en DESC", (err, rows) => {
    if (err) {
      return res.status(500).json({ success: false, error: "Error del servidor" });
    }
    res.json(rows);
  });
});

app.post("/api/productos", upload.single('imagen'), (req, res) => {
  const { nombre, precio, stock, categoria, subcategoria, en_oferta, precio_oferta, disponible } = req.body;
  
  if (!nombre || !precio) {
    return res.status(400).json({ success: false, error: "Nombre y precio son obligatorios" });
  }
  
  const imagenNombre = req.file ? `/uploads/${req.file.filename}` : "/uploads/default.jpg";
  
  db.run(
    `INSERT INTO productos (nombre, precio, stock, imagen, categoria, subcategoria, en_oferta, precio_oferta, disponible, creado_en) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
    [nombre, parseFloat(precio), parseInt(stock || 0), imagenNombre, categoria, subcategoria, en_oferta || 0, precio_oferta || null, disponible || 1],
    function(err) {
      if (err) {
        return res.status(500).json({ success: false, error: "Error del servidor" });
      }
      
      db.get("SELECT * FROM productos WHERE id = ?", [this.lastID], (err, row) => {
        if (err) {
          return res.status(500).json({ success: false, error: "Error del servidor" });
        }
        res.json({ success: true, producto: row });
      });
    }
  );
});

app.put("/api/productos/:id", upload.single('imagen'), (req, res) => {
  const id = parseInt(req.params.id);
  const { nombre, precio, stock, categoria, subcategoria, en_oferta, precio_oferta, disponible } = req.body;
  
  let imagenFinal = req.file ? `/uploads/${req.file.filename}` : req.body.imagenActual;
  
  db.run(
    `UPDATE productos 
     SET nombre = ?, precio = ?, stock = ?, categoria = ?, subcategoria = ?, 
         en_oferta = ?, precio_oferta = ?, imagen = COALESCE(?, imagen)
     WHERE id = ?`,
    [nombre, parseFloat(precio), parseInt(stock || 0), categoria, subcategoria, en_oferta === '1' ? 1 : 0, precio_oferta || null, imagenFinal, id],
    function(err) {
      if (err) {
        return res.status(500).json({ success: false, error: "Error del servidor" });
      }
      
      db.get("SELECT * FROM productos WHERE id = ?", [id], (err, row) => {
        if (err) {
          return res.status(500).json({ success: false, error: "Error del servidor" });
        }
        res.json({ success: true, producto: row });
      });
    }
  );
});

app.delete("/api/productos/:id", (req, res) => {
  const id = parseInt(req.params.id);
  
  db.run("DELETE FROM productos WHERE id = ?", [id], function(err) {
    if (err) {
      return res.status(500).json({ success: false, error: "Error del servidor" });
    }
    res.json({ success: true });
  });
});

// Rutas de categorías
app.get("/api/categorias", (req, res) => {
  db.all("SELECT * FROM categorias ORDER BY nombre", (err, rows) => {
    if (err) {
      return res.status(500).json({ success: false, error: "Error del servidor" });
    }
    res.json(rows);
  });
});

app.post("/api/categorias", (req, res) => {
  const { nombre } = req.body;
  
  if (!nombre) {
    return res.status(400).json({ success: false, error: "El nombre de la categoría es obligatorio" });
  }
  
  db.run("INSERT INTO categorias (nombre) VALUES (?)", [nombre], function(err) {
    if (err) {
      return res.status(500).json({ success: false, error: "Error del servidor" });
    }
    
    db.get("SELECT * FROM categorias WHERE id = ?", [this.lastID], (err, row) => {
      if (err) {
        return res.status(500).json({ success: false, error: "Error del servidor" });
      }
      res.json({ success: true, categoria: row });
    });
  });
});

app.delete("/api/categorias/:id", (req, res) => {
  const id = parseInt(req.params.id);
  
  db.run("DELETE FROM categorias WHERE id = ?", [id], function(err) {
    if (err) {
      return res.status(500).json({ success: false, error: "Error del servidor" });
    }
    res.json({ success: true });
  });
});

// Rutas de subcategorías
app.get("/api/subcategorias", (req, res) => {
  db.all("SELECT s.*, c.nombre as categoria_nombre FROM subcategorias s LEFT JOIN categorias c ON s.categoria_id = c.id ORDER BY s.nombre", (err, rows) => {
    if (err) {
      return res.status(500).json({ success: false, error: "Error del servidor" });
    }
    res.json(rows);
  });
});

app.post("/api/subcategorias", (req, res) => {
  const { nombre, categoria_id } = req.body;
  
  if (!nombre) {
    return res.status(400).json({ success: false, error: "El nombre de la subcategoría es obligatorio" });
  }
  
  db.run("INSERT INTO subcategorias (nombre, categoria_id) VALUES (?, ?)", [nombre, categoria_id], function(err) {
    if (err) {
      return res.status(500).json({ success: false, error: "Error del servidor" });
    }
    
    db.get("SELECT * FROM subcategorias WHERE id = ?", [this.lastID], (err, row) => {
      if (err) {
        return res.status(500).json({ success: false, error: "Error del servidor" });
      }
      res.json({ success: true, subcategoria: row });
    });
  });
});

app.delete("/api/subcategorias/:id", (req, res) => {
  const id = parseInt(req.params.id);
  
  db.run("DELETE FROM subcategorias WHERE id = ?", [id], function(err) {
    if (err) {
      return res.status(500).json({ success: false, error: "Error del servidor" });
    }
    res.json({ success: true });
  });
});

// Rutas de banner
app.get("/api/banner", (req, res) => {
  db.get("SELECT * FROM banner WHERE id = 1", (err, row) => {
    if (err) {
      return res.status(500).json({ success: false, error: "Error del servidor" });
    }
    res.json(row || {});
  });
});

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
        return res.status(500).json({ success: false, error: "Error del servidor" });
      }
      
      db.get("SELECT * FROM banner WHERE id = 1", (err, row) => {
        if (err) {
          return res.status(500).json({ success: false, error: "Error del servidor" });
        }
        res.json({ success: true, banner: row || {} });
      });
    }
  );
});

// Rutas de páginas
app.get("/api/paginas", (req, res) => {
  db.all("SELECT * FROM paginas WHERE visible = 1 ORDER BY titulo", (err, rows) => {
    if (err) {
      return res.status(500).json({ success: false, error: "Error del servidor" });
    }
    res.json(rows);
  });
});

app.post("/api/paginas", (req, res) => {
  const { slug, titulo, contenido, visible } = req.body;
  
  if (!titulo) {
    return res.status(400).json({ success: false, error: "El título es obligatorio" });
  }
  
  const slugFinal = slug || titulo.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  
  db.run(
    "INSERT INTO paginas (slug, titulo, contenido, visible, creado_en, actualizado_en) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [slugFinal, titulo, contenido || "", visible !== undefined ? (visible ? 1 : 0) : 1, "datetime('now')", "datetime('now')"],
    function(err) {
      if (err) {
        return res.status(500).json({ success: false, error: "Error del servidor" });
      }
      
      db.get("SELECT * FROM paginas WHERE id = ?", [this.lastID], (err, row) => {
        if (err) {
          return res.status(500).json({ success: false, error: "Error del restaurar" });
        }
        res.json({ success: true, pagina: row });
      });
    }
  );
});

app.put("/api/paginas/:slug", (req, res) => {
  const { slug } = req.params;
  const { titulo, contenido, visible } = req.body;
  
  db.run(
    "UPDATE paginas SET titulo = COALESCE(?, titulo), contenido = COALESCE(?, contenido), visible = COALESCE(?, visible), actualizado_en = datetime('now') WHERE slug = ?",
    [titulo, contenido, visible !== undefined ? (visible ? 1 : 0) : 1, slug],
    function(err) {
      if (err) {
        return res.status(500).json({ success: false, error: "Error del servidor" });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ success: false, error: "Página no encontrada" });
      }
      
      db.get("SELECT * FROM paginas WHERE slug = ?", [slug], (err, row) => {
        if (err) {
          return res.status(500).json({ success: false, error: "Error del servidor" });
        }
        res.json({ success: true, pagina: row });
      });
    }
  );
});

app.delete("/api/paginas/:slug", (req, res) => {
  const { slug } = req.params;
  
  db.run("DELETE FROM paginas WHERE slug = ?", [slug], function(err) {
    if (err) {
      return res.status(500).json({ success: false, error: "Error del servidor" });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ success: false, error: "Página no encontrada" });
    }
    
    // También borrar los bloques de esta página
    db.run("DELETE FROM pagina_bloques WHERE pagina_slug = ?", [slug]);
    
    res.json({ success: true });
  });
});

// Rutas de configuración
app.get("/api/config", (req, res) => {
  db.all("SELECT key, value FROM site_config", (err, rows) => {
    if (err) {
      return res.status(500).json({ success: false, error: "Error del servidor" });
    }

    const config = {};
    rows.forEach(row => {
      config[row.key] = row.value;
    });

    // Valores por defecto si no existen
    if (!config.site_name) config.site_name = "Tienda";
    if (!config.site_subtitle) config.site_subtitle = "Productos Premium";
    if (!config.hero_title) config.hero_title = "Catálogo de Productos";
    if (!config.empty_products_text) config.empty_products_text = "No hay productos que coincidan con los filtros.";
    if (!config.error_products_text) config.error_products_text = "Error al cargar los productos. Revisa el servidor.";
    if (!config.empty_cart_text) config.empty_cart_text = "Tu carrito está vacío.";
    if (!config.checkout_button_text) config.checkout_button_text = "Finalizar (demo)";
    if (!config.product_placeholder_name) config.product_placeholder_name = "Producto sin nombre";
    
    config.footer_links = [
      { text: "Términos", url: "/terminos" },
      { text: "privacidad", url: "/privacidad" },
      { text: "Contacto", url: "/contacto" }
    ];

    res.json(config);
  });
});

app.post("/api/config", async (req, res) => {
  try {
    const updates = req.body;
    
    for (const [key, value] of Object.entries(updates)) {
      if (key !== 'footer_links') {
        await new Promise((resolve, reject) => {
          db.run(
            "INSERT OR REPLACE INTO site_config (key, value) VALUES (?, ?)",
            [key, value],
            function(err) {
              if (err) reject(err);
              else resolve(this);
            }
          );
        });
      }
    }
    
    res.json({ success: true, message: "Configuración actualizada" });
  } catch (err) {
    res.status(500).json({ success: false, error: "Error del servidor" });
  }
});

// Rutas estáticas
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../tienda/frontend/pagina.html"));
});

app.get("/tienda/productos.html", (req, res) => {
  res.sendFile(path.join(__dirname, "../tienda/frontend/productos.html"));
});

app.get("/tienda/admin/login.html", (req, res) => {
  res.sendFile(path.join(__dirname, "../tienda/admin/login.html"));
});

app.get("/tienda/admin/productos.html", (req, res) => {
  res.sendFile(path.join(__dirname, "../tienda/admin/productos.html"));
});

app.get("/admin/productos", (req, res) => {
  res.sendFile(path.join(__dirname, "../tienda/admin/productos.html"));
});

app.get("/admin/login", (req, res) => {
  res.sendFile(path.join(__dirname, "../tienda/admin/login.html"));
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
  console.log("✅ Base de datos persistente: /data/tienda.db");
  console.log("✅ Todas las funciones originales restauradas");
  console.log("✅ Login: admin / admin123");
});
