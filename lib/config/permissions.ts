
export const permissionGroups = [
    {
        id: "users",
        label: "Usuarios",
        permissions: [
            { id: "users.view", label: "Ver usuarios", description: "Ver lista de clientes" },
            { id: "users.create", label: "Crear usuarios", description: "Registrar nuevos clientes" },
            { id: "users.edit", label: "Editar usuarios", description: "Modificar información de clientes" },
            { id: "users.delete", label: "Eliminar usuarios", description: "Eliminar clientes del sistema" },
        ]
    },
    {
        id: "payments",
        label: "Pagos",
        permissions: [
            { id: "payments.view", label: "Ver pagos", description: "Ver historial de pagos" },
            { id: "payments.create", label: "Registrar pagos", description: "Crear nuevos pagos" },
            { id: "payments.edit", label: "Editar pagos", description: "Modificar pagos existentes" },
            { id: "payments.delete", label: "Eliminar pagos", description: "Eliminar registros de pagos" },
        ]
    },
    {
        id: "plans",
        label: "Planes",
        permissions: [
            { id: "plans.view", label: "Ver planes", description: "Ver planes disponibles" },
            { id: "plans.create", label: "Crear planes", description: "Crear nuevos planes" },
            { id: "plans.edit", label: "Editar planes", description: "Modificar planes existentes" },
            { id: "plans.delete", label: "Eliminar planes", description: "Eliminar planes" },
        ]
    },
    {
        id: "classes",
        label: "Clases Especiales",
        permissions: [
            { id: "classes.view", label: "Ver clases", description: "Ver clases programadas" },
            { id: "classes.create", label: "Crear clases", description: "Programar nuevas clases" },
            { id: "classes.edit", label: "Editar clases", description: "Modificar clases existentes" },
            { id: "classes.delete", label: "Eliminar clases", description: "Eliminar clases" },
        ]
    },
    {
        id: "closings",
        label: "Cierres Mensuales",
        permissions: [
            { id: "closings.view", label: "Ver cierres", description: "Ver historial de cierres mensuales" },
            { id: "closings.edit", label: "Realizar cierres", description: "Ejecutar cierre de mes" },
        ]
    },
    {
        id: "roles",
        label: "Roles y Administradores",
        permissions: [
            { id: "roles.view", label: "Ver roles", description: "Ver roles y administradores" },
            { id: "roles.create", label: "Crear roles", description: "Crear nuevos roles" },
            { id: "roles.edit", label: "Editar roles", description: "Modificar roles y permisos" },
            { id: "roles.delete", label: "Eliminar roles", description: "Eliminar roles" },
        ]
    },
    {
        id: "settings",
        label: "Configuración",
        permissions: [
            { id: "settings.view", label: "Ver configuración", description: "Ver configuración del gimnasio" },
            { id: "settings.edit", label: "Editar configuración", description: "Modificar configuración del sistema" },
        ]
    },
    {
        id: "dashboard",
        label: "Dashboard",
        permissions: [
            { id: "dashboard.view", label: "Ver dashboard", description: "Acceso al panel principal" },
            { id: "dashboard.reports", label: "Ver reportes", description: "Acceso a estadísticas y reportes" },
        ]
    },
]

// Flat list for backward compatibility and ease of use
export const allPermissions = permissionGroups.flatMap(group => group.permissions)
