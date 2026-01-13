
import { createClient, createAdminClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function FixMembershipPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return <div>No estás logueado. <Link href="/login">Ir al login</Link></div>
    }

    const adminSupabase = await createAdminClient()

    // 1. Find Organization by User Email
    const { data: orgs } = await adminSupabase
        .from("organizations")
        .select("*")
        .eq("email", user.email)

    const org = orgs?.[0]

    if (!org) {
        return (
            <div className="p-10">
                <h1 className="text-2xl font-bold mb-4">No se encontró organización</h1>
                <p>No hay ninguna organización asociada a tu correo ({user.email}).</p>
                <Button asChild className="mt-4"><Link href="/create-organization">Crear Organización</Link></Button>
            </div>
        )
    }

    // 2. Fix Membership
    // Check if exists
    const { data: membership } = await adminSupabase
        .from("organization_members")
        .select("*")
        .eq("organization_id", org.id)
        .eq("user_id", user.id)
        .single()

    let statusMessage = "Membresía ya existía."

    if (!membership) {
        const { error: insertError } = await adminSupabase
            .from("organization_members")
            .insert({
                organization_id: org.id,
                user_id: user.id,
                role: "Admin"
            })

        if (insertError) {
            statusMessage = `Error creando membresía: ${insertError.message}`
        } else {
            statusMessage = "Membresía creada exitosamente."
        }
    }

    // 3. Fix Admin Record
    const { data: adminRecord } = await adminSupabase
        .from("admins")
        .select("*")
        .eq("organization_id", org.id)
        .eq("auth_user_id", user.id)
        .single()

    let adminStatus = "Registro de admin ya existía."

    if (!adminRecord) {
        // Find Admin Role ID
        const { data: role } = await adminSupabase
            .from("roles")
            .select("id")
            .eq("organization_id", org.id)
            .eq("name", "Admin")
            .single()

        if (role) {
            const { error: adminError } = await adminSupabase
                .from("admins")
                .insert({
                    organization_id: org.id,
                    auth_user_id: user.id,
                    name: user.user_metadata?.name || user.email?.split("@")[0] || "Admin",
                    email: user.email,
                    role_id: role.id,
                    status: 'active'
                })
            if (adminError) adminStatus = `Error creando admin: ${adminError.message}`
            else adminStatus = "Registro de admin creado."
        } else {
            adminStatus = "No se encontró el rol 'Admin' para asignar."
        }
    }

    return (
        <div className="p-10 max-w-2xl mx-auto space-y-6">
            <h1 className="text-2xl font-bold">Reparación de Cuenta</h1>
            <div className="p-4 border rounded bg-slate-50 dark:bg-slate-900">
                <p><strong>Organización encontrada:</strong> {org.name} ({org.slug})</p>
                <p><strong>ID Organización:</strong> {org.id}</p>
                <div className="my-2 h-px bg-slate-200 dark:bg-slate-800" />
                <p><strong>Estado Membresía:</strong> {statusMessage}</p>
                <p><strong>Estado Admin:</strong> {adminStatus}</p>
            </div>

            <div className="flex gap-4">
                <Button asChild>
                    <Link href="/dashboard">Ir al Dashboard</Link>
                </Button>
            </div>
        </div>
    )
}
