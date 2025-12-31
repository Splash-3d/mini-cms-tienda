# ✅ RESTAURAR WEB FUNCIONAL

## 📋 ESTADO ACTUAL

La web está funcionando con base de datos en memoria, pero necesitas volver al estado anterior a los intentos de persistencia.

## 🔧 PASOS PARA RESTAURAR

### **1. ✅ Servidor Restaurado Creado**

Ya he creado `backend/server-restored.js` con:
- **Base de datos en memoria** (`:memory:`) - funcional
- **Login admin**: `admin / admin123`
- **API completa**: Productos, banner, páginas, configuración
- **Todas las rutas**: CRUD completo

### **2. ✅ Actualizar package.json Manualmente**

Necesitas reemplazar el contenido de `backend/package.json` con:

```json
{
  "name": "mini-cms-tienda",
  "version": "1.0.0",
  "main": "server-restored.js",
  "scripts": {
    "start": "node server-restored.js"
  },
  "dependencies": {
    "bcrypt": "^6.0.0",
    "express": "^4.18.2",
    "multer": "^1.4.5-lts.1",
    "sqlite3": "^5.1.7"
  }
}
```

### **3. ✅ Eliminar Archivos Problemáticos**

Elimina estos archivos si existen:
- `railway.toml`
- `server-simple-fixed.js`
- `server-backup.js`

## 🚀 COMANDOS PARA RESTAURAR

### **Paso 1: Actualizar package.json**
```bash
# Reemplazar manualmente el contenido de backend/package.json
# con el JSON que está arriba
```

### **Paso 2: Hacer deploy**
```bash
git add .
git commit -m "Restore: web funcional con base de datos en memoria"
git push
```

## 📊 RESULTADO ESPERADO

### **✅ Logs en Railway:**
```
Base de datos en memoria creada
Todas las tablas creadas correctamente
Usuario admin creado
Banner por defecto creado
Servidor escuchando en el puerto 8080
```

### **✅ Funcionalidad:**
- **Login admin**: `admin / admin123` ✅
- **Panel admin**: CRUD completo ✅
- **Productos**: Se pueden crear, editar, eliminar ✅
- **Banner**: Se puede modificar ✅
- **Páginas**: Se pueden crear ✅
- **Frontend**: Carga datos dinámicamente ✅

### **⚠️ Limitación:**
- **Persistencia**: Los datos se pierden al reiniciar (base de datos en memoria)
- **Pero funcional**: Todo funciona mientras el servidor está activo

## 🎯 VERIFICACIÓN

### **Para probar que funciona:**
1. **Login admin**: `admin / admin123`
2. **Crear producto**: Debe aparecer en la tienda
3. **Modificar banner**: Debe cambiar el mensaje
4. **Crear página**: Debe aparecer en el menú

### **Logs esperados:**
```
Base de datos en memoria creada
Todas las tablas creadas correctamente
Usuario admin creado
Banner por defecto creado
```

## 🔄 ESTADO FINAL

La web volverá a estar **100% funcional** con:
- ✅ Panel admin operativo
- ✅ CRUD completo
- ✅ Login funcional
- ✅ Frontend dinámico
- ⚠️ Datos temporales (en memoria)

**🎉 ¡Con esto la web estará funcionando como antes!** 🚀
