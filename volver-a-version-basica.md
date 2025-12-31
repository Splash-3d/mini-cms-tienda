# ✅ VOLVER A VERSIÓN BÁSICA - SOLUCIÓN COMPLETA

## 📋 PROBLEMA ACTUAL

No puedo modificar archivos JSON con las herramientas disponibles. Necesitas hacer cambios manuales.

## 🔧 SOLUCIÓN COMPLETA

### **1. ✅ Servidor Básico Creado**

Ya he creado `backend/server-basic.js` con el código más simple posible:

```javascript
const express = require("express");
const path = require("path");
const app = express();

// Servir archivos estáticos desde el frontend
app.use(express.static(path.join(__dirname, "../tienda")));

// Ruta principal
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../tienda/frontend/pagina.html"));
});

// Ruta productos
app.get("/productos", (req, res) => {
  res.sendFile(path.join(__dirname, "../tienda/frontend/productos.html"));
});

// Ruta admin productos
app.get("/admin/productos", (req, res) => {
  res.sendFile(path.join(__dirname, "../tienda/admin/productos.html"));
});

// Ruta admin login
app.get("/admin/login", (req, res) => {
  res.sendFile(path.join(__dirname, "../tienda/admin/login.html"));
});

// Puerto dinámico para Railway
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});
```

### **2. ✅ CAMBIOS MANUALES QUE NECESITAS HACER**

#### **A. Actualizar `backend/package.json` MANUALMENTE:**

Reemplaza TODO el contenido de `backend/package.json` con esto:

```json
{
  "name": "mini-cms-tienda",
  "version": "1.0.0",
  "main": "server-basic.js",
  "scripts": {
    "start": "node server-basic.js"
  },
  "dependencies": {
    "express": "^4.18.2"
  }
}
```

#### **B. Eliminar archivos que no se necesitan:**

Elimina estos archivos si existen:
- `server-restored.js`
- `server-simple-railway.js`
- `server-simple-fixed.js`
- `server-backup.js`
- `railway.toml`

#### **C. Mantener solo estos archivos:**
- `server-basic.js` ✅
- `package.json` (actualizado) ✅
- Todo el directorio `tienda/` ✅

## 🚀 PASOS PARA RESTAURAR

### **Paso 1: Actualizar package.json**
1. Abre `backend/package.json`
2. Borra todo el contenido
3. Copia y pega el JSON de arriba
4. Guarda el archivo

### **Paso 2: Limpiar archivos**
1. Elimina los archivos mencionados arriba
2. Mantén solo `server-basic.js` y `package.json`

### **Paso 3: Hacer deploy**
```bash
git add .
git commit -m "Revert: volver a versión básica funcional"
git push
```

## 📊 RESULTADO ESPERADO

### **✅ Logs en Railway:**
```
Servidor escuchando en el puerto 8080
```

### **✅ Funcionalidad:**
- **Página principal**: Funciona ✅
- **Página productos**: Funciona ✅
- **Panel admin**: Se puede acceder ✅
- **Login**: Se puede ver la página ✅

### **⚠️ Limitaciones (version básica):**
- **Sin API**: No hay backend dinámico
- **Sin base de datos**: Todo es estático
- **Sin CRUD**: No se pueden guardar cambios
- **Pero funcional**: Las páginas se cargan y navegan

## 🎯 VERIFICACIÓN

### **Para probar que funciona:**
1. **Página principal**: Debe cargar
2. **Página productos**: Debe cargar
3. **Panel admin**: Debe mostrar la interfaz
4. **Login**: Debe mostrar el formulario

### **Lo que NO funcionará:**
- Login real (solo muestra formulario)
- Guardar productos
- Modificar banner
- CRUD dinámico

## 🔄 ESTADO FINAL

La web volverá a estar **básica pero funcional**:
- ✅ Todas las páginas se cargan
- ✅ Navegación funciona
- ✅ Diseño intacto
- ⚠️ Sin funcionalidad dinámica

**🎉 ¡Con esto la web estará funcionando como al principio!** 🚀

## 📝 NOTA

Si después de esto quieres volver a agregar funcionalidades dinámicas, podemos hacerlo paso a paso, empezando con un servidor simple y agregando características gradualmente.
