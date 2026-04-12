# SYSTEM_STATUS.md — IronGYM
> Generado: 2026-04-11 | Actualizado: 2026-04-11 | Estado real del sistema basado en análisis de código fuente

---

## 1. Stack Tecnológico

| Capa | Tecnología | Versión |
|------|-----------|---------|
| Frontend framework | React | 19.2.0 |
| Lenguaje frontend | TypeScript | 5.9 |
| Build tool | Vite | 7.3.1 |
| Router | React Router | 7.13.1 |
| Estilos | TailwindCSS | 4.x |
| Animaciones | Framer Motion | — |
| Gráficos | Recharts | — |
| Iconos | Lucide React | — |
| Backend | PHP (vanilla MVC) | 8.x |
| Base de datos | MySQL | 8.0 |
| Servidor | Docker (`gym-api`) sobre VPS Ubuntu | — |
| Auth | JWT HS256 (24h expiry) | — |
| Deploy frontend | Vercel (auto-deploy desde GitHub) | — |
| Deploy backend | VPS `76.13.163.126:8082` | — |

---

## 2. Arquitectura General

```
[Browser]
   │
   ▼
[Vercel — React SPA]
   │  /api/* → rewrite
   ▼
[VPS 76.13.163.126:8082]
   │
   ▼
[Docker container: gym-api — PHP]
   │
   ▼
[MySQL 8.0 — host (no container) — DB: gym]
```

- **Un único archivo `index.php`** enruta todas las peticiones al controlador correspondiente vía `routes/routes.php`
- **Un única tabla `users`** contiene todos los roles: `owner`, `employee` (trainer), `client`
- El rol `employee` en DB se mapea a `trainer` en el JWT / frontend
- **JWT** se transmite en `Authorization: Bearer <token>` y se valida en cada request protegido
- **Frontend API client** en `src/api/client.ts` centraliza todos los fetch calls
- **Toast system** pub-sub en `src/utils/toast.ts` — sin Context, funciona con event emitter

---

## 3. Rutas del Sistema

### Frontend (React Router)

| Ruta | Componente | Rol requerido |
|------|-----------|---------------|
| `/admin/login` | LoginAdmin | público |
| `/trainer/login` | LoginTrainer | público |
| `/usuario/login` | LoginClient | público |
| `/admin` | AdminDashboard | owner |
| `/admin/trainers` | TrainerManagement | owner |
| `/admin/clients` | ClientManagement | owner |
| `/admin/plans` | MembershipPlans | owner |
| `/admin/payments` | PaymentsCaja | owner |
| `/admin/settings` | GymSettings | owner |
| `/admin/complaints` | Complaints | owner |
| `/entrenador` | TrainerDashboard | trainer |
| `/entrenador/clientes` | MyClients | trainer |
| `/entrenador/clientes/:id` | ClientDetail | trainer |
| `/entrenador/ejercicios` | ExerciseLibrary | trainer |
| `/entrenador/planes` | TrainingPlans | trainer |
| `/entrenador/planes/crear` | PlanBuilder | trainer |
| `/entrenador/planes/:id/editar` | PlanBuilder | trainer |
| `/usuario` | ClientDashboard | client |

### Backend (routes.php)

| Método | Ruta | Controlador::método | Auth |
|--------|------|---------------------|------|
| POST | `/api/auth/login/admin` | AuthController::loginAdmin | No |
| POST | `/api/auth/login/trainer` | AuthController::loginTrainer | No |
| POST | `/api/auth/login/client` | AuthController::loginClient | No |
| GET | `/api/auth/me` | AuthController::me | Sí |
| GET | `/api/clients` | ClientController::index | Sí |
| POST | `/api/clients` | ClientController::store | Sí |
| PUT | `/api/clients/:id` | ClientController::update | Sí |
| DELETE | `/api/clients/:id` | ClientController::destroy | Sí |
| GET | `/api/exercises` | ExerciseController::index | Sí |
| POST | `/api/exercises` | ExerciseController::store | Sí |
| PUT | `/api/exercises/:id` | ExerciseController::update | Sí |
| DELETE | `/api/exercises/:id` | ExerciseController::destroy | Sí |
| GET | `/api/training-plans` | TrainingPlanController::index | Sí |
| POST | `/api/training-plans` | TrainingPlanController::store | Sí |
| PUT | `/api/training-plans/:id` | TrainingPlanController::update | Sí |
| DELETE | `/api/training-plans/:id` | TrainingPlanController::destroy | Sí |
| POST | `/api/training-plans/:id/assign` | TrainingPlanController::assign | Sí |
| GET | `/api/training-plans/:id/days` | TrainingPlanController::getDays | Sí |
| POST | `/api/training-plans/:id/days` | TrainingPlanController::storeDay | Sí |
| PUT | `/api/training-plans/:id/days/:dayId` | TrainingPlanController::updateDay | Sí |
| DELETE | `/api/training-plans/:id/days/:dayId` | TrainingPlanController::destroyDay | Sí |
| GET | `/api/training-plans/:id/days/:dayId/exercises` | TrainingPlanController::getDayExercises | Sí |
| POST | `/api/training-plans/:id/days/:dayId/exercises` | TrainingPlanController::storeDayExercise | Sí |
| PUT | `/api/training-plans/:id/days/:dayId/exercises/:exId` | TrainingPlanController::updateDayExercise | Sí |
| DELETE | `/api/training-plans/:id/days/:dayId/exercises/:exId` | TrainingPlanController::destroyDayExercise | Sí |
| POST | `/api/training-plans/:id/days/:dayId/exercises/reorder` | TrainingPlanController::reorder | Sí |
| GET | `/api/my-plan` | TrainingPlanController::myPlan | Sí |
| GET | `/api/memberships` | MembershipController::index | Sí |
| POST | `/api/memberships` | MembershipController::store | Sí |
| PUT | `/api/memberships/:id` | MembershipController::update | Sí |
| DELETE | `/api/memberships/:id` | MembershipController::destroy | Sí |
| GET | `/api/my-membership` | MembershipController::myMembership | Sí |
| GET | `/api/payments` | PaymentController::index | Sí |
| POST | `/api/payments` | PaymentController::store | Sí |
| GET | `/api/attendance` | AttendanceController::index | Sí |
| POST | `/api/attendance` | AttendanceController::store | Sí |
| GET | `/api/weekly-goals` | WeeklyGoalController::index | Sí |
| POST | `/api/weekly-goals` | WeeklyGoalController::store | Sí |
| GET | `/api/dashboard/owner` | DashboardController::ownerDashboard | Sí |
| GET | `/api/dashboard/trainer` | DashboardController::trainerDashboard | Sí |
| GET | `/api/settings` | SettingsController::index | Sí |
| PUT | `/api/settings` | SettingsController::update | Sí |
| GET | `/api/staff` | StaffController::index | Sí |
| POST | `/api/staff` | StaffController::store | Sí |
| PUT | `/api/staff/:id` | StaffController::update | Sí |
| DELETE | `/api/staff/:id` | StaffController::destroy | Sí |
| GET | `/api/notifications` | NotificationController::myNotifications | Sí |
| GET | `/api/notifications/unread-count` | NotificationController::unreadCount | Sí |
| POST | `/api/notifications` | NotificationController::store | Sí |
| POST | `/api/notifications/bulk` | NotificationController::sendBulk | Sí |
| PUT | `/api/notifications/:id/read` | NotificationController::markRead | Sí |
| PUT | `/api/notifications/read-all` | NotificationController::markAllRead | Sí |
| GET | `/api/notifications/admin` | NotificationController::adminIndex | Sí |
| POST | `/api/complaints` | ComplaintController::store | Sí |
| GET | `/api/complaints` | ComplaintController::index | Sí |
| PUT | `/api/complaints/:id` | ComplaintController::update | Sí |
| GET | `/api/my-complaints` | ComplaintController::myComplaints | Sí |

---

## 4. Portal /entrenador

### 4.1 Dashboard (`/entrenador`)
✅ KPI cards: total asignados, activos, por vencer, vencidos  
✅ Tabla de clientes con estado de membresía y plan asignado  
✅ Datos en tiempo real desde `GET /api/dashboard/trainer`

### 4.2 Mis Clientes (`/entrenador/clientes`)
✅ Listado en cards con foto, nombre, DNI, estado de membresía  
✅ Crear cliente con datos completos (nombre, DNI, birthdate, datos físicos, condiciones médicas)  
✅ Editar cliente existente  
✅ Asignación de plan inicial al crear  
✅ Búsqueda y filtro por estado  
✅ Toggle activo/inactivo con ConfirmModal (reemplazó toggle directo sin confirmación)  
✅ Re-activar cliente con membresía expirada → auto-renueva membresía + crea pago pendiente (lógica en backend)  
✅ Clientes inactivos visible en lista con opacidad reducida (backend ya no filtra por `active=1`)  
⚠️ Foto de cliente: se envía al backend pero el almacenamiento de imágenes no está verificado en producción

### 4.3 Detalle de Cliente (`/entrenador/clientes/:id`)
✅ Perfil completo con datos personales y físicos  
✅ Asignar plan de entrenamiento  
✅ Registrar membresía + pago simultáneamente  
✅ Registro de asistencia manual  
✅ Seguimiento de metas semanales con contador de racha  
✅ Enviar notificación push al cliente  
✅ Enviar recordatorio de pago con ConfirmModal (reemplazó envío directo sin confirmación)  

### 4.4 Biblioteca de Ejercicios (`/entrenador/ejercicios`)
✅ Listado por grupo muscular (tabs categorizados)  
✅ Crear / editar ejercicios  
✅ URL de video YouTube  
✅ Tipo de medición (reps / tiempo)  
✅ Archivar (soft-delete)  
✅ ConfirmModal al archivar ejercicio (reemplazó `confirm()` nativo del browser)  

### 4.5 Planes de Entrenamiento (`/entrenador/planes`)
✅ Listado con estado (activo/borrador/archivado)  
✅ Conteo de clientes asignados  
✅ Eliminar plan  
✅ ConfirmModal ya existía al eliminar plan (validado en código)

### 4.6 Constructor de Plan (`/entrenador/planes/crear`, `/entrenador/planes/:id/editar`)
✅ Paso 1: configuración (nombre, descripción, estado)  
✅ Paso 2: armado de días con ejercicios (sets, reps, peso, duración, descanso)  
✅ Reordenar ejercicios por día  
✅ Biblioteca lateral en desktop / modal en mobile  
✅ Eliminar días y ejercicios individuales  

### 4.7 Monitor de Caja (`/entrenador/caja`)
✅ KPIs: total acumulado, ingresos este mes (con % vs mes anterior), operaciones, promedio por pago  
✅ Gráfico de barras: ingresos últimos 14 días  
✅ Gráfico donut: distribución por método de pago  
✅ Top 5 clientes por facturación  
✅ Modal de registro de pago con selector visual de método (efectivo, tarjeta, transferencia, MP)  
✅ Filtro por mes y búsqueda por nombre de cliente  
✅ Montos correctamente parseados con `parseFloat()` (fix de NaN aplicado)  

---

## 5. Portal /usuario

### 5.1 Dashboard Cliente (`/usuario`)
✅ Botón de check-in (registra asistencia)  
✅ Panel de notificaciones con badge de no leídas  
✅ Tarjeta de membresía con días restantes y alerta de vencimiento  
✅ Plan de entrenamiento activo con selector de día  
✅ Tarjetas de ejercicio con sets/reps/peso/duración  
✅ Formulario de feedback/queja anónimo  
✅ Login via DNI (sin contraseña)  

---

## 6. Portal /admin

### 6.1 Dashboard Admin (`/admin`)
✅ KPIs: socios activos, ingresos mes, altas mes, por vencer, sin membresía  
✅ Gráfico de barras: ingresos mensuales (12 meses)  
✅ Gráfico de línea: asistencia por día  
✅ Gráfico donut: distribución de planes activos  
✅ Tabla de próximos vencimientos (7 días)  
✅ Envío masivo de recordatorios a socios por vencer (con ConfirmModal)  
✅ Polling en tiempo real cada 30s con Page Visibility API (pausa cuando tab inactivo)  
✅ Timestamp "Última actualización" en header  

### 6.2 Gestión de Entrenadores (`/admin/trainers`)
✅ CRUD completo de staff (entrenadores y admins)  
✅ Foto de perfil  
✅ Toggle de estado activo/inactivo con ConfirmModal (reemplazó toggle directo sin confirmación)  
✅ Reset de contraseña  
✅ Soft-delete (previene auto-eliminación)  

### 6.3 Gestión de Clientes (`/admin/clients`)
✅ Vista tabla y cards  
✅ Modal de detalle con info personal, asistencia, metas semanales  
✅ Búsqueda y filtro por estado  
✅ Toggle de estado activo  
✅ Nombre del entrenador asignado (resuelto en frontend con lookup map desde `GET /api/staff`)  

### 6.4 Planes de Membresía (`/admin/plans`)
✅ CRUD de planes (nombre, precio, duración en días, descripción)  
✅ Toggle activo/inactivo  
✅ Grid de cards  

### 6.5 Caja Admin (`/admin/payments`)
✅ Registro de pagos con descuento  
✅ Filtro por entrenador, mes, búsqueda  
✅ Gráficos: desglose diario, pie por método, barra mensual  
✅ Exportar CSV (con BOM UTF-8, nombre archivo con fecha)  

### 6.6 Configuración del Gimnasio (`/admin/settings`)
✅ Datos del gimnasio (nombre, dirección, teléfono, redes sociales)  
✅ Logo  
✅ Toggles de métodos de pago habilitados  
✅ Umbral de días para alertas de vencimiento (slider)  

### 6.7 Quejas y Sugerencias (`/admin/complaints`)
✅ Lista de quejas anónimas con estado (pendiente/revisado/resuelto)  
✅ Notas internas del admin  
✅ Cambio de estado con ConfirmModal (reemplazó acción directa sin confirmación)  
✅ Polling en tiempo real cada 15s con Page Visibility API  
✅ Toast informativo cuando llegan nuevas quejas mientras la página está abierta  
✅ Backend notifica al owner via tabla `notifications` cuando se recibe una queja nueva  

---

## 7. API — Endpoints Implementados

> Ver sección 3 para la tabla completa de endpoints.

### Estado por módulo

| Módulo | Estado | Notas |
|--------|--------|-------|
| Auth (3 portales) | ✅ | JWT 24h, mapeo employee→trainer |
| Clientes CRUD | ✅ | Validación de email duplicado (409) |
| Ejercicios CRUD | ✅ | Ownership check por trainer_id |
| Planes de entrenamiento | ✅ | Incluye días, ejercicios, reordenamiento, asignación |
| Portal cliente (mi plan, mi membresía) | ✅ | Endpoints `my-plan` y `my-membership` |
| Membresías CRUD | ✅ | Tabla `memberships_plans` |
| Pagos | ✅ | membership_id opcional (LEFT JOIN) |
| Asistencia | ✅ | Registro y listado |
| Metas semanales | ✅ | Upsert por cliente |
| Dashboard owner | ✅ | KPIs + charts (income, attendance, plans, expirations) |
| Dashboard trainer | ✅ | Resumen de clientes asignados |
| Configuración | ✅ | Key-value con upsert |
| Staff CRUD | ✅ | Protegido solo para owner |
| Notificaciones | ✅ | Individual, bulk, mark read, unread count |
| Quejas | ✅ | Anónimas para cliente, gestión para owner |

---

## 8. Base de Datos

### Tablas principales

| Tabla | Descripción |
|-------|-------------|
| `users` | Todos los roles: `owner`, `employee` (trainer), `client`. Campos: id, name, lastname, email, password_hash, role, dni, phone, trainer_id, goal, weight_kg, height_cm, medical_conditions, emergency_contact, address, photo_url, active |
| `memberships_plans` | Planes disponibles: id, name, description, price, duration_days, active |
| `memberships` | Membresías asignadas: id, client_id, plan_id, start_date, end_date, status |
| `payments` | Pagos: id, client_id, trainer_id, membership_id (nullable), amount, discount, final_amount, payment_method, notes |
| `exercises` | Biblioteca de ejercicios: id, trainer_id, name, muscle_group, measurement_type, description, youtube_url, active |
| `training_plans` | Planes de entrenamiento: id, trainer_id, name, description, status |
| `training_plan_days` | Días de un plan: id, plan_id, label, day_order |
| `training_plan_day_exercises` | Ejercicios por día: id, day_id, exercise_id, sets, reps, weight_kg, duration_sec, rest_sec, sort_order |
| `client_training_plans` | Asignación plan→cliente: id, client_id, plan_id, assigned_at, active |
| `attendance` | Registros de asistencia: id, client_id, trainer_id, check_in_time |
| `weekly_goals` | Metas semanales: id, client_id, trainer_id, week_start, goal_days, completed_days |
| `notifications` | Notificaciones: id, recipient_id, sender_id, title, message, type, is_read, created_at |
| `complaints` | Quejas: id, client_id, subject, message, status, admin_notes, created_at |
| `gym_settings` | Configuración clave-valor: setting_key, setting_value |

### Notas de arquitectura de DB
- ⚠️ **Sin tabla `clients` separada** — todo en `users` con columna `role`
- ✅ Email único en `users` — validado a nivel PHP antes del INSERT (409 si duplicado)
- ✅ Soft-delete generalizado (`active = 0`) en users, exercises, training_plans
- ✅ `final_amount` es `DECIMAL` — frontend usa `parseFloat()` para evitar concatenación string

---

## 9. Integraciones y Funcionalidades Transversales

### Toast System
✅ Implementado en `src/utils/toast.ts` — pub-sub sin Context  
✅ Componente `Toast.tsx` con Portal + Framer Motion, auto-dismiss 4s  
✅ 4 tipos: success (verde), error (rojo), warning (ámbar), info (azul)  
✅ Montado globalmente en `App.tsx`  

### ConfirmModal
✅ Implementado en `src/components/ConfirmModal.tsx`  
✅ Usado en: AdminDashboard, TrainingPlans, ExerciseLibrary, Complaints, MyClients (toggle), ClientDetail (recordatorio), TrainerManagement (toggle)  
✅ Deuda técnica de `confirm()` nativo 100% eliminada  

### Autenticación / Autorización
✅ 3 flujos de login independientes (owner / trainer / client)  
✅ JWT con rol embebido, validado en cada request  
✅ `PrivateRoute` por rol en el frontend  
✅ Refresh implícito: si el token expira, se redirige al login  

### Notificaciones Push (in-app)
✅ Trainer puede notificar clientes individualmente  
✅ Owner puede enviar notificaciones masivas  
✅ Cliente ve notificaciones con badge de no leídas  
✅ Marcar como leída individual o todas  

### Proxy de desarrollo
✅ `vite.config.ts` incluye proxy `/api` → `http://76.13.163.126:8082`  

### Deploy
✅ Frontend: GitHub → Vercel auto-deploy  
✅ Backend: `vps_deploy5.js` sube archivos via SFTP + ejecuta `docker cp` + `docker restart`  
✅ Migraciones: se ejecutan directamente en MySQL del host (no dentro del container)  

---

## 10. Resumen Ejecutivo

| Área | Estado | Detalle |
|------|--------|---------|
| Portal Entrenador | ✅ Funcional | Completo. ConfirmModal en toggle clientes, recordatorio pago, archivar ejercicio |
| Portal Cliente | ✅ Funcional | Check-in, plan, membresía, notificaciones, feedback |
| Portal Admin | ✅ Funcional | Dashboard real-time, CRUD completo, CSV export, quejas con polling |
| API Backend | ✅ Funcional | 50+ endpoints, todos autenticados excepto logins |
| Base de Datos | ✅ Estable | Schema unificado en tabla `users`, migraciones aplicadas |
| Sistema de Toasts | ✅ Completo | Pub-sub sin Context, 4 tipos, animado |
| Deploy | ✅ Automatizado | Vercel (frontend) + script SSH (backend) |
| Gráficos y KPIs | ✅ Funcional | Recharts en admin y caja del entrenador |
| Notificaciones in-app | ✅ Funcional | Individual y masivo |
| Quejas anónimas | ✅ Funcional | Cliente envía, admin gestiona |

### Deuda técnica conocida
| # | Descripción | Severidad | Archivo |
|---|-------------|-----------|---------|
| 1 | Almacenamiento de fotos no verificado en producción | Media | ClientController / StaffController |

### Cambios de esta sesión (2026-04-11)
| Archivo | Cambio |
|---------|--------|
| `ExerciseLibrary.tsx` | `confirm()` → ConfirmModal en archivar ejercicio |
| `Complaints.tsx` | Acción directa → ConfirmModal + polling 15s + Page Visibility API + toast de nuevas quejas |
| `MyClients.tsx` | Toggle directo → ConfirmModal + manejo de `res.renewed` con toast |
| `ClientDetail.tsx` | Recordatorio de pago directo → ConfirmModal |
| `AdminDashboard.tsx` | Fetch único → polling 30s + Page Visibility API + timestamp "última actualización" |
| `TrainerManagement.tsx` | Toggle directo → ConfirmModal |
| `ClientManagement.tsx` | Muestra nombre de entrenador (lookup map desde `GET /api/staff`) en lugar de ID# |
| `PaymentsCaja.tsx` | Agregado botón exportar CSV con BOM UTF-8 |
| `ClientController.php` | `index()`: eliminado filtro `active=1`, todos los clientes visibles; `update()`: auto-renovación de membresía expirada al re-activar cliente |
| `ComplaintController.php` | `store()`: notifica a todos los owners via tabla `notifications` cuando llega nueva queja |

### Versión del sistema
- **Frontend**: `https://gym-xi-one-24.vercel.app`
- **Backend**: `http://76.13.163.126:8082`
- **DB**: MySQL `gym` en host VPS
- **Última migración aplicada**: `migration_v3.sql` (notifications, complaints, campos físicos en users)
