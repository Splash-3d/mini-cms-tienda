# 📋 Análisis Completo de Rutas API del Frontend

## 🔍 Rutas Fetch Encontradas

### **Frontend (tienda/frontend/)**

#### **productos.html**
- `GET /api/banner` - Cargar banner
- `GET /api/paginas` - Cargar páginas para menú
- `GET /api/productos` - Cargar productos

#### **pagina.html**
- `GET /api/banner` - Cargar banner
- `GET /api/paginas/{slug}` - Cargar página específica
- `GET /api/paginas/{slug}/bloques` - Cargar bloques de página

#### **category-menu.js**
- `GET /api/categorias` - Cargar categorías para menú

### **Admin (tienda/admin/)**

#### **productos.html**
- `GET /api/productos` - Cargar productos
- `POST /api/productos` - Crear producto
- `PUT /api/productos/{id}` - Actualizar producto
- `DELETE /api/productos/{id}` - Borrar producto
- `GET /api/banner` - Cargar banner
- `POST /api/banner` - Actualizar banner

#### **product-form-updates.js**
- `GET /api/subcategorias?categoria_id={id}` - Cargar subcategorías
- `GET /api/categorias` - Cargar categorías

#### **panel.js**
- `POST /api/paginas` - Crear página
- `POST /api/paginas/{slug}` - Actualizar página
- `GET /api/paginas` - Cargar páginas
- `DELETE /api/paginas/{slug}` - Borrar página

#### **pages-management.js**
- `POST /api/paginas` - Crear página
- `POST /api/paginas/{slug}` - Actualizar página
- `DELETE /api/paginas/{slug}` - Borrar página
- `GET /api/paginas` - Cargar páginas

#### **login.html**
- `POST /api/login` - Autenticación

#### **categories-js.js**
- `GET /api/categorias` - Cargar categorías
- `POST /api/categorias` - Crear categoría
- `PUT /api/categorias/{id}` - Actualizar categoría
- `DELETE /api/categorias/{id}` - Borrar categoría
- `GET /api/subcategorias` - Cargar subcategorías
- `POST /api/subcategorias` - Crear subcategoría
- `PUT /api/subcategorias/{id}` - Actualizar subcategoría
- `DELETE /api/subcategorias/{id}` - Borrar subcategoría

#### **blocks-management.js**
- `POST /api/paginas/{slug}/bloques` - Crear bloque
- `DELETE /api/bloques/{id}` - Borrar bloque
- `PUT /api/bloques/{id}` - Actualizar bloque
- `GET /api/paginas/{slug}/bloques` - Cargar bloques
- `PUT /api/bloques/{id}/orden` - Actualizar orden

## 📊 Resumen de Rutas API Necesarias

### **Autenticación**
- `POST /api/login` - Login de admin

### **Banner**
- `GET /api/banner` - Obtener banner
- `POST /api/banner` - Actualizar banner

### **Productos**
- `GET /api/productos` - Listar productos
- `POST /api/productos` - Crear producto
- `PUT /api/productos/{id}` - Actualizar producto
- `DELETE /api/productos/{id}` - Borrar producto

### **Páginas**
- `GET /api/paginas` - Listar páginas
- `GET /api/paginas/{slug}` - Obtener página
- `POST /api/paginas` - Crear página
- `POST /api/paginas/{slug}` - Actualizar página
- `DELETE /api/paginas/{slug}` - Borrar página

### **Bloques de Páginas**
- `GET /api/paginas/{slug}/bloques` - Listar bloques
- `POST /api/paginas/{slug}/bloques` - Crear bloque
- `PUT /api/bloques/{id}` - Actualizar bloque
- `PUT /api/bloques/{id}/orden` - Actualizar orden
- `DELETE /api/bloques/{id}` - Borrar bloque

### **Categorías**
- `GET /api/categorias` - Listar categorías
- `POST /api/categorias` - Crear categoría
- `PUT /api/categorias/{id}` - Actualizar categoría
- `DELETE /api/categorias/{id}` - Borrar categoría

### **Subcategorías**
- `GET /api/subcategorias` - Listar subcategorías
- `GET /api/subcategorias?categoria_id={id}` - Subcategorías por categoría
- `POST /api/subcategorias` - Crear subcategoría
- `PUT /api/subcategorias/{id}` - Actualizar subcategoría
- `DELETE /api/subcategorias/{id}` - Borrar subcategoría

## ✅ Verificación de Rutas

### **Rutas Relativas ✅**
- Todas las llamadas fetch usan rutas relativas (`/api/...`)
- No se encontraron rutas absolutas con `localhost:3000`
- `API_BASE = "/api"` está correctamente definido

### **Métodos HTTP ✅**
- GET: Para obtener datos
- POST: Para crear recursos
- PUT: Para actualizar recursos
- DELETE: Para borrar recursos

## 🎯 Total de Rutas API: **25 endpoints**

### **Por módulo:**
- Autenticación: 1
- Banner: 2
- Productos: 4
- Páginas: 5
- Bloques: 5
- Categorías: 4
- Subcategorías: 4

## 📝 Próximo Paso

Crear `backend/server.js` con todas estas rutas API que devuelvan JSON válido y datos de prueba.
