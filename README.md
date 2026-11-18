# SBS Seguros · rescate de cotización

Demo web responsive del journey de seguro de auto para SBS Seguros Colombia. Simula captura de datos básicos del vehículo, comparación de tres planes y carrito de cotización persistente.

## Ejecutar

Abre `index.html` en un navegador o ejecuta `python server.py` y visita `http://localhost:8000`.

## Publicar en GitHub Pages

El workflow `.github/workflows/pages.yml` publica el sitio automáticamente al hacer push a `main`. En el repositorio, ve a **Settings > Pages** y elige **GitHub Actions** como origen. El sitio será público en `https://<usuario>.github.io/<repositorio>/`.

Para que aparezca Messenger, autoriza el origen `https://<usuario>.github.io` en la configuración del deployment de Genesys. GitHub Pages sirve el bootstrap regional del snippet por HTTPS; el widget solo se mostrará cuando Genesys permita ese dominio y el flujo esté activo.

## Journey

1. Ingresa marca, modelo, año y ciudad del vehículo.
2. Revisa los planes Esencial, Plus e Integral. Precios y coberturas son ilustrativos.
3. Deja la pantalla inactiva durante 18 segundos o cambia de pestaña para activar el rescate contextual.
4. Retoma la cotización guardada o solicita ayuda.

El estado se conserva en `localStorage`. Usa `?reset=1` o «Reiniciar demo» para comenzar de nuevo. No se emite una póliza ni se recogen datos personales sensibles.

## Genesys

El snippet proporcionado ya está integrado en `index.html` y está disponible en `GENESYS_SNIPPET.html`. La demo envía contexto de producto, vehículo, etapa y fricción antes de abrir Messenger. La conexión en vivo requiere que el deployment esté activo y que el dominio de prueba esté autorizado.

## Modern Web Guidance

La skill de Google Chrome quedó instalada a nivel del proyecto en `.agents/skills/modern-web-guidance`. La interfaz aplica mejoras de responsive design, formulario accesible, foco entre pasos y diálogo nativo para el rescate.

## Datos y límites

SBS Seguros publica categorías de seguros que incluyen autos en su sitio oficial. Esta experiencia es una propuesta de demostración, no una réplica del sitio ni una cotización comercial. Los valores, coberturas y flujo del asesor son simulados.
