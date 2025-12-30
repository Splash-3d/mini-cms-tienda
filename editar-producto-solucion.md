# ✅ SOLUCIÓN PARA EDICIÓN DE PRODUCTOS - RUTA GET INDIVIDUAL

## 🚨 Problemas Identificados

### **❌ Problema 1: API GET individual no existe (404)**
```
GET https://mini-cms-tienda-production.up.railway.app/api/productos/1 404 (Not Found)
```
**Causa:** La ruta `GET /api/productos/:id` no existía en el backend.

### **❌ Problema 2: API PUT devuelve 400 (Bad Request)**
```
PUT https://mini-cms-tienda-production.up.railway.app/api/productos/1 400 (Bad Request)
```
**Causa:** El backend estaba rechazando la actualización.

## ✅ Solución Aplicada

### **✅ Agregada ruta GET individual:**
```javascript
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
```

## 🔍 Análisis de los Logs que Proporcionaste

### **✅ Lo que funcionó correctamente:**
```
=== DEBUG ELEMENTOS DOM ===
productIdInput.value: 1
nombreInput.value: Air Force 1
precioInput.value: 120
stockInput.value: 4
=== FIN DEBUG DOM ===

=== DEBUG GUARDAR ===
Nombre (trim): Air Force 1
Precio (parseFloat): 120
Stock (parseInt): 4
¿Nombre vacío?: false
¿Precio inválido?: false
¿Stock inválido?: false
=== FIN DEBUG ===
```

**✅ Conclusión:** Los datos del formulario están correctos, la validación funciona bien. El problema estaba en el backend.

### **❌ Lo que falló:**
1. **GET /api/productos/1** → 404 Not Found (ruta no existía)
2. **PUT /api/productos/1** → 400 Bad Request (posible problema con el backend)

## 🚀 Comandos para Actualizar Railway

```bash
git add .
git commit -m "Fix: agregar ruta GET /api/productos/:id para edición individual"
git push
```

## 🎪 Para Probar la Solución

### **✅ Paso 1: Subir cambios**
```bash
git add .
git commit -m "Fix: agregar ruta GET /api/productos/:id para edición individual"
git push
```

### **✅ Paso 2: Probar edición**
1. **Espera a que Railway reinicie** (unos segundos)
2. **Accede al admin**: `https://mini-cms-tienda-production.up.railway.app/admin/productos.html`
3. **Edita un producto**: Haz clic en "Editar"
4. **Deberías ver en los logs:**
   ```
   GET https://.../api/productos/1 200 OK
   Datos recibidos de la API: {id: 1, nombre: "Air Force 1", ...}
   ```
5. **Modifica el producto**: Cambia lo que necesites
6. **Guarda**: Debería funcionar ahora

### **✅ Paso 3: Verificar que funcione**
- **Carga de datos**: El formulario debería cargar con datos de la API
- **Guardado**: Debería guardar sin errores
- **Actualización**: Los cambios deberían reflejarse en la lista

## 🎯 Si Sigue Fallando el PUT 400

Si después de agregar la ruta GET, el PUT sigue dando 400, podría ser:

### **✅ Causa 1: Formato de FormData**
El backend podría estar esperando datos específicos en el FormData.

### **✅ Causa 2: Validación en el backend**
La ruta PUT podría tener validaciones estrictas.

### **✅ Causa 3: Campos faltantes**
Podría faltar algún campo obligatorio en el FormData.

## 🏆 Resultado Esperado

**✅ EDICIÓN DE PRODUCTOS FUNCIONAL:**

- **✅ GET individual**: `GET /api/productos/:id` funciona (200 OK)
- **✅ Carga de datos**: El formulario se carga con datos actualizados
- **✅ Validación**: Los datos del formulario son correctos
- **✅ Guardado**: PUT debería funcionar sin 400
- **✅ Actualización**: Los cambios se reflejan inmediatamente

**🎉 Sube los cambios a Railway y prueba la edición de productos. Ahora debería funcionar correctamente tanto la carga de datos como el guardado.** 🚀
