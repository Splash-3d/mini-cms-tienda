# ✅ SOLUCIÓN PARA PUT 400 - FORMDATA EN VEZ DE JSON

## 🚨 Problema Identificado

### **❌ Error 400 Bad Request en PUT**
```
PUT https://mini-cms-tienda-production.up.railway.app/api/productos/1 400 (Bad Request)
```

**Causa Principal:** La ruta PUT estaba esperando `req.body` con datos JSON, pero el frontend está enviando `FormData`.

### **❌ Código Anterior (Problemático):**
```javascript
app.put("/api/productos/:id", (req, res) => {
  const { nombre, precio, stock, categoria, subcategoria, en_oferta, precio_oferta, imagen } = req.body;
  // ... esperaba JSON pero recibía FormData
});
```

## ✅ Solución Aplicada

### **✅ Ruta PUT Actualizada para FormData:**
```javascript
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
```

## 🔍 Cambios Clave

### **✅ 1. Agregado Middleware para FormData:**
```javascript
app.put("/api/productos/:id", upload.single('imagen'), (req, res) => {
```
- **`upload.single('imagen')`**: Permite manejar archivos de imagen
- **FormData parsing**: Convierte FormData a `req.body` accesible

### **✅ 2. Lectura Correcta de FormData:**
```javascript
const nombre = req.body.nombre;
const precio = req.body.precio;
const stock = req.body.stock;
// ... en lugar de destructuring de JSON
```

### **✅ 3. Manejo de Archivos:**
```javascript
let imagenFinal = imagenActual;
if (req.file) {
  imagenFinal = `/uploads/${req.file.filename}`;
} else if (!imagenActual) {
  imagenFinal = "/uploads/default.jpg";
}
```

### **✅ 4. Logs de Depuración:**
```javascript
console.log("=== DEBUG PUT ===");
console.log("Nombre:", nombre);
console.log("Precio:", precio);
// ... más logs
```

## 🚀 Comandos para Actualizar Railway

```bash
git add .
git commit -m "Fix: actualizar ruta PUT para manejar FormData en lugar de JSON"
git push
```

## 🎪 Para Probar la Solución

### **✅ Paso 1: Subir cambios**
```bash
git add .
git commit -m "Fix: actualizar ruta PUT para manejar FormData en lugar de JSON"
git push
```

### **✅ Paso 2: Esperar reinicio**
- **Espera unos segundos** a que Railway reinicie el servidor

### **✅ Paso 3: Probar edición**
1. **Accede al admin**: `https://mini-cms-tienda-production.up.railway.app/admin/productos.html`
2. **Edita un producto**: Haz clic en "Editar"
3. **Modifica los datos**: Cambia lo que necesites (nombre, precio, oferta, etc.)
4. **Guarda**: Haz clic en "Guardar"

### **✅ Paso 4: Verificar logs**
En la consola del navegador deberías ver:
```
=== DEBUG GUARDAR ===
Nombre (trim): "Air Force 1 Modificado"
Precio (parseFloat): 120
Stock (parseInt): 4
¿Nombre vacío?: false
¿Precio inválido?: false
¿Stock inválido?: false
=== FIN DEBUG ===

PUT https://.../api/productos/1 200 OK
```

Y en Railway logs deberías ver:
```
=== DEBUG PUT ===
ID: 1
Nombre: Air Force 1 Modificado
Precio: 120
Stock: 4
En oferta: 0
Precio oferta: null
=== FIN DEBUG PUT ===
Producto actualizado exitosamente: {id: 1, nombre: "Air Force 1 Modificado", ...}
```

## 🏆 Resultado Esperado

**✅ EDICIÓN DE PRODUCTOS COMPLETAMENTE FUNCIONAL:**

- **✅ GET individual**: `GET /api/productos/:id` funciona (200 OK)
- **✅ PUT FormData**: `PUT /api/productos/:id` maneja FormData correctamente
- **✅ Validación correcta**: Los datos se validan correctamente
- **✅ Actualización exitosa**: Los cambios se guardan en la base de datos
- **✅ Logs informativos**: Tanto frontend como backend muestran detalles
- **✅ Manejo de imágenes**: Soporta subir nuevas imágenes o mantener las actuales

**🎉 Ahora la edición de productos debería funcionar perfectamente. Sube los cambios a Railway y prueba la edición de cualquier producto.** 🚀
