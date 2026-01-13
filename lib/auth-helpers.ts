import { createClient } from "@/utils/supabase/server"

export async function getUserOrganizationId() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Not authenticated")

    const { data: member } = await supabase
        .from("organization_members")
        .select("organization_id, role")
        .eq("user_id", user.id)
        .single()

    if (!member) throw new Error("No organization found")
    return { orgId: member.organization_id, role: member.role }
}
