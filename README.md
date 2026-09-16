# Tu Marca — storefront de moda

Prototipo frontend en español, independiente de marca. React 19, TypeScript, Vite y CSS propio; iconos Lucide y fuentes locales DM Sans / Newsreader. No utiliza un kit visual. El concepto original permanece intacto.

## Ejecutar

Requiere Node.js 22.19+ para ejecutar también todas las herramientas de auditoría incluidas.

```powershell
cd C:\Users\stanl\vsc.cursito\FASHION_STOREFRONT_APP
npm install
npm run dev
```

Abrir http://127.0.0.1:5173. Para producción:

```powershell
npm run build
npm run preview
```

El resultado estático está en `dist`. No hace falta conexión a Pexels, fuentes remotas ni servicios de comercio para navegar.

## Incluye

- Hero editorial, colección bento, atelier personalizable, confianza/guía de tallas, sección móvil interactiva y cierre editorial.
- Búsqueda y filtros por categoría, destinatario, color, talla, precio, disponibilidad y favoritos; seis prendas de ejemplo.
- Vistas de prendas/modelos, elección de color, tela, corte y talla, precios derivados y combinaciones agotadas.
- Favoritos, diseños guardados, bolsa con cantidades, límites de stock, eliminar/deshacer y persistencia validada en localStorage.
- Drawers, menú móvil, navegación inferior y CTA contextual sticky para el atelier.
- Cabecera persistente en escritorio/tablet, bolsa identificada, escala de controles ampliada, filtros removibles, recomendaciones en estados vacíos y mensajes con acciones de recuperación.
- Validación inmediata de correo y medidas, foco contextual, teclado apropiado y admisión de decimales con coma o punto.
- Fotos con carga real, recuperación de error, confirmaciones, validaciones, estados vacíos y resumen de selección sin compra real.
- Diálogos modales nativos, foco visible, Escape, teclado, mensajes accesibles y soporte para movimiento reducido.
- Fotografías Pexels locales, WebP responsivo, tamaños reservados y fuentes autoalojadas.

## Comprobar

Con el servidor de desarrollo en ejecución:

```powershell
npm run test:e2e
```

Usa Microsoft Edge instalado en Windows mediante Playwright. Revisa 360, 390, 430, 768, 1024 y 1440 px, genera capturas en `artifacts`, comprueba flujos de compra de demostración y ejecuta axe. La configuración de navegador se puede cambiar en `scripts/verify.mjs` si Edge no está instalado.

```powershell
npm run build
npm run audit:ui
```

Lighthouse revisa la compilación de producción en 5174 y guarda informes HTML/JSON. Usa Edge de Windows; `CHROME_PATH` permite indicar otro Chromium compatible. Los informes son diagnósticos locales, no una garantía universal de rendimiento ni una certificación de accesibilidad.

## Arquitectura e integración posterior

- `src/data.ts`: tipos, catálogo, variantes, precios, stock y validación de persistencia. Sustituir estos datos por un adaptador de Shopify, WooCommerce o API propia.
- `src/hooks.ts`: persistencia y revelado progresivo.
- `src/components`: catálogo, personalizador y primitivas visuales reutilizables.
- `src/App.tsx`: composición y acciones de la tienda.
- `src/styles.css`: tokens de diseño, layout y responsive.
- `src/refinements.css`: evolución de escritorio y mejoras transversales de interacción, conservando la composición móvil.
- `src/validation.ts`: validaciones de formularios compartidas entre edición y envío.
- `scripts/assets.mjs`: descarga y optimización reproducible de las fuentes documentadas.

Antes de conectar comercio real, trasladar precios/stock definitivos al servidor, mapear las configuraciones a IDs reales de variante y utilizar el checkout seguro del proveedor. Nunca confiar en localStorage para precios o disponibilidad comercial.

## Límites deliberados del prototipo

No hay backend, cuenta de usuario, pagos, pedidos, cálculo real de envío ni suscripción. El formulario de correo solo valida el formato y no guarda ni envía el dato. La bolsa usa inventario local de demostración y moneda USD; no incluye impuestos ni envío. La guía de tallas es orientativa para prendas superiores, no una medición personalizada.

Las fotografías son reales, pero ilustrativas: no representan un catálogo comercial del mismo SKU en todos los ángulos. Las variantes sin fotografía mantienen una referencia claramente identificada y muestran una muestra de material/color; no simulan una prueba virtual ni prometen una imagen exacta. Consultar `IMAGE_CREDITS.md` para fotógrafo, página original, licencia y sustituciones pendientes.

Los datos se conservan solo en el navegador actual. El sitio informa si el almacenamiento no está disponible y recupera valores corruptos. El catálogo y los textos legales/operativos deben adaptarse antes de publicar una tienda real.
