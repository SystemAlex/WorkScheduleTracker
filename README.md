# WorkScheduleTracker

**WorkScheduleTracker** es una aplicación web full-stack para la gestión de turnos laborales, empleados, posiciones y clientes dentro de una organización. Su objetivo es proporcionar una solución moderna, intuitiva y robusta para la planificación de horarios y la administración de recursos humanos, incluyendo capacidades avanzadas de reporte y auto-generación de turnos.

---

## 🚀 Descripción General

WorkScheduleTracker permite:

- Visualizar y administrar turnos en una vista de calendario (mensual, semanal y diaria).
- Gestionar empleados, departamentos y posiciones, incluyendo borrado suave para mantener la integridad de los datos históricos.
- **NUEVO:** Administrar clientes con información detallada y sus puestos asociados.
- Configurar distintos tipos de turnos y plantillas.
- Generar reportes de horas trabajadas y análisis de programación, con opciones de exportación a **CSV, XLSX y PDF**.
- **NUEVO:** Auto-generar turnos para el mes actual basándose en la programación del mes anterior.
- Organizar la estructura de la empresa mediante un organigrama visual.
- Diseño completamente responsivo para una experiencia óptima en cualquier dispositivo.

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
- **UI:** Componentes personalizados con Radix UI y Tailwind CSS (utilizando `shadcn/ui`)
- **Formularios:** React Hook Form + Zod para validación
- **Build tool:** Vite para desarrollo y producción
- **Utilidades de Fecha:** `date-fns`

### Backend

- **Runtime:** Node.js con Express.js
- **Lenguaje:** TypeScript (ESM)
- **ORM:** Drizzle ORM (type-safe)
- **Base de datos:** PostgreSQL (Neon serverless compatible)
- **API:** Endpoints RESTful con manejo de errores y validación, incluyendo detección de conflictos de turnos.
- **Documentación:** Swagger disponible en `/api/docs`
- **Generación de Reportes:** `exceljs` para XLSX y `pdfkit` para PDF.

### Esquema de Base de Datos

- **employees:** Información principal del empleado, con seguimiento de estado (activo/inactivo).
- **positions:** Puestos de trabajo, departamentos y asociación con clientes.
- **shifts:** Asignaciones de turnos relacionando empleados, puestos y tipos de turno.
- **clientes:** Información de los clientes de la organización.

---

## 🔑 Componentes Principales

- **Gestión de Datos:** Interfaz de almacenamiento abstracta, validación con Zod y tipado TypeScript end-to-end. Implementación de borrado suave para clientes, puestos y empleados.
- **Interfaz de Usuario:** Calendario interactivo con vistas por mes, semana y día; CRUD de empleados, gestión de posiciones y tipos de turno, **gestión de clientes**, reportería avanzada con exportación y organigrama visual.
- **API REST:** Endpoints para empleados (`/api/employees`), posiciones (`/api/positions`), turnos (`/api/shifts`), clientes (`/api/clientes`) y reportes (`/api/reports`).

---

## 🔄 Flujo de Datos

1.  El frontend solicita datos usando React Query.
2.  El backend Express valida y procesa las solicitudes.
3.  La lógica de negocio accede a la base usando Drizzle ORM.
4.  Las respuestas se devuelven en JSON, con validación y feedback.
5.  El frontend maneja el cache y actualizaciones optimistas.

---

## ⚙️ Dependencias Principales

- **@neondatabase/serverless:** Conectividad PostgreSQL
- **drizzle-orm:** ORM type-safe
- **@tanstack/react-query:** Manejo de datos del servidor
- **react-hook-form + zod:** Formularios y validación
- **@radix-ui/\*** y **tailwindcss:** UI accesible y diseño
- **vite, tsx, esbuild, drizzle-kit:** Herramientas de desarrollo y migraciones
- **exceljs:** Generación de archivos XLSX
- **pdfkit:** Generación de archivos PDF
- **date-fns:** Utilidades de fecha y hora

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

- Puestos: Recepcionista, Seguridad, Limpieza, Administrativo, Mantenimiento, etc.
- Tipos de turno: Mañana (06:00-14:00), Tarde (14:00-22:00), Noche, etc.
- Empleados de ejemplo.
- **NUEVO:** Clientes de ejemplo con puestos asociados.

Puedes usar `server/seed.ts` para datos predefinidos o `server/seed_custom.ts` para datos más genéricos.

---

## 📄 Licencia

Este proyecto está bajo la licencia MIT. Consulta el archivo [`LICENSE.txt`](LICENSE.txt) para más información.

---

## ✨ Changelog

- **2025-07-15:** Implementación de exportación de reportes a XLSX y PDF desde el backend.
- **2025-07-10:** Añadida funcionalidad de auto-generación de turnos para el mes actual basándose en la programación del mes anterior.
- **2025-07-05:** Introducción de la gestión de clientes (CRUD) en frontend y backend, incluyendo lógica de borrado suave para clientes y puestos.
- **2025-06-30:** Mejoras en la vista de calendario con modos de visualización por semana y día, y detección de conflictos de turnos al crear/editar.
- **2025-06-25:** Implementación de borrado suave para empleados (cambio de estado a 'inactivo').
- **2025-06-18:** Setup inicial del proyecto con gestión de empleados, puestos y turnos básicos.

---

## 🤝 Contribuciones

Pull requests y sugerencias son bienvenidas. ¡No dudes en abrir issues para mejoras o reportes de bugs!
