# 🏢 GECIT - Frontend App
**Angular • TypeScript • RxJS • Canvas API • Docker • Nginx**

¡Bienvenido a la interfaz de usuario de **GECIT** (Gestión de Espacios y Citas de Innovasur)! Este repositorio contiene la aplicación cliente construida con Angular, diseñada para ofrecer una experiencia fluida, responsiva y ultra moderna en la administración de espacios de trabajo, reserva de mesas y gestión de turnos de entidades u oficinas.

El objetivo de este frontend es proporcionar un panel de administración hiper-intuitivo para empleados y administradores, además de un portal ciudadano accesible y elegante, conectando directamente con la API RESTful para reflejar los datos en tiempo real.

---

## 🚀 Características Principales
- **Diseño Responsivo y Moderno**: Interfaz pulida y altamente interactiva (glassmorphism, micro-animaciones, variables CSS globales), adaptándose perfectamente a dispositivos móviles, tablets y de escritorio.
- **Diseñador de Planos Visual (Canvas)**: Integración nativa con Canvas API para arrastrar, soltar y diseñar de forma 100% visual la distribución de las mesas en las salas de oficina de la empresa.
- **Gestión de Estado Reactiva**: Uso intensivo de **RxJS** para manejar flujos de datos asíncronos y actualizaciones en tiempo real (como recepción de llamadas a turnos de atención).
- **Seguridad Integrada**: Implementación de Guards (AuthGuard) e Interceptors (JwtInterceptor) para proteger rutas administrativas y adjuntar tokens de autenticación en las cabeceras automáticamente.
- **Panel de Administración Inteligente**: Dashboard completo con gráficos avanzados y analíticas que visualizan estadísticas globales, ocupación y ausencias de forma dinámica.
- **Flujo de Reservas Completo**: Calendarios reactivos que calculan y exponen los huecos libres exactos basándose en el cuadrante, ausencias y competencias de cada empleado.

---

## 🛠️ Arquitectura y Construcción
Este proyecto sigue las mejores prácticas arquitectónicas de Angular, aislando la lógica de negocio y favoreciendo la reutilización de código.

### 1. Módulos y Componentes (Features)
La aplicación está organizada funcionalmente:
- **Landing / Público**: Páginas de bienvenida, selección pública de citas y registro en quioscos físicos.
- **Auth**: Gestión de credenciales, autenticación JWT y primer cambio de contraseña.
- **Dashboard**: Panel principal con widgets y métricas.
- **Módulos de Gestión (CRUDs)**: Interfaces dedicadas para Usuarios, Entidades, Salas, Mesas, Ausencias, Citas y Roles.

### 2. Servicios (Services)
La capa de comunicación con el Backend.
- **ApiService**: Servicio genérico inyectable que actúa como base HTTP para encapsular peticiones estándar.
- **AuthService**: Guarda el token en memoria/local y maneja roles y autenticación.
- **SalasService, UsuariosService, etc.**: Repositorios del frontend dedicados a peticiones específicas de entidades de negocio.

### 3. Seguridad y Navegación
- **AuthGuard**: Protege las rutas internas redirigiendo al login si la sesión caducó o el usuario no tiene los privilegios adecuados.
- **JwtInterceptor**: Inyecta dinámicamente en el Header `Authorization` el Token JWT antes de que la petición abandone el cliente.

### 4. Modelos y Tipado (Models & Adapters)
- Definición rigurosa de Interfaces en TypeScript para prevenir errores en tiempo de ejecución.
- Respuestas estructuradas adaptadas para paginación global y metadatos de las peticiones REST.

---

## 📦 Instalación y Desarrollo
¿Quieres levantar el cliente en tu entorno local para hacer modificaciones? Sigue estos pasos:

1. **Clona el repositorio**:
   ```bash
   git clone <URL_DEL_REPOSITORIO>/gecit-frontend.git
   cd gecit-frontend
   ```

2. **Instala las dependencias**: 
   Asegúrate de contar con Node.js 18+ o 20+.
   ```bash
   npm install --legacy-peer-deps
   ```

3. **Ejecuta la aplicación**: 
   Levanta el servidor en entorno de desarrollo.
   ```bash
   npm run start
   ```

¡Listo! La aplicación estará disponible y observando cambios en: `http://localhost:4200`

---

## 🏗️ Construcción para Producción (Dockerizado)
Para desplegar la aplicación en un entorno real y altamente eficiente, el proyecto cuenta con un `Dockerfile` multietapa (Multi-stage) optimizado con **Nginx**:

```bash
docker build -t gecit-frontend .
docker run -d -p 80:80 gecit-frontend
```

Esto compilará (`ng build --configuration production`) tu código y lo expondrá sirviendo de manera nativa y extremadamente veloz los ficheros estáticos HTML, JS y CSS en el **puerto 80**.

---

<p align="center">
  Desarrollado con ❤️ para el Reto Innovasur y mi Trabajo de Final de Grado de Desarrollo de Aplicaciones Web.
</p>
