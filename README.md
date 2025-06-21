# WorkScheduleTracker

**WorkScheduleTracker** es una aplicación web full-stack para la gestión de turnos laborales, empleados y posiciones dentro de una organización. Su objetivo es proporcionar una solución moderna, intuitiva y robusta para la planificación de horarios y la administración de recursos humanos.

---

## 🚀 Descripción General

WorkScheduleTracker permite:

- Visualizar y administrar turnos en una vista de calendario.
- Gestionar empleados, departamentos y posiciones.
- Configurar distintos tipos de turnos y plantillas.
- Generar reportes de horas trabajadas y análisis de programación.
- Organizar la estructura de la empresa mediante un organigrama visual.

La aplicación cuenta con un frontend moderno desarrollado en React + TypeScript y un backend Node.js/Express, utilizando una base de datos PostgreSQL.

---

## 🌐 Demo en Producción

WorkScheduleTracker está desplegado en un servidor AWS EC2 y puedes probarlo en el siguiente enlace:

👉 **[https://systemalex.cbu.net/vipsrl/](https://systemalex.cbu.net/vipsrl/)**

---

## 🏗️ Arquitectura del Sistema

### Frontend

- **Framework:** React 18 + TypeScript
- **Routing:** Wouter (routing ligero en el cliente)
- **Gestión de estado:** TanStack React Query para datos del servidor
- **UI:** Componentes personalizados con Radix UI y Tailwind CSS
- **Formularios:** React Hook Form + Zod para validación
- **Build tool:** Vite para desarrollo y producción

### Backend

- **Runtime:** Node.js con Express.js
- **Lenguaje:** TypeScript (ESM)
- **ORM:** Drizzle ORM (type-safe)
- **Base de datos:** PostgreSQL (Neon serverless compatible)
- **API:** Endpoints RESTful con manejo de errores y validación
- **Documentación:** Swagger disponible en `/api/docs`

### Esquema de Base de Datos

- **employees:** Información principal del empleado, con seguimiento de estado
- **positions:** Puestos de trabajo y departamentos
- **shiftTypes:** Plantillas de turno configurables (horarios, colores)
- **shifts:** Asignaciones de turnos relacionando empleados, puestos y tipos de turno

---

## 🔑 Componentes Principales

- **Gestión de Datos:** Interfaz de almacenamiento abstracta, validación con Zod y tipado TypeScript end-to-end.
- **Interfaz de Usuario:** Calendario, CRUD de empleados, gestión de posiciones y tipos de turno, reportería y organigrama.
- **API REST:** Endpoints para empleados (`/api/employees`), posiciones, tipos de turno, turnos y reportes.

---

## 🔄 Flujo de Datos

1. El frontend solicita datos usando React Query.
2. El backend Express valida y procesa las solicitudes.
3. La lógica de negocio accede a la base usando Drizzle ORM.
4. Las respuestas se devuelven en JSON, con validación y feedback.
5. El frontend maneja el cache y actualizaciones optimistas.

---

## ⚙️ Dependencias Principales

- **@neondatabase/serverless:** Conectividad PostgreSQL
- **drizzle-orm:** ORM type-safe
- **@tanstack/react-query:** Manejo de datos del servidor
- **react-hook-form + zod:** Formularios y validación
- **@radix-ui/\*** y **tailwindcss:** UI accesible y diseño
- **vite, tsx, esbuild, drizzle-kit:** Herramientas de desarrollo y migraciones

---

## 🚦 Estrategia de Despliegue

### Desarrollo

- `npm run dev` inicia frontend y backend en modo desarrollo (puerto 5000)
- Requiere la variable de entorno `DATABASE_URL` para conexión PostgreSQL

### Producción

- `vite build` compila el frontend
- `esbuild` empaqueta el backend
- `npm run start` inicia el servidor de producción

### Migraciones y gestión de la base

- Definición de esquema en `shared/schema.ts`
- Migraciones con `npm run db:push`

---

## 📊 Ejemplo de Seed y Datos

El proyecto incluye scripts de seed para poblar la base de datos con:

- Puestos: Recepcionista, Seguridad, Limpieza, Administrativo, Mantenimiento
- Tipos de turno: Mañana (06:00-14:00), Tarde (14:00-22:00)

---

## 📄 Licencia

Este proyecto **aún no tiene un archivo LICENSE.txt**. Se recomienda agregar una licencia (por ejemplo, MIT, Apache 2.0, GPL) para clarificar los términos de uso y distribución.

---

## ✨ Changelog

- 18 de junio de 2025: Setup inicial

---

## 🤝 Contribuciones

Pull requests y sugerencias son bienvenidas. ¡No dudes en abrir issues para mejoras o reportes de bugs!
