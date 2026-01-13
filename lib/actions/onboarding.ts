"use server"

import { createClient, createAdminClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"

import { allPermissions, permissionGroups } from "@/lib/config/permissions"

// ... imports

export async function createOrganization(formData: FormData) {
    const supabase = await createClient()

    // 1. Validate Auth
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
        return { error: "No estás autenticado" }
    }

    const name = formData.get("name") as string
    const slug = formData.get("slug") as string

    if (!name || !slug) {
        return { error: "El nombre y el identificador son requeridos" }
    }

    // 2. Insert Organization (Use Admin Client to bypass RLS check on SELECT)
    const adminSupabase = await createAdminClient()

    const { data: org, error: orgError } = await adminSupabase
        .from("organizations")
        .insert({
            name,
            slug,
            email: user.email, // Default to user email
        })
        .select()
        .single()

    if (orgError) {
        console.error("Error creating org:", orgError)
        if (orgError.code === "23505") { // Unique violation for slug
            return { error: "Este identificador ya está en uso. Por favor elige otro." }
        }
        return { error: "Error al crear la organización" }
    }

    // 3. Create Default Roles
    const adminPermissions = allPermissions.map(p => p.id)
    const basicPermissions = allPermissions
        .filter(p => p.id.includes("view") || p.id.startsWith("dashboard"))
        .map(p => p.id)

    // Create Admin Role
    const { data: adminRole, error: adminRoleError } = await adminSupabase
        .from("roles")
        .insert({
            organization_id: org.id,
            name: "Admin",
            description: "Acceso total al sistema",
            permissions: adminPermissions
        })
        .select()
        .single()

    // Create Basic Role
    await adminSupabase
        .from("roles")
        .insert({
            organization_id: org.id,
            name: "Basico",
            description: "Acceso de lectura y limitado",
            permissions: basicPermissions
        })

    if (adminRoleError) {
        console.error("Error creating default roles:", adminRoleError)
        // Should we fail? Maybe just proceed with owner role as fallback?
        // But the UI expects roles. Let's assume critical failure if roles fail.
        await adminSupabase.from("organizations").delete().eq("id", org.id)
        return { error: "Error al configurar los roles iniciales" }
    }

    // 4. Insert Member (Owner) as Admin in BOTH tables
    // Insert into organization_members
    const { error: memberError } = await adminSupabase
        .from("organization_members")
        .insert({
            organization_id: org.id,
            user_id: user.id,
            role: "Admin"
        })

    if (memberError) {
        console.error("Error creating member:", memberError)
        await adminSupabase.from("organizations").delete().eq("id", org.id)
        return { error: "Error al asignar el usuario a la organización" }
    }

    // Insert into admins (for UI compatibility)
    // We need the ID of the 'Admin' role we just created
    if (adminRole) {
        await adminSupabase
            .from("admins")
            .insert({
                organization_id: org.id,
                auth_user_id: user.id,
                name: user.user_metadata?.name || user.email?.split("@")[0] || "Admin",
                email: user.email,
                role_id: adminRole.id,
                status: 'active'
            })
    }

    // 5. Redirect to Dashboard
    redirect("/dashboard")
}
