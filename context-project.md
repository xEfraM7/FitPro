# FitPro - Contexto del Proyecto

> **Objetivo**: Este archivo contiene todo el contexto necesario para trabajar en el proyecto sin necesidad de re-analizar la estructura cada vez.

---

## 🎯 Resumen del Proyecto

**FitPro** es un sistema SaaS de gestión de gimnasios desarrollado con Next.js 16 y Supabase. Permite administrar membresías, pagos, clases especiales y control financiero con soporte multi-moneda (Bolívares, USD y USDT). **Soporta multi-tenancy**, permitiendo que múltiples organizaciones (gimnasios) operen de forma aislada en la misma plataforma.

---

## 🛠️ Stack Tecnológico

| Tecnología | Versión | Uso |
|------------|---------|-----|
| Next.js | 16 | Framework React con App Router y Server Actions |
| React | 19 | Biblioteca de UI |
| Supabase | 2.86+ | PostgreSQL, autenticación, RLS y storage |
| TailwindCSS | 4 | Framework de estilos (con tema oscuro amarillo/negro) |
| React Query | 5.90+ | Gestión de estado del servidor y caché |
| Shadcn/ui | - | Componentes de interfaz accesibles |
| React Hook Form | 7.68+ | Manejo de formularios |
| Zod | 3.25+ | Validación de esquemas |
| Lucide React | 0.454+ | Iconografía |
| SweetAlert2 | - | Notificaciones toast y alertas |

---

## 📁 Estructura del Proyecto

```
fitpro/
├── app/                              # App Router de Next.js
│   ├── layout.tsx                   # Layout principal
│   ├── page.tsx                     # Página raíz (redirige a /dashboard)
│   ├── globals.css                  # Estilos globales con tema amarillo/negro
│   ├── create-organization/         # ⭐ Onboarding para nuevas orgs
│   ├── fix-membership/              # ⭐ Página de reparación de membresía
│   ├── dashboard/                   # Panel de administración
│   │   ├── page.tsx                # Dashboard principal
│   │   ├── users/                  # Gestión de miembros
│   │   ├── plans/                  # Planes de membresía
│   │   ├── payments/               # Gestión de pagos
│   │   ├── classes/                # Clases especiales
│   │   ├── closings/               # Cierres mensuales
│   │   ├── roles/                  # Roles y permisos
│   │   └── settings/               # Configuración
│   ├── login/                       # Inicio de sesión
│   ├── forgot-password/            # Recuperación de contraseña
│   ├── reset-password/             # Restablecimiento de contraseña
│   └── auth/confirm/               # Confirmación de autenticación
│
├── components/
│   ├── section-components/          # Componentes por sección
│   │   ├── create-organization/    # ⭐ Formulario de onboarding
│   │   ├── dashboard/              # Componentes del dashboard
│   │   ├── users/                  # Componentes de usuarios
│   │   ├── plans/                  # Componentes de planes
│   │   ├── payments/               # Componentes de pagos
│   │   ├── classes/                # Componentes de clases
│   │   ├── closings/               # Componentes de cierres
│   │   ├── roles/                  # Componentes de roles
│   │   ├── settings/               # Componentes de configuración
│   │   ├── login/                  # Componentes de login
│   │   ├── forgot-password/        # Componentes de recuperación
│   │   └── reset-password/         # Componentes de reset
│   ├── shared/                      # Componentes compartidos
│   │   ├── dashboard-layout.tsx    # Layout del dashboard con sidebar
│   │   ├── activity-log-modal.tsx  # Modal de actividad reciente
│   │   ├── exchange-rate-modal.tsx # Modal de tasas de cambio
│   │   └── payment-detail-modal.tsx# Modal de detalle de pago
│   ├── ui/                          # Componentes base (shadcn/ui)
│   └── providers/                   # Providers de React (QueryClient)
│
├── lib/
│   ├── actions/                     # Server Actions (lógica de negocio)
│   │   ├── activity.ts             # Registro de actividad
│   │   ├── auth.ts                 # Autenticación
│   │   ├── binance.ts              # Integración con Binance
│   │   ├── classes.ts              # Clases especiales
│   │   ├── closings.ts             # Cierres mensuales
│   │   ├── dashboard.ts            # Estadísticas del dashboard
│   │   ├── email.ts                # Envío de emails
│   │   ├── funds.ts                # Gestión de fondos
│   │   ├── members.ts              # Gestión de miembros
│   │   ├── onboarding.ts           # ⭐ Creación de organizaciones
│   │   ├── payments.ts             # Gestión de pagos
│   │   ├── plans.ts                # Planes de membresía
│   │   ├── renewal-notifications.ts# Notificaciones de renovación
│   │   ├── roles.ts                # Roles y permisos
│   │   └── settings.ts             # Configuración
│   ├── auth-helpers.ts              # ⭐ Helper para obtener org del usuario
│   ├── config/
│   │   └── permissions.ts          # ⭐ Definición centralizada de permisos
│   ├── hooks/
│   │   └── use-permissions.ts      # Hook de permisos con React Query
│   ├── sweetalert.ts               # Wrapper de SweetAlert2
│   └── utils.ts                    # Utilidades (cn, formatters)
│
├── types/
│   └── database.ts                  # Tipos TypeScript para Supabase
│
├── utils/supabase/                  # Configuración de Supabase
│   ├── client.ts                   # Cliente del navegador
│   ├── middleware.ts               # Helpers para middleware
│   └── server.ts                   # Cliente del servidor + Admin Client
│
└── middleware.ts                    # Middleware de autenticación y org check
```

---

## 🏢 Multi-Tenancy (Arquitectura SaaS)

### Concepto

Cada **Organización** (gimnasio) tiene sus propios datos aislados. Los usuarios pueden pertenecer a una o más organizaciones.

### Tablas Clave

| Tabla | Descripción |
|-------|-------------|
| `organizations` | Organizaciones/Gimnasios registrados |
| `organization_members` | Relación usuario ↔ organización con rol |

### Flujo de Onboarding

1. Usuario se registra/loguea
2. Middleware verifica si tiene organización
3. Si no tiene → redirige a `/create-organization`
4. Al crear org → se crean roles "Admin" y "Basico" automáticamente
5. Usuario queda asignado como "Admin"

### Helper de Organización

```typescript
// lib/auth-helpers.ts
import { getUserOrganizationId } from "@/lib/auth-helpers"

const { organizationId, role } = await getUserOrganizationId()
```

---

## 🗄️ Modelo de Datos (Supabase)

### Tablas Principales

| Tabla | Descripción | Campos Clave |
|-------|-------------|--------------|
| `organizations` | Gimnasios/Orgs | id, name, slug, email, phone, address |
| `organization_members` | Membresía de usuarios | id, organization_id, user_id, role |
| `admins` | Administradores (UI) | id, email, name, role_id, auth_user_id, organization_id |
| `members` | Clientes del gimnasio | id, name, email, phone, plan_id, status, organization_id |
| `plans` | Planes de membresía | id, name, price, duration, organization_id |
| `payments` | Pagos de membresías | id, member_id, plan_id, amount, method, organization_id |
| `special_classes` | Clases especiales | id, name, instructor, price, organization_id |
| `special_class_payments` | Pagos de clases | id, class_id, member_id, amount, organization_id |
| `roles` | Roles con permisos | id, name, permissions[], organization_id |
| `funds` | Fondos por moneda | id, type, amount, organization_id |
| `exchange_rates` | Tasas de cambio | id, type, rate, organization_id |
| `monthly_closings` | Cierres mensuales | id, period, revenues, organization_id |
| `activity_log` | Registro de actividad | id, action, entity_type, organization_id |

### Relaciones con Cascade Delete

```
organizations (CASCADE) → admins, roles, members, plans, payments, 
                          special_classes, special_class_payments,
                          funds, exchange_rates, monthly_closings,
                          activity_log, gym_schedule, organization_members

members (CASCADE) → payments, special_class_payments
```

### RLS (Row Level Security)

Todas las tablas tienen RLS habilitado. La función `get_user_organization_ids()` se usa para filtrar datos por organización del usuario autenticado.

---

## 💱 Sistema de Pagos y Monedas

### Métodos de Pago

| Método | Moneda | Fondo Destino |
|--------|--------|---------------|
| Pago Móvil | Bolívares | BS |
| Efectivo Bs | Bolívares | BS |
| Transferencia BS | Bolívares | BS |
| Efectivo USD | Dólares | USD_CASH |
| USDT | Cripto | USDT |
| Transferencia USDT | Cripto | USDT |

### Tasas de Cambio

- **BCV**: Tasa oficial del Banco Central de Venezuela
- **USDT**: Tasa del mercado cripto
- **Personalizada**: Tasa definida por el usuario

---

## 🔐 Sistema de Permisos

### Permisos Disponibles (lib/config/permissions.ts)

```typescript
// Grupos de permisos
const permissionGroups = {
  dashboard: ['dashboard.view'],
  users: ['users.view', 'users.edit', 'users.delete'],
  plans: ['plans.view', 'plans.edit', 'plans.delete'],
  payments: ['payments.view', 'payments.edit', 'payments.delete'],
  classes: ['classes.view', 'classes.edit', 'classes.delete'],
  roles: ['roles.view', 'roles.edit', 'roles.create', 'roles.delete'],
  settings: ['settings.view', 'settings.edit'],
  closings: ['closings.view', 'closings.edit', 'closings.delete']
}
```

### Roles por Defecto

| Rol | Permisos |
|-----|----------|
| Admin | Todos los permisos |
| Basico | Solo permisos `.view` + dashboard |

### Hook de Permisos

```typescript
import { usePermissions } from "@/lib/hooks/use-permissions"

const { hasPermission, hasAnyPermission, isAdmin, isLoading } = usePermissions()

if (hasPermission('users.edit')) {
  // Mostrar botón de editar
}
```

---

## 🎨 Sistema de Diseño

### Tema

- **Modo**: Oscuro por defecto
- **Colores primarios**: Amarillo/Dorado (`oklch(0.7 0.2 95)`)
- **Fondo**: Negro/Gris oscuro (`oklch(0.1 0 0)`)

### Paleta de Colores por Tipo

| Color | Uso |
|-------|-----|
| 🔵 Azul | Miembros, Bolívares |
| 🟢 Verde | Ingresos, USD |
| 🟠 Naranja | USDT, Cripto |
| 🟣 Púrpura | Planes, Roles |
| 🟡 Amarillo | Primario, CTAs |

---

## 🔄 Patrones de Desarrollo

### Server Actions con Multi-Tenancy

```typescript
// lib/actions/*.ts
"use server"

import { createClient } from "@/utils/supabase/server"
import { getUserOrganizationId } from "@/lib/auth-helpers"

export async function createMember(data: MemberData) {
  const supabase = await createClient()
  const { organizationId } = await getUserOrganizationId()
  
  const { error } = await supabase.from('members').insert({
    ...data,
    organization_id: organizationId // ⭐ Siempre inyectar
  })
}
```

### Admin Client (Service Role)

```typescript
import { createAdminClient } from "@/utils/supabase/server"

// Usado para operaciones que requieren bypass de RLS
const adminSupabase = await createAdminClient()
```

---

## 🌐 Variables de Entorno

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key

# App
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Email
GMAIL_USER=tu_email@gmail.com
GMAIL_APP_PASSWORD=xxxx_xxxx_xxxx_xxxx
```

---

## 📜 Scripts Disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo en puerto 3000 |
| `npm run build` | Build de producción |
| `npm run start` | Iniciar servidor de producción |
| `npm run lint` | Ejecutar ESLint |

---

## 🔀 Rutas de la Aplicación

### Públicas

- `/login` - Inicio de sesión
- `/forgot-password` - Recuperar contraseña
- `/reset-password` - Restablecer contraseña
- `/auth/confirm` - Confirmación de email

### Onboarding

- `/create-organization` - Crear nueva organización
- `/fix-membership` - Reparar membresía (debug)

### Protegidas (requieren autenticación + organización)

- `/dashboard` - Dashboard principal
- `/dashboard/users` - Gestión de miembros
- `/dashboard/plans` - Planes de membresía
- `/dashboard/payments` - Gestión de pagos
- `/dashboard/classes` - Clases especiales
- `/dashboard/closings` - Cierres mensuales
- `/dashboard/roles` - Roles y permisos
- `/dashboard/settings` - Configuración

---

## ⚡ Actualizaciones en Tiempo Real

- Dashboard: cada 30 segundos
- Actividad reciente: cada 10 segundos
- Tasas de cambio: editables desde el header

---

## 📝 Notas Importantes

1. **Multi-Tenancy**: Todas las tablas tienen `organization_id` y RLS activo
2. **Cascade Delete**: Eliminar organización/miembro elimina datos relacionados
3. **Middleware**: Verifica autenticación Y pertenencia a organización
4. **Service Role**: Usado en middleware y onboarding para bypass de RLS
5. **Estados de Miembros**: `activo`, `vencido`, `congelado`
6. **Cierres Mensuales**: Consolidan toda la información financiera del mes

---

## ⚠️ Tablas Deprecadas

| Tabla | Estado | Reemplazo |
|-------|--------|-----------|
| `gym_settings` | Deprecada | `organizations` |

---

*Última actualización: Enero 2026*
*Proyecto privado - FitPro © 2024*
