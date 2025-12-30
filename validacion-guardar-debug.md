# 🔍 DEBUG PARA VALIDACIÓN AL GUARDAR - CAMPOS OBLIGATORIOS

## 🚨 Problema Actual

**Error:** "Revisa nombre, precio y stock" al guardar un producto editado
**Contexto:** El usuario editó un producto, quitó la oferta (marcó "No" y borró el precio de oferta)

## ✅ Logs Mejorados Agregados

He agregado logs extremadamente detallados para identificar exactamente qué valores están llegando y por qué falla la validación:

```javascript
saveBtn.addEventListener("click", async () => {
  // Debug: verificar elementos del DOM
  console.log("=== DEBUG ELEMENTOS DOM ===");
  console.log("productIdInput:", productIdInput);
  console.log("nombreInput:", nombreInput);
  console.log("precioInput:", precioInput);
  console.log("stockInput:", stockInput);
  console.log("enOfertaSelect:", enOfertaSelect);
  console.log("precioOfertaInput:", precioOfertaInput);
  console.log("disponibleSelect:", disponibleSelect);
  console.log("productIdInput.value:", productIdInput.value);
  console.log("nombreInput.value:", nombreInput.value);
  console.log("precioInput.value:", precioInput.value);
  console.log("stockInput.value:", stockInput.value);
  console.log("enOfertaSelect.value:", enOfertaSelect.value);
  console.log("precioOfertaInput.value:", precioOfertaInput.value);
  console.log("disponibleSelect.value:", disponibleSelect.value);
  console.log("=== FIN DEBUG DOM ===");

  const id = productIdInput.value;
  const nombre = nombreInput.value.trim();
  const precio = parseFloat(precioInput.value);
  const stock = parseInt(stockInput.value, 10);
  const disponible = disponibleSelect.value;
  const en_oferta = enOfertaSelect.value;
  const precio_oferta = precioOfertaInput.value || null;

  // Debug: mostrar valores actuales
  console.log("=== DEBUG GUARDAR ===");
  console.log("ID:", id);
  console.log("Nombre (raw):", nombreInput.value);
  console.log("Nombre (trim):", nombre);
  console.log("Precio (raw):", precioInput.value);
  console.log("Precio (parseFloat):", precio);
  console.log("Stock (raw):", stockInput.value);
  console.log("Stock (parseInt):", stock);
  console.log("Disponible:", disponible);
  console.log("En oferta:", en_oferta);
  console.log("Precio oferta (raw):", precioOfertaInput.value);
  console.log("Precio oferta (processed):", precio_oferta);
  console.log("¿Nombre vacío?", !nombre);
  console.log("¿Nombre es string vacío?", nombre === "");
  console.log("¿Precio inválido?", !isFinite(precio) || precio <= 0);
  console.log("¿Precio es NaN?", isNaN(precio));
  console.log("¿Stock inválido?", !Number.isInteger(stock) || stock < 0);
  console.log("¿Stock es NaN?", isNaN(stock));
  console.log("=== FIN DEBUG ===");

  if (!nombre || !isFinite(precio) || precio <= 0 || !Number.isInteger(stock) || stock < 0) {
    console.log("VALIDACIÓN FALLIDA - Detalles:");
    console.log("- Nombre inválido:", !nombre);
    console.log("- Precio inválido:", !isFinite(precio) || precio <= 0);
    console.log("- Stock inválido:", !Number.isInteger(stock) || stock < 0);
    showToast("Revisa nombre, precio y stock", "error");
    return;
  }
});
```

## 🔍 Qué Buscar en los Logs

### **✅ Para Probar y Ver Logs:**

1. **Sube los cambios:**
   ```bash
   git add .
   git commit -m "Debug: agregar logs detallados para validación al guardar"
   git push
   ```

2. **Abre la consola del navegador** (F12)

3. **Edita un producto** y haz los cambios que mencionaste:
   - Marca "En oferta" como "No"
   - Borra el precio de oferta
   - No toques nombre, precio ni stock

4. **Intenta guardar** y revisa los logs

### **✅ Logs Esperados si Funciona Correctamente:**
```
=== DEBUG ELEMENTOS DOM ===
productIdInput.value: "1"
nombreInput.value: "Producto existente"
precioInput.value: "25.99"
stockInput.value: "10"
enOfertaSelect.value: "0"
precioOfertaInput.value: ""
disponibleSelect.value: "1"
=== FIN DEBUG DOM ===

=== DEBUG GUARDAR ===
ID: "1"
Nombre (raw): "Producto existente"
Nombre (trim): "Producto existente"
Precio (raw): "25.99"
Precio (parseFloat): 25.99
Stock (raw): "10"
Stock (parseInt): 10
En oferta: "0"
Precio oferta (raw): ""
Precio oferta (processed): null
¿Nombre vacío?: false
¿Precio inválido?: false
¿Stock inválido?: false
=== FIN DEBUG ===
```

### **❌ Logs si Hay Problema (Ejemplos):**

#### **Caso 1: Nombre vacío**
```
Nombre (raw): ""
Nombre (trim): ""
¿Nombre vacío?: true
VALIDACIÓN FALLIDA - Detalles:
- Nombre inválido: true
```

#### **Caso 2: Precio inválido**
```
Precio (raw): ""
Precio (parseFloat): NaN
¿Precio es NaN?: true
¿Precio inválido?: true
VALIDACIÓN FALLIDA - Detalles:
- Precio inválido: true
```

#### **Caso 3: Stock inválido**
```
Stock (raw): ""
Stock (parseInt): NaN
¿Stock es NaN?: true
¿Stock inválido?: true
VALIDACIÓN FALLIDA - Detalles:
- Stock inválido: true
```

## 🎯 Problemas Específicos con tu Cambio

### **✅ Cambio que hiciste:**
- Marcaste "En oferta" como "No" → `enOfertaSelect.value = "0"`
- Borraste precio de oferta → `precioOfertaInput.value = ""`

### **✅ Esto NO debería afectar la validación porque:**
- La validación solo revisa: `nombre`, `precio`, `stock`
- `precio_oferta` y `en_oferta` no están en la validación principal
- Los campos obligatorios siguen siendo los mismos

### **✅ Pero podría haber un problema si:**
- Al cambiar "En oferta" a "No", somehow se afectan otros campos
- Hay algún JavaScript que resetea campos cuando cambias el select
- El formulario se está reseteando inesperadamente

## 🚀 Pasos para Diagnosticar

### **✅ Paso 1: Subir y Probar**
```bash
git add .
git commit -m "Debug: agregar logs detallados para validación al guardar"
git push
```

### **✅ Paso 2: Reproducir el Problema**
1. **Edita un producto**
2. **Cambia "En oferta" a "No"**
3. **Borra el precio de oferta**
4. **Intenta guardar**
5. **Copia los logs** que aparecen

### **✅ Paso 3: Analizar los Logs**
Pega aquí los logs y te diré exactamente:
- **Qué campo está fallando**
- **Por qué está vacío o inválido**
- **Cómo solucionarlo**

## 🏆 Resultado Esperado

**✅ DIAGNÓSTICO CLARO:**

- **✅ Logs completos**: Muestra valores raw y procesados
- **✅ Validación detallada**: Indica exactamente qué falla
- **✅ Contexto completo**: Todos los elementos del DOM verificados
- **✅ Solución específica**: Según lo que muestren los logs

**🎉 Con estos logs podremos identificar exactamente por qué la validación está fallando cuando quitas la oferta. Sube los cambios, reproduce el problema y pega aquí los logs para analizarlos.** 🚀
