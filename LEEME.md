# Dividir la cuenta

Página web para repartir un ticket entre amigos. No se instala: se abre con un enlace.

1. Quien paga crea la cuenta y apunta lo del ticket (a mano o con una foto).
2. Pulsa «Pasar enlace» y lo manda al grupo.
3. Cada uno elige su nombre y toca lo que ha tomado. Si varios tocan el mismo plato, se divide entre ellos.
   Con varias unidades (3 cañas) cada uno indica cuántas tomó con − / +.
   «Para todos» reparte un plato entre todos (pan, agua…).
4. La propina se reparte según lo que ha tomado cada uno.
5. «Enviar resumen al grupo» manda lo que paga cada uno.

## Cómo está hecho
- `index.html` (estilos), `app.js` (pantallas), `calculo.js` (reparto y lectura del ticket, sin dependencias).
- Los datos se guardan en Supabase, tabla `split_bills`, cerrada: solo se accede con las funciones
  `split_create`, `split_get`, `split_save`, `split_mark` y `split_join`, y con el código de la cuenta (va en el enlace).
- La foto se lee en el propio móvil con Tesseract.js; no se envía a ningún sitio.
- Publicado con GitHub Pages desde `main`.
