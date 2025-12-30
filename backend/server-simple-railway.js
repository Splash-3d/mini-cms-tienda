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
