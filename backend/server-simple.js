const express = require("express");
const app = express();
const path = require("path");

app.use(express.json());

// Redirigir a login cuando accedan a /tienda/admin (excepto login.html)
app.use("/tienda/admin", (req, res, next) => {
  // Si ya está en login.html, dejar pasar
  if (req.path.endsWith('/login.html') || req.path === '/login' || req.path === '/') {
    return next();
  }
  // Cualquier otra ruta de admin, redirigir a login
  return res.redirect("/tienda/admin/login.html");
});

// 🔧 SERVIR LA CARPETA /tienda (admin + frontend)
app.use("/tienda", express.static(path.join(__dirname, "../tienda")));

// 🔧 AQUÍ VAN TUS RUTAS API (si tienes)
// Ejemplo:
// app.use("/api", require("./routes/api"));

app.listen(3000, () => {
  console.log("Servidor funcionando en http://localhost:3000");
});
