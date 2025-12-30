const express = require("express");
const path = require("path");
const app = express();

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, "../tienda")));

// Página principal
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../tienda/frontend/pagina.html"));
});

// Vista admin de productos
app.get("/admin/productos", (req, res) => {
  res.sendFile(path.join(__dirname, "../tienda/admin/productos.html"));
});

// Vista admin login
app.get("/admin/login", (req, res) => {
  res.sendFile(path.join(__dirname, "../tienda/admin/login.html"));
});

// Puerto dinámico para Railway
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});
