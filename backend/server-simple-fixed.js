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

// Base de datos
let db;

function initializeDatabase() {
  db = new sqlite3.Database(':memory:', (err) => {
    if (err) {
      console.error("Error creando base de datos:", err);
      process.exit(1);
    }
    console.log("Base de datos en memoria creada");
    
    // Crear tablas en secuencia
    createTables();
  });
}

function createTables() {
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
    `CREATE TABLE IF NOT EXISTS site_config (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT UNIQUE NOT NULL,
      value TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`
  ];

  let tablesCreated = 0;
  tables.forEach((sql, index) => {
    db.run(sql, (err) => {
      if (err) {
        console.error(`Error creando tabla ${index + 1}:`, err);
      } else {
        tablesCreated++;
        console.log(`Tabla ${index + 1} creada`);
        if (tablesCreated === tables.length) {
          console.log("Todas las tablas creadas");
          createDefaultData();
        }
      }
    });
  });
}

function createDefaultData() {
  console.log("Creando datos por defecto...");
  
  // Crear usuario admin
  const passwordHash = bcrypt.hashSync("admin123", 10);
  console.log("Hash generado:", passwordHash.substring(0, 20) + "...");
  
  db.run("INSERT INTO usuarios (usuario, password_hash) VALUES (?, ?)", ["admin", passwordHash], function(err) {
    if (err) {
      console.error("Error creando admin:", err);
    } else {
      console.log("Usuario admin creado con ID:", this.lastID);
      
      // Verificar inmediatamente
      db.get("SELECT * FROM usuarios WHERE usuario = ?", ["admin"], (err, row) => {
        if (err) {
          console.error("Error verificando admin:", err);
        } else if (row) {
          console.log("✅ Admin verificado - ID:", row.id, "Usuario:", row.usuario);
        } else {
          console.log("❌ Admin no encontrado después de crear");
        }
      });
    }
  });

  // Crear banner
  db.run("INSERT INTO banner (texto, color_fondo, color_texto, visible) VALUES (?, ?, ?, ?)", 
    ["¡Bienvenido a nuestra tienda!", "#1d4ed8", "#ffffff", 1], function(err) {
    if (err) {
      console.error("Error creando banner:", err);
    } else {
      console.log("Banner creado con ID:", this.lastID);
    }
  });
}

// Rutas de autenticación
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;
  
  console.log("=== LOGIN INTENTO ===");
  console.log("Usuario:", username);
  console.log("Contraseña:", password);
  
  if (!username || !password) {
    return res.status(400).json({ success: false, error: "Usuario y contraseña son obligatorios" });
  }
  
  db.get("SELECT * FROM usuarios WHERE usuario = ?", [username], (err, row) => {
    if (err) {
      console.error("Error en consulta:", err);
      return res.status(500).json({ success: false, error: "Error del servidor" });
    }
    
    console.log("Usuario encontrado:", row ? "SÍ" : "NO");
    if (row) {
      console.log("ID:", row.id, "Usuario:", row.usuario);
      console.log("Hash BD:", row.password_hash.substring(0, 20) + "...");
    }
    
    if (!row) {
      return res.status(401).json({ success: false, error: "Usuario no encontrado" });
    }
    
    bcrypt.compare(password, row.password_hash, (err, result) => {
      if (err) {
        console.error("Error bcrypt:", err);
        return res.status(500).json({ success: false, error: "Error del servidor" });
      }
      
      console.log("Resultado bcrypt:", result);
      console.log("=== FIN LOGIN ===");
      
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

// Endpoint debug
app.get("/api/debug/users", (req, res) => {
  db.all("SELECT id, usuario, creado_en FROM usuarios", (err, rows) => {
    if (err) {
      return res.status(500).json({ success: false, error: "Error del servidor" });
    }
    res.json({ success: true, usuarios: rows });
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
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
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
    
    config.footer_links = [
      { text: "Términos", url: "/terminos" },
      { text: "Privacidad", url: "/privacidad" },
      { text: "Contacto", url: "/contacto" }
    ];

    res.json(config);
  });
});

// Rutas estáticas
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../tienda/frontend/pagina.html"));
});

app.get("/admin/productos", (req, res) => {
  res.sendFile(path.join(__dirname, "../tienda/admin/productos.html"));
});

app.get("/admin/login", (req, res) => {
  res.sendFile(path.join(__dirname, "../tienda/admin/login.html"));
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
initializeDatabase();

app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
  console.log("Login: admin / admin123");
});
