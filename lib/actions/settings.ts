"use server"

import { createClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"
import type { TablesUpdate } from "@/types/database"

async function getUserOrganizationId(supabase: any) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")

  const { data: member } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .single()

  if (!member) throw new Error("No organization found")
  return member.organization_id
}

export async function getGymSettings() {
  const supabase = await createClient()
  const orgId = await getUserOrganizationId(supabase)

  const { data, error } = await supabase
    .from("organizations")
    .select("*")
    .eq("id", orgId)
    .single()

  if (error) throw error
  return data
}

export async function updateGymSettings(id: string, settings: any) {
  const supabase = await createClient()
  // Ensure the user belongs to this org
  const orgId = await getUserOrganizationId(supabase)

  if (orgId !== id) throw new Error("Unauthorized")

  const { data, error } = await supabase
    .from("organizations")
    .update({ ...settings, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single()

  if (error) throw error
  revalidatePath("/dashboard/settings")
  return data
}

export async function getGymSchedule() {
  // TODO: Migrate schedule to multi-tenant or organizations table
  return []
}

export async function updateGymSchedule(id: string, schedule: { open_time: string; close_time: string }) {
  // TODO: Migrate schedule
  console.log("Schedule update not yet implemented for multi-tenant")
}
