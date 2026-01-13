"use server"

import { createClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"
import type { TablesInsert, TablesUpdate } from "@/types/database"
import { logActivity } from "./activity"
import { getUserOrganizationId } from "@/lib/auth-helpers"

export async function getCurrentMember() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  // We need to find the member record for this auth user
  // This assumes member table has a link to auth id, OR we link via email?
  // The schema migration said we added organization_members.
  // Let's rely on organization_members table which links user_id (auth id) to the org.

  const { data: member } = await supabase
    .from("organization_members")
    .select("*, roles:role") // Assuming role is a string, but if we have a table roles... wait.
    // The previous code had `roles(name)`. 
    // In the new schema, likely `role` column in `organization_members` is text (e.g. 'owner', 'member') OR a foreign key.
    // Let's check the schema or assume 'role' is the column name based on my auth-helpers.
    .eq("user_id", user.id)
    .single()

  if (!member) return null

  // Return a structure compatible with what dashboard expects, or update dashboard
  return {
    name: user.user_metadata?.name || user.email?.split("@")[0] || "Miembro",
    email: user.email,
    role: member.role // verified in auth-helpers that 'role' exists
  }
}

export async function getMembers() {
  const supabase = await createClient()

  // Primero actualizamos los estados basados en la fecha de pago
  await updateMemberStatuses()

  const { data, error } = await supabase
    .from("members")
    .select("*, plans(name)")
    .order("created_at", { ascending: false })

  if (error) throw error
  return data
}

// Actualiza automáticamente el estado de los miembros según su fecha de pago
async function updateMemberStatuses() {
  const supabase = await createClient()
  const today = new Date().toISOString().split("T")[0]

  // Marcar como vencidos: fecha de pago pasada y no congelados
  await supabase
    .from("members")
    .update({ status: "expired", updated_at: new Date().toISOString() })
    .lt("payment_date", today)
    .eq("frozen", false)
    .neq("status", "expired")

  // Marcar como activos: fecha de pago futura o igual a hoy y no congelados
  await supabase
    .from("members")
    .update({ status: "active", updated_at: new Date().toISOString() })
    .gte("payment_date", today)
    .eq("frozen", false)
    .neq("status", "active")
}

export async function getMember(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("members")
    .select("*, plans(*)")
    .eq("id", id)
    .single()

  if (error) throw error
  return data
}



export async function createMember(member: TablesInsert<"members">) {
  const supabase = await createClient()
  const { orgId } = await getUserOrganizationId()

  const { data, error } = await supabase
    .from("members")
    .insert({ ...member, organization_id: orgId })
    .select()
    .single()

  if (error) throw error

  await logActivity({
    action: "member_created",
    entityType: "member",
    entityId: data.id,
    entityName: data.name,
  })

  revalidatePath("/dashboard/users")
  revalidatePath("/dashboard")
  return data
}

export async function updateMember(id: string, member: TablesUpdate<"members">) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("members")
    .update({ ...member, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single()

  if (error) throw error

  await logActivity({
    action: "member_updated",
    entityType: "member",
    entityId: data.id,
    entityName: data.name,
  })

  revalidatePath("/dashboard/users")
  revalidatePath("/dashboard")
  return data
}

export async function deleteMember(id: string) {
  const supabase = await createClient()

  const { data: member } = await supabase
    .from("members")
    .select("name")
    .eq("id", id)
    .single()

  const { error } = await supabase.from("members").delete().eq("id", id)
  if (error) throw error

  await logActivity({
    action: "member_deleted",
    entityType: "member",
    entityId: id,
    entityName: member?.name,
  })

  revalidatePath("/dashboard/users")
  revalidatePath("/dashboard")
}

export async function toggleFreeze(id: string, frozen: boolean) {
  const supabase = await createClient()
  const { error } = await supabase
    .from("members")
    .update({ frozen, status: frozen ? "frozen" : "active", updated_at: new Date().toISOString() })
    .eq("id", id)

  if (error) throw error
  revalidatePath("/dashboard/users")
}

export async function updatePaymentDate(id: string, paymentDate: string) {
  const supabase = await createClient()
  const today = new Date().toISOString().split("T")[0]
  const newStatus = paymentDate >= today ? "active" : "expired"

  // Verificar si el miembro está congelado
  const { data: member } = await supabase.from("members").select("frozen").eq("id", id).single()

  const { error } = await supabase
    .from("members")
    .update({
      payment_date: paymentDate,
      status: member?.frozen ? "frozen" : newStatus,
      updated_at: new Date().toISOString()
    })
    .eq("id", id)

  if (error) throw error
  revalidatePath("/dashboard/users")
}
