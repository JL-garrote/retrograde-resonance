# Aura Chat

Aplicación de chat con IA (Google Gemini) con autenticación propia, historial de conversaciones persistente y una interfaz oscura estilo Material Design 3. El repositorio contiene el **frontend** (Astro); consume una API REST separada (**Spring Boot**) que maneja usuarios, conversaciones, mensajes y la integración con Gemini.

## Características

### Autenticación
- Registro e inicio de sesión con email y contraseña (hash con BCrypt en el backend).
- Sesión basada en **JWT**: access token de corta duración + refresh token persistido en base de datos.
- Renovación automática del access token cuando expira (interceptor transparente en el cliente HTTP).
- Cierre de sesión que revoca el refresh token en el servidor.
- Formulario único con pestañas animadas **Login / Sign Up**, validación de campos, mostrar/ocultar contraseña y mensajes de error del servidor.

### Chat
- Conversaciones múltiples por usuario, cada una con su propio historial.
- Crear una conversación nueva desde cero o automáticamente al enviar el primer mensaje (el título se genera a partir del texto).
- Envío de mensajes con respuesta generada por **Gemini**, usando el historial completo de la conversación como contexto.
- Indicador de "escribiendo" mientras se espera la respuesta del modelo.
- **Exportar conversación** a un archivo `.txt` descargable.
- **Limpiar contexto**: borra el historial de mensajes de la conversación actual (con confirmación).
- Sidebar de conversaciones recientes con **búsqueda/filtro en vivo** por título.
- Estado vacío y manejo de errores de red visibles en la interfaz (no solo en consola).

### Cuenta y UI
- Menú desplegable en la foto de perfil (header) para cerrar sesión.
- Panel de notificaciones (placeholder honesto: no hay backend de notificaciones todavía).
- Diseño responsive, tema oscuro, tipografía y paleta de colores basada en tokens de Material Design 3, implementado con Tailwind.

### Seguridad
- Contraseñas nunca se guardan ni se comparan en texto plano.
- Cada endpoint de conversaciones/mensajes valida que el recurso pertenezca al usuario autenticado antes de exponerlo.
- CORS restringido a los orígenes del frontend.

## Stack técnico

**Frontend** (este repo)
- [Astro](https://astro.build/) 7 (SSG, sin framework de UI adicional)
- TypeScript en modo `strict`
- Tailwind CSS (vía CDN, con tema custom en [`Layout.astro`](src/layouts/Layout.astro))
- JavaScript vanilla para la interactividad (sin React/Vue/Svelte)

**Backend** (repo separado, no incluido acá)
- Spring Boot 4 / Java 25
- MySQL vía `JdbcTemplate` (sin ORM)
- JWT (`jjwt`) para access y refresh tokens
- `spring-security-crypto` (BCrypt) para hashing de contraseñas
- Spring WebFlux `WebClient` para consumir la API de Gemini

## Estructura del proyecto

```
src/
├─ components/
│  ├─ Header.astro          # barra superior: logo, búsqueda, notificaciones, menú de perfil
│  ├─ ChatRecientes.astro   # sidebar de conversaciones
│  ├─ ChatIA.astro          # panel de chat: mensajes, input, exportar/limpiar
│  └─ AuthCard.astro        # formulario de login / registro
├─ layouts/
│  └─ Layout.astro          # <head> compartido (fuentes, config de Tailwind)
├─ lib/
│  └─ api.ts                # cliente HTTP: auth, tokens, conversaciones, mensajes
└─ pages/
   ├─ index.astro           # chat (protegido, redirige a /login sin sesión)
   └─ login.astro           # autenticación
```

## Puesta en marcha

### Requisitos
- Node.js ≥ 22.12
- La API backend corriendo (por defecto en `https://chatbot-kzkr.onrender.com`)

### Configuración
Creá un archivo `.env` en la raíz (ver `.env` existente como referencia):

```
PUBLIC_API_URL=https://chatbot-kzkr.onrender.com
```

### Comandos

| Comando           | Acción                                      |
| ------------------ | -------------------------------------------- |
| `npm install`       | Instala las dependencias                     |
| `npm run dev`        | Levanta el servidor de desarrollo (`localhost:4321`) |
| `npm run build`       | Genera el sitio estático en `./dist/`        |
| `npm run preview`      | Sirve el build de producción localmente      |

## Endpoints consumidos de la API

| Método | Ruta | Descripción |
| --- | --- | --- |
| `POST` | `/registro` | Crea un usuario nuevo |
| `POST` | `/login` | Autentica y devuelve `accessToken` + `refreshToken` |
| `POST` | `/refresh` | Renueva el `accessToken` |
| `POST` | `/logout` | Revoca el `refreshToken` |
| `GET` | `/api/conversaciones` | Lista las conversaciones del usuario |
| `POST` | `/api/conversaciones` | Crea una conversación |
| `GET` | `/api/conversaciones/{id}/mensajes` | Lista los mensajes de una conversación |
| `POST` | `/api/conversaciones/{id}/mensajes` | Envía un mensaje y obtiene la respuesta de Gemini |
| `DELETE` | `/api/conversaciones/{id}/mensajes` | Limpia el historial de mensajes |

Todas las rutas bajo `/api/**` requieren el header `Authorization: Bearer <accessToken>`.

## Pendiente / fuera de alcance actual

- Notificaciones reales: el panel existe pero no hay ningún evento que lo alimente.
