# Configuración de Genesys Cloud Messenger

El snippet de deployment proporcionado está integrado una sola vez en `index.html` y también disponible en `GENESYS_SNIPPET.html`.

- Environment: `prod-usw2`
- Bootstrap regional: `https://apps.usw2.pure.cloud/genesys-bootstrap/genesys.min.js`
- Deployment ID: `2e9f24de-f485-4627-b74e-2813a06ab595`

La demo se suscribe a `Messenger.ready` y `Database.ready`. Cuando la persona acepta ayuda, envía primero el contexto de la cotización (`journeyStep`, fricción, vehículo, ciudad, plan, estimación y siguiente mejor acción) mediante `Database.set`, y luego intenta abrir Messenger con hasta tres intentos. Si Messenger no queda listo, presenta una alternativa visual y conserva la cotización.

El dominio de publicación debe estar permitido por la configuración de este deployment. La disponibilidad real depende de que el deployment, su configuración de Messenger y su flujo estén activos en Genesys Cloud.
