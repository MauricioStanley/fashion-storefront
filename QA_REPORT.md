# Verificación de entrega

Revisión local del 15 de septiembre de 2026. Navegador: Microsoft Edge/Chromium en Windows. Las pruebas y capturas son reproducibles con los comandos del README.

## Resultado

- `npm run build`: correcto, sin errores de TypeScript.
- `npm run test:e2e`: correcto; 24 comprobaciones funcionales/accesibles y seis anchuras responsive.
- Anchuras: 360, 390, 430, 768, 1024 y 1440 px. Sin desbordamiento horizontal en ninguna.
- Capturas revisadas de escritorio, tablet y móvil, incluyendo página completa, hero, bolsa y personalizador móvil.
- Cero errores de ejecución del navegador en los flujos probados.
- Axe: cero infracciones WCAG A/AA detectadas en la página de escritorio y el diálogo del personalizador móvil revisados. No sustituye una auditoría manual exhaustiva con lectores de pantalla.
- Lighthouse de producción: rendimiento 95 móvil / 96 escritorio; accesibilidad 100, buenas prácticas 100 y SEO 100 en ambas modalidades. Son resultados locales de una ejecución, sujetos al dispositivo y las condiciones de medición.
- Auditoría npm tras actualizar las herramientas: cero vulnerabilidades reportadas.

## Interacciones comprobadas

Refinamiento de escritorio: cabecera fija y bolsa accesible tras hacer scroll, sugerencias en bolsa vacía, recuperación de búsquedas sin resultados, contención del foco con Tab en diálogos, validación de correo y medidas antes de enviar, corrección inmediata del estado inválido y admisión de coma decimal. La captura del hero a 390 px conserva exactamente los mismos píxeles que antes del refinamiento. Las notificaciones móviles se separaron del CTA inferior para evitar solapamientos.

Filtros por categoría y talla, cambio de archivos entre vistas, favoritos, búsqueda, cierre con Escape, talla obligatoria, combinación agotada, alternativa disponible, precio por corte, añadir a bolsa, cantidades, persistencia tras recargar, resumen de selección sin pago, diseños guardados, guía de tallas con error y éxito, correo inválido/válido, drawer móvil y CTA sticky, navegación móvil, movimiento reducido, recuperación de localStorage corrupto y carga/error/reintento de fotografías.

## Evidencias generadas

- `artifacts/verification.json`
- `artifacts/full-{ancho}.png` y `artifacts/hero-{ancho}.png`
- `artifacts/cart-desktop.png`
- `artifacts/customizer-mobile.png`
- `artifacts/desktop-catalog-refined.png`, `artifacts/desktop-atelier-refined.png` y `artifacts/desktop-validation-refined.png`
- `artifacts/mobile-hero-before-refinement.png` como referencia de regresión visual
- `artifacts/loading-mobile.png` y `artifacts/error-mobile.png`
- `artifacts/lighthouse-mobile.html` y `artifacts/lighthouse-desktop.html`, con JSON equivalentes.

## Límites de verificación

No se han probado dispositivos físicos, Safari/iOS, Firefox, sincronización multiventana ni servicios comerciales externos. No existe backend ni pago. Las fotografías pendientes de variantes y vistas comerciales exactas están documentadas en IMAGE_CREDITS.md y señaladas en el personalizador.
