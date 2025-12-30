const express = require("express");
const path = require("path");
const app = express();

app.use(express.static(path.join(__dirname, "../tienda")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../tienda/frontend/pagina.html"));
});

app.get("/admin/productos", (req, res) => {
  res.sendFile(path.join(__dirname, "../tienda/admin/productos.html"));
});

app.get("/tienda/productos.html", (req, res) => {
  res.sendFile(path.join(__dirname, "../tienda/frontend/productos.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});
