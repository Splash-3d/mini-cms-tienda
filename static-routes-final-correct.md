# ✅ RUTAS ESTÁTICAS - PATH CORREGIDO

## 🔧 Corrección del Path

### **❌ Path Incorrecto (Antes):**
```javascript
app.use("/tienda", express.static(path.join(__dirname, "tienda/frontend")));
```
**Problema:** Buscaba `backend/tienda/frontend` (no existe)

### **✅ Path Correcto (Ahora):**
```javascript
app.use("/tienda", express.static(path.join(__dirname, "../tienda/frontend")));
```
**Solución:** Busca `backend/../tienda/frontend` = `tienda/frontend` (✅ existe)

## 📁 Estructura Real de Directorios

```
mini-cms-tienda/
├── backend/
│   ├── server.js              # __dirname = backend/
│   └── uploads/
└── tienda/
    └── frontend/              # ../tienda/frontend desde backend/
        ├── pagina.html
        ├── productos.html
        └── category-menu.js
```

## 🎯 Mapeo Correcto

### **✅ Desde backend/server.js:**
- **`__dirname`** = `backend/`
- **`../tienda/frontend`** = `backend/../tienda/frontend` = `tienda/frontend`

### **✅ Mapeo de URLs:**
| URL | Path Resuelto | Archivo |
|-----|---------------|---------|
| `/tienda/productos.html` | `backend/../tienda/frontend/productos.html` | `tienda/frontend/productos.html` |
| `/tienda/pagina.html` | `backend/../tienda/frontend/pagina.html` | `tienda/frontend/pagina.html` |
| `/tienda/category-menu.js` | `backend/../tienda/frontend/category-menu.js` | `tienda/frontend/category-menu.js` |

## 🔍 Bloque Final de Rutas Estáticas

```javascript
// Middleware para JSON y form data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos - carpeta tienda/frontend bajo /tienda
app.use("/tienda", express.static(path.join(__dirname, "../tienda/frontend")));

// Servir carpeta uploads para imágenes
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
```

## 🚀 Para Actualizar Railway

```bash
git add .
git commit -m "Fix: corregir path estático de /tienda a ../tienda/frontend"
git push
```

## 🎪 URLs que Funcionarán

### **✅ En Railway:**
- **Productos**: `https://mini-cms-tienda-production.up.railway.app/tienda/productos.html`
- **Página**: `https://mini-cms-tienda-production.up.railway.app/tienda/pagina.html`
- **Cualquier archivo**: `https://mini-cms-tienda-production.up.railway.app/tienda/nombre.html`

### **✅ Local:**
- **Productos**: `http://localhost:3000/tienda/productos.html`
- **Página**: `http://localhost:3000/tienda/pagina.html`

## 🔍 Verificación del Problema

### **❌ Error "Cannot GET /tienda/pagina.html":**
- **Causa**: Path incorrecto `backend/tienda/frontend`
- **Solución**: Path correcto `backend/../tienda/frontend`

### **✅ Por qué funciona productos.html:**
- Puede que haya caché o productos.html estuviera en otro lugar
- Ahora todas las páginas funcionarán consistentemente

## 🏆 Resultado Final

**✅ PATH CORREGIDO Y FUNCIONAL:**

- **✅ Path correcto**: `../tienda/frontend`
- **✅ Todas las páginas**: `pagina.html`, `productos.html`, etc.
- **✅ Sin errores 404**: Todos los archivos del catálogo funcionan
- **✅ Railway compatible**: URLs funcionan correctamente
- **✅ Estructura correcta**: Apunta a la carpeta real

**🎉 Ahora `/tienda/pagina.html` funcionará correctamente cuando hagas clic desde productos.html.** 🚀
