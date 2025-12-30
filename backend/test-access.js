// Ejemplo para probar el acceso protegido con token

// ❌ ACCESO SIN TOKEN (debería fallar)
fetch("http://localhost:3000/tienda/admin/productos.html")
  .then(res => {
    console.log("Sin token - Status:", res.status);
    return res.text();
  })
  .then(text => console.log("Sin token - Response:", text))
  .catch(err => console.error("Error:", err));

// ✅ ACCESO CON TOKEN CORRECTO (debería funcionar)
fetch("http://localhost:3000/tienda/admin/productos.html", {
  headers: {
    Authorization: "mi-token-secreto"
  }
})
  .then(res => {
    console.log("Con token - Status:", res.status);
    return res.text();
  })
  .then(text => console.log("Con token - Response length:", text.length, "bytes"))
  .catch(err => console.error("Error:", err));

// ✅ ACCESO AL FRONTEND (siempre funciona, sin protección)
fetch("http://localhost:3000/tienda/frontend/pagina.html")
  .then(res => {
    console.log("Frontend - Status:", res.status);
    return res.text();
  })
  .then(text => console.log("Frontend - Response length:", text.length, "bytes"))
  .catch(err => console.error("Error:", err));
